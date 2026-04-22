import { ImageResponse } from 'next/og';
import { getVideoById } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    try {
        const video = await getVideoById(id);
        
        if (!video) {
            return new Response('Video not found', { status: 404 });
        }

        const title = video.title || 'Video';
        const channelName = video.channel_name || 'Playra';
        const thumbnailUrl = video.thumbnail_url;

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f0f0f',
                        fontFamily: 'system-ui',
                    }}
                >
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt=""
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: 0.6,
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                            }}
                        />
                    )}
                    
                    <div
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)',
                        }}
                    />

                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '60px',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 40,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            }}
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="black">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>

                        <h1
                            style={{
                                fontSize: 48,
                                fontWeight: 700,
                                color: 'white',
                                marginBottom: 16,
                                maxWidth: 900,
                                lineHeight: 1.2,
                            }}
                        >
                            {title.length > 60 ? title.substring(0, 60) + '...' : title}
                        </h1>

                        <p
                            style={{
                                fontSize: 28,
                                color: 'rgba(255,255,255,0.8)',
                                marginBottom: 30,
                            }}
                        >
                            {channelName}
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                background: 'rgba(255,255,255,0.15)',
                                padding: '12px 24px',
                                borderRadius: 30,
                            }}
                        >
                            <span style={{ fontSize: 20, color: 'white' }}>Watch on</span>
                            <span style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>Playra</span>
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            bottom: 30,
                            right: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>playra.vercel.app</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error('OG image error:', error);
        return new Response('Error generating image', { status: 500 });
    }
}
