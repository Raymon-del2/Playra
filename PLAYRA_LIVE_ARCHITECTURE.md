# Playra Live Architecture Blueprint

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PLAYRA LIVE v1                                  │
│                    WebRTC Streaming + Supabase Realtime                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   CREATOR CLIENT    │         │    VIEWER CLIENT    │         │   SUPABASE CLOUD    │
│                     │         │                     │         │                     │
│ ┌───────────────┐   │         │ ┌───────────────┐   │         │ ┌───────────────┐   │
│ │  WebRTC Send  │◄──┼──┐   ┌──┼──►│ WebRTC Recv  │   │         │ │  Realtime DB  │   │
│ │  (getUserMedia)│  │  │   │  │  │  (Peer Conn) │   │         │ │  - streams    │   │
│ └───────────────┘   │  │   │  │  └───────────────┘   │         │ │  - chat       │   │
│                     │  │   │  │                     │         │ │  - donations  │   │
│ ┌───────────────┐   │  │   │  │  ┌───────────────┐ │         │ │  - presence   │   │
│ │  MediaRecorder│   │  │   │  │  │   Live Chat   │ │         │ └───────────────┘   │
│ │  (save stream)│   │  │   │  │  │  (Realtime)   │ │         │                     │
│ └───────────────┘   │  │   │  │  └───────────────┘ │         │ ┌───────────────┐   │
│                     │  ▼   ▲  │                     │         │ │  Storage      │   │
│ ┌───────────────┐   │ ┌─────┐ │  ┌───────────────┐ │         │ │  - recordings │   │
│ │  Go Live UI   │   │ │SIGNAL│ │  │  Gifts Panel  │ │         │ │  - thumbnails │   │
│ └───────────────┘   │ │SERVER│ │  └───────────────┘ │         │ └───────────────┘   │
└─────────────────────┘ └──┬──┘ └─────────────────────┘         └─────────────────────┘
                           │
                    (WebSocket for
                     signaling only)
```

## Phase 1: Core Infrastructure (Free Tier)

### Database Schema

```sql
-- LIVE STREAMS TABLE
CREATE TABLE live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    thumbnail_url TEXT,
    
    -- Stream State
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'saved')),
    scheduled_at TIMESTAMP WITH TIME ZONE,  -- For "Streaming Soon" feature
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- WebRTC Signaling
    room_id TEXT UNIQUE NOT NULL,  -- Simple unique room identifier
    
    -- Stats
    peak_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Recording
    recording_url TEXT,  -- Saved video URL after stream ends
    is_recorded BOOLEAN DEFAULT false,
    
    -- Settings
    allow_chat BOOLEAN DEFAULT true,
    allow_donations BOOLEAN DEFAULT true,
    save_after_stream BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- LIVE CHAT TABLE (Realtime enabled)
CREATE TABLE live_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'gift')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Realtime for live_chat
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat;

-- DONATIONS/ GIFTS TABLE
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Gift Details
    gift_type TEXT NOT NULL CHECK (gift_type IN ('leaf', 'flower', 'fruit', 'tree')),
    coin_value INTEGER NOT NULL,
    
    -- Kenyan Shilling equivalent (for withdrawal calculations)
    ksh_value DECIMAL(10,2) NOT NULL,
    
    -- Status
    is_withdrawn BOOLEAN DEFAULT false,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CREATOR BALANCE TABLE
CREATE TABLE creator_balances (
    creator_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    total_coins INTEGER DEFAULT 0,
    total_ksh DECIMAL(10,2) DEFAULT 0,
    withdrawn_ksh DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- WITHDRAWALS TABLE
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Amount
    amount_ksh DECIMAL(10,2) NOT NULL,
    platform_fee_ksh DECIMAL(10,2) NOT NULL DEFAULT 100,  -- Your 100 KSH fee
    net_amount_ksh DECIMAL(10,2) NOT NULL,
    
    -- Method
    method TEXT NOT NULL CHECK (method IN ('mpesa', 'bank')),
    mpesa_number TEXT,
    bank_account TEXT,
    bank_name TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    
    -- Admin reference
    processed_by TEXT REFERENCES profiles(id)
);

