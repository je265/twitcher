import os, time, json, subprocess, shlex, requests, tempfile
from datetime import datetime, timezone
from urllib.parse import urljoin
import boto3
from botocore.exceptions import ClientError

API_BASE = os.environ["API_BASE"].strip().rstrip('/') + '/'  # remove whitespace and ensure trailing slash
API_TOKEN = os.environ["WORKER_TOKEN"]        # simple bearer
S3_BASE  = os.environ.get("S3_BASE")          # presigned URLs assumed
WORKER_ID = os.environ.get("WORKER_ID", "py-1")

# S3 configuration
S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "http://localhost:9000")
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY")
S3_BUCKET = os.environ.get("S3_BUCKET", "twitcher")

POLL_INTERVAL = 3

# Initialize S3 client
s3_client = None
if S3_ACCESS_KEY and S3_SECRET_KEY:
    s3_client = boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name='us-east-1'  # Default region
    )

def download_from_s3(s3_key, local_path):
    """Download file from S3 to local path"""
    if not s3_client:
        raise Exception("S3 client not initialized")
    
    try:
        s3_client.download_file(S3_BUCKET, s3_key, local_path)
        return True
    except ClientError as e:
        print(f"Error downloading from S3: {e}")
        return False

def upload_to_s3(local_path, s3_key, content_type="video/mp4"):
    """Upload file from local path to S3"""
    if not s3_client:
        raise Exception("S3 client not initialized")
    
    try:
        s3_client.upload_file(
            local_path, 
            S3_BUCKET, 
            s3_key,
            ExtraArgs={'ContentType': content_type}
        )
        return True
    except ClientError as e:
        print(f"Error uploading to S3: {e}")
        return False

def get_job():
    # Minimal polling endpoint you'd expose in Next.js to fetch the next job for this worker.
    url = urljoin(API_BASE, "/api/worker/next")
    r = requests.get(url, headers={"Authorization": f"Bearer {API_TOKEN}"}, timeout=30)
    if r.status_code == 204:
        return None
    r.raise_for_status()
    return r.json()

def callback(payload):
    requests.post(urljoin(API_BASE, "/api/worker/callback"),
                  headers={"Authorization": f"Bearer {API_TOKEN}", "Content-Type": "application/json"},
                  data=json.dumps(payload), timeout=30)

def process_video(input_url, output_path, max_height=720):
    """
    Process video to downgrade quality to 720p maximum
    """
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "warning",
        "-i", input_url,
        # Video encoding with quality constraints
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",  # Good balance between speed and quality
        "-crf", "23",  # Constant Rate Factor for consistent quality
        "-vf", f"scale=-2:{max_height}",  # Scale to max height, maintain aspect ratio
        "-c:a", "aac",
        "-b:a", "128k",  # Audio bitrate
        "-movflags", "+faststart",  # Optimize for web playback
        "-y",  # Overwrite output file
        output_path
    ]
    
    return subprocess.run(cmd, capture_output=True, text=True)

def run_ffmpeg(input_url, ingest, stream_key, fps, vb_k, ab_k, loop):
    gop = int(fps) * 2
    vb = f"{vb_k}k"
    ab = f"{ab_k}k"

    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "warning",
        "-progress", "pipe:1",  # Output progress to stdout
        "-stream_loop", "-1" if loop else "0",
        "-re",  # Read input at native frame rate
        "-i", input_url,
        # Video encoding optimizations
        "-c:v", "libx264", 
        "-pix_fmt", "yuv420p", 
        "-preset", "ultrafast",  # Changed from veryfast for lower latency
        "-tune", "zerolatency",  # Optimize for streaming
        "-profile:v", "baseline",  # Changed from high for better compatibility
        "-level", "3.1",
        # Bitrate and buffer settings
        "-b:v", vb, 
        "-maxrate", vb, 
        "-bufsize", str(int(vb_k*1.5)) + "k",  # Reduced buffer size
        "-r", str(fps), 
        "-g", str(gop), 
        "-keyint_min", str(gop),
        "-sc_threshold", "0",
        # Audio optimizations
        "-c:a", "aac", 
        "-b:a", ab, 
        "-ac", "2", 
        "-ar", "44100",
        # Output settings
        "-f", "flv", 
        "-flvflags", "no_duration_filesize",  # Reduce metadata overhead
        f"rtmp://{ingest}/{stream_key}"
    ]

    print(f"🚀 Running FFmpeg command: {' '.join(cmd)}")
    return subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

def test_ffmpeg():
    """Test if FFmpeg is available and working"""
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ FFmpeg is available")
            # Extract version info
            version_line = result.stdout.split('\n')[0]
            print(f"📹 {version_line}")
            return True
        else:
            print(f"❌ FFmpeg test failed with return code {result.returncode}")
            return False
    except FileNotFoundError:
        print("❌ FFmpeg not found in PATH")
        return False
    except subprocess.TimeoutExpired:
        print("❌ FFmpeg test timed out")
        return False
    except Exception as e:
        print(f"❌ FFmpeg test error: {e}")
        return False

