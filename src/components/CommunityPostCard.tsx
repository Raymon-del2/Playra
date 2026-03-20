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
  
  // Engagement state
  const [likes, setLikes] = useState(post.likes || 0);
  const [userLiked, setUserLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Parse post data from description
  const postData = parsePostData(post.description);
  const isMobile = useIsMobile();

  // Load engagement data on mount
  useEffect(() => {
    const loadEngagement = async () => {
      try {
        const res = await fetch(`/api/posts/engagement?postId=${post.id}`);
        const data = await res.json();
        if (data.likes !== undefined) setLikes(data.likes);
        if (data.userLiked !== undefined) setUserLiked(data.userLiked);
        if (data.comments) setComments(data.comments);
      } catch (e) { console.log('Load engagement error', e); }
    };
    loadEngagement();
  }, [post.id]);

  const handleLike = async () => {
    // Optimistic update - immediately toggle UI
    const wasLiked = userLiked;
    setUserLiked(!wasLiked);
    setLikes(prev => !wasLiked ? prev + 1 : Math.max(0, prev - 1));
    
    // Silent DB save in background
    try {
      await fetch('/api/posts/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action: 'like' }),
      });
    } catch (e) { 
      // Revert on error
      setUserLiked(wasLiked);
      setLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.log('Like error', e); 
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await fetch('/api/posts/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action: 'comment', content: commentText }),
      });
      if (res.ok) {
        setCommentText('');
        // Reload comments
        const res = await fetch(`/api/posts/engagement?postId=${post.id}`);
        const data = await res.json();
        if (data.comments) setComments(data.comments);
      }
    } catch (e) { console.log('Comment error', e); }
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

  const handleQuizAnswer = (index: number) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(index);
    setShowQuizResult(true);
    onQuizAnswer?.(post.id, index);
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
            <h4 className="poll-question">{postData.question}</h4>
            <div className="poll-options">
              {postData.options.map((option: string, index: number) => (
                <PollOption
                  key={index}
                  option={option}
                  index={index}
                  totalVotes={postData.votes?.reduce((a: number, b: number) => a + b, 0) || 0}
                  votes={postData.votes?.[index] || 0}
                  isSelected={votedOption === index}
                  hasVoted={votedOption !== null}
                  onClick={() => handleVote(index)}
                  isMobile={isMobile}
                />
              ))}
            </div>
            {votedOption !== null && (
              <p className="poll-total-votes">
                {postData.votes?.reduce((a: number, b: number) => a + b, 0).toLocaleString()} votes
              </p>
            )}
          </div>
        )}

        {/* Quiz */}
        {postData.type === 'quiz' && postData.options && (
          <div className="post-quiz">
            <h4 className="quiz-question">{postData.question}</h4>
            <div className="quiz-options">
              {postData.options.map((option: string, index: number) => (
                <QuizOption
                  key={index}
                  option={option}
                  index={index}
                  isCorrect={postData.correct_index === index}
                  isSelected={quizAnswer === index}
                  showResult={showQuizResult}
                  onClick={() => handleQuizAnswer(index)}
                />
              ))}
            </div>
            {showQuizResult && (
              <div className={`quiz-result ${quizAnswer === postData.correct_index ? 'correct' : 'incorrect'}`}>
                {quizAnswer === postData.correct_index ? (
                  <><span className="result-icon">✓</span> Correct!</>
                ) : (
                  <><span className="result-icon">✗</span> Wrong! Answer was: {postData.options[postData.correct_index]}</>
                )}
              </div>
            )}
          </div>
        )}

        {/* Images */}
        {postData.images && postData.images.length > 0 && (
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
        <button className={`engage-btn like-btn ${userLiked ? 'liked' : ''}`} onClick={handleLike}>
          <svg className="w-5 h-5" fill={userLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>{likes || 'Like'}</span>
        </button>
        <button className="engage-btn" onClick={() => setShowComments(!showComments)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span>{comments.length || 'Comment'}</span>
        </button>
        <button className="engage-btn" onClick={handleShare}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Comments Popup */}
      {showComments && (
        <div className="comments-popup">
          <div className="comments-header">
            <h4>Comments ({comments.length})</h4>
            <button onClick={() => setShowComments(false)} className="close-btn">×</button>
          </div>
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first!</p>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="comment-item">
                  <img src={c.profile_avatar || '/default-avatar.png'} alt="" className="comment-avatar" />
                  <div className="comment-content">
                    <span className="comment-author">{c.profile_name}</span>
                    <p>{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
            />
            <button type="submit" disabled={!commentText.trim()}>Post</button>
          </form>
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

        /* Poll Styles */
        .post-poll {
          margin: 12px 0;
        }

        .poll-question {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .poll-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Quiz Styles */
        .post-quiz {
          margin: 12px 0;
        }

        .quiz-question {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
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

function QuizOption({ option, index, isCorrect, isSelected, showResult, onClick }: any) {
  const getClassName = () => {
    if (!showResult) return '';
    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    return 'dimmed';
  };

  return (
    <button
      onClick={onClick}
      disabled={showResult}
      className={`quiz-option ${getClassName()} ${isSelected ? 'selected' : ''}`}
    >
      <div className="quiz-indicator">
        {showResult && isCorrect && <span className="indicator-icon">✓</span>}
        {showResult && isSelected && !isCorrect && <span className="indicator-icon">✗</span>}
        {!showResult && <span className="indicator-letter">{String.fromCharCode(65 + index)}</span>}
      </div>
      <span className="quiz-option-text">{option}</span>
      
      <style jsx>{`
        .quiz-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quiz-option:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
        }

        .quiz-option.selected {
          border-color: var(--primary, #3b82f6);
        }

        .quiz-option.correct {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .quiz-option.incorrect {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .quiz-option.dimmed {
          opacity: 0.5;
        }

        .quiz-indicator {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        .quiz-option.correct .quiz-indicator {
          background: #22c55e;
          color: white;
        }

        .quiz-option.incorrect .quiz-indicator {
          background: #ef4444;
          color: white;
        }

        .indicator-icon {
          font-size: 16px;
          font-weight: bold;
        }

        .indicator-letter {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted, #aaa);
        }

        .quiz-option-text {
          color: white;
          font-weight: 500;
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
