// src/core.ts
function generatePermlink() {
  return (/* @__PURE__ */ new Date()).toISOString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex) || [];
  return matches.map((hashtag) => hashtag.slice(1));
}
function imageToMarkdown(url) {
  return `![image](${url})`;
}
function imagesToMarkdown(urls) {
  return urls.map(imageToMarkdown).join("\n");
}
function appendMediaToBody(body, options) {
  let result = body;
  if (options.videoEmbedUrl) {
    result += `

${options.videoEmbedUrl}`;
  }
  if (options.audioEmbedUrl) {
    result += `

${options.audioEmbedUrl}`;
  }
  if (options.images && options.images.length > 0) {
    result += `

${imagesToMarkdown(options.images)}`;
  }
  if (options.gifUrl) {
    result += `

![gif](${options.gifUrl})`;
  }
  return result;
}
function buildCommentOperation(input) {
  return [
    "comment",
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
function buildCommentOptionsOperation(input) {
  const extensions = [];
  if (input.beneficiaries && input.beneficiaries.length > 0) {
    const sortedBeneficiaries = [...input.beneficiaries].sort(
      (a, b) => a.account.localeCompare(b.account)
    );
    extensions.push([0, { beneficiaries: sortedBeneficiaries }]);
  }
  return [
    "comment_options",
    {
      author: input.author,
      permlink: input.permlink,
      max_accepted_payout: input.maxAcceptedPayout ?? "1000000.000 HBD",
      percent_hbd: input.percentHbd ?? 1e4,
      allow_votes: input.allowVotes ?? true,
      allow_curation_rewards: input.allowCurationRewards ?? true,
      extensions
    }
  ];
}
function createComposer(config = {}) {
  const appName = config.appName ?? "snapie";
  const defaultTags = config.defaultTags ?? [];
  const defaultBeneficiaries = config.beneficiaries ?? [];
  return {
    /**
     * Build operations for a comment/post
     */
    build(input) {
      const permlink = input.permlink ?? generatePermlink();
      const body = appendMediaToBody(input.body, {
        images: input.images,
        gifUrl: input.gifUrl,
        videoEmbedUrl: input.videoEmbedUrl,
        audioEmbedUrl: input.audioEmbedUrl
      });
      const extractedTags = extractHashtags(body);
      const allTags = [.../* @__PURE__ */ new Set([
        ...defaultTags,
        ...input.tags ?? [],
        ...extractedTags
      ])];
      const metadata = {
        app: appName,
        tags: allTags,
        ...input.images && input.images.length > 0 ? { images: input.images } : {},
        ...input.metadata
      };
      const commentOp = buildCommentOperation({
        parentAuthor: input.parentAuthor,
        parentPermlink: input.parentPermlink,
        author: input.author,
        permlink,
        title: input.title ?? "",
        body,
        metadata
      });
      const operations = [commentOp];
      const beneficiaries = input.beneficiaries ?? defaultBeneficiaries;
      const hasBeneficiaries = beneficiaries.length > 0;
      const hasCustomPayoutSettings = input.maxAcceptedPayout !== void 0 || input.percentHbd !== void 0 || input.allowVotes !== void 0 || input.allowCurationRewards !== void 0;
      if (hasBeneficiaries || hasCustomPayoutSettings) {
        const optionsOp = buildCommentOptionsOperation({
          author: input.author,
          permlink,
          maxAcceptedPayout: input.maxAcceptedPayout,
          percentHbd: input.percentHbd,
          allowVotes: input.allowVotes,
          allowCurationRewards: input.allowCurationRewards,
          beneficiaries: hasBeneficiaries ? beneficiaries : void 0
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
export {
  appendMediaToBody,
  buildCommentOperation,
  buildCommentOptionsOperation,
  createComposer,
  extractHashtags,
  generatePermlink,
  imageToMarkdown,
  imagesToMarkdown
};
//# sourceMappingURL=index.mjs.map