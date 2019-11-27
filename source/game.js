import Tile from './tile';
import Board from './board';

const DIMENSIONS = 4; // 4x4

const DIRS = {
    'left': [-1,0],
    'right': [1,0],
    'up': [0,1],
    'down': [0,-1]
}

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

        this.debouncedHandleKey = myDebounce(this.handleKeyPress, 1000);
        window.inBounds = this.inBounds;
    }
    
    addEventListeners() {
        document.addEventListener('keydown', e => {
            if (e.keyCode == 37) {
                this.debouncedHandleKey('left');
            }
            if (e.keyCode == 38) {
                this.debouncedHandleKey('up');
            }
            if (e.keyCode == 39) {
                this.debouncedHandleKey('right');
            }
            if (e.keyCode == 40) {
                this.debouncedHandleKey('down');
            }
        })
    }
    

    handleKeyPress(key) { 
        console.log(key);
    }

    move(dir) {
        let diff = DIRS[dir];
        
    }

    inBounds(pos) {
        let [x, y] = pos;
        if (x >= DIMENSIONS || x < 0 || y > DIMENSIONS || y < 0) return false;
        return true;
    }

    checkDirs(tile, dir) {
        let [dx, dy] = dir;
        let currentPos = tile.pos;

    }

    createBoard() {
        this.el.appendChild(this.board.el);
    }

    newGame() {
        let tile1 = new Tile(2048, this.randomEmptyPos());
        this.board.insertTile(tile1);
        let tile2 = new Tile(2, this.randomEmptyPos());
        this.board.insertTile(tile2);
    }

    randomEmptyPos() {
        let x = Math.floor(Math.random() * DIMENSIONS);
        let y = Math.floor(Math.random() * DIMENSIONS);
        return this.board.grid[x][y].isEmpty() ? [x, y] : this.randomEmptyPos();        
    }

}

export default Game;