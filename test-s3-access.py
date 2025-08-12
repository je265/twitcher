#!/usr/bin/env python3
"""
Quick S3 Access Test Script
Tests S3 connectivity and permissions
"""

import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

def test_s3_access():
    print("🔍 Testing S3 Access...")
    
    # Check environment variables
    s3_endpoint = os.environ.get("S3_ENDPOINT")
    s3_access_key = os.environ.get("S3_ACCESS_KEY")
    s3_secret_key = os.environ.get("S3_SECRET_KEY")
    s3_bucket = os.environ.get("S3_BUCKET_NAME", "twitcher-videos")
    
    print(f"🔧 S3 Configuration:")
    print(f"   Endpoint: {s3_endpoint}")
    print(f"   Bucket: {s3_bucket}")
    print(f"   Access Key: {'SET' if s3_access_key else 'NOT SET'}")
    print(f"   Secret Key: {'SET' if s3_secret_key else 'NOT SET'}")
    
    if not all([s3_endpoint, s3_access_key, s3_secret_key]):
        print("❌ Missing required S3 environment variables")
        return False
    
    try:
        # Create S3 client
        s3_client = boto3.client(
            's3',
            endpoint_url=s3_endpoint,
            aws_access_key_id=s3_access_key,
            aws_secret_access_key=s3_secret_key,
            region_name='us-east-1'
        )
        
        print("✅ S3 client created successfully")
        
        # Test bucket access
        print(f"🪣 Testing bucket access: {s3_bucket}")
        response = s3_client.head_bucket(Bucket=s3_bucket)
        print("✅ Bucket access successful")
        
        # List objects (test read permissions)
        print("📁 Testing object listing...")
        response = s3_client.list_objects_v2(Bucket=s3_bucket, MaxKeys=5)
        object_count = len(response.get('Contents', []))
        print(f"✅ Found {object_count} objects in bucket")
        
        if object_count > 0:
            # Test reading first object
            first_object = response['Contents'][0]
            print(f"🔍 Testing read access to: {first_object['Key']}")
            
            try:
                obj_response = s3_client.head_object(Bucket=s3_bucket, Key=first_object['Key'])
                print(f"✅ Read access successful - Size: {obj_response['ContentLength']} bytes")
            except ClientError as e:
                print(f"❌ Read access failed: {e}")
                return False
        
        return True
        
    except NoCredentialsError:
        print("❌ No credentials found")
        return False
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"❌ S3 Client Error: {error_code} - {error_message}")
        
        if error_code == 'NoSuchBucket':
            print("🔍 Bucket doesn't exist - check bucket name")
        elif error_code == 'AccessDenied':
            print("🔍 Access denied - check bucket permissions and credentials")
        elif error_code == 'InvalidAccessKeyId':
            print("🔍 Invalid access key - check S3_ACCESS_KEY")
        elif error_code == 'SignatureDoesNotMatch':
            print("🔍 Signature mismatch - check S3_SECRET_KEY")
        
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_s3_access()
    if success:
        print("\n🎉 S3 access test passed!")
    else:
        print("\n❌ S3 access test failed!")
        exit(1)