-- STREAM VIEWERS (Presence - who is watching)
CREATE TABLE stream_viewers (
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    viewer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    PRIMARY KEY (stream_id, viewer_id)
);

-- Enable Realtime for viewer count updates
ALTER PUBLICATION supabase_realtime ADD TABLE stream_viewers;

-- INDEXES for performance
CREATE INDEX idx_live_streams_status ON live_streams(status);
CREATE INDEX idx_live_streams_creator ON live_streams(creator_id);
CREATE INDEX idx_live_chat_stream ON live_chat(stream_id, created_at);
CREATE INDEX idx_donations_creator ON donations(creator_id, is_withdrawn);
CREATE INDEX idx_donations_stream ON donations(stream_id);
```

## Gift Economics

```
┌─────────────────────────────────────────┐
│           GIFT PRICING                   │
├──────────┬─────────────┬────────────────┤
│  Gift    │  Coins      │    KSH Value   │
├──────────┼─────────────┼────────────────┤
│  🍃 Leaf │    10       │      1 KSH     │
│  🌸 Flower│    50       │      5 KSH     │
│  🍎 Fruit│   100       │     10 KSH     │
│  🌳 Tree │   500       │     50 KSH     │
└──────────┴─────────────┴────────────────┘

Creator gets: 70% of KSH value
Platform gets: 30% of KSH value + 100 KSH per withdrawal
```

## File Structure

```
src/
├── app/
│   ├── live/
│   │   ├── page.tsx                    # Browse live streams
│   │   ├── [roomId]/
│   │   │   └── page.tsx                # Watch live stream (viewer)
│   │   └── go/
│   │       └── page.tsx                # Go Live (creator)
│   └── api/
│       └── live/
│           ├── signal/route.ts          # WebRTC signaling
│           └── record/route.ts          # Save recording
├── components/
│   └── live/
│       ├── CreatorStream.tsx           # WebRTC broadcaster
│       ├── ViewerStream.tsx            # WebRTC receiver
│       ├── LiveChat.tsx                # Realtime chat
│       ├── GiftPanel.tsx               # Send gifts
│       ├── GiftAnimation.tsx           # Flying gifts overlay
│       ├── StreamScheduler.tsx         # "Streaming Soon"
│       ├── LiveStats.tsx               # Viewer count, likes
│       └── RecordingUploader.tsx       # Auto-save stream
├── hooks/
│   └── useWebRTC.ts                    # WebRTC hook
├── lib/
│   └── live/
│       ├── signaling.ts                # WebRTC signaling logic
│       ├── recording.ts                # MediaRecorder handling
│       └── donations.ts                # Gift calculations
└── types/
    └── live.ts                         # TypeScript types
```

## WebRTC Architecture (MESH for v1)

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBRTC MESH TOPOLOGY                     │
│                   (Good for <10 viewers)                   │
└─────────────────────────────────────────────────────────────┘

  CREATOR (Host)                    VIEWER 1
  ┌──────────┐                     ┌──────────┐
  │  Sends   │◄──────WebRTC───────►│  Receives│
  │  Video   │                     │          │
  └──────────┘                     └──────────┘
        ▲
        │ WebRTC Peer Connection
        ▼
  ┌──────────┐                     ┌──────────┐
  │  VIEWER 2│◄──────WebRTC───────►│  VIEWER 3│
  │  Receives│                     │  Receives│
  └──────────┘                     └──────────┘

For v1: Creator uploads to each viewer directly
For v2: Add free TURN server or upgrade to Selective Forwarding Unit (SFU)
```

## Component Specifications

