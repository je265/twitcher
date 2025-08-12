#!/usr/bin/env python3
"""
Quick Web App Health Test Script
Tests web app connectivity and identifies issues
"""

import os
import requests
import json
from urllib.parse import urljoin

def test_web_app_health():
    """Test web app health endpoints"""
    print("🏥 Testing Web App Health...")
    
    # Check environment variables
    api_base = os.environ.get("API_BASE")
    worker_token = os.environ.get("WORKER_TOKEN")
    
    if not api_base or not worker_token:
        print("❌ Missing required environment variables:")
        print(f"   API_BASE: {'SET' if api_base else 'NOT SET'}")
        print(f"   WORKER_TOKEN: {'SET' if worker_token else 'NOT SET'}")
        return False
    
    print(f"🔧 Configuration:")
    print(f"   API Base: {api_base}")
    print(f"   Worker Token: {worker_token[:10]}...")
    
    # Test basic connectivity
    try:
        print(f"\n🔍 Testing basic connectivity...")
        response = requests.get(api_base, timeout=10)
        print(f"✅ Root endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False
    
    # Test worker health endpoint
    try:
        print(f"\n🔍 Testing worker health endpoint...")
        health_url = urljoin(api_base, "/api/worker/health")
        response = requests.get(
            health_url, 
            headers={"Authorization": f"Bearer {worker_token}"}, 
            timeout=10
        )
        
        print(f"📊 Health endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check passed: {health_data.get('status', 'unknown')}")
            print(f"🔧 Environment check:")
            env = health_data.get('environment', {})
            for key, value in env.items():
                print(f"   {key}: {value}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False
    
    # Test worker next endpoint
    try:
        print(f"\n🔍 Testing worker next endpoint...")
        next_url = urljoin(api_base, "/api/worker/next")
        response = requests.get(
            next_url, 
            headers={"Authorization": f"Bearer {worker_token}"}, 
            timeout=10
        )
        
        print(f"📊 Next endpoint status: {response.status_code}")
        
        if response.status_code == 204:
            print("✅ Next endpoint working (no jobs available)")
        elif response.status_code == 503:
            print("❌ Next endpoint returning 503 - Service Unavailable")
            print("🔍 This suggests Redis connection issues in the web app")
            return False
        elif response.status_code >= 500:
            print(f"❌ Next endpoint server error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Response: {response.text[:200]}")
            return False
        else:
            print(f"⚠️ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Next endpoint test failed: {e}")
        return False
    
    return True

def main():
    print("🚀 Web App Health Test")
    print("=" * 40)
    
    success = test_web_app_health()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 Web app health test passed!")
        print("✅ All endpoints are working correctly")
    else:
        print("❌ Web app health test failed!")
        print("🔍 Check the issues above for troubleshooting")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
