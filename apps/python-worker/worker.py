import os, time, json, subprocess, shlex, requests, tempfile
from datetime import datetime, timezone
from urllib.parse import urljoin

print("🔍 Starting imports...")

try:
    import boto3
    from botocore.exceptions import ClientError
    print("✅ boto3 imported successfully")
except Exception as e:
    print(f"❌ boto3 import failed: {e}")
    boto3 = None
    ClientError = None

print("🔍 Setting up environment variables...")

try:
    API_BASE = os.environ["API_BASE"].strip().rstrip('/') + '/'  # remove whitespace and ensure trailing slash
    API_TOKEN = os.environ["WORKER_TOKEN"]        # simple bearer
    S3_BASE  = os.environ.get("S3_BASE")          # presigned URLs assumed
    WORKER_ID = os.environ.get("WORKER_ID", "py-1")
    
    # S3 configuration
    S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY")
    S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY")
    S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "twitcher-videos")  # Fixed: use S3_BUCKET_NAME to match web app
    
    print(f"✅ Environment variables loaded:")
    print(f"   API_BASE: {API_BASE}")
    print(f"   WORKER_ID: {WORKER_ID}")
    print(f"   S3_ENDPOINT: {S3_ENDPOINT}")
    print(f"   S3_BUCKET: {S3_BUCKET}")
    print(f"   S3_ACCESS_KEY: {'Set' if S3_ACCESS_KEY else 'Not set'}")
    print(f"   S3_SECRET_KEY: {'Set' if S3_SECRET_KEY else 'Not set'}")
    
except Exception as e:
    print(f"❌ Environment variable setup failed: {e}")
    raise

POLL_INTERVAL = 3

print("🔍 Initializing S3 client...")

# Initialize S3 client
s3_client = None
if S3_ACCESS_KEY and S3_SECRET_KEY and boto3:
    try:
        s3_client = boto3.client(
            's3',
            endpoint_url=S3_ENDPOINT,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            region_name='us-east-1'  # Default region
        )
        print("✅ S3 client initialized successfully")
    except Exception as e:
        print(f"❌ S3 client initialization failed: {e}")
        s3_client = None
