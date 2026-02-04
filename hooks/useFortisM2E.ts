'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useKeychain } from '@/contexts/KeychainContext';
import { useToast } from '@chakra-ui/react';
import { Client } from '@hiveio/dhive';
import { supabase } from '@/lib/supabase';

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

    // LOAD DATA (Supabase)
    useEffect(() => {
        const currentUser = user || 'guest';
        setIsLoading(true);

        const loadData = async () => {
            if (!user) {
                setMagnesium({ standard: 5, aged: 0, gold: 0, airdrop: 0 });
                setIsLoading(false);
                return;
            }

            // 1. Fetch Profile
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('account', user)
                .single();

            if (data) {
                setMagnesium({
                    standard: data.magnesium_standard || 0,
                    aged: data.magnesium_aged || 0,
                    gold: data.magnesium_gold || 0,
                    airdrop: data.magnesium_airdrop || 0
                });
                setStakeAmount(data.stake_amount || 0);
            } else {
                // Create Profile if not exists
                const initialMagnesium = { standard: 5, aged: 0, gold: 0, airdrop: 0 };
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        account: user,
                        magnesium_standard: 5,
                        magnesium_aged: 0,
                        magnesium_gold: 0,
                        magnesium_airdrop: 0
                    });

                if (!insertError) {
                    setMagnesium(initialMagnesium);
                }
            }

            // 2. Fetch Joined Challenges
            const { data: challengesData } = await supabase
                .from('participants')
                .select('challenge_id')
                .eq('account', user);

            if (challengesData) {
                setJoinedChallenges(challengesData.map(c => c.challenge_id));
            }

            // Check Faucet
            try {
                const history = await getHiveClient().database.getAccountHistory(user, -1, 1000);
                const claimed = (history || []).some(tx => {
                    const op = tx[1].op;
                    return op[0] === 'custom_json' &&
                        op[1].id === 'fortis_m2e_faucet_claim';
                });
                setHasClaimedFaucet(claimed);
            } catch (e) { }

            setLoadedUser(currentUser);
            setIsLoading(false);
        };

        loadData();
    }, [user]);

    // SYNC DATA (Removed LocalStorage sync, now we explicitly save on actions)

    const simulateStake = (amount: number) => {
        setStakeAmount(prev => prev + amount);
        toast({ title: "Stake Actualizado", status: "info" });
    };

    // --- VERIFICATION HELPERS ---
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const verifyTransaction = async (user: string, amount: string, memoPrefix: string, timeoutSec = 20): Promise<boolean> => {
        const start = Date.now();
        const HISTORY_API = 'https://history.hive-engine.com/accountHistory?account=fortis.m2e&limit=50&symbol=FORTIS';

        while (Date.now() - start < timeoutSec * 1000) {
            try {
                const res = await fetch(HISTORY_API);
                const history = await res.json();

                // Find a transaction that matches conditions and was created RECENTLY (last minute)
                const validTx = history.find((tx: any) =>
                    tx.to === 'fortis.m2e' &&
                    tx.symbol === 'FORTIS' &&
                    (tx.from === user || tx.sender === user) &&
                    parseFloat(tx.quantity) === parseFloat(amount) &&
                    (tx.memo && tx.memo.startsWith(memoPrefix)) &&
                    (Date.now() - (tx.timestamp * 1000)) < 60000 // Must be within last 60s
                );

                if (validTx) {
                    console.log("Transaction Verified:", validTx);
                    return true;
                }
            } catch (e) { console.error("Verify poll error:", e); }

            await sleep(2000); // Wait 2s before retry
        }
        return false;
    };

    const verifyL1Operation = async (user: string, id: string, timeoutSec = 20): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeoutSec * 1000) {
            try {
                const history = await getHiveClient().database.getAccountHistory(user, -1, 50);
                // Look for the custom_json
                const found = history.some(tx => {
                    const op = tx[1].op;
                    return op[0] === 'custom_json' &&
                        op[1].id === id &&
                        (Date.now() - (new Date(tx[1].timestamp).getTime())) < 60000;
                });

                if (found) return true;
            } catch (e) { }
            await sleep(2000);
        }
        return false;
    };

    const updateProfileBalance = async (newMagnesium: Record<MagnesiumType, number>) => {
        if (!user) return;
        await supabase.from('profiles').update({
            magnesium_standard: newMagnesium.standard,
            magnesium_aged: newMagnesium.aged,
            magnesium_gold: newMagnesium.gold,
            magnesium_airdrop: newMagnesium.airdrop,
            updated_at: new Date().toISOString() // Or just let DB handle it? Supabase usually needs explicit
        }).eq('account', user);
    };

    const reloadMagnesium = useCallback(async (type: MagnesiumType = 'standard') => {
        if (!user) return;
        setIsReloading(true);
        const costs: any = { standard: '1.000', aged: '3.000', gold: '5.000', airdrop: '20.000' };

        try {
            if (typeof window !== 'undefined' && (window as any).hive_keychain) {
                if (type === 'airdrop') {
                    // LIMIT REMOVED: Users can buy as many as they want (20 FORTIS each)

                    const json = {
                        contractName: "tokens",
                        contractAction: "transfer",
                        contractPayload: { symbol: "FORTIS", to: "fortis.m2e", quantity: "20", memo: "Reload AIRDROP" }
                    };

                    (window.hive_keychain as any).requestCustomJson(
                        user,
                        'ssc-mainnet-hive',
                        'Active',
                        JSON.stringify(json),
                        "Buy Airdrop Magnesium (20 FORTIS)",
                        async (res: any) => {
                            if (res.success) {
                                toast({ title: "Verificando pago...", description: "Esperando confirmación en Hive Engine (~15s)", status: "loading", duration: 20000 });
                                const confirmed = await verifyTransaction(user, "20", "Reload AIRDROP");

                                if (confirmed) {
                                    setMagnesium(prev => {
                                        const next = { ...prev, airdrop: prev.airdrop + 1 };
                                        // Save to Supabase
                                        supabase.from('profiles').update({ magnesium_airdrop: next.airdrop }).eq('account', user).then();
                                        return next;
                                    });
                                    toast({ title: "¡Compra Verificada!", status: "success" });
                                } else {
                                    toast({ title: "Pago no confirmado", description: "No detectamos el pago en la red aún. Si pagaste, recarga en unos minutos.", status: "error" });
                                }
                            }
                            setIsReloading(false);
                        });
                } else {
                    // HBD Transfer for standard items
                    (window.hive_keychain as any).requestTransfer(
                        user,
                        'fortis.m2e',
                        costs[type],
                        JSON.stringify({ action: 'reload', type }),
                        'HBD',
                        (res: any) => {
                            if (res.success) {
                                setMagnesium(prev => {
                                    const next = { ...prev, [type]: prev[type] + 5 };
                                    // Save to Supabase
                                    const colName = `magnesium_${type}`;
                                    supabase.from('profiles').update({ [colName]: next[type] }).eq('account', user).then();
                                    return next;
                                });
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
            setMagnesium(prev => {
                const next = { ...prev, [type]: prev[type] - cost };
                // Save to Supabase
                const colName = `magnesium_${type}`;
                supabase.from('profiles').update({ [colName]: next[type] }).eq('account', user).then();
                return next;
            });
            if (challengeId) setJoinedChallenges(prev => prev.includes(challengeId) ? prev : [...prev, challengeId]);
            return true;
        }
        return false;
    }, [magnesium, costMultiplier, user]);

    const joinChallenge = useCallback(async (challengeId: string, amount: number, type: MagnesiumType = 'standard') => {
        if (!user || !window.hive_keychain) return false;

        // PREVENT DUPLICATE JOIN
        if (joinedChallenges.includes(challengeId)) {
            toast({ title: "Ya estás inscrito", description: "No puedes unirte al mismo reto dos veces.", status: "warning" });
            return false;
        }

        const cost = Math.ceil(amount * costMultiplier);
        if (magnesium[type] < cost) {
            toast({
                title: "Saldo Insuficiente",
                description: type === 'airdrop' ? "Recarga Magnesio Airdrop" : "Recarga tu Magnesio",
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
                async (res: any) => {
                    if (res.success) {
                        toast({ title: "Verificando...", description: "Confirmando inscripción en Hive Engine...", status: "loading", duration: 15000 });
                        // Verify 0.01 FORTIS sent
                        const confirmed = await verifyTransaction(user, "0.01", `join:${challengeId}`);

                        if (confirmed) {
                            consumeMagnesium(amount, type, challengeId);

                            // --- SUPABASE INTEGRATION ---
                            const { error } = await supabase.from('participants').insert({
                                challenge_id: challengeId,
                                account: user,
                                paid_amount: "0.01",
                                tx_id: res.result?.id || `manual_${Date.now()}`
                            });

                            if (error) {
                                console.error("Supabase Save Error:", error);
                            }

                            toast({ title: "¡Te has unido al reto!", status: "success" });
                            resolve(true);
                        } else {
                            toast({ title: "Error de Verificación", description: "No se confirmó la transacción en la red.", status: "error" });
                            resolve(false);
                        }
                    }
                    else resolve(false);
                }
            );
        });
    }, [user, magnesium, costMultiplier, consumeMagnesium, toast]);

    const fetchParticipants = useCallback(async (challengeId?: string) => {
        try {
            // 1. Fetch from Supabase (Fast & Reliable)
            const { data, error } = await supabase
                .from('participants')
                .select('*');

            if (data && !error) {
                const mapped = data.map(p => ({
                    account: p.account,
                    challengeId: p.challenge_id,
                    timestamp: p.created_at,
                    paidFORTIS: p.paid_amount
                }));
                if (challengeId) return mapped.filter(p => p.challengeId === challengeId);
                return mapped;
            }
            return [];
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
            const json = { account: user, app: "fortis-m2e", timestamp: new Date().toISOString() };
            console.log("Requesting custom_json:", json);

            (window as any).hive_keychain.requestCustomJson(
                user,
                'fortis_m2e_faucet_claim',
                'Posting',
                JSON.stringify(json),
                "Solicitar 20 FORTIS (Faucet)",
                async (res: any) => {
                    if (res.success) {
                        toast({ title: "Enviando...", description: "Esperando confirmación de la red...", status: "info", duration: 10000 });

                        const verified = await verifyL1Operation(user, 'fortis_m2e_faucet_claim');

                        if (verified) {
                            setHasClaimedFaucet(true);
                            toast({ title: "Faucet Reclamado", description: "Tus tokens llegarán en breve.", status: "success" });
                            r(true);
                        } else {
                            toast({ title: "Tiempo de espera agotado", description: "La red está lenta, verifica tu historial en unos minutos.", status: "warning" });
                            r(false);
                        }
                    } else {
                        r(false);
                    }
                }
            );
        });
    }, [user, hasClaimedFaucet, toast]);

    const fetchFaucetClaims = useCallback(async () => {
        const historyClaims: any[] = [];
        const pendingClaims: any[] = [];
        const paidUsersMap = new Set<string>();

        try {
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
        if (!user || !(window as any).hive_keychain) {
            toast({ title: "Error", description: "Keychain no detectado", status: "error" });
            return;
        }

        console.log(`Starting payout for ${claims.length} claims...`);

        for (const c of claims) {
            const json = { contractName: "tokens", contractAction: "transfer", contractPayload: { symbol: "FORTIS", to: c.account, quantity: "20", memo: "Faucet Claim" } };
            await new Promise(r => {
                (window as any).hive_keychain.requestCustomJson(
                    user,
                    'ssc-mainnet-hive',
                    'Active',
                    JSON.stringify(json),
                    `Faucet: 20 FORTIS -> ${c.account}`,
                    (res: any) => {
                        console.log(`Payout to ${c.account}:`, res);
                        setTimeout(r, 500); // Wait bit before next
                    }
                );
            });
        }
    }, [user, toast]);

    return { magnesium, joinedChallenges, stakeAmount, tier, costMultiplier, reloadMagnesium, joinChallenge, consumeMagnesium, simulateStake, fetchParticipants, payoutRewards, createChallenge, fetchChallenges, saveRanking, fetchRankings, claimAirdropFaucet, fetchFaucetClaims, payoutFaucet, hasClaimedFaucet, isReloading, isLoading, user };
};
