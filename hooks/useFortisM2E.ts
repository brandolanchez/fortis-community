import { useState, useEffect, useCallback, useMemo } from 'react';
import { useKeychain } from '@/contexts/KeychainContext';
import { useToast } from '@chakra-ui/react';
import { Client } from '@hiveio/dhive';

const HIVE_RPC_NODES = [
    'https://api.hive.blog',
    'https://api.deathwing.me',
    'https://hive-api.arcange.eu'
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

            // Check Faucet Status via 0.001 HBD beacon
            if (user) {
                try {
                    const history = await hiveClient.database.getAccountHistory('fortis.m2e', -1, 1000);
                    const claimed = history.some(tx => {
                        const op = tx[1].op;
                        if (op[0] !== 'transfer' || op[1].to !== 'fortis.m2e' || op[1].amount !== '0.001 HBD') return false;
                        try {
                            const d = JSON.parse(op[1].memo);
                            return d.action === 'faucet_claim' && op[1].from === user;
                        } catch { return false; }
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
        const cost = Math.ceil(amount * costMultiplier);
        if (magnesium[type] < cost) return false;

        return new Promise<boolean>((resolve) => {
            (window.hive_keychain as any).requestTransfer(user, 'fortis.m2e', '0.001', JSON.stringify({ action: 'join', id: challengeId, type }), 'HBD', (res: any) => {
                if (res.success) resolve(consumeMagnesium(amount, type, challengeId));
                else resolve(false);
            });
        });
    }, [user, magnesium, costMultiplier, consumeMagnesium]);

    const fetchParticipants = useCallback(async (challengeId?: string) => {
        try {
            const history = await hiveClient.database.getAccountHistory('fortis.m2e', -1, 1000);
            return history
                .filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].to === 'fortis.m2e' && tx[1].op[1].amount === '0.001 HBD')
                .map(tx => {
                    try {
                        const d = JSON.parse(tx[1].op[1].memo);
                        return { account: tx[1].op[1].from, challengeId: d.id, timestamp: d.timestamp || tx[1].timestamp };
                    } catch { return null; }
                })
                .filter(e => e !== null && (!challengeId || e.challengeId === challengeId));
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
                return history.filter(tx => tx[1].op[0] === 'custom_json' && tx[1].op[1].id === 'fortis_m2e_challenge').map(tx => ({ ...JSON.parse(tx[1].op[1].json), creator: acc }));
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
                return h.filter(tx => tx[1].op[0] === 'custom_json' && tx[1].op[1].id === 'fortis_m2e_results').map(tx => JSON.parse(tx[1].op[1].json));
            }));
            const r = results.flat().filter(x => new Date(x.timestamp) >= new Date(M2E_GENESIS_TIMESTAMP));
            return id ? r.filter(x => x.challenge_id === id) : r;
        } catch { return []; }
    }, []);

    const claimAirdropFaucet = useCallback(async () => {
        if (!user || !window.hive_keychain || hasClaimedFaucet) return;
        return new Promise(r => {
            // Use 0.001 HBD transfer for "on-chain notification" to @fortis.m2e
            (window.hive_keychain as any).requestTransfer(
                user,
                'fortis.m2e',
                '0.001',
                JSON.stringify({ action: 'faucet_claim', timestamp: new Date().toISOString() }),
                'HBD',
                (res: any) => {
                    if (res.success) {
                        setHasClaimedFaucet(true);
                        toast({ title: "Solicitud de Faucet Enviada", status: "success" });
                    }
                    r(res.success);
                }
            );
        });
    }, [user, hasClaimedFaucet, toast]);

    const fetchFaucetClaims = useCallback(async () => {
        try {
            const h = await hiveClient.database.getAccountHistory('fortis.m2e', -1, 1000);
            return h.filter(tx => {
                const op = tx[1].op;
                if (op[0] !== 'transfer' || op[1].to !== 'fortis.m2e' || op[1].amount !== '0.001 HBD') return false;
                try {
                    const d = JSON.parse(op[1].memo);
                    return d.action === 'faucet_claim';
                } catch { return false; }
            }).map(tx => ({
                account: tx[1].op[1].from,
                timestamp: tx[1].timestamp
            }));
        } catch { return []; }
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
