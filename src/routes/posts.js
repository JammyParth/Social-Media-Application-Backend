const express = require("express");
const { validateRequest, createPostSchema } = require("../utils/validation");
const {
    create,
    getById,
    getUserPosts,
    getMyPosts,
    remove,
    getFeed,
    search
} = require("../controllers/posts");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * Posts routes
 */

// Feed and Search
router.get("/feed", authenticateToken, getFeed);
router.get("/search", optionalAuth, search);

// User's posts
router.get("/my", authenticateToken, getMyPosts);
router.get("/user/:user_id", optionalAuth, getUserPosts);

// Individual post operations
router.post("/", authenticateToken, validateRequest(createPostSchema), create);
router.get("/:post_id", optionalAuth, getById);
router.delete("/:post_id", authenticateToken, remove);

module.exports = router;
