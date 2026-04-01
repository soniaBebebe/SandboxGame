const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d");

const CELL_SIZE=6;
const COLS=120;
const ROWS=80;

canvas.width=COLS * CELL_SIZE;
canvas.height=ROWS*CELL_SIZE;

const EMPTY=0;
const SAND=1;
const WATER=2;
const STONE=3;

const COLORS={
    [EMPTY]: "#000000",
    [SAND]: "#d9b44a",
    [WATER]: "#3fa9f5",
    [STONE]: "#777777"
};

let grid=createGrid();
let currentType="sand";
let mouseDown=false;

const brushSizeInput=document.getElementById("brushSize");
const clearBtn=document.getElementById("clearBtn");
const toolButtons=document.querySelectorAll(".tool");

function createGrid(){
    return Array.from({length: ROWS}, ()=> Array(COLS).fill(EMPTY));
}

function resetGrid(){
    grid=createGrid();
}

toolButtons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
        toolButtons.forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        currentTypeType=btn.dataset.type;
    });
});

clearBtn.addEventListener("click", resetGrid);

canvas.addEventListener("mousedown", e=>{
    mouseDown=true;
    paint(e);
});

canvas.addEventListener("mousemove", e=>{
    if (mouseDown) paint(e);
});

canvas.addEventListener("mouseup", ()=>{
    mouseDown=false;
});

function paint(e){
    const rect=canvas.getBoundingClientRect();
    const x=Math.floor((e.clientX-rect.left)/CELL_SIZE);
    const y=Math.floor((e.clientY-rect.top)/CELL_SIZE);
    const brushSize=parseInt(brushSizeInput.value);

    for (let dy=-brushSize; dy<=brushSize; dy++){
        for (let dx=-brushSize; dx<=brushSize; dx++){
            const nx=x+dx;
            const ny=y+dy;

            if (nx<0 || nx>=COLS || ny<0 || ny>=ROWS) continue;

            if (dx*dx+dy*dy<=brushSize*brushSize){
                if (currentType==="erase"){
                    grid[ny][nx]=EMPTY;
                } else if (currentType==="sand"){
                    grid[ny][nx]=SAND;
                } else if (currentType==="water"){
                    grid[ny][nx]=WATER;
                } else if (currentType==="stone"){
                    grid[ny][nx]=STONE;
                }
            }
        }
    }
}

function update(){
    for(let y=ROWS -2; y>=0; y--){
        for (let x=0; x<COLS; x++){
            const cell=grid[y][x];

            if (cell===SAND){
                updateSand(x,y);
            } else if(cell===WATER){
                updateWater(x,y);
            }
        }
    }
}

function updateSand(x,y){
    if (isEmpty(x,y+1) || grid[y+1][x]===WATER){
        swap(x,y,x,y+1);
        return;
    }
    const dir=Math.random()<0.5 ? -1:1;

    if (isInside(x+dir, y+1)&&(isEmpty(x+dir, y+1) || grid[y+1][x+dir]===WATER)){
        swap(x,y,x+dir, y+1);
        return;
    }

    if (isInside(x-dir, y+1)&&(isEmpty(x-dir, y+1) || grid[y+1][x-dir]===WATER)){
        swap(x,y,x-dir, y+1);
    }
}

function isInside(x,y){
    return x>= 0 && x<COLS && y>=0 && y<ROWS;
}

function isEmpty(x,y){
    return isInside(x,y) && grid[y][x]===EMPTY;
}