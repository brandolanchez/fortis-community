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
} from '@chakra-ui/react';
import { FaTrophy, FaClock, FaUsers, FaChevronDown, FaChevronUp, FaCoins } from 'react-icons/fa';
import { useFortisM2E, Challenge, MagnesiumType } from '@/hooks/useFortisM2E';
import { getHiveAvatarUrl } from '@/lib/utils/avatarUtils';

/**
 * Mock participant data for social proof.
 * In a production environment, this would be fetched from the Hive blockchain.
 */
const MOCK_PARTICIPANTS = [
    'brandolanchez', 'hive-calisthenics', 'peak.snaps', 'lordbutterfly', 'theycallmedan',
    'ennead', 'threespeak', 'ocd', 'ecency', 'blocktrades'
];

/**
 * Configuration for Magnesium types to maintain consistency across the UI.
 */
const MAGNESIO_CONFIG: Record<MagnesiumType, { label: string, color: string }> = {
    standard: { label: 'MAGNESIO ESENCIAL', color: 'gray' },
    aged: { label: 'AGARRE MAESTRO', color: 'orange' },
    gold: { label: 'FRICCIÓN DIVINA', color: 'yellow' }
};

/**
 * Initial pool of challenges. 
 * Rewards are balanced based on the $0.03/FORTIS target to ensure economic sustainability.
 */
const INITIAL_CHALLENGES: Challenge[] = [
    {
        id: '1',
        title: 'Muscle-Up Master',
        description: 'Realiza 30 Muscle-ups en menos de 10 minutos. Sube tu video a 3Speak para validar.',
        magnesiumCost: 1,
        magnesiumType: 'standard',
        participantRewardFORTIS: '10 FORTIS',
        status: 'available'
    },
    {
        id: '2',
        title: 'Caracas Beast Mode: Evento Presencial',
        description: 'Competencia presencial en el parque. La inscripción requiere Agarre Maestro.',
        magnesiumCost: 1,
        magnesiumType: 'aged',
        participantRewardFORTIS: '30 FORTIS',
        status: 'available'
    },
    {
        id: '3',
        title: 'Elite Pull-up Marathon: Pool de Oro',
        description: 'El reto definitivo para los Atletas de Fricción Divina. Pool de premios masivo en HBD.',
        magnesiumCost: 1,
        magnesiumType: 'gold',
        participantRewardFORTIS: '50 FORTIS',
        status: 'available'
    }
];

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
 * ChallengeCard Component
 * Displays individual challenge details, dynamic prize pools, and social participation.
 * 
 * @param challenge - The challenge data object
 * @param onJoin - Callback for the join operation
 * @param isJoined - Boolean flag if the current user has already entered the pool
 */
const ChallengeCard = ({ challenge, onJoin, isJoined }: { challenge: Challenge, onJoin: (c: Challenge) => void, isJoined: boolean }) => {
    const { costMultiplier } = useFortisM2E();
    const [showParticipants, setShowParticipants] = useState(false);

    // DYNAMIC PRIZE CALCULATION:
    // This simulates a real-time pool where 20% of all entry fees (0.20 HBD each) 
    // are distributed among the Top 3 winners.
    const entryValueHBD = 0.20;
    const simulatedParticipants = 12 + (challenge.id === '3' ? 45 : challenge.id === '2' ? 28 : 10);
    const poolAmount = (simulatedParticipants * entryValueHBD * 0.20).toFixed(2);

    const config = MAGNESIO_CONFIG[challenge.magnesiumType || 'standard'];

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
                        {/* Pool Expiry: 7-day duration simulation */}
                        <CountdownTimer expiryDate={new Date(Date.now() + 1000 * 60 * 60 * 24 * 6 + 1000 * 3600 * 4)} />
                    </HStack>
                </VStack>

                <Text fontSize="sm" color="gray.400" minH="50px">
                    {challenge.description}
                </Text>

                <Divider borderColor="rgba(255,255,255,0.1)" />

                <SimpleGrid columns={2} w="100%" spacing={2}>
                    <VStack align="flex-start" spacing={0} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md">
                        <Text fontSize="9px" color="gray.500" fontWeight="bold">RECOMPENSA</Text>
                        <Text fontSize="xs" color="green.300" fontWeight="black">{challenge.participantRewardFORTIS}</Text>
                    </VStack>
                    <VStack align="flex-start" spacing={0} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md">
                        <Text fontSize="9px" color="gray.500" fontWeight="bold">POOL TOP 3 (HBD)</Text>
                        <Text fontSize="xs" color="yellow.400" fontWeight="black">+{poolAmount} HBD</Text>
                    </VStack>
                </SimpleGrid>

                {/* Social Section */}
                <VStack w="100%" spacing={2} align="flex-start">
                    <HStack w="100%" justify="space-between" cursor="pointer" onClick={() => setShowParticipants(!showParticipants)}>
                        <HStack spacing={2}>
                            <Icon as={FaUsers} color="gray.500" />
                            <Text fontSize="xs" color="gray.500" fontWeight="bold">{simulatedParticipants} ATLETAS</Text>
                        </HStack>
                        <Icon as={showParticipants ? FaChevronUp : FaChevronDown} color="gray.500" boxSize={3} />
                    </HStack>

                    <AvatarGroup size="xs" max={5}>
                        {MOCK_PARTICIPANTS.slice(0, simulatedParticipants % 10 + 5).map(u => (
                            <Avatar key={u} name={u} src={getHiveAvatarUrl(u)} />
                        ))}
                    </AvatarGroup>

                    <Collapse in={showParticipants} animateOpacity style={{ width: '100%' }}>
                        <Box p={2} bg="rgba(0,0,0,0.3)" borderRadius="lg" w="100%">
                            <VStack align="flex-start" spacing={1}>
                                {MOCK_PARTICIPANTS.slice(0, 5).map(u => (
                                    <HStack key={u} spacing={2} w="100%">
                                        <Avatar size="2xs" name={u} src={getHiveAvatarUrl(u)} />
                                        <Text fontSize="10px" color="gray.400">{u}</Text>
                                        <Badge variant="ghost" colorScheme="green" fontSize="8px" ml="auto">ACTIVE</Badge>
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>
                    </Collapse>
                </VStack>

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
    const { joinChallenge, magnesium, costMultiplier, joinedChallenges, isLoading } = useFortisM2E();
    const toast = useToast();

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

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
                    {INITIAL_CHALLENGES.map((challenge) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            onJoin={handleJoinChallenge}
                            isJoined={joinedChallenges.includes(challenge.id)}
                        />
                    ))}
                </SimpleGrid>
            </VStack>
        </Box>
    );
};

export default ChallengeBoard;