### 1. Go Live Page (`/live/go`)

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                      PRE-STREAM SETUP                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │          CAMERA PREVIEW                           │   │
│   │          (getUserMedia)                           │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Stream Title: [____________________________________]     │
│                                                             │
│   Category:    [Gaming ▼] [Music ▼] [Talk ▼] [Other ▼]      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ ☑ Save stream after ending                          │   │
│   │ ☑ Enable donations                                  │   │
│   │ ☐ Schedule for later                                │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │              [ 🔴 START LIVE ]                      │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Camera/mic permission handling
- Thumbnail capture from preview
- Title validation
- Category selection
- "Schedule for later" toggle (shows datetime picker)

### 2. Live Stream Page (Creator View) (`/live/[roomId]` as creator)

**UI Layout:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ LIVE ● 00:45:23                                   🔴 END STREAM | ⚙️ SETTINGS │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────┐    ┌─────────────────────────────┐  │
│  │                                      │    │      LIVE CHAT            │  │
│  │         YOUR CAMERA                  │    ├─────────────────────────────┤  │
│  │                                      │    │ user1: hello!              │  │
│  │    (WebRTC local stream)             │    │ user2: 🔥🔥🔥              │  │
│  │                                      │    │ user3: 🌳 (Tree sent!)     │  │
│  │    ┌─────────────────────────────┐   │    │                            │  │
│  │    │   💬 Live Chat Overlay      │   │    │ [Type message...    ] [🎁] │  │
│  │    │   (appears on stream)       │   │    └─────────────────────────────┘  │
│  │    └─────────────────────────────┘   │                                       │
│  │                                      │    ┌─────────────────────────────┐  │
│  │    👀 12 viewers   ❤️ 45 likes       │    │    💰 DONATIONS             │  │
│  │                                      │    │    Balance: 250 coins       │  │
│  └──────────────────────────────────────┘    │                            │  │
│                                               │    🍃  🌸  🍎  🌳          │  │
│  ┌──────────────────────────────────────┐    │    Leaf Flower Fruit Tree  │  │
│  │   REC ● Recording to disk...         │    │                            │  │
│  │   (MediaRecorder saving locally)     │    │    10   50  100  500       │  │
│  └──────────────────────────────────────┘    │    coins each              │  │
│                                               └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3. Live Stream Page (Viewer View) (`/live/[roomId]`)

**UI Layout:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ LIVE ● Raymond's Stream                       ❤️ Like | 🔗 Share | ⭐ Follow  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │                         LIVE VIDEO                                   │  │
│  │                    (WebRTC remote stream)                              │  │
│  │                                                                      │  │
│  │    🌳 Tree from @user123!          🍎 Fruit from @fan456!            │  │
│  │    (Gift animations float up)                                        │  │
│  │                                                                      │  │
│  │    ┌──────────────────────────────────────────────────────────┐     │  │
│  │    │  👀 12 viewers watching   ● LIVE   00:45:23 elapsed       │     │  │
│  │    └──────────────────────────────────────────────────────────┘     │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────┐   ┌──────────────────────────┐   │
│  │        STREAM INFO                      │   │      LIVE CHAT           │   │
│  │                                       │   ├──────────────────────────┤   │
│  │  Title: Gaming Stream                 │   │ @user1: first!           │   │
│  │  Category: Gaming                     │   │ @user2: hi raymond       │   │
│  │                                       │   │ @user3: 🌳 sent a Tree!  │   │
│  │  [📺 Subscribe to channel]            │   │                          │   │
│  │                                       │   │ [Type message... ] [Send]│   │
│  └───────────────────────────────────────┘   └──────────────────────────┘   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    🎁 SEND GIFT TO CREATOR 🎁                       │    │
│  │                                                                     │    │
│  │     🍃 Leaf (10)    🌸 Flower (50)    🍎 Fruit (100)    🌳 Tree (500)│    │
│  │                                                                     │    │
│  │  Your coins: 1,250    [💰 Buy More Coins]                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4. Streaming Soon / Browse Lives (`/live`)

