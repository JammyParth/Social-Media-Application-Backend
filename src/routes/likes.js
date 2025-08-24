const express = require("express");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const {
    like,
    unlike,
    getPostLikes,
    getUserLikes
} = require("../controllers/likes");

const router = express.Router();

/**
 * Likes routes
 */

// Like/Unlike posts
router.post("/post/:post_id", authenticateToken, like);
router.delete("/post/:post_id", authenticateToken, unlike);

// Get likes for a post (works with or without auth)
router.get("/post/:post_id", optionalAuth, getPostLikes);

// Get posts liked by the authenticated user
router.get("/my", authenticateToken, getUserLikes);

module.exports = router;
