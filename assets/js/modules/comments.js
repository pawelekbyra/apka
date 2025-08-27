import API from './api.js';
import UI from './ui.js';
import State from './state.js';

const Comments = (function() {
    const DOM = {
        modal: document.getElementById('commentsModal'),
        closeButton: document.querySelector('#commentsModal .modal-close-btn'),
        title: document.getElementById('commentsTitle'),
        list: document.querySelector('#commentsModal .modal-body'),
        content: document.querySelector('#commentsModal .modal-content'),
    };

    let currentPostId = null;

    function _renderComment(comment) {
        const commentEl = document.createElement('div');
        commentEl.classList.add('comment-item');

        // Formatowanie daty, aby była bardziej przyjazna
        const date = new Date(comment.timestamp);
        const timeAgo = UI.formatTimeAgo(date, State.get('currentLang', 'pl'));

        commentEl.innerHTML = `
            <div class="comment-avatar">
                <img src="${comment.avatar}" alt="${comment.author}" loading="lazy">
            </div>
            <div class="comment-content-wrapper">
                <strong class="comment-author">${comment.author}</strong>
                <p class="comment-text">${comment.text}</p>
                <span class="comment-timestamp">${timeAgo}</span>
            </div>
        `;
        return commentEl;
    }

    async function _fetchAndRenderComments(postId) {
        DOM.list.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;
        try {
            const comments = await API.fetchComments(postId);

            // Wyczyść tylko listę, a nie cały modal-body
            const existingList = DOM.list.querySelector('.comments-list');
            if (existingList) {
                existingList.innerHTML = '';
            } else {
                DOM.list.innerHTML = ''; // Wyczyść loader
            }

            if (!existingList) {
                 const newList = document.createElement('div');
                 newList.className = 'comments-list';
                 DOM.list.appendChild(newList);
            }

            const listContainer = DOM.list.querySelector('.comments-list');

            if (comments.length === 0) {
                listContainer.innerHTML = `<p class="empty-state" data-translate-key="noComments">Brak komentarzy. Bądź pierwszy!</p>`;
            } else {
                comments.forEach(comment => {
                    listContainer.appendChild(_renderComment(comment));
                });
            }
            UI.updateTranslations(DOM.modal);

        } catch (error) {
            console.error('Error fetching comments:', error);
            DOM.list.innerHTML = `<p class="error-state" data-translate-key="errorLoadComments">Nie udało się załadować komentarzy.</p>`;
            UI.updateTranslations(DOM.modal);
        }
    }

    function _handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const input = form.querySelector('.comment-input');
        const button = form.querySelector('button');
        const commentText = input.value.trim();

        if (!commentText || !currentPostId) {
            return;
        }

        input.disabled = true;
        button.disabled = true;

        API.addComment(currentPostId, commentText)
            .then(response => {
                if (response.success) {
                    input.value = '';
                    _fetchAndRenderComments(currentPostId);

                    const slideData = State.getSlideDataByLikeId(currentPostId);
                    if (slideData && response.data.newCount !== undefined) {
                        slideData.initialComments = response.data.newCount;
                        UI.updateCommentCount(currentPostId, response.data.newCount);
                    }
                } else {
                    UI.showAlert(response.data.message || 'Failed to add comment', 'error');
                }
            })
            .catch(error => {
                console.error('Error adding comment:', error);
                UI.showAlert('Error adding comment', 'error');
            })
            .finally(() => {
                input.disabled = false;
                button.disabled = false;
                input.focus();
            });
    }

    function _createCommentForm() {
        const formContainer = document.createElement('div');
        formContainer.classList.add('comment-form-container');
        formContainer.innerHTML = `
            <form class="comment-form">
                <input type="text" class="comment-input" name="comment" data-translate-placeholder="addCommentPlaceholder" placeholder="Dodaj komentarz..." required autocomplete="off">
                <button type="submit" data-translate-aria-label="postCommentAriaLabel" aria-label="Opublikuj komentarz">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </button>
            </form>
        `;
        formContainer.querySelector('form').addEventListener('submit', _handleFormSubmit);
        return formContainer;
    }

    function open(postId) {
        currentPostId = postId;
        DOM.modal.removeAttribute('aria-hidden');
        document.body.classList.add('modal-open');
        UI.updateTranslations(DOM.modal);
        _fetchAndRenderComments(postId);
        setTimeout(() => DOM.content.querySelector('.comment-input')?.focus(), 300);
    }

    function close() {
        DOM.modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        DOM.list.innerHTML = '';
        currentPostId = null;
    }

    function init() {
        if (!DOM.modal) return;

        const form = _createCommentForm();
        DOM.content.appendChild(form);

        DOM.closeButton.addEventListener('click', close);
        DOM.modal.addEventListener('click', (e) => {
            if (e.target === DOM.modal) {
                close();
            }
        });
    }

    return {
        init,
        open,
        close
    };
})();

export default Comments;
