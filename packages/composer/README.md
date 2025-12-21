# @snapie/composer

Rich markdown editor utilities and React components for **Hive blockchain** content creation.

[![npm version](https://img.shields.io/npm/v/@snapie/composer.svg)](https://www.npmjs.com/package/@snapie/composer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @snapie/composer
# or
pnpm add @snapie/composer
# or
yarn add @snapie/composer
```

## Features

- 🔧 **Framework-agnostic** core utilities (pure functions)
- ⚛️ **React components** with Chakra UI (optional)
- 📝 Full markdown formatting support (bold, italic, code, etc.)
- 🖼️ Image, video, and link insertion
- 📋 Table generation utilities
- 😊 Emoji picker with common categories
- 🎯 Cursor position management

## Usage

### Core Utilities (Framework-Agnostic)

Pure functions for markdown manipulation that work anywhere:

```typescript
import { 
  insertBold, 
  insertItalic, 
  insertImage, 
  insertLink,
  insertCodeBlock,
  insertTable
} from '@snapie/composer';

// Text formatting
const result = insertBold('Hello world', { start: 0, end: 5 });
// result.text = '**Hello** world'
// result.cursorPosition = 9

// Insert an image
const imgResult = insertImage(
  'Check this out: ', 
  { start: 16, end: 16 },
  'https://example.com/image.jpg',
  'My cool image'
);
// result.text = 'Check this out: ![My cool image](https://example.com/image.jpg)'

// Insert a link
const linkResult = insertLink(
  'Visit our site',
  { start: 0, end: 14 },
  'https://hive.io'
);
// result.text = '[Visit our site](https://hive.io)'

// Insert a code block
const codeResult = insertCodeBlock(
  '',
  { start: 0, end: 0 },
  'javascript'
);
// result.text = '```javascript\ncode here\n```'

// Generate a table
const tableResult = insertTable('', { start: 0, end: 0 }, 3, 2);
// Creates a 3-column, 2-row markdown table
```

### React Components (Optional)

Pre-built React components with Chakra UI styling:

```tsx
import { MarkdownEditor, EditorToolbar, useMarkdownEditor } from '@snapie/composer/react';

function MyEditor() {
  const { 
    value, 
    setValue, 
    textareaRef,
    handleBold,
    handleItalic,
    handleImage,
    handleLink
  } = useMarkdownEditor('');

  const handleImageUpload = async (file: File) => {
    // Upload to IPFS/Hive and return URL
    const url = await uploadToIPFS(file);
    return url;
  };

  return (
    <div>
      <EditorToolbar
        onBold={handleBold}
        onItalic={handleItalic}
        onImage={() => {/* open image picker */}}
        onLink={handleLink}
      />
      <MarkdownEditor
        value={value}
        onChange={setValue}
        textareaRef={textareaRef}
        placeholder="Write your post..."
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}
```

## API Reference

### Text Formatting

| Function | Description |
|----------|-------------|
| `insertBold(text, selection)` | Wrap selection with `**bold**` |
| `insertItalic(text, selection)` | Wrap selection with `*italic*` |
| `insertUnderline(text, selection)` | Wrap selection with `<u>underline</u>` |
| `insertStrikethrough(text, selection)` | Wrap selection with `~~strikethrough~~` |
| `insertInlineCode(text, selection)` | Wrap selection with `` `code` `` |

### Block Elements

| Function | Description |
|----------|-------------|
| `insertLink(text, selection, url)` | Insert a markdown link |
| `insertImage(text, selection, url, alt)` | Insert a markdown image |
| `insertCodeBlock(text, selection, lang)` | Insert a fenced code block |
| `insertBlockquote(text, selection)` | Insert a blockquote |
| `insertTable(text, selection, cols, rows)` | Generate a markdown table |

### Headings

| Function | Description |
|----------|-------------|
| `insertHeading(text, selection, level)` | Insert heading (h1-h6) |

### Lists

| Function | Description |
|----------|-------------|
| `insertBulletList(text, selection)` | Insert bullet list |
| `insertNumberedList(text, selection)` | Insert numbered list |
| `insertTaskList(text, selection)` | Insert task/checkbox list |

### Emojis

```typescript
import { COMMON_EMOJIS, ALL_COMMON_EMOJIS, insertEmoji } from '@snapie/composer';

// Categorized emojis
COMMON_EMOJIS.reactions  // ['😊', '😂', '❤️', ...]
COMMON_EMOJIS.expressions // ['😢', '😎', '🙄', ...]
COMMON_EMOJIS.symbols    // ['🚀', '⭐', '💪', ...]

// Insert emoji at cursor
const result = insertEmoji('Hello ', { start: 6, end: 6 }, '🚀');
// result.text = 'Hello 🚀'
```

## Types

```typescript
interface TextSelection {
  start: number;  // Start position (0-indexed)
  end: number;    // End position (0-indexed)
}

interface InsertResult {
  text: string;           // The modified text
  cursorPosition: number; // Where to place cursor after insertion
  selection?: TextSelection; // Optional selection range
}
```

## Peer Dependencies

For React components (`@snapie/composer/react`):

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@chakra-ui/react": "^2.8.0"
}
```

## Related Packages

- [@snapie/renderer](https://www.npmjs.com/package/@snapie/renderer) - Render Hive markdown with 3Speak, IPFS embeds

## License

MIT © [Mantequilla-Soft](https://github.com/Mantequilla-Soft)
