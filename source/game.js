import Tile from './tile';
import Board from './board';

const DIMENSIONS = 4; // 4x4

const DIRS = {
    'left': [0,-1],
    'right': [0,1],
    'up': [-1,0],
    'down': [1,0]
}

const myDebounce = function(cb, interval) {
    let flag = true;
    return (...callArgs) => {
        if (flag) {
            flag = false;
            cb(...callArgs);
            setTimeout(() => (flag = true), interval);
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

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.debouncedHandleKey = myDebounce(this.handleKeyPress, 500);
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
    

    handleKeyPress(direction) { 
        console.log(direction);
        let diff = DIRS[direction];
        let nextMove = this.findMovePos(this.tile.pos, diff); // test tile
        this.move(this.tile, nextMove);
    }

    findMovePos(currentPos, diff, first = true) {
        let next = this.nextPos(currentPos, diff)

        if (this.nextSpotMovable(currentPos, diff)) {
            return this.findMovePos(next, diff, false);
        } else {
            // console.log('final: ', currentPos);
            return currentPos;
        }
    }

    move(tile, pos) {    
        this.board.index(pos).insertTile(tile);
        tile.pos = pos;
    }

    inBounds(pos) {
        let [x, y] = pos;
        if (x >= DIMENSIONS || x < 0 || y >= DIMENSIONS || y < 0) return false;
        return true;
    }

    nextPos(curr, diff) {
        return [curr[0] + diff[0], curr[1] + diff[1]];
    }

    nextSpotMovable(currentPos, dir) {
        let next = this.nextPos(currentPos, dir);
        // console.log(next)
        if (this.inBounds(next)) {
            // return this.board.index(next).isEmpty() ? true : false
            return true;
        } else {
            return false;
        }
    }

    createBoard() {
        this.el.appendChild(this.board.el);
    }

    newGame() {
        this.tile = new Tile(2048, this.randomEmptyPos());
        window.tile = this.tile;
        this.board.insertTile(this.tile);
        // let tile1 = new Tile(2048, this.randomEmptyPos());
        // this.board.insertTile(tile1);
        // let tile2 = new Tile(2, this.randomEmptyPos());
        // this.board.insertTile(tile2);
    }

    randomEmptyPos() {
        let x = Math.floor(Math.random() * DIMENSIONS);
        let y = Math.floor(Math.random() * DIMENSIONS);
        return this.board.grid[x][y].isEmpty() ? [x, y] : this.randomEmptyPos();        
    }

}

export default Game;