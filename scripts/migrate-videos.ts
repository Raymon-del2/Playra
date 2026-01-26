import { supabase } from "../src/lib/supabase";

async function run() {
    if (!supabase) return;

    const newChannelId = "ch_1769431864528_seuw23ww2";
    const newChannelName = "@Playra";

    console.log(`Migrating videos to ${newChannelId}...`);

    const { data, error } = await supabase
        .from('videos')
        .update({
            channel_id: newChannelId,
            channel_name: newChannelName,
        })
        .or(`channel_name.eq.Guess-me,channel_id.eq.ch_1769262677206_k5xxdmskb`)
        .select();

    if (error) {
        console.error("Migration failed:", error);
    } else {
        console.log(`Successfully migrated ${data?.length || 0} videos.`);
        console.log(JSON.stringify(data, null, 2));
    }
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
