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

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.debouncedHandleKey = myDebounce(this.handleKeyPress, 250);
    
        this.createBoard();
        this.addEventListeners();
        // this.newGame();
        this.endGame(); // for testing!

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

        // mobile swiping code
        this.el.addEventListener('touchstart', handleTouchStart, false);
        this.el.addEventListener('touchmove', handleTouchMove(this.debouncedHandleKey), false);

        let xDown = null;
        let yDown = null;
        
        function handleTouchStart(e) {
            const firstTouch = e.touches[0];
            xDown = firstTouch.clientX;
            yDown = firstTouch.clientY; 
        };
        
        function handleTouchMove(debouncedHandleKey) {
            return e => {
                e.preventDefault();
                if (!xDown || !yDown) return;

                let xUp = e.touches[0].clientX;
                let yUp = e.touches[0].clientY;
                let xDiff = xDown - xUp;
                let yDiff = yDown - yUp;
    
                if (Math.abs(xDiff) > Math.abs(yDiff)) {
                    if (xDiff > 0) {
                        debouncedHandleKey('left');
                    } else {
                        debouncedHandleKey('right');
                    }
                } else {
                    if (yDiff > 0) {
                        debouncedHandleKey('up');
                    } else {
                        debouncedHandleKey('down');
                    }
                }
                xDown = null;
                yDown = null;
            }
        }
    }

    
    handleKeyPress(direction) { 
        if (this.executeMoves(direction)) {
            this.addRandomTile();
        }
        if (this.isBoardFull()) {
            console.log("tooo fulll");
            this.checkGameOver();
        }
    }

    isBoardFull() {
        let coords = this.buildMoveCoordForDir('up');
        let occupied = coords.filter(pos => !this.board.index(pos).isEmpty())
        return occupied.length === DIMENSIONS*DIMENSIONS ? true : false;
    }

    gameOver() {
        window.setTimeout(() => alert('GAME OVER!'), 100);
    }

    youWin() {
        alert('you did it!');
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
        let prevCell = this.board.index(tile.pos);
        this.board.index(pos).insertTile(tile, prevCell);
        tile.pos = pos;
    }

    fourOrTwo() {
        if (Math.random() > 0.15) return 2;
        return 4;
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
        let tile1 = new Tile(this.fourOrTwo(), this.randomEmptyPos());
        this.board.insertTile(tile1);
        let tile2 = new Tile(this.fourOrTwo(), this.randomEmptyPos());
        this.board.insertTile(tile2);
    }

    endGame() {
        for (let i = 0; i < 15; i++) {
            this.board.insertTile(new Tile(2, this.randomEmptyPos()))
        }
    }

    addRandomTile() {
        let tile = new Tile(this.fourOrTwo(), this.randomEmptyPos());
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
        
        let possibleMoves = 0
        for (let coord of moves) {            
            if (this.board.index(coord).isEmpty()) continue;
            let tile = this.board.index(coord).tile;
            let next = this.findMovePos(coord, diff, coord);
            if (next != coord) {
                possibleMoves = possibleMoves + 1;
                this.move(tile, next);
            }
        }
        return possibleMoves > 0 ? true : false;
    }

    testPossibleMove(dir) {
        let moves = this.buildMoveCoordForDir(dir);
        let diff = DIRS[dir];
        
        let possibleMoves = 0
        for (let coord of moves) {            
            if (this.board.index(coord).isEmpty()) continue;
            let tile = this.board.index(coord).tile;
            let next = this.findMovePos(coord, diff, coord);
            if (next != coord) possibleMoves = possibleMoves + 1;
        }
        return possibleMoves > 0 ? true : false;
    }

    checkGameOver() {
        let dirs  = Object.keys(DIRS);
        let stillAlive = 0;
        for (let dir of dirs) {
            if (this.testPossibleMove(dir)) stillAlive++;
        }
        console.log(stillAlive);
        if (stillAlive === 0) this.gameOver();
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