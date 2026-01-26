'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StylesPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the first styles clip
        router.replace('/styles/r8');
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
}
