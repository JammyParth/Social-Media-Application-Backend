const supabase = require("../utils/supabaseClient");

const createComment = async ({ user_id, post_id, content }) => {
    const { data, error } = await supabase
        .from("comments")
        .insert([
            { user_id, post_id, content, is_deleted: false }
        ])
        .select("id, user_id, post_id, content, created_at")
        .single();
    if (error) throw error;
    return data;
};

const updateComment = async (commentId, userId, content) => {
    const { data, error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", commentId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .select("id, user_id, post_id, content, created_at, updated_at")
        .single();
    if (error) throw error;
    return data || null;
};

const deleteComment = async (commentId, userId) => {
    const { data, error } = await supabase
        .from("comments")
        .update({ is_deleted: true })
        .eq("id", commentId)
        .eq("user_id", userId)
        .eq("is_deleted", false);
    if (error) throw error;
    return data && data.length > 0;
};

const getPostComments = async (postId, limit = 20, offset = 0) => {
    const { data, error } = await supabase
        .from("comments")
        .select("*, users(id, username, full_name)")
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
};

const getCommentById = async (commentId) => {
    const { data, error } = await supabase
        .from("comments")
        .select("*, users(id, username, full_name), posts(id, comments_enabled)")
        .eq("id", commentId)
        .eq("is_deleted", false)
        .single();
    if (error && error.code !== "PGRST116") throw error;
    return data || null;
};

const getCommentCount = async (postId) => {
    const { data, error } = await supabase
        .from("comments")
        .select("id")
        .eq("post_id", postId)
        .eq("is_deleted", false);
    if (error) throw error;
    return data ? data.length : 0;
};

module.exports = {
    createComment,
    updateComment,
    deleteComment,
    getPostComments,
    getCommentById,
    getCommentCount
};
