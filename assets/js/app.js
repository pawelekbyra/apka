// This is the patch script, it runs immediately.
(() => {
    /* ============================
     * 1) CDN helper + preconnect
     * ============================ */
    const CDN_HOST = null; // <— ZMIEŃ jeśli używasz innego hosta CDN
    const isHttpUrl = (u) => /^https?:\/\//i.test(u);

    // Wstrzyknij preconnect/dns-prefetch (robimy to dynamicznie, żeby nie ruszać <head>)
    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      if (head && CDN_HOST) {
        const mk = (tag, attrs) => {
          const el = document.createElement(tag);
          Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
          return el;
        };
        // nie duplikuj
        if (!document.querySelector(`link[rel="preconnect"][href="${CDN_HOST}"]`)) {
          head.appendChild(mk('link', { rel: 'preconnect', href: CDN_HOST, crossorigin: '' }));
        }
        if (!document.querySelector(`link[rel="dns-prefetch"][href="//${CDN_HOST.replace(/^https?:\/\//,'')}"]`)) {
          head.appendChild(mk('link', { rel: 'dns-prefetch', href: '//' + CDN_HOST.replace(/^https?:\/\//,'') }));
        }
      }
    } catch(e){ /* no-op */ }

    // Helper mapujący origin → CDN (zachowuje ścieżkę)
    function toCDN(url) {
      if (!url || !CDN_HOST) return url;
      try {
        // jeśli już CDN — zostaw
        if (url.startsWith(CDN_HOST)) return url;
        // jeśli absolutny http(s) — podmień tylko host
        if (isHttpUrl(url)) {
          const u = new URL(url);
          const c = new URL(CDN_HOST);
          return `${c.origin}${u.pathname}${u.search}${u.hash}`;
        }
        // jeśli względny — dolej do CDN
        return CDN_HOST.replace(/\/+$/,'') + '/' + url.replace(/^\/+/, '');
      } catch {
        return url;
      }
    }

    // Podmień src na CDN przy pierwszym ustawieniu źródeł (bez grzebania w Twoich funkcjach)
    // — obejście: obserwujemy dodawanie/zmianę <source>/<video>
    const mm = new MutationObserver(muts => {
      for (const m of muts) {
        const nodes = Array.from(m.addedNodes || []);
        for (const n of nodes) rewriteSources(n);
        if (m.type === 'attributes' && (m.target.tagName === 'SOURCE' || m.target.tagName === 'VIDEO') && m.attributeName === 'src') {
          rewriteNodeSrc(m.target);
        }
      }
    });
    mm.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

    function rewriteSources(root) {
      if (!root || !CDN_HOST) return;
      if (root.tagName === 'SOURCE' || root.tagName === 'VIDEO') rewriteNodeSrc(root);
      root.querySelectorAll?.('source, video').forEach(rewriteNodeSrc);
    }
    function rewriteNodeSrc(el) {
      try {
        const src = el.getAttribute('src');
        if (!src) return;
        const mapped = toCDN(src);
        if (mapped && mapped !== src) el.setAttribute('src', mapped);
      } catch(e){}
    }

    /* ===========================================
     * 2) Prefetch następnego slajdu (JIT, lekki)
     * =========================================== */
    function slideSelector() {
      return document.querySelectorAll('.slide, .webyx-section');
    }
    function getNextSlide(el) {
      let p = el.nextElementSibling;
      while (p && !(p.classList?.contains('slide') || p.classList?.contains('webyx-section'))) {
        p = p.nextElementSibling;
      }
      return p || null;
    }
    function prefetchSlide(slide) {
      if (!slide || slide.__tt_prefetched) return;
      const v = slide.querySelector?.('video');
      if (v) {
        v.setAttribute('preload', 'metadata');
      }
      slide.__tt_prefetched = true;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const next = getNextSlide(e.target);
          if (next) prefetchSlide(next);
        }
      });
    }, { root: null, rootMargin: '150% 0px 150% 0px', threshold: 0.01 });

    const bootPrefetch = () => slideSelector().forEach(s => io.observe(s));
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootPrefetch, { once: true });
    } else {
      bootPrefetch();
    }

    /* ======================================================
     * 3) iOS: unmute na WYBORZE JĘZYKA (tak jak Android)
     * ====================================================== */
    const isIOS = () => /iP(hone|ad|od)/i.test(navigator.userAgent) ||
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function unlockAudioFromLangChoiceOnce() {
      if (!isIOS()) return;
      let unlocked = false;
      const handler = (ev) => {
        const t = ev.target.closest?.('[data-lang], .lang-option, .language-option, .lang-flag, [data-translate-lang]');
        if (!t) return;
        if (unlocked) return;
        unlocked = true;

        const vids = document.querySelectorAll('video');
        vids.forEach(v => {
          try {
            v.muted = false;
            const p = v.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } catch(e){}
        });

        document.removeEventListener('click', handler, true);
      };
      document.addEventListener('click', handler, true);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', unlockAudioFromLangChoiceOnce, { once: true });
    } else {
      unlockAudioFromLangChoiceOnce();
    }

  })();

