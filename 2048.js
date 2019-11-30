// const game = require('./source/game.js');
import Game from './source/game';

document.addEventListener('DOMContentLoaded', () => {
    let cells = document.querySelectorAll('.cell');
    let rootEl = document.getElementById('g2048');

    for (let cell of cells) {
        cell.addEventListener('click', () => {

        })
    }

    let game = new Game(rootEl);
    window.game = game;
})