def main():
    print("🚀 Starting Twitcher Python Worker")
    print(f"🆔 Worker ID: {WORKER_ID}")
    print(f"🌐 API Base: {API_BASE}")
    
    # Test FFmpeg availability
    if not test_ffmpeg():
        print("❌ FFmpeg not available, exiting")
        return
    
    while True:
        job = get_job()
        if not job:
            time.sleep(POLL_INTERVAL)
            continue

        job_type = job.get("type", "stream")  # Default to stream for backward compatibility
        job_id = job["jobId"]
        started = datetime.now(timezone.utc).isoformat()

        if job_type == "video_process":
            # Handle video processing job
            video_id = job["videoId"]
            input_s3_key = job["inputS3Key"]
            output_s3_key = job["outputS3Key"]
            
            callback({"videoId": video_id, "jobId": job_id, "status": "ACTIVE", "startedAt": started, "worker": WORKER_ID})
            
            print(f"🎬 Starting video processing {video_id}")
            print(f"📹 Input S3 Key: {input_s3_key}")
            print(f"📤 Output S3 Key: {output_s3_key}")
            
            # Create temporary input and output files
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_input:
                input_path = temp_input.name
            
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_output:
                output_path = temp_output.name
            
            try:
                # Download original video from S3
                print(f"📥 Downloading video from S3: {input_s3_key}")
                if not download_from_s3(input_s3_key, input_path):
                    raise Exception("Failed to download video from S3")
                
                # Process video to downgrade quality
                print(f"🔄 Processing video to 720p maximum...")
                result = process_video(input_path, output_path)
                
                if result.returncode == 0:
                    # Upload processed video to S3
                    print(f"📤 Uploading processed video to S3: {output_s3_key}")
                    if upload_to_s3(output_path, output_s3_key):
                        ended = datetime.now(timezone.utc).isoformat()
                        callback({"videoId": video_id, "jobId": job_id, "status": "COMPLETED", "endedAt": ended, "worker": WORKER_ID, "outputS3Key": output_s3_key})
                        print(f"✅ Video processing {video_id} completed successfully")
                    else:
                        raise Exception("Failed to upload processed video to S3")
                else:
                    ended = datetime.now(timezone.utc).isoformat()
                    callback({"videoId": video_id, "jobId": job_id, "status": "FAILED", "endedAt": ended, "worker": WORKER_ID, "error": result.stderr})
                    print(f"❌ Video processing {video_id} failed: {result.stderr}")
                
            except Exception as e:
                ended = datetime.now(timezone.utc).isoformat()
                callback({"videoId": video_id, "jobId": job_id, "status": "FAILED", "endedAt": ended, "worker": WORKER_ID, "error": str(e)})
                print(f"❌ Video processing {video_id} failed with exception: {e}")
            
            finally:
                # Clean up temporary files
                try:
                    os.unlink(input_path)
                except:
                    pass
                try:
                    os.unlink(output_path)
                except:
                    pass
                    
        else:
            # Handle streaming job (existing logic)
            stream_id = job["streamId"]
            
            # Validate required fields
            required_fields = ["s3Url", "ingest", "streamKey", "fps", "vb", "ab", "loop"]
            missing_fields = [field for field in required_fields if field not in job or job[field] is None]
            
            if missing_fields:
                error_msg = f"Missing required fields: {missing_fields}"
                print(f"❌ {error_msg}")
                callback({"streamId": stream_id, "jobId": job_id, "status": "FAILED", "endedAt": datetime.now(timezone.utc).isoformat(), "worker": WORKER_ID, "error": error_msg})
                continue
            
            # Validate field types
            try:
                fps = int(job["fps"])
                vb = int(job["vb"])
                ab = int(job["ab"])
                loop = bool(job["loop"])
            except (ValueError, TypeError) as e:
                error_msg = f"Invalid field types: fps={job['fps']}, vb={job['vb']}, ab={job['ab']}, loop={job['loop']}"
                print(f"❌ {error_msg}")
                callback({"streamId": stream_id, "jobId": job_id, "status": "FAILED", "endedAt": datetime.now(timezone.utc).isoformat(), "worker": WORKER_ID, "error": error_msg})
                continue
            
            callback({"streamId": stream_id, "jobId": job_id, "status": "ACTIVE", "startedAt": started, "worker": WORKER_ID})

            print(f"🎬 Starting stream {stream_id}")
            print(f"📹 Video URL: {job['s3Url']}")
            print(f"📡 RTMP: rtmp://{job['ingest']}/{job['streamKey']}")
            print(f"⚙️ Settings: fps={fps}, vb={vb}k, ab={ab}k, loop={loop}")
            
            # Test if the S3 URL is accessible
            try:
                import urllib.request
                test_req = urllib.request.Request(job['s3Url'])
                test_req.get_method = lambda: 'HEAD'
                with urllib.request.urlopen(test_req, timeout=10) as response:
                    if response.status != 200:
                        raise Exception(f"S3 URL returned status {response.status}")
                print("✅ S3 URL is accessible")
            except Exception as e:
                error_msg = f"S3 URL not accessible: {e}"
                print(f"❌ {error_msg}")
                callback({"streamId": stream_id, "jobId": job_id, "status": "FAILED", "endedAt": datetime.now(timezone.utc).isoformat(), "worker": WORKER_ID, "error": error_msg})
                continue
            
            # Assume `job["s3Url"]` is a presigned GET to the MP4
            proc = run_ffmpeg(
                input_url=job["s3Url"],
                ingest=job["ingest"],
                stream_key=job["streamKey"],
                fps=fps, vb_k=vb, ab_k=ab, loop=loop
            )

            # capture logs and monitor bitrate
            log_lines = []
            last_bitrate_report = time.time()
            current_bitrate = None
            
            try:
                # Give FFmpeg a moment to start and check for immediate errors
                time.sleep(2)
                
                # Check if process is still running
                if proc.poll() is not None:
                    # Process died immediately
                    stderr_output = proc.stderr.read() if proc.stderr else ""
                    error_msg = f"FFmpeg process died immediately: {stderr_output}"
                    print(f"❌ {error_msg}")
                    raise Exception(error_msg)
                
                # Monitor both stdout and stderr
                import select
                import sys
                
                # Set non-blocking mode for stdout
                import fcntl
                import os
                
                # Use a simpler approach - just read from stdout with timeout
                start_time = time.time()
                bitrate_found = False
                
                while proc.poll() is None and (time.time() - start_time) < 30:  # Monitor for 30 seconds
                    try:
                        # Try to read a line with timeout
                        line = proc.stdout.readline()
                        if line:
                            line = line.strip()
                            log_lines.append(line)
                            print(f"FFmpeg: {line}")
                            
                            # Parse FFmpeg progress for bitrate monitoring
                            if "bitrate=" in line:
                                try:
                                    # Extract bitrate from FFmpeg output (format: "bitrate=1234.5kbits/s")
                                    parts = line.split()
                                    for part in parts:
                                        if "bitrate=" in part:
                                            bitrate_part = part
                                            break
                                    else:
                                        continue
                                        
                                    bitrate_value = bitrate_part.split("=")[1].replace("kbits/s", "").replace("bits/s", "")
                                    
                                    if bitrate_value != "N/A" and bitrate_value.replace(".", "").isdigit():
                                        current_bitrate = float(bitrate_value)
                                        bitrate_found = True
                                        print(f"📊 Bitrate detected: {current_bitrate} kbps")
                                        
                                        # Report bitrate every 10 seconds
                                        if time.time() - last_bitrate_report >= 10:
                                            callback({
                                                "streamId": stream_id, 
                                                "jobId": job_id, 
                                                "status": "PROGRESS",
                                                "bitrate": current_bitrate,
                                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                                "worker": WORKER_ID
                                            })
                                            last_bitrate_report = time.time()
                                        break
                                except (IndexError, ValueError, AttributeError) as e:
                                    print(f"⚠️ Bitrate parsing error: {e} for line: {line}")
                                    pass  # Skip malformed bitrate lines
                        else:
                            # No output, check if process is still alive
                            time.sleep(0.1)
                            
                    except Exception as e:
                        print(f"⚠️ Error reading FFmpeg output: {e}")
                        time.sleep(0.1)
                
                # If we didn't find bitrate in the first 30 seconds, report a default
                if not bitrate_found and current_bitrate is None:
                    current_bitrate = job["vb"]  # Use configured video bitrate as fallback
                    print(f"📊 Using fallback bitrate: {current_bitrate} kbps")
                    callback({
                        "streamId": stream_id, 
                        "jobId": job_id, 
                        "status": "PROGRESS",
                        "bitrate": current_bitrate,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "worker": WORKER_ID
                    })
                            
            except Exception as e:
                print(f"❌ Error monitoring FFmpeg: {e}")
                # Don't break here, let the process continue

            # Wait for process to complete
            try:
                rc = proc.wait(timeout=300)  # 5 minute timeout
            except subprocess.TimeoutExpired:
                print("⏰ FFmpeg process timed out, terminating...")
                proc.terminate()
                try:
                    proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    proc.kill()
                rc = -1
            
            ended = datetime.now(timezone.utc).isoformat()

            status = "COMPLETED" if rc == 0 else "FAILED"
            print(f"⏹️ Stream {stream_id} ended with code {rc} - Status: {status}")
            
            if rc != 0:
                # Read any remaining stderr output
                stderr_output = ""
                if proc.stderr:
                    stderr_output = proc.stderr.read()
                
                print("🚨 FFmpeg errors:")
                if stderr_output:
                    for line in stderr_output.split('\n')[-10:]:  # Show last 10 lines
                        if line.strip():
                            print(f"   {line}")
                if log_lines:
                    for line in log_lines[-10:]:  # Show last 10 lines
                        print(f"   {line}")
            
            # Send final callback with bitrate if we have it
            callback_data = {
                "streamId": stream_id, 
                "jobId": job_id, 
                "status": status, 
                "endedAt": ended, 
                "worker": WORKER_ID
            }
            
            if current_bitrate is not None:
                callback_data["bitrate"] = current_bitrate
            
            callback(callback_data)

if __name__ == "__main__":
    main()
