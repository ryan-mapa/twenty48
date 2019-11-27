import Cell from './cell';

class Board {
    constructor(dimensions) {
        let gridArr = new Array();
        let el = document.createElement('div');
        el.classList.add('game-container');

        for (let i = 0; i < dimensions; i++) {
            let row = new Array();
            
            for (let j = 0; j < dimensions; j++) {
                let pos = [i, j];
                let cell = new Cell(pos);
                row.push(cell);
                el.appendChild(cell.el);
            }
            gridArr.push(row);
        }

        this.grid = gridArr;
        this.el = el;
    }

    build() {

    }

    insertTile(tile) {
        let [x, y] = tile.pos;
        this.grid[x][y].insert(tile);
    }

}

export default Board;