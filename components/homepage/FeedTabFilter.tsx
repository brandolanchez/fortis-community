'use client';
import React from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import { SnapFilterType } from '@/hooks/useSnaps';

interface FeedTabFilterProps {
  activeFilter: SnapFilterType;
  onFilterChange: (filter: SnapFilterType) => void;
  communityName?: string;
  isLoggedIn?: boolean;
}

export default function FeedTabFilter({
  activeFilter,
  onFilterChange,
  communityName = 'HiveBR',
  isLoggedIn = false
}: FeedTabFilterProps) {

  const tabs: { label: string; value: SnapFilterType; requiresAuth?: boolean }[] = [
    { label: communityName, value: 'community' },
    { label: 'Following', value: 'following', requiresAuth: true },
  ];

  return (
    <Box
      bg="background"
      position="sticky"
      top={0}
      zIndex={10}
      px={0}
      py={3}
      w="full"
    >
      <HStack spacing={2} justify="space-between" w="full" px={2}>
        {tabs.map((tab) => {
          const isDisabled = tab.requiresAuth && !isLoggedIn;
          const isActive = activeFilter === tab.value;

          return (
            <Button
              key={tab.value}
              onClick={() => !isDisabled && onFilterChange(tab.value)}
              size="md"
              flex={1}
              bg={isActive ? 'primary' : 'muted'}
              color={isActive ? 'background' : 'text'}
              borderWidth="2px"
              borderColor={isActive ? 'primary' : 'border'}
              fontWeight="bold"
              _hover={{
                bg: isActive ? 'secondary' : 'background',
                borderColor: isActive ? 'secondary' : 'primary',
                color: isActive ? 'white' : 'primary',
                transform: 'translateY(-2px)',
                shadow: 'md',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              _disabled={{
                opacity: 0.5,
                cursor: 'not-allowed',
                _hover: {
                  bg: 'muted',
                  borderColor: 'border',
                  color: 'text',
                  transform: 'none',
                },
              }}
              isDisabled={isDisabled}
              transition="all 0.2s"
            >
              {tab.label}
            </Button>
          );
        })}
      </HStack>
    </Box>
  );
}
