import { supabase } from "../src/lib/supabase";

async function run() {
    if (!supabase) return;
    const { data } = await supabase.from('videos').select('channel_name').limit(1);
    const name = data?.[0]?.channel_name;
    console.log(`'${name}' length: ${name?.length}`);
    for (let i = 0; i < (name?.length || 0); i++) {
        console.log(`char[${i}]: ${name.charCodeAt(i)} (${name[i]})`);
    }
}
run();
