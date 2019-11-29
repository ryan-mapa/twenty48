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
        this.debouncedHandleKey = myDebounce(this.handleKeyPress, 500);

        //testing
        window.buildMoveCoordForDir = this.buildMoveCoordForDir;
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
        // let diff = DIRS[direction];
        // let nextMove = this.findMovePos(this.tile.pos, diff); // test tile
        // this.move(this.tile, nextMove);
        this.executeMoves(direction);
    }

    findMovePos(currentPos, diff, first = true) {
        let next = this.nextPos(currentPos, diff)

        if (this.nextSpotMovable(currentPos, diff)) {
            return this.findMovePos(next, diff, false);
        } else {
            return currentPos;
        }
    }

    move(tile, pos) {    
        console.log(tile);
        
        this.board.index(tile.pos).removeTile(tile);
        this.board.index(pos).insertTile(tile);
        tile.pos = pos;

        //remove tile

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
        // this.tile = new Tile(2048, this.randomEmptyPos());
        // window.tile = this.tile;
        // this.board.insertTile(this.tile);
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

    // cell iteration
    // build cell coordinate order
    // invoke findMovePos on each + move
    // left [0,-1]
    executeMoves(dir) {
        let moves = buildMoveCoordForDir(dir);
        let diff = DIRS[dir];
        
        for (let coord of moves) {
            // console.log(coord);
            
            if (this.board.index(coord).isEmpty()) continue;
            let tile = this.board.index(coord).tile;
            let next = this.findMovePos(coord, diff);
            this.move(tile, next);
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