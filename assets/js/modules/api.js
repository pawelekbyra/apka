import { slidesData } from './config.js';

const API = (function() {
    async function _request(action, data = {}) {
        if (window.ajax_object.ajax_url === '#') {
            console.log(`[MOCK] API call for action "${action}" with data:`, data);
            if (action === 'tt_add_comment') {
                const slide = slidesData.find(s => String(s.likeId) === String(data.post_id));
                const newCount = (slide ? slide.initialComments : 0) + 1;
                if(slide) slide.initialComments = newCount;
                return { success: true, data: { newCount: newCount, message: 'Mock comment added!' } };
            }
            return { success: true, data: {} };
        }
        try {
            const body = new URLSearchParams({ action, nonce: window.ajax_object.nonce, ...data });
            const response = await fetch(window.ajax_object.ajax_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                credentials: 'same-origin',
                body
            });
            if (!response.ok) throw new Error(`Server responded with ${response.status}`);
            const json = await response.json();
            if (json.new_nonce) window.ajax_object.nonce = json.new_nonce;
            return json;
        } catch (error) {
            console.error(`API Client Error for action "${action}":`, error);
            return { success: false, data: { message: error.message } };
        }
    }

    // Note: These are the functions for the main app logic (likes, login, etc.)
    // The account panel has its own, more specific API calls that will be in `account.js`
    return {
        login: (data) => _request('tt_ajax_login', data),
        logout: () => _request('tt_ajax_logout'),
        toggleLike: (postId) => _request('toggle_like', { post_id: postId }),
        refreshNonce: async () => {
            const json = await _request('tt_refresh_nonce');
            if (json.success && json.nonce) window.ajax_object.nonce = json.nonce;
            else console.error('Failed to refresh nonce.', json);
        },
        fetchSlidesData: () => _request('tt_get_slides_data_ajax'),

        // --- Comments API ---
        fetchComments: async (postId) => {
            if (window.ajax_object.ajax_url === '#') {
                console.log(`[MOCK] Fetching comments for post ${postId}`);
                return Promise.resolve([
                    { id: 1, text: 'This is a mock comment! It should be a bit longer to test the line wrapping and general layout of the text within the comment bubble.', author: 'Mock User 1', avatar: 'https://i.pravatar.cc/48?u=mock1', timestamp: new Date(Date.now() - 60000 * 5).toISOString(), isOwnComment: true },
                    { id: 2, text: 'Another great mock comment.', author: 'Mock User 2', avatar: 'https://i.pravatar.cc/48?u=mock2', timestamp: new Date(Date.now() - 60000 * 120).toISOString(), isOwnComment: false },
                    { id: 3, text: 'Short one.', author: 'Mock User 1', avatar: 'https://i.pravatar.cc/48?u=mock1', timestamp: new Date(Date.now() - 60000 * 180).toISOString(), isOwnComment: true }
                ]);
            }
            // This uses GET method simulation for admin-ajax
            const url = new URL(window.ajax_object.ajax_url);
            url.searchParams.append('action', 'tt_get_comments');
            url.searchParams.append('nonce', window.ajax_object.nonce);
            url.searchParams.append('post_id', postId);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                });
                if (!response.ok) throw new Error(`Server responded with ${response.status}`);
                const json = await response.json();
                if (!json.success) throw new Error(json.data.message || 'API error');
                return json.data;
            } catch (error) {
                console.error(`API Client Error for action "tt_get_comments":`, error);
                throw error; // Re-throw to be caught by the caller
            }
        },
        addComment: (postId, comment) => _request('tt_add_comment', { post_id: postId, comment: comment }),

        // --- Account Panel API ---
        uploadAvatar: (dataUrl) => _request('tt_avatar_upload', { image: dataUrl }),
        updateProfile: (data) => _request('tt_profile_update', data),
        changePassword: (data) => _request('tt_password_change', data),
        deleteAccount: (confirmText) => _request('tt_account_delete', { confirm_text: confirmText }),
        loadUserProfile: () => _request('tt_profile_get'),
    };
})();

export default API;
