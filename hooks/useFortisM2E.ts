import { useState, useEffect, useCallback, useMemo } from 'react';
import { useKeychain } from '@/contexts/KeychainContext';
import { useToast } from '@chakra-ui/react';
import { Client } from '@hiveio/dhive';

const HIVE_RPC_NODES = [
    'https://api.deathwing.me',
    'https://api.openhive.network',
    'https://api.hive.blog',
    'https://rpc.mahdiyari.info',
    'https://api.syncad.com'
];
const hiveClient = new Client(HIVE_RPC_NODES);

export type MagnesiumType = 'standard' | 'aged' | 'gold' | 'airdrop';

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
    durationDays?: number;
    timestamp?: string;
    status: 'available' | 'joined' | 'completed';
}

export type AthleteTier = 'Bronce' | 'Plata' | 'Oro' | 'Fortis';

// GENESIS: Ignore any test challenge created before this date/time
const M2E_GENESIS_TIMESTAMP = '2026-02-01T20:25:00Z'; // UTC time for right now (16:25 local)

/**
 * useFortisM2E Hook
 * The core engine of the Move-to-Earn (M2E) economy.
 */
export const useFortisM2E = () => {
    const { user } = useKeychain();
    const toast = useToast();

    const [magnesium, setMagnesium] = useState<Record<MagnesiumType, number>>({
        standard: 0, aged: 0, gold: 0, airdrop: 0
    });

    const [stakeAmount, setStakeAmount] = useState<number>(0);
    const [lastRegen, setLastRegen] = useState<number>(Date.now());
    const [joinedChallenges, setJoinedChallenges] = useState<string[]>([]);
    const [loadedUser, setLoadedUser] = useState<string | null>(null);
    const [isReloading, setIsReloading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasClaimedFaucet, setHasClaimedFaucet] = useState(false);

    const tier = useMemo((): AthleteTier => {
        if (stakeAmount >= 5000) return 'Fortis';
        if (stakeAmount >= 1000) return 'Oro';
        if (stakeAmount >= 100) return 'Plata';
        return 'Bronce';
    }, [stakeAmount]);

    const costMultiplier = useMemo(() => {
        switch (tier) {
            case 'Fortis': return 0.5;
            case 'Oro': return 0.7;
            case 'Plata': return 0.9;
            default: return 1;
        }
    }, [tier]);

    // LOAD DATA
    useEffect(() => {
        const currentUser = user || 'guest';
        setIsLoading(true);

        const loadData = async () => {
            const key = `fortis_m2e_v2_${currentUser}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setMagnesium(parsed.magnesium || { standard: 5, aged: 0, gold: 0, airdrop: 0 });
                    setStakeAmount(parsed.stakeAmount || 0);
                    setLastRegen(parsed.lastRegen || Date.now());
                    setJoinedChallenges(parsed.joinedChallenges || []);
                } catch (e) {
                    setMagnesium({ standard: 5, aged: 0, gold: 0, airdrop: 0 });
                }
            } else {
                setMagnesium({ standard: 5, aged: 0, gold: 0, airdrop: 0 });
                setStakeAmount(0);
                setJoinedChallenges([]);
            }

            // Check Faucet Status via Custom JSON (RC)
            // We check the USER'S history, because custom_json only appears in the sender's history
            if (user) {
                try {
                    const history = await hiveClient.database.getAccountHistory(user, -1, 1000);
                    const claimed = (history || []).some(tx => {
                        const op = tx[1].op;
                        return op[0] === 'custom_json' &&
                            op[1].id === 'fortis_m2e_faucet_claim';
                    });
                    setHasClaimedFaucet(claimed);
                } catch (e) {
                    console.error("Faucet verify error", e);
                }
            }

            setLoadedUser(currentUser);
            setIsLoading(false);
        };

        loadData();
    }, [user]);

    // SYNC DATA
    useEffect(() => {
        const currentUser = user || 'guest';
        if (!isLoading && loadedUser === currentUser) {
            localStorage.setItem(`fortis_m2e_v2_${currentUser}`, JSON.stringify({
                magnesium, stakeAmount, lastRegen, joinedChallenges
            }));
        }
    }, [magnesium, stakeAmount, lastRegen, joinedChallenges, user, isLoading, loadedUser]);

    const simulateStake = (amount: number) => {
        setStakeAmount(prev => prev + amount);
        toast({ title: "Stake Actualizado", status: "info" });
    };

    const reloadMagnesium = useCallback(async (type: MagnesiumType = 'standard') => {
        if (!user) return;
        setIsReloading(true);
        const costs: any = { standard: '1.000', aged: '3.000', gold: '5.000', airdrop: '20.000' };

        try {
            if (window.hive_keychain) {
                if (type === 'airdrop') {
                    const json = {
                        contractName: "tokens",
                        contractAction: "transfer",
                        contractPayload: { symbol: "FORTIS", to: "fortis.m2e", quantity: "20", memo: "Reload AIRDROP" }
                    };
                    (window.hive_keychain as any).requestCustomJson(user, 'ssc-mainnet-hive', 'Active', JSON.stringify(json), "Buy Airdrop Magnesium (20 FORTIS)", (res: any) => {
                        if (res.success) {
                            setMagnesium(prev => ({ ...prev, airdrop: prev.airdrop + 1 }));
                            toast({ title: "Recarga exitosa (+1)", status: "success" });
                        }
                        setIsReloading(false);
                    });
                } else {
                    (window.hive_keychain as any).requestTransfer(user, 'fortis.m2e', costs[type], JSON.stringify({ action: 'reload', type }), 'HBD', (res: any) => {
                        if (res.success) {
                            setMagnesium(prev => ({ ...prev, [type]: prev[type] + 5 }));
                            toast({ title: "Recarga exitosa (+5)", status: "success" });
                        }
                        setIsReloading(false);
                    });
                }
            }
        } catch (e) { setIsReloading(false); }
    }, [user, toast]);

    const consumeMagnesium = useCallback((amount: number, type: MagnesiumType = 'standard', challengeId?: string) => {
        const cost = Math.ceil(amount * costMultiplier);
        if (magnesium[type] >= cost) {
            setMagnesium(prev => ({ ...prev, [type]: prev[type] - cost }));
            if (challengeId) setJoinedChallenges(prev => prev.includes(challengeId) ? prev : [...prev, challengeId]);
            return true;
        }
        return false;
    }, [magnesium, costMultiplier]);

    const joinChallenge = useCallback(async (challengeId: string, amount: number, type: MagnesiumType = 'standard') => {
        if (!user || !window.hive_keychain) return false;

        // For 'airdrop' challenges, use direct FORTIS payment (Hive-Engine)
        if (type === 'airdrop') {
            return new Promise<boolean>((resolve) => {
                const json = {
                    contractName: "tokens",
                    contractAction: "transfer",
                    contractPayload: {
                        symbol: "FORTIS",
                        to: "fortis.m2e",
                        quantity: "20",
                        memo: `join:${challengeId}`
                    }
                };
                (window.hive_keychain as any).requestCustomJson(
                    user,
                    'ssc-mainnet-hive',
                    'Active',
                    JSON.stringify(json),
                    `Pagar 20 FORTIS - Reto #${challengeId}`,
                    (res: any) => {
                        if (res.success) {
                            setJoinedChallenges(prev => prev.includes(challengeId) ? prev : [...prev, challengeId]);
                            toast({ title: "¡Inscrito! 20 FORTIS enviados", status: "success" });
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                );
            });
        }

        // For other types, use Magnesium system (RC-only custom_json)
        const cost = Math.ceil(amount * costMultiplier);
        if (magnesium[type] < cost) return false;

        return new Promise<boolean>((resolve) => {
            const json = { action: 'join', id: challengeId, type, timestamp: new Date().toISOString() };
            (window.hive_keychain as any).requestCustomJson(
                user,
                'fortis_m2e_join_challenge',
                'Posting',
                JSON.stringify(json),
                `Unirse al Reto #${challengeId}`,
                (res: any) => {
                    if (res.success) resolve(consumeMagnesium(amount, type, challengeId));
                    else resolve(false);
                }
            );
        });
    }, [user, magnesium, costMultiplier, consumeMagnesium, toast]);

    const fetchParticipants = useCallback(async (challengeId?: string) => {
        try {
            const history = await hiveClient.database.getAccountHistory('fortis.m2e', -1, 1000);
            const participants: any[] = [];

            (history || []).forEach(tx => {
                const op = tx[1].op;

                // Check for custom_json joins (Magnesium-based challenges)
                if (op[0] === 'custom_json' && op[1].id === 'fortis_m2e_join_challenge') {
                    try {
                        const d = JSON.parse(op[1].json);
                        participants.push({
                            account: op[1].required_posting_auths[0],
                            challengeId: d.id,
                            timestamp: d.timestamp || tx[1].timestamp
                        });
                    } catch { }
                }

                // Check for HE token transfers (FORTIS payment for airdrop challenges)
                if (op[0] === 'custom_json' && op[1].id === 'ssc-mainnet-hive') {
                    try {
                        const payload = JSON.parse(op[1].json);
                        if (payload.contractAction === 'transfer' &&
                            payload.contractPayload.symbol === 'FORTIS' &&
                            payload.contractPayload.memo?.startsWith('join:')) {
                            const joinedChallengeId = payload.contractPayload.memo.split(':')[1];
                            participants.push({
                                account: op[1].required_auths[0],
                                challengeId: joinedChallengeId,
                                timestamp: tx[1].timestamp,
                                paidFORTIS: payload.contractPayload.quantity
                            });
                        }
                    } catch { }
                }
            });

            return participants.filter(e => !challengeId || e.challengeId === challengeId);
        } catch { return []; }
    }, []);

    const payoutRewards = useCallback(async (payouts: any[]) => {
        if (!user || !window.hive_keychain) return;
        for (const p of payouts) {
            const json = { contractName: "tokens", contractAction: "transfer", contractPayload: { symbol: "FORTIS", to: p.account, quantity: p.amount.toString(), memo: `Reward #${p.challengeId}` } };
            await new Promise(r => (window.hive_keychain as any).requestCustomJson(user, 'ssc-mainnet-hive', 'Active', JSON.stringify(json), `Paying ${p.account}`, () => setTimeout(r, 500)));
        }
        toast({ title: "Pagos completados", status: "success" });
    }, [user, toast]);

    const createChallenge = useCallback(async (title: string, desc: string, days = 7, type: MagnesiumType = 'standard') => {
        if (!user || !window.hive_keychain) return;
        const id = Date.now().toString();
        const json = { id, title, description: desc, durationDays: days, magnesiumType: type, timestamp: new Date().toISOString() };
        return new Promise(r => (window.hive_keychain as any).requestCustomJson(user, 'fortis_m2e_challenge', 'Posting', JSON.stringify(json), `Create: ${title}`, (res: any) => r(res.success)));
    }, [user]);

    const fetchChallenges = useCallback(async () => {
        const admins = ['fortis.m2e', 'hecatonquirox'];
        try {
            const results = await Promise.all(admins.map(async acc => {
                const history = await hiveClient.database.getAccountHistory(acc, -1, 1000);
                return (history || []).filter(tx => tx[1].op[0] === 'custom_json' && tx[1].op[1].id === 'fortis_m2e_challenge').map(tx => ({ ...JSON.parse(tx[1].op[1].json), creator: acc }));
            }));
            return results.flat().filter(c => new Date(c.timestamp) >= new Date(M2E_GENESIS_TIMESTAMP)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch { return []; }
    }, []);

    const saveRanking = useCallback(async (id: string, ranking: any[]) => {
        if (!user || !window.hive_keychain) return;
        const json = { challenge_id: id, ranking, timestamp: new Date().toISOString() };
        return new Promise(r => (window.hive_keychain as any).requestCustomJson(user, 'fortis_m2e_results', 'Posting', JSON.stringify(json), `Save #${id}`, (res: any) => r(res.success)));
    }, [user]);

    const fetchRankings = useCallback(async (id?: string) => {
        const admins = ['fortis.m2e', 'hecatonquirox'];
        try {
            const results = await Promise.all(admins.map(async acc => {
                const h = await hiveClient.database.getAccountHistory(acc, -1, 1000);
                return (h || []).filter(tx => tx[1].op[0] === 'custom_json' && tx[1].op[1].id === 'fortis_m2e_results').map(tx => JSON.parse(tx[1].op[1].json));
            }));
            const r = results.flat().filter(x => new Date(x.timestamp) >= new Date(M2E_GENESIS_TIMESTAMP));
            return id ? r.filter(x => x.challenge_id === id) : r;
        } catch { return []; }
    }, []);

    const claimAirdropFaucet = useCallback(async () => {
        console.log("--- FAUCET CLAIM ATTEMPT ---");
        console.log("User:", user);
        console.log("Keychain detected:", !!window.hive_keychain);
        console.log("Already Claimed:", hasClaimedFaucet);

        if (!user) {
            toast({ title: "Error: No hay usuario logueado", status: "error" });
            return;
        }
        if (!window.hive_keychain) {
            toast({ title: "Error: Hive Keychain no detectado", status: "error" });
            return;
        }
        if (hasClaimedFaucet) {
            toast({ title: "Error: Ya reclamaste el faucet", status: "warning" });
            return;
        }

        return new Promise(r => {
            // Use custom_json (Posting Authority) - Costs only RC, no HBD/HIVE needed
            // This is safer than requestPost which seems to fail silently for some users/params
            const json = { account: user, app: "fortis-m2e", timestamp: new Date().toISOString() };
            console.log("Requesting custom_json:", json);
            (window.hive_keychain as any).requestCustomJson(
                user,
                'fortis_m2e_faucet_claim',
                'Posting',
                JSON.stringify(json),
                "Solicitar 20 FORTIS (Faucet)",
                (res: any) => {
                    if (res.success) {
                        setHasClaimedFaucet(true);
                        toast({ title: "Solicitud Enviada (RC)", status: "success" });
                    }
                    r(res.success);
                }
            );
        });
    }, [user, hasClaimedFaucet, toast]);

    /**
     * FETCH FAUCET CLAIMS (Admin)
     * To find requests without knowing usernames, we scan recent blockchain blocks.
     */
    const fetchFaucetClaims = useCallback(async () => {
        const claims: any[] = [];
        const paidUsers = new Set<string>(); // Track users who got paid recently
        try {
            // Scan last 500 blocks (~25 mins) to find recent claims
            const props = await hiveClient.database.getDynamicGlobalProperties();
            const lastBlock = props.head_block_number;
            const BLOCKS_TO_SCAN = 500;

            const blocks = await Promise.all(
                Array.from({ length: BLOCKS_TO_SCAN }, (_, i) => lastBlock - i)
                    .map(num => hiveClient.database.getBlock(num))
            );

            blocks.forEach(block => {
                if (!block) return;
                block.transactions.forEach(tx => {
                    tx.operations.forEach(op => {
                        // 1. Detect Claims
                        if (op[0] === 'custom_json' && op[1].id === 'fortis_m2e_faucet_claim') {
                            try {
                                const data = JSON.parse(op[1].json);
                                claims.push({
                                    account: op[1].required_posting_auths[0] || data.account,
                                    timestamp: block.timestamp
                                });
                            } catch (e) { }
                        }
                        // 2. Detect Payouts (ssc-mainnet-hive transfer with "Faucet" in memo)
                        if (op[0] === 'custom_json' && op[1].id === 'ssc-mainnet-hive') {
                            try {
                                const payload = JSON.parse(op[1].json);
                                if (payload.contractAction === 'transfer' &&
                                    (payload.contractPayload.memo?.includes('Faucet') || payload.contractPayload.memo?.includes('Airdrop'))) {
                                    paidUsers.add(payload.contractPayload.to);
                                }
                            } catch (e) { }
                        }
                    });
                });
            });

            // Filter out claims that have already been paid (based on recent history)
            const unique = Array.from(new Map(claims.map(c => [c.account, c])).values());
            return unique
                .filter(c => !paidUsers.has(c.account))
                .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            console.error("Error scanning blockchain:", error);
            return [];
        }
    }, []);

    const payoutFaucet = useCallback(async (claims: any[]) => {
        if (!user || !window.hive_keychain) return;
        for (const c of claims) {
            const json = { contractName: "tokens", contractAction: "transfer", contractPayload: { symbol: "FORTIS", to: c.account, quantity: "20", memo: "Faucet Claim" } };
            await new Promise(r => (window.hive_keychain as any).requestCustomJson(user, 'ssc-mainnet-hive', 'Active', JSON.stringify(json), `Faucet to ${c.account}`, () => setTimeout(r, 500)));
        }
    }, [user]);

    return { magnesium, joinedChallenges, stakeAmount, tier, costMultiplier, reloadMagnesium, joinChallenge, consumeMagnesium, simulateStake, fetchParticipants, payoutRewards, createChallenge, fetchChallenges, saveRanking, fetchRankings, claimAirdropFaucet, fetchFaucetClaims, payoutFaucet, hasClaimedFaucet, isReloading, isLoading };
};
