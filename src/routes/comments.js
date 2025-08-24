const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
    create,
    update,
    remove,
    getForPost
} = require("../controllers/comments");

const router = express.Router();

/**
 * Comments routes
 */

// Create a new comment on a post
router.post("/post/:post_id", authenticateToken, create);

// Update an existing comment
router.put("/:comment_id", authenticateToken, update);

// Delete a comment
router.delete("/:comment_id", authenticateToken, remove);

// Get all comments for a post
router.get("/post/:post_id", getForPost);

module.exports = router;