**UI Layout:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🔴 LIVE NOW                        ⏰ UPCOMING         [🔴 Go Live]        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐   │
│ │ 🔴 LIVE             │  │ 🔴 LIVE             │  │ ⏰ IN 15 MIN        │   │
│ │ ┌───────────────┐   │  │ ┌───────────────┐   │  │ ┌───────────────┐   │   │
│ │ │   Thumbnail   │   │  │ │   Thumbnail   │   │  │ │   Thumbnail   │   │   │
│ │ │   with LIVE   │   │  │ │   with LIVE   │   │  │ │   Scheduled   │   │   │
│ │ │   badge       │   │  │ │   badge       │   │  │ │   overlay     │   │   │
│ │ └───────────────┘   │  │ └───────────────┘   │  │ └───────────────┘   │   │
│ │                     │  │                     │  │                     │   │
│ │ Gaming Stream       │  │ Music Stream        │  │ Cooking Show        │   │
│ │ 👤 Raymond          │  │ 👤 Alice            │  │ 👤 Chef Mike        │   │
│ │ 👀 12 viewers       │  │ 👀 45 viewers       │  │ [🔔 Notify Me]      │   │
│ └─────────────────────┘  └─────────────────────┘  └─────────────────────┘   │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────┐     │
│ │ 💰 MY LIVE STATS                                                      │     │
│ │                                                                       │     │
│ │ Total Streams: 5    Peak Viewers: 89    Total Earnings: 2,450 KSH     │     │
│ │                                                                       │     │
│ │ [View Detailed Analytics]    [Withdraw Earnings]                      │     │
│ └──────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

```typescript
// WebRTC Signaling
POST /api/live/signal
{
  action: 'join' | 'offer' | 'answer' | 'ice-candidate',
  roomId: string,
  targetUserId?: string,  // for direct messages
  data?: RTCSessionDescription | RTCIceCandidate
}

// Stream Recording
POST /api/live/record
{
  streamId: string,
  recordingBlob: Blob  // FormData
}
→ Returns: { videoUrl: string }

// Send Gift
POST /api/live/gift
{
  streamId: string,
  giftType: 'leaf' | 'flower' | 'fruit' | 'tree'
}
→ Returns: { success: boolean, newBalance: number }

// Withdraw
POST /api/live/withdraw
{
  method: 'mpesa' | 'bank',
  amountKsh: number,
  mpesaNumber?: string,
  bankDetails?: { account: string, bank: string }
}
→ Returns: { success: boolean, fee: 100, netAmount: number }
```

## Realtime Subscriptions

```typescript
// Subscribe to chat for a stream
supabase
  .channel(`live-chat:${streamId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'live_chat', filter: `stream_id=eq.${streamId}` },
    (payload) => { addMessageToChat(payload.new); }
  )
  .subscribe();

// Subscribe to donations (for gift animations)
supabase
  .channel(`live-donations:${streamId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'donations', filter: `stream_id=eq.${streamId}` },
    (payload) => { showGiftAnimation(payload.new); }
  )
  .subscribe();

// Subscribe to viewer count
supabase
  .channel(`live-viewers:${streamId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'stream_viewers', filter: `stream_id=eq.${streamId}` },
    () => { updateViewerCount(); }
  )
  .subscribe();
```

## WebRTC Implementation Code

```typescript
// hooks/useWebRTC.ts - Simplified version

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isConnected: boolean;
  startStream: () => Promise<void>;
  stopStream: () => void;
  joinRoom: (roomId: string) => Promise<void>;
}

export function useWebRTC(isCreator: boolean): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // STUN servers (free Google servers)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Creator starts stream
  const startStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true
    });
    setLocalStream(stream);
    
    // Create peer connection
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;
    
    // Add tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', event.candidate);
      }
    };
    
    setIsConnected(true);
  };

  // Viewer joins room
  const joinRoom = async (roomId: string) => {
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;
    
    // Handle incoming stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set('creator', remoteStream)));
    };
    
    // Connect WebSocket for signaling
    const ws = new WebSocket(`wss://your-signal-server.com/${roomId}`);
    wsRef.current = ws;
    
    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'offer':
          await pc.setRemoteDescription(new RTCSessionDescription(message.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('answer', answer);
          break;
          
        case 'ice-candidate':
          await pc.addIceCandidate(new RTCIceCandidate(message.data));
          break;
      }
    };
    
    setIsConnected(true);
  };

  const stopStream = () => {
    localStream?.getTracks().forEach(track => track.stop());
    pcRef.current?.close();
    wsRef.current?.close();
    setIsConnected(false);
  };

  return { localStream, remoteStreams, isConnected, startStream, stopStream, joinRoom };
}
```

## MediaRecorder for Saving Streams

```typescript
// lib/live/recording.ts

