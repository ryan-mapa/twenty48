// The end-of-game dialog. Replaces the original blocking alert(), which
// re-fired on every keypress after the board died.
//
// Two posting modes: signed in (the account owns the name) or anonymous (the
// player types one). Signing in is never required.
export default class Overlay {
    constructor(elements, { onPost, onPlayAgain, onSignIn }) {
        this.root = elements.root;
        this.scoreEl = elements.score;
        this.statusEl = elements.status;
        this.postButton = elements.post;
        this.nameField = elements.nameField;
        this.nameInput = elements.nameInput;
        this.signInLink = elements.signInLink;

        this.postButton.addEventListener('click', onPost);
        elements.playAgain.addEventListener('click', onPlayAgain);

        this.signInLink.addEventListener('click', event => {
            event.preventDefault();
            onSignIn();
        });

        // Enter in the name box posts, rather than doing nothing.
        this.nameInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') onPost();
            event.stopPropagation(); // arrow keys belong to the name box here
        });
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

    // Signed in: the name is fixed and the sign-in prompt is pointless.
    // Anonymous: offer the name box, prefilled with whatever they used last.
    setIdentity({ signedIn, rememberedName = '' }) {
        this.nameField.hidden = signedIn;
        this.signInLink.parentElement.hidden = signedIn;

        if (!signedIn) {
            this.nameInput.value = rememberedName;
            requestAnimationFrame(() => this.nameInput.focus());
        }
    }

    get name() {
        return this.nameInput.value.trim();
    }
}
