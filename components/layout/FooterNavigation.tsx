import { useKeychain } from '@/contexts/KeychainContext';
import { Badge, Box, Button, HStack, Icon, Tooltip, useColorMode, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Input, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiBell, FiBook, FiCreditCard, FiHome, FiUser, FiLogIn, FiLogOut, FiMessageSquare, FiChevronLeft, FiChevronRight, FiTarget } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { FaTrophy } from 'react-icons/fa';

export default function FooterNavigation() {

    const { user, login, logout, isLoggedIn } = useKeychain();
    const router = useRouter();
    const { colorMode } = useColorMode();
    const [modalDisplayed, setModalDisplayed] = useState(false);
    const [username, setUsername] = useState('');
    const toast = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    const handleNavigation = (path: string) => {
        if (router) {
            router.push(path);
        }
    };

    // Check scroll position to show/hide fade indicators
    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftFade(scrollLeft > 5);
            setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    return (
        <Box
            as="nav"
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            bg="secondary"
            borderTop="1px solid"
            borderColor="tb1"
            display={{ base: 'block', sm: 'none' }}
            zIndex="999"
        >
            {/* Left fade indicator */}
            {showLeftFade && (
                <Box
                    position="absolute"
                    left="0"
                    top="0"
                    bottom="0"
                    width="30px"
                    bgGradient="linear(to-r, secondary, transparent)"
                    zIndex="1"
                    pointerEvents="none"
                    display="flex"
                    alignItems="center"
                    pl={1}
                >
                    <Icon as={FiChevronLeft} color="whiteAlpha.600" boxSize={4} />
                </Box>
            )}

            {/* Right fade indicator */}
            {showRightFade && (
                <Box
                    position="absolute"
                    right="0"
                    top="0"
                    bottom="0"
                    width="30px"
                    bgGradient="linear(to-l, secondary, transparent)"
                    zIndex="1"
                    pointerEvents="none"
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    pr={1}
                >
                    <Icon as={FiChevronRight} color="whiteAlpha.600" boxSize={4} />
                </Box>
            )}

            <Box
                ref={scrollRef}
                overflowX="auto"
                onScroll={checkScroll}
                p={2}
                css={{
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <HStack spacing={1} minW="max-content" justify="center" px={2}>
                    <Tooltip label="Home" aria-label="Home tooltip">
                        <Button
                            onClick={() => handleNavigation("/")}
                            variant="ghost"
                            color="white"
                            size="md"
                            minW="50px"
                            h="50px"
                            _hover={{ bg: 'whiteAlpha.200' }}
                        >
                            <Icon as={FiHome} boxSize={6} />
                        </Button>
                    </Tooltip>

                    <Tooltip label="Retos" aria-label="Retos tooltip">
                        <Button
                            onClick={() => handleNavigation("/challenges")}
                            variant="ghost"
                            color="white"
                            size="md"
                            minW="50px"
                            h="50px"
                            _hover={{ bg: 'whiteAlpha.200' }}
                        >
                            <Icon as={FaTrophy} boxSize={6} />
                        </Button>
                    </Tooltip>

                    <Tooltip label="Rutinas" aria-label="Rutinas tooltip">
                        <Button
                            onClick={() => handleNavigation("/routines")}
                            variant="ghost"
                            color="white"
                            size="md"
                            minW="50px"
                            h="50px"
                            _hover={{ bg: 'whiteAlpha.200' }}
                        >
                            <Icon as={FiTarget} boxSize={6} />
                        </Button>
                    </Tooltip>

                    {user ? (
                        <>
                            <Tooltip label="Notifications" aria-label="Notifications tooltip">
                                <Button
                                    onClick={() => handleNavigation("/@" + user + "/notifications")}
                                    variant="ghost"
                                    color="white"
                                    size="md"
                                    minW="50px"
                                    h="50px"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                >
                                    <Icon as={FiBell} boxSize={6} />
                                </Button>
                            </Tooltip>

                            <Tooltip label="Wallet" aria-label="Wallet tooltip">
                                <Button
                                    onClick={() => handleNavigation("/@" + user + '/wallet')}
                                    variant="ghost"
                                    color="white"
                                    size="md"
                                    minW="50px"
                                    h="50px"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                >
                                    <Icon as={FiCreditCard} boxSize={6} />
                                </Button>
                            </Tooltip>

                            <Tooltip label="Profile" aria-label="Profile tooltip">
                                <Button
                                    onClick={() => handleNavigation("/@" + user)}
                                    variant="ghost"
                                    color="white"
                                    size="md"
                                    minW="50px"
                                    h="50px"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                >
                                    <Icon as={FiUser} boxSize={6} />
                                </Button>
                            </Tooltip>

                            <Tooltip label="Logout" aria-label="Logout tooltip">
                                <Button
                                    onClick={logout}
                                    variant="ghost"
                                    color="white"
                                    size="md"
                                    minW="50px"
                                    h="50px"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                >
                                    <Icon as={FiLogOut} boxSize={6} />
                                </Button>
                            </Tooltip>
                        </>
                    ) : (
                        <Tooltip label="Login" aria-label="Login tooltip">
                            <Button
                                onClick={() => setModalDisplayed(true)}
                                variant="ghost"
                                color="primary"
                                size="md"
                                minW="50px"
                                h="50px"
                                _hover={{ bg: 'whiteAlpha.200', color: 'primary' }}
                            >
                                <Icon as={FiLogIn} boxSize={6} />
                            </Button>
                        </Tooltip>
                    )}
                </HStack>
            </Box>

            {/* Login Modal */}
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
                            color="black"
                            _placeholder={{ color: 'gray.500' }}
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
