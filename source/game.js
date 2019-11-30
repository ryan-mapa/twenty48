import Tile from './tile';
import Board from './board';

const DIMENSIONS = 4; // 4x4

const DIRS = {
    'left': [0,-1],
    'right': [0,1],
    'up': [-1,0], 
    'down': [1,0]
};

const ORDER_DIRS = {
    'left': [0,-1],  // if diff < 0 start at DIM -1 else start at 3
    'right': [3,1],
    'up': [0,0],
    'down': [3,0]
};

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
        this.debouncedHandleKey = myDebounce(this.handleKeyPress, 250);
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
        this.checkLose();
        this.executeMoves(direction);
        this.addRandomTile();
    }

    checkLose() {
        let coords = this.buildMoveCoordForDir('up');
        let occupied = coords.filter(pos => !this.board.index(pos).isEmpty())
        console.log(occupied);
        
        // return occupied
    }

    findMovePos(currentPos, diff, initial) {
        let next = this.nextPos(currentPos, diff)
        let currCell = this.board.index(initial);
        
        if (this.inBounds(next)) {
            let nextCell = this.board.index(next);
            if(!nextCell.isEmpty()) {// if not empty                
                if (!nextCell.tile.compare(currCell.tile)) return currentPos;
            }
            return this.findMovePos(next, diff, initial);
        } else {
            return currentPos;
        }
    }

    move(tile, pos) {    
        // this.board.index(tile.pos).removeTile(tile);
        let prevCell = this.board.index(tile.pos);
        this.board.index(pos).insertTile(tile, prevCell);
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

    createBoard() {
        this.el.appendChild(this.board.el);
    }

    newGame() {
        let tile1 = new Tile(4, this.randomEmptyPos());
        this.board.insertTile(tile1);
        let tile2 = new Tile(2, this.randomEmptyPos());
        this.board.insertTile(tile2);
        let tile3 = new Tile(2, this.randomEmptyPos());
        this.board.insertTile(tile3);
    }

    addRandomTile() {
        let tile = new Tile(2, this.randomEmptyPos());
        this.board.insertTile(tile);
    }

    randomEmptyPos() {
        let x = Math.floor(Math.random() * DIMENSIONS);
        let y = Math.floor(Math.random() * DIMENSIONS);
        return this.board.grid[x][y].isEmpty() ? [x, y] : this.randomEmptyPos();        
    }

    executeMoves(dir) {
        let moves = this.buildMoveCoordForDir(dir);
        let diff = DIRS[dir];
        
        for (let coord of moves) {            
            if (this.board.index(coord).isEmpty()) continue;
            let tile = this.board.index(coord).tile;
            let next = this.findMovePos(coord, diff, coord);
            if (next != coord) this.move(tile, next);
        }
    }

    buildMoveCoordForDir(dir) {
        let moves = [];

        switch(dir) {
            case 'left':            
                for (let i = 0; i < DIMENSIONS; i++) {
                    for (let j = 0; j < DIMENSIONS; j++) {
                        moves.push([j,i]);
                    }    
                }    
                return moves;
            case 'right':            
                for (let i = (DIMENSIONS-1); i >= 0; i--) {
                    for (let j = (DIMENSIONS-1); j >= 0; j--) {
                        moves.push([j,i]);
                    }    
                }    
                return moves;
            case 'up':            
                for (let i = 0; i < DIMENSIONS; i++) {
                    for (let j = 0; j < DIMENSIONS; j++) {
                        moves.push([i,j]);
                    }    
                }    
                return moves;
            case 'down':            
                for (let i = (DIMENSIONS-1); i >= 0; i--) {
                    for (let j = (DIMENSIONS-1); j >= 0; j--) {
                        moves.push([i, j]);
                    }
                }     
                return moves;
        }
    }

}

export default Game;