else:
    print("⚠️ S3 client not initialized - missing credentials or boto3")

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
    
    # Add retry logic for connection issues
    max_retries = 3
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            print(f"🔍 Attempting to fetch job (attempt {attempt + 1}/{max_retries})")
            r = requests.get(url, headers={"Authorization": f"Bearer {API_TOKEN}"}, timeout=30)
            
            if r.status_code == 204:
                return None
            elif r.status_code == 503:
                print(f"⚠️ Service temporarily unavailable (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"⏳ Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                else:
                    print("❌ Max retries reached, service unavailable")
                    return None
            elif r.status_code == 401:
                print("❌ Authentication failed - check WORKER_TOKEN")
                return None
            elif r.status_code >= 500:
                print(f"⚠️ Server error {r.status_code} (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"⏳ Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                else:
                    print("❌ Max retries reached, server error")
                    return None
            
            r.raise_for_status()
            return r.json()
            
        except requests.exceptions.Timeout:
            print(f"⏰ Request timeout (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                print(f"⏳ Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
            else:
                print("❌ Max retries reached, timeout")
                return None
        except requests.exceptions.ConnectionError as e:
            print(f"🔌 Connection error: {e} (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                print(f"⏳ Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
            else:
                print("❌ Max retries reached, connection failed")
                return None
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return None
    
    return None

def callback(payload):
    """Send callback to web app with retry logic"""
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            r = requests.post(
                urljoin(API_BASE, "/api/worker/callback"),
                headers={"Authorization": f"Bearer {API_TOKEN}", "Content-Type": "application/json"},
                data=json.dumps(payload), 
                timeout=30
            )
            
            if r.status_code == 200:
                return  # Success
            elif r.status_code >= 500:
                print(f"⚠️ Callback server error {r.status_code} (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                else:
                    print("❌ Callback failed after max retries")
            else:
                print(f"⚠️ Callback failed with status {r.status_code}")
                break
                
        except requests.exceptions.Timeout:
            print(f"⏰ Callback timeout (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            else:
                print("❌ Callback failed after max retries")
        except requests.exceptions.ConnectionError as e:
            print(f"🔌 Callback connection error: {e} (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            else:
                print("❌ Callback failed after max retries")
        except Exception as e:
            print(f"❌ Callback unexpected error: {e}")
            break

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

def check_web_app_health():
    """Check if the web app is healthy and accessible"""
    try:
        health_url = urljoin(API_BASE, "/api/worker/health")
        print(f"🏥 Checking web app health: {health_url}")
        
        r = requests.get(health_url, headers={"Authorization": f"Bearer {API_TOKEN}"}, timeout=10)
        
        if r.status_code == 200:
            health_data = r.json()
            print(f"✅ Web app healthy: {health_data.get('status', 'unknown')}")
            return True
        else:
            print(f"⚠️ Web app health check failed: {r.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_basic_functionality():
    """Test basic worker functionality"""
    print("🧪 Testing basic worker functionality...")
    
    try:
        # Test 1: Basic operations
        print("   Testing basic operations...")
        test_time = datetime.now(timezone.utc)
        print(f"   ✅ Current time: {test_time}")
        
        # Test 2: JSON operations
        print("   Testing JSON operations...")
        test_data = {"test": "data", "number": 42}
        json_str = json.dumps(test_data)
        parsed_data = json.loads(json_str)
        assert parsed_data == test_data
        print(f"   ✅ JSON operations: {parsed_data}")
        
        # Test 3: URL operations
        print("   Testing URL operations...")
        test_url = urljoin(API_BASE, "test")
        print(f"   ✅ URL join: {test_url}")
        
        # Test 4: Subprocess
        print("   Testing subprocess...")
        result = subprocess.run(["echo", "test"], capture_output=True, text=True, timeout=5)
        assert result.returncode == 0
        print(f"   ✅ Subprocess: {result.stdout.strip()}")
        
        print("✅ All basic functionality tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 Starting Twitcher Python Worker")
    print(f"🆔 Worker ID: {WORKER_ID}")
    print(f"🌐 API Base: {API_BASE}")
    
    # Test basic functionality first
    if not test_basic_functionality():
        print("❌ Basic functionality test failed, exiting")
        return
    
    # Test FFmpeg availability
    if not test_ffmpeg():
        print("❌ FFmpeg not available, exiting")
        return
    
    # Test web app connectivity
    print("🔍 Testing web app connectivity...")
    if not check_web_app_health():
        print("⚠️ Web app health check failed, but continuing...")
    
    print("🎯 Starting main job processing loop...")
    
    while True:
        try:
            print("🔄 Main loop iteration starting...")
            job = get_job()
            if not job:
                print("📭 No job available, waiting...")
                time.sleep(POLL_INTERVAL)
                continue

            print(f"📋 Processing job: {job.get('jobId', 'unknown')}")
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
                
                try:
                    print(f"\n🎬 ===== STARTING STREAM {stream_id} =====")
                    print(f"📋 Job data: {json.dumps(job, indent=2)}")
                    
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
                        print(f"✅ Field validation passed: fps={fps}, vb={vb}k, ab={ab}k, loop={loop}")
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
                    print(f"🔍 Testing S3 URL accessibility...")
                    try:
                        import urllib.request
                        test_req = urllib.request.Request(job['s3Url'])
                        test_req.get_method = lambda: 'HEAD'
                        
                        # Add User-Agent to avoid some S3 restrictions
                        test_req.add_header('User-Agent', 'Twitcher-Worker/1.0')
                        
                        print(f"🌐 Making HEAD request to: {job['s3Url']}")
                        with urllib.request.urlopen(test_req, timeout=10) as response:
                            if response.status != 200:
                                raise Exception(f"S3 URL returned status {response.status}")
                        print("✅ S3 URL is accessible")
                    except Exception as e:
                        error_msg = f"S3 URL not accessible: {e}"
                        print(f"❌ {error_msg}")
                        
                        # Try to provide more helpful error information
                        if "403" in str(e):
                            print("🔍 403 Forbidden suggests permission issues:")
                            print("   - Check if S3 bucket policy allows worker access")
                            print("   - Verify S3 credentials are correct")
                            print("   - Ensure bucket name matches: " + S3_BUCKET)
                            print("   - Check if S3 endpoint is accessible from worker")
                        
                        # Try alternative approach - use S3 client if available
                        if s3_client and "s3Key" in job:
                            try:
                                print("🔄 Attempting to access via S3 client...")
                                # Extract S3 key from the URL path
                                s3_key = job.get("s3Key", "")
                                if not s3_key:
                                    # Try to extract from URL path
                                    url_parts = job['s3Url'].split('/')
                                    if 'videos' in url_parts:
                                        video_index = url_parts.index('videos')
                                        s3_key = '/'.join(url_parts[video_index:])
                                        if '?' in s3_key:
                                            s3_key = s3_key.split('?')[0]
                                
                                if s3_key:
                                    print(f"🔑 Attempting to access S3 key: {s3_key}")
                                    # Test S3 client access
                                    s3_client.head_object(Bucket=S3_BUCKET, Key=s3_key)
                                    print("✅ S3 client access successful")
                                    # Update job to use S3 client instead of presigned URL
                                    job['useS3Client'] = True
                                    job['s3Key'] = s3_key
                                else:
                                    raise Exception("Could not extract S3 key from URL")
                            except Exception as s3_error:
                                print(f"❌ S3 client access also failed: {s3_error}")
                                print(f"🔧 S3 Client Config: endpoint={S3_ENDPOINT}, bucket={S3_BUCKET}, has_creds={bool(S3_ACCESS_KEY and S3_SECRET_KEY)}")
                        else:
                            print(f"🔍 S3 client fallback not available:")
                            print(f"   - s3_client available: {bool(s3_client)}")
                            print(f"   - s3Key in job: {'s3Key' in job}")
                            print(f"   - s3Key value: {job.get('s3Key', 'NOT_SET')}")
                            print(f"   - Available job fields: {list(job.keys())}")
                            
                            # Try to extract S3 key from URL as fallback
                            if s3_client:
                                print("🔄 Attempting to extract S3 key from URL...")
                                try:
                                    url_parts = job['s3Url'].split('/')
                                    if 'videos' in url_parts:
                                        video_index = url_parts.index('videos')
                                        extracted_s3_key = '/'.join(url_parts[video_index:])
                                        if '?' in extracted_s3_key:
                                            extracted_s3_key = extracted_s3_key.split('?')[0]
                                        
                                    if extracted_s3_key:
                                        print(f"🔑 Extracted S3 key from URL: {extracted_s3_key}")
                                        
                                        # Test S3 client access with extracted key
                                        s3_client.head_object(Bucket=S3_BUCKET, Key=extracted_s3_key)
                                        print("✅ S3 client access successful with extracted key")
                                        
                                        # Update job to use S3 client
                                        job['useS3Client'] = True
                                        job['s3Key'] = extracted_s3_key
                                    else:
                                        print("❌ Could not find 'videos' in URL path")
                                except Exception as extract_error:
                                    print(f"❌ S3 client access with extracted key failed: {extract_error}")
                            else:
                                print("❌ S3 client not available for fallback")
                        
                        print(f"🚨 Stream {stream_id} failed due to S3 access issues")
                        callback({"streamId": stream_id, "jobId": job_id, "status": "FAILED", "endedAt": datetime.now(timezone.utc).isoformat(), "worker": WORKER_ID, "error": error_msg})
                        continue
                    
                    # Assume `job["s3Url"]` is a presigned GET to the MP4
                    # If S3 client access worked, use that instead of presigned URL
                    input_source = job["s3Url"]
                    if job.get("useS3Client") and s3_client:
                        print("🔄 Using S3 client for video access instead of presigned URL")
                        # Create a local temporary file and download from S3
                        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_video:
                            temp_video_path = temp_video.name
                        
                        print(f"📥 Downloading video from S3 to temp file: {temp_video_path}")
                        if download_from_s3(job["s3Key"], temp_video_path):
                            input_source = temp_video_path
                            print("✅ Video downloaded successfully, using local file")
                        else:
                            print("❌ Failed to download video from S3, falling back to presigned URL")
                    
                    print(f"🎬 Starting FFmpeg with input: {input_source}")
                    proc = run_ffmpeg(
                        input_url=input_source,
                        ingest=job["ingest"],
                        stream_key=job["streamKey"],
                        fps=fps, vb_k=vb, ab_k=ab, loop=loop
                    )
                    
                    print(f"🚀 FFmpeg process started with PID: {proc.pid}")
                    print(f"🔍 FFmpeg process status: {'Running' if proc.poll() is None else 'Stopped'}")

                    # capture logs and monitor bitrate
                    log_lines = []
                    last_bitrate_report = time.time()
                    current_bitrate = None
                    
                    try:
                        # Give FFmpeg a moment to start and check for immediate errors
                        print("⏳ Waiting 2 seconds for FFmpeg to initialize...")
                        time.sleep(2)
                        
                        # Check if process is still running
                        if proc.poll() is not None:
                            # Process died immediately
                            stderr_output = proc.stderr.read() if proc.stderr else ""
                            error_msg = f"FFmpeg process died immediately: {stderr_output}"
                            print(f"❌ {error_msg}")
                            print(f"🚨 Stream {stream_id} failed - FFmpeg died immediately")
                            callback({"streamId": stream_id, "jobId": job_id, "status": "FAILED", "endedAt": datetime.now(timezone.utc).isoformat(), "worker": WORKER_ID, "error": error_msg})
                            continue
                        
                        print("✅ FFmpeg process is running, starting monitoring...")
                        
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
                    
                    # Clean up temporary video file if we created one
                    if job.get("useS3Client") and "temp_video_path" in locals():
                        try:
                            os.unlink(temp_video_path)
                            print(f"🧹 Cleaned up temporary video file: {temp_video_path}")
                        except Exception as cleanup_error:
                            print(f"⚠️ Failed to clean up temporary file: {cleanup_error}")
                    
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
                    
                except Exception as e:
                    # Catch any unexpected errors in the streaming logic
                    error_msg = f"Unexpected error in streaming logic: {str(e)}"
                    print(f"🚨 CRITICAL ERROR: {error_msg}")
                    print(f"🔍 Error type: {type(e).__name__}")
                    import traceback
                    print(f"📋 Full traceback:")
                    traceback.print_exc()
                    
                    # Try to send failure callback
                    try:
                        callback({"streamId": stream_id, "jobId": job_id, "status": "FAILED", "endedAt": datetime.now(timezone.utc).isoformat(), "worker": WORKER_ID, "error": error_msg})
                    except Exception as callback_error:
                        print(f"❌ Failed to send error callback: {callback_error}")
                    
                    # Continue to next job instead of crashing
                    continue
                    
        except Exception as e:
            # Global error handler for any unexpected errors
            error_msg = f"Global error in main loop: {str(e)}"
            print(f"🚨 GLOBAL CRITICAL ERROR: {error_msg}")
            print(f"🔍 Error type: {type(e).__name__}")
            import traceback
            print(f"📋 Full traceback:")
            traceback.print_exc()
            
            # Wait a bit before continuing to avoid rapid error loops
            print("⏳ Waiting 10 seconds before continuing...")
            time.sleep(10)
            continue

if __name__ == "__main__":
    try:
        print("🎬 Worker script starting...")
        main()
    except Exception as e:
        print(f"🚨 FATAL ERROR in main: {e}")
        import traceback
        traceback.print_exc()
        print("💀 Worker script crashed, exiting...")
        exit(1)
