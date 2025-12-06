# @snapie/composer

Rich text editor utilities for markdown content creation on Hive.

## Overview

`@snapie/composer` provides two layers:

1. **Core utilities** - Framework-agnostic pure functions for markdown manipulation
2. **React components** - Optional React hooks built on the core utilities

## Installation

```bash
pnpm add @snapie/composer
```

## Core Utilities

Pure functions with no dependencies - work anywhere (React, Vue, Svelte, vanilla JS):

```typescript
import {
  insertBold,
  insertItalic,
  insertLink,
  insertImage,
  type TextSelection,
  type InsertResult
} from '@snapie/composer';
```

### API

All editing functions follow the same pattern:

```typescript
function insertXxx(
  text: string,           // Current text content
  selection: TextSelection // { start: number, end: number }
): InsertResult          // { text: string, cursorPosition: number, selection?: TextSelection }
```

### Example

```typescript
const text = 'Hello world';
const selection = { start: 0, end: 5 }; // "Hello" is selected

// Wrap selection with bold markers
const result = insertBold(text, selection);
console.log(result.text);           // '**Hello** world'
console.log(result.cursorPosition); // 9 (after the closing **)
```

### Available Functions

#### Text Formatting

```typescript
insertBold(text, sel)          // **text**
insertItalic(text, sel)        // *text*
insertUnderline(text, sel)     // <u>text</u>
insertStrikethrough(text, sel) // ~~text~~
insertInlineCode(text, sel)    // `text`
```

#### Block Elements

```typescript
insertBlockquote(text, sel)    // > text
insertBulletList(text, sel)    // - text
insertNumberedList(text, sel)  // 1. text
insertCodeBlock(text, sel, language?) // ```lang\ntext\n```
```

#### Headers

```typescript
insertHeader(text, sel, level) // level 1-6
insertH1(text, sel)            // # text
insertH2(text, sel)            // ## text
insertH3(text, sel)            // ### text
insertH4(text, sel)            // #### text
insertH5(text, sel)            // ##### text
insertH6(text, sel)            // ###### text
```

#### Links & Media

```typescript
insertLink(text, sel, url?)           // [text](url)
insertImage(text, sel, url, alt?)     // ![alt](url)
insertGif(text, sel, gifUrl)          // ![gif](url)
```

#### Special Elements

```typescript
insertTable(text, sel, cols?, rows?)  // | Header | Header |
insertSpoiler(text, sel, title?)      // >! [title] content (Hive-specific)
insertHorizontalRule(text, sel)       // ---
insertEmoji(text, sel, emoji)         // 😊
insertMention(text, sel, username)    // @username
```

### Utility Functions

```typescript
// Get selection from a textarea element
const selection = getSelectionFromTextarea(textareaElement);

// Apply an InsertResult to a textarea
applyToTextarea(textareaElement, result, onChange);

// Create keyboard shortcut handler
const handler = createKeyboardHandler(getText, getSelection, applyResult);
```

### Emoji Constants

```typescript
import { COMMON_EMOJIS, ALL_COMMON_EMOJIS } from '@snapie/composer';

console.log(COMMON_EMOJIS.reactions);  // ['😊', '😂', '❤️', ...]
console.log(COMMON_EMOJIS.expressions); // ['😢', '😎', '🙄', ...]
console.log(COMMON_EMOJIS.symbols);     // ['🚀', '⭐', '💪', ...]
console.log(ALL_COMMON_EMOJIS);         // All emojis flattened
```

---

## React Integration

```typescript
import { useMarkdownEditor, useEditorToolbar } from '@snapie/composer/react';
```

### useMarkdownEditor

Full editor state management with keyboard shortcuts:

```typescript
function MyEditor() {
  const {
    value,        // Current markdown string
    onChange,     // (newValue: string) => void
    textareaRef,  // React.RefObject<HTMLTextAreaElement>
    toolbar,      // Object with all editing functions
    getSelection, // () => TextSelection
  } = useMarkdownEditor({
    initialValue: '',
    onChange: (v) => console.log('Changed:', v)
  });

  return (
    <div>
      {/* Toolbar buttons */}
      <button onClick={toolbar.bold}>Bold</button>
      <button onClick={toolbar.italic}>Italic</button>
      <button onClick={() => toolbar.header(2)}>H2</button>
      <button onClick={() => toolbar.link('https://hive.io')}>Link</button>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
```

#### Toolbar Methods

The `toolbar` object provides these methods:

```typescript
toolbar.bold()
toolbar.italic()
toolbar.underline()
toolbar.strikethrough()
toolbar.link(url?: string)
toolbar.image(url: string, alt?: string)
toolbar.codeBlock(language?: string)
toolbar.blockquote()
toolbar.bulletList()
toolbar.numberedList()
toolbar.header(level: 1 | 2 | 3 | 4 | 5 | 6)
toolbar.table(cols?: number, rows?: number)
toolbar.spoiler(title?: string)
toolbar.emoji(emoji: string)
toolbar.gif(url: string)
```

#### Built-in Keyboard Shortcuts

Automatically enabled when using `useMarkdownEditor`:

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + K` | Insert Link |
| `Ctrl/Cmd + \`` | Inline Code |

### useEditorToolbar

Headless hook if you want to manage state yourself:

```typescript
function MyCustomEditor() {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const toolbar = useEditorToolbar(textareaRef, value, setValue);
  
  return (
    <div>
      <button onClick={toolbar.bold}>B</button>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
```

---

## Full Example with Preview

```typescript
import { useMarkdownEditor } from '@snapie/composer/react';
import { renderHiveMarkdown } from '@snapie/renderer';

function MarkdownEditorWithPreview() {
  const { value, onChange, textareaRef, toolbar } = useMarkdownEditor();
  const [showPreview, setShowPreview] = useState(false);
  
  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={toolbar.bold} title="Bold (Ctrl+B)">B</button>
        <button onClick={toolbar.italic} title="Italic (Ctrl+I)">I</button>
        <button onClick={toolbar.underline} title="Underline (Ctrl+U)">U</button>
        <button onClick={() => toolbar.header(2)}>H2</button>
        <button onClick={toolbar.blockquote}>Quote</button>
        <button onClick={toolbar.bulletList}>• List</button>
        <button onClick={() => toolbar.link()}>Link</button>
        <span className="divider" />
        <button onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      
      {/* Editor / Preview */}
      {showPreview ? (
        <div 
          className="preview"
          dangerouslySetInnerHTML={{ __html: renderHiveMarkdown(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your content..."
        />
      )}
    </div>
  );
}
```

---

## TypeScript Types

```typescript
interface TextSelection {
  start: number;  // 0-indexed start position
  end: number;    // 0-indexed end position
}

interface InsertResult {
  text: string;           // The modified text
  cursorPosition: number; // Where to place cursor
  selection?: TextSelection; // Optional: select this range
}
```
