'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GIFT_CONFIG, type GiftType } from '@/types/live';

interface GiftPanelProps {
  streamId: string;
  creatorId: string;
  activeProfile: any;
}

const GIFTS: GiftType[] = ['leaf', 'flower', 'fruit', 'tree'];

export function GiftPanel({ streamId, creatorId, activeProfile }: GiftPanelProps) {
  const [sending, setSending] = useState<GiftType | null>(null);
  const [userCoins, setUserCoins] = useState(0);

  // For now, users have unlimited coins in v1
  // Later, they'll need to buy coins

  const sendGift = async (giftType: GiftType) => {
    if (!activeProfile) return;

    setSending(giftType);

    const gift = GIFT_CONFIG[giftType];

    try {
      // Insert donation record
      const { error } = await supabase!
        .from('donations')
        .insert({
          stream_id: streamId,
          sender_id: activeProfile.id,
          creator_id: creatorId,
          gift_type: giftType,
          coin_value: gift.coins,
          ksh_value: gift.ksh
        });

      if (error) throw error;

      // Update creator balance (in real app, this would be a transaction)
      try {
        await supabase!.rpc('add_coins_to_creator', {
          creator_id: creatorId,
          coins: gift.coins
        });
      } catch { /* ignore RPC errors */ }

    } catch (err) {
      console.error('Failed to send gift:', err);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-4 border-b border-white/10 bg-zinc-900">
      <h3 className="font-bold mb-3">Send a Gift 🎁</h3>
      
      {/* Gift buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {GIFTS.map((giftType) => {
          const gift = GIFT_CONFIG[giftType];
          const isSending = sending === giftType;
          
          return (
            <button
              key={giftType}
              onClick={() => sendGift(giftType)}
              disabled={!activeProfile || isSending}
              className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                isSending 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-2xl mb-1">{gift.emoji}</span>
              <span className="text-xs text-zinc-400">{gift.coins} coins</span>
              <span className="text-xs text-zinc-500">{gift.ksh} KSH</span>
            </button>
          );
        })}
      </div>

      {/* Coin balance */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Your balance:</span>
        <span className="font-bold text-yellow-400">∞ coins</span>
      </div>

      {!activeProfile && (
        <p className="text-xs text-zinc-500 mt-2 text-center">
          Sign in to send gifts
        </p>
      )}
    </div>
  );
}
