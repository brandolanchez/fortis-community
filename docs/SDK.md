# Snapie SDK Documentation

The Snapie SDK provides three packages for building Hive blockchain applications:

| Package | Purpose |
|---------|---------|
| **@snapie/renderer** | Render Hive markdown content to sanitized HTML |
| **@snapie/composer** | Rich text editor utilities and React components |
| **@snapie/operations** | Build Hive blockchain operations for broadcasting |

All packages are designed to be **auth-agnostic** - they don't care how you authenticate users. Use Aioha, Keychain, HiveSigner, HiveAuth, or any signing method.

---

## Table of Contents

1. [Installation](#installation)
2. [@snapie/renderer](#snapierenderer)
   - [Basic Usage](#renderer-basic-usage)
   - [Supported Embeds](#supported-embeds)
   - [IPFS Gateway Fallback](#ipfs-gateway-fallback)
3. [@snapie/composer](#snapiecomposer)
   - [Core Utilities](#core-utilities)
   - [React Integration](#react-integration)
4. [@snapie/operations](#snapieoperations)
   - [Building Operations](#building-operations)
   - [Video Module](#video-module)
   - [Audio Module](#audio-module)
5. [Full Examples](#full-examples)

---

## Installation

```bash
# Install all packages
pnpm add @snapie/renderer @snapie/composer @snapie/operations

# Or install what you need:
pnpm add @snapie/renderer              # Just rendering
pnpm add @snapie/composer              # Editor utilities
pnpm add @snapie/operations            # Operation building
```

Optional dependencies:
```bash
pnpm add tus-js-client                 # For video/audio uploads
```

---

## @snapie/renderer

Converts Hive markdown to sanitized HTML with support for embeds, IPFS, and social content.

### Renderer Basic Usage

```typescript
import { renderHiveMarkdown } from '@snapie/renderer';

const markdown = `
# Hello Hive!

Check out this video: https://3speak.tv/watch?v=username/permlink

![photo](https://ipfs.io/ipfs/QmXxx...)

https://twitter.com/elonmusk/status/123456789

Follow @skatehive for more!
`;

const html = renderHiveMarkdown(markdown);
```

### Supported Embeds

| Platform | URLs | Output |
|----------|------|--------|
| **3Speak** | `3speak.tv/watch?v=...` | Responsive iframe |
| **YouTube** | `youtube.com`, `youtu.be` | Responsive iframe |
| **Twitter/X** | `twitter.com`, `x.com` | Scriptless iframe |
| **Instagram** | `instagram.com/p/...`, `/reel/...` | Scriptless iframe |
| **IPFS** | `ipfs.io/ipfs/...` | Multi-gateway fallback |
| **Hive** | `@username`, `hive.blog/...` | Linked references |

### IPFS Gateway Fallback

IPFS content automatically uses multiple gateways for reliability:

```typescript
// Default fallback order:
// 1. https://ipfs.3speak.tv
// 2. https://ipfs.skatehive.app  
// 3. https://cf-ipfs.com
// 4. https://dweb.link

// Video elements get multiple <source> tags:
// <video controls>
//   <source src="https://ipfs.3speak.tv/ipfs/QmXxx">
//   <source src="https://ipfs.skatehive.app/ipfs/QmXxx">
//   ...
// </video>
```

---

## @snapie/composer

Rich text editor utilities for markdown content creation. **Framework-agnostic core** with optional React components.

### Core Utilities

Pure functions that work anywhere - no React, no dependencies:

```typescript
import {
  insertBold,
  insertItalic,
  insertLink,
  insertImage,
  insertCodeBlock,
  insertTable,
  insertSpoiler,
  insertEmoji,
  type TextSelection,
  type InsertResult,
} from '@snapie/composer';

// All functions take: (text, selection) => InsertResult
const text = 'Hello world';
const selection = { start: 0, end: 5 }; // "Hello" selected

const result = insertBold(text, selection);
// result.text = '**Hello** world'
// result.cursorPosition = 9

// Insert an image
const imgResult = insertImage(text, { start: 11, end: 11 }, 'https://...', 'alt text');
// result.text = 'Hello world![alt text](https://...)'
```

#### Available Functions

| Function | Description |
|----------|-------------|
| `insertBold(text, sel)` | Wrap with `**` |
| `insertItalic(text, sel)` | Wrap with `*` |
| `insertUnderline(text, sel)` | Wrap with `<u>` |
| `insertStrikethrough(text, sel)` | Wrap with `~~` |
| `insertLink(text, sel, url?)` | Insert `[text](url)` |
| `insertImage(text, sel, url, alt?)` | Insert `![alt](url)` |
| `insertCodeBlock(text, sel, lang?)` | Insert fenced code block |
| `insertBlockquote(text, sel)` | Prefix line with `> ` |
| `insertBulletList(text, sel)` | Prefix line with `- ` |
| `insertNumberedList(text, sel)` | Prefix line with `1. ` |
| `insertHeader(text, sel, level)` | Prefix with `#` (1-6) |
| `insertTable(text, sel, cols?, rows?)` | Insert markdown table |
| `insertSpoiler(text, sel, title?)` | Hive spoiler syntax |
| `insertEmoji(text, sel, emoji)` | Insert emoji character |
| `insertMention(text, sel, username)` | Insert `@username` |
| `insertGif(text, sel, gifUrl)` | Insert GIF as image |

### React Integration

```typescript
import { useMarkdownEditor, useEditorToolbar } from '@snapie/composer/react';

// Full editor state management
function MyEditor() {
  const { value, onChange, textareaRef, toolbar } = useMarkdownEditor({
    initialValue: '',
    onChange: (v) => console.log('Changed:', v)
  });

  return (
    <div>
      <button onClick={toolbar.bold}>Bold</button>
      <button onClick={toolbar.italic}>Italic</button>
      <button onClick={() => toolbar.header(1)}>H1</button>
      <button onClick={() => toolbar.image('https://...', 'photo')}>
        Insert Image
      </button>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
```

#### Keyboard Shortcuts

The `useMarkdownEditor` hook automatically handles:
- `Ctrl/Cmd + B` → Bold
- `Ctrl/Cmd + I` → Italic
- `Ctrl/Cmd + U` → Underline
- `Ctrl/Cmd + K` → Link
- `Ctrl/Cmd + \`` → Inline code

---

## @snapie/operations

Build Hive blockchain operations for posts, comments, and media uploads.

### Building Operations

```typescript
import { createComposer } from '@snapie/operations';

const composer = createComposer({
  appName: 'my-app',
  defaultTags: ['my-app'],
  beneficiaries: [{ account: 'my-app', weight: 500 }] // 5%
});

// Build a top-level post
const result = composer.build({
  author: 'alice',
  body: 'Hello Hive! #introduction',
  title: 'My First Post',
  parentAuthor: '',              // Empty for top-level posts
  parentPermlink: 'hive-123456', // Community tag
  tags: ['hello', 'newbie'],
});

// result.operations = array of Hive operations
// result.permlink = generated permlink
// result.metadata = json_metadata object

// Broadcast with any auth method
await aioha.signAndBroadcastTx(result.operations, KeyTypes.Posting);
```

### parentPermlink Explained

> ⚠️ **Confusing Hive naming:** The `parentPermlink` field serves different purposes:
> - **For top-level posts:** It's the category/community tag (e.g., `'hive-123456'`, `'blog'`)
> - **For replies:** It's the actual permlink of the post being replied to

```typescript
// Top-level post (parentPermlink = community tag)
composer.build({
  author: 'alice',
  body: 'My post',
  parentAuthor: '',              // Empty
  parentPermlink: 'hive-123456', // Community tag, NOT a permlink!
});

// Reply to a post (parentPermlink = actual permlink)
composer.build({
  author: 'bob',
  body: 'Great post!',
  parentAuthor: 'alice',              // Author of parent
  parentPermlink: 'my-first-post-xyz', // Actual permlink
});
```

### Video Module

```typescript
import { uploadVideoTo3Speak, extractVideoThumbnail } from '@snapie/operations/video';

// Upload video
const result = await uploadVideoTo3Speak(videoFile, {
  apiKey: process.env.THREESPEAK_API_KEY,
  owner: 'username',
  appName: 'my-app',
  onProgress: (progress, status) => {
    console.log(`${progress}% - ${status}`);
  }
});

// result.embedUrl = 'https://3speak.tv/embed?v=...'
// result.videoId = '...'

// Extract thumbnail
const thumbnailBlob = await extractVideoThumbnail(videoFile);
```

### Audio Module

```typescript
import { uploadAudioTo3Speak, createAudioRecorder } from '@snapie/operations/audio';

// Record audio
const recorder = createAudioRecorder();
await recorder.start();
// ... user speaks ...
const audioBlob = await recorder.stop();

// Upload
const embedUrl = await uploadAudioTo3Speak(audioBlob, {
  apiKey: process.env.THREESPEAK_API_KEY,
  owner: 'username',
  onProgress: (progress) => console.log(`${progress}%`)
});
```

---

## Full Examples

### Complete Blog Editor

```typescript
import { renderHiveMarkdown } from '@snapie/renderer';
import { useMarkdownEditor } from '@snapie/composer/react';
import { createComposer } from '@snapie/operations';
import { useAioha } from '@aioha/react-ui';

function BlogEditor() {
  const { user, aioha } = useAioha();
  const { value, onChange, textareaRef, toolbar } = useMarkdownEditor();
  const [title, setTitle] = useState('');
  
  const composer = createComposer({
    appName: 'my-blog',
    beneficiaries: [{ account: 'my-blog', weight: 300 }]
  });
  
  const handlePublish = async () => {
    const result = composer.build({
      author: user!,
      body: value,
      title,
      parentAuthor: '',
      parentPermlink: 'blog',
    });
    
    await aioha.signAndBroadcastTx(result.operations, KeyTypes.Posting);
  };
  
  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      
      {/* Toolbar */}
      <div>
        <button onClick={toolbar.bold}>B</button>
        <button onClick={toolbar.italic}>I</button>
        <button onClick={() => toolbar.header(2)}>H2</button>
      </div>
      
      {/* Editor */}
      <textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} />
      
      {/* Preview */}
      <div dangerouslySetInnerHTML={{ __html: renderHiveMarkdown(value) }} />
      
      <button onClick={handlePublish}>Publish</button>
    </div>
  );
}
```

### Snap Composer (Quick Posts)

```typescript
import { createComposer } from '@snapie/operations';
import { uploadVideoTo3Speak } from '@snapie/operations/video';

async function postSnap(body: string, videoFile?: File) {
  const composer = createComposer({ appName: 'snapie' });
  
  let videoEmbedUrl: string | undefined;
  
  if (videoFile) {
    const result = await uploadVideoTo3Speak(videoFile, {
      apiKey: API_KEY,
      owner: username,
    });
    videoEmbedUrl = result.embedUrl;
  }
  
  const result = composer.build({
    author: username,
    body,
    videoEmbedUrl,
    parentAuthor: '',
    parentPermlink: 'hive-173115', // Skatehive community
  });
  
  await aioha.signAndBroadcastTx(result.operations, KeyTypes.Posting);
}
```

---

## Beneficiary Weight Reference

| Percentage | Weight Value |
|------------|--------------|
| 1% | 100 |
| 5% | 500 |
| 10% | 1000 |
| 25% | 2500 |
| 50% | 5000 |
| 100% | 10000 |

---

## TypeScript Support

All packages include full TypeScript definitions:

```typescript
import type { TextSelection, InsertResult } from '@snapie/composer';
import type { Beneficiary, CommentInput, ComposerConfig } from '@snapie/operations';
import type { VideoUploadOptions, VideoUploadResult } from '@snapie/operations/video';
```
