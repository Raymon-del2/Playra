'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { LiveChatMessage } from '@/types/live';

interface LiveChatProps {
  streamId: string;
  activeProfile: any;
  isCreator: boolean;
}

export function LiveChat({ streamId, activeProfile, isCreator }: LiveChatProps) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase!
        .from('live_chat')
        .select('*, sender:profiles(id, name, avatar)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase!
      .channel(`live-chat:${streamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_chat',
        filter: `stream_id=eq.${streamId}`
      }, async (payload) => {
        // Fetch sender info for new message
        const { data: senderData } = await supabase!
          .from('profiles')
          .select('id, name, avatar')
          .eq('id', payload.new.sender_id)
          .single();

        const newMsg: LiveChatMessage = {
          id: payload.new.id,
          stream_id: payload.new.stream_id,
          sender_id: payload.new.sender_id,
          message: payload.new.message,
          message_type: payload.new.message_type,
          created_at: payload.new.created_at,
          sender: senderData || undefined
        };

        setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [streamId, supabase]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeProfile) return;

    const { error } = await supabase!
      .from('live_chat')
      .insert({
        stream_id: streamId,
        sender_id: activeProfile.id,
        message: newMessage.trim(),
        message_type: 'text'
      });

    if (!error) {
      setNewMessage('');
    }
  };

  // Generate consistent hex color from string
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-white/10">
        <h3 className="font-bold">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-zinc-500 py-8 text-sm">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 group">
              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span 
                    className="font-bold text-sm"
                    style={{ color: stringToColor(msg.sender?.name || 'Anonymous') }}
                  >
                    {msg.sender?.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-white break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={activeProfile ? "Send a message..." : "Sign in to chat"}
            disabled={!activeProfile}
            className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!activeProfile || !newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
