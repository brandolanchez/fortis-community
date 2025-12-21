# @snapie/renderer

Hive blockchain markdown renderer with **3Speak**, **IPFS**, and media embed support.

[![npm version](https://img.shields.io/npm/v/@snapie/renderer.svg)](https://www.npmjs.com/package/@snapie/renderer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @snapie/renderer
# or
pnpm add @snapie/renderer
# or
yarn add @snapie/renderer
```

## Features

- 🎬 **3Speak video/audio embeds** - Automatic iframe embedding
- 📁 **IPFS content handling** - Multiple gateway fallbacks
- 🔗 **Hive URL conversion** - Converts peakd, ecency, hive.blog links
- 🐦 **Twitter/X embeds** - Embedded tweets support
- 🛡️ **XSS protection** - DOMPurify sanitization built-in
- ⚡ **Isomorphic** - Works in Node.js and browser

## Quick Start

```typescript
import { createHiveRenderer, renderHiveMarkdown } from '@snapie/renderer';

// Simple usage with defaults
const html = renderHiveMarkdown('# Hello Hive!\n\nCheck out this video: https://3speak.tv/watch?v=user/video123');

// Custom configuration
const renderer = createHiveRenderer({
  ipfsGateway: 'https://ipfs.skatehive.app',
  convertHiveUrls: true,
  internalUrlPrefix: ''
});

const html = renderer.render('Your markdown content here...');
```

## Usage Examples

### Basic Rendering

```typescript
import { renderHiveMarkdown } from '@snapie/renderer';

const markdown = `
# My Hive Post

Hello **Hive** community! 🚀

Check out this video:
https://3speak.tv/watch?v=skatehive/abcd1234

![My Image](ipfs://QmXxx.../image.jpg)
`;

const html = renderHiveMarkdown(markdown);
```

### With Custom Options

```typescript
import { createHiveRenderer } from '@snapie/renderer';

const renderer = createHiveRenderer({
  // Primary IPFS gateway
  ipfsGateway: 'https://ipfs.skatehive.app',
  
  // Fallback gateways
  ipfsFallbackGateways: [
    'https://ipfs.3speak.tv',
    'https://cloudflare-ipfs.com',
    'https://ipfs.io'
  ],
  
  // Convert Hive frontend URLs to internal links
  convertHiveUrls: true,
  internalUrlPrefix: '',
  
  // Additional frontends to recognize
  additionalHiveFrontends: ['skatehive.app'],
  
  // Custom user mention URLs
  usertagUrlFn: (account) => `/@${account}`,
  
  // Custom hashtag URLs
  hashtagUrlFn: (hashtag) => `/trending/${hashtag}`,
  
  // Asset dimensions
  assetsWidth: 640,
  assetsHeight: 480
});

const html = renderer.render(markdown);
```

### IPFS Content

```typescript
import { createIpfsUrl, isIpfsContent, extractIpfsHash } from '@snapie/renderer';

// Create gateway URL from IPFS hash
const url = createIpfsUrl('QmXxx...', 'https://ipfs.skatehive.app');
// => 'https://ipfs.skatehive.app/ipfs/QmXxx...'

// Check if content is IPFS
isIpfsContent('ipfs://QmXxx...');  // true
isIpfsContent('https://ipfs.io/ipfs/QmXxx...');  // true

// Extract hash from various formats
extractIpfsHash('ipfs://QmXxx.../file.jpg');  // 'QmXxx.../file.jpg'
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `'https://hive.blog/'` | Base URL for relative links |
| `ipfsGateway` | `string` | `'https://ipfs.3speak.tv'` | Primary IPFS gateway |
| `ipfsFallbackGateways` | `string[]` | `[skatehive, cloudflare, ipfs.io]` | Fallback IPFS gateways |
| `convertHiveUrls` | `boolean` | `true` | Convert Hive frontend URLs |
| `internalUrlPrefix` | `string` | `''` | Prefix for internal links |
| `usertagUrlFn` | `function` | `(acc) => '/@' + acc` | User mention URL generator |
| `hashtagUrlFn` | `function` | `(tag) => '/trending/' + tag` | Hashtag URL generator |
| `additionalHiveFrontends` | `string[]` | `[]` | Extra Hive frontends to recognize |
| `assetsWidth` | `number` | - | Default asset width |
| `assetsHeight` | `number` | - | Default asset height |
| `imageProxyFn` | `function` | - | Custom image proxy function |

## Supported Embeds

### 3Speak Videos
```markdown
https://3speak.tv/watch?v=username/permlink
https://play.3speak.tv/watch?v=username/permlink
https://play.3speak.tv/embed?v=username/permlink
```

### 3Speak Audio
```markdown
https://audio.3speak.tv/play?a=username/audiolink
```

### Twitter/X
```markdown
https://twitter.com/user/status/123456789
https://x.com/user/status/123456789
```

### IPFS Content
```markdown
ipfs://QmHash.../path/to/file.jpg
https://ipfs.io/ipfs/QmHash...
https://gateway.pinata.cloud/ipfs/QmHash...
```

## Recognized Hive Frontends

URLs from these frontends are automatically converted:
- peakd.com
- ecency.com
- hive.blog
- hiveblog.io
- leofinance.io
- 3speak.tv
- d.tube
- esteem.app
- busy.org

## Security

This package uses **DOMPurify** to sanitize all HTML output, protecting against:
- XSS attacks
- Script injection
- Malicious iframes
- Event handler injection

Allowed HTML elements are whitelisted (headings, formatting, tables, media embeds, etc.)

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `createHiveRenderer(options?)` | Create a configured renderer instance |
| `renderHiveMarkdown(markdown, options?)` | One-shot render with options |
| `createIpfsUrl(hash, gateway?)` | Generate IPFS gateway URL |
| `isIpfsContent(url)` | Check if URL is IPFS content |
| `extractIpfsHash(url)` | Extract IPFS hash from URL |

### Types

```typescript
interface HiveRendererOptions {
  baseUrl?: string;
  ipfsGateway?: string;
  ipfsFallbackGateways?: string[];
  usertagUrlFn?: (account: string) => string;
  hashtagUrlFn?: (hashtag: string) => string;
  additionalHiveFrontends?: string[];
  convertHiveUrls?: boolean;
  internalUrlPrefix?: string;
  assetsWidth?: number;
  assetsHeight?: number;
  imageProxyFn?: (url: string) => string;
}

interface HiveRenderer {
  render(markdown: string): string;
}
```

## Related Packages

- [@snapie/composer](https://www.npmjs.com/package/@snapie/composer) - Markdown editor utilities for Hive

## License

MIT © [Mantequilla-Soft](https://github.com/Mantequilla-Soft)
