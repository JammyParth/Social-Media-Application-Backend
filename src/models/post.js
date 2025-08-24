const { query } = require("../utils/database");

/**
 * Post model for database operations
 */

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @returns {Promise<Object>} Created post
 */
const createPost = async ({
  user_id,
  content,
  media_url,
  comments_enabled = true,
}) => {
  const result = await query(
    `INSERT INTO posts (user_id, content, media_url, comments_enabled, created_at, is_deleted)
     VALUES ($1, $2, $3, $4, NOW(), false)
     RETURNING id, user_id, content, media_url, comments_enabled, created_at`,
    [user_id, content, media_url, comments_enabled],
  );

  return result.rows[0];
};

/**
 * Get post by ID
 * @param {number} postId - Post ID
 * @returns {Promise<Object|null>} Post object or null
 */
const getPostById = async (postId) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    [postId],
  );

  return result.rows[0] || null;
};

/**
 * Get posts by user ID
 * @param {number} userId - User ID
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of posts
 */
const getPostsByUserId = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  return result.rows;
};

/**
 * Delete a post
 * @param {number} postId - Post ID
 * @param {number} userId - User ID (for ownership verification)
 * @returns {Promise<boolean>} Success status
 */
const deletePost = async (postId, userId) => {
  const result = await query(
    "UPDATE posts SET is_deleted = true WHERE id = $1 AND user_id = $2",
    [postId, userId],
  );

  return result.rowCount > 0;
};

/**
 * Get posts for user's feed (followed users + own posts)
 * @param {number} userId - User ID
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of posts with user and interaction details
 */
const getFeedPosts = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT 
        p.*,
        u.username,
        u.full_name,
        COALESCE(l.like_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count,
        EXISTS(
            SELECT 1 FROM likes 
            WHERE post_id = p.id AND user_id = $1
        ) as user_has_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count
        FROM likes
        GROUP BY post_id
    ) l ON p.id = l.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM comments
        WHERE is_deleted = false
        GROUP BY post_id
    ) c ON p.id = c.post_id
    WHERE p.is_deleted = false
    AND (
        p.user_id = $1
        OR p.user_id IN (
            SELECT following_id 
            FROM follows 
            WHERE follower_id = $1
        )
    )
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
};

/**
 * Search posts by content
 * @param {string} searchQuery - Search query string
 * @param {number} userId - User ID for like status
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of matching posts
 */
const searchPosts = async (searchQuery, userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT 
        p.*,
        u.username,
        u.full_name,
        COALESCE(l.like_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count,
        EXISTS(
            SELECT 1 FROM likes 
            WHERE post_id = p.id AND user_id = $1
        ) as user_has_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count
        FROM likes
        GROUP BY post_id
    ) l ON p.id = l.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM comments
        WHERE is_deleted = false
        GROUP BY post_id
    ) c ON p.id = c.post_id
    WHERE p.is_deleted = false
    AND (
        p.content ILIKE $2
        OR u.username ILIKE $2
        OR u.full_name ILIKE $2
    )
    ORDER BY p.created_at DESC
    LIMIT $3 OFFSET $4`,
    [userId, `%${searchQuery}%`, limit, offset]
  );

  return result.rows;
};

module.exports = {
  createPost,
  getPostById,
  getPostsByUserId,
  deletePost,
  getFeedPosts,
  searchPosts
};
