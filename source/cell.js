class Cell {
    constructor(pos) {
        const el = document.createElement('div');
        el.classList.add('cell');
        el.setAttribute("data-pos", JSON.stringify(pos));
        this.el = el;
    }

    insert(tile) {
        this.el.appendChild(tile.el)
    }
    
    isEmpty() {
        if (this.el.childElementCount > 0) return false;
        return true;
    }

    
}

export default Cell;