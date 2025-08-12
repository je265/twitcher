// Simple script to clean up old videos
// Run this with: node cleanup-videos.js

const API_BASE = 'https://twitcher-production.up.railway.app';
const AUTH_TOKEN = 'your-auth-token-here'; // You'll need to get this from your browser

async function cleanupVideos() {
  try {
    // First, list all videos
    console.log('📋 Listing all videos...');
    const listResponse = await fetch(`${API_BASE}/api/admin/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        action: 'list-videos'
      })
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list videos: ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    console.log(`📊 Found ${listData.totalCount} videos:`);
    
    listData.videos.forEach(video => {
      console.log(`  - ${video.title} (${video.processingStatus}) - Created: ${video.createdAt}`);
    });

    // Ask user what to do
    console.log('\n🧹 Cleanup options:');
    console.log('1. Delete videos older than X days');
    console.log('2. Delete specific video by ID');
    console.log('3. Exit');

    // For now, let's clean up videos older than 7 days
    console.log('\n🗑️ Cleaning up videos older than 7 days...');
    
    const cleanupResponse = await fetch(`${API_BASE}/api/admin/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        action: 'cleanup-old',
        olderThanDays: 7
      })
    });

    if (!cleanupResponse.ok) {
      throw new Error(`Failed to cleanup: ${cleanupResponse.statusText}`);
    }

    const cleanupData = await cleanupResponse.json();
    console.log(`✅ Cleanup completed: ${cleanupData.message}`);
    
    if (cleanupData.errors && cleanupData.errors.length > 0) {
      console.log('⚠️ Some errors occurred:');
      cleanupData.errors.forEach(error => {
        console.log(`  - ${error.title}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Instructions
console.log('🚀 Video Cleanup Script');
console.log('========================');
console.log('Before running this script:');
console.log('1. Get your auth token from the browser (check Network tab when logged in)');
console.log('2. Replace "your-auth-token-here" with your actual token');
console.log('3. Run: node cleanup-videos.js');
console.log('');

// Uncomment the line below after setting your auth token
// cleanupVideos();
