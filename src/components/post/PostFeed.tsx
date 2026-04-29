import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import * as postService from "../../services/postService";
import type { Post } from "../../types/post";
import { getErrorMessage } from "../../utils/errorHandler";
import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";

function PostSkeleton() {
  return (
    <div className="post-card" style={{ gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="skeleton skeleton-circle" style={{ width: 42, height: 42 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 10 }} />
        </div>
      </div>
      <div className="skeleton skeleton-line--medium" style={{ height: 160, borderRadius: 'var(--radius-md)' }} />
      <div className="skeleton skeleton-line skeleton-line--medium" />
    </div>
  );
}

export function PostFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPosts() {
    try {
      setError("");
      const response = await postService.listPosts();
      setPosts(response.posts || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load feed."));
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreated(post: Post) {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
  }

  async function handleDelete(post: Post) {
    const confirmed = window.confirm("Delete this post from RepoTalk?");
    if (!confirmed) {
      return;
    }

    const previousPosts = posts;
    setPosts((current) => current.filter((item) => item.id !== post.id));

    try {
      await postService.deletePost(post.id);
    } catch (deleteError) {
      setPosts(previousPosts);
      setError(getErrorMessage(deleteError, "Unable to delete post."));
    }
  }

  async function handleToggleLike(post: Post) {
    const liked = Boolean(post.liked_by_viewer);

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked_by_viewer: !liked,
              like_count: item.like_count + (liked ? -1 : 1),
            }
          : item,
      ),
    );

    try {
      if (liked) {
        await postService.unlikePost(post.id);
      } else {
        await postService.likePost(post.id);
      }
    } catch {
      setPosts((current) => current.map((item) => (item.id === post.id ? post : item)));
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {user ? <CreatePost onCreated={handleCreated} /> : null}

      {isLoading ? (
        <div className="post-list">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {!isLoading && posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📝</div>
          <h3>Feed is quiet</h3>
          <p>
            {user
              ? "Share the first photo or thought and it will appear here immediately."
              : "Once people start posting, the public feed will come alive."}
          </p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard
              canDelete={user?.id === post.user.id}
              key={post.id}
              onDelete={handleDelete}
              onLikeToggle={handleToggleLike}
              post={post}
            />
          ))}
        </div>
      )}
    </div>
  );
}
