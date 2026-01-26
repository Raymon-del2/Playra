import { supabase } from "../src/lib/supabase";

async function run() {
    if (!supabase) return;
    const videoIds = [
        "83ad3362-1728-4b75-8f82-cd2df23d0430",
        "da6301ac-47d4-46d3-8633-7252398a3e79",
        "27a9343d-cd85-49a9-ad34-fc6b868fee1b",
        "a3a4aca3-bd92-4a01-9075-6929fa957aa9"
    ];

    console.log(`Attempting to delete ${videoIds.length} videos...`);

    for (const id of videoIds) {
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) console.error(`Failed ${id}:`, error);
        else console.log(`Deleted ${id} (possibly, if no error)`);
    }
    process.exit(0);
}

run();
