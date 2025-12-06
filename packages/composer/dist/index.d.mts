/**
 * @snapie/composer
 *
 * Rich markdown editor utilities for Hive blockchain content creation.
 *
 * This package provides two layers:
 *
 * ## Core Utilities (Framework-Agnostic)
 *
 * Pure functions for markdown manipulation that work anywhere:
 *
 * ```typescript
 * import { insertBold, insertImage, insertLink } from '@snapie/composer';
 *
 * // These return { text, cursorPosition } - you handle the UI
 * const result = insertBold('Hello world', { start: 0, end: 5 });
 * // result.text = '**Hello** world'
 * // result.cursorPosition = 9
 * ```
 *
 * ## React Components (Optional)
 *
 * Pre-built React components with Chakra UI:
 *
 * ```typescript
 * import { MarkdownEditor, EditorToolbar } from '@snapie/composer/react';
 *
 * <MarkdownEditor
 *   value={markdown}
 *   onChange={setMarkdown}
 *   onImageUpload={uploadToHive}
 * />
 * ```
 *
 * @packageDocumentation
 */
/**
 * Selection range in text
 */
interface TextSelection {
    /** Start position (0-indexed) */
    start: number;
    /** End position (0-indexed) */
    end: number;
}
/**
 * Result of a markdown insertion operation
 */
interface InsertResult {
    /** The modified text */
    text: string;
    /** Where to place the cursor after insertion */
    cursorPosition: number;
    /** Optional selection range (for selecting inserted text) */
    selection?: TextSelection;
}
/**
 * Common emoji categories for quick access
 */
declare const COMMON_EMOJIS: {
    readonly reactions: readonly ["😊", "😂", "❤️", "👍", "👎", "🔥", "💯", "🎉", "😍", "🤔"];
    readonly expressions: readonly ["😢", "😎", "🙄", "😴", "🤗", "🤩", "😬", "😱", "🤯", "😇"];
    readonly symbols: readonly ["🚀", "⭐", "💪", "👏", "🙌", "🤝", "💰", "📈", "📉", "💎"];
};
/**
 * Flattened list of all common emojis
 */
declare const ALL_COMMON_EMOJIS: ("😊" | "😂" | "❤️" | "👍" | "👎" | "🔥" | "💯" | "🎉" | "😍" | "🤔" | "😢" | "😎" | "🙄" | "😴" | "🤗" | "🤩" | "😬" | "😱" | "🤯" | "😇" | "🚀" | "⭐" | "💪" | "👏" | "🙌" | "🤝" | "💰" | "📈" | "📉" | "💎")[];
/**
 * Wrap selected text with bold markers
 *
 * @example
 * ```typescript
 * const result = insertBold('Hello world', { start: 0, end: 5 });
 * // result.text = '**Hello** world'
 * ```
 */
declare function insertBold(text: string, selection: TextSelection): InsertResult;
/**
 * Wrap selected text with italic markers
 */
declare function insertItalic(text: string, selection: TextSelection): InsertResult;
/**
 * Wrap selected text with underline HTML tags
 */
declare function insertUnderline(text: string, selection: TextSelection): InsertResult;
/**
 * Wrap selected text with strikethrough markers
 */
declare function insertStrikethrough(text: string, selection: TextSelection): InsertResult;
/**
 * Wrap selected text with inline code markers
 */
declare function insertInlineCode(text: string, selection: TextSelection): InsertResult;
/**
 * Insert a link at cursor/selection
 * If text is selected, it becomes the link text
 */
declare function insertLink(text: string, selection: TextSelection, url?: string): InsertResult;
/**
 * Insert an image at cursor
 */
declare function insertImage(text: string, selection: TextSelection, url: string, altText?: string): InsertResult;
/**
 * Insert a code block
 */
declare function insertCodeBlock(text: string, selection: TextSelection, language?: string): InsertResult;
/**
 * Insert a blockquote
 */
declare function insertBlockquote(text: string, selection: TextSelection): InsertResult;
/**
 * Insert a bullet list item
 */
declare function insertBulletList(text: string, selection: TextSelection): InsertResult;
/**
 * Insert a numbered list item
 */
declare function insertNumberedList(text: string, selection: TextSelection): InsertResult;
/**
 * Insert a header at the specified level (1-6)
 */
declare function insertHeader(text: string, selection: TextSelection, level: 1 | 2 | 3 | 4 | 5 | 6): InsertResult;
/**
 * Convenience functions for specific header levels
 */
declare const insertH1: (text: string, sel: TextSelection) => InsertResult;
declare const insertH2: (text: string, sel: TextSelection) => InsertResult;
declare const insertH3: (text: string, sel: TextSelection) => InsertResult;
declare const insertH4: (text: string, sel: TextSelection) => InsertResult;
declare const insertH5: (text: string, sel: TextSelection) => InsertResult;
declare const insertH6: (text: string, sel: TextSelection) => InsertResult;
/**
 * Insert a markdown table
 */
declare function insertTable(text: string, selection: TextSelection, columns?: number, rows?: number): InsertResult;
/**
 * Insert a spoiler block (Hive-specific syntax)
 */
declare function insertSpoiler(text: string, selection: TextSelection, title?: string): InsertResult;
/**
 * Insert a horizontal rule
 */
declare function insertHorizontalRule(text: string, selection: TextSelection): InsertResult;
/**
 * Insert an emoji
 */
declare function insertEmoji(text: string, selection: TextSelection, emoji: string): InsertResult;
/**
 * Insert a Hive user mention
 */
declare function insertMention(text: string, selection: TextSelection, username: string): InsertResult;
/**
 * Insert a GIF from Giphy
 */
declare function insertGif(text: string, selection: TextSelection, gifUrl: string): InsertResult;
/**
 * Get the current selection from a textarea element
 */
declare function getSelectionFromTextarea(textarea: HTMLTextAreaElement): TextSelection;
/**
 * Apply an insert result to a textarea and restore cursor position
 */
declare function applyToTextarea(textarea: HTMLTextAreaElement, result: InsertResult, onChange?: (value: string) => void): void;
/**
 * Create a keyboard shortcut handler for common markdown operations
 */
declare function createKeyboardHandler(getText: () => string, getSelection: () => TextSelection, applyResult: (result: InsertResult) => void): (event: KeyboardEvent) => void;

export { ALL_COMMON_EMOJIS, COMMON_EMOJIS, type InsertResult, type TextSelection, applyToTextarea, createKeyboardHandler, getSelectionFromTextarea, insertBlockquote, insertBold, insertBulletList, insertCodeBlock, insertEmoji, insertGif, insertH1, insertH2, insertH3, insertH4, insertH5, insertH6, insertHeader, insertHorizontalRule, insertImage, insertInlineCode, insertItalic, insertLink, insertMention, insertNumberedList, insertSpoiler, insertStrikethrough, insertTable, insertUnderline };
