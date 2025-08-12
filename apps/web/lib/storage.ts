import { S3Client, GetObjectCommand, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "twitcher-videos";

export async function ensureBucketExists(): Promise<void> {
  try {
    console.log(`🔍 Checking if bucket ${BUCKET_NAME} exists...`);
    console.log(`🔧 S3 Client config: endpoint=${process.env.S3_ENDPOINT}, region=${process.env.S3_REGION}`);
    
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ Bucket ${BUCKET_NAME} already exists`);
  } catch (error: any) {
    console.error(`❌ Error checking bucket ${BUCKET_NAME}:`, error);
    console.error(`❌ Error details:`, {
      message: error.message,
      code: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    
    if (error.$metadata?.httpStatusCode === 404) {
      // Bucket doesn't exist, create it
      console.log(`📦 Creating bucket ${BUCKET_NAME}...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`✅ Successfully created bucket ${BUCKET_NAME}`);
      } catch (createError: any) {
        console.error(`❌ Failed to create bucket ${BUCKET_NAME}:`, createError);
        console.error(`❌ Create error details:`, {
          message: createError.message,
          code: createError.$metadata?.httpStatusCode,
          requestId: createError.$metadata?.requestId
        });
        throw createError;
      }
    } else {
      throw error;
    }
  }
}

export async function uploadVideoToS3(s3Key: string, buffer: Buffer, contentType: string): Promise<void> {
  console.log(`📤 Starting S3 upload: key=${s3Key}, size=${buffer.length}, type=${contentType}`);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  try {
    await s3Client.send(command);
    console.log(`✅ S3 upload completed successfully: ${s3Key}`);
  } catch (error: any) {
    console.error(`❌ S3 upload failed: ${s3Key}`, error);
    console.error(`❌ Upload error details:`, {
      message: error.message,
      code: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    throw error;
  }
}

export async function getSignedUrlForVideo(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
}

export async function uploadLogsToS3(streamId: string, logs: string): Promise<string> {
  // Implementation for uploading logs to S3
  // This would use PutObjectCommand to store logs
  const logKey = `logs/${streamId}/${Date.now()}.log`;
  
  // TODO: Implement actual upload
  return logKey;
}
