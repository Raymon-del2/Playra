import { supabase } from "../src/lib/supabase";

async function run() {
    if (!supabase) {
        console.error("Supabase client not initialized");
        return;
    }

    console.log("Fetching all video IDs...");
    const { data: videos, error: fetchError } = await supabase
        .from('videos')
        .select('id');

    if (fetchError) {
        console.error("Failed to fetch videos:", fetchError);
        return;
    }

    if (!videos || videos.length === 0) {
        console.log("No videos found to delete.");
        return;
    }

    console.log(`Found ${videos.length} videos. Attempting to delete one by one for better debugging...`);

    for (const v of videos) {
        console.log(`Deleting video: ${v.id}`);
        const { data, error, status, statusText } = await supabase
            .from('videos')
            .delete()
            .eq('id', v.id)
            .select();

        if (error) {
            console.error(`Error deleting ${v.id}:`, error);
        } else {
            console.log(`Status: ${status} ${statusText}`);
            console.log(`Deleted data:`, data);
        }
    }

    process.exit(0);
}

run().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
