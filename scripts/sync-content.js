#!/usr/bin/env node

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

// Validate required environment variables
const required = ['R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_ACCOUNT_ID'];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please ensure your .env file contains all required R2 credentials.');
  process.exit(1);
}

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const CONTENT_DIR = path.join(rootDir, 'src', 'content');

// Content type mapping
const CONTENT_MAPPINGS = {
  'blog/': 'blog',
  'works/': 'works',
  'icons/': 'icons',
  'links/': 'links',
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error.message);
  }
}

async function downloadObject(key, targetPath) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await r2Client.send(command);
    const stream = response.Body;
    
    // Ensure parent directory exists
    await ensureDirectoryExists(path.dirname(targetPath));
    
    // Convert stream to buffer and save
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    await fs.writeFile(targetPath, buffer);
    console.log(`✓ Downloaded: ${key} → ${path.relative(rootDir, targetPath)}`);
  } catch (error) {
    console.error(`✗ Failed to download ${key}:`, error.message);
  }
}

async function syncContent() {
  console.log('🚀 Starting content sync from R2 bucket...\n');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Target: ${path.relative(rootDir, CONTENT_DIR)}\n`);

  // Ensure content directory exists
  await ensureDirectoryExists(CONTENT_DIR);

  // Create subdirectories
  for (const subdir of Object.values(CONTENT_MAPPINGS)) {
    await ensureDirectoryExists(path.join(CONTENT_DIR, subdir));
  }

  let totalDownloaded = 0;
  let continuationToken = undefined;

  try {
    do {
      // List objects in bucket
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const listResponse = await r2Client.send(listCommand);
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        if (totalDownloaded === 0) {
          console.log('⚠️  No content found in bucket.');
        }
        break;
      }

      // Process each object
      for (const object of listResponse.Contents) {
        const key = object.Key;
        
        // Skip directories
        if (key.endsWith('/')) continue;
        
        // Determine target path based on prefix
        let targetSubdir = null;
        for (const [prefix, subdir] of Object.entries(CONTENT_MAPPINGS)) {
          if (key.startsWith(prefix)) {
            targetSubdir = subdir;
            break;
          }
        }
        
        if (!targetSubdir) {
          console.log(`⚠️  Skipping ${key} (no mapping found)`);
          continue;
        }
        
        // Calculate target path
        const relativePath = key.substring(key.indexOf('/') + 1);
        const targetPath = path.join(CONTENT_DIR, targetSubdir, relativePath);
        
        // Download the file
        await downloadObject(key, targetPath);
        totalDownloaded++;
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    console.log(`\n✅ Content sync complete! Downloaded ${totalDownloaded} files.`);
  } catch (error) {
    console.error('\n❌ Error during content sync:', error.message);
    console.error('\nPlease check your R2 credentials and bucket configuration.');
    process.exit(1);
  }
}

// Run the sync
syncContent().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});