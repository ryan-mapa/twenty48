import Tile from './tile';
import Board from './board';

const DIMENSIONS = 4; // 4x4

class Game {
    constructor(el, board = new Board(DIMENSIONS)) {
        this.el = el;
        this.board = board;
    }

    newGame() {
        let tile1 = Tile.new(2);
        let tile2 = Tile.new(2);
    }

    randomEmptyPos() {
        let x = Math.floor(Math.random()* DIMENSIONS);
        let y = Math.floor(Math.random()* DIMENSIONS);
        return [x, y];
    }

}

export default Game;