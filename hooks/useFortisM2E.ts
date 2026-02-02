'use client';
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
let hiveClientInstance: Client | null = null;
const getHiveClient = () => {
    if (!hiveClientInstance) {
        hiveClientInstance = new Client(HIVE_RPC_NODES);
    }
    return hiveClientInstance;
};

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
                    const history = await getHiveClient().database.getAccountHistory(user, -1, 1000);
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
            if (typeof window !== 'undefined' && (window as any).hive_keychain) {
                if (type === 'airdrop') {
                    if (magnesium.airdrop >= 1) {
                        toast({
                            title: "Límite Alcanzado",
                            description: "Solo puedes tener 1 Magnesio Airdrop a la vez. Úsalo antes de comprar otro.",
                            status: "info"
                        });
                        setIsReloading(false);
                        return;
                    }

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
    }, [user, toast, magnesium]);

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

        // UNIFICATION: All types now use the Magnesium Stock system.
        // The user effectively "paid" when they bought the magnesium block (reloadMagnesium).
        // So here we just check stock -> broadcast join OP (RC only) -> decrement local stock.

        const cost = Math.ceil(amount * costMultiplier);
        if (magnesium[type] < cost) {
            toast({
                title: "Saldo Insuficiente",
                description: type === 'airdrop'
                    ? "Necesitas recargar Magnesio Airdrop (Costo: 20 FORTIS)"
                    : "Necesitas recargar tu Magnesio",
                status: "warning"
            });
            return false;
        }

        return new Promise<boolean>((resolve) => {
            const json = {
                contractName: "tokens",
                contractAction: "transfer",
                contractPayload: {
                    symbol: "FORTIS",
                    to: "fortis.m2e",
                    quantity: "0.01",
                    memo: `join:${challengeId}`
                }
            };
            (window as any).hive_keychain.requestCustomJson(
                user,
                'ssc-mainnet-hive',
                'Active',
                JSON.stringify(json),
                `Unirse al Reto #${challengeId}`,
                (res: any) => {
                    if (res.success) {
                        resolve(consumeMagnesium(amount, type, challengeId));
                        toast({ title: "¡Te has unido al reto!", status: "success" });
                    }
                    else resolve(false);
                }
            );
        });
    }, [user, magnesium, costMultiplier, consumeMagnesium, toast]);

    const fetchParticipants = useCallback(async (challengeId?: string) => {
        try {
            const participants: any[] = [];

            // 1. Fetch Hive Engine History (Source of Truth for Token Payments)
            try {
                const response = await fetch('https://history.hive-engine.com/accountHistory?account=fortis.m2e&limit=500&symbol=FORTIS');
                const heHistory = await response.json();

                heHistory.forEach((tx: any) => {
                    if (tx.operation === 'tokens_transfer' && tx.to === 'fortis.m2e' && tx.symbol === 'FORTIS') {
                        // Check memo for join:ID
                        // Hive Engine history API structure might vary, usually fields are top level or in match object
                        // tx structure: { ... , memo: "join:123", quantity: "0.01", sender: "user" ... }
                        if (tx.memo && tx.memo.startsWith('join:')) {
                            const joinedChallengeId = tx.memo.split(':')[1];
                            participants.push({
                                account: tx.from,
                                challengeId: joinedChallengeId,
                                timestamp: new Date(tx.timestamp * 1000).toISOString(),
                                paidFORTIS: tx.quantity
                            });
                        }
                    }
                });
            } catch (e) {
                console.error("Error fetching Hive Engine history:", e);
            }

            // 2. Legacy: Fetch Layer 1 History for old custom_json (optional, keeping for safety)
            try {
                const history = await getHiveClient().database.getAccountHistory('fortis.m2e', -1, 1000);
                (history || []).forEach(tx => {
                    const op = tx[1].op;
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
                });
            } catch (e) { console.error("Error fetching L1 history:", e); }

            const unique = Array.from(new Map(participants.map(p => [p.account + p.challengeId, p])).values());
            return unique.filter(e => !challengeId || e.challengeId === challengeId);
        } catch { return []; }
    }, []);

    const payoutRewards = useCallback(async (payouts: any[]) => {
        if (!user || !(window as any).hive_keychain) return;
        for (const p of payouts) {
            const json = { contractName: "tokens", contractAction: "transfer", contractPayload: { symbol: "FORTIS", to: p.account, quantity: p.amount.toString(), memo: `Reward #${p.challengeId}` } };
            await new Promise(r => (window as any).hive_keychain.requestCustomJson(user, 'ssc-mainnet-hive', 'Active', JSON.stringify(json), `Paying ${p.account}`, () => setTimeout(r, 500)));
        }
        toast({ title: "Pagos completados", status: "success" });
    }, [user, toast]);

    const createChallenge = useCallback(async (title: string, desc: string, days = 7, type: MagnesiumType = 'standard') => {
        if (!user || !(window as any).hive_keychain) return;
        const id = Date.now().toString();
        const json = { id, title, description: desc, durationDays: days, magnesiumType: type, timestamp: new Date().toISOString() };
        return new Promise(r => (window as any).hive_keychain.requestCustomJson(user, 'fortis_m2e_challenge', 'Posting', JSON.stringify(json), `Create: ${title}`, (res: any) => r(res.success)));
    }, [user]);

    const fetchChallenges = useCallback(async () => {
        const admins = ['fortis.m2e', 'hecatonquirox'];
        try {
            const results = await Promise.all(admins.map(async acc => {
                const history = await getHiveClient().database.getAccountHistory(acc, -1, 1000);
                return (history || []).filter(tx => tx[1].op[0] === 'custom_json' && tx[1].op[1].id === 'fortis_m2e_challenge').map(tx => ({ ...JSON.parse(tx[1].op[1].json), creator: acc }));
            }));
            return results.flat().filter(c => new Date(c.timestamp) >= new Date(M2E_GENESIS_TIMESTAMP)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch { return []; }
    }, []);

    const saveRanking = useCallback(async (id: string, ranking: any[]) => {
        if (!user || !(window as any).hive_keychain) return;
        const json = { challenge_id: id, ranking, timestamp: new Date().toISOString() };
        return new Promise(r => (window as any).hive_keychain.requestCustomJson(user, 'fortis_m2e_results', 'Posting', JSON.stringify(json), `Save #${id}`, (res: any) => r(res.success)));
    }, [user]);

    const fetchRankings = useCallback(async (id?: string) => {
        const admins = ['fortis.m2e', 'hecatonquirox'];
        try {
            const results = await Promise.all(admins.map(async acc => {
                const h = await getHiveClient().database.getAccountHistory(acc, -1, 1000);
                return (h || []).filter(tx => tx[1].op[0] === 'custom_json' && tx[1].op[1].id === 'fortis_m2e_results').map(tx => JSON.parse(tx[1].op[1].json));
            }));
            const r = results.flat().filter(x => new Date(x.timestamp) >= new Date(M2E_GENESIS_TIMESTAMP));
            return id ? r.filter(x => x.challenge_id === id) : r;
        } catch { return []; }
    }, []);

    const claimAirdropFaucet = useCallback(async () => {
        console.log("--- FAUCET CLAIM ATTEMPT ---");
        console.log("User:", user);
        console.log("Keychain detected:", !!(typeof window !== 'undefined' && (window as any).hive_keychain));
        console.log("Already Claimed:", hasClaimedFaucet);

        if (!user) {
            toast({ title: "Error: No hay usuario logueado", status: "error" });
            return;
        }
        if (typeof window === 'undefined' || !(window as any).hive_keychain) {
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
            (window as any).hive_keychain.requestCustomJson(
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
        const historyClaims: any[] = [];
        const pendingClaims: any[] = [];
        const paidUsersMap = new Set<string>();

        try {
            // 1. Fetch Hive Engine Payment History (Outgoing FORTIS)
            try {
                const response = await fetch('https://history.hive-engine.com/accountHistory?account=fortis.m2e&limit=1000&symbol=FORTIS');
                const heHistory = await response.json();

                heHistory.forEach((tx: any) => {
                    if (tx.operation === 'tokens_transfer' && tx.from === 'fortis.m2e' && tx.symbol === 'FORTIS') {
                        historyClaims.push({
                            account: tx.to,
                            amount: tx.quantity,
                            symbol: tx.symbol,
                            timestamp: new Date(tx.timestamp * 1000).toISOString(),
                            memo: tx.memo,
                            txId: tx.transactionId
                        });
                        paidUsersMap.add(tx.to);
                    }
                });
            } catch (e) { console.error("Error fetching HE history for faucet:", e); }

            // 2. Scan Blocks for Pending Requests (Last ~2000 blocks)
            const props = await getHiveClient().database.getDynamicGlobalProperties();
            const lastBlock = props.head_block_number;
            const BLOCKS_TO_SCAN = 5000;

            const blocks = await Promise.all(
                Array.from({ length: BLOCKS_TO_SCAN }, (_, i) => lastBlock - i)
                    .map(num => getHiveClient().database.getBlock(num))
            );

            blocks.forEach(block => {
                if (!block || !block.transactions) return;
                block.transactions.forEach((tx: any) => {
                    tx.operations.forEach((op: any) => {
                        if (op[0] === 'custom_json' && op[1].id === 'fortis_m2e_faucet_claim') {
                            const user = op[1].required_posting_auths[0];
                            // Only add if NOT in paid history
                            if (!paidUsersMap.has(user)) {
                                pendingClaims.push({
                                    account: user,
                                    timestamp: block.timestamp
                                });
                            }
                        }
                    });
                });
            });

            // unique pending
            const uniquePending = Array.from(new Map(pendingClaims.map(p => [p.account, p])).values());

            return {
                history: historyClaims,
                pending: uniquePending
            };

        } catch (e) {
            console.error("Error fetching faucet claims:", e);
            return { history: [], pending: [] };
        }
    }, []);


    const payoutFaucet = useCallback(async (claims: any[]) => {
        if (!user || !window.hive_keychain) return;
        for (const c of claims) {
            const json = { contractName: "tokens", contractAction: "transfer", contractPayload: { symbol: "FORTIS", to: c.account, quantity: "20", memo: "Faucet Claim" } };
            await new Promise(r => (window.hive_keychain as any).requestCustomJson(user, 'ssc-mainnet-hive', 'Active', JSON.stringify(json), `Faucet to ${c.account}`, () => setTimeout(r, 500)));
        }
    }, [user]);

    return { magnesium, joinedChallenges, stakeAmount, tier, costMultiplier, reloadMagnesium, joinChallenge, consumeMagnesium, simulateStake, fetchParticipants, payoutRewards, createChallenge, fetchChallenges, saveRanking, fetchRankings, claimAirdropFaucet, fetchFaucetClaims, payoutFaucet, hasClaimedFaucet, isReloading, isLoading, user };
};
