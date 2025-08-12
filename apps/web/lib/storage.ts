import { S3Client, GetObjectCommand, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
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
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ Bucket ${BUCKET_NAME} already exists`);
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404) {
      // Bucket doesn't exist, create it
      console.log(`📦 Creating bucket ${BUCKET_NAME}...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`✅ Successfully created bucket ${BUCKET_NAME}`);
      } catch (createError) {
        console.error(`❌ Failed to create bucket ${BUCKET_NAME}:`, createError);
        throw createError;
      }
    } else {
      console.error(`❌ Error checking bucket ${BUCKET_NAME}:`, error);
      throw error;
    }
  }
}

export async function uploadVideoToS3(s3Key: string, buffer: Buffer, contentType: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);
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
