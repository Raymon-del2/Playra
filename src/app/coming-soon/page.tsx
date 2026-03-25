import { getActiveProfile } from "@/app/actions/profile";
import ComingSoonSection from "@/components/ComingSoonSection";
import Link from "next/link";

export default async function ComingSoonPage() {
  const activeProfile = await getActiveProfile();

  return (
    <main className="min-h-screen bg-[#0f0f0f] pt-14 pb-10">
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <header className="mb-12 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 uppercase">
            The Evolution of <span className="text-blue-500">Playra</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            We're building the future of video discovery and creation. Stay updated with our latest roadmap and upcoming features.
          </p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <ComingSoonSection isCollapsed={false} activeProfile={activeProfile} />
        </div>

        <footer className="mt-20 border-t border-white/5 pt-10 text-center">
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest pb-10">
            Ready to explore? <Link href="/" className="text-blue-500 hover:text-blue-400 transition-colors">Return to Discovery</Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
