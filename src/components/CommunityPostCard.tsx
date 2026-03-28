'use client';

import { useState, useEffect } from 'react';
import FounderBadge from '@/components/FounderBadge';
import { formatDistanceToNow } from 'date-fns';

interface PostProps {
  post: {
    id: string;
    channel_id: string;
    channel_name: string;
    channel_avatar?: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    created_at: string;
    likes?: number;
    comments?: number;
    join_order?: number;
  };
  onVote?: (postId: string, optionIndex: number) => void;
  onQuizAnswer?: (postId: string, answerIndex: number) => void;
}

export default function CommunityPostCard({ post, onVote, onQuizAnswer }: PostProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [localVotes, setLocalVotes] = useState<number[] | null>(null);
  
  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCheckingQuizVote, setIsCheckingQuizVote] = useState(false);

  // Parse post data from description
  const postDataRaw = parsePostData(post.description);
  const postType = postDataRaw._post_type || postDataRaw.type || (postDataRaw.options ? (postDataRaw.correct_index !== undefined ? 'quiz' : 'poll') : 'text');
  
  const postData = {
    ...postDataRaw,
    type: postType
  };
  
  const isMobile = useIsMobile();
  const isTextPost = postData.type === 'text';
  const isImagePost = postData.type === 'image';

  // Load comments and quiz votes
  useEffect(() => {
    if (showComments && (isTextPost || isImagePost)) {
      loadComments();
    }
  }, [showComments, isTextPost, isImagePost]);

  // Check if user already voted on quiz
  useEffect(() => {
    if (postData.type === 'quiz' && post.id) {
      setIsCheckingQuizVote(true);
      checkQuizVote().finally(() => setIsCheckingQuizVote(false));
    }
  }, [postData.type, post.id]);

  const checkQuizVote = async () => {
    try {
      const res = await fetch(`/api/posts/engagement?postId=${post.id}`);
      const data = await res.json();
      // Check if user voted on any option
      if (data.userVotedIndex !== undefined && data.userVotedIndex !== null) {
        setQuizAnswer(data.userVotedIndex);
        setShowQuizResult(true);
      }
    } catch (e) { /* ignore */ }
  };

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/posts/engagement?postId=${post.id}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
        setCommentsCount(data.comments.length);
      }
    } catch (e) { console.log('Load comments error', e); }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    
    const tempComment = {
      id: 'temp_' + Date.now(),
      content: commentText,
      profile_name: 'You',
      created_at: new Date().toISOString()
    };
    setComments(prev => [tempComment, ...prev]);
    setCommentText('');
    
    try {
      await fetch('/api/posts/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action: 'comment', content: commentText })
      });
      await loadComments();
    } catch (e) {
      console.log('Post comment error', e);
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
    }
    setPostingComment(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleVote = (index: number) => {
    if (votedOption !== null) return;
    setVotedOption(index);
    onVote?.(post.id, index);
    // Haptic feedback on mobile
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50);
    }
  };

  const handleQuizAnswer = async (index: number) => {
    if (quizAnswer !== null || isCheckingQuizVote || !postData || !post.channel_id) return;
    
    // Optimistic UI
    setQuizAnswer(index);
    setShowQuizResult(true);

    try {
      // Find current user profile
      const activeProf = await (await import('@/app/actions/profile')).getActiveProfile();
      if (!activeProf) {
        alert('Please select a profile to vote');
        return;
      }

      const isCorrect = postData.correct_index === index;

      const res = await fetch('/api/posts/quiz/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          quizId: post.id,
          optionIndex: index,
          profileId: activeProf.id,
          isCorrect: isCorrect
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Server error response:', errText);
        throw new Error(`Failed to record vote: ${errText}`);
      }

      const result = await res.json();
      // Synchronize with server truth
      if (result.votes) {
        setLocalVotes(result.votes);
      }
      console.log('Quiz Recorded:', result.log);

    } catch (error: any) {
      // Silently handle "Already voted" - don't show error to user
      if (!error.message?.includes('Already voted')) {
        console.error('Quiz vote failed:', error);
      }
    }

    // Haptic feedback
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(100);
    }
  };

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (postData.type === 'poll' && votedOption === null) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= postData.options?.length) {
          handleVote(num - 1);
        }
      }
      if (postData.type === 'quiz' && quizAnswer === null) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= postData.options?.length) {
          handleQuizAnswer(num - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [postData, votedOption, quizAnswer]);

  return (
    <article className="community-post">
      {/* Header - Avatar + Name + Time */}
      <div className="post-header">
        <img 
          src={post.channel_avatar || '/default-avatar.png'} 
          alt={post.channel_name}
          className="post-avatar"
        />
        <div className="post-meta">
          <div className="post-author-row">
            <span className="post-author-name">{post.channel_name}</span>
            <FounderBadge joinOrder={post.join_order} size="sm" />
          </div>
          <span className="post-time">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Content based on type */}
      <div className="post-content">
        {/* Text Content */}
        {postData.text && (
          <div className="post-text">
            {expanded ? postData.text : truncateText(postData.text, 280)}
            {postData.text.length > 280 && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="read-more-btn"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Poll */}
        {postData.type === 'poll' && postData.options && (
          <div className="post-poll">
            <h4 className="poll-question">{postData.question || 'Poll'}</h4>
            <div className="poll-options-stack">
              {(() => {
                // Calculate votes once before mapping
                const baseVotes = postData.votes || new Array(postData.options.length).fill(0);
                const currentVotes = localVotes || baseVotes;
                const displayVotes = [...currentVotes];
                if (votedOption !== null && !localVotes) {
                  displayVotes[votedOption] = (displayVotes[votedOption] || 0) + 1;
                }
                const totalVotes = displayVotes.reduce((a: number, b: number) => a + (b || 0), 0);
                const maxVotes = Math.max(...displayVotes, 1); // At least 1 to avoid division by zero
                
                return postData.options.map((option: any, index: number) => {
                  const votes = displayVotes[index] || 0;
                  // Scale bar based on max votes (so highest gets ~100%, others proportional)
                  const barWidth = maxVotes > 0 ? Math.max(15, (votes / maxVotes) * 100) : 0;
                  const isSelected = votedOption === index;
                  const hasVoted = votedOption !== null;

                  return (
                    <button
                      key={index}
                      onClick={() => handleVote(index)}
                      disabled={hasVoted}
                      className={`poll-option-new ${isSelected ? 'selected' : ''} ${hasVoted ? 'voted' : ''}`}
                    >
                      {/* Animated vote bar */}
                      {hasVoted && (
                        <div 
                          className="poll-vote-bar" 
                          style={{ width: `${barWidth}%` }}
                        />
                      )}
                      
                      <div className="poll-option-content">
                        {option.image_url && (
                          <img src={option.image_url} className="poll-option-img" alt="" />
                        )}
                        <span className="poll-option-text">{typeof option === 'string' ? option : option.text}</span>
                        {hasVoted && (
                          <span className="poll-votes-label">{votes} chose this</span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
            {votedOption !== null && (
              <p className="poll-total-votes">
                {(() => {
                  const baseVotes = postData.votes || new Array(postData.options.length).fill(0);
                  const currentVotes = localVotes || baseVotes;
                  const displayVotes = [...currentVotes];
                  if (votedOption !== null && !localVotes) {
                    displayVotes[votedOption] = (displayVotes[votedOption] || 0) + 1;
                  }
                  return displayVotes.reduce((a: number, b: number) => a + (b || 0), 0).toLocaleString();
                })()} total votes
              </p>
            )}
          </div>
        )}

        {/* Quiz - Redesigned as short rectangular curved card */}
        {postData.type === 'quiz' && postData.options && (
          <div className="post-quiz-container">
            <div className="quiz-card">
              <h4 className="quiz-question">{postData.question}</h4>
              <div className="quiz-options-grid">
                {postData.options.map((option: string, index: number) => {
                  const currentVotes = localVotes || postData.votes || [];
                  // Adjust for optimistic selection if not already in localVotes
                  let displayVotes = [...currentVotes];
                  if (!localVotes && quizAnswer === index && displayVotes[index] !== undefined) {
                    displayVotes[index]++;
                  }

                  const totalVotes = displayVotes.reduce((a: number, b: number) => a + b, 0);
                  const optionVotes = displayVotes[index] || 0;
                  const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                  
                  return (
                    <QuizOption
                      key={index}
                      option={option}
                      index={index}
                      isCorrect={postData.correct_index === index}
                      isSelected={quizAnswer === index}
                      showResult={showQuizResult}
                      votes={optionVotes}
                      totalVotes={totalVotes}
                      onClick={() => handleQuizAnswer(index)}
                      disabled={isCheckingQuizVote || quizAnswer !== null}
                    />
                  );
                })}
              </div>
              
              {/* Footer Removed - Clean Look */}
            </div>
          </div>
        )}

        {/* Images - For image posts show as carousel */}
        {isImagePost && postData.images && postData.images.length > 0 && (
          <div className="image-post-carousel group">
            <div className="carousel-container">
              {/* Left arrow - appears on hover for laptop */}
              {postData.images.length > 1 && (
                <button 
                  className="carousel-arrow carousel-arrow-left opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const newIdx = Math.max(0, carouselIndex - 1);
                    setCarouselIndex(newIdx);
                    const el = document.getElementById(`carousel-${post.id}`);
                    if (el) el.scrollTo({ left: newIdx * el.offsetWidth, behavior: 'smooth' });
                  }}
                >
                  ‹
                </button>
              )}
              
              <div 
                id={`carousel-${post.id}`}
                className="carousel-images snap-x snap-mandatory"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.offsetWidth);
                  setCarouselIndex(idx);
                }}
              >
                {postData.images.map((img: string, idx: number) => (
                  <div key={idx} className="carousel-slide snap-center">
                    <img src={img} alt="" className="carousel-image" />
                  </div>
                ))}
              </div>
              
              {/* Right arrow - appears on hover for laptop */}
              {postData.images.length > 1 && (
                <button 
                  className="carousel-arrow carousel-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const newIdx = Math.min(postData.images.length - 1, carouselIndex + 1);
                    setCarouselIndex(newIdx);
                    const el = document.getElementById(`carousel-${post.id}`);
                    if (el) el.scrollTo({ left: newIdx * el.offsetWidth, behavior: 'smooth' });
                  }}
                >
                  ›
                </button>
              )}
            </div>
            
            {postData.images.length > 1 && (
              <div className="carousel-dots">
                {postData.images.map((_: any, idx: number) => (
                  <span 
                    key={idx} 
                    className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Images - For other posts use gallery */}
        {!isImagePost && postData.images && postData.images.length > 0 && (
          <ImageGallery 
            images={postData.images} 
            currentIndex={currentImageIndex}
            onChangeIndex={setCurrentImageIndex}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Engagement Bar */}
      <div className="post-engagement">
        {(isTextPost || isImagePost) && (
          <button className="engage-btn" onClick={() => setShowComments(!showComments)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{commentsCount > 0 ? commentsCount : 'Comment'}</span>
          </button>
        )}
        <button className="engage-btn" onClick={handleShare}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Comments Dropdown for Text and Image Posts */}
      {(isTextPost || isImagePost) && showComments && (
        <div className="post-comments-dropdown">
          <div className="comments-input-row">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="comment-input"
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            />
            <button 
              onClick={handlePostComment} 
              disabled={!commentText.trim() || postingComment}
              className="comment-submit"
            >
              {postingComment ? '...' : 'Post'}
            </button>
          </div>
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="comment-item">
                  <span className="comment-author">{comment.profile_name || 'User'}</span>
                  <span className="comment-content">{comment.content}</span>
                  <span className="comment-time">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .community-post {
          background: var(--bg-card, #0f0f0f);
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        /* Mobile: Full width, Desktop: Centered */
        @media (min-width: 768px) {
          .community-post {
            max-width: 680px;
            margin-left: auto;
            margin-right: auto;
          }
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
        }

        .post-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .post-meta {
          display: flex;
          flex-direction: column;
        }

        .post-author-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .post-author-name {
          font-weight: 600;
          color: white;
          font-size: 14px;
        }

        .post-time {
          font-size: 12px;
          color: var(--text-muted, #aaa);
        }

        .post-content {
          padding: 0 16px 12px;
        }

        .post-text {
          color: white;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          margin-bottom: 12px;
        }

        .read-more-btn {
          color: var(--primary, #3b82f6);
          font-weight: 500;
          margin-left: 4px;
          background: none;
          border: none;
          cursor: pointer;
        }

        /* YouTube-Style Polls */
        .poll-options.text-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .poll-options.image-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .poll-option-yt {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          text-align: left;
          padding: 0;
        }

        .poll-option-yt.text-type {
          height: 48px;
        }

        .poll-option-yt.image-type {
          aspect-ratio: 1/1.1;
          display: flex;
          flex-direction: column;
        }

        .poll-option-yt:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }

        .poll-option-yt.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .poll-img-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #1a1a1a;
        }

        .poll-img-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .poll-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6));
        }

        .poll-bar-bg-yt {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .poll-bar-fill-yt {
          height: 100%;
          background: rgba(255,255,255,0.08);
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .poll-option-yt.selected .poll-bar-fill-yt {
          background: rgba(59, 130, 246, 0.2);
        }

        .poll-option-content-yt {
          position: relative;
          z-index: 1;
          padding: 0 16px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .image-type .poll-option-content-yt {
           height: 42px;
           padding: 0 10px;
           background: rgba(0,0,0,0.3);
           backdrop-filter: blur(4px);
        }

        .poll-option-text-yt {
          color: white;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .poll-percentage-yt {
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          font-weight: 700;
        }

        /* New Poll Styling - Quiz-like */
        .poll-options-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
        }

        .poll-option-new {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          width: 100%;
          min-height: 64px;
        }

        .poll-option-new:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }

        .poll-option-new.selected {
          background: rgba(255,255,255,0.12);
        }

        .poll-option-new:disabled {
          cursor: default;
        }

        .poll-vote-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: rgba(255,255,255,0.12);
          border-radius: 16px;
          z-index: 0;
          transition: width 1s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .poll-option-new.selected .poll-vote-bar {
          background: rgba(255,255,255,0.25);
        }

        .poll-option-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .poll-option-img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
          order: -1;
        }

        .poll-option-text {
          color: white;
          font-size: 15px;
          font-weight: 500;
          flex: 1;
        }

        .poll-votes-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          flex-shrink: 0;
        }

        .poll-option-new.selected .poll-votes-label {
          color: #3b82f6;
        }

        /* Quiz Redesign - Premium Look */
        .post-quiz-container {
          margin: 16px 0;
          perspective: 1000px;
        }

        .quiz-card {
           background: linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
           backdrop-filter: blur(12px);
           -webkit-backdrop-filter: blur(12px);
           border: 1px solid rgba(255,255,255,0.08);
           border-radius: 24px;
           padding: 24px;
           box-shadow: 0 20px 40px rgba(0,0,0,0.3);
           transition: transform 0.3s ease;
        }

        .quiz-question {
          color: white;
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 24px;
          line-height: 1.35;
          text-align: center;
          letter-spacing: -0.02em;
        }

        .quiz-options-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quiz-footer-stats {
          margin-top: 20px;
          text-align: center;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .stats-label {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .quiz-result {
          margin-top: 12px;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .quiz-result.correct {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .quiz-result.incorrect {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Engagement Bar */
        .post-engagement {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-top: 1px solid var(--border, rgba(255,255,255,0.1));
        }

        .engage-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          color: var(--text-muted, #aaa);
          font-size: 13px;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .engage-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .like-btn:hover {
          color: #ef4444;
        }

        .like-btn.liked {
          color: #ef4444;
        }

        /* Comments Popup */
        .comments-popup {
          border-top: 1px solid var(--border, rgba(255,255,255,0.1));
          max-height: 300px;
          display: flex;
          flex-direction: column;
        }

        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
        }

        .comments-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted, #aaa);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .comments-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
        }

        .no-comments {
          color: var(--text-muted, #666);
          font-size: 13px;
          text-align: center;
          padding: 20px 0;
        }

        .comment-item {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .comment-content {
          flex: 1;
        }

        .comment-author {
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        .comment-content p {
          margin: 4px 0 0;
          font-size: 13px;
          color: var(--text, #ddd);
        }

        .delete-comment-btn {
          background: none;
          border: none;
          color: var(--text-muted, #666);
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          align-self: flex-start;
        }

        .delete-comment-btn:hover {
          color: #ef4444;
        }

        .comment-form {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--border, rgba(255,255,255,0.1));
        }

        .comment-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid var(--border, rgba(255,255,255,0.2));
          background: rgba(255,255,255,0.05);
          color: white;
          font-size: 13px;
        }

        .comment-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .comment-form button {
          padding: 8px 16px;
          border-radius: 20px;
          border: none;
          background: #3b82f6;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .comment-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Keyboard hint for desktop */
        @media (min-width: 768px) {
          .post-poll::after,
          .post-quiz::after {
            content: 'Tip: Press 1-4 to vote';
            display: block;
            font-size: 11px;
            color: var(--text-muted, #666);
            margin-top: 8px;
            text-align: center;
          }
        }

        /* Comments Dropdown */
        .post-comments-dropdown {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 12px;
          background: rgba(0,0,0,0.2);
        }

        .comments-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .comment-input {
          flex: 1;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 8px 14px;
          color: white;
          font-size: 13px;
        }

        .comment-input::placeholder {
          color: rgba(255,255,255,0.4);
        }

        .comment-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .comment-submit {
          padding: 8px 16px;
          border-radius: 20px;
          border: none;
          background: #3b82f6;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .comment-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .comments-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .no-comments {
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          text-align: center;
          padding: 16px 0;
        }

        .comment-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .comment-author {
          font-weight: 600;
          color: #3b82f6;
          font-size: 13px;
        }

        .comment-content {
          color: white;
          font-size: 14px;
          line-height: 1.4;
        }

        .comment-time {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
        }

        /* Image Post Carousel */
        .image-post-carousel {
          margin-top: 12px;
        }

        .carousel-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .carousel-images {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          gap: 0;
          border-radius: 12px;
          flex: 1;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior-x: contain;
        }

        .carousel-images::-webkit-scrollbar {
          display: none;
        }

        .carousel-slide {
          flex: 0 0 100%;
          min-width: 100%;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          aspect-ratio: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f0f0f;
        }

        .carousel-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          max-width: 100%;
          max-height: 100%;
        }

        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          color: white;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          cursor: pointer;
          border: none;
        }

        .carousel-arrow:hover {
          background: rgba(0,0,0,0.8);
        }

        .carousel-arrow-left {
          left: 8px;
        }

        .carousel-arrow-right {
          right: 8px;
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 8px;
        }

        .carousel-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transition: all 0.2s;
        }

        .carousel-dot.active {
          background: white;
          transform: scale(1.2);
        }

        .carousel-images {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 0;
          border-radius: 12px;
          flex: 1;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .carousel-images::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </article>
  );
}

// Sub-components
function PollOption({ option, index, totalVotes, votes, isSelected, hasVoted, onClick, isMobile }: any) {
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  
  return (
    <button
      onClick={onClick}
      disabled={hasVoted}
      className={`poll-option ${isSelected ? 'selected' : ''} ${hasVoted ? 'voted' : ''}`}
    >
      <div className="poll-bar-bg">
        {hasVoted && (
          <div 
            className="poll-bar-fill" 
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      <span className="poll-option-text">{option}</span>
      {hasVoted && (
        <span className="poll-percentage">{percentage}%</span>
      )}
      
      <style jsx>{`
        .poll-option {
          position: relative;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s;
        }

        .poll-option:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
          border-color: var(--primary, #3b82f6);
        }

        .poll-option.selected {
          border-color: var(--primary, #3b82f6);
          background: rgba(59, 130, 246, 0.1);
        }

        .poll-option:disabled {
          cursor: default;
        }

        .poll-bar-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .poll-bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          background: rgba(59, 130, 246, 0.2);
          transition: width 0.5s ease;
        }

        .poll-option-text {
          position: relative;
          color: white;
          font-weight: 500;
        }

        .poll-percentage {
          position: absolute;
          right: 16px;
          color: var(--text-muted, #aaa);
          font-size: 14px;
        }
      `}</style>
    </button>
  );
}

function QuizOption({ option, index, isCorrect, isSelected, showResult, votes, totalVotes, onClick, disabled }: any) {
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  
  const getClassName = () => {
    if (!showResult) return '';
    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    return 'dimmed';
  };

  return (
    <button
      onClick={onClick}
      disabled={showResult || disabled}
      className={`quiz-option ${getClassName()} ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
    >
        {showResult && (
          <div 
            className="quiz-percentage-bar" 
            style={{ width: `${percentage}%` }}
          />
        )}
      <div className="quiz-indicator">
        {showResult && isCorrect && <span className="indicator-icon">✓</span>}
        {showResult && isSelected && !isCorrect && <span className="indicator-icon">✗</span>}
        {!showResult && <span className="indicator-letter">{String.fromCharCode(65 + index)}</span>}
      </div>
      <div className="quiz-option-content">
        <span className="quiz-option-text">{option}</span>
        {showResult && (
          <span className="quiz-votes-label">{votes} chose this</span>
        )}
      </div>
      
      <style jsx>{`
        .quiz-option {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden;
          width: 100%;
        }

        .quiz-percentage-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: rgba(255,255,255,0.06);
          z-index: 0;
          transition: width 1.2s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .quiz-option:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          transform: translateX(4px);
        }

        .quiz-option.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.08);
        }

        .quiz-option.correct {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.08);
        }
        
        .quiz-option.correct .quiz-percentage-bar {
           background: rgba(34, 197, 94, 0.2);
        }

        .quiz-option.incorrect {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }
        
        .quiz-option.incorrect .quiz-percentage-bar {
           background: rgba(239, 68, 68, 0.2);
        }

        .quiz-option.dimmed {
          opacity: 0.5;
          filter: grayscale(0.5);
        }

        .quiz-indicator {
          position: relative;
          z-index: 1;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.08);
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 800;
          transition: all 0.3s ease;
        }

        .quiz-option.correct .quiz-indicator {
          background: #22c55e;
          color: white;
          transform: scale(1.1);
        }

        .quiz-option.incorrect .quiz-indicator {
          background: #ef4444;
          color: white;
          transform: scale(1.1);
        }

        .quiz-option-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .quiz-option-text {
          color: white;
          font-size: 15px;
          font-weight: 600;
        }

        .quiz-votes-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          transition: color 0.3s ease;
        }
        
        .quiz-option.correct .quiz-votes-label {
           color: rgba(34, 197, 94, 0.9);
        }

        .quiz-option.incorrect .quiz-votes-label {
           color: rgba(239, 68, 68, 0.9);
        }

        .indicator-icon {
          font-size: 16px;
          line-height: 1;
        }

        .indicator-letter {
          color: rgba(255,255,255,0.5);
        }
      `}</style>
    </button>
  );
}

function ImageGallery({ images, currentIndex, onChangeIndex, isMobile }: any) {
  const canSwipe = images.length > 1;
  
  const handleSwipe = (direction: 'left' | 'right') => {
    if (!canSwipe) return;
    if (direction === 'left' && currentIndex < images.length - 1) {
      onChangeIndex(currentIndex + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      onChangeIndex(currentIndex - 1);
    }
  };

  // Mobile: Swipeable carousel, Desktop: Grid
  if (isMobile) {
    return (
      <div className="image-carousel">
        <div 
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img: string, idx: number) => (
            <div key={idx} className="carousel-slide">
              <img src={img} alt={`Post image ${idx + 1}`} />
            </div>
          ))}
        </div>
        
        {canSwipe && (
          <>
            <button 
              className="carousel-btn prev"
              onClick={() => handleSwipe('right')}
              disabled={currentIndex === 0}
            >
              ‹
            </button>
            <button 
              className="carousel-btn next"
              onClick={() => handleSwipe('left')}
              disabled={currentIndex === images.length - 1}
            >
              ›
            </button>
            <div className="carousel-dots">
              {images.map((_: any, idx: number) => (
                <span 
                  key={idx} 
                  className={`dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => onChangeIndex(idx)}
                />
              ))}
            </div>
          </>
        )}
        
        <style jsx>{`
          .image-carousel {
            position: relative;
            overflow: hidden;
            border-radius: 8px;
            margin: 0 -16px;
            aspect-ratio: 16/10;
          }

          .carousel-track {
            display: flex;
            transition: transform 0.3s ease;
            height: 100%;
          }

          .carousel-slide {
            min-width: 100%;
            height: 100%;
          }

          .carousel-slide img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .carousel-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 24px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .carousel-btn:disabled {
            opacity: 0.3;
          }

          .carousel-btn.prev { left: 8px; }
          .carousel-btn.next { right: 8px; }

          .carousel-dots {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 6px;
          }

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            cursor: pointer;
          }

          .dot.active {
            background: white;
          }
        `}</style>
      </div>
    );
  }

  // Desktop: Grid layout
  const gridCols = images.length === 1 ? 1 : images.length === 2 ? 2 : images <= 4 ? 2 : 3;
  
  return (
    <div 
      className="image-grid"
      style={{ 
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gap: '4px',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '12px 0'
      }}
    >
      {images.slice(0, 5).map((img: string, idx: number) => (
        <div 
          key={idx} 
          className="grid-image"
          style={{ 
            position: 'relative',
            aspectRatio: idx === 0 && images.length === 1 ? '16/9' : '1/1',
            gridColumn: images.length === 1 ? 'span 2' : undefined
          }}
        >
          <img 
            src={img} 
            alt={`Post image ${idx + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer'
            }}
          />
          {idx === 4 && images.length > 5 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              +{images.length - 5}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Utilities
function parsePostData(description: string) {
  try {
    return JSON.parse(description || '{}');
  } catch {
    return { text: description, type: 'text' };
  }
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
