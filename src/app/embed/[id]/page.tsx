import { Metadata } from 'next';
import { getVideoById } from '@/lib/supabase';
import EmbedPageClient from './page-client';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    
    try {
        const video = await getVideoById(id);
        
        if (!video) {
            return {
                title: 'Embed | Playra',
            };
        }

        const embedUrl = `https://playra.vercel.app/embed/${video.id}`;
        const ogImageUrl = `https://playra.vercel.app/og/${video.id}`;

        return {
            title: `${video.title} | Playra`,
            description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
            openGraph: {
                title: video.title,
                description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
                url: embedUrl,
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
                card: 'player',
                title: `${video.title} | Playra`,
                description: video.description?.substring(0, 160) || `Watch ${video.title} on Playra`,
                images: [ogImageUrl],
            },
        };
    } catch (error) {
        return {
            title: 'Embed | Playra',
        };
    }
}

export default async function EmbedPage({ params }: Props) {
    return <EmbedPageClient params={params} />;
}
