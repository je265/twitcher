# Twitcher Worker Fixes

## Issues Identified

Based on the logs showing streams going from `ACTIVE` to `FAILED` with `bitrate: undefined`, several issues were identified:

1. **Bitrate parsing not working**: FFmpeg progress output wasn't being parsed correctly
2. **Streams failing immediately**: FFmpeg processes were dying without proper error handling
3. **Job duplication**: Jobs weren't being removed from the queue after fetching
4. **Missing input validation**: No validation of job parameters before processing
5. **Poor error reporting**: Limited visibility into why streams were failing

## Fixes Applied

### 1. Improved FFmpeg Process Management (`worker.py`)

- **Separated stdout and stderr**: Changed from `stderr=subprocess.STDOUT` to separate pipes for better error handling
- **Added process validation**: Check if FFmpeg process dies immediately after starting
- **Improved bitrate parsing**: More robust parsing of FFmpeg progress output with fallback to configured bitrate
- **Added timeout handling**: 5-minute timeout for FFmpeg processes with graceful termination
- **Better error logging**: Capture and display both stdout and stderr for debugging

### 2. Job Queue Management (`api/worker/next/route.ts`)

- **Job removal**: Jobs are now removed from the queue after being fetched to prevent duplicate processing
- **Error handling**: Graceful handling of job removal failures

### 3. Enhanced Worker Callbacks (`api/worker/callback/route.ts`)

- **Better bitrate handling**: Store final bitrate as metrics when streams complete
- **Improved logging**: More detailed logging for debugging stream issues
- **Bitrate fallback**: Use configured video bitrate if actual bitrate can't be detected

### 4. Input Validation (`worker.py`)

- **Required field validation**: Check for missing job parameters before processing
- **Type validation**: Ensure numeric parameters are valid integers
- **S3 URL testing**: Verify S3 URLs are accessible before starting FFmpeg
- **FFmpeg availability check**: Test FFmpeg at startup to catch configuration issues

### 5. Debug Tools

- **Debug script**: `test-worker-debug.py` to test worker components
- **Batch file**: `debug-worker.bat` for easy testing on Windows
- **Health endpoint**: Existing `/api/worker/health` endpoint for connectivity testing

## Key Changes Made

### Worker Process Flow

1. **Startup validation**: Check FFmpeg availability and environment
2. **Job fetching**: Get next job and remove it from queue
3. **Input validation**: Validate all required fields and test S3 URL
4. **Process monitoring**: Monitor FFmpeg with timeout and error handling
5. **Bitrate detection**: Parse FFmpeg output with fallback to configured values
6. **Status reporting**: Send detailed callbacks with bitrate information

### Error Handling

- **Immediate failures**: Detect and report FFmpeg startup failures
- **Process timeouts**: Graceful termination of stuck processes
- **Input validation**: Fail fast with clear error messages
- **S3 connectivity**: Test S3 URLs before processing

### Bitrate Reporting

- **Real-time monitoring**: Parse FFmpeg progress output for live bitrate
- **Fallback values**: Use configured bitrate if parsing fails
- **Final reporting**: Include final bitrate in completion callbacks
- **Metric storage**: Store bitrate data for performance analysis

## Testing

Run the debug script to verify the fixes:

```bash
# On Windows
debug-worker.bat

# On Linux/Mac
python test-worker-debug.py
```

The script will test:
- Environment variables
- FFmpeg availability
- API connectivity
- Basic FFmpeg functionality

## Expected Results

After applying these fixes:

1. **Bitrate should no longer be undefined**: Either actual bitrate or fallback value will be reported
2. **Streams should not fail immediately**: Better error handling and validation will catch issues early
3. **No duplicate job processing**: Jobs are removed from queue after fetching
4. **Better error visibility**: Clear error messages for debugging
5. **More stable streaming**: Improved FFmpeg process management

## Monitoring

Watch for these improved log messages:

- `🚀 Running FFmpeg command: ...` - Shows exact FFmpeg command
- `📊 Bitrate detected: X kbps` - Confirms bitrate parsing
- `✅ S3 URL is accessible` - Confirms input validation
- `🏁 Stream X completed/failed, final bitrate: Y kbps` - Final status with bitrate

## Next Steps

1. **Deploy the updated worker** with these fixes
2. **Monitor the logs** for improved error reporting
3. **Test with a simple stream** to verify bitrate reporting
4. **Check job queue** to ensure no duplicate processing
5. **Review metrics** to confirm bitrate data is being stored
