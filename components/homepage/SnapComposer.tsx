import React, { useState, useRef } from 'react';
import { Box, Textarea, HStack, Button, Image, IconButton, Wrap, Spinner, Progress, Text, VStack } from '@chakra-ui/react';
import { useAioha } from '@aioha/react-ui';
import { KeyTypes } from '@aioha/aioha';
import GiphySelector from './GiphySelector';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import { IGif } from '@giphy/js-types';
import { CloseIcon } from '@chakra-ui/icons';
import { FaImage, FaVideo } from 'react-icons/fa';
import { MdGif } from 'react-icons/md';
import { Comment } from '@hiveio/dhive';
import { getFileSignature, getLastSnapsContainer, uploadImage } from '@/lib/hive/client-functions';
import * as tus from 'tus-js-client';

interface SnapComposerProps {
    pa: string;
    pp: string;
    onNewComment: (newComment: Partial<Comment>) => void;
    post?: boolean;
    onClose: () => void;
}

export default function SnapComposer ({ pa, pp, onNewComment, post = false, onClose }: SnapComposerProps) {
    const { user, aioha } = useAioha();

    const postBodyRef = useRef<HTMLTextAreaElement>(null);
    const [images, setImages] = useState<File[]>([]);
    const [selectedGif, setSelectedGif] = useState<IGif | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
    const [videoEmbedUrl, setVideoEmbedUrl] = useState<string | null>(null);
    const [isGiphyModalOpen, setGiphyModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number[]>([]);

    const buttonText = post ? "Reply" : "Post";
    const hasMedia = images.length > 0 || selectedGif !== null;
    const hasVideo = selectedVideo !== null;

    // Function to extract hashtags from text
    function extractHashtags(text: string): string[] {
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex) || [];
        return matches.map(hashtag => hashtag.slice(1)); // Remove the '#' symbol
    }

    // Upload video to 3Speak using TUS protocol
    async function uploadVideoToThreeSpeak(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const apiKey = process.env.NEXT_PUBLIC_3SPEAK_API_KEY || '';
            if (!apiKey || apiKey === '') {
                reject(new Error('3Speak API key not configured'));
                return;
            }

            let embedUrl: string | null = null;

            const upload = new tus.Upload(file, {
                endpoint: 'https://embed.3speak.tv/uploads',
                retryDelays: [0, 3000, 5000, 10000, 20000],
                metadata: {
                    filename: file.name,
                    owner: user || '',
                    frontend_app: 'snapie',
                    short: 'true'
                },
                headers: {
                    'X-API-Key': apiKey
                },
                onError: (error) => {
                    console.error('Video upload failed:', error);
                    setSelectedVideo(null);
                    setVideoUploadProgress(0);
                    reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal) * 100;
                    setVideoUploadProgress(Math.round(percentage));
                },
                onAfterResponse: (req, res) => {
                    const url = res.getHeader('X-Embed-URL');
                    if (url) {
                        embedUrl = url;
                    }
                },
                onSuccess: () => {
                    if (embedUrl) {
                        resolve(embedUrl);
                    } else {
                        reject(new Error('Failed to get embed URL from server'));
                    }
                }
            });

            upload.start();
        });
    }

    // Handle video selection and start upload immediately
    async function handleVideoSelection(file: File) {
        setSelectedVideo(file);
        setVideoUploadProgress(1); // Show it's starting
        
        try {
            const embedUrl = await uploadVideoToThreeSpeak(file);
            setVideoEmbedUrl(embedUrl);
        } catch (error) {
            console.error('Video upload failed:', error);
            alert('Failed to upload video. Please try again.');
            setSelectedVideo(null);
            setVideoUploadProgress(0);
        }
    }

    async function handleComment() {
        if (!user) {
            alert('You must be logged in to post.');
            return;
        }
        
        let commentBody = postBodyRef.current?.value || '';

        if (!commentBody.trim() && images.length === 0 && !selectedGif && !selectedVideo) {
            alert('Please enter some text, upload an image, select a gif, or upload a video before posting.');
            return; // Do not proceed
        }

        setIsLoading(true);
        setUploadProgress([]);

        const permlink = new Date()
            .toISOString()
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase();

        // Add video embed URL if available
        if (videoEmbedUrl) {
            // Just add the URL, parser will handle iframe formatting and mode parameter
            commentBody += `\n\n${videoEmbedUrl}`;
        }

        let validUrls: string[] = [];    
        if (images.length > 0) {
            const uploadedImages = await Promise.all(images.map(async (image, index) => {
                const signature = await getFileSignature(image);
                try {
                    const uploadUrl = await uploadImage(image, signature, index, setUploadProgress);
                    return uploadUrl;
                } catch (error) {
                    console.error('Error uploading image:', error);
                    return null;
                }
            }));

            validUrls = uploadedImages.filter((url): url is string => url !== null);

            if (validUrls.length > 0) {
                const imageMarkup = validUrls.map((url: string | null) => `![image](${url?.toString() || ''})`).join('\n');
                commentBody += `\n\n${imageMarkup}`;
            }
        }

        if (selectedGif) {
            commentBody += `\n\n![gif](${selectedGif.images.downsized_medium.url})`;
        }

        if (commentBody) {
            let snapsTags: string[] = [];
            try {
                // Add existing `snaps` tag logic
                if (pp === "snaps") { 
                    pp = (await getLastSnapsContainer()).permlink;
                    snapsTags = [process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "", "snaps"];
                }

                // Extract hashtags from the comment body and add to `snapsTags`
                const hashtags = extractHashtags(commentBody);
                snapsTags = [...new Set([...snapsTags, ...hashtags])]; // Add hashtags without duplicates

                let commentResponse;

                // If video upload, use beneficiaries (10% to @snapie)
                if (videoEmbedUrl) {
                    const commentOp = [
                        'comment',
                        {
                            parent_author: pa,
                            parent_permlink: pp,
                            author: user,
                            permlink: permlink,
                            title: '',
                            body: commentBody,
                            json_metadata: JSON.stringify({ app: 'mycommunity', tags: snapsTags, images: validUrls })
                        }
                    ];

                    const optionsOp = [
                        'comment_options',
                        {
                            author: user,
                            permlink: permlink,
                            max_accepted_payout: '1000000.000 HBD',
                            percent_hbd: 10000,
                            allow_votes: true,
                            allow_curation_rewards: true,
                            extensions: [
                                [
                                    0,
                                    {
                                        beneficiaries: [
                                            {
                                                account: 'snapie',
                                                weight: 1000 // 10%
                                            }
                                        ]
                                    }
                                ]
                            ]
                        }
                    ];

                    commentResponse = await aioha.signAndBroadcastTx([commentOp, optionsOp] as any, KeyTypes.Posting);
                } else {
                    // Regular post without beneficiaries
                    commentResponse = await aioha.comment(pa, pp, permlink, '', commentBody, { app: 'mycommunity', tags: snapsTags, images: validUrls });
                }
                
                if (commentResponse.success) {
                    postBodyRef.current!.value = '';
                    setImages([]);
                    setSelectedGif(null);
                    setSelectedVideo(null);
                    setVideoEmbedUrl(null);
                    setVideoUploadProgress(0);

                    const newComment: Partial<Comment> = {
                        author: user, 
                        permlink: permlink,
                        body: commentBody,
                    };

                    onNewComment(newComment); 
                    onClose();
                } else {
                    alert('Failed to post. Please try again.');
                }
            } catch (error) {
                alert('Error posting: ' + error);
            } finally {
                setIsLoading(false);
                setUploadProgress([]);
            }
        }
    }

    // Detect Ctrl+Enter and submit
    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.ctrlKey && event.key === 'Enter') {
            handleComment();
        }
    }

    return (
        <Box bg="muted" p={4} mb={1} borderRadius="base" border="tb1">
            <Textarea
                placeholder="What's happening?"
                bg="background"
                border="tb1"
                borderRadius={'base'}
                mb={3}
                ref={postBodyRef}
                _placeholder={{ color: 'text' }}
                isDisabled={isLoading}
                onKeyDown={handleKeyDown} // Attach the keydown handler
            />
            <HStack justify="space-between" mb={3}>
                <HStack>
                    <Button _hover={{ border: 'tb1' }} _active={{ border: 'tb1' }} as="label" variant="ghost" isDisabled={isLoading || hasVideo}>
                        <FaImage size={22} />
                        <ImageUploader images={images} onUpload={setImages} onRemove={(index) => setImages(prevImages => prevImages.filter((_, i) => i !== index))} />
                    </Button>
                    <Button _hover={{ border: 'tb1' }} _active={{ border: 'tb1' }} variant="ghost" onClick={() => setGiphyModalOpen(!isGiphyModalOpen)} isDisabled={isLoading || hasVideo}>
                        <MdGif size={48} />
                    </Button>
                    <Button _hover={{ border: 'tb1' }} _active={{ border: 'tb1' }} as="label" variant="ghost" isDisabled={isLoading || hasMedia || videoUploadProgress > 0}>
                        <FaVideo size={22} />
                        <VideoUploader onUpload={handleVideoSelection} />
                    </Button>
                </HStack>
                <Button variant="solid" colorScheme="primary" onClick={handleComment} isDisabled={isLoading || (selectedVideo && !videoEmbedUrl)}>
                    {isLoading ? <Spinner size="sm" /> : buttonText}
                </Button>
            </HStack>
            <Wrap spacing={4}>
                {images.map((image, index) => (
                    <Box key={index} position="relative">
                        <Image alt="" src={URL.createObjectURL(image)} boxSize="100px" borderRadius="base" />
                        <IconButton
                            aria-label="Remove image"
                            icon={<CloseIcon />}
                            size="xs"
                            position="absolute"
                            top="0"
                            right="0"
                            onClick={() => setImages(prevImages => prevImages.filter((_, i) => i !== index))}
                            isDisabled={isLoading}
                        />
                        <Progress value={uploadProgress[index]} size="xs" colorScheme="green" mt={2} />
                    </Box>
                ))}
                {selectedGif && (
                    <Box key={selectedGif.id} position="relative">
                        <Image alt="" src={selectedGif.images.downsized_medium.url} boxSize="100px" borderRadius="base" />
                        <IconButton
                            aria-label="Remove GIF"
                            icon={<CloseIcon />}
                            size="xs"
                            position="absolute"
                            top="0"
                            right="0"
                            onClick={() => setSelectedGif(null)}
                            isDisabled={isLoading}
                        />
                    </Box>
                )}
                {selectedVideo && (
                    <Box position="relative" bg="muted" p={3} borderRadius="base" border="1px solid" borderColor="gray.600" minW="250px">
                        <VStack align="start" spacing={2}>
                            <HStack justify="space-between" w="100%">
                                <Text fontSize="sm" fontWeight="bold" color="text">📹 {selectedVideo.name}</Text>
                                <IconButton
                                    aria-label="Remove video"
                                    icon={<CloseIcon />}
                                    size="xs"
                                    onClick={() => {
                                        setSelectedVideo(null);
                                        setVideoEmbedUrl(null);
                                        setVideoUploadProgress(0);
                                    }}
                                    isDisabled={isLoading}
                                />
                            </HStack>
                            <Text fontSize="xs" color="gray.400">
                                {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                            </Text>
                            {videoUploadProgress > 0 && (
                                <Box w="100%">
                                    <Progress value={videoUploadProgress} size="sm" colorScheme="blue" />
                                    <Text fontSize="xs" mt={1} color="text">{videoUploadProgress}% uploaded</Text>
                                </Box>
                            )}
                        </VStack>
                    </Box>
                )}
            </Wrap>
            {isGiphyModalOpen && (
                <GiphySelector
                    apiKey={process.env.GIPHY_API_KEY || 'qXGQXTPKyNJByTFZpW7Kb0tEFeB90faV'}
                    onSelect={(gif, e) => {
                        e.preventDefault();
                        setSelectedGif(gif);
                        setGiphyModalOpen(false);
                    }}
                />
            )}
        </Box>
    );
}
