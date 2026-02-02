'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    SimpleGrid,
    VStack,
    Heading,
    Text,
    Button,
    HStack,
    Icon,
    Badge,
    useToast,
    Divider,
    Flex,
    Tooltip,
    Avatar,
    AvatarGroup,
    Collapse,
    IconButton,
    Image,
} from '@chakra-ui/react';
import { FaTrophy, FaClock, FaUsers, FaChevronDown, FaChevronUp, FaCoins, FaMedal } from 'react-icons/fa';
import { useFortisM2E, Challenge, MagnesiumType } from '@/hooks/useFortisM2E';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';
import { getHiveAvatarUrl } from '@/lib/utils/avatarUtils';

/**
 * Mock participant data for social proof.
 * In a production environment, this would be fetched from the Hive blockchain.
 */
const MOCK_PARTICIPANTS = [
    'hecatonquirox', 'hive-calisthenics', 'peak.snaps', 'lordbutterfly', 'theycallmedan',
    'ennead', 'threespeak', 'ocd', 'ecency', 'blocktrades'
];

/**
 * Configuration for Magnesium types to maintain consistency across the UI.
 */
const MAGNESIO_CONFIG: Record<MagnesiumType, { label: string, color: string, priceHBD: number, rewardFORTIS: number }> = {
    standard: { label: 'MAGNESIO ESENCIAL', color: 'gray', priceHBD: 1, rewardFORTIS: 10 },
    aged: { label: 'AGARRE MAESTRO', color: 'orange', priceHBD: 3, rewardFORTIS: 30 },
    gold: { label: 'FRICCIÓN DIVINA', color: 'yellow', priceHBD: 5, rewardFORTIS: 50 },
    airdrop: { label: 'MAGNESIO DE PRUEBA', color: 'orange', priceHBD: 0, rewardFORTIS: 100 } // Price in FORTIS handled in hook
};

/**
 * Initial pool of challenges. 
 * Rewards are balanced based on the $0.03/FORTIS target to ensure economic sustainability.
 */
const INITIAL_CHALLENGES: Challenge[] = [];

/**
 * CountdownTimer Component
 * Calculates and displays the remaining time for a challenge pool in real-time.
 */
const CountdownTimer = ({ expiryDate }: { expiryDate: Date }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiryDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryDate]);

    return (
        <HStack spacing={1} color="primary" fontWeight="bold" fontSize="xs">
            <Icon as={FaClock} />
            <Text>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</Text>
        </HStack>
    );
};

/**
 * Leaderboard Component
 * Displays the top athletes for a completed/scored challenge.
 */
const Leaderboard = ({ ranking }: { ranking: { account: string, score: number, rank: number }[] }) => {
    return (
        <Box p={4} bg="blackAlpha.400" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100" w="100%">
            <HStack mb={4} justify="center">
                <Icon as={FaTrophy} color="yellow.400" />
                <Heading size="xs" letterSpacing="widest">TABLA DE LÍDERES</Heading>
            </HStack>
            <VStack spacing={3} align="stretch">
                {ranking.slice(0, 3).map((r, idx) => (
                    <HStack key={r.account} justify="space-between" p={2} bg={idx === 0 ? "whiteAlpha.100" : "transparent"} borderRadius="md">
                        <HStack spacing={3}>
                            <Text fontWeight="black" color={idx === 0 ? "yellow.400" : idx === 1 ? "gray.300" : "orange.400"}>#{r.rank}</Text>
                            <Avatar size="xs" src={getHiveAvatarUrl(r.account)} name={r.account} />
                            <Text fontSize="xs" fontWeight="bold">@{r.account}</Text>
                        </HStack>
                        <Badge colorScheme="primary" variant="subtle" fontSize="9px">{r.score} PTS</Badge>
                    </HStack>
                ))}
            </VStack>
        </Box>
    );
};

/**
 * ChallengeCard Component
 * Displays individual challenge details, dynamic prize pools, and social participation.
 * 
 * @param challenge - The challenge data object
 * @param onJoin - Callback for the join operation
 * @param isJoined - Boolean flag if the current user has already entered the pool
 * @param ranking - Optional ranking data for the challenge
 */
