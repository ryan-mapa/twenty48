class Tile {
    constructor(val, pos) {
        this.compare = this.compare.bind(this);
        let el = document.createElement("div");
        el.classList.add('tile');
        // el.innerHTML = val;
        
        this.val = val;
        this.el = el;
        this.pos = pos;
        this.update()
    }

    update() {
        switch (this.val) {
            case 2:
                this.el.classList.add('two');
                break;            
            case 4:
                this.el.classList.add('four');
                break;            
            case 8:
                this.el.classList.add('eight');
                break;            
            case 16:
                this.el.classList.add('sixteen');
                break;            
            case 32:
                this.el.classList.add('thirty-two');
                break;            
            case 64:
                this.el.classList.add('sixty-four');
                break;            
            case 128:
                this.el.classList.add('one-twenty-eight');
                break;            
            case 256:
                this.el.classList.add('two-fifty-six');
                break;            
            case 512:
                this.el.classList.add('five-twelve');
                break;            
            case 1024:
                this.el.classList.add('ten-twenty-four');
                break;            
            case 2048:
                this.el.classList.add('twenty-forty-eight');
                break;            
            default:
                break;
        }
    }

    compare(tile) {
        if (this.val === tile.val) return true;
        return false;
    }

    absorb(tile) { // self must be absorbed into tile        
        // this.val = parseInt(tile.val) + parseInt(this.val);
        // this.el.innerHTML = this.val;
        this.val = parseInt(tile.val) + parseInt(this.val);
        // this.el.innerHTML = this.val; // not taking?!

        tile.el.parentElement.removeChild(tile.el);
        this.update();
        return tile.val;
    }


}

export default Tile;