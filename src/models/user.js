const supabase = require("../utils/supabaseClient");
const bcrypt = require("bcryptjs");

/**
 * User model for Supabase operations
 */

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async ({ username, email, password, full_name }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        username,
        email,
        password_hash: hashedPassword,
        full_name,
      },
    ])
    .select("id, username, email, full_name, created_at")
    .single();
  if (error) throw error;
  return data;
};

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null
 */
const getUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const getUserById = async (id) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, full_name, created_at")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
};

/**
 * Verify user password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} Password match result
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// TODO: Implement findUsersByName function for search functionality
// This should support partial name matching and pagination

// TODO: Implement getUserProfile function that includes follower/following counts

// TODO: Implement updateUserProfile function for profile updates

module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
};
