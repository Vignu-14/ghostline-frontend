import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PostCard } from "../components/post/PostCard";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { AvatarUploadModal } from "../components/profile/AvatarUploadModal";
import { Spinner } from "../components/common/Spinner";
import { useAuth } from "../hooks/useAuth";
import * as postService from "../services/postService";
import * as userService from "../services/userService";
import type { Post } from "../types/post";
import type { PublicProfile } from "../types/user";
import { getErrorMessage } from "../utils/errorHandler";

export function ProfilePage() {
  const { username: routeUsername } = useParams();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const { user, setUser } = useAuth();
  const username = routeUsername || user?.username || "";
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleAvatarClick = () => {
    if (user?.id === profile?.id) {
      setIsAvatarModalOpen(true);
    }
  };

  const handleAvatarSuccess = (newUrl: string) => {
    setUser((prev) => (prev ? { ...prev, profile_picture_url: newUrl } : null));
    setProfile((prev) => (prev ? { ...prev, profile_picture_url: newUrl } : null));
  };

  useEffect(() => {
    if (!username) {
      setProfile(null);
      setPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    void (async () => {
      try {
        const response = await userService.getProfileByUsername(username);
        setProfile(response.profile);
        setPosts(response.posts);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Unable to load profile."));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [username]);

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

  return (
    <main className="page">
      {isLoading ? (
        <div className="center-stage">
          <Spinner />
        </div>
      ) : null}

      {!isLoading && error ? <p className="form-error">{error}</p> : null}

      {!isLoading && !profile && !error ? (
        <section className="panel" style={{ textAlign: 'center' }}>
          <div className="empty-state__icon">👤</div>
          <p className="eyebrow">Profile</p>
          <h1 style={{ fontSize: '1.5rem', marginTop: '8px' }}>No user selected</h1>
          <p className="support-copy" style={{ marginTop: '8px' }}>Open a profile from search or login to view your own page.</p>
        </section>
      ) : null}

      {!isLoading && profile ? (
        <>
          <ProfileHeader 
            userId={profile.id}
            username={profile.username}
            postCount={posts.length}
            profilePictureUrl={profile.profile_picture_url}
            onAvatarClick={handleAvatarClick}
          />

          {isAvatarModalOpen && (
            <AvatarUploadModal
              onClose={() => setIsAvatarModalOpen(false)}
              onSuccess={handleAvatarSuccess}
            />
          )}

          <section className="feed__stack">
            {posts.length === 0 ? (
              <section className="panel feed__empty">
                <div className="empty-state__icon">📝</div>
                <p className="eyebrow">Nothing posted yet</p>
                <h2 style={{ fontSize: '1.25rem', marginTop: '8px' }}>No photos or thoughts</h2>
                <p className="support-copy" style={{ marginTop: '8px' }}>This profile is ready, but there's nothing public to show yet.</p>
              </section>
            ) : (
              posts.map((post) => (
                <PostCard
                  canDelete={user?.id === post.user.id}
                  key={post.id}
                  onDelete={handleDelete}
                  onLikeToggle={handleToggleLike}
                  post={post}
                />
              ))
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
