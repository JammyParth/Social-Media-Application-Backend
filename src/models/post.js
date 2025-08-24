const supabase = require("../utils/supabaseClient");

/**
 * Post model for Supabase operations
 */

const createPost = async ({ user_id, content, media_url, comments_enabled = true }) => {
  const { data, error } = await supabase
    .from("posts")
    .insert([
      { user_id, content, media_url, comments_enabled, is_deleted: false }
    ])
    .select("id, user_id, content, media_url, comments_enabled, created_at")
    .single();
  if (error) throw error;
  return data;
};

const getPostById = async (postId) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*, users(username, full_name)")
    .eq("id", postId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
};

const getPostsByUserId = async (userId, limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*, users(username, full_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
};

const deletePost = async (postId, userId) => {
  const { data, error } = await supabase
    .from("posts")
    .update({ is_deleted: true })
    .eq("id", postId)
    .eq("user_id", userId);
  if (error) throw error;
  return data && data.length > 0;
};

const getFeedPosts = async (userId, limit = 20, offset = 0) => {
  // Get followed users
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (followsError) throw followsError;
  const followingIds = follows.map(f => f.following_id);
  const ids = [userId, ...followingIds];

  // Get posts for feed
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*, users(username, full_name)")
    .in("user_id", ids)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (postsError) throw postsError;

  // For each post, fetch like and comment counts
  const postsWithCounts = await Promise.all(
    posts.map(async post => {
      // Like count
      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id);
      if (likesError) throw likesError;
      // Comments array
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("id, content, user_id, created_at")
        .eq("post_id", post.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (commentsError) throw commentsError;
      // User has liked
      const { data: userLike, error: userLikeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", userId)
        .single();
      if (userLikeError && userLikeError.code !== "PGRST116") throw userLikeError;
      return {
        ...post,
        like_count: likes.length,
        comment_count: comments.length,
        comments,
        user_has_liked: !!userLike
      };
    })
  );
  return postsWithCounts;
};

const searchPosts = async (searchQuery, userId, limit = 20, offset = 0) => {
  // Supabase does not support ILIKE, so use LIKE for case-insensitive search
  const { data, error } = await supabase
    .from("posts")
    .select("*, users(username, full_name)")
    .ilike("content", `%${searchQuery}%`)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
};

module.exports = {
  createPost,
  getPostById,
  getPostsByUserId,
  deletePost,
  getFeedPosts,
  searchPosts
};