// Main App Logic - runs after DOM is loaded
import { Config, slidesData } from './modules/config.js';
import State from './modules/state.js';
import Utils from './modules/utils.js';
import API from './modules/api.js';
import UI from './modules/ui.js';
import VideoManager from './modules/video.js';
import AccountPanel from './modules/account.js';
import Comments from './modules/comments.js';
import { initializeHandlers } from './modules/handlers.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI module first to ensure DOM elements are ready.
    UI.init();

    const App = (function() {
        async function _fetchAndUpdateSlideData() {
            const json = await API.fetchSlidesData();
            if (json.success && Array.isArray(json.data)) {
                const newDataMap = new Map(json.data.map(item => [String(item.likeId), item]));
                slidesData.forEach(existingSlide => {
                    const updatedInfo = newDataMap.get(String(existingSlide.likeId));
                    if (updatedInfo) {
                        existingSlide.isLiked = updatedInfo.isLiked;
                        existingSlide.initialLikes = updatedInfo.initialLikes;
                        UI.applyLikeStateToDom(existingSlide.likeId, existingSlide.isLiked, existingSlide.initialLikes);
                    }
                });
            }
        }

        function _startApp(selectedLang) {
            State.set('currentLang', selectedLang);
            localStorage.setItem('tt_lang', selectedLang);

            const slideElements = UI.renderSlides();

            UI.updateTranslations();
            const allSections = Array.from(document.querySelectorAll('.webyx-section:not([data-is-clone="true"])'));
            VideoManager.init(allSections, () => {
                UI.updateUIForLoginState();
                const currentSection = allSections[State.get('currentSlideIndex')];
                if (currentSection) {
                    VideoManager.updatePlaybackForLoginChange(currentSection);
                }
            });

            setTimeout(() => {
                UI.DOM.preloader.classList.add('preloader-hiding');
                UI.DOM.container.classList.add('ready');
                UI.DOM.preloader.addEventListener('transitionend', () => {
                    if (UI.DOM.preloader) UI.DOM.preloader.style.display = 'none';
                }, { once: true });
            }, 1000);

            if (slidesData.length > 0) {
                const viewHeight = window.innerHeight;
                UI.DOM.container.classList.add('no-transition');
                UI.DOM.container.scrollTo({ top: viewHeight, behavior: 'auto' });
                requestAnimationFrame(() => {
                    UI.DOM.container.classList.remove('no-transition');
                    UI.DOM.container.addEventListener('scroll', () => {
                        clearTimeout(window.scrollEndTimeout);
                        window.scrollEndTimeout = setTimeout(() => {
                            const physicalIndex = Math.round(UI.DOM.container.scrollTop / viewHeight);
                            if (physicalIndex === 0) {
                                UI.DOM.container.classList.add('no-transition');
                                UI.DOM.container.scrollTop = slidesData.length * viewHeight;
                                requestAnimationFrame(() => UI.DOM.container.classList.remove('no-transition'));
                            } else if (physicalIndex === slidesData.length + 1) {
                                UI.DOM.container.classList.add('no-transition');
                                UI.DOM.container.scrollTop = viewHeight;
                                requestAnimationFrame(() => UI.DOM.container.classList.remove('no-transition'));
                            }
                        }, 50);
                    }, { passive: true });
                });
            }
        }

        function _initializePreloader() {
            setTimeout(() => UI.DOM.preloader.classList.add('content-visible'), 500);
            UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(button => {
                button.addEventListener('click', () => {
                    UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(btn => btn.disabled = true);
                    button.classList.add('is-selected');
                    setTimeout(() => _startApp(button.dataset.lang), 300);
                }, { once: true });
            });
        }

        function _setInitialConfig() {
            try {
                const c = navigator.connection || navigator.webkitConnection;
                if (c?.saveData) Config.LOW_DATA_MODE = true;
                if (c?.effectiveType?.includes('2g')) Config.LOW_DATA_MODE = true;
                if (c?.effectiveType?.includes('3g')) Config.HLS.maxAutoLevelCapping = 480;
            } catch(_) {}
        }

        return {
            init: () => {
                _setInitialConfig();
                initializeHandlers({ fetchAndUpdateSlideData: _fetchAndUpdateSlideData });
                AccountPanel.init();
                Comments.init();
                _initializePreloader();
                document.body.classList.add('loaded');
            },
            fetchAndUpdateSlideData: _fetchAndUpdateSlideData,
        };
    })();

    App.init();
});