const ChallengeCard = ({ challenge, onJoin, isJoined, ranking, participants = [] }: { challenge: Challenge, onJoin: (c: Challenge) => void, isJoined: boolean, ranking?: any[], participants?: any[] }) => {
    const { costMultiplier } = useFortisM2E();
    const [showParticipants, setShowParticipants] = useState(false);

    const config = MAGNESIO_CONFIG[challenge.magnesiumType || 'standard'];

    // DYNAMIC PRIZE CALCULATION:
    // Real-time pool where 20% of all entry fees are distributed among the Top 3 winners.
    // Based on REAL participants count.
    const entryValueHBD = config.priceHBD;
    const participantCount = participants.length;
    // Ensure at least some base pool visibility if 0 participants, or just 0.
    // User requested real data, so let's show real math. 
    // If strict reality: (participantCount * entryValueHBD * 0.20)
    const poolAmount = (participantCount * entryValueHBD * 0.20).toFixed(2);

    // Dynamic Expiry Calculation
    const startDate = challenge.timestamp ? new Date(challenge.timestamp) : new Date();
    const duration = challenge.durationDays || 7;
    const expiryDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    return (
        <Box
            p={{ base: 4, md: 6 }}
            bg="muted"
            border="2px solid"
            borderColor={isJoined ? "green.500" : "rgba(255,255,255,0.05)"}
            borderRadius="2xl"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-5px)', borderColor: 'primary', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            position="relative"
            overflow="hidden"
        >
            <Flex
                position="absolute"
                top={0}
                right={0}
                p={2}
                bg={`${config.color}.500`}
                color="black"
                fontWeight="black"
                fontSize="10px"
                borderRadius="0 0 0 10px"
                letterSpacing="tighter"
            >
                {config.label}
            </Flex>

            <VStack align="flex-start" spacing={4}>
                <VStack align="flex-start" spacing={1}>
                    <Heading size="md" color="white">{challenge.title}</Heading>
                    <HStack justify="space-between" w="100%">
                        <Badge fontSize="10px" colorScheme={config.color}>
                            COSTO: 1 USO ({entryValueHBD} HBD)
                        </Badge>
                        <CountdownTimer expiryDate={expiryDate} />
                    </HStack>
                </VStack>

                <Box
                    fontSize="sm"
                    color="gray.400"
                    dangerouslySetInnerHTML={{ __html: markdownRenderer(challenge.description) }}
                    sx={{
                        '& ul, & ol': {
                            marginLeft: '0px',
                            marginTop: '0.8em',
                            marginBottom: '0.8em',
                            columnCount: { base: 2, md: 3 },
                            columnGap: '10px',
                            columnRule: '1px solid rgba(255,255,255,0.05)',
                            listStylePosition: 'inside',
                        },
                        '& li': {
                            fontSize: '11px',
                            lineHeight: '1.1',
                            marginBottom: '4px',
                            breakInside: 'avoid-column',
                        },
                        '& p': {
                            marginBottom: '0.4em',
                            fontSize: '13px',
                        }
                    }}
                />

                <Divider borderColor="rgba(255,255,255,0.1)" />

                <SimpleGrid columns={2} w="100%" spacing={2}>
                    <VStack align="flex-start" spacing={0} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md">
                        <HStack justify="space-between" w="100%">
                            <Text fontSize="9px" color="gray.500" fontWeight="bold">RECOMPENSA</Text>
                            <Image src="https://lrclcispixleskrskkjw.supabase.co/storage/v1/object/public/imagenes/tokenlogo.jpg" boxSize="12px" borderRadius="full" alt="Fortis" />
                        </HStack>
                        <Text fontSize="xs" color="green.300" fontWeight="black">{challenge.participantRewardFORTIS}</Text>
                    </VStack>
                    <VStack align="flex-start" spacing={0} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md">
                        <HStack justify="space-between" w="100%">
                            <Text fontSize="9px" color="gray.500" fontWeight="bold">POOL TOP 3 (HBD)</Text>
                            <Image src="https://cryptologos.cc/logos/hive-blockchain-hive-logo.png" boxSize="12px" alt="Hive" />
                        </HStack>
                        <Text fontSize="xs" color="yellow.400" fontWeight="black">+{poolAmount} HBD</Text>
                    </VStack>
                </SimpleGrid>

                {/* Social Section */}
                <VStack w="100%" spacing={2} align="flex-start">
                    <HStack w="100%" justify="space-between" cursor="pointer" onClick={() => setShowParticipants(!showParticipants)}>
                        <HStack spacing={2}>
                            <Icon as={FaUsers} color={participantCount > 0 ? "primary" : "gray.600"} />
                            <Text fontSize="xs" color={participantCount > 0 ? "white" : "gray.600"} fontWeight="bold">
                                {participantCount} ATLETAS
                            </Text>
                        </HStack>
                        {participantCount > 0 && (
                            <Icon as={showParticipants ? FaChevronUp : FaChevronDown} color="gray.500" boxSize={3} />
                        )}
                    </HStack>

                    {participantCount > 0 && (
                        <AvatarGroup size="xs" max={5}>
                            {participants.map(p => (
                                <Avatar key={p.account} name={p.account} src={getHiveAvatarUrl(p.account)} />
                            ))}
                        </AvatarGroup>
                    )}

                    <Collapse in={showParticipants && participantCount > 0} animateOpacity style={{ width: '100%' }}>
                        <Box p={2} bg="rgba(0,0,0,0.3)" borderRadius="lg" w="100%" maxH="150px" overflowY="auto">
                            <VStack align="flex-start" spacing={1}>
                                {participants.map(p => (
                                    <HStack key={p.account} spacing={2} w="100%">
                                        <Avatar size="2xs" name={p.account} src={getHiveAvatarUrl(p.account)} />
                                        <Text fontSize="10px" color="gray.400">@{p.account}</Text>
                                        <Badge variant="ghost" colorScheme="green" fontSize="8px" ml="auto">ACTIVE</Badge>
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>
                    </Collapse>
                </VStack>

                {/* Ranking Section if available */}
                {ranking && ranking.length > 0 && (
                    <Leaderboard ranking={ranking} />
                )}

                {!ranking && (
                    <Button
                        w="100%"
                        colorScheme={isJoined ? "green" : "primary"}
                        variant={isJoined ? "outline" : "solid"}
                        onClick={() => onJoin(challenge)}
                        isDisabled={isJoined}
                        size="lg"
                        h="50px"
                        fontSize="sm"
                        fontWeight="black"
                        letterSpacing="wide"
                    >
                        {isJoined ? "EN COMPETENCIA" : "COMPRAR ENTRADA"}
                    </Button>
                )}

                {ranking && (
                    <Badge colorScheme="green" variant="solid" w="100%" p={3} textAlign="center" borderRadius="lg">
                        RETO FINALIZADO & PREMIADO
                    </Badge>
                )}
            </VStack>
        </Box>
    );
};

/**
 * ChallengeBoard Component
 * The main container for the M2E challenges section.
 * Handles the async blockchain registration flow and loading states.
 */
const ChallengeBoard = () => {
    const { joinChallenge, magnesium, fetchChallenges, fetchRankings, fetchParticipants, joinedChallenges, isLoading, user } = useFortisM2E();
    const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
    const [allRankings, setAllRankings] = useState<any[]>([]);
    const [allParticipants, setAllParticipants] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadBlockchainData();
    }, [fetchChallenges, fetchRankings, fetchParticipants]); // Added dependencies

    const loadBlockchainData = async () => {
        setLoadingData(true);
        const [bcChallenges, bcRankings, bcParticipants] = await Promise.all([
            fetchChallenges(),
            fetchRankings(),
            fetchParticipants()
        ]);

        // Map blockchain challenges to UI format
        const dynamicChallenges: Challenge[] = bcChallenges.map((bc: any) => {
            const mgType = bc.magnesiumType || 'standard';
            const config = MAGNESIO_CONFIG[mgType as MagnesiumType];
            return {
                id: bc.id,
                title: bc.title,
                description: bc.description,
                magnesiumCost: 1,
                magnesiumType: mgType as MagnesiumType,
                durationDays: bc.durationDays || 7,
                timestamp: bc.timestamp,
                participantRewardFORTIS: `${config.rewardFORTIS} FORTIS`,
                status: 'available'
            };
        });

        setChallenges([...INITIAL_CHALLENGES, ...dynamicChallenges]);
        setAllRankings(bcRankings);
        setAllParticipants(bcParticipants);
        setLoadingData(false);
    };

    /**
     * Entry handler that bridges the UI with Hive Blockchain.
     * Uses Hive Keychain to broadcast a custom_json 'fortis_m2e_entry'.
     */
    const handleJoinChallenge = async (challenge: Challenge) => {
        const type = challenge.magnesiumType || 'standard';

        if (isLoading) return;

        if (magnesium[type] < 1) {
            toast({
                title: "¡Magnesio Insuficiente!",
                description: `Necesitas comprar Magnesio ${MAGNESIO_CONFIG[type].label} para participar.`,
                status: "error",
                duration: 4000,
            });
            return;
        }

        // Async join with proof of entry on Hive
        if (await joinChallenge(challenge.id, 1, type)) {
            toast({
                title: "¡Inscripción Exitosa!",
                description: `Has usado 1 bloque de ${MAGNESIO_CONFIG[type].label}. ¡Comando enviado a la Blockchain!`,
                status: "success",
                duration: 5000,
            });
            // Optimistically update participants list
            if (user) {
                setAllParticipants(prev => [...prev, {
                    account: user,
                    challengeId: challenge.id,
                    timestamp: new Date().toISOString()
                }]);
            }
        }
    };

    return (
        <Box w="100%" py={8}>
            <VStack spacing={6} align="flex-start" opacity={isLoading ? 0.6 : 1} transition="opacity 0.2s">
                <HStack w="100%" justify="space-between">
                    <HStack>
                        <Icon as={FaTrophy} color="primary" boxSize={8} />
                        <Heading size="lg" letterSpacing="widest">POOLS SEMANALES</Heading>
                    </HStack>
                    <Badge colorScheme="green" variant="outline" p={2} borderRadius="md" display="flex" alignItems="center" gap={2}>
                        <Icon as={FaCoins} /> HBD DISTRIBUTED: 245.50
                    </Badge>
                </HStack>
                <Text color="gray.400">
                    {isLoading ? "Cargando tu progreso en la blockchain..." : "Cada pool dura 7 días. El 20% de las entradas forman el premio del Top 3."}
                </Text>

                <Divider borderColor="rgba(217, 148, 20, 0.3)" />

                <Heading size="lg" mb={2}>RETOS DISPONIBLES</Heading>
                <Text color="gray.500" mb={4}>Supera tus límites y gana FORTIS.</Text>
            </VStack>

            {challenges.length === 0 ? (
                <Box py={20} textAlign="center" bg="muted" borderRadius="2xl" border="1px dashed" borderColor="whiteAlpha.200" mt={8}>
                    <Icon as={FaTrophy} boxSize={12} color="gray.600" mb={4} />
                    <Heading size="md" color="gray.400">NO HAY RETOS ACTIVOS</Heading>
                    <Text color="gray.600">Por favor, vuelve más tarde o contacta con administración.</Text>
                </Box>
            ) : (
                <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={8} w="100%" mt={8}>
                    {challenges.map((challenge) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            onJoin={handleJoinChallenge}
                            isJoined={joinedChallenges.includes(challenge.id)}
                            ranking={allRankings.find(r => r.challenge_id === challenge.id)?.ranking}
                            participants={allParticipants.filter(p => p.challengeId === challenge.id)}
                        />
                    ))}
                </SimpleGrid>
            )}
        </Box>
    );
};

export default ChallengeBoard;
