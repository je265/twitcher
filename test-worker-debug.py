#!/usr/bin/env python3
"""
Debug script for Twitcher Python Worker
Tests various components to identify issues
"""

import os
import sys
import subprocess
import requests
import tempfile
from datetime import datetime, timezone

def test_ffmpeg():
    """Test FFmpeg availability and basic functionality"""
    print("🔍 Testing FFmpeg...")
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✅ FFmpeg available: {version_line}")
            return True
        else:
            print(f"❌ FFmpeg test failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ FFmpeg error: {e}")
        return False

def test_environment():
    """Test environment variables"""
    print("🔍 Testing environment variables...")
    required_vars = ["API_BASE", "WORKER_TOKEN"]
    optional_vars = ["S3_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET", "WORKER_ID"]
    
    missing = []
    for var in required_vars:
        if not os.environ.get(var):
            missing.append(var)
        else:
            print(f"✅ {var}: {os.environ[var][:20]}...")
    
    for var in optional_vars:
        if os.environ.get(var):
            print(f"✅ {var}: {os.environ[var][:20]}...")
        else:
            print(f"⚠️ {var}: not set")
    
    if missing:
        print(f"❌ Missing required variables: {missing}")
        return False
    
    return True

def test_api_connection():
    """Test API connection"""
    print("🔍 Testing API connection...")
    try:
        api_base = os.environ["API_BASE"].strip().rstrip('/') + '/'
        worker_token = os.environ["WORKER_TOKEN"]
        
        # Test worker health endpoint
        health_url = f"{api_base}api/worker/health"
        response = requests.get(health_url, headers={"Authorization": f"Bearer {worker_token}"}, timeout=10)
        
        if response.status_code == 200:
            print("✅ API connection successful")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API connection error: {e}")
        return False

def test_ffmpeg_stream():
    """Test FFmpeg streaming functionality"""
    print("🔍 Testing FFmpeg streaming...")
    
    # Create a test video file
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_file:
        test_video = temp_file.name
    
    try:
        # Generate a simple test video (1 second, black screen)
        cmd = [
            "ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=1",
            "-f", "lavfi", "-i", "sine=frequency=1000:duration=1",
            "-c:v", "libx264", "-c:a", "aac", "-y", test_video
        ]
        
        print(f"🎬 Generating test video: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"❌ Test video generation failed: {result.stderr}")
            return False
        
        print("✅ Test video generated successfully")
        
        # Test FFmpeg with the test video (simulate streaming setup)
        test_cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "warning",
            "-i", test_video,
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-f", "null", "-"
        ]
        
        print(f"📡 Testing FFmpeg processing: {' '.join(test_cmd)}")
        result = subprocess.run(test_cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ FFmpeg processing test successful")
            return True
        else:
            print(f"❌ FFmpeg processing test failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ FFmpeg streaming test error: {e}")
        return False
    finally:
        # Clean up test file
        try:
            os.unlink(test_video)
        except:
            pass

def main():
    print("🚀 Twitcher Worker Debug Script")
    print("=" * 50)
    
    tests = [
        ("Environment Variables", test_environment),
        ("FFmpeg Availability", test_ffmpeg),
        ("API Connection", test_api_connection),
        ("FFmpeg Streaming", test_ffmpeg_stream),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Worker should be ready.")
    else:
        print("⚠️ Some tests failed. Check the issues above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
