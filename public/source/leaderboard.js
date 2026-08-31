import { fetchScores } from './api.js';

// Renders the top scores. Everything here comes from the server, which
// derived each number by replaying that player's move log.
export default class Leaderboard {
    constructor(listEl, statusEl) {
        this.listEl = listEl;
        this.statusEl = statusEl;
    }

    async refresh(highlightName = null) {
        try {
            const { scores } = await fetchScores();
            this.render(scores, highlightName);
        } catch (error) {
            this.listEl.replaceChildren();
            this.statusEl.textContent = `Leaderboard unavailable (${error.message})`;
        }
    }

    render(scores, highlightName) {
        this.listEl.replaceChildren();

        if (!scores || scores.length === 0) {
            this.statusEl.textContent = 'No scores yet — be the first.';
            return;
        }

        this.statusEl.textContent = '';

        for (const entry of scores) {
            const row = document.createElement('li');
            if (entry.display_name === highlightName) row.classList.add('is-you');

            const name = document.createElement('span');
            name.className = 'entry-name';
            name.textContent = entry.display_name;

            // Every score here is replay-verified; the tick marks that the
            // *name* is owned by an account rather than freely typed.
            if (entry.verified) {
                const tick = document.createElement('span');
                tick.className = 'entry-verified';
                tick.textContent = '✓';
                tick.title = 'Posted from a signed-in account';
                name.appendChild(tick);
            }

            const score = document.createElement('span');
            score.className = 'entry-score';
            score.textContent = entry.score.toLocaleString();

            row.append(name, score);
            this.listEl.appendChild(row);
        }
    }
}
