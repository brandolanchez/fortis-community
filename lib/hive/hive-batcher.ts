/**
 * Utility for batching JSON-RPC requests to Hive nodes.
 * This significantly improves performance by reducing HTTP overhead and roundtrips.
 */

const DEFAULT_NODES = [
    "https://api.deathwing.me",
    "https://techcoderx.com",
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
    const node = nodeUrl || DEFAULT_NODES[0];

    // Construct the batch request
    const requests: JsonRpcRequest[] = paramsArray.map((params, index) => ({
        jsonrpc: "2.0",
        id: index + 1,
        method: `${api}.${method}`,
        params,
    }));

    try {
        const response = await fetch(node, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requests),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();

        // Sort by ID to ensure order matches paramsArray
        return results
            .sort((a: any, b: any) => a.id - b.id)
            .map((r: any) => r.result);
    } catch (error) {
        console.error("Batch fetch failed:", error);
        throw error;
    }
}
