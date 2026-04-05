'use server';

import { engagementSupabase } from "@/lib/supabase";

export async function submitFeedback(message: string, profileId?: string) {
  if (!message.trim()) {
    return { success: false, error: "Message cannot be empty" };
  }

  const { error } = await engagementSupabase
    .from("feedback")
    .insert([{ message: message.trim(), profile_id: profileId || null }]);

  if (error) {
    console.error("Feedback error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
