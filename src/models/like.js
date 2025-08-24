const { query } = require("../utils/database");

/**
 * Like model for managing post likes
 */

/**
 * Like a post
 * @param {number} userId - User ID who is liking
 * @param {number} postId - Post ID to be liked
 * @returns {Promise<Object>} Like object
 */
const likePost = async (userId, postId) => {
    const result = await query(
        `INSERT INTO likes (user_id, post_id)
         VALUES ($1, $2)
         RETURNING id, user_id, post_id, created_at`,
        [userId, postId]
    );
    return result.rows[0];
};

/**
 * Unlike a post
 * @param {number} userId - User ID who is unliking
 * @param {number} postId - Post ID to be unliked
 * @returns {Promise<boolean>} Success status
 */
const unlikePost = async (userId, postId) => {
    const result = await query(
        `DELETE FROM likes
         WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
    );
    return result.rowCount > 0;
};

/**
 * Get all likes for a post with user details
 * @param {number} postId - Post ID
 * @param {number} limit - Number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} Array of likes with user details
 */
const getPostLikes = async (postId, limit = 20, offset = 0) => {
    const result = await query(
        `SELECT l.id, l.created_at, 
                u.id as user_id, u.username, u.full_name
         FROM likes l
         JOIN users u ON l.user_id = u.id
         WHERE l.post_id = $1 AND u.is_deleted = false
         ORDER BY l.created_at DESC
         LIMIT $2 OFFSET $3`,
        [postId, limit, offset]
    );
    return result.rows;
};

/**
 * Get posts liked by a user
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} Array of liked posts
 */
const getUserLikes = async (userId, limit = 20, offset = 0) => {
    const result = await query(
        `SELECT p.*, l.created_at as liked_at,
                u.username, u.full_name,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
         FROM likes l
         JOIN posts p ON l.post_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE l.user_id = $1 AND p.is_deleted = false
         ORDER BY l.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows;
};

/**
 * Check if a user has liked a post
 * @param {number} userId - User ID
 * @param {number} postId - Post ID
 * @returns {Promise<boolean>} Whether user has liked the post
 */
const hasUserLikedPost = async (userId, postId) => {
    const result = await query(
        `SELECT EXISTS(
            SELECT 1 FROM likes
            WHERE user_id = $1 AND post_id = $2
        ) as has_liked`,
        [userId, postId]
    );
    return result.rows[0].has_liked;
};

/**
 * Get like count for a post
 * @param {number} postId - Post ID
 * @returns {Promise<number>} Number of likes
 */
const getLikeCount = async (postId) => {
    const result = await query(
        `SELECT COUNT(*) as count FROM likes WHERE post_id = $1`,
        [postId]
    );
    return parseInt(result.rows[0].count);
};

module.exports = {
    likePost,
    unlikePost,
    getPostLikes,
    getUserLikes,
    hasUserLikedPost,
    getLikeCount
};
