import { supabase } from "../src/lib/supabase";

async function run() {
    if (!supabase) return;

    const newChannelId = "ch_1769431864528_seuw23ww2";
    const newChannelName = "@Playra";

    console.log(`Migrating videos for Guess-me to ${newChannelId}...`);

    // First update by ID
    const res1 = await supabase
        .from('videos')
        .update({ channel_id: newChannelId, channel_name: newChannelName })
        .eq('channel_id', 'ch_1769262677206_k5xxdmskb')
        .select();

    console.log(`Updated by ID: ${res1.data?.length || 0}`);

    // Then update by Name
    const res2 = await supabase
        .from('videos')
        .update({ channel_id: newChannelId, channel_name: newChannelName })
        .eq('channel_name', 'Guess-me')
        .select();

    console.log(`Updated by Name: ${res2.data?.length || 0}`);

    process.exit(0);
}

run();
