'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
    Comment,
    getVideoComments,
    addComment,
    engageComment,
    deleteComment,
    getCommentCount,
} from '@/app/actions/comments';

interface CommentsProps {
    videoId: string;
    profileId?: string | null;
    profileName?: string;
    profileAvatar?: string;
}

export default function Comments({ videoId, profileId, profileName, profileAvatar }: CommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentCount, setCommentCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        loadComments();
    }, [videoId, profileId]);

    const loadComments = async () => {
        try {
            setIsLoading(true);
            const [commentsData, count] = await Promise.all([
                getVideoComments(videoId, profileId || undefined),
                getCommentCount(videoId),
            ]);
            setComments(commentsData);
            setCommentCount(count);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!profileId || !newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await addComment(videoId, profileId, newComment);
            setNewComment('');
            await loadComments();
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!profileId || !replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            await addComment(videoId, profileId, replyContent, parentId);
            setReplyContent('');
            setReplyingTo(null);
            await loadComments();
            setExpandedReplies(prev => new Set(Array.from(prev).concat([parentId])));
        } catch (error) {
            console.error('Failed to add reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (commentId: string, currentlyLiked: boolean) => {
        if (!profileId) return;
        try {
            await engageComment(commentId, profileId, currentlyLiked ? null : 'like');
            await loadComments();
        } catch (error) {
            console.error('Failed to like comment:', error);
        }
    };

    const handleDislike = async (commentId: string, currentlyDisliked: boolean) => {
        if (!profileId) return;
        try {
            await engageComment(commentId, profileId, currentlyDisliked ? null : 'dislike');
            await loadComments();
        } catch (error) {
            console.error('Failed to dislike comment:', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!profileId) return;
        try {
            await deleteComment(commentId, profileId);
            await loadComments();
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
    };

    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === 'top') {
            return b.likes - a.likes;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
        const isOwner = profileId === comment.profile_id;

        return (
            <div className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : ''}`}>
                <Link href={`/channel/${comment.profile_id}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                        {comment.profile_avatar ? (
                            <img src={comment.profile_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">
                                {comment.profile_name?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/channel/${comment.profile_id}`} className="text-[13px] font-bold text-white hover:text-blue-400 transition-colors">
                            @{comment.profile_name?.replace(/\s+/g, '').toLowerCase()}
                        </Link>
                        <span className="text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    <p className="text-[14px] text-zinc-200 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                        {comment.content}
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => handleLike(comment.id, comment.user_liked || false)}
                            disabled={!profileId}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${comment.user_liked ? 'text-blue-400' : 'text-zinc-400 hover:text-white'} disabled:opacity-50`}
                        >
                            <svg className="w-4 h-4" fill={comment.user_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            {comment.likes > 0 && <span>{comment.likes}</span>}
                        </button>

                        <button
                            onClick={() => handleDislike(comment.id, comment.user_disliked || false)}
                            disabled={!profileId}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${comment.user_disliked ? 'text-blue-400' : 'text-zinc-400 hover:text-white'} disabled:opacity-50`}
                        >
                            <svg className="w-4 h-4 rotate-180" fill={comment.user_disliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                        </button>

                        {!isReply && profileId && (
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                            >
                                Reply
                            </button>
                        )}

                        {isOwner && (
                            <button
                                onClick={() => handleDelete(comment.id)}
                                className="text-xs text-zinc-500 hover:text-red-400 transition-colors ml-auto"
                            >
                                Delete
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                        <div className="flex gap-3 mt-4">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                {profileAvatar ? (
                                    <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                        {profileName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Add a reply..."
                                    rows={1}
                                    className="w-full bg-transparent text-white text-sm border-b border-zinc-700 focus:border-blue-500 outline-none resize-none py-1 transition-colors"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            setReplyingTo(null);
                                            setReplyContent('');
                                        }}
                                        className="px-3 py-1.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors rounded-full"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSubmitReply(comment.id)}
                                        disabled={!replyContent.trim() || isSubmitting}
                                        className="px-4 py-1.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {!isReply && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3">
                            <button
                                onClick={() => toggleReplies(comment.id)}
                                className="flex items-center gap-2 text-blue-400 text-sm font-bold hover:bg-blue-400/10 px-3 py-1.5 rounded-full transition-colors -ml-3"
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform ${expandedReplies.has(comment.id) ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </button>

                            {expandedReplies.has(comment.id) && (
                                <div className="space-y-4 mt-2">
                                    {comment.replies.map((reply) => (
                                        <CommentItem key={reply.id} comment={reply} isReply />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-8">
            {/* Header */}
            <div className="flex items-center gap-6 mb-6">
                <h2 className="text-xl font-bold text-white">
                    {commentCount.toLocaleString()} Comments
                </h2>

                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        Sort by
                    </button>

                    {showSortMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                            <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setSortBy('top');
                                        setShowSortMenu(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors ${sortBy === 'top' ? 'text-white bg-white/10' : 'text-zinc-300'}`}
                                >
                                    Top comments
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy('newest');
                                        setShowSortMenu(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors ${sortBy === 'newest' ? 'text-white bg-white/10' : 'text-zinc-300'}`}
                                >
                                    Newest first
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add Comment Input */}
            {profileId ? (
                <div className="flex gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                        {profileAvatar ? (
                            <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">
                                {profileName?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <textarea
                            ref={inputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows={1}
                            onFocus={() => {
                                if (inputRef.current) inputRef.current.rows = 3;
                            }}
                            className="w-full bg-transparent text-white border-b border-zinc-700 focus:border-blue-500 outline-none resize-none py-2 transition-colors"
                        />
                        {newComment.trim() && (
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => setNewComment('')}
                                    className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors rounded-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? 'Posting...' : 'Comment'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4 mb-8 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                            Sign in
                        </Link>
                        <span className="text-zinc-400"> to add a comment</span>
                    </div>
                </div>
            )}

            {/* Comments List */}
            {isLoading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-zinc-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-zinc-800 rounded" />
                                <div className="h-4 w-full bg-zinc-800 rounded" />
                                <div className="h-4 w-2/3 bg-zinc-800 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : sortedComments.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No comments yet</h3>
                    <p className="text-sm text-zinc-500">Be the first to share what you think!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedComments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </div>
    );
}
