'use client';

import React from 'react';
import {
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink
} from '@chakra-ui/react';
import MagnesiumStatus from '@/components/m2e/MagnesiumStatus';
import ChallengeBoard from '@/components/m2e/ChallengeBoard';

const ChallengesPage = () => {
    return (
        <Container maxW="container.xl" pt={8} pb={10}>
            <VStack align="flex-start" spacing={6}>
                <Breadcrumb color="gray.500" fontSize="sm">
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink href="#">Retos Fortis</BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>

                <HStack w="100%" justify="space-between" align="flex-start" wrap="wrap" gap={6}>
                    <VStack align="flex-start" flex="1" minW="300px">
                        <Heading size="2xl" letterSpacing="tighter" lineHeight="1.1">
                            TU ESFUERZO ES <Text as="span" color="primary">FORTIS POTENCIA</Text>
                        </Heading>
                        <Text fontSize="xl" color="gray.400" fontWeight="bold">
                            Transforma tu sudor en activos digitales.
                        </Text>
                    </VStack>
                    <MagnesiumStatus />
                </HStack>

                <ChallengeBoard />
            </VStack>
        </Container>
    );
};

export default ChallengesPage;
