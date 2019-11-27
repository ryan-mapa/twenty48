class Tile {
    constructor(val) {
        this.val = val;
        this.compare = this.compare.bind(this);
        let el = document.createElement("div");
        el.classList.add('tile');
        el.innerHTML = val;
        this.el = el;
    }

    compare(tile) {
        if (this.val === tile.val) return true;
        return false;
    }


}

export default Tile;