'use server';

import { engagementSupabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

export type ContactMessage = {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    status: 'new' | 'read' | 'replied';
};

export async function submitContactMessage(name: string, email: string, subject: string, message: string) {
    try {
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

        const id = uuidv4();
        const now = new Date().toISOString();

        await engagementSupabase.from('contact_messages').insert({
            id,
            name,
            email,
            subject,
            message,
            created_at: now,
            status: 'new'
        });

        return { success: true, id };
    } catch (error) {
        console.error("Error submitting contact message:", error);
        return { success: false, error: "Failed to send message. Please try again later." };
    }
}
