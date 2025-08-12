# 🎮 TWITCHER PRO - Multi-Account RTMP Streaming Platform

A powerful, automated Twitch streaming platform that enables simultaneous streaming to multiple Twitch accounts using RTMP. Built with Next.js, Python, and FFmpeg for professional content creators and streamers.

## ✨ Features

### 🔐 Simple Authentication
- **UUID-based login system** - No passwords, just save your unique UUID
- Instant account creation with secure user identification
- Session management with JWT tokens

### 🎥 Video Management
- **Multi-format support**: MP4, WebM, OGG, AVI, MOV, WMV, FLV
- Drag-and-drop video upload interface
- Video metadata extraction and storage
- Organized video library with search and filtering

### 🔑 Stream Key Management
- **Encrypted stream key storage** using AES-GCM encryption
- Support for multiple Twitch accounts per user
- Custom ingest server configuration
- Secure key handling and decryption

### 📊 Twitch Integration
- **Real-time account statistics** - followers, views, live status
- Multiple Twitch account linking and management
- Live stream status monitoring
- Account verification and validation

### 🚀 RTMP Multi-Streaming
- **Simultaneous streaming** to multiple Twitch accounts
- Queue-based job management with BullMQ
- FFmpeg-powered video processing
- Real-time streaming status and logs

### 🏗️ Modern Architecture
- **Frontend**: Next.js 14 with App Router, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Queue System**: Redis + BullMQ for job management
- **Worker**: Python FFmpeg workers for video processing
- **Database**: PostgreSQL with encrypted sensitive data
- **Storage**: S3/MinIO for videos and logs

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and pnpm
- Python 3.11+ (for worker development)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd twitcher
pnpm install
```

### 2. Environment Setup

Create `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://twitch:twitch@localhost:5432/twitch"

# Redis Configuration  
REDIS_URL="redis://localhost:6379"

# S3/MinIO Configuration
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minio"
S3_SECRET_KEY="minio123"
S3_BUCKET_NAME="twitcher-videos"
S3_REGION="us-east-1"

# Authentication
NEXTAUTH_SECRET="your-secure-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Twitch API (Optional - for enhanced stats)
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"

# Worker Authentication
WORKER_TOKEN="your-secure-worker-token"
```

Create `infra/.env` file:

```env
# Copy the same content as above for Docker services
DATABASE_URL="postgresql://twitch:twitch@localhost:5432/twitch"
REDIS_URL="redis://localhost:6379"
# ... (rest of the variables)
```

### 3. Start Services

```bash
# Start infrastructure services
cd infra
docker-compose up -d

# Set up database schema
cd ..
$env:DATABASE_URL="postgresql://twitch:twitch@localhost:5432/twitch"; pnpm --filter @repo/prisma db:push
$env:DATABASE_URL="postgresql://twitch:twitch@localhost:5432/twitch"; pnpm --filter @repo/prisma generate

# Start development server
cd apps/web
pnpm dev
```

### 4. Access the Application

- **Web Interface**: http://localhost:3000
- **Database Admin**: http://localhost:5432 (PostgreSQL)
- **Storage Interface**: http://localhost:9001 (MinIO Console)
- **Redis**: localhost:6379

## 📖 Usage Guide

### Getting Started

1. **Create Account**: Visit the homepage and click "Create Account"
2. **Save Your UUID**: Copy and save the generated UUID - this is your login credential
3. **Sign In**: Use your UUID to access the dashboard

### Managing Twitch Accounts

1. **Link Account**: Go to "Accounts" tab in dashboard
2. **Add Credentials**: Enter display name, channel ID, and stream key
3. **Verify Connection**: Check account status and statistics
4. **Multiple Accounts**: Link as many Twitch accounts as needed

### Video Upload and Management

1. **Upload Videos**: Use the "Videos" tab to upload content
2. **Supported Formats**: MP4, WebM, OGG, AVI, MOV, WMV, FLV
3. **Organize Library**: View uploaded videos with metadata
4. **Stream Preparation**: Videos are automatically processed for streaming

### Multi-Account RTMP Streaming

1. **Select Video**: Choose from your video library
2. **Target Accounts**: Select which Twitch accounts to stream to
3. **Start Streaming**: Begin simultaneous RTMP streams
4. **Monitor Status**: Real-time monitoring of all active streams
5. **Manage Streams**: Stop individual streams or all at once

## 🏗️ Architecture Deep Dive

### Database Schema

```sql
-- Core user system with UUID authentication
User {
  id: String (Primary Key)
  uuid: String (Unique - Login ID)
  name: String?
  email: String? (Optional)
  role: Role (USER/ADMIN)
}

