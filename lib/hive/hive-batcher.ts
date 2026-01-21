/**
 * Utility for batching JSON-RPC requests to Hive nodes.
 * This significantly improves performance by reducing HTTP overhead and roundtrips.
 */

const DEFAULT_NODES = [
    "https://api.syncad.com",
    "https://api.deathwing.me",
    "https://api.openhive.network",
    "https://rpc.mahdiyari.info",
    "https://api.hive.blog",
];

interface JsonRpcRequest {
    jsonrpc: "2.0";
    id: number;
    method: string;
    params: any[];
}

export async function hiveBatchFetch<T = any>(
    api: string,
    method: string,
    paramsArray: any[][],
    nodeUrl?: string
): Promise<T[]> {
    const nodes = nodeUrl ? [nodeUrl] : DEFAULT_NODES;
    let lastError: any = null;

    for (const node of nodes) {
        try {
            const requests: JsonRpcRequest[] = paramsArray.map((params, index) => ({
                jsonrpc: "2.0",
                id: index + 1,
                method: `${api}.${method}`,
                params,
            }));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(node, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requests),
                signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const results = await response.json();

            if (!Array.isArray(results)) {
                // If it's a single object, it might be an error from the node
                if (results.error) throw new Error(results.error.message || "Node error");
                throw new Error("Invalid batch response: not an array");
            }

            // Map results back to original order even if server returned them out of order
            const mappedResults = new Array(paramsArray.length).fill(null);
            results.forEach((r: any) => {
                if (r.id && r.id > 0 && r.id <= paramsArray.length) {
                    mappedResults[r.id - 1] = r.result;
                }
            });

            return mappedResults;
        } catch (error) {
            console.warn(`Batch fetch failed on ${node}:`, error);
            lastError = error;
            continue; // Try next node
        }
    }

    throw lastError || new Error("All nodes failed");
}
