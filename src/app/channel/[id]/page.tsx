import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ChannelPageClient from './page-client';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    
    try {
        const { data: channel } = await supabase
            .from('channels')
            .select('*')
            .eq('id', id)
            .single();
        
        if (!channel) {
            return {
                title: 'Channel | Playra',
                description: 'View channel on Playra',
            };
        }

        const channelUrl = `https://playra.vercel.app/channel/${channel.id}`;
        const avatarUrl = channel.avatar || '/og-image.svg';

        return {
            title: `${channel.name} | Playra`,
            description: channel.description || `Follow ${channel.name} on Playra`,
            openGraph: {
                title: `${channel.name} | Playra`,
                description: channel.description || `Follow ${channel.name} on Playra`,
                url: channelUrl,
                siteName: 'Playra',
                images: [
                    {
                        url: avatarUrl,
                        width: 512,
                        height: 512,
                        alt: channel.name,
                    },
                ],
                type: 'profile',
            },
            twitter: {
                card: 'summary',
                title: `${channel.name} | Playra`,
                description: channel.description || `Follow ${channel.name} on Playra`,
                images: [avatarUrl],
            },
            alternates: {
                canonical: channelUrl,
            },
        };
    } catch (error) {
        console.error('Error generating channel metadata:', error);
        return {
            title: 'Channel | Playra',
            description: 'View channel on Playra',
        };
    }
}

export default async function ChannelPage({ params }: Props) {
    return <ChannelPageClient params={params} />;
}
