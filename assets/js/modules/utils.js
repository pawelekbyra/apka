import { Config } from './config.js';
import State from './state.js';

const Utils = (function() {
    return {
        getTranslation: (key) => (Config.TRANSLATIONS[State.get('currentLang')]?.[key]) || key,
        formatCount: (count) => {
            count = Number(count) || 0;
            if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
            if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
            return String(count);
        },
        fixProtocol: (url) => {
            if (!url) return url;
            try {
                if (window.location.protocol === 'https:') {
                    const urlObj = new URL(url, window.location.origin);
                    if (urlObj.protocol === 'http:') {
                        urlObj.protocol = 'https:';
                        return urlObj.toString();
                    }
                }
            } catch (e) { /* Invalid URL, return as is */ }
            return url;
        },
        toRelativeIfSameOrigin: (url) => {
            if (!url) return url;
            try {
                const urlObj = new URL(url, window.location.origin);
                if (urlObj.origin === window.location.origin) {
                    return urlObj.pathname + urlObj.search + urlObj.hash;
                }
            } catch (e) { /* Invalid URL, return as is */ }
            return url;
        },
        vibrateTry: (ms = 35) => {
            if (navigator.vibrate) {
                try { navigator.vibrate(ms); } catch(e) {}
            }
        },
        recordUserGesture: () => {
            State.set('lastUserGestureTimestamp', Date.now());
        },
        setAppHeightVar: () => {
          document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
        }
    };
})();

export default Utils;
