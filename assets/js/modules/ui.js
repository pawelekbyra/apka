import State from './state.js';
import Utils from './utils.js';
import { slidesData, Config } from './config.js';
import VideoManager from './video.js';

const UI = (function() {
    const DOM = {
        container: null,
        template: null,
        preloader: null,
        alertBox: null,
        alertText: null,
        infoModal: null,
        commentsModal: null,
        accountModal: null,
        notificationPopup: null,
        masterUIContainer: null,
        masterTopbar: null,
        masterSidebar: null,
        masterBottombar: null,
        masterLoginPanel: null,
        masterLoggedInMenu: null,
    };

    function init() {
        // Query for all DOM elements once the DOM is ready
        DOM.container = document.getElementById('webyx-container');
        DOM.template = document.getElementById('slide-template');
        DOM.preloader = document.getElementById('preloader');
        DOM.alertBox = document.getElementById('alertBox');
        DOM.alertText = document.getElementById('alertText');
        DOM.infoModal = document.getElementById('infoModal');
        DOM.commentsModal = document.getElementById('commentsModal');
        DOM.accountModal = document.getElementById('accountModal');
        DOM.notificationPopup = document.getElementById('notificationPopup');
        DOM.masterUIContainer = document.getElementById('master-ui-components');

        if (DOM.masterUIContainer) {
            DOM.masterTopbar = DOM.masterUIContainer.querySelector('.topbar');
            DOM.masterSidebar = DOM.masterUIContainer.querySelector('.sidebar');
            DOM.masterBottombar = DOM.masterUIContainer.querySelector('.bottombar');
            DOM.masterLoginPanel = DOM.masterUIContainer.querySelector('.login-panel');
            DOM.masterLoggedInMenu = DOM.masterUIContainer.querySelector('.logged-in-menu');
        }
    }

    let alertTimeout;
    let currentSlideWithUI = null;

    function attachUIToSlide(slideElement) {
        if (!slideElement || currentSlideWithUI === slideElement) {
            return;
        }

        const slideData = slidesData[slideElement.dataset.index];
        if (!slideData) return;

        // 1. Update content of master UI elements
        const profileImg = DOM.masterSidebar.querySelector('.profileButton img');
        if(profileImg) profileImg.src = slideData.avatar;

        const userText = DOM.masterBottombar.querySelector('.text-user');
        if(userText) userText.textContent = slideData.user;

        const descText = DOM.masterBottombar.querySelector('.text-description');
        if(descText) descText.textContent = slideData.description;

        const likeBtn = DOM.masterSidebar.querySelector('.like-button');
        if(likeBtn) {
            likeBtn.dataset.likeId = slideData.likeId;
            updateLikeButtonState(likeBtn, slideData.isLiked, slideData.initialLikes);
        }

        const commentsBtn = DOM.masterSidebar.querySelector('.commentsButton');
        if(commentsBtn) {
            commentsBtn.dataset.likeId = slideData.likeId;
            updateCommentCount(slideData.likeId, slideData.initialComments);
        }

        // 2. Move master UI into the slide's placeholders
        const topbarPlaceholder = slideElement.querySelector('.topbar-placeholder');
        const sidebarPlaceholder = slideElement.querySelector('.sidebar-placeholder');
        const bottombarPlaceholder = slideElement.querySelector('.bottombar-placeholder');

        if (topbarPlaceholder) {
            topbarPlaceholder.appendChild(DOM.masterTopbar);
            topbarPlaceholder.appendChild(DOM.masterLoginPanel);
            topbarPlaceholder.appendChild(DOM.masterLoggedInMenu);
        }
        if (sidebarPlaceholder) {
            sidebarPlaceholder.appendChild(DOM.masterSidebar);
        }
        if (bottombarPlaceholder) {
            bottombarPlaceholder.appendChild(DOM.masterBottombar);
        }

        currentSlideWithUI = slideElement;
    }

    function initMasterUI() {
        const renderedForm = document.getElementById('um-login-render-container');
        if (DOM.masterLoginPanel && renderedForm) {
            DOM.masterLoginPanel.innerHTML = renderedForm.innerHTML;
            const form = DOM.masterLoginPanel.querySelector('.login-form');
            if (form) {
                form.querySelector('label[for="user_login"]')?.remove();
                form.querySelector('#user_login')?.setAttribute('placeholder', 'Login');
                form.querySelector('label[for="user_pass"]')?.remove();
                form.querySelector('#user_pass')?.setAttribute('placeholder', 'Hasło');
                const submitButton = form.querySelector('#wp-submit');
                if (submitButton) submitButton.value = 'ENTER';
            }
        }
    }

    function showAlert(message, isError = false) {
        if (!DOM.alertBox || !DOM.alertText) return;
        clearTimeout(alertTimeout);
        DOM.alertBox.style.animation = 'none';
        requestAnimationFrame(() => {
            DOM.alertBox.style.animation = '';
            DOM.alertText.textContent = message;
            DOM.alertBox.style.backgroundColor = isError ? 'var(--accent-color)' : 'rgba(0, 0, 0, 0.85)';
            DOM.alertBox.classList.add('visible');
        });
        alertTimeout = setTimeout(() => DOM.alertBox.classList.remove('visible'), 3000);
    }

    function getFocusable(node) {
        if (!node) return [];
        return Array.from(node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    }

    function trapFocus(modal) {
        const focusable = getFocusable(modal);
        if (focusable.length === 0) return () => {};
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === first) { last.focus(); e.preventDefault(); }
            } else {
                if (document.activeElement === last) { first.focus(); e.preventDefault(); }
            }
        };
        modal.addEventListener('keydown', handleKeyDown);
        return () => modal.removeEventListener('keydown', handleKeyDown);
    }

    function openModal(modal) {
        State.set('lastFocusedElement', document.activeElement);
        DOM.container.setAttribute('aria-hidden', 'true');
        modal.classList.add('visible');
        modal.setAttribute('aria-hidden', 'false');
        const focusable = getFocusable(modal);
        (focusable.length > 0 ? focusable[0] : modal.querySelector('.modal-content'))?.focus();
        modal._focusTrapDispose = trapFocus(modal);
    }

    function closeModal(modal) {
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
        if (modal._focusTrapDispose) { modal._focusTrapDispose(); delete modal._focusTrapDispose; }
        DOM.container.removeAttribute('aria-hidden');
        State.get('lastFocusedElement')?.focus();
    }

    function updateLikeButtonState(likeButton, liked, count) {
        if (!likeButton) return;
        const likeCountEl = likeButton.querySelector('.like-count');
        likeButton.classList.toggle('active', liked);
        likeButton.setAttribute('aria-pressed', String(liked));
        if (likeCountEl) {
            likeCountEl.textContent = Utils.formatCount(count);
            likeCountEl.dataset.rawCount = String(count);
        }
        const translationKey = liked ? 'unlikeAriaLabelWithCount' : 'likeAriaLabelWithCount';
        const label = Utils.getTranslation(translationKey).replace('{count}', Utils.formatCount(count));
        likeButton.setAttribute('aria-label', label);
    }

    function applyLikeStateToDom(likeId, liked, count) {
        document.querySelectorAll(`.like-button[data-like-id="${likeId}"]`).forEach(btn => updateLikeButtonState(btn, liked, count));
    }

    function updateUIForLoginState() {
        const isLoggedIn = State.get('isUserLoggedIn');
        document.body.classList.toggle('is-logged-in', isLoggedIn);

        // 1. Update the single master UI components
        DOM.masterTopbar.querySelector('.central-text-wrapper')?.classList.toggle('with-arrow', !isLoggedIn);
        DOM.masterLoginPanel.classList.remove('active');
        DOM.masterTopbar.classList.remove('login-panel-active');
        DOM.masterLoggedInMenu.classList.remove('active');
        const topbarText = DOM.masterTopbar.querySelector('.topbar-text');
        if (topbarText) {
            topbarText.textContent = isLoggedIn ? Utils.getTranslation('loggedInText') : Utils.getTranslation('loggedOutText');
        }

        // 2. Update the like button state based on the *currently attached* slide's data
        const likeBtn = DOM.masterSidebar.querySelector('.like-button');
        if (likeBtn && currentSlideWithUI) {
            const slideData = slidesData[currentSlideWithUI.dataset.index];
            if (slideData) {
                updateLikeButtonState(likeBtn, !!(slideData.isLiked && isLoggedIn), Number(slideData.initialLikes || 0));
            }
        }

        // 3. Loop through all sections to update parts that are unique to each slide (e.g., secret overlays)
        document.querySelectorAll('.webyx-section').forEach((section) => {
            const sim = section.querySelector('.tiktok-symulacja');
            if (!sim) return;
            sim.classList.toggle('is-logged-in', isLoggedIn);

            const isSecret = sim.dataset.access === 'secret';
            const showSecretOverlay = isSecret && !isLoggedIn;

            section.querySelector('.secret-overlay')?.classList.toggle('visible', showSecretOverlay);
            section.querySelector('.videoPlayer')?.classList.toggle('secret-active', showSecretOverlay);
        });
    }

    function updateTranslations() {
        const lang = State.get('currentLang');
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-translate-key]').forEach(el => el.textContent = Utils.getTranslation(el.dataset.translateKey));
        document.querySelectorAll('[data-translate-aria-label]').forEach(el => el.setAttribute('aria-label', Utils.getTranslation(el.dataset.translateAriaLabel)));
        document.querySelectorAll('[data-translate-title]').forEach(el => el.setAttribute('title', Utils.getTranslation(el.dataset.translateTitle)));
        updateUIForLoginState();
    }

    function updateCommentCount(likeId, count) {
        document.querySelectorAll(`.webyx-section .commentsButton[data-like-id="${likeId}"]`).forEach(btn => {
            let countEl = btn.querySelector('.comment-count');
            if (!countEl) {
                countEl = document.createElement('div');
                countEl.className = 'comment-count icon-label';
                btn.appendChild(countEl);
            }
            countEl.textContent = Utils.formatCount(count);
        });
    }

    function formatTimeAgo(date, lang = 'pl') {
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

        if (seconds < 60) return rtf.format(-seconds, 'second');
        if (minutes < 60) return rtf.format(-minutes, 'minute');
        if (hours < 24) return rtf.format(-hours, 'hour');
        return rtf.format(-days, 'day');
    }

    function createSlideElement(slideData, index) {
        const slideFragment = DOM.template.content.cloneNode(true);
        const section = slideFragment.querySelector('.webyx-section');
        section.dataset.index = index;
        section.dataset.slideId = slideData.id;

        // Set only the data unique to the slide's own structure
        section.querySelector('.tiktok-symulacja').dataset.access = slideData.access;
        const videoPlayer = section.querySelector('.videoPlayer');
        videoPlayer.poster = slideData.poster || Config.LQIP_POSTER;

        // Initialize listeners for this specific video element
        VideoManager.initVideoElementListeners(videoPlayer);

        return section;
    }

    function renderSlides() {
        DOM.container.innerHTML = '';
        if (slidesData.length === 0) return [];

        const addClone = (slideData, index) => {
            const clone = createSlideElement(slideData, index);
            clone.dataset.isClone = 'true';
            DOM.container.appendChild(clone);
        };

        addClone(slidesData[slidesData.length - 1], slidesData.length - 1);
        const slideElements = slidesData.map((data, index) => {
            const el = createSlideElement(data, index);
            DOM.container.appendChild(el);
            return el;
        });
        addClone(slidesData[0], 0);

        return slideElements;
    }

    return {
        init, // Expose the new init function
        DOM,
        showAlert,
        openModal,
        closeModal,
        updateUIForLoginState,
        updateTranslations,
        applyLikeStateToDom,
        renderSlides,
        updateCommentCount,
        formatTimeAgo,
        initMasterUI,
        attachUIToSlide,
    };
})();

export default UI;
