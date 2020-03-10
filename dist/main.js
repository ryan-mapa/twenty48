/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./2048.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./2048.js":
/*!*****************!*\
  !*** ./2048.js ***!
  \*****************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _source_game__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./source/game */ \"./source/game.js\");\n// const game = require('./source/game.js');\n\n\ndocument.addEventListener('DOMContentLoaded', () => {\n    let cells = document.querySelectorAll('.cell');\n    let rootEl = document.getElementById('g2048');\n    let scoreCounter = document.getElementById('score');\n\n    for (let cell of cells) {\n        cell.addEventListener('click', () => {\n\n        })\n    }\n\n    let game = new _source_game__WEBPACK_IMPORTED_MODULE_0__[\"default\"](rootEl, scoreCounter);\n    window.game = game;\n})\n\n//# sourceURL=webpack:///./2048.js?");

/***/ }),

/***/ "./source/board.js":
/*!*************************!*\
  !*** ./source/board.js ***!
  \*************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _cell__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./cell */ \"./source/cell.js\");\n\n\nclass Board {\n    constructor(dimensions) {\n        let gridArr = new Array();\n        let el = document.createElement('div');\n        el.classList.add('game-container');\n\n        for (let i = 0; i < dimensions; i++) {\n            let row = new Array();\n            \n            for (let j = 0; j < dimensions; j++) {\n                let pos = [i, j];\n                let cell = new _cell__WEBPACK_IMPORTED_MODULE_0__[\"default\"](pos);\n                row.push(cell);\n                el.appendChild(cell.el);\n            }\n            gridArr.push(row);\n        }\n\n        this.grid = gridArr;\n        this.el = el;\n    }\n\n    index(pos) {\n        let [x,y] = pos;\n        return this.grid[x][y];\n    }\n\n    build() {\n\n    }\n\n    insertTile(tile) {\n        let [x, y] = tile.pos;\n        this.grid[x][y].insertTile(tile);\n    }\n\n}\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (Board);\n\n//# sourceURL=webpack:///./source/board.js?");

/***/ }),

/***/ "./source/cell.js":
/*!************************!*\
  !*** ./source/cell.js ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nclass Cell {\n    constructor(pos) {\n        const el = document.createElement('div');\n        el.classList.add('cell');\n        el.setAttribute(\"data-pos\", JSON.stringify(pos));\n        this.el = el;\n        this.tile = null;\n    }\n\n    pos() {\n        return JSON.parse(this.el.getAttribute(\"data-pos\"));\n    }\n\n    insertTile(tile, prevCell) {\n        let points = 0;\n\n        if (this.tile) {\n            points = parseInt(tile.absorb(this.tile));\n        }\n        \n        if (prevCell) prevCell.removeTile(tile);\n        this.el.appendChild(tile.el);\n        this.tile = tile;\n        return points;\n    }\n\n    removeTile(tile) {\n        this.el.removeChild(tile.el)\n        this.tile = null;\n    }\n    \n    isEmpty() {\n        if (this.tile) return false;\n        // if (this.el.childElementCount > 0) return false;\n        return true;\n    }\n\n\n}\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (Cell);\n\n//# sourceURL=webpack:///./source/cell.js?");

/***/ }),

