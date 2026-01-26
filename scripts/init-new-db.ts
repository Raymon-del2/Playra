import { initDatabase } from "../src/lib/db-setup";

async function run() {
    console.log("Starting database initialization for new Turso instance...");
    await initDatabase();
    console.log("Database initialized.");
    process.exit(0);
}

run().catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});
