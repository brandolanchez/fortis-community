'use client'
import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Input, Button, Image, useColorMode, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useToast } from '@chakra-ui/react';
import { getCommunityInfo, getProfile } from '@/lib/hive/client-functions';
import { useKeychain } from '@/contexts/KeychainContext';
import { getHiveAvatarUrl } from '@/lib/utils/avatarUtils';

export default function Header() {
    const { colorMode } = useColorMode();
    const [modalDisplayed, setModalDisplayed] = useState(false);
    const [profileInfo, setProfileInfo] = useState<any>();
    const [communityInfo, setCommunityInfo] = useState<any>();
    const [username, setUsername] = useState('');
    const { user, login, logout, isLoggedIn } = useKeychain();
    const toast = useToast();

    const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cachedProfileData = sessionStorage.getItem('profileData');
                if (cachedProfileData) {
                    setProfileInfo(JSON.parse(cachedProfileData));
                } else if (communityTag) {
                    const profileData = await getProfile(communityTag);
                    sessionStorage.setItem('profileData', JSON.stringify(profileData));
                    setProfileInfo(profileData);
                }

                const cachedCommunityData = sessionStorage.getItem('communityData');
                if (cachedCommunityData) {
                    setCommunityInfo(JSON.parse(cachedCommunityData));
                } else if (communityTag) {
                    const communityData = await getCommunityInfo(communityTag);
                    sessionStorage.setItem('communityData', JSON.stringify(communityData));
                    setCommunityInfo(communityData);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };

        if (communityTag) {
            fetchData();
        }
    }, [communityTag]);

    return (
        <Box bg="secondary" px={{ base: 4, md: 6 }} py={2}>
            <Flex justify="space-between" align="center">
                <Flex align="center" gap={2}>
                    {/* Display profile image */}
                    {communityTag && (
                        <Image
                            src={getHiveAvatarUrl(communityTag, 'large')}
                            alt="Profile Image"
                            boxSize="80px" // Adjust the size as needed
                            borderRadius="full"
                            mr={2} // Reduced margin to bring elements closer
                        />
                    )}
                    <Flex direction="column">
                        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" fontFamily="heading">
                            {communityInfo?.title}
                        </Text>
                        {/* Display description with limited width */}
                        {communityInfo?.about && (
                            <Text
                                fontSize="xs"
                                color="primary"
                                fontWeight="bold"
                                maxW="400px" // Limit the width of the description
                                whiteSpace="normal" // Allow line breaks
                                wordBreak="break-word" // Ensure long words break properly
                            >
                                {communityInfo.about}
                            </Text>
                        )}
                    </Flex>
                </Flex>
                {isLoggedIn ? (
                    <Button onClick={logout}>
                        Logout ({user})
                    </Button>
                ) : (
                    <Button onClick={() => setModalDisplayed(true)}>
                        Login
                    </Button>
                )}
            </Flex>
            <Modal isOpen={modalDisplayed} onClose={() => setModalDisplayed(false)}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Login with Hive Keychain</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Input
                            placeholder="Enter your Hive username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            mb={4}
                        />
                        <Button
                            colorScheme="blue"
                            width="full"
                            onClick={async () => {
                                try {
                                    const success = await login(username);
                                    if (success) {
                                        setModalDisplayed(false);
                                        setUsername('');
                                        toast({
                                            title: 'Success!',
                                            description: `Logged in as @${username}`,
                                            status: 'success',
                                            duration: 3000,
                                        });
                                    }
                                } catch (error) {
                                    toast({
                                        title: 'Login failed',
                                        description: error instanceof Error ? error.message : 'Please try again',
                                        status: 'error',
                                        duration: 5000,
                                    });
                                }
                            }}
                        >
                            Login
                        </Button>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}
