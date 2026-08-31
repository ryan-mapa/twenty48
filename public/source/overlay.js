// The end-of-game dialog. Replaces the original blocking alert(), which
// re-fired on every keypress after the board died.
export default class Overlay {
    constructor(elements, { onPost, onPlayAgain }) {
        this.root = elements.root;
        this.scoreEl = elements.score;
        this.statusEl = elements.status;
        this.postButton = elements.post;

        this.postButton.addEventListener('click', onPost);
        elements.playAgain.addEventListener('click', onPlayAgain);
    }

    show(score) {
        this.scoreEl.textContent = score.toLocaleString();
        this.root.hidden = false;
    }

    hide() {
        this.root.hidden = true;
        this.statusEl.textContent = '';
    }

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    setPost(label, enabled) {
        this.postButton.textContent = label;
        this.postButton.disabled = !enabled;
        this.postButton.hidden = !label;
    }
}
