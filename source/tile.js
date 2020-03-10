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

    absorb(tile) { // self must be absorbed into tile        
        // this.val = parseInt(tile.val) + parseInt(this.val);
        // this.el.innerHTML = this.val;
        this.val = parseInt(tile.val) + parseInt(this.val);
        this.el.innerHTML = this.val; // not taking?!

        tile.el.parentElement.removeChild(tile.el);
        return tile.val;
    }


}

export default Tile;