import { turso } from "./turso";

async function verifyProfiles() {
    try {
        console.log("Checking channels table schema...");
        const schema = await turso.execute("PRAGMA table_info(channels);");
        console.log(schema.rows);

        console.log("\nChecking all channels:");
        const channels = await turso.execute("SELECT * FROM channels;");
        console.log(`Found ${channels.rows.length} channels.`);
        console.log(channels.rows);

        console.log("\nChecking count query logic:");
        // Assuming a user ID from the channels we found, or a random one if empty
        const userId = channels.rows[0]?.user_id as string || 'test_user';
        const countRes = await turso.execute({
            sql: "SELECT COUNT(*) as count FROM channels WHERE user_id = ?",
            args: [userId]
        });
        console.log("Count result for", userId, ":", countRes.rows);

    } catch (e) {
        console.error("Verification failed:", e);
    }
}

verifyProfiles();
