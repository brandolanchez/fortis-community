/**
 * @snapie/operations
 * 
 * Build Hive blockchain operations for posts, comments, and media uploads.
 * Auth-agnostic - works with Aioha, Keychain, HiveSigner, or any signing method.
 * 
 * ## Modular Structure
 * 
 * This package is split into modules to keep your bundle size small:
 * 
 * - `@snapie/operations` - Core utilities (this module)
 * - `@snapie/operations/video` - 3Speak video upload (optional)
 * - `@snapie/operations/audio` - 3Speak audio upload (optional)
 * 
 * ## Features
 * 
 * - **Auth-agnostic**: Works with Aioha, Keychain, HiveSigner, or any signing method
 * - **No UI dependencies**: Returns raw operations for you to broadcast
 * - **Tree-shakeable**: Only import what you need
 * - **TypeScript-first**: Full type definitions included
 * 
 * @example Basic Usage
 * ```typescript
 * import { createComposer } from '@snapie/operations';
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
 * import { createComposer } from '@snapie/operations';
 * import { uploadVideoTo3Speak } from '@snapie/operations/video';
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
