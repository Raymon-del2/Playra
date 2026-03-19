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
        const thumbnailUrl = video.thumbnail_url || '/og-image.svg';

        return {
            title: `${video.title} | Playra`,
            description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
            openGraph: {
                title: video.title,
                description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
                url: videoUrl,
                siteName: 'Playra',
                images: [
                    {
                        url: thumbnailUrl,
                        width: 1280,
                        height: 720,
                        alt: video.title,
                    },
                ],
                type: 'video.other',
            },
            twitter: {
                card: 'summary_large_image',
                title: video.title,
                description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
                images: [thumbnailUrl],
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
