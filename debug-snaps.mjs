// using global fetch
const NODE = 'https://api.syncad.com';
const COMMUNITY = 'hive-148971';

async function call(method, params) {
    try {
        const res = await fetch(NODE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: `condenser_api.${method}`,
                params
            })
        });
        const json = await res.json();
        return json.result;
    } catch (e) {
        console.error(`Error calling ${method}:`, e.message);
        return null;
    }
}

async function debug() {
    console.log(`--- Community Feed (${COMMUNITY}) ---`);
    const communityPosts = await call('get_discussions_by_created', [{
        tag: COMMUNITY,
        limit: 10
    }]);

    if (communityPosts) {
        communityPosts.forEach(p => {
            console.log(`[${p.created}] @${p.author}/${p.permlink}`);
        });
    }

    console.log(`\n--- Searching Peak Snaps Containers ---`);
    const containers = await call('get_discussions_by_author_before_date', [
        'peak.snaps',
        '',
        new Date().toISOString(),
        5
    ]);

    if (containers) {
        for (const c of containers) {
            console.log(`Checking container @${c.author}/${c.permlink}...`);
            const replies = await call('get_content_replies', [c.author, c.permlink]);
            if (!replies) continue;

            const fortisSnaps = replies.filter(r => {
                try {
                    const meta = JSON.parse(r.json_metadata || '{}');
                    return (meta.tags && meta.tags.includes(COMMUNITY));
                } catch (e) { return false; }
            });

            if (fortisSnaps.length > 0) {
                console.log(`  Found ${fortisSnaps.length} snaps!`);
                fortisSnaps.forEach(s => {
                    console.log(`    [${s.created}] @${s.author}: ${s.body.substring(0, 50)}...`);
                });
            } else {
                console.log(`  No snaps found in this container.`);
            }
        }
    }
    console.log("\nDone.");
}

debug();
