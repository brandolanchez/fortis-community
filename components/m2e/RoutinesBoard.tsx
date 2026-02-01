'use client';
import React from 'react';
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
    Divider,
    Flex,
    Image,
} from '@chakra-ui/react';
import { FiClock, FiPlay, FiTarget, FiZap } from 'react-icons/fi';
import { FaDumbbell } from 'react-icons/fa';

import { useRouter } from 'next/navigation';
import { ROUTINES_DATA, Routine } from '@/lib/data/routines';

const RoutinesBoard = () => {
    const router = useRouter();

    const handleViewRoutine = (id: string) => {
        router.push(`/routines/${id}`);
    };

    return (
        <Box w="100%" py={8}>
            <VStack spacing={6} align="flex-start">
                <HStack w="100%" justify="space-between">
                    <HStack>
                        <Icon as={FaDumbbell} color="primary" boxSize={8} />
                        <Heading size="lg" letterSpacing="widest">RUTINAS DE ENTRENAMIENTO</Heading>
                    </HStack>
                    <Badge colorScheme="blue" variant="solid" p={2} borderRadius="md" fontSize="10px">
                        NUEVAS RUTINAS SEMANALES
                    </Badge>
                </HStack>
                <Text color="gray.400">Selecciona una rutina para ver los detalles y empezar a entrenar.</Text>

                <Divider borderColor="rgba(217, 148, 20, 0.3)" />

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
                    {ROUTINES_DATA.map((routine) => (
                        <Box
                            key={routine.id}
                            bg="muted"
                            borderRadius="2xl"
                            overflow="hidden"
                            border="1px solid"
                            borderColor="rgba(255,255,255,0.05)"
                            transition="all 0.3s"
                            _hover={{
                                transform: 'translateY(-5px)',
                                borderColor: 'primary',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                        >
                            <Box h="160px" position="relative">
                                <Image
                                    src={routine.image}
                                    alt={routine.title}
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                    opacity={0.7}
                                />
                                <Badge
                                    position="absolute"
                                    top={4}
                                    right={4}
                                    colorScheme={
                                        routine.level === 'Avanzado' ? 'red' :
                                            routine.level === 'Intermedio' ? 'orange' : 'green'
                                    }
                                >
                                    {routine.level.toUpperCase()}
                                </Badge>
                            </Box>

                            <VStack p={6} align="flex-start" spacing={4}>
                                <Heading size="md">{routine.title}</Heading>

                                <HStack spacing={4} w="100%">
                                    <HStack spacing={1}>
                                        <Icon as={FiClock} color="gray.500" boxSize={3} />
                                        <Text fontSize="xs" color="gray.400">{routine.duration}</Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                        <Icon as={FiTarget} color="gray.500" boxSize={3} />
                                        <Text fontSize="xs" color="gray.400">{routine.exercises} Ejercicios</Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                        <Icon as={FiZap} color="yellow.400" boxSize={3} />
                                        <Text fontSize="xs" color="yellow.400">{routine.points} XP</Text>
                                    </HStack>
                                </HStack>

                                <Text fontSize="xs" color="gray.500" noOfLines={2}>
                                    {routine.description}
                                </Text>

                                <Button
                                    w="100%"
                                    colorScheme="primary"
                                    leftIcon={<Icon as={FiPlay} />}
                                    size="md"
                                    fontWeight="black"
                                    onClick={() => handleViewRoutine(routine.id)}
                                >
                                    VER
                                </Button>
                            </VStack>
                        </Box>
                    ))}
                </SimpleGrid>
            </VStack>
        </Box>
    );
};

export default RoutinesBoard;
