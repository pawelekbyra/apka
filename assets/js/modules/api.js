const API = (function() {
    async function _request(action, data = {}) {
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
    };
})();

export default API;
