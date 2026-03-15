'use server';

import { turso } from "@/lib/turso";

export type ContactMessage = {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    status: 'new' | 'read' | 'replied';
};

async function ensureContactTableExists() {
    try {
        // Check if table exists
        const checkResult = await turso.execute({
            sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='contact_messages'",
            args: []
        });

        if (checkResult.rows.length === 0) {
            // Create the table
            await turso.execute({
                sql: `CREATE TABLE IF NOT EXISTS contact_messages (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TEXT DEFAULT (datetime('now')),
                    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied'))
                )`,
                args: []
            });

            // Create indexes
            await turso.execute({
                sql: "CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status)",
                args: []
            });
            await turso.execute({
                sql: "CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)",
                args: []
            });
        }
    } catch (error) {
        console.error("Error ensuring contact table exists:", error);
    }
}

export async function submitContactMessage(name: string, email: string, subject: string, message: string) {
    try {
        // Ensure table exists
        await ensureContactTableExists();
        // Validate inputs
        if (!name || !email || !subject || !message) {
            return { success: false, error: "All fields are required" };
        }

        if (name.length < 2) {
            return { success: false, error: "Name must be at least 2 characters" };
        }

        if (message.length < 10) {
            return { success: false, error: "Message must be at least 10 characters" };
        }

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: "Please enter a valid email address" };
        }

        const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        await turso.execute({
            sql: `INSERT INTO contact_messages (id, name, email, subject, message, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, name, email, subject, message, now, 'new']
        });

        return { success: true, id };
    } catch (error) {
        console.error("Error submitting contact message:", error);
        return { success: false, error: "Failed to send message. Please try again later." };
    }
}
