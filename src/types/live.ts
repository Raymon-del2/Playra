export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'saved';
export type GiftType = 'leaf' | 'flower' | 'fruit' | 'tree';
export type WithdrawalMethod = 'mpesa' | 'bank';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type MessageType = 'text' | 'system' | 'gift';

export interface LiveStream {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
  status: StreamStatus;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  room_id: string;
  peak_viewers: number;
  total_views: number;
  likes_count: number;
  recording_url?: string;
  is_recorded: boolean;
  allow_chat: boolean;
  allow_donations: boolean;
  save_after_stream: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface LiveChatMessage {
  id: string;
  stream_id: string;
  sender_id: string;
  message: string;
  message_type: MessageType;
  created_at: string;
  
  // Joined fields
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Donation {
  id: string;
  stream_id: string;
  sender_id: string;
  creator_id: string;
  gift_type: GiftType;
  coin_value: number;
  ksh_value: number;
  is_withdrawn: boolean;
  withdrawn_at?: string;
  created_at: string;
  
  // Joined fields
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface CreatorBalance {
  creator_id: string;
  total_coins: number;
  total_ksh: number;
  withdrawn_ksh: number;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  creator_id: string;
  amount_ksh: number;
  platform_fee_ksh: number;
  net_amount_ksh: number;
  method: WithdrawalMethod;
  mpesa_number?: string;
  bank_account?: string;
  bank_name?: string;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at?: string;
  failure_reason?: string;
  processed_by?: string;
}

export interface StreamViewer {
  stream_id: string;
  viewer_id: string;
  joined_at: string;
  last_seen_at: string;
  
  // Joined fields
  viewer?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export const GIFT_CONFIG: Record<GiftType, { emoji: string; coins: number; ksh: number }> = {
  leaf: { emoji: '🍃', coins: 10, ksh: 1 },
  flower: { emoji: '🌸', coins: 50, ksh: 5 },
  fruit: { emoji: '🍎', coins: 100, ksh: 10 },
  tree: { emoji: '🌳', coins: 500, ksh: 50 }
};

export const WITHDRAWAL_FEE_KSH = 100;
export const CREATOR_CUT_PERCENTAGE = 70;

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  roomId: string;
  fromUserId: string;
  toUserId?: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface StreamRecording {
  blob: Blob;
  streamId: string;
  startedAt: Date;
  endedAt: Date;
}
