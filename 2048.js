// const game = require('./source/game.js');
import Game from './source/game';

document.addEventListener('DOMContentLoaded', () => {
    let cells = document.querySelectorAll('.cell');
    let rootEl = document.getElementById('g2048');
    let scoreCounter = document.getElementById('score');

    for (let cell of cells) {
        cell.addEventListener('click', () => {

        })
    }

    let game = new Game(rootEl, scoreCounter);
    window.game = game;
})