-- Encrypted Twitch account storage
TwitchAccount {
  id: String (Primary Key)
  userId: String (Foreign Key)
  displayName: String
  channelId: String (Unique)
  streamKeyCipher: Bytes (Encrypted)
  streamKeyNonce: Bytes
  streamKeyTag: Bytes
  ingestServer: String
}

-- Video metadata and storage references
Video {
  id: String (Primary Key)
  uploaderId: String (Foreign Key)
  title: String
  description: String
  s3Key: String (Unique)
  durationSec: Int?
  width/height: Int?
  codecVideo/Audio: String?
}

-- Streaming job management
Stream {
  id: String (Primary Key)
  creatorId: String (Foreign Key)
  twitchAccountId: String (Foreign Key)
  videoId: String (Foreign Key)
  title: String
  category: String?
  tags: String[]
  fps: Int (default: 30)
  videoBitrateK: Int (default: 2500)
  audioBitrateK: Int (default: 160)
  loop: Boolean (default: false)
  status: StreamStatus
  scheduledAt/startedAt/endedAt: DateTime?
}
```

### Security Features

- **Encrypted Stream Keys**: AES-GCM encryption for all sensitive data
- **UUID Authentication**: No passwords, secure unique identifiers
- **JWT Sessions**: Secure session management
- **Environment Isolation**: Sensitive configs in environment variables
- **Worker Authentication**: Secure worker-to-API communication

### Streaming Pipeline

1. **Video Upload** → S3/MinIO storage
2. **Metadata Extraction** → Database storage
3. **Stream Creation** → Job queue (BullMQ)
4. **Worker Processing** → Python FFmpeg workers
5. **RTMP Streaming** → Multiple Twitch endpoints
6. **Status Monitoring** → Real-time updates

## 🛠️ Development

### Project Structure

```
twitcher/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/               # App router pages
│   │   ├── api/               # API routes
│   │   └── lib/               # Utilities
│   └── python-worker/          # FFmpeg worker
├── packages/
│   ├── prisma/                # Database schema
│   └── shared/                # Shared utilities
├── infra/
│   └── docker-compose.yml     # Infrastructure
└── README.md
```

### API Endpoints

```
POST /api/auth/register         # Create new user account
POST /api/auth/login           # UUID-based login
GET  /api/videos               # List user videos
POST /api/videos/upload        # Upload new video
GET  /api/twitch/link          # List linked accounts
POST /api/twitch/link          # Link new Twitch account
GET  /api/twitch/stats         # Get account statistics
POST /api/streams/start        # Start streaming
POST /api/streams/stop         # Stop streaming
```

### Adding New Features

1. **Database Changes**: Update `packages/prisma/schema.prisma`
2. **API Endpoints**: Add routes in `apps/web/app/api/`
3. **Frontend Components**: Create in `apps/web/app/`
4. **Worker Jobs**: Extend `apps/python-worker/worker.py`

## 🔧 Configuration

### Stream Quality Settings

```javascript
// Default streaming configuration
const streamConfig = {
  fps: 30,                    // Frames per second
  videoBitrateK: 2500,       // Video bitrate (kbps)
  audioBitrateK: 160,        // Audio bitrate (kbps)
  resolution: "1920x1080",   // Output resolution
  codec: "h264",             // Video codec
}
```

### Multiple Account Limits

- **Free Tier**: Up to 3 Twitch accounts
- **Pro Tier**: Up to 10 Twitch accounts  
- **Enterprise**: Unlimited accounts

### Storage Limits

- **Videos**: 10GB per user (Free), 100GB (Pro)
- **Logs**: 30-day retention
- **Streams**: Unlimited concurrent streams

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Ensure PostgreSQL is running
docker-compose -f infra/docker-compose.yml up -d db

# Check connection
docker exec infra-db-1 psql -U twitch -d twitch -c "SELECT 1;"
```

**Video Upload Fails**
- Check file size limits (500MB max)
- Verify supported format (MP4, WebM, etc.)
- Ensure sufficient storage space

**Stream Won't Start**
- Verify stream key is correct
- Check Twitch account status
- Ensure video file is accessible

**Worker Connection Issues**
- Verify WORKER_TOKEN in environment
- Check Redis connection
- Restart worker processes

## 📊 Monitoring and Logs

### Stream Monitoring
- Real-time status updates in dashboard
- Stream health metrics
- Error logging and alerting

### Performance Metrics
- Upload/download speeds
- Stream quality statistics
- Server resource usage

### Log Access
```bash
# View worker logs
docker logs infra-worker-1

# Database query logs
docker logs infra-db-1

# Application logs
pnpm dev # Shows Next.js logs
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: support@twitcher.pro (if applicable)

---

**Built with ❤️ for content creators and streamers worldwide**