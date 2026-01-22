import { Client } from "@hiveio/dhive";

const HiveClient = new Client([
    "https://api.deathwing.me",
    "https://api.hive.blog",
    "https://api.openhive.network",
]);

async function getLastSnapsContainer() {
    const author = "peak.snaps";
    const beforeDate = new Date().toISOString().split('.')[0];
    const permlink = '';
    const limit = 1;

    console.log(`Fetching container for ${author} before ${beforeDate}...`);

    try {
        const result = await HiveClient.database.call('get_discussions_by_author_before_date',
            [author, permlink, beforeDate, limit]);

        if (!result || result.length === 0) {
            console.error("No containers found!");
            return;
        }

        const container = result[0];
        console.log("Found container:");
        console.log(`Author: ${container.author}`);
        console.log(`Permlink: ${container.permlink}`);
        console.log(`Created: ${container.created}`);
        console.log(`Title: ${container.title}`);
    } catch (error) {
        console.error("Error fetching container:", error);
    }
}

getLastSnapsContainer();
