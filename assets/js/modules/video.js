import State from './state.js';
import { Config, slidesData } from './config.js';
import Utils from './utils.js';
import UI from './ui.js';

const VideoManager = (function() {
    let hlsPromise = null;
    const hlsInstances = new Map();
    const attachedSet = new WeakSet();
    let playObserver, lazyObserver;

    function _loadHlsLibrary() {
        if (window.Hls) return Promise.resolve();
        if (!hlsPromise) {
            hlsPromise = import('https://cdn.jsdelivr.net/npm/hls.js@1.5.14/dist/hls.min.js')
                .catch(err => {
                    console.error("Failed to load HLS.js", err);
                    hlsPromise = null;
                    throw err;
                });
        }
        return hlsPromise;
    }

    function _guardedPlay(videoEl) {
        if ((Date.now() - State.get('lastUserGestureTimestamp')) < Config.GESTURE_GRACE_PERIOD_MS) {
            const playPromise = videoEl.play();
            if (playPromise) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn("Autoplay was blocked by the browser.", error);
                        State.set('isAutoplayBlocked', true);
                    }
                });
            }
        }
    }

    function _attachSrc(sectionEl) {
        const video = sectionEl.querySelector('.videoPlayer');
        if (!video || attachedSet.has(video)) return;
        const slideId = sectionEl.dataset.slideId;
        const slideData = slidesData.find(s => s.id === slideId);

        const canAttach = slideData && !(slideData.access === 'secret' && !State.get('isUserLoggedIn'));
        if (!canAttach) return;

        const setMp4Source = (mp4Url) => {
            if (!mp4Url) return;
            const finalUrl = Utils.toRelativeIfSameOrigin(Utils.fixProtocol(mp4Url));
            const sourceEl = video.querySelector('source');
            if (sourceEl) { sourceEl.src = finalUrl; sourceEl.type = 'video/mp4'; }
            video.load();
        };

        if (Config.USE_HLS && slideData.hlsUrl) {
            const finalHlsUrl = Utils.toRelativeIfSameOrigin(Utils.fixProtocol(slideData.hlsUrl));
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                const sourceEl = video.querySelector('source');
                if(sourceEl) { sourceEl.src = finalHlsUrl; sourceEl.type = 'application/vnd.apple.mpegurl'; }
                video.load();
            } else {
                _loadHlsLibrary().then(() => {
                    if (window.Hls?.isSupported()) {
                        if (hlsInstances.has(slideId)) hlsInstances.get(slideId).destroy();
                        const hls = new window.Hls(Config.HLS);
                        hls.loadSource(finalHlsUrl);
                        hls.attachMedia(video);
                        hls.on(window.Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) {
                               hls.destroy(); hlsInstances.delete(slideId); setMp4Source(slideData.mp4Url);
                            }
                        });
                        hlsInstances.set(slideId, hls);
                    } else {
                        setMp4Source(slideData.mp4Url);
                    }
                }).catch(() => setMp4Source(slideData.mp4Url));
            }
        } else {
            setMp4Source(slideData.mp4Url);
        }

        attachedSet.add(video);
    }

    function _detachSrc(sectionEl) {
        const video = sectionEl.querySelector('.videoPlayer');
        if (!video) return;
        try { video.pause(); } catch(e) {}
        const slideId = sectionEl.dataset.slideId;
        if (slideId && hlsInstances.has(slideId)) {
          try { hlsInstances.get(slideId).destroy(); } catch(e){}
          hlsInstances.delete(slideId);
        }
        const sourceEl = video.querySelector('source');
        if (sourceEl) { sourceEl.removeAttribute('src'); }
        video.removeAttribute('src');
        video.load();
        attachedSet.delete(video);
    }

    function _startProgressUpdates(video) {
        _stopProgressUpdates(video);
        const session = State.get('activeVideoSession');
        const updateFn = () => {
            if (session !== State.get('activeVideoSession') || !video.duration) return;
            _updateProgressUI(video);
            if (!video.paused) {
                video.rAF_id = requestAnimationFrame(updateFn);
            }
        };
        updateFn();
    }

    function _stopProgressUpdates(video) {
        if (video.rAF_id) cancelAnimationFrame(video.rAF_id);
    }

    function _updateProgressUI(video) {
        if (State.get('isDraggingProgress') || !video || !video.duration) return;
        const section = video.closest('.webyx-section');
        if (!section) return;
        const percent = (video.currentTime / video.duration) * 100;
        section.querySelector('.progress-line').style.width = `${percent}%`;
        section.querySelector('.progress-dot').style.left = `${percent}%`;
        section.querySelector('.video-progress').setAttribute('aria-valuenow', String(Math.round(percent)));
    };

    function _onActiveSlideChanged(newIndex, oldIndex = -1, allSections) {
        State.set('activeVideoSession', State.get('activeVideoSession') + 1);

        if (oldIndex > -1 && oldIndex < allSections.length) {
            const oldSection = allSections[oldIndex];
            const oldVideo = oldSection.querySelector('.videoPlayer');
            if (oldVideo) { oldVideo.pause(); _stopProgressUpdates(oldVideo); }
            oldSection.querySelector('.pause-icon')?.classList.remove('visible');
            // The progress bar is now part of the master UI, so we don't need to reset it per slide here.
        }

        if (newIndex < allSections.length) {
            const newSection = allSections[newIndex];

            // Attach the master UI to the new active slide
            UI.attachUIToSlide(newSection);

            const newVideo = newSection.querySelector('.videoPlayer');
            const isSecret = newSection.querySelector('.tiktok-symulacja').dataset.access === 'secret';

            if (!(isSecret && !State.get('isUserLoggedIn')) && !State.get('isAutoplayBlocked')) {
                _guardedPlay(newVideo);
            }
        }
    }

    return {
        init: (sections, onSlideChangeCallback) => {
            lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const section = entry.target.closest('.webyx-section');
                    if (!section) return;
                    if (entry.isIntersecting) {
                        _attachSrc(section);
                    } else if (Config.UNLOAD_FAR_SLIDES) {
                        const index = parseInt(section.dataset.index, 10);
                        const distance = Math.abs(index - State.get('currentSlideIndex'));
                        if (distance > Config.FAR_DISTANCE) _detachSrc(section);
                    }
                });
            }, { root: document.getElementById('webyx-container'), rootMargin: Config.PREFETCH_MARGIN, threshold: 0.01 });
            sections.forEach(sec => lazyObserver.observe(sec));

            playObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const newIndex = parseInt(entry.target.dataset.index, 10);
                        if (newIndex !== State.get('currentSlideIndex')) {
                            const oldIndex = State.get('currentSlideIndex');
                            State.set('currentSlideIndex', newIndex);
                            _onActiveSlideChanged(newIndex, oldIndex, sections);
                            if(onSlideChangeCallback) onSlideChangeCallback();
                        }
                    }
                });
            }, { root: document.getElementById('webyx-container'), threshold: 0.75 });

            sections.forEach(section => playObserver.observe(section));
        },
        initProgressBar: (progressEl, videoEl) => {
            if (!progressEl || !videoEl) return;

            // Attach listeners to the video element, which is always unique for this call
            videoEl.addEventListener('loadedmetadata', () => {
                // Only remove skeleton if the video is for the currently active slide
                if (UI.DOM.masterBottombar.contains(progressEl)) {
                    progressEl.classList.remove('skeleton');
                }
                _updateProgressUI(videoEl);
            }, { once: true });

            videoEl.addEventListener('play', () => _startProgressUpdates(videoEl));
            videoEl.addEventListener('pause', () => _stopProgressUpdates(videoEl));

            // Only attach listeners to the progress bar element ONCE
            if (progressEl.dataset.initialized) {
                return;
            }
            progressEl.dataset.initialized = 'true';
            progressEl.classList.add('skeleton');

            let pointerId = null;
            const seek = (e) => {
                const rect = progressEl.getBoundingClientRect();
                const x = ('clientX' in e ? e.clientX : (e.touches?.[0]?.clientX || 0));
                const percent = ((x - rect.left) / rect.width) * 100;
                const clamped = Math.max(0, Math.min(100, percent));
                if (videoEl.duration) videoEl.currentTime = (clamped / 100) * videoEl.duration;
                _updateProgressUI(videoEl);
            };

            progressEl.addEventListener('pointerdown', (e) => {
                if (pointerId !== null) return;
                pointerId = e.pointerId;
                State.set('isDraggingProgress', true);
                progressEl.classList.add('dragging');
                progressEl.setPointerCapture(pointerId);
                seek(e);
            });

            progressEl.addEventListener('pointermove', (e) => {
                if (e.pointerId !== pointerId) return;
                seek(e);
            });

            const endDrag = (e) => {
                if (e.pointerId !== pointerId) return;
                pointerId = null;
                State.set('isDraggingProgress', false);
                progressEl.classList.remove('dragging');
                _startProgressUpdates(videoEl);
            };
            progressEl.addEventListener('pointerup', endDrag);
            progressEl.addEventListener('pointercancel', endDrag);

            progressEl.addEventListener('keydown', (e) => {
                if (!videoEl.duration) return;
                const step = videoEl.duration * 0.05; // 5% jump
                let newTime;
                switch (e.key) {
                    case 'ArrowLeft':
                        newTime = videoEl.currentTime - step;
                        break;
                    case 'ArrowRight':
                        newTime = videoEl.currentTime + step;
                        break;
                    case 'Home':
                        newTime = 0;
                        break;
                    case 'End':
                        newTime = videoEl.duration;
                        break;
                    default:
                        return;
                }
                videoEl.currentTime = Math.max(0, Math.min(newTime, videoEl.duration));
                _updateProgressUI(videoEl); // Update UI immediately on key press
                e.preventDefault();
            });
        },
        updatePlaybackForLoginChange: (section) => {
            const video = section.querySelector('.videoPlayer');
            const hasSrc = video.querySelector('source')?.getAttribute('src') || video.getAttribute('src');
            const isSecret = section.querySelector('.tiktok-symulacja').dataset.access === 'secret';

            if (!isSecret && !hasSrc) _attachSrc(section);

            if (isSecret && !State.get('isUserLoggedIn')) {
                video.pause();
                _stopProgressUpdates(video);
                video.currentTime = 0;
                _updateProgressUI(video);
            } else if (video.paused && document.body.classList.contains('loaded') && !State.get('isDraggingProgress') && !State.get('isAutoplayBlocked')) {
               _guardedPlay(video);
            }
        },
        handleVideoClick: (video) => {
            if (State.get('isDraggingProgress')) return;
            const pauseIcon = video.closest('.webyx-section')?.querySelector('.pause-icon');
            if (video.paused) {
                _guardedPlay(video);
                pauseIcon?.classList.remove('visible');
            } else {
                video.pause();
                pauseIcon?.classList.add('visible');
            }
        },
    };
})();

export default VideoManager;
