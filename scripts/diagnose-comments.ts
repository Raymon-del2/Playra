import { supabase } from "../src/lib/supabase";

async function run() {
    if (!supabase) {
        console.error("Supabase client not initialized");
        return;
    }

    console.log("Checking if 'comments' table exists...");

    try {
        const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error accessing comments table:", error);
            console.log("\nPOSSIBLE FIX: The tables have not been created yet.");
            console.log("Please run the SQL in 'scripts/create-tables.sql' in your Supabase Dashboard SQL Editor.");
        } else {
            console.log("Comments table exists. Row count:", count);

            console.log("Attempting a test insert...");
            // Try to insert a dummy comment if we have a valid video and profile.
            // We need a profile ID and video ID.

            // 1. Get a video
            const { data: videos } = await supabase.from('videos').select('id').limit(1);
            if (!videos || videos.length === 0) {
                console.log("No videos found to test comment on.");
                return;
            }
            const videoId = videos[0].id;
            console.log("Found video ID:", videoId);

            // 2. Get a profile (or just use a random ID if RLS allows it, but RLS might block)
            // We'll verify if RLS is the issue by trying an anonymous insert which should fail if policies are strict

            console.log("Checking RLS policies...");
            const { error: insertError } = await supabase
                .from('comments')
                .insert({
                    video_id: videoId,
                    profile_id: 'test-diagnostic-user',
                    content: 'Test comment from diagnostic script'
                });

            if (insertError) {
                console.error("Insert failed:", insertError);
            } else {
                console.log("Insert success (or silent RLS failure if no row returned).");
            }
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

run().catch(console.error);
