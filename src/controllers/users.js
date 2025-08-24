const {
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    getFollowCounts,
    isFollowing
} = require("../models/follow");
const logger = require("../utils/logger");
const { query } = require("../utils/database");

/**
 * Search users by username or full name
 */
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const result = await query(
            `SELECT 
                u.id, 
                u.username, 
                u.full_name,
                u.created_at,
                EXISTS(
                    SELECT 1 FROM follows 
                    WHERE follower_id = $1 AND following_id = u.id
                ) as is_following,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
            FROM users u
            WHERE u.is_deleted = false
            AND u.id != $1
            AND (
                u.username ILIKE $2 
                OR u.full_name ILIKE $2
            )
            ORDER BY 
                CASE 
                    WHEN u.username ILIKE $3 THEN 0
                    WHEN u.username ILIKE $4 THEN 1
                    WHEN u.full_name ILIKE $3 THEN 2
                    ELSE 3
                END,
                u.username
            LIMIT $5 OFFSET $6`,
            [
                userId,
                `%${q}%`,
                `${q}%`,
                `%${q}`,
                limit,
                offset
            ]
        );

        res.json({
            users: result.rows,
            pagination: {
                page,
                limit,
                hasMore: result.rows.length === limit
            }
        });
    } catch (error) {
        logger.critical("Search users error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Follow a user
 */
const follow = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.user_id);

        // Check if already following
        const alreadyFollowing = await isFollowing(followerId, followingId);
        if (alreadyFollowing) {
            return res.status(400).json({ error: "Already following this user" });
        }

        // Create follow relationship
        const follow = await followUser(followerId, followingId);
        
        logger.verbose(`User ${followerId} followed user ${followingId}`);
        
        res.status(201).json({
            message: "Successfully followed user",
            follow
        });
    } catch (error) {
        logger.critical("Follow user error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Unfollow a user
 */
const unfollow = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.user_id);

        const success = await unfollowUser(followerId, followingId);
        
        if (!success) {
            return res.status(404).json({ error: "Follow relationship not found" });
        }

        logger.verbose(`User ${followerId} unfollowed user ${followingId}`);
        
        res.json({
            message: "Successfully unfollowed user"
        });
    } catch (error) {
        logger.critical("Unfollow user error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get users that the current user is following
 */
const getMyFollowing = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const following = await getFollowing(userId, limit, offset);
        const counts = await getFollowCounts(userId);

        res.json({
            following,
            pagination: {
                page,
                limit,
                total: counts.following_count,
                hasMore: following.length === limit
            }
        });
    } catch (error) {
        logger.critical("Get following error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get users who follow the current user
 */
const getMyFollowers = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const followers = await getFollowers(userId, limit, offset);
        const counts = await getFollowCounts(userId);

        res.json({
            followers,
            pagination: {
                page,
                limit,
                total: counts.followers_count,
                hasMore: followers.length === limit
            }
        });
    } catch (error) {
        logger.critical("Get followers error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get follow statistics for a user
 */
const getFollowStats = async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id) || req.user.id;
        const counts = await getFollowCounts(userId);
        
        res.json(counts);
    } catch (error) {
        logger.critical("Get follow stats error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    follow,
    unfollow,
    getMyFollowing,
    getMyFollowers,
    getFollowStats,
    searchUsers
};
