const {
    likePost,
    unlikePost,
    getPostLikes,
    getUserLikes,
    hasUserLikedPost,
    getLikeCount
} = require("../models/like");
const logger = require("../utils/logger");

/**
 * Like a post
 */
const like = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = parseInt(req.params.post_id);

        // Check if already liked
        const alreadyLiked = await hasUserLikedPost(userId, postId);
        if (alreadyLiked) {
            return res.status(400).json({ error: "Already liked this post" });
        }

        // Create like
        const like = await likePost(userId, postId);
        const likeCount = await getLikeCount(postId);
        
        logger.verbose(`User ${userId} liked post ${postId}`);
        
        res.status(201).json({
            message: "Successfully liked post",
            like,
            likeCount
        });
    } catch (error) {
        logger.critical("Like post error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Unlike a post
 */
const unlike = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = parseInt(req.params.post_id);

        const success = await unlikePost(userId, postId);
        
        if (!success) {
            return res.status(404).json({ error: "Like not found" });
        }

        const likeCount = await getLikeCount(postId);
        
        logger.verbose(`User ${userId} unliked post ${postId}`);
        
        res.json({
            message: "Successfully unliked post",
            likeCount
        });
    } catch (error) {
        logger.critical("Unlike post error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get likes for a post
 */
const getPostLikesHandler = async (req, res) => {
    try {
        const postId = parseInt(req.params.post_id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const likes = await getPostLikes(postId, limit, offset);
        const totalLikes = await getLikeCount(postId);

        // If user is authenticated, check if they liked the post
        let userHasLiked = false;
        if (req.user) {
            userHasLiked = await hasUserLikedPost(req.user.id, postId);
        }

        res.json({
            likes,
            userHasLiked,
            pagination: {
                page,
                limit,
                total: totalLikes,
                hasMore: likes.length === limit
            }
        });
    } catch (error) {
        logger.critical("Get post likes error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get posts liked by a user
 */
const getUserLikesHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const likedPosts = await getUserLikes(userId, limit, offset);

        res.json({
            posts: likedPosts,
            pagination: {
                page,
                limit,
                hasMore: likedPosts.length === limit
            }
        });
    } catch (error) {
        logger.critical("Get user likes error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    like,
    unlike,
    getPostLikes: getPostLikesHandler,
    getUserLikes: getUserLikesHandler
};
