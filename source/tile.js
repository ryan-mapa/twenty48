class Tile {
    constructor(val) {
        this.val = val;
        this.compare = this.compare.bind(this);
    }

    compare(tile) {
        if (this.val === tile.val) return true;
        return false;
    }


}

export default Tile;