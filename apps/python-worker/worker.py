import os, time, json, subprocess, shlex, requests, tempfile
from datetime import datetime, timezone
from urllib.parse import urljoin

API_BASE = os.environ["API_BASE"].strip().rstrip('/') + '/'  # remove whitespace and ensure trailing slash
API_TOKEN = os.environ["WORKER_TOKEN"]        # simple bearer
S3_BASE  = os.environ.get("S3_BASE")          # presigned URLs assumed
WORKER_ID = os.environ.get("WORKER_ID", "py-1")

POLL_INTERVAL = 3

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

def run_ffmpeg(input_url, ingest, stream_key, fps, vb_k, ab_k, loop):
    gop = int(fps) * 2
    vb = f"{vb_k}k"
    ab = f"{ab_k}k"

    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "info",
        "-progress", "pipe:1",  # Output progress to stdout
        "-stream_loop", "-1" if loop else "0",
        "-re",
        "-i", input_url,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast",
        "-b:v", vb, "-maxrate", vb, "-bufsize", str(int(vb_k*2)) + "k",
        "-r", str(fps), "-g", str(gop), "-keyint_min", str(gop),
        "-sc_threshold", "0", "-profile:v", "high", "-tune", "zerolatency",
        "-c:a", "aac", "-b:a", ab, "-ac", "2", "-ar", "44100",
        "-f", "flv", f"rtmp://{ingest}/{stream_key}"
    ]

    return subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

def main():
    while True:
        job = get_job()
        if not job:
            time.sleep(POLL_INTERVAL)
            continue

        stream_id = job["streamId"]; job_id = job["jobId"]
        started = datetime.now(timezone.utc).isoformat()

        callback({"streamId": stream_id, "jobId": job_id, "status": "ACTIVE", "startedAt": started, "worker": WORKER_ID})

        print(f"🎬 Starting stream {stream_id}")
        print(f"📹 Video URL: {job['s3Url']}")
        print(f"📡 RTMP: rtmp://{job['ingest']}/{job['streamKey']}")
        
        # Assume `job["s3Url"]` is a presigned GET to the MP4
        proc = run_ffmpeg(
            input_url=job["s3Url"],
            ingest=job["ingest"],
            stream_key=job["streamKey"],
            fps=job["fps"], vb_k=job["vb"], ab_k=job["ab"], loop=job["loop"]
        )

        # capture logs and monitor bitrate
        log_lines = []
        last_bitrate_report = time.time()
        try:
            for line in proc.stdout:
                log_lines.append(line.rstrip())
                
                # Parse FFmpeg progress for bitrate monitoring
                if "bitrate=" in line:
                    try:
                        # Extract bitrate from FFmpeg output (format: "bitrate=1234.5kbits/s")
                        bitrate_part = [part for part in line.split() if "bitrate=" in part][0]
                        bitrate_value = bitrate_part.split("=")[1].replace("kbits/s", "").replace("bits/s", "")
                        
                        if bitrate_value != "N/A":
                            current_bitrate = float(bitrate_value)
                            
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
                    except (IndexError, ValueError):
                        pass  # Skip malformed bitrate lines
                        
        except Exception:
            pass

        rc = proc.wait()
        ended = datetime.now(timezone.utc).isoformat()

        status = "COMPLETED" if rc == 0 else "FAILED"
        print(f"⏹️ Stream {stream_id} ended with code {rc} - Status: {status}")
        
        if rc != 0 and log_lines:
            print("🚨 FFmpeg errors:")
            for line in log_lines[-10:]:  # Show last 10 lines
                print(f"   {line}")
        
        # TODO: upload logs to S3 and pass logS3Key
        callback({"streamId": stream_id, "jobId": job_id, "status": status, "endedAt": ended, "worker": WORKER_ID})

if __name__ == "__main__":
    main()
