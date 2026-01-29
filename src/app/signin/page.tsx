'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { syncUserToDb } from '@/app/actions/auth';

export default function SignInPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const getFriendlyErrorMessage = (error: any) => {
        const code = error?.code || '';
        switch (code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return isSignUp ? 'Email already associated with another account.' : 'User not found or invalid details. Please join Playra first.';
            case 'auth/email-already-in-use':
                return 'This email is already registered. Try signing in instead.';
            case 'auth/weak-password':
                return 'Password is too weak. High-fidelity accounts require at least 6 characters.';
            case 'auth/invalid-email':
                return 'Please enters a valid email address.';
            case 'auth/popup-closed-by-user':
                return 'Google sign-in was cancelled.';
            case 'auth/network-request-failed':
                return 'Connection lost. Please check your Discovery link.';
            default:
                return error.message || 'Discovery authentication failed. Please try again.';
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Enter your email first, then tap reset.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResetSent(false);

        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (name) {
                    await updateProfile(userCredential.user, { displayName: name });
                }

                // Fire-and-forget sync to speed up UX
                syncUserToDb({
                    id: userCredential.user.uid,
                    email: userCredential.user.email!,
                    username: name || email.split('@')[0]
                }).catch(err => console.error("Background sync failed:", err));

                router.push('/set-account');
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);

                // Fire-and-forget sync
                syncUserToDb({
                    id: userCredential.user.uid,
                    email: userCredential.user.email!,
                }).catch(err => console.error("Background sync failed:", err));

                router.push('/select-profile');
            }
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Fire-and-forget sync
            syncUserToDb({
                id: result.user.uid,
                email: result.user.email!,
                username: result.user.displayName || undefined
            }).catch(err => console.error("Background sync failed:", err));

            router.push('/select-profile');
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full max-w-full bg-black flex items-center justify-center p-4 relative overflow-x-hidden">
            {/* Ambient Background Glow - contained within viewport */}
            <div className="absolute top-0 left-0 w-[50%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[50%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-[420px] z-10 px-2">
                {/* Header/Logo section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="h-12 flex items-center justify-center mb-6">
                        <img src="/Playra.png" alt="Playra" className="h-full w-auto brightness-200" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h1>
                    <p className="text-zinc-400 font-bold text-sm tracking-wide">
                        If you use Google first, set a password via “Create account” or “Forgot password” to sign in with email later.
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black flex items-center gap-3 animate-shake">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {error}
                        </div>
                    )}
                    {resetSent && !error && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-300 text-xs font-black flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Reset email sent. Check your inbox.
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-5">
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-zinc-500 uppercase px-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-5 text-sm text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none font-bold ring-0"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-zinc-500 uppercase px-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-5 text-sm text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none font-bold ring-0"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-zinc-500 uppercase px-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-5 text-sm text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none font-bold ring-0"
                                required
                            />
                        </div>

                        {!isSignUp && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    className="text-xs font-black text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:bg-zinc-200 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                isSignUp ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-white/5" />
                        <span className="text-[10px] font-black text-zinc-600 uppercase">Or continue with</span>
                        <div className="flex-1 h-[1px] bg-white/5" />
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full h-14 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-3 group/google"
                    >
                        <svg className="w-5 h-5 group-hover/google:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Google Account
                    </button>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm font-bold text-zinc-500 hover:text-white transition-colors"
                        >
                            {isSignUp ? (
                                <>Already have an account? <span className="text-blue-400 font-black">Sign In</span></>
                            ) : (
                                <>Don't have an account? <span className="text-blue-400 font-black">Join Playra</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer links */}
                <div className="mt-10 flex items-center justify-center gap-6 text-[10px] font-black text-zinc-600 tracking-widest uppercase">
                    <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                    <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
                    <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <Link href="/help" className="hover:text-zinc-400 transition-colors">Help</Link>
                </div>
            </div>
        </div>
    );
}
