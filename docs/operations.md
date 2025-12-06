# @snapie/operations

Build Hive blockchain operations for posts, comments, and media uploads.

## Overview

`@snapie/operations` is an **operation builder** - it takes your content and creates ready-to-broadcast Hive operations. It's auth-agnostic, working with Aioha, Keychain, HiveSigner, or any signing method.

## Installation

```bash
pnpm add @snapie/operations

# Optional: for video/audio uploads
pnpm add tus-js-client
```

## Modular Structure

```
@snapie/operations          # Core operation building
@snapie/operations/video    # 3Speak video uploads
@snapie/operations/audio    # 3Speak audio uploads
```

---

## Core Module

```typescript
import { createComposer, type Beneficiary } from '@snapie/operations';
```

### createComposer

Create a configured composer instance:

```typescript
const composer = createComposer({
  appName: 'my-app',              // Shows in json_metadata.app
  defaultTags: ['my-app'],        // Added to all posts
  beneficiaries: [                // Default beneficiaries
    { account: 'my-app', weight: 500 }  // 5%
  ]
});
```

### composer.build()

Build Hive operations for a post or comment:

```typescript
const result = composer.build({
  // Required
  author: 'alice',
  body: 'Hello Hive! #introduction',
  parentAuthor: '',              // Empty for top-level posts
  parentPermlink: 'hive-123456', // Category/community tag for posts
  
  // Optional
  title: 'My First Post',
  tags: ['hello', 'newbie'],
  images: ['https://...'],       // Appended to body
  videoEmbedUrl: 'https://3speak.tv/embed?v=...',
  audioEmbedUrl: 'https://3speak.tv/embed?v=...',
  beneficiaries: [               // Override defaults
    { account: 'someone', weight: 1000 }
  ],
  permlink: 'custom-permlink',   // Or auto-generated
  maxAcceptedPayout: '1000000.000 HBD',
  percentHbd: 10000,             // 100% HBD
  allowVotes: true,
  allowCurationRewards: true,
});

// Returns:
// {
//   operations: Operation[],  // Ready for broadcast
//   permlink: string,         // The post permlink
//   metadata: object,         // The json_metadata
// }
```

### Understanding parentPermlink

> ⚠️ **This naming is confusing** - it comes from Hive's protocol and serves different purposes:

| Post Type | parentAuthor | parentPermlink |
|-----------|--------------|----------------|
| **Top-level post** | `''` (empty) | Category/community tag (e.g., `'hive-123456'`, `'blog'`) |
| **Reply/Comment** | Author of parent | Actual permlink of parent post |

```typescript
// TOP-LEVEL POST to a community
composer.build({
  author: 'alice',
  body: 'My post content',
  parentAuthor: '',              // Empty!
  parentPermlink: 'hive-123456', // This is NOT a permlink, it's the community tag
  title: 'My Post Title',
});

// REPLY to someone's post
composer.build({
  author: 'bob',
  body: 'Great post!',
  parentAuthor: 'alice',              // The post author
  parentPermlink: 'my-post-xyz123',   // The actual permlink of alice's post
  // No title for comments
});
```

### Broadcasting

```typescript
import { useAioha } from '@aioha/react-ui';
import { KeyTypes } from '@aioha/aioha';

const { aioha } = useAioha();

// Build the operations
const result = composer.build({ ... });

// Broadcast with Aioha
await aioha.signAndBroadcastTx(result.operations, KeyTypes.Posting);
```

---

## Video Module

```typescript
import {
  uploadVideoTo3Speak,
  extractVideoThumbnail,
  uploadToIPFS,
  set3SpeakThumbnail,
  extractVideoIdFromEmbedUrl,
} from '@snapie/operations/video';
```

### uploadVideoTo3Speak

Upload a video file to 3Speak:

```typescript
const result = await uploadVideoTo3Speak(videoFile, {
  apiKey: process.env.THREESPEAK_API_KEY!,
  owner: 'username',
  appName: 'my-app',                    // Optional
  onProgress: (progress, status) => {   // Optional
    // progress: 0-100
    // status: 'uploading' | 'processing' | 'complete' | 'error'
    console.log(`${progress}% - ${status}`);
  }
});

// Returns:
// {
//   embedUrl: 'https://3speak.tv/embed?v=username/videoId',
//   videoId: 'abc123',
// }
```

### extractVideoThumbnail

Extract a thumbnail frame from a video:

```typescript
const thumbnailBlob = await extractVideoThumbnail(videoFile);
// Returns a Blob of the thumbnail image (JPEG)
```

### uploadToIPFS

Upload a file to IPFS (via 3Speak's gateway):

```typescript
const ipfsUrl = await uploadToIPFS(blob);
// Returns: 'https://ipfs.3speak.tv/ipfs/QmXxx...'
```

### Full Video Upload Example

```typescript
async function uploadVideo(videoFile: File, username: string) {
  const apiKey = process.env.THREESPEAK_API_KEY!;
  
  // Start upload and thumbnail extraction in parallel
  const [videoResult, thumbnailBlob] = await Promise.all([
    uploadVideoTo3Speak(videoFile, {
      apiKey,
      owner: username,
      onProgress: (p) => setProgress(p)
    }),
    extractVideoThumbnail(videoFile).catch(() => null)
  ]);
  
  // Set thumbnail if we got one
  if (thumbnailBlob && videoResult.videoId) {
    const thumbnailUrl = await uploadToIPFS(thumbnailBlob);
    await set3SpeakThumbnail(videoResult.videoId, thumbnailUrl, apiKey);
  }
  
  return videoResult.embedUrl;
}
```

---

## Audio Module

```typescript
import {
  uploadAudioTo3Speak,
  createAudioRecorder,
} from '@snapie/operations/audio';
```

### createAudioRecorder

Create a browser audio recorder:

```typescript
const recorder = createAudioRecorder();

// Start recording
await recorder.start();

// ... user speaks ...

// Stop and get the audio
const audioBlob = await recorder.stop();
```

### uploadAudioTo3Speak

Upload audio to 3Speak:

```typescript
const embedUrl = await uploadAudioTo3Speak(audioBlob, {
  apiKey: process.env.THREESPEAK_API_KEY!,
  owner: 'username',
  onProgress: (progress, status) => {
    console.log(`${progress}% - ${status}`);
  }
});

// Returns: 'https://3speak.tv/embed?v=username/audioId'
```

---

## Beneficiary Reference

| Percentage | Weight |
|------------|--------|
| 1% | 100 |
| 2.5% | 250 |
| 5% | 500 |
| 10% | 1000 |
| 15% | 1500 |
| 25% | 2500 |
| 50% | 5000 |
| 100% | 10000 |

```typescript
const beneficiaries: Beneficiary[] = [
  { account: 'app-dev', weight: 500 },    // 5%
  { account: 'community', weight: 300 },  // 3%
];
```

---

## TypeScript Types

```typescript
interface Beneficiary {
  account: string;
  weight: number;  // Basis points (100 = 1%)
}

interface CommentInput {
  author: string;
  body: string;
  parentAuthor: string;
  parentPermlink: string;
  title?: string;
  tags?: string[];
  images?: string[];
  videoEmbedUrl?: string;
  audioEmbedUrl?: string;
  beneficiaries?: Beneficiary[];
  permlink?: string;
  maxAcceptedPayout?: string;
  percentHbd?: number;
  allowVotes?: boolean;
  allowCurationRewards?: boolean;
}

interface ComposerConfig {
  appName?: string;
  defaultTags?: string[];
  beneficiaries?: Beneficiary[];
}

interface ComposerResult {
  operations: Operation[];
  permlink: string;
  metadata: object;
}

interface VideoUploadOptions {
  apiKey: string;
  owner: string;
  appName?: string;
  onProgress?: (progress: number, status: string) => void;
}

interface VideoUploadResult {
  embedUrl: string;
  videoId: string;
}
```