/***/ "./source/game.js":
/*!************************!*\
  !*** ./source/game.js ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _tile__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tile */ \"./source/tile.js\");\n/* harmony import */ var _board__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./board */ \"./source/board.js\");\n\n\n\nconst DIMENSIONS = 4; // 4x4\n\nconst DIRS = {\n    'left': [0,-1],\n    'right': [0,1],\n    'up': [-1,0], \n    'down': [1,0]\n};\n\nconst ORDER_DIRS = {\n    'left': [0,-1],  // if diff < 0 start at DIM -1 else start at 3\n    'right': [3,1],\n    'up': [0,0],\n    'down': [3,0]\n};\n\nconst myDebounce = function(cb, interval) {\n    let flag = true;\n    return (...callArgs) => {\n        if (flag) {\n            flag = false;\n            cb(...callArgs);\n            setTimeout(() => (flag = true), interval);\n        }\n    }\n}\n\nclass Game {\n    constructor(el, scoreCounter, board = new _board__WEBPACK_IMPORTED_MODULE_1__[\"default\"](DIMENSIONS)) {\n        this.el = el;\n        this.board = board;\n        this.score = 0;\n        this.scoreCounter = scoreCounter;\n\n        this.handleKeyPress = this.handleKeyPress.bind(this);\n        this.debouncedHandleKey = myDebounce(this.handleKeyPress, 250);\n        this.updateScore = this.updateScore.bind(this);\n    \n        this.createBoard();\n        this.addEventListeners();\n        this.newGame();\n        // this.endGame(); // for testing!\n    }\n\n    updateScore() {\n        this.scoreCounter.innerText = this.score;\n    }\n    \n    addEventListeners() {\n        document.addEventListener('keydown', e => {\n            if (e.keyCode == 37) {                \n                this.debouncedHandleKey('left');\n            }\n            if (e.keyCode == 38) {\n                this.debouncedHandleKey('up');\n            }\n            if (e.keyCode == 39) {\n                this.debouncedHandleKey('right');\n            }\n            if (e.keyCode == 40) {\n                this.debouncedHandleKey('down');\n            }\n        })\n\n        // mobile swiping code\n        this.el.addEventListener('touchstart', handleTouchStart, false);\n        this.el.addEventListener('touchmove', handleTouchMove(this.debouncedHandleKey), false);\n\n        let xDown = null;\n        let yDown = null;\n        \n        function handleTouchStart(e) {\n            const firstTouch = e.touches[0];\n            xDown = firstTouch.clientX;\n            yDown = firstTouch.clientY; \n        };\n        \n        function handleTouchMove(debouncedHandleKey) {\n            return e => {\n                e.preventDefault();\n                if (!xDown || !yDown) return;\n\n                let xUp = e.touches[0].clientX;\n                let yUp = e.touches[0].clientY;\n                let xDiff = xDown - xUp;\n                let yDiff = yDown - yUp;\n    \n                if (Math.abs(xDiff) > Math.abs(yDiff)) {\n                    if (xDiff > 0) {\n                        debouncedHandleKey('left');\n                    } else {\n                        debouncedHandleKey('right');\n                    }\n                } else {\n                    if (yDiff > 0) {\n                        debouncedHandleKey('up');\n                    } else {\n                        debouncedHandleKey('down');\n                    }\n                }\n                xDown = null;\n                yDown = null;\n            }\n        }\n    }\n\n    \n    handleKeyPress(direction) { \n        if (this.executeMoves(direction)) {\n            this.addRandomTile();\n        }\n        if (this.isBoardFull()) {\n            console.log(\"tooo fulll\");\n            this.checkGameOver();\n        }\n    }\n\n    isBoardFull() {\n        let coords = this.buildMoveCoordForDir('up');\n        let occupied = coords.filter(pos => !this.board.index(pos).isEmpty())\n        return occupied.length === DIMENSIONS*DIMENSIONS ? true : false;\n    }\n\n    gameOver() {\n        window.setTimeout(() => alert('GAME OVER!'), 100);\n    }\n\n    youWin() {\n        alert('you did it!');\n    }\n\n    findMovePos(currentPos, diff, initial) {\n        let next = this.nextPos(currentPos, diff)\n        let currCell = this.board.index(initial);\n        \n        if (this.inBounds(next)) {\n            let nextCell = this.board.index(next);\n            if(!nextCell.isEmpty()) {// if not empty                \n                if (!nextCell.tile.compare(currCell.tile)) return currentPos;\n            }\n            return this.findMovePos(next, diff, initial);\n        } else {\n            return currentPos;\n        }\n    }\n\n    move(tile, pos) {    \n        let points = 0;\n        let prevCell = this.board.index(tile.pos);\n        points = this.board.index(pos).insertTile(tile, prevCell);\n        tile.pos = pos;\n        this.score += points;\n        this.updateScore();\n    }\n\n    fourOrTwo() {\n        if (Math.random() > 0.15) return 2;\n        return 4;\n    }\n\n    inBounds(pos) {\n        let [x, y] = pos;\n        if (x >= DIMENSIONS || x < 0 || y >= DIMENSIONS || y < 0) return false;\n        return true;\n    }\n\n    nextPos(curr, diff) {\n        return [curr[0] + diff[0], curr[1] + diff[1]];\n    }\n\n    createBoard() {\n        this.el.appendChild(this.board.el);\n    }\n\n    newGame() {\n        let tile1 = new _tile__WEBPACK_IMPORTED_MODULE_0__[\"default\"](this.fourOrTwo(), this.randomEmptyPos());\n        this.board.insertTile(tile1);\n        let tile2 = new _tile__WEBPACK_IMPORTED_MODULE_0__[\"default\"](this.fourOrTwo(), this.randomEmptyPos());\n        this.board.insertTile(tile2);\n    }\n\n    endGame() {\n        for (let i = 0; i < 15; i++) {\n            this.board.insertTile(new _tile__WEBPACK_IMPORTED_MODULE_0__[\"default\"](2, this.randomEmptyPos()))\n        }\n    }\n\n    addRandomTile() {\n        let tile = new _tile__WEBPACK_IMPORTED_MODULE_0__[\"default\"](this.fourOrTwo(), this.randomEmptyPos());\n        this.board.insertTile(tile);\n    }\n\n    randomEmptyPos() {\n        let x = Math.floor(Math.random() * DIMENSIONS);\n        let y = Math.floor(Math.random() * DIMENSIONS);\n        return this.board.grid[x][y].isEmpty() ? [x, y] : this.randomEmptyPos();        \n    }\n\n    executeMoves(dir) {\n        let moves = this.buildMoveCoordForDir(dir);\n        let diff = DIRS[dir];\n        \n        let possibleMoves = 0\n        for (let coord of moves) {            \n            if (this.board.index(coord).isEmpty()) continue;\n            let tile = this.board.index(coord).tile;\n            let next = this.findMovePos(coord, diff, coord);\n            if (next != coord) {\n                possibleMoves = possibleMoves + 1;\n                this.move(tile, next);\n            }\n        }\n        return possibleMoves > 0 ? true : false;\n    }\n\n    testPossibleMove(dir) {\n        let moves = this.buildMoveCoordForDir(dir);\n        let diff = DIRS[dir];\n        \n        let possibleMoves = 0\n        for (let coord of moves) {            \n            if (this.board.index(coord).isEmpty()) continue;\n            let tile = this.board.index(coord).tile;\n            let next = this.findMovePos(coord, diff, coord);\n            if (next != coord) possibleMoves = possibleMoves + 1;\n        }\n        return possibleMoves > 0 ? true : false;\n    }\n\n    checkGameOver() {\n        let dirs  = Object.keys(DIRS);\n        let stillAlive = 0;\n        for (let dir of dirs) {\n            if (this.testPossibleMove(dir)) stillAlive++;\n        }\n        console.log(stillAlive);\n        if (stillAlive === 0) this.gameOver();\n    }\n\n    buildMoveCoordForDir(dir) {\n        let moves = [];\n\n        switch(dir) {\n            case 'left':            \n                for (let i = 0; i < DIMENSIONS; i++) {\n                    for (let j = 0; j < DIMENSIONS; j++) {\n                        moves.push([j,i]);\n                    }    \n                }    \n                return moves;\n            case 'right':            \n                for (let i = (DIMENSIONS-1); i >= 0; i--) {\n                    for (let j = (DIMENSIONS-1); j >= 0; j--) {\n                        moves.push([j,i]);\n                    }    \n                }    \n                return moves;\n            case 'up':            \n                for (let i = 0; i < DIMENSIONS; i++) {\n                    for (let j = 0; j < DIMENSIONS; j++) {\n                        moves.push([i,j]);\n                    }    \n                }    \n                return moves;\n            case 'down':            \n                for (let i = (DIMENSIONS-1); i >= 0; i--) {\n                    for (let j = (DIMENSIONS-1); j >= 0; j--) {\n                        moves.push([i, j]);\n                    }\n                }     \n                return moves;\n        }\n    }\n\n}\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (Game);\n\n//# sourceURL=webpack:///./source/game.js?");

/***/ }),

/***/ "./source/tile.js":
/*!************************!*\
  !*** ./source/tile.js ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nclass Tile {\n    constructor(val, pos) {\n        this.compare = this.compare.bind(this);\n        let el = document.createElement(\"div\");\n        el.classList.add('tile');\n        el.innerHTML = val;\n        \n        this.val = val;\n        this.el = el;\n        this.pos = pos;\n    }\n\n    compare(tile) {\n        if (this.val === tile.val) return true;\n        return false;\n    }\n\n    absorb(tile) { // self must be absorbed into tile        \n        // this.val = parseInt(tile.val) + parseInt(this.val);\n        // this.el.innerHTML = this.val;\n        this.val = parseInt(tile.val) + parseInt(this.val);\n        this.el.innerHTML = this.val; // not taking?!\n\n        tile.el.parentElement.removeChild(tile.el);\n        return tile.val;\n    }\n\n\n}\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (Tile);\n\n//# sourceURL=webpack:///./source/tile.js?");

/***/ })

/******/ });