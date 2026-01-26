'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { updateUserProfile } from '@/app/actions/auth';

export default function SetAccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                setUsername(user.displayName?.split(' ')[0].toLowerCase() || '');
                setLoading(false);
            } else {
                router.push('/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (user) {
                // Save additional info to Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    username,
                    bio,
                    email: user.email,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                // Save to Turso via Server Action
                await updateUserProfile(user.uid, { username, bio });

                router.push('/');
            }
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full" />

            <div className="w-full max-w-[480px] z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight italic">Set up your identity</h1>
                    <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Personalize your Discovery experience</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[40px] shadow-2xl">
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Avatar preview */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1">
                                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-12 h-12 text-zinc-700" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                    )}
                                </div>
                            </div>
                            <button type="button" className="text-xs font-black text-blue-400 uppercase tracking-tighter hover:text-blue-300">Change Photo</button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Unique Username</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black">@</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="username"
                                        className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-10 pr-5 text-sm text-white placeholder:text-zinc-700 focus:bg-white/[0.06] focus:border-blue-500/30 transition-all outline-none font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Short Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell the world who you are..."
                                    className="w-full h-32 bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm text-white placeholder:text-zinc-700 focus:bg-white/[0.06] focus:border-blue-500/30 transition-all outline-none font-bold resize-none"
                                />
                            </div>
                        </div>

                        <button
                            disabled={saving}
                            className="w-full h-16 bg-white text-black rounded-2xl font-black text-sm active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)] hover:shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
                        >
                            {saving ? 'Saving...' : 'Finalize Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
