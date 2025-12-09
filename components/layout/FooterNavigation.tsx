import { useKeychain } from '@/contexts/KeychainContext';
import { Box, Button, HStack, Icon, Tooltip, useColorMode } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiBell, FiBook, FiCreditCard, FiHome, FiUser } from 'react-icons/fi';

export default function FooterNavigation() {

    const { user } = useKeychain();
    const router = useRouter();
    const { colorMode } = useColorMode();
    const handleNavigation = (path: string) => {
        if (router) {
            router.push(path);
        }
    };

    return (
        <Box
            as="nav"
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            bg="secondary"
            p={2}
            borderTop="1px solid"
            borderColor="tb1"
            display={{ base: 'block', sm: 'none' }}
            zIndex="999"
        >
            <HStack justify="space-around">
                <Tooltip label="Home" aria-label="Home tooltip">
                    <Button
                        onClick={() => handleNavigation("/")}
                        variant="ghost"
                        leftIcon={<Icon as={FiHome} boxSize={4} />}
                    />
                </Tooltip>

                <Tooltip label="Blog" aria-label="Blog tooltip">
                    <Button
                        onClick={() => handleNavigation("/blog")}
                        variant="ghost"
                        leftIcon={<Icon as={FiBook} boxSize={4} />}
                    />
                </Tooltip>

                {user ? (
                    <>
                        <Tooltip label="Notifications" aria-label="Notifications tooltip">
                            <Button
                                onClick={() => handleNavigation("/@" + user + "/notifications")}
                                variant="ghost"
                                leftIcon={<Icon as={FiBell} boxSize={4} />}
                            />
                        </Tooltip>

                        <Tooltip label="Wallet" aria-label="Wallet tooltip">
                            <Button
                                onClick={() => handleNavigation("/@" + user + '/wallet')}
                                variant="ghost"
                                leftIcon={<Icon as={FiCreditCard} boxSize={4} />}
                            />
                        </Tooltip>

                        <Tooltip label="Profile" aria-label="Profile tooltip">
                            <Button
                                onClick={() => handleNavigation("/@" + user)}
                                variant="ghost"
                                leftIcon={<Icon as={FiUser} boxSize={4} />}
                            />
                        </Tooltip>
                    </>
                ) : null}
            </HStack>
        </Box>
    );
}
