const supabase = require("../utils/supabaseClient");

const followUser = async (followerId, followingId) => {
    const { data, error } = await supabase
        .from("follows")
        .insert([{ follower_id: followerId, following_id: followingId }])
        .select("id, follower_id, following_id, created_at")
        .single();
    if (error) throw error;
    return data;
};

const unfollowUser = async (followerId, followingId) => {
    const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId);
    if (error) throw error;
    return true;
};

const getFollowing = async (userId, limit = 20, offset = 0) => {
    const { data, error } = await supabase
        .from("follows")
        .select("users(id, username, full_name), created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
};

const getFollowers = async (userId, limit = 20, offset = 0) => {
    const { data, error } = await supabase
        .from("follows")
        .select("users(id, username, full_name), created_at")
        .eq("following_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
};

const getFollowCounts = async (userId) => {
    const { data: followers, error: followersError } = await supabase
        .from("follows")
        .select("id")
        .eq("following_id", userId);
    if (followersError) throw followersError;
    const { data: following, error: followingError } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", userId);
    if (followingError) throw followingError;
    return {
        followers_count: followers.length,
        following_count: following.length
    };
};

const isFollowing = async (followerId, followingId) => {
    const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .single();
    if (error && error.code !== "PGRST116") throw error;
    return !!data;
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    getFollowCounts,
    isFollowing
};
