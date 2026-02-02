'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    SimpleGrid,
    Spinner,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    NumberDecrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Select,
    Image,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    useToast,
    useDisclosure,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Badge,
    Button,
    Icon,
    Avatar,
    Divider,
} from '@chakra-ui/react';
import { FaShieldAlt, FaUsers, FaCoins, FaHistory, FaCheckCircle, FaExclamationTriangle, FaPlus, FaRunning, FaMedal, FaBolt } from 'react-icons/fa';
import { useFortisM2E, MagnesiumType } from '@/hooks/useFortisM2E';
import { useKeychain } from '@/contexts/KeychainContext';
import { getHiveAvatarUrl } from '@/lib/utils/avatarUtils';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';

// Admin restricted accounts
const ADMIN_ACCOUNTS = ['hecatonquirox', 'fortis.m2e'];

const AdminM2E = () => {
    const { user } = useKeychain();
    const isAdmin = user && ADMIN_ACCOUNTS.includes(user);
    const {
        fetchParticipants,
        payoutRewards,
        createChallenge,
        fetchChallenges,
        saveRanking,
        fetchFaucetClaims,
        payoutFaucet,
        isLoading: m2eLoading
    } = useFortisM2E();
    const [participants, setParticipants] = useState<any[]>([]);
    const [blockchainChallenges, setBlockchainChallenges] = useState<any[]>([]);
    const [faucetClaims, setFaucetClaims] = useState<{ pending: any[], history: any[] }>({ pending: [], history: [] });
    const [loading, setLoading] = useState(true);
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const [newChallenge, setNewChallenge] = useState({ title: '', description: '', duration: 7, magnesiumType: 'standard' as MagnesiumType });
    const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
    const [rankings, setRankings] = useState<{ [key: string]: number }>({});
    const [searchUser, setSearchUser] = useState('');
    const toast = useToast();

    useEffect(() => {
        if (isAdmin) {
            loadInitialData();
        }
    }, [isAdmin]);

    const loadInitialData = async () => {
        setLoading(true);
        const [entries, challenges, claims] = await Promise.all([
            fetchParticipants(),
            fetchChallenges(),
            fetchFaucetClaims()
        ]);
        setParticipants(entries);
        setBlockchainChallenges(challenges);
        setFaucetClaims(claims);
        if (challenges.length > 0) setSelectedChallengeId(challenges[0].id);
        setLoading(false);
    };

    const handleAddManualClaim = () => {
        if (!searchUser) return;
        const normalized = searchUser.replace('@', '').trim().toLowerCase();
        if (faucetClaims.pending.some(c => c.account === normalized)) return;

        setFaucetClaims(prev => ({
            ...prev,
            pending: [{
                account: normalized,
                timestamp: new Date().toISOString()
            }, ...prev.pending]
        }));
        setSearchUser('');
        toast({ title: "Usuario agregado a la lista", status: "info" });
    };

    const handleProcessFaucet = async () => {
        if (faucetClaims.pending.length === 0) return;
        const confirmAction = window.confirm(`¿Distribuir 20 FORTIS a cada uno de los ${faucetClaims.pending.length} atletas?`);
        if (!confirmAction) return;
        await payoutFaucet(faucetClaims.pending);
        await loadInitialData();
    };

    if (!isAdmin) {
        return (
            <Container maxW="container.md" py={20}>
                <VStack spacing={6} p={10} bg="muted" borderRadius="2xl" border="2px solid red">
                    <Icon as={FaExclamationTriangle} color="red.500" boxSize={12} />
                    <Heading size="lg">ACCESO DENEGADO</Heading>
                    <Text textAlign="center" color="gray.400">
                        Esta sección es exclusiva para administradores de Fortis.
                        Si eres el administrador, por favor asegúrate de haber iniciado sesión con una cuenta autorizada.
                    </Text>
                    <Button colorScheme="primary" variant="outline" onClick={() => window.location.href = '/'}>
                        Volver al Inicio
                    </Button>
                </VStack>
            </Container>
        );
    }

    // Calculations based on participants
    const totalEarningsHBD = participants.reduce((acc, p) => {
        // Price logic: Gold=5, Aged=3, Standard=1
        const price = p.magnesium_type === 'gold' ? 5 : p.magnesium_type === 'aged' ? 3 : 1;
        return acc + (price * 0.20); // 20% of entry fee goes to protocol/pool
    }, 0).toFixed(2);

    const fullEntryRevenue = participants.reduce((acc, p) => {
        const price = p.magnesium_type === 'gold' ? 5 : p.magnesium_type === 'aged' ? 3 : 1;
        return acc + price;
    }, 0);

    const uniqueAthletes = new Set(participants.map(p => p.account)).size;
    const totalPaidFORTIS = participants.reduce((acc, p) => {
        const reward = p.magnesium_type === 'gold' ? 50 : p.magnesium_type === 'aged' ? 30 : 10;
        return acc + reward;
    }, 0);

    const handleProcessPayouts = async () => {
        if (participants.length === 0) return;

        const confirmAction = window.confirm(`¿Estás seguro de que deseas procesar ${participants.length} pagos? Asegúrate de estar logueado con la cuenta que tiene los fondos (ej: @fortis.m2e).`);
        if (!confirmAction) return;

        const rewardsToDistribute = participants.map(p => ({
            account: p.account,
            challengeId: p.challengeId,
            amount: p.magnesium_type === 'gold' ? 50 : p.magnesium_type === 'aged' ? 30 : 10
        }));

        await payoutRewards(rewardsToDistribute);
        await loadInitialData();
    };

    const handleCreateChallenge = async () => {
        if (!newChallenge.title || !newChallenge.description) return;
        const success = await createChallenge(
            newChallenge.title,
            newChallenge.description,
            newChallenge.duration,
            newChallenge.magnesiumType
        );
        if (success) {
            onCreateClose();
            setNewChallenge({ title: '', description: '', duration: 7, magnesiumType: 'standard' });
            loadInitialData();
        }
    };

    const handleSaveRanking = async () => {
        if (!selectedChallengeId) return;
        const athletesForChallenge = participants.filter(p => p.challengeId === selectedChallengeId);
        const finalRanking = athletesForChallenge.map(p => ({
            account: p.account,
            score: rankings[p.account] || 0,
            rank: 0 // Will be calculated after sorting
        })).sort((a, b) => b.score - a.score)
            .map((r, i) => ({ ...r, rank: i + 1 }));

        const success = await saveRanking(selectedChallengeId, finalRanking);
        if (success) {
            toast({ title: "Ranking Guardado", status: "success" });
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="flex-start">
                <HStack w="100%" justify="space-between">
                    <VStack align="flex-start" spacing={1}>
                        <HStack>
                            <Icon as={FaShieldAlt} color="primary" boxSize={6} />
                            <Heading size="lg" letterSpacing="widest">PANEL DE CONTROL M2E</Heading>
                        </HStack>
                        <Text color="gray.400">Control maestro de la economía FORTIS y pools de retos.</Text>
                    </VStack>
                    <HStack spacing={4}>
                        <Button leftIcon={<FaPlus />} colorScheme="primary" onClick={onCreateOpen}>
                            NUEVO RETO
                        </Button>
                        <Button leftIcon={<FaHistory />} onClick={loadInitialData} isLoading={loading}>
                            ACTUALIZAR DATOS
                        </Button>
                    </HStack>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="100%">
                    <Stat bg="muted" p={5} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                        <HStack justify="space-between" align="flex-start">
                            <VStack align="flex-start" spacing={0}>
                                <StatLabel color="gray.500">TOTAL RECAUDADO</StatLabel>
                                <StatNumber color="green.300">{totalEarningsHBD} HBD</StatNumber>
                            </VStack>
                            <Image src="https://cryptologos.cc/logos/hive-blockchain-hive-logo.png" boxSize="30px" alt="Hive" />
                        </HStack>
                        <StatHelpText> Revenue de Magnesio </StatHelpText>
                    </Stat>
                    <Stat bg="muted" p={5} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                        <HStack justify="space-between" align="flex-start">
                            <VStack align="flex-start" spacing={0}>
                                <StatLabel color="gray.500">TOTAL PAGADO</StatLabel>
                                <StatNumber color="primary">{totalPaidFORTIS} FORTIS</StatNumber>
                            </VStack>
                            <Image src="https://lrclcispixleskrskkjw.supabase.co/storage/v1/object/public/imagenes/tokenlogo.jpg" boxSize="30px" borderRadius="full" alt="Fortis" />
                        </HStack>
                        <StatHelpText> Premios Distribuidos </StatHelpText>
                    </Stat>
                    <Stat bg="muted" p={5} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                        <StatLabel color="gray.500">ATLETAS ACTIVOS</StatLabel>
                        <StatNumber color="yellow.400">{uniqueAthletes}</StatNumber>
                        <StatHelpText> Usuarios únicos </StatHelpText>
                    </Stat>
                </SimpleGrid>

                <Tabs variant="enclosed" w="100%" colorScheme="primary">
                    <TabList borderBottom="1px solid" borderColor="whiteAlpha.200">
                        <Tab _selected={{ color: 'primary', borderColor: 'primary', borderBottomColor: 'muted' }}>💰 PAGOS Y ATLETAS</Tab>
                        <Tab _selected={{ color: 'primary', borderColor: 'primary', borderBottomColor: 'muted' }}>🏆 JURADO & RANKING</Tab>
                        <Tab _selected={{ color: 'primary', borderColor: 'primary', borderBottomColor: 'muted' }}>📋 LISTA DE RETOS</Tab>
                        <Tab _selected={{ color: 'primary', borderColor: 'primary', borderBottomColor: 'muted' }}>🚰 FAUCET (AIRDROP)</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0} pt={6}>
                            <Box w="100%" bg="muted" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                <HStack mb={6} justify="space-between">
                                    <Heading size="md">ATLETAS EN ESPERA DE PAGO</Heading>
                                    <Button colorScheme="green" leftIcon={<FaCoins />} onClick={handleProcessPayouts} isDisabled={participants.length === 0}>
                                        FINALIZAR SEMANA & PAGAR
                                    </Button>
                                </HStack>

                                {loading ? (
                                    <VStack py={10}>
                                        <Spinner color="primary" />
                                        <Text mt={4}>Escaneando la Blockchain de Hive...</Text>
                                    </VStack>
                                ) : (
                                    <Box overflowX="auto">
                                        <Table variant="simple">
                                            <Thead>
                                                <Tr>
                                                    <Th color="gray.500">ATLETA</Th>
                                                    <Th color="gray.500">RETO ID</Th>
                                                    <Th color="gray.500">TIPO MAGNESIO</Th>
                                                    <Th color="gray.500">FECHA/HORA</Th>
                                                    <Th color="gray.500">ESTADO</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {participants.map((entry, idx) => (
                                                    <Tr key={idx}>
                                                        <Td>
                                                            <HStack>
                                                                <Avatar size="xs" src={getHiveAvatarUrl(entry.account)} name={entry.account} />
                                                                <Text fontWeight="bold">@{entry.account}</Text>
                                                            </HStack>
                                                        </Td>
                                                        <Td>#{entry.challengeId}</Td>
                                                        <Td>
                                                            <Badge colorScheme={entry.magnesium_type === 'gold' ? 'yellow' : entry.magnesium_type === 'aged' ? 'orange' : 'gray'}>
                                                                {entry.magnesium_type?.toUpperCase() || 'STANDARD'}
                                                            </Badge>
                                                        </Td>
                                                        <Td fontSize="xs" color="gray.500">
                                                            {new Date(entry.timestamp).toLocaleString()}
                                                        </Td>
                                                        <Td>
                                                            <Badge variant="outline" colorScheme="green">
                                                                VALIDO (BLOCKCHAIN)
                                                            </Badge>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                                {participants.length === 0 && (
                                                    <Tr>
                                                        <Td colSpan={5} textAlign="center" py={10} color="gray.500">
                                                            No se encontraron inscripciones recientes en la blockchain.
                                                        </Td>
                                                    </Tr>
                                                )}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                )}
                            </Box>
                        </TabPanel>

                        <TabPanel px={0} pt={6}>
                            <VStack spacing={6} align="stretch">
                                <Box bg="muted" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                    <HStack mb={6} justify="space-between">
                                        <VStack align="flex-start" spacing={0}>
                                            <Heading size="md">CALIFICACIÓN DE ATLETAS</Heading>
                                            <Text fontSize="sm" color="gray.500">Asigna puntajes tras revisar videos de 3Speak.</Text>
                                        </VStack>
                                        <HStack>
                                            <Text fontSize="sm" mr={2}>Reto:</Text>
                                            <Box as="select"
                                                value={selectedChallengeId}
                                                onChange={(e: any) => setSelectedChallengeId(e.target.value)}
                                                bg="blackAlpha.300"
                                                p={2}
                                                borderRadius="md"
                                                color="white"
                                            >
                                                {blockchainChallenges.map(c => (
                                                    <option key={c.id} value={c.id} style={{ backgroundColor: '#1a202c' }}>{c.title}</option>
                                                ))}
                                            </Box>
                                        </HStack>
                                    </HStack>

                                    <Table variant="simple" mb={6}>
                                        <Thead>
                                            <Tr>
                                                <Th color="gray.500">POSICIÓN</Th>
                                                <Th color="gray.500">ATLETA</Th>
                                                <Th color="gray.500">PUNTUACIÓN (0-100)</Th>
                                                <Th color="gray.500">ESTADO</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {participants.filter(p => p.challengeId === selectedChallengeId).map((p, idx) => (
                                                <Tr key={p.account}>
                                                    <Td><Text color="gray.500">#{idx + 1}</Text></Td>
                                                    <Td>
                                                        <HStack>
                                                            <Avatar size="sm" src={getHiveAvatarUrl(p.account)} name={p.account} />
                                                            <Text fontWeight="bold">@{p.account}</Text>
                                                        </HStack>
                                                    </Td>
                                                    <Td>
                                                        <NumberInput
                                                            max={100} min={0}
                                                            size="md"
                                                            maxW={24}
                                                            defaultValue={0}
                                                            onChange={(val) => setRankings(prev => ({ ...prev, [p.account]: parseInt(val) }))}
                                                        >
                                                            <NumberInputField border="1px solid" borderColor="whiteAlpha.200" />
                                                            <NumberInputStepper>
                                                                <NumberIncrementStepper />
                                                                <NumberDecrementStepper />
                                                            </NumberInputStepper>
                                                        </NumberInput>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme="blue">PENDIENTE</Badge>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>

                                    <Button colorScheme="primary" leftIcon={<FaMedal />} onClick={handleSaveRanking} w="100%">
                                        GRABAR RANKING OFICIAL EN BLOCKCHAIN
                                    </Button>
                                </Box>
                            </VStack>
                        </TabPanel>

                        <TabPanel px={0} pt={6}>
                            <Box bg="muted" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                <Heading size="md" mb={6}>HISTORIAL DE RETOS CREADOS</Heading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    {blockchainChallenges.map(c => (
                                        <Box key={c.id} p={4} bg="blackAlpha.300" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                                            <HStack mb={2} justify="space-between">
                                                <Heading size="xs" color="primary">{c.title}</Heading>
                                                <Badge colorScheme={c.magnesiumType === 'gold' ? 'yellow' : c.magnesiumType === 'aged' ? 'orange' : 'gray'}>
                                                    {c.magnesiumType?.toUpperCase() || 'STANDARD'}
                                                </Badge>
                                            </HStack>
                                            <Text fontSize="xs" mb={2} color="gray.300">Duración: {c.durationDays || '7'} Días</Text>
                                            <Box
                                                fontSize="sm"
                                                color="gray.400"
                                                noOfLines={2}
                                                dangerouslySetInnerHTML={{ __html: markdownRenderer(c.description) }}
                                                sx={{ '& ul, & ol': { ml: 4 }, '& li': { mb: 1 } }}
                                            />
                                            <Divider my={3} opacity={0.1} />
                                            <Text fontSize="xs" color="gray.600">ID: {c.id} | Creado: {new Date(c.timestamp).toLocaleDateString()}</Text>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            </Box>
                        </TabPanel>

                        <TabPanel px={0} pt={6}>
                            <Box bg="muted" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                <HStack mb={6} justify="space-between" flexWrap="wrap">
                                    <VStack align="flex-start" spacing={2} minW="300px">
                                        <Heading size="md">CONTROL DE FAUCET</Heading>
                                        <Text fontSize="xs" color="gray.500">Gestión de airdrops y reclamos de FORTIS gratuitos.</Text>
                                    </VStack>
                                    <HStack>
                                        <Input
                                            size="sm"
                                            placeholder="Usuario manual (ej: brandolanchez)"
                                            bg="blackAlpha.300"
                                            value={searchUser}
                                            onChange={(e) => setSearchUser(e.target.value)}
                                            w="200px"
                                        />
                                        <Button size="sm" colorScheme="blue" onClick={handleAddManualClaim}>+ AÑADIR</Button>
                                    </HStack>
                                </HStack>

                                <Tabs variant="soft-rounded" colorScheme="orange" size="sm">
                                    <TabList mb={4}>
                                        <Tab>⏳ PENDIENTES ({faucetClaims.pending.length})</Tab>
                                        <Tab>📜 HISTORIAL DE PAGOS</Tab>
                                    </TabList>

                                    <TabPanels>
                                        {/* PENDIENTES */}
                                        <TabPanel px={0}>
                                            <HStack justify="flex-end" mb={2}>
                                                <Button colorScheme="green" leftIcon={<FaBolt />} onClick={handleProcessFaucet} isDisabled={faucetClaims.pending.length === 0} size="sm">
                                                    PAGAR TODOS ({faucetClaims.pending.length})
                                                </Button>
                                            </HStack>
                                            <Box overflowX="auto">
                                                <Table variant="simple" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            <Th>ATLETA</Th>
                                                            <Th>SOLICITADO</Th>
                                                            <Th>ESTADO</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {faucetClaims.pending.map((claim: any, idx: number) => (
                                                            <Tr key={idx}>
                                                                <Td>
                                                                    <HStack>
                                                                        <Avatar size="xs" src={getHiveAvatarUrl(claim.account)} name={claim.account} />
                                                                        <Text fontWeight="bold">@{claim.account}</Text>
                                                                    </HStack>
                                                                </Td>
                                                                <Td fontSize="xs" color="gray.400">{new Date(claim.timestamp).toLocaleString()}</Td>
                                                                <Td><Badge colorScheme="orange">PENDIENTE</Badge></Td>
                                                            </Tr>
                                                        ))}
                                                        {faucetClaims.pending.length === 0 && (
                                                            <Tr><Td colSpan={3} textAlign="center" py={6} color="gray.500">No hay solicitudes pendientes.</Td></Tr>
                                                        )}
                                                    </Tbody>
                                                </Table>
                                            </Box>
                                        </TabPanel>

                                        {/* HISTORIAL */}
                                        <TabPanel px={0}>
                                            <Box overflowX="auto" maxH="400px" overflowY="auto">
                                                <Table variant="simple" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            <Th>DESTINATARIO</Th>
                                                            <Th>CANTIDAD</Th>
                                                            <Th>FECHA PAGO</Th>
                                                            <Th>TX ID</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {faucetClaims.history.map((tx: any, idx: number) => (
                                                            <Tr key={idx}>
                                                                <Td>
                                                                    <HStack>
                                                                        <Avatar size="xs" src={getHiveAvatarUrl(tx.account)} name={tx.account} />
                                                                        <Text>@{tx.account}</Text>
                                                                    </HStack>
                                                                </Td>
                                                                <Td>
                                                                    <Text color="green.300" fontWeight="bold">{tx.amount} {tx.symbol}</Text>
                                                                </Td>
                                                                <Td fontSize="xs" color="gray.400">{new Date(tx.timestamp).toLocaleString()}</Td>
                                                                <Td>
                                                                    <Text fontSize="xs" fontFamily="monospace" color="gray.500" maxW="100px" isTruncated title={tx.txId}>
                                                                        {tx.txId}
                                                                    </Text>
                                                                </Td>
                                                            </Tr>
                                                        ))}
                                                        {faucetClaims.history.length === 0 && (
                                                            <Tr><Td colSpan={4} textAlign="center" py={6} color="gray.500">No hay historial de pagos disponible.</Td></Tr>
                                                        )}
                                                    </Tbody>
                                                </Table>
                                            </Box>
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>
                            </Box>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                {/* Modal para Crear Reto */}
                <Modal isOpen={isCreateOpen} onClose={onCreateClose} isCentered>
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent bg="muted" borderRadius="2xl" minW="500px">
                        <ModalHeader>🚀 LANZAR NUEVO RETO FORTIS</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Título del Reto</FormLabel>
                                    <Input
                                        placeholder="Ej: King of Handstand"
                                        bg="blackAlpha.300"
                                        value={newChallenge.title}
                                        onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Descripción y Reglas</FormLabel>
                                    <Textarea
                                        placeholder="Reglas del desafío, duración, requerimientos de video..."
                                        bg="blackAlpha.300"
                                        h="150px"
                                        value={newChallenge.description}
                                        onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </FormControl>

                                <HStack w="100%" spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel>Tipo de Magnesio</FormLabel>
                                        <Select
                                            bg="blackAlpha.400"
                                            value={newChallenge.magnesiumType}
                                            onChange={(e) => setNewChallenge(prev => ({ ...prev, magnesiumType: e.target.value as MagnesiumType }))}
                                        >
                                            <option value="standard" style={{ backgroundColor: '#1a202c' }}>Standard (Económico)</option>
                                            <option value="aged" style={{ backgroundColor: '#1a202c' }}>Aged (Intermedio)</option>
                                            <option value="gold" style={{ backgroundColor: '#1a202c' }}>Gold (Elite)</option>
                                            <option value="airdrop" style={{ backgroundColor: '#1a202c' }}>Airdrop (Test - 20 FORTIS)</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Duración: {newChallenge.duration} Días</FormLabel>
                                        <Slider
                                            min={1} max={7} step={1}
                                            value={newChallenge.duration}
                                            onChange={(val) => setNewChallenge(prev => ({ ...prev, duration: val }))}
                                        >
                                            <SliderTrack bg="whiteAlpha.200">
                                                <SliderFilledTrack bg="primary" />
                                            </SliderTrack>
                                            <SliderThumb boxSize={6} bg="primary" />
                                        </Slider>
                                    </FormControl>
                                </HStack>
                                <Box p={4} bg="blackAlpha.200" borderRadius="lg" w="100%">
                                    <HStack color="gray.400" fontSize="xs">
                                        <Icon as={FaShieldAlt} />
                                        <Text>Este reto se grabará de forma inmutable en la Blockchain de Hive.</Text>
                                    </HStack>
                                </Box>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onCreateClose}>CANCELAR</Button>
                            <Button colorScheme="primary" onClick={handleCreateChallenge}>LANZAR RETO</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Container>
    );
};

export default AdminM2E;
