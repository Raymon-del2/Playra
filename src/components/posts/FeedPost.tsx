'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_avatar: string;
  post_type: 'text' | 'poll' | 'quiz' | 'image';
  content: any;
  created_at: string;
  visibility: string;
}

interface FeedPostProps {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

export default function FeedPost({ post, currentUserId, onDelete }: FeedPostProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = currentUserId === post.channel_id;

  const formatTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now.getTime() - postDate.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return postDate.toLocaleDateString();
  };

  const renderContent = () => {
    switch (post.post_type) {
      case 'text':
        return <TextBody text={post.content.text} />;
      case 'image':
        return <ImageGrid text={post.content.text} images={post.content.images} />;
      case 'poll':
        return <PollCard question={post.content.question} options={post.content.options} votes={post.content.votes} />;
      case 'quiz':
        return <QuizCard question={post.content.question} options={post.content.options} correctIndex={post.content.correct_index} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col border-b border-zinc-800 bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/channel/${post.channel_id}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
            {post.channel_avatar ? (
              <img src={post.channel_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-700" />
            )}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{post.channel_name}</div>
            <div className="text-zinc-500 text-xs">{formatTime(post.created_at)}</div>
          </div>
        </Link>

        {/* Three-dot menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-10">
              {isOwner && (
                <button
                  onClick={() => {
                    onDelete?.(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  Delete Post
                </button>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg transition-colors"
              >
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {renderContent()}
      </div>

      {/* Actions */}
      <PostActions postId={post.id} />
    </div>
  );
}

function TextBody({ text }: { text: string }) {
  return (
    <p className="text-zinc-100 text-base leading-relaxed whitespace-pre-wrap">{text}</p>
  );
}

function ImageGrid({ text, images }: { text?: string; images: string[] }) {
  const count = images.length;

  const getGridClass = () => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2';
    return 'grid-cols-2';
  };

  return (
    <div className="space-y-3">
      {text && <p className="text-zinc-100 text-base leading-relaxed">{text}</p>}
      <div className={`grid gap-1 rounded-xl overflow-hidden border border-zinc-800 ${getGridClass()}`}>
        {images.map((url, i) => (
          <div
            key={url}
            className={`relative bg-zinc-900 ${count === 3 && i === 0 ? 'row-span-2' : 'aspect-square'}`}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover hover:opacity-90 transition cursor-pointer"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PollCard({ question, options, votes }: { question: string; options: string[]; votes?: number[] }) {
  const [hasVoted, setHasVoted] = useState(false);
  const totalVotes = votes?.reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-zinc-100">{question}</h3>
      <div className="space-y-2">
        {options.map((option, i) => {
          const percentage = totalVotes === 0 ? 0 : Math.round(((votes?.[i] || 0) / totalVotes) * 100);
          
          return (
            <button
              key={i}
              onClick={() => !hasVoted && setHasVoted(true)}
              disabled={hasVoted}
              className="relative w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden group disabled:cursor-default"
            >
              {hasVoted && (
                <div
                  className="absolute inset-0 bg-zinc-800/50 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-zinc-300">{option}</span>
                {hasVoted && <span className="text-zinc-500 text-sm">{percentage}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-zinc-500 text-xs">{totalVotes} votes</p>
    </div>
  );
}

function QuizCard({ question, options, correctIndex }: { question: string; options: string[]; correctIndex: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-zinc-100">{question}</h3>
      <div className="space-y-2">
        {options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrect = i === correctIndex;
          const showCorrectness = showResult && (isCorrect || isSelected);
          
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                showCorrectness
                  ? isCorrect
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                  : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    showCorrectness
                      ? isCorrect
                        ? 'border-green-500 bg-green-500'
                        : 'border-red-500 bg-red-500'
                      : 'border-zinc-600'
                  }`}
                >
                  {showCorrectness && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-zinc-300">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
      {showResult && (
        <p className={`text-sm ${selected === correctIndex ? 'text-green-400' : 'text-red-400'}`}>
          {selected === correctIndex ? 'Correct! 🎉' : 'Try again next time!'}
        </p>
      )}
    </div>
  );
}

function PostActions({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  return (
    <div className="flex items-center gap-6 pt-2">
      <button
        onClick={() => {
          setLiked(!liked);
          setLikeCount(liked ? likeCount - 1 : likeCount + 1);
        }}
        className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-200'}`}
      >
        <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm">{likeCount}</span>
      </button>

      <button className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-sm">Comment</span>
      </button>

      <button className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span className="text-sm">Share</span>
      </button>
    </div>
  );
}
