// const game = require('./source/game.js');
import Game from './source/game';

document.addEventListener('DOMContentLoaded', () => {
    let cells = document.querySelectorAll('.cell');
    let rootEl = document.getElementById('g2048');

    for (let cell of cells) {
        cell.addEventListener('click', () => {
            console.log(cell.id)
        })
    }


    document.addEventListener('keydown', e => {        
        console.log(game.name);

        if (e.keyCode == 37) {
            console.log('left');
        }
        if (e.keyCode == 38) {
            console.log('up');
        }
        if (e.keyCode == 39) {
            console.log('right');
        }
        if (e.keyCode == 40) {
            console.log('down');
        }

    })

    let game = new Game(rootEl);
    window.game = game;
})