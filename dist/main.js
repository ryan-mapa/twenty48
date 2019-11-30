!function(e){var t={};function r(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(n,i,function(t){return e[t]}.bind(null,i));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";r.r(t);var n=class{constructor(e,t){this.compare=this.compare.bind(this);let r=document.createElement("div");r.classList.add("tile"),r.innerHTML=e,this.val=e,this.el=r,this.pos=t}compare(e){return this.val===e.val}absorb(e){this.val=parseInt(e.val)+parseInt(this.val),this.el.innerHTML=this.val,e.el.parentElement.removeChild(e.el)}};var i=class{constructor(e){const t=document.createElement("div");t.classList.add("cell"),t.setAttribute("data-pos",JSON.stringify(e)),this.el=t,this.tile=null}pos(){return JSON.parse(this.el.getAttribute("data-pos"))}insertTile(e,t){this.tile&&e.absorb(this.tile),t&&t.removeTile(e),this.el.appendChild(e.el),this.tile=e}removeTile(e){this.el.removeChild(e.el),this.tile=null}isEmpty(){return!this.tile}};var o=class{constructor(e){let t=new Array,r=document.createElement("div");r.classList.add("game-container");for(let n=0;n<e;n++){let o=new Array;for(let t=0;t<e;t++){let e=new i([n,t]);o.push(e),r.appendChild(e.el)}t.push(o)}this.grid=t,this.el=r}index(e){let[t,r]=e;return this.grid[t][r]}build(){}insertTile(e){let[t,r]=e.pos;this.grid[t][r].insertTile(e)}};const s=4,l={left:[0,-1],right:[0,1],up:[-1,0],down:[1,0]},d=function(e,t){let r=!0;return(...n)=>{r&&(r=!1,e(...n),setTimeout(()=>r=!0,t))}};var a=class{constructor(e,t=new o(s)){this.el=e,this.board=t,this.createBoard(),this.addEventListeners(),this.newGame(),this.handleKeyPress=this.handleKeyPress.bind(this),this.debouncedHandleKey=d(this.handleKeyPress,250)}addEventListeners(){document.addEventListener("keydown",e=>{37==e.keyCode&&this.debouncedHandleKey("left"),38==e.keyCode&&this.debouncedHandleKey("up"),39==e.keyCode&&this.debouncedHandleKey("right"),40==e.keyCode&&this.debouncedHandleKey("down")}),this.el.addEventListener("touchstart",function(r){const n=function(e){return e.touches||e.originalEvent.touches}(r)[0];e=n.clientX,t=n.clientY},!1),this.el.addEventListener("touchmove",function(r){if(!e||!t)return;let n=r.touches[0].clientX,i=r.touches[0].clientY,o=e-n,s=t-i;Math.abs(o)>Math.abs(s)?o>0?this.debouncedHandleKey("left"):this.debouncedHandleKey("right"):s>0?this.debouncedHandleKey("up"):this.debouncedHandleKey("down"),e=null,t=null},!1);let e=null,t=null}handleKeyPress(e){this.executeMoves(e),this.addRandomTile()}isBoardFull(){return this.buildMoveCoordForDir("up").filter(e=>!this.board.index(e).isEmpty()).length===s*s}findMovePos(e,t,r){let n=this.nextPos(e,t),i=this.board.index(r);if(this.inBounds(n)){let o=this.board.index(n);return o.isEmpty()||o.tile.compare(i.tile)?this.findMovePos(n,t,r):e}return e}move(e,t){let r=this.board.index(e.pos);this.board.index(t).insertTile(e,r),e.pos=t}fourOrTwo(){return Math.random()>.15?2:4}inBounds(e){let[t,r]=e;return!(t>=s||t<0||r>=s||r<0)}nextPos(e,t){return[e[0]+t[0],e[1]+t[1]]}createBoard(){this.el.appendChild(this.board.el)}newGame(){let e=new n(this.fourOrTwo(),this.randomEmptyPos());this.board.insertTile(e);let t=new n(this.fourOrTwo(),this.randomEmptyPos());this.board.insertTile(t)}addRandomTile(){if(this.isBoardFull())return void console.log("tooo fulll");let e=new n(this.fourOrTwo(),this.randomEmptyPos());this.board.insertTile(e)}randomEmptyPos(){let e=Math.floor(Math.random()*s),t=Math.floor(Math.random()*s);return this.board.grid[e][t].isEmpty()?[e,t]:this.randomEmptyPos()}executeMoves(e){let t=this.buildMoveCoordForDir(e),r=l[e];for(let e of t){if(this.board.index(e).isEmpty())continue;let t=this.board.index(e).tile,n=this.findMovePos(e,r,e);n!=e&&this.move(t,n)}}buildMoveCoordForDir(e){let t=[];switch(e){case"left":for(let e=0;e<s;e++)for(let r=0;r<s;r++)t.push([r,e]);return t;case"right":for(let e=s-1;e>=0;e--)for(let r=s-1;r>=0;r--)t.push([r,e]);return t;case"up":for(let e=0;e<s;e++)for(let r=0;r<s;r++)t.push([e,r]);return t;case"down":for(let e=s-1;e>=0;e--)for(let r=s-1;r>=0;r--)t.push([e,r]);return t}}};document.addEventListener("DOMContentLoaded",()=>{let e=document.querySelectorAll(".cell"),t=document.getElementById("g2048");for(let t of e)t.addEventListener("click",()=>{});let r=new a(t);window.game=r})}]);