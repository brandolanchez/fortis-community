import { Operation, CommentOperation, CommentOptionsOperation } from '@hiveio/dhive';
export { CommentOperation, CommentOptionsOperation, Operation } from '@hiveio/dhive';

/**
 * @snapie/operations - Core Module
 *
 * Core utilities for building Hive blockchain operations.
 * This module has no external dependencies beyond @hiveio/dhive types.
 */

/**
 * Beneficiary recipient for post rewards
 */
interface Beneficiary {
    account: string;
    /** Weight in basis points (100 = 1%, 1000 = 10%, 10000 = 100%) */
    weight: number;
}
/**
 * Input for building a comment/post operation
 */
interface CommentInput {
    /** Author's Hive username */
    author: string;
    /** Post body in markdown */
    body: string;
    /** Custom permlink (auto-generated if not provided) */
    permlink?: string;
    /** Post title (empty for comments/snaps) */
    title?: string;
    /** Parent author (empty for top-level posts) */
    parentAuthor: string;
    /** Parent permlink (community tag or container permlink) */
    parentPermlink: string;
    /** Image URLs to append to body */
    images?: string[];
    /** GIF URL to append to body */
    gifUrl?: string;
    /** Video embed URL (3Speak, YouTube, etc.) */
    videoEmbedUrl?: string;
    /** Audio embed URL */
    audioEmbedUrl?: string;
    /** Custom tags (hashtags extracted automatically from body too) */
    tags?: string[];
    /** Custom json_metadata fields */
    metadata?: Record<string, unknown>;
    /** Beneficiaries for this post */
    beneficiaries?: Beneficiary[];
    /** Max accepted payout (default: "1000000.000 HBD") */
    maxAcceptedPayout?: string;
    /** Percent HBD (default: 10000 = 100%) */
    percentHbd?: number;
    /** Allow votes (default: true) */
    allowVotes?: boolean;
    /** Allow curation rewards (default: true) */
    allowCurationRewards?: boolean;
}
/**
 * Result from building operations
 */
interface ComposerResult {
    /** The operations to broadcast */
    operations: Operation[];
    /** The generated permlink */
    permlink: string;
    /** The final body content */
    body: string;
    /** The json_metadata object */
    metadata: Record<string, unknown>;
}
/**
 * Configuration for the composer
 */
interface ComposerConfig {
    /** Application name for json_metadata (default: "snapie") */
    appName?: string;
    /** Default tags to include in posts */
    defaultTags?: string[];
    /** Default beneficiaries for all posts */
    beneficiaries?: Beneficiary[];
}
/**
 * Generate a unique permlink from current timestamp
 */
declare function generatePermlink(): string;
/**
 * Extract hashtags from text content
 *
 * @param text - Text to extract hashtags from
 * @returns Array of hashtag strings (without the # symbol)
 */
declare function extractHashtags(text: string): string[];
/**
 * Build markdown image syntax from URL
 */
declare function imageToMarkdown(url: string): string;
/**
 * Build markdown for multiple images
 */
declare function imagesToMarkdown(urls: string[]): string;
/**
 * Append media embeds to body content
 */
declare function appendMediaToBody(body: string, options: {
    images?: string[];
    gifUrl?: string;
    videoEmbedUrl?: string;
    audioEmbedUrl?: string;
}): string;
/**
 * Build a comment operation
 */
declare function buildCommentOperation(input: {
    parentAuthor: string;
    parentPermlink: string;
    author: string;
    permlink: string;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
}): CommentOperation;
/**
 * Build a comment_options operation (for beneficiaries, payout settings, etc.)
 */
declare function buildCommentOptionsOperation(input: {
    author: string;
    permlink: string;
    maxAcceptedPayout?: string;
    percentHbd?: number;
    allowVotes?: boolean;
    allowCurationRewards?: boolean;
    beneficiaries?: Beneficiary[];
}): CommentOptionsOperation;
/**
 * Create a configured composer instance
 *
 * @example
 * ```typescript
 * import { createComposer } from '@snapie/operations';
 *
 * const composer = createComposer({
 *   appName: 'my-app',
 *   defaultTags: ['my-app'],
 *   beneficiaries: [{ account: 'my-app', weight: 500 }] // 5%
 * });
 *
 * const result = composer.build({
 *   author: 'user',
 *   body: 'Hello!',
 *   parentAuthor: '',
 *   parentPermlink: 'hive-123456'
 * });
 *
 * // Broadcast with any auth method
 * await myAuth.broadcast(result.operations);
 * ```
 */
declare function createComposer(config?: ComposerConfig): {
    /**
     * Build operations for a comment/post
     */
    build(input: CommentInput): ComposerResult;
};

export { type Beneficiary, type CommentInput, type ComposerConfig, type ComposerResult, appendMediaToBody, buildCommentOperation, buildCommentOptionsOperation, createComposer, extractHashtags, generatePermlink, imageToMarkdown, imagesToMarkdown };
