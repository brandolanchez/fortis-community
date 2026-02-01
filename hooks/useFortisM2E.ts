import { useState, useEffect, useCallback, useMemo } from 'react';
import { useKeychain } from '@/contexts/KeychainContext';
import { useToast } from '@chakra-ui/react';

export type MagnesiumType = 'standard' | 'aged' | 'gold';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    magnesiumCost: number;
    magnesiumType?: MagnesiumType;
    entryFeeHBD?: string;
    reward?: string;
    participantRewardFORTIS?: string;
    top3RewardHBD?: string;
    status: 'available' | 'joined' | 'completed';
}

export type AthleteTier = 'Bronce' | 'Plata' | 'Oro' | 'Fortis';

/**
 * useFortisM2E Hook
 * The core engine of the Move-to-Earn (M2E) economy.
 * Manages player inventory (magnesium), athlete tiers, stake, and Hive Blockchain interactions.
 */
export const useFortisM2E = () => {
    const { user } = useKeychain();
    const toast = useToast();

    // Multi-magnesium state
    const [magnesium, setMagnesium] = useState<Record<MagnesiumType, number>>({
        standard: 0,
        aged: 0,
        gold: 0
    });

    const [stakeAmount, setStakeAmount] = useState<number>(0);
    const [lastRegen, setLastRegen] = useState<number>(Date.now());
    const [joinedChallenges, setJoinedChallenges] = useState<string[]>([]);
    const [loadedUser, setLoadedUser] = useState<string | null>(null); // Track which user data we have
    const [isReloading, setIsReloading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // TIER CALCULATION: 
    // Higher stake amounts grant premium athlete statuses and economic discounts.
    const tier = useMemo((): AthleteTier => {
        if (stakeAmount >= 5000) return 'Fortis'; // Elite
        if (stakeAmount >= 1000) return 'Oro';    // Pro
        if (stakeAmount >= 100) return 'Plata';  // Intermediate
        return 'Bronce';                         // Beginner
    }, [stakeAmount]);

    // PASSIVE REGENERATION:
    // High-tier athletes (Oro & Fortis) regenerate magnesium over time automatically.
    useEffect(() => {
        if (isLoading || (tier !== 'Oro' && tier !== 'Fortis')) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const hoursPassed = (now - lastRegen) / (1000 * 60 * 60);

            if (hoursPassed >= 12) { // Every 12 hours check
                const amount = tier === 'Fortis' ? 1 : 0.5; // Simulating 1-2 per day
                setMagnesium(prev => ({
                    ...prev,
                    standard: Math.min(50, prev.standard + amount)
                }));
                setLastRegen(now);
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [tier, lastRegen, isLoading]);

    // Cost multiplier based on tier
    const costMultiplier = useMemo(() => {
        switch (tier) {
            case 'Fortis': return 0.5; // 50% discount
            case 'Oro': return 0.7;    // 30% discount
            case 'Plata': return 0.9;  // 10% discount
            default: return 1;
        }
    }, [tier]);

    // Load state from local storage initially
    useEffect(() => {
        const currentUser = user || 'guest';
        setIsLoading(true);

        const key = `fortis_m2e_v2_${currentUser}`;
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMagnesium(parsed.magnesium || { standard: 5, aged: 0, gold: 0 });
                setStakeAmount(parsed.stakeAmount || 0);
                setLastRegen(parsed.lastRegen || Date.now());
                setJoinedChallenges(parsed.joinedChallenges || []);
            } catch (e) {
                console.error("Error parsing saved state:", e);
                setMagnesium({ standard: 5, aged: 0, gold: 0 });
                setJoinedChallenges([]);
            }
        } else {
            // Default starting state for a new user/guest
            setMagnesium({ standard: 5, aged: 0, gold: 0 });
            setStakeAmount(0);
            setJoinedChallenges([]);
        }

        setLoadedUser(currentUser);
        setIsLoading(false);
    }, [user]);

    // Sync with local storage
    useEffect(() => {
        const currentUser = user || 'guest';

        // CRITICAL: Only save if we are NOT loading AND the data in state belongs to the current user
        if (!isLoading && loadedUser === currentUser) {
            localStorage.setItem(`fortis_m2e_v2_${currentUser}`, JSON.stringify({
                magnesium,
                stakeAmount,
                lastRegen,
                joinedChallenges
            }));
        }
    }, [magnesium, stakeAmount, lastRegen, joinedChallenges, user, isLoading, loadedUser]);

    // Simulation tool: Add stake
    const simulateStake = (amount: number) => {
        setStakeAmount(prev => prev + amount);
        toast({
            title: "Stake Actualizado",
            description: `Has añadido ${amount} tokens FORTIS al stake.`,
            status: "info",
            duration: 3000,
        });
    };

    /**
     * RELOAD MAGNESIUM (Blockchain Purchase)
     * Facilitates HBD transfers to the community pool in exchange for 5 uses (1 block).
     * 70% of the revenue is used for FORTIS buybacks (Automated via contract).
     */
    const reloadMagnesium = useCallback(async (type: MagnesiumType = 'standard') => {
        if (!user) {
            toast({
                title: "Inicia sesión",
                description: "Necesitas estar conectado para comprar magnesio.",
                status: "warning",
                duration: 3000,
            });
            return;
        }

        setIsReloading(true);

        const costs = {
            standard: '1.000',
            aged: '3.000',
            gold: '5.000'
        };

        const amountHBD = costs[type];

        try {
            if (window.hive_keychain) {
                (window.hive_keychain as any).requestTransfer(
                    user,
                    'fortis.m2e',
                    amountHBD,
                    `Recarga de Magnesio ${type.toUpperCase()} - Fortis Workout`,
                    'HBD',
                    (response: any) => {
                        if (response.success) {
                            setMagnesium(prev => ({
                                ...prev,
                                [type]: prev[type] + 5
                            }));
                            toast({
                                title: "¡Recarga exitosa!",
                                description: `Has recibido 5 unidades de magnesio ${type}.`,
                                status: "success",
                                duration: 5000,
                            });
                        } else {
                            toast({
                                title: "Error en la recarga",
                                description: response.message || "La transacción fue cancelada.",
                                status: "error",
                                duration: 5000,
                            });
                        }
                        setIsReloading(false);
                    }
                );
            } else {
                // Demo fallback
                setTimeout(() => {
                    setMagnesium(prev => ({
                        ...prev,
                        [type]: prev[type] + 5
                    }));
                    setIsReloading(false);
                    toast({
                        title: "Modo Demo",
                        description: `Añadidas 5 unidades de ${type} (Simulación).`,
                        status: "info",
                        duration: 3000,
                    });
                }, 1000);
            }
        } catch (error) {
            setIsReloading(false);
            console.error("Reload error:", error);
        }
    }, [user, toast]);

    /**
     * CONSUME MAGNESIUM
     * Deducts magnesium uses from stock while applying tier-based discounts.
     */
    const consumeMagnesium = useCallback((amount: number, type: MagnesiumType = 'standard', challengeId?: string) => {
        const adjustedCost = Math.ceil(amount * costMultiplier);

        if (magnesium[type] >= adjustedCost) {
            setMagnesium(prev => ({
                ...prev,
                [type]: prev[type] - adjustedCost
            }));

            if (challengeId) {
                setJoinedChallenges(prev => {
                    if (prev.includes(challengeId)) return prev;
                    return [...prev, challengeId];
                });
            }
            return true;
        }
        return false;
    }, [magnesium, costMultiplier]);

    /**
     * JOIN CHALLENGE (Blockchain Proof-of-Entry)
     * Broadcasts a 'custom_json' to Hive using Keychain.
     * This ensures the money trail and entry status are immutable and public.
     */
    const joinChallenge = useCallback(async (challengeId: string, amount: number, type: MagnesiumType = 'standard') => {
        if (!user) return false;

        return new Promise<boolean>((resolve) => {
            const entryData = {
                app: 'fortis/0.1.0',
                action: 'join_challenge',
                challenge_id: challengeId,
                magnesium_type: type,
                cost: amount,
                timestamp: Date.now()
            };

            if (window.hive_keychain) {
                (window.hive_keychain as any).requestCustomJson(
                    user,
                    'fortis_m2e_entry',
                    'Posting',
                    JSON.stringify(entryData),
                    `Inscripción en Reto: ${challengeId}`,
                    (response: any) => {
                        if (response.success) {
                            const success = consumeMagnesium(amount, type, challengeId);
                            resolve(success);
                        } else {
                            toast({
                                title: "Error de Inscripción",
                                description: "La transacción en la blockchain fue cancelada o falló.",
                                status: "error",
                                duration: 5000,
                            });
                            resolve(false);
                        }
                    }
                );
            } else {
                // Demo fallback
                const success = consumeMagnesium(amount, type, challengeId);
                resolve(success);
            }
        });
    }, [user, consumeMagnesium, toast]);

    return {
        magnesium,
        joinedChallenges,
        stakeAmount,
        tier,
        costMultiplier,
        reloadMagnesium,
        joinChallenge,
        consumeMagnesium,
        simulateStake,
        isReloading,
        isLoading
    };
};
