'use client';

import { useState, useEffect } from 'react';
import { selectActiveProfile } from '@/app/actions/profile';

interface Profile {
    id: string;
    name: string;
    avatar: string | null;
    account_type: string;
}

export default function WhoIsWatchingOverlay({ profiles, userId, onSelect }: { profiles: Profile[], userId: string, onSelect: () => void }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleSelect = async (profileId: string) => {
        // Simple animation before closing
        setIsVisible(false);
        setTimeout(async () => {
            const res = await selectActiveProfile(profileId, userId);
            if (res.success) {
                onSelect();
            }
        }, 600);
    };

    if (profiles.length === 0) return null;

    return (
        <div className={`fixed inset-0 z-[9000] bg-black transition-all duration-700 flex flex-col items-center justify-center p-6 sm:p-12 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse delay-1000" />

            <div className={`w-full max-w-6xl mx-auto flex flex-col items-center transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter text-center">Who is watching?</h1>
                <p className="text-zinc-500 font-bold mb-16 uppercase tracking-[0.2em] text-[10px] sm:text-xs text-center opacity-60">Playra Discovery Session</p>

                <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14 w-full">
                    {profiles.map((profile, i) => (
                        <div
                            key={profile.id}
                            className={`group flex flex-col items-center gap-5 cursor-pointer max-w-[140px] transition-all duration-700`}
                            onClick={() => handleSelect(profile.id)}
                            style={{ transitionDelay: `${400 + (i * 100)}ms` }}
                        >
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-[4px] bg-gradient-to-tr from-transparent to-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-500 relative ring-1 ring-white/5 shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-zinc-900 group-hover:border-black transition-all">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-4xl font-black text-zinc-700 uppercase">
                                            {profile.name[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-center">
                                <span className="text-zinc-400 font-bold text-lg group-hover:text-white transition-colors capitalize">{profile.name}</span>
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter group-hover:text-zinc-400 transition-colors">{profile.account_type || 'general'}</span>
                            </div>
                        </div>
                    ))}

                    <div
                        className="group flex flex-col items-center gap-5 cursor-pointer transition-all duration-700"
                        style={{ transitionDelay: `${400 + (profiles.length * 100)}ms` }}
                        onClick={() => window.location.href = '/select-profile'}
                    >
                        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-zinc-900/40 border-2 border-dashed border-zinc-700/50 flex items-center justify-center group-hover:border-white/20 group-hover:bg-zinc-800/80 transition-all">
                            <svg className="w-8 h-8 text-zinc-700 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </div>
                        <span className="text-zinc-600 font-bold text-sm tracking-widest uppercase group-hover:text-zinc-400">New</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
