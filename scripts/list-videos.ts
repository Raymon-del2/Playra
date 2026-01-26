import { supabase } from "../src/lib/supabase";

async function run() {
    if (!supabase) return;
    console.log("Listing all videos in Supabase...");
    const { data, error } = await supabase.from('videos').select('id, title, channel_id, channel_name');
    if (error) throw error;
    console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
