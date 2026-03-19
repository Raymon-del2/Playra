'use client';

interface FounderBadgeProps {
    joinOrder: number | null | undefined;
    size?: 'sm' | 'md';
}

export default function FounderBadge({ joinOrder, size = 'md' }: FounderBadgeProps) {
    if (!joinOrder || joinOrder > 50) return null;

    const isEarlyBird = joinOrder <= 10;
    
    return (
        <span 
            className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider ${
                size === 'sm' 
                    ? 'px-1.5 py-0.5 text-[9px]' 
                    : 'px-2 py-0.5 text-[10px]'
            } ${
                isEarlyBird 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' 
                    : 'bg-blue-600 text-white'
            }`}
            title={isEarlyBird ? `Early Bird #${joinOrder}` : `Founder #${joinOrder}`}
        >
            {isEarlyBird ? '★' : '◆'} 
            {joinOrder <= 9 ? `0${joinOrder}` : joinOrder}
        </span>
    );
}
