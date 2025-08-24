const {
    createComment,
    updateComment,
    deleteComment,
    getPostComments,
    getCommentById,
    getCommentCount
} = require("../models/comment");
const logger = require("../utils/logger");

/**
 * Create a new comment on a post
 */
const create = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = parseInt(req.params.post_id);
        const { content } = req.body;

        // Validate content
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: "Comment content is required" });
        }

        // Create comment
        const comment = await createComment({
            user_id: userId,
            post_id: postId,
            content: content.trim()
        });

        const commentCount = await getCommentCount(postId);
        
        logger.verbose(`User ${userId} commented on post ${postId}`);
        
        res.status(201).json({
            message: "Comment created successfully",
            comment,
            commentCount
        });
    } catch (error) {
        logger.critical("Create comment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update an existing comment
 */
const update = async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = parseInt(req.params.comment_id);
        const { content } = req.body;

        // Validate content
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: "Comment content is required" });
        }

        // Get existing comment to check ownership
        const existingComment = await getCommentById(commentId);
        if (!existingComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (existingComment.user_id !== userId) {
            return res.status(403).json({ error: "Not authorized to edit this comment" });
        }

        // Update comment
        const updatedComment = await updateComment(commentId, userId, content.trim());
        
        logger.verbose(`User ${userId} updated comment ${commentId}`);
        
        res.json({
            message: "Comment updated successfully",
            comment: updatedComment
        });
    } catch (error) {
        logger.critical("Update comment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete a comment
 */
const remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = parseInt(req.params.comment_id);

        // Get existing comment to check ownership
        const existingComment = await getCommentById(commentId);
        if (!existingComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (existingComment.user_id !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this comment" });
        }

        // Delete comment
        const success = await deleteComment(commentId, userId);
        if (!success) {
            return res.status(404).json({ error: "Comment not found" });
        }

        const commentCount = await getCommentCount(existingComment.post_id);
        
        logger.verbose(`User ${userId} deleted comment ${commentId}`);
        
        res.json({
            message: "Comment deleted successfully",
            commentCount
        });
    } catch (error) {
        logger.critical("Delete comment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get comments for a post
 */
const getForPost = async (req, res) => {
    try {
        const postId = parseInt(req.params.post_id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const comments = await getPostComments(postId, limit, offset);
        const totalComments = await getCommentCount(postId);

        res.json({
            comments,
            pagination: {
                page,
                limit,
                total: totalComments,
                hasMore: comments.length === limit
            }
        });
    } catch (error) {
        logger.critical("Get post comments error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    create,
    update,
    remove,
    getForPost
};
