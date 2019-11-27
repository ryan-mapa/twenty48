class Tile {
    constructor(val, pos) {
        this.compare = this.compare.bind(this);
        let el = document.createElement("div");
        el.classList.add('tile');
        el.innerHTML = val;
        
        this.val = val;
        this.el = el;
        this.pos = pos;
    }

    compare(tile) {
        if (this.val === tile.val) return true;
        return false;
    }


}

export default Tile;