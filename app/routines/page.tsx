'use client';
import React from 'react';
import { Container, Box } from '@chakra-ui/react';
import RoutinesBoard from '@/components/m2e/RoutinesBoard';

export default function RoutinesPage() {
    return (
        <Container maxW="container.xl" py={8}>
            <Box mt={{ base: "60px", sm: "0" }}>
                <RoutinesBoard />
            </Box>
        </Container>
    );
}
