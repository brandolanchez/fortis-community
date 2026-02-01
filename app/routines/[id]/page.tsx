'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import RoutineDetail from '@/components/m2e/RoutineDetail';
import { ROUTINES_DATA } from '@/lib/data/routines';
import { Center, Heading, VStack, Button, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function RoutineDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const routine = ROUTINES_DATA.find(r => r.id === id);

    if (!routine) {
        return (
            <Center h="100vh">
                <VStack spacing={4}>
                    <Heading>Rutina no encontrada</Heading>
                    <Text>Lo sentimos, no pudimos encontrar la rutina solicitada.</Text>
                    <Button as={NextLink} href="/routines" colorScheme="primary">
                        Volver a Rutinas
                    </Button>
                </VStack>
            </Center>
        );
    }

    return <RoutineDetail routine={routine} />;
}
