import { turso } from "../src/lib/turso";

async function run() {
    console.log("Listing all channels...");
    const result = await turso.execute("SELECT id, name, user_id, account_type FROM channels");
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
}

run().catch(console.error);
