import Tile from './tile';
import Board from './board';

const DIMENSIONS = 4; // 4x4

const myDebounce = function(cb, interval) {
    let flag = true;
    return (...callArgs) => {
        if (flag) {
            flag = false;
            cb(...callArgs);
            setTimeout(() => flag = true, interval);
        }
    }
}

class Game {
    constructor(el, board = new Board(DIMENSIONS)) {
        this.el = el;
        this.board = board;
    
        this.createBoard();
        this.addEventListeners();
        this.newGame();

        this.debouncedHandleKey = myDebounce(this.handleKeyPress, 2000);
    }
    
    
    addEventListeners() {
        document.addEventListener('keydown', e => {
            if (e.keyCode == 37) {
                this.debouncedHandleKey('left')
            }
            if (e.keyCode == 38) {
                this.handleKeyPress('up');
            }
            if (e.keyCode == 39) {
                this.handleKeyPress('right');
            }
            if (e.keyCode == 40) {
                this.handleKeyPress('down');
            }
        })
    }
    

    handleKeyPress(key) { 
        console.log(key);
    }

    move() {

    }

    createBoard() {
        this.el.appendChild(this.board.el);
    }

    newGame() {
        let tile1 = new Tile(2048);
        let tile2 = new Tile(2);
        this.board.insertTile(tile1, this.randomEmptyPos());
        this.board.insertTile(tile2, this.randomEmptyPos());
    }

    randomEmptyPos() {
        let x = Math.floor(Math.random() * DIMENSIONS);
        let y = Math.floor(Math.random() * DIMENSIONS);
        return this.board.grid[x][y].isEmpty() ? [x, y] : this.randomEmptyPos();        
    }

}

export default Game;