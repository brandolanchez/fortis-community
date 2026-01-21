import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Box, Spinner, VStack, Text } from '@chakra-ui/react';
import Snap from './Snap';
import { ExtendedComment, useComments } from '@/hooks/useComments';
import { useSnaps } from '@/hooks/useSnaps';
import SnapComposer from './SnapComposer';

interface SnapListProps {
  author: string
  permlink: string
  setConversation: (conversation: ExtendedComment) => void;
  onOpen: () => void;
  setReply: (reply: ExtendedComment) => void;
  newComment: ExtendedComment | null;
  post?: boolean;
  data: InfiniteScrollData
}

interface InfiniteScrollData {
  comments: ExtendedComment[];
  loadNextPage: () => void; // Default can be an empty function in usage
  isLoading: boolean;
  hasMore: boolean; // Default can be `false` in usage
  refresh?: () => void; // Function to refresh the feed
}

export default function SnapList(
  {
    author,
    permlink,
    setConversation,
    onOpen,
    setReply,
    newComment,
    post,
    data
  }: SnapListProps) {
  const { comments, loadNextPage, isLoading, hasMore, refresh } = data

  const handleNewComment = () => {
    // Simple feed refresh after posting with delay for blockchain to catch up
    if (refresh) {
      setTimeout(() => {
        refresh();
      }, 3000); // 3 second delay to let Hive blockchain propagate the transaction
    }
  };

  comments.sort((a: ExtendedComment, b: ExtendedComment) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });
  // Handle new comment addition
  //const updatedComments = newComment ? [newComment, ...comments] : comments;

  if (isLoading && comments.length === 0) {
    // Initial loading state - show big spinner only if empty
    return (
      <Box textAlign="center" mt={20}>
        <Spinner size="xl" color="primary" thickness="4px" />
        <Text mt={4} fontWeight="bold" color="primary">LOADING SNAPS...</Text>
      </Box>
    );
  }

  return (
    <InfiniteScroll
      dataLength={comments.length}
      next={loadNextPage}
      hasMore={hasMore}
      loader={
        (<Box display="flex" justifyContent="center" alignItems="center" py={5}>
          <Spinner size="xl" color="primary" />
        </Box>
        )}
      scrollableTarget="scrollableDiv"
    >
      <VStack spacing={1} align="stretch" mx="auto" pt={0} px={2}>
        {!post && <SnapComposer pa={author} pp={permlink} onNewComment={handleNewComment} onClose={() => null} />}
        {comments.length === 0 && !isLoading && !hasMore && (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" color="gray.500">No snaps found in this community yet.</Text>
          </Box>
        )}
        {comments.map((comment: ExtendedComment) => (
          <Snap
            key={comment.permlink}
            comment={comment}
            onOpen={onOpen}
            setReply={setReply}
            {...(!post ? { setConversation } : {})}
          />
        ))}
      </VStack>
    </InfiniteScroll>

  );
}
