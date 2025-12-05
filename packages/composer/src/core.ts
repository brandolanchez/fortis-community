/**
 * @snapie/composer - Core Module
 * 
 * Core utilities for building Hive blockchain operations.
 * This module has no external dependencies beyond @hiveio/dhive types.
 */

import type { CommentOperation, CommentOptionsOperation, Operation } from '@hiveio/dhive';

// ============================================================================
// Types
// ============================================================================

/**
 * Beneficiary recipient for post rewards
 */
export interface Beneficiary {
    account: string;
    /** Weight in basis points (100 = 1%, 1000 = 10%, 10000 = 100%) */
    weight: number;
}

/**
 * Input for building a comment/post operation
 */
export interface CommentInput {
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
export interface ComposerResult {
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
export interface ComposerConfig {
    /** Application name for json_metadata (default: "snapie") */
    appName?: string;
    
    /** Default tags to include in posts */
    defaultTags?: string[];
    
    /** Default beneficiaries for all posts */
    beneficiaries?: Beneficiary[];
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique permlink from current timestamp
 */
export function generatePermlink(): string {
    return new Date()
        .toISOString()
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
}

/**
 * Extract hashtags from text content
 * 
 * @param text - Text to extract hashtags from
 * @returns Array of hashtag strings (without the # symbol)
 */
export function extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map(hashtag => hashtag.slice(1));
}

/**
 * Build markdown image syntax from URL
 */
export function imageToMarkdown(url: string): string {
    return `![image](${url})`;
}

/**
 * Build markdown for multiple images
 */
export function imagesToMarkdown(urls: string[]): string {
    return urls.map(imageToMarkdown).join('\n');
}

/**
 * Append media embeds to body content
 */
export function appendMediaToBody(
    body: string,
    options: {
        images?: string[];
        gifUrl?: string;
        videoEmbedUrl?: string;
        audioEmbedUrl?: string;
    }
): string {
    let result = body;
    
    if (options.videoEmbedUrl) {
        result += `\n\n${options.videoEmbedUrl}`;
    }
    
    if (options.audioEmbedUrl) {
        result += `\n\n${options.audioEmbedUrl}`;
    }
    
    if (options.images && options.images.length > 0) {
        result += `\n\n${imagesToMarkdown(options.images)}`;
    }
    
    if (options.gifUrl) {
        result += `\n\n![gif](${options.gifUrl})`;
    }
    
    return result;
}

// ============================================================================
// Operation Builders
// ============================================================================

/**
 * Build a comment operation
 */
export function buildCommentOperation(input: {
    parentAuthor: string;
    parentPermlink: string;
    author: string;
    permlink: string;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
}): CommentOperation {
    return [
        'comment',
        {
            parent_author: input.parentAuthor,
            parent_permlink: input.parentPermlink,
            author: input.author,
            permlink: input.permlink,
            title: input.title,
            body: input.body,
            json_metadata: JSON.stringify(input.metadata)
        }
    ];
}

/**
 * Build a comment_options operation (for beneficiaries, payout settings, etc.)
 */
export function buildCommentOptionsOperation(input: {
    author: string;
    permlink: string;
    maxAcceptedPayout?: string;
    percentHbd?: number;
    allowVotes?: boolean;
    allowCurationRewards?: boolean;
    beneficiaries?: Beneficiary[];
}): CommentOptionsOperation {
    const extensions: [0, { beneficiaries: { account: string; weight: number }[] }][] = [];
    
    if (input.beneficiaries && input.beneficiaries.length > 0) {
        // Sort beneficiaries alphabetically by account (required by Hive)
        const sortedBeneficiaries = [...input.beneficiaries].sort((a, b) => 
            a.account.localeCompare(b.account)
        );
        
        extensions.push([0, { beneficiaries: sortedBeneficiaries }]);
    }
    
    return [
        'comment_options',
        {
            author: input.author,
            permlink: input.permlink,
            max_accepted_payout: input.maxAcceptedPayout ?? '1000000.000 HBD',
            percent_hbd: input.percentHbd ?? 10000,
            allow_votes: input.allowVotes ?? true,
            allow_curation_rewards: input.allowCurationRewards ?? true,
            extensions
        }
    ];
}

// ============================================================================
// Main Composer Factory
// ============================================================================

/**
 * Create a configured composer instance
 * 
 * @example
 * ```typescript
 * import { createComposer } from '@snapie/composer';
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
export function createComposer(config: ComposerConfig = {}) {
    const appName = config.appName ?? 'snapie';
    const defaultTags = config.defaultTags ?? [];
    const defaultBeneficiaries = config.beneficiaries ?? [];
    
    return {
        /**
         * Build operations for a comment/post
         */
        build(input: CommentInput): ComposerResult {
            const permlink = input.permlink ?? generatePermlink();
            
            // Build body with media
            const body = appendMediaToBody(input.body, {
                images: input.images,
                gifUrl: input.gifUrl,
                videoEmbedUrl: input.videoEmbedUrl,
                audioEmbedUrl: input.audioEmbedUrl
            });
            
            // Extract and combine tags
            const extractedTags = extractHashtags(body);
            const allTags = [...new Set([
                ...defaultTags,
                ...(input.tags ?? []),
                ...extractedTags
            ])];
            
            // Build metadata
            const metadata: Record<string, unknown> = {
                app: appName,
                tags: allTags,
                ...(input.images && input.images.length > 0 ? { images: input.images } : {}),
                ...input.metadata
            };
            
            // Build comment operation
            const commentOp = buildCommentOperation({
                parentAuthor: input.parentAuthor,
                parentPermlink: input.parentPermlink,
                author: input.author,
                permlink,
                title: input.title ?? '',
                body,
                metadata
            });
            
            const operations: Operation[] = [commentOp];
            
            // Determine if we need comment_options
            const beneficiaries = input.beneficiaries ?? defaultBeneficiaries;
            const hasBeneficiaries = beneficiaries.length > 0;
            const hasCustomPayoutSettings = 
                input.maxAcceptedPayout !== undefined ||
                input.percentHbd !== undefined ||
                input.allowVotes !== undefined ||
                input.allowCurationRewards !== undefined;
            
            if (hasBeneficiaries || hasCustomPayoutSettings) {
                const optionsOp = buildCommentOptionsOperation({
                    author: input.author,
                    permlink,
                    maxAcceptedPayout: input.maxAcceptedPayout,
                    percentHbd: input.percentHbd,
                    allowVotes: input.allowVotes,
                    allowCurationRewards: input.allowCurationRewards,
                    beneficiaries: hasBeneficiaries ? beneficiaries : undefined
                });
                
                operations.push(optionsOp);
            }
            
            return {
                operations,
                permlink,
                body,
                metadata
            };
        }
    };
}

// Re-export dhive types for convenience
export type {
    CommentOperation,
    CommentOptionsOperation,
    Operation
} from '@hiveio/dhive';
