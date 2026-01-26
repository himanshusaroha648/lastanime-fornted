import { useState } from 'react';
import { Send, User, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThreadedComment from './ThreadedComment';

function StoredComments({ comments = [], onAddComment, type = 'episode', title, user, episodeId, movieSlug, seriesSlug }) {
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  const getBackendUrl = () => {
    const url = import.meta.env.VITE_API_BASE_URL || '/api';
    return url.endsWith('/api') ? url.slice(0, -4) : url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      alert('Please write a comment');
      return;
    }

    if (!user) {
      alert('Please login to post comments');
      return;
    }

    setIsLoading(true);
    try {
      await onAddComment(user.username || user.email || user.name || 'Anonymous', commentText);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const backendUrl = getBackendUrl();
      const username = user?.username || user?.email || 'Anonymous';
      
      const endpoint = type === 'episode'
        ? `${backendUrl}/api/series/${seriesSlug}/episode/${episodeId}/comments/${commentId}`
        : `${backendUrl}/api/movies/${movieSlug}/comments/${commentId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete comment:', error);
        return;
      }

      setLocalComments(localComments.filter(c => c.id !== commentId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplyAdded = (reply) => {
    setLocalComments(localComments.map(c => {
      if (c.id === reply.parentId) {
        return {
          ...c,
          replies: [...(c.replies || []), reply]
        };
      }
      return c;
    }));
  };

  const handleCommentDeleted = (commentId) => {
    setLocalComments(localComments.filter(c => c.id !== commentId));
  };

  const handleCommentEdited = (updatedComment) => {
    setLocalComments(localComments.map(c => c.id === updatedComment.id ? updatedComment : c));
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 relative z-10">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Comments & Discussion</h2>
        <p className="text-muted">Share your thoughts about {title || 'this content'}</p>
      </div>

      <div className="glass-surface rounded-2xl p-6 space-y-6">
        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmit} className="border-b border-white/10 pb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                <span className="text-white font-semibold">{user.username || user.email || user.name || 'Anonymous'}</span>
              </div>
              <textarea
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50 resize-none h-24"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {isLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="border-b border-white/10 pb-6 bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-primary" />
              <div className="flex-1">
                <p className="text-white font-semibold">Login to comment</p>
                <p className="text-muted text-sm">Sign in to share your thoughts and participate in discussions</p>
              </div>
              <Link
                to="/auth"
                className="px-4 py-2 bg-primary rounded-lg text-white font-semibold hover:bg-primary/90 transition whitespace-nowrap"
              >
                Login
              </Link>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {(!localComments || localComments.length === 0) ? (
            <p className="text-center text-muted py-8">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            localComments.map((comment) => (
              <ThreadedComment
                key={comment.id}
                comment={comment}
                user={user}
                type={type}
                seriesSlug={seriesSlug}
                episodeId={episodeId}
                movieSlug={movieSlug}
                onReplyAdded={handleReplyAdded}
                onCommentDeleted={() => handleCommentDeleted(comment.id)}
                onCommentEdited={handleCommentEdited}
              />
            ))
          )}
        </div>
      </div>

    </section>
  );
}

export default StoredComments;
