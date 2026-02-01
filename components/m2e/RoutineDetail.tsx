'use client';
import React from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Badge,
    HStack,
    Icon,
    Divider,
    Button,
    Container,
    Image,
    IconButton,
} from '@chakra-ui/react';
import { FiArrowLeft, FiClock, FiTarget, FiZap } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';

interface RoutineDetailProps {
    routine: {
        id: string;
        title: string;
        level: string;
        duration: string;
        exercises: number;
        points: number;
        image: string;
        content: string;
    };
}

const RoutineDetail: React.FC<RoutineDetailProps> = ({ routine }) => {
    const router = useRouter();

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={6} align="flex-start">
                <IconButton
                    aria-label="Volver"
                    icon={<FiArrowLeft />}
                    variant="ghost"
                    onClick={() => router.back()}
                    color="gray.400"
                    _hover={{ color: 'primary', bg: 'rgba(255,255,255,0.05)' }}
                />

                <Box w="100%" borderRadius="2xl" overflow="hidden" position="relative" h="300px">
                    <Image
                        src={routine.image}
                        alt={routine.title}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                    />
                    <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        bgGradient="linear(to-t, background, transparent)"
                        p={8}
                    >
                        <Badge
                            colorScheme={
                                routine.level === 'Avanzado' ? 'red' :
                                    routine.level === 'Intermedio' ? 'orange' : 'green'
                            }
                            mb={2}
                        >
                            {routine.level.toUpperCase()}
                        </Badge>
                        <Heading size="2xl" color="white" textShadow="0 2px 10px rgba(0,0,0,0.5)">
                            {routine.title}
                        </Heading>
                    </Box>
                </Box>

                <HStack spacing={8} w="100%" py={4} justify="center" bg="muted" borderRadius="xl" border="1px solid" borderColor="rgba(255,255,255,0.05)">
                    <VStack spacing={0}>
                        <Icon as={FiClock} color="primary" />
                        <Text fontSize="sm" fontWeight="bold">{routine.duration}</Text>
                        <Text fontSize="10px" color="gray.500">DURACIÓN</Text>
                    </VStack>
                    <Divider orientation="vertical" h="40px" />
                    <VStack spacing={0}>
                        <Icon as={FiTarget} color="primary" />
                        <Text fontSize="sm" fontWeight="bold">{routine.exercises}</Text>
                        <Text fontSize="10px" color="gray.500">EJERCICIOS</Text>
                    </VStack>
                    <Divider orientation="vertical" h="40px" />
                    <VStack spacing={0}>
                        <Icon as={FiZap} color="yellow.400" />
                        <Text fontSize="sm" fontWeight="bold">{routine.points}</Text>
                        <Text fontSize="10px" color="gray.500">RECOMPENSA</Text>
                    </VStack>
                </HStack>

                <Box
                    w="100%"
                    mt={4}
                    dangerouslySetInnerHTML={{ __html: markdownRenderer(routine.content) }}
                    sx={{
                        textAlign: 'left',
                        '& p': {
                            marginBottom: '1.2em',
                            lineHeight: '1.8',
                            color: 'gray.300',
                            fontSize: 'md'
                        },
                        '& h1, & h2, & h3': {
                            color: 'white',
                            marginTop: '1.5em',
                            marginBottom: '0.8em',
                            fontWeight: 'bold',
                            letterSpacing: 'wide'
                        },
                        '& h1': { fontSize: '2xl' },
                        '& h2': { fontSize: 'xl', borderLeft: '4px solid', borderColor: 'primary', pl: 4 },
                        '& img': {
                            marginTop: '1.5em',
                            marginBottom: '1.5em',
                            maxWidth: '100%',
                            borderRadius: 'xl',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                        },
                        '& ul, & ol': {
                            marginLeft: '1.5em',
                            marginBottom: '1.2em',
                            color: 'gray.300'
                        },
                        '& li': {
                            marginBottom: '0.5em'
                        },
                        '& blockquote': {
                            borderLeft: '4px solid',
                            borderColor: 'gray.600',
                            pl: 4,
                            fontStyle: 'italic',
                            color: 'gray.400',
                            my: 6
                        },
                        '& code': {
                            bg: 'rgba(255,255,255,0.1)',
                            px: 2,
                            py: 1,
                            borderRadius: 'md',
                            fontSize: '0.9em'
                        }
                    }}
                />

                <Button
                    w="100%"
                    size="lg"
                    colorScheme="primary"
                    h="60px"
                    fontSize="lg"
                    fontWeight="black"
                    letterSpacing="widest"
                    boxShadow="0 4px 15px rgba(217, 148, 20, 0.3)"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(217, 148, 20, 0.4)' }}
                >
                    COMENZAR ENTRENAMIENTO
                </Button>
            </VStack>
        </Container>
    );
};

export default RoutineDetail;
