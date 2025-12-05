/**
 * @snapie/composer
 * 
 * A headless, auth-agnostic composer SDK for Hive blockchain posts and comments.
 * 
 * ## Modular Structure
 * 
 * This package is split into modules to keep your bundle size small:
 * 
 * - `@snapie/composer` - Core utilities (this module)
 * - `@snapie/composer/video` - 3Speak video upload (optional)
 * - `@snapie/composer/audio` - 3Speak audio upload (optional)
 * 
 * ## Features
 * 
 * - **Auth-agnostic**: Works with Aioha, Keychain, HiveSigner, or any signing method
 * - **No UI dependencies**: Bring your own React/Vue/Svelte components
 * - **Tree-shakeable**: Only import what you need
 * - **TypeScript-first**: Full type definitions included
 * 
 * @example Basic Usage
 * ```typescript
 * import { createComposer } from '@snapie/composer';
 * 
 * const composer = createComposer({ appName: 'my-app' });
 * 
 * const result = composer.build({
 *   author: 'username',
 *   body: 'Hello Hive! #test',
 *   parentAuthor: '',
 *   parentPermlink: 'hive-123456'
 * });
 * 
 * // Broadcast with any auth method
 * await aioha.signAndBroadcastTx(result.operations, KeyTypes.Posting);
 * ```
 * 
 * @example With Video Upload
 * ```typescript
 * import { createComposer } from '@snapie/composer';
 * import { uploadVideoTo3Speak } from '@snapie/composer/video';
 * 
 * // Upload video first
 * const videoResult = await uploadVideoTo3Speak(file, {
 *   apiKey: '...',
 *   owner: 'username'
 * });
 * 
 * // Then create post with video embed
 * const result = composer.build({
 *   author: 'username',
 *   body: 'Check out my video!',
 *   videoEmbedUrl: videoResult.embedUrl,
 *   parentAuthor: '',
 *   parentPermlink: 'hive-123456'
 * });
 * ```
 * 
 * @packageDocumentation
 */

// Re-export everything from core
export {
    // Types
    type Beneficiary,
    type CommentInput,
    type ComposerResult,
    type ComposerConfig,
    type CommentOperation,
    type CommentOptionsOperation,
    type Operation,
    
    // Utilities
    generatePermlink,
    extractHashtags,
    imageToMarkdown,
    imagesToMarkdown,
    appendMediaToBody,
    
    // Operation builders
    buildCommentOperation,
    buildCommentOptionsOperation,
    
    // Main factory
    createComposer
} from './core';
