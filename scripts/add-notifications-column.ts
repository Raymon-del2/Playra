import { turso } from "../src/lib/turso";

async function run() {
    console.log("Adding notifications column to subscriptions table...");
    
    try {
        await turso.execute(`
            ALTER TABLE subscriptions ADD COLUMN notifications INTEGER DEFAULT 1;
        `);
        console.log("Column added successfully.");
    } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
            console.log("Column already exists, skipping.");
        } else {
            console.error("Error:", error);
        }
    }
}

run().catch(console.error);
