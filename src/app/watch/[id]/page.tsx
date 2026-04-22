import { Metadata } from 'next';
import { getVideoById } from '@/lib/supabase';
import WatchPageClient from './page-client';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    
    try {
        const video = await getVideoById(id);
        
        if (!video) {
            return {
                title: 'Video | Playra',
                description: 'Watch videos on Playra',
            };
        }

        const videoUrl = `https://playra.vercel.app/watch/${video.id}`;
        const embedUrl = `https://playra.vercel.app/embed/${video.id}`;
        const ogImageUrl = `https://playra.vercel.app/og/${video.id}`;

        return {
            title: `${video.title} - Watch on Playra`,
            description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra - The best videos from independent creators`,
            openGraph: {
                title: video.title,
                description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
                url: videoUrl,
                siteName: 'Playra',
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: video.title,
                    },
                ],
                type: 'video.other',
                videos: [
                    {
                        url: embedUrl,
                        width: 1280,
                        height: 720,
                        type: 'text/html',
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${video.title} | Playra`,
                description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
                images: [ogImageUrl],
            },
            alternates: {
                canonical: videoUrl,
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Video | Playra',
            description: 'Watch videos on Playra',
        };
    }
}

export default async function WatchPage({ params }: Props) {
    return <WatchPageClient params={params} />;
}
