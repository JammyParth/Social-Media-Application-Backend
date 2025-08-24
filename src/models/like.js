const supabase = require("../utils/supabaseClient");

const likePost = async (userId, postId) => {
    const { data, error } = await supabase
        .from("likes")
        .insert([{ user_id: userId, post_id: postId }])
        .select("id, user_id, post_id, created_at")
        .single();
    if (error) throw error;
    return data;
};

const unlikePost = async (userId, postId) => {
    const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);
    if (error) throw error;
    return true;
};

const getPostLikes = async (postId, limit = 20, offset = 0) => {
    const { data, error } = await supabase
        .from("likes")
        .select("id, created_at, users(id, username, full_name)")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
};

const getUserLikes = async (userId, limit = 20, offset = 0) => {
    const { data, error } = await supabase
        .from("likes")
        .select("posts(*, users(username, full_name)), created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
};

const hasUserLikedPost = async (userId, postId) => {
    const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", userId)
        .eq("post_id", postId)
        .single();
    if (error && error.code !== "PGRST116") throw error;
    return !!data;
};

const getLikeCount = async (postId) => {
    const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId);
    if (error) throw error;
    return data ? data.length : 0;
};

module.exports = {
    likePost,
    unlikePost,
    getPostLikes,
    getUserLikes,
    hasUserLikedPost,
    getLikeCount
};
