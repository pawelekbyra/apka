import { slidesData } from './config.js';

const State = (function() {
    const _state = {
        isUserLoggedIn: (typeof TingTongData !== 'undefined' && TingTongData.isLoggedIn) || false,
        currentLang: 'pl',
        currentSlideIndex: 0,
        isAutoplayBlocked: false,
        isDraggingProgress: false,
        lastFocusedElement: null,
        lastUserGestureTimestamp: 0,
        activeVideoSession: 0,
    };

    return {
        get: (key) => _state[key],
        set: (key, value) => { _state[key] = value; },
        getState: () => ({ ..._state }),
        getSlideDataByLikeId: (likeId) => {
            return slidesData.find(slide => String(slide.likeId) === String(likeId));
        }
    };
})();

export default State;
