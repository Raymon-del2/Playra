'use client';

interface FounderBadgeProps {
    joinOrder: number | null | undefined;
    size?: 'sm' | 'md';
}

export default function FounderBadge({ joinOrder, size = 'md' }: FounderBadgeProps) {
    if (!joinOrder || joinOrder > 50) return null;

    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
        <img 
            src="/verified-badge.ico" 
            className={`${sizeClass} inline-block`}
            alt={joinOrder <= 10 ? `Early Bird #${joinOrder}` : `Founder #${joinOrder}`}
            title={joinOrder <= 10 ? `Early Bird #${joinOrder}` : `Founder #${joinOrder}`}
        />
    );
}
