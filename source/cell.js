class Cell {
    constructor(pos) {
        const el = document.createElement('div');
        el.classList.add('cell');
        el.setAttribute("data-pos", JSON.stringify(pos));
        this.el = el;
        this.tile = null;
    }

    pos() {
        return JSON.parse(this.el.getAttribute("data-pos"));
    }

    insertTile(tile, prevCell) {
        let points = 0;

        if (this.tile) {
            points = parseInt(tile.absorb(this.tile));
        }
        
        if (prevCell) prevCell.removeTile(tile);
        this.el.appendChild(tile.el);
        this.tile = tile;
        return points;
    }

    removeTile(tile) {
        this.el.removeChild(tile.el)
        this.tile = null;
    }
    
    isEmpty() {
        if (this.tile) return false;
        // if (this.el.childElementCount > 0) return false;
        return true;
    }


}

export default Cell;