export class StreamRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private streamId: string;

  constructor(streamId: string) {
    this.streamId = streamId;
  }

  startRecording(stream: MediaStream) {
    this.recordedChunks = [];
    
    // Use webm format for best browser compatibility
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.start(1000); // Collect 1-second chunks
  }

  async stopRecordingAndUpload(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        
        // Upload to Supabase Storage
        const fileName = `live-recordings/${this.streamId}-${Date.now()}.webm`;
        const { data, error } = await supabase.storage
          .from('videos')
          .upload(fileName, blob);
          
        if (error) {
          console.error('Upload failed:', error);
          resolve(null);
          return;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
          
        resolve(publicUrl);
      };
      
      this.mediaRecorder.stop();
    });
  }
}
```

## Gift Animation Component

```typescript
// components/live/GiftAnimation.tsx

interface GiftAnimationProps {
  giftType: 'leaf' | 'flower' | 'fruit' | 'tree';
  senderName: string;
}

export function GiftAnimation({ giftType, senderName }: GiftAnimationProps) {
  const giftEmojis = {
    leaf: '🍃',
    flower: '🌸',
    fruit: '🍎',
    tree: '🌳'
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.5 }}
      animate={{ 
        y: -100, 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8]
      }}
      transition={{ duration: 3, ease: "easeOut" }}
      className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none"
    >
      <div className="flex flex-col items-center">
        <span className="text-6xl">{giftEmojis[giftType]}</span>
        <span className="text-white text-sm font-bold mt-2 bg-black/50 px-3 py-1 rounded-full">
          {senderName} sent a {giftType}!
        </span>
      </div>
    </motion.div>
  );
}
```

## Cost Breakdown (Monthly, Early Stage)

```
┌────────────────────────────────────────────────────────────┐
│                   ESTIMATED COSTS                         │
├─────────────────────────────┬──────────────────────────────┤
│  Service                    │  Estimated Cost              │
├─────────────────────────────┼──────────────────────────────┤
│  Vercel (Hobby)             │  FREE                        │
│  Supabase (Free Tier)       │  FREE (500MB, 2GB egress)   │
│  WebRTC STUN servers        │  FREE (Google public)        │
│  Storage (recordings)         │  ~$5-10 (if many streams)    │
├─────────────────────────────┼──────────────────────────────┤
│  TOTAL MONTHLY              │  $0-10                       │
└─────────────────────────────┴──────────────────────────────┘
```

## Implementation Order

### Week 1: Foundation
1. Create database schema
2. Set up `/live` routes
3. Build "Go Live" page UI
4. Implement basic WebRTC getUserMedia

### Week 2: Streaming Core
1. Implement WebRTC peer connections
2. Build creator stream page
3. Build viewer stream page
4. Add basic signaling (WebSocket)

### Week 3: Engagement
1. Build live chat with Supabase Realtime
2. Add likes counter
3. Create gift/donation system
4. Build gift animations

### Week 4: Persistence & Money
1. Implement MediaRecorder for saving streams
2. Create "Streaming Soon" scheduler
3. Build creator dashboard with stats
4. Implement withdrawal flow

## Next Steps

Ready to build? I recommend starting with:

1. **Database schema first** - Run the SQL in Supabase
2. **Go Live page** - Simplest to start, just needs camera access
3. **WebRTC hook** - Core streaming functionality
4. **Live chat** - Easiest realtime feature to implement

Want me to start implementing Phase 1 (Week 1)?
