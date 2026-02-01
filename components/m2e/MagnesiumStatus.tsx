import React, { useState } from 'react';
import {
    Box,
    VStack,
    Text,
    Button,
    HStack,
    Progress,
    Tooltip,
    useColorModeValue,
    Icon,
    Badge,
    SimpleGrid
} from '@chakra-ui/react';
import MagnesiumCube from './MagnesiumCube';
import { useFortisM2E, MagnesiumType } from '@/hooks/useFortisM2E';
import { FaBolt, FaPlus, FaCrown } from 'react-icons/fa'; // Removed FaChevronDown

/**
 * MagnesiumStatus Component
 * Manages the user's magnesium inventory, stake amount, and athlete tiers.
 * Provides a visual representation of 3D chalk blocks.
 */
const MagnesiumStatus = () => {
    const { magnesium, reloadMagnesium, isReloading, isLoading, tier, stakeAmount, simulateStake } = useFortisM2E();

    const bg = useColorModeValue('muted', 'muted');
    const borderColor = useColorModeValue('primary', 'primary');

    if (isLoading) return null;

    const maxMagnesium = 50;


    // TIER CONFIGURATION: Mapping stake levels to visual badges and benefits.
    const getTierColor = (t: string) => {
        const colors: Record<string, string> = {
            'Fortis': 'purple',
            'Oro': 'yellow',
            'Plata': 'teal',
            'Bronce': 'orange'
        };
        return colors[t] || 'gray';
    };

    /**
     * Individual Magnesium Card Component
     * Displays a 3D block, current stock levels, and reload triggers.
     */
    const MagnesiumItem = ({ type, label, cost }: { type: MagnesiumType, label: string, cost: string }) => {
        const currentMagnesium = magnesium[type];
        const percentage = (currentMagnesium / maxMagnesium) * 100;

        // Block styling configuration
        const blockColors: Record<MagnesiumType, string> = {
            gold: '#FFD700',
            aged: '#F5F5DC',
            standard: '#FFFFFF'
        };
        const color = blockColors[type];

        return (
            <VStack
                flex={1}
                p={4}
                bg="rgba(0,0,0,0.1)"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(255,255,255,0.05)"
                spacing={3}
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-2px)', borderColor: 'primary' }}
            >
                <Text fontSize="10px" fontWeight="black" color="gray.500" letterSpacing="widest">{label}</Text>

                <Box py={4}>
                    <MagnesiumCube size="120px" color={color} />
                </Box>

                <VStack w="100%" spacing={1}>
                    <HStack justify="space-between" w="100%">
                        <Text fontSize="9px" fontWeight="bold">{currentMagnesium}/{maxMagnesium}</Text>
                        <Badge variant="subtle" colorScheme={currentMagnesium > 5 ? "green" : "red"} fontSize="8px">
                            STOCK
                        </Badge>
                    </HStack>
                    <Progress
                        value={percentage}
                        size="xs"
                        w="100%"
                        colorScheme={type === 'gold' ? 'yellow' : type === 'aged' ? 'orange' : 'whiteAlpha'}
                        bg="rgba(255,255,255,0.05)"
                        borderRadius="full"
                    />
                </VStack>

                <Tooltip label={`Recargar 10 unidades por ${cost} HBD`} hasArrow>
                    <Button
                        size="xs"
                        variant="solid"
                        colorScheme="primary"
                        w="100%"
                        onClick={() => reloadMagnesium(type)}
                        isLoading={isReloading}
                        fontSize="9px"
                    >
                        RECARGAR (+10)
                    </Button>
                </Tooltip>
            </VStack>
        );
    };

    return (
        <VStack w="100%" spacing={4}>
            <HStack w="100%" justify="space-between" px={2}>
                <VStack align="flex-start" spacing={0}>
                    <Text fontSize="xs" fontWeight="black" color="primary" letterSpacing="widest">TU LEGADO FORTIS</Text>
                    <Badge colorScheme={getTierColor(tier)} variant="solid" borderRadius="full" px={2} fontSize="9px">
                        ATLETA {tier.toUpperCase()}
                    </Badge>
                </VStack>
                <VStack align="flex-end" spacing={0}>
                    <Text fontSize="9px" fontWeight="bold" color="gray.500">STAKE FORTIS</Text>
                    <Text fontSize="sm" fontWeight="black" color="primary">{stakeAmount.toLocaleString()}</Text>
                </VStack>
            </HStack>

            <Box
                w="100%"
                overflowX={{ base: "auto", md: "visible" }}
                pb={{ base: 2, md: 0 }}
                css={{
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <HStack
                    spacing={4}
                    w="100%"
                    align="stretch"
                    flexWrap={{ base: "nowrap", md: "wrap" }}
                    sx={{
                        '& > div': {
                            minW: { base: "260px", md: "calc(33.333% - 11px)" },
                            flexShrink: 0
                        }
                    }}
                >
                    <MagnesiumItem type="standard" label="MAGNESIO ESENCIAL (1 HBD)" cost="1" />
                    <MagnesiumItem type="aged" label="AGARRE MAESTRO (3 HBD)" cost="3" />
                    <MagnesiumItem type="gold" label="FRICCIÓN DIVINA (5 HBD)" cost="5" />
                </HStack>
            </Box>

            <HStack w="100%" justify="center">
                <Button
                    size="xs"
                    variant="link"
                    color="gray.600"
                    fontSize="9px"
                    onClick={() => simulateStake(500)}
                    _hover={{ color: 'primary' }}
                >
                    [DEV] SIMULAR +500 STAKE
                </Button>
            </HStack>
        </VStack>
    );
};

export default MagnesiumStatus;
