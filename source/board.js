class Board {
    constructor(dimensions) {
        let gridArr = new Array;

        for (let i = 0; i < dimensions; i++) {
            gridArr.push(new Array(4));
        }

        this.grid = gridArr;
    }


}

export default Board;