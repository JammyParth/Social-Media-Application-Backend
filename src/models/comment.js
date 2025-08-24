const { query } = require("../utils/database");

/**
 * Comment model for managing post comments
 */

/**
 * Create a new comment
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} Created comment
 */
const createComment = async ({ user_id, post_id, content }) => {
    const result = await query(
        `INSERT INTO comments (user_id, post_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, post_id, content, created_at`,
        [user_id, post_id, content]
    );
    return result.rows[0];
};

/**
 * Update an existing comment
 * @param {number} commentId - Comment ID
 * @param {number} userId - User ID (for verification)
 * @param {string} content - New comment content
 * @returns {Promise<Object|null>} Updated comment or null
 */
const updateComment = async (commentId, userId, content) => {
    const result = await query(
        `UPDATE comments
         SET content = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3 AND is_deleted = false
         RETURNING id, user_id, post_id, content, created_at, updated_at`,
        [content, commentId, userId]
    );
    return result.rows[0] || null;
};

/**
 * Soft delete a comment
 * @param {number} commentId - Comment ID
 * @param {number} userId - User ID (for verification)
 * @returns {Promise<boolean>} Success status
 */
const deleteComment = async (commentId, userId) => {
    const result = await query(
        `UPDATE comments
         SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
        [commentId, userId]
    );
    return result.rowCount > 0;
};

/**
 * Get all comments for a post with user details
 * @param {number} postId - Post ID
 * @param {number} limit - Number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} Array of comments with user details
 */
const getPostComments = async (postId, limit = 20, offset = 0) => {
    const result = await query(
        `SELECT c.id, c.content, c.created_at, c.updated_at,
                u.id as user_id, u.username, u.full_name
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = $1 AND c.is_deleted = false
         ORDER BY c.created_at DESC
         LIMIT $2 OFFSET $3`,
        [postId, limit, offset]
    );
    return result.rows;
};

/**
 * Get a single comment by ID with user details
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object|null>} Comment object or null
 */
const getCommentById = async (commentId) => {
    const result = await query(
        `SELECT c.id, c.content, c.created_at, c.updated_at,
                u.id as user_id, u.username, u.full_name,
                p.id as post_id, p.comments_enabled
         FROM comments c
         JOIN users u ON c.user_id = u.id
         JOIN posts p ON c.post_id = p.id
         WHERE c.id = $1 AND c.is_deleted = false`,
        [commentId]
    );
    return result.rows[0] || null;
};

/**
 * Get comment count for a post
 * @param {number} postId - Post ID
 * @returns {Promise<number>} Number of comments
 */
const getCommentCount = async (postId) => {
    const result = await query(
        `SELECT COUNT(*) as count 
         FROM comments 
         WHERE post_id = $1 AND is_deleted = false`,
        [postId]
    );
    return parseInt(result.rows[0].count);
};

module.exports = {
    createComment,
    updateComment,
    deleteComment,
    getPostComments,
    getCommentById,
    getCommentCount
};
