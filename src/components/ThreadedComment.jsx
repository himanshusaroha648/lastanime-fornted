import { useState, useRef, useEffect } from 'react';
import { Send, User, Trash2, Edit2, Check, X, MoreVertical, MessageCircle } from 'lucide-react';

function ThreadedComment({
  comment,
  user,
  type,
  seriesSlug,
  episodeId,
  movieSlug,
  onReplyAdded,
  onCommentDeleted,
  onCommentEdited,
  isReply = false,
  level = 0
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [openMenu, setOpenMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBackendUrl = () => {
    const url = import.meta.env.VITE_API_BASE_URL || '/api';
    return url.endsWith('/api') ? url.slice(0, -4) : url;
  };

  const isOwnComment = user && (user.username || user.email) === comment.username;

  const handleEdit = async () => {
    if (!editText.trim()) return;

    try {
      const backendUrl = getBackendUrl();
      const username = user?.username || user?.email || 'Anonymous';
      const endpoint = isReply
        ? type === 'episode'
          ? `${backendUrl}/api/series/${seriesSlug}/episode/${episodeId}/comments/${comment.parentId}/replies/${comment.id}`
          : `${backendUrl}/api/movies/${movieSlug}/comments/${comment.parentId}/replies/${comment.id}`
        : type === 'episode'
        ? `${backendUrl}/api/series/${seriesSlug}/episode/${episodeId}/comments/${comment.id}`
        : `${backendUrl}/api/movies/${movieSlug}/comments/${comment.id}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text: editText })
      });

      if (response.ok) {
        const data = await response.json();
        onCommentEdited(data.comment || data.reply);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error editing:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const backendUrl = getBackendUrl();
      const username = user?.username || user?.email || 'Anonymous';
      const endpoint = isReply
        ? type === 'episode'
          ? `${backendUrl}/api/series/${seriesSlug}/episode/${episodeId}/comments/${comment.parentId}/replies/${comment.id}`
          : `${backendUrl}/api/movies/${movieSlug}/comments/${comment.parentId}/replies/${comment.id}`
        : type === 'episode'
        ? `${backendUrl}/api/series/${seriesSlug}/episode/${episodeId}/comments/${comment.id}`
        : `${backendUrl}/api/movies/${movieSlug}/comments/${comment.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        onCommentDeleted();
        setDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim() || !user) return;

    try {
      const backendUrl = getBackendUrl();
      const username = user?.username || user?.email || 'Anonymous';
      const endpoint = type === 'episode'
        ? `${backendUrl}/api/series/${seriesSlug}/episode/${episodeId}/comments/${comment.id}/replies`
        : `${backendUrl}/api/movies/${movieSlug}/comments/${comment.id}/replies`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text: replyText })
      });

      if (response.ok) {
        const data = await response.json();
        onReplyAdded(data.reply);
        setReplyText('');
        setIsReplying(false);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  return (
    <div className={isReply && level > 0 ? 'ml-6 space-y-4' : 'space-y-4'}>
      <div className="rounded-lg bg-white/5 p-4 border border-white/5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-white break-words">{comment.username}</p>
              <div className="flex items-center gap-2 relative">
                <span className="text-xs text-muted flex-shrink-0">
                  {comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : 'Just now'}
                </span>
                {comment.edited && <span className="text-xs text-primary">(edited)</span>}

                {isOwnComment && (
                  <div ref={menuRef}>
                    <button
                      onClick={() => setOpenMenu(!openMenu)}
                      className="ml-2 p-1 rounded hover:bg-white/10 transition"
                      title="More options"
                    >
                      <MoreVertical size={16} className="text-muted hover:text-white" />
                    </button>

                    {openMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-card rounded-lg border border-white/10 shadow-lg z-50">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setOpenMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-t-lg flex items-center gap-2 transition"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm(true);
                            setOpenMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 rounded-b-lg flex items-center gap-2 transition"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50 resize-none h-20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.text);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted/90 text-sm break-words mb-3">{comment.text}</p>
                {user && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition"
                  >
                    <MessageCircle size={12} /> Reply
                  </button>
                )}
              </>
            )}

            {isReplying && user && (
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <textarea
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50 resize-none h-16 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddReply}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary/90"
                  >
                    <Send size={12} /> Reply
                  </button>
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyText('');
                    }}
                    className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6">
          {comment.replies.map((reply) => (
            <ThreadedComment
              key={reply.id}
              comment={{ ...reply, parentId: comment.id }}
              user={user}
              type={type}
              seriesSlug={seriesSlug}
              episodeId={episodeId}
              movieSlug={movieSlug}
              isReply={true}
              level={level + 1}
              onReplyAdded={(newReply) => {
                onReplyAdded({ ...newReply, parentId: comment.id });
              }}
              onCommentDeleted={onCommentDeleted}
              onCommentEdited={onCommentEdited}
            />
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-white/10 p-6 max-w-sm mx-4">
            <p className="text-white mb-6">Delete this {isReply ? 'reply' : 'comment'}?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThreadedComment;
