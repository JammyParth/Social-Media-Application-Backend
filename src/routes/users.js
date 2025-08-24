const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
    follow,
    unfollow,
    getMyFollowing,
    getMyFollowers,
    getFollowStats,
    searchUsers
} = require("../controllers/users");

const router = express.Router();

/**
 * User-related routes
 */

// Follow/Unfollow
router.post("/follow/:user_id", authenticateToken, follow);
router.delete("/unfollow/:user_id", authenticateToken, unfollow);

// Get following/followers
router.get("/following", authenticateToken, getMyFollowing);
router.get("/followers", authenticateToken, getMyFollowers);

// Get follow statistics
router.get("/stats/:user_id?", authenticateToken, getFollowStats);

// Search users
router.get("/search", authenticateToken, searchUsers);

module.exports = router;
