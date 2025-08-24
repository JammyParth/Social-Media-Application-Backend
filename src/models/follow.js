const { query } = require("../utils/database");

/**
 * Follow model for managing user relationships
 */

/**
 * Follow a user
 * @param {number} followerId - ID of the user who wants to follow
 * @param {number} followingId - ID of the user to be followed
 * @returns {Promise<Object>} Follow relationship object
 */
const followUser = async (followerId, followingId) => {
    const result = await query(
        `INSERT INTO follows (follower_id, following_id)
         VALUES ($1, $2)
         RETURNING id, follower_id, following_id, created_at`,
        [followerId, followingId]
    );
    return result.rows[0];
};

/**
 * Unfollow a user
 * @param {number} followerId - ID of the user who wants to unfollow
 * @param {number} followingId - ID of the user to be unfollowed
 * @returns {Promise<boolean>} Success status
 */
const unfollowUser = async (followerId, followingId) => {
    const result = await query(
        `DELETE FROM follows
         WHERE follower_id = $1 AND following_id = $2`,
        [followerId, followingId]
    );
    return result.rowCount > 0;
};

/**
 * Get list of users that a user follows
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} List of followed users
 */
const getFollowing = async (userId, limit = 20, offset = 0) => {
    const result = await query(
        `SELECT u.id, u.username, u.full_name, f.created_at as followed_at
         FROM follows f
         JOIN users u ON f.following_id = u.id
         WHERE f.follower_id = $1 AND u.is_deleted = false
         ORDER BY f.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows;
};

/**
 * Get list of users who follow a user
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} List of followers
 */
const getFollowers = async (userId, limit = 20, offset = 0) => {
    const result = await query(
        `SELECT u.id, u.username, u.full_name, f.created_at as followed_at
         FROM follows f
         JOIN users u ON f.follower_id = u.id
         WHERE f.following_id = $1 AND u.is_deleted = false
         ORDER BY f.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows;
};

/**
 * Get follow counts for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Object containing followers and following counts
 */
const getFollowCounts = async (userId) => {
    const result = await query(
        `SELECT
            (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count`,
        [userId]
    );
    return result.rows[0];
};

/**
 * Check if one user follows another
 * @param {number} followerId - ID of the potential follower
 * @param {number} followingId - ID of the potentially followed user
 * @returns {Promise<boolean>} Whether the follow relationship exists
 */
const isFollowing = async (followerId, followingId) => {
    const result = await query(
        `SELECT EXISTS(
            SELECT 1 FROM follows
            WHERE follower_id = $1 AND following_id = $2
        ) as is_following`,
        [followerId, followingId]
    );
    return result.rows[0].is_following;
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    getFollowCounts,
    isFollowing
};
