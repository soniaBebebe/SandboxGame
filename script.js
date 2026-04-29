const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d");

const CELL_SIZE=6;
const COLS=120;
const ROWS=80;

let shakeTime=0;
let shakeStrength=0;
let slowMo=0;
let slowFactor=1;
let flashTime=0;
let windForce=0;
let windTime=0;

canvas.width=COLS * CELL_SIZE;
canvas.height=ROWS*CELL_SIZE;

const EMPTY=0;
const SAND=1;
const WATER=2;
const STONE=3;
const FIRE=4;
const GLASS=5;
const EXPLOSIVE=6;
const DENSITY={
    [EMPTY]: 0,
    [SAND]:3,
    [WATER]: 1,
    [STONE]: 10,
    [FIRE]: 0.2,
    [GLASS]: 5,
    [EXPLOSIVE]: 4
};

const sounds=[
    new Audio("boomSound1.mp3"),
    new Audio("boomSound2.mp3"),
    new Audio("boomSound3.mp3")
];

const COLORS={
    [EMPTY]: "#000000",
    [SAND]: "#d9b44a",
    [WATER]: "#3fa9f5",
    [STONE]: "#777777",
    [FIRE]: "#ff4500",
    [GLASS]: "#aeefff",
    [EXPLOSIVE]: "#ff0000"
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

function playExplosion(){
    const s=sounds[Math.floor(Math.random()*sounds.length)];
    s.currentTime=0;
    s.play();
}

function canFallInto(x1,y1,x2,y2){
    if(!isInside(x2,y2)) return false;

    return DENSITY[grid[y1][x1]]>DENSITY[grid[y2][x2]];
}

toolButtons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
        toolButtons.forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        currentType=btn.dataset.type;
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

console.log("click");

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
                if (currentType==="eraser"){
                    grid[ny][nx]=EMPTY;
                } else if (currentType==="sand"){
                    grid[ny][nx]=SAND;
                } else if (currentType==="water"){
                    grid[ny][nx]=WATER;
                } else if (currentType==="stone"){
                    grid[ny][nx]=STONE;
                } else if (currentType==="fire"){
                    grid[ny][nx]=FIRE;
                } else if (currentType==="bomb"){
                    grid[ny][nx]=EXPLOSIVE;
                }
            }
        }
    }
}

let updated =[];

function update(){
    updated = Array.from({length: ROWS}, ()=> Array(COLS).fill(false));
    if(windTime>0){
        windTime--;
    }else{
        windForce=0;
    }
    for(let y=ROWS -2; y>=0; y--){
        for (let x=0; x<COLS; x++){
            if (updated[y][x]) continue;
            const cell=grid[y][x];

            if (cell===SAND){
                updateSand(x,y);
            } else if(cell===WATER){
                updateWater(x,y);
            } else if(cell===FIRE){
                updateFire(x,y);
            } else if(cell===EXPLOSIVE){
                explode(x,y,6);
                grid[y][x]=EMPTY;
            }
        }
    }
}

function updateWater(x,y){
    if (canFallInto(x,y,x,y+1)){
        swap(x,y,x,y+1);
        return;
    }
    
    const dirs=Math.random()<0.5?[-1,1]:[1,-1];

    for (let dir of dirs){
        if (isEmpty(x+dir, y+1)){
            swap(x,y,x+dir,y+1);
            return;
        }
    }
    for (let dir of dirs){
        if (isEmpty(x+dir, y)){
            swap(x,y,x+dir,y);
            return;
        }
    }

    let depth =0;
    
    for (let i=1; i<10; i++){
        if (isInside(x,y+i) && grid[y+i][x]===WATER){
            depth++;
        }else{
            break;
        }
    }

    if(depth>2){
        for(let dir of dirs){
            if(isEmpty(x+dir,y)){
                swap(x,y,x+dir,y);
                return;
            }
        }
    }

    for (let dir of dirs){
        const nx=x+dir;

        if(!isInside(nx,y)) continue;

        if(grid[y][nx]===WATER && isEmpty(nx+dir, y)){
            swap(nx,y,nx+dir,y);
        }
    }

    if(Math.random()<0.1){
        const dir=Math.random()<0.5 ? -1:1;
        if(isEmpty(x+dir,y)){
            swap(x,y,x+dir,y);
        }
    }


    if (windForce!==0 && Math.random()<0.5){
        if (isEmpty(x+windForce,y)){
            swap(x,y,x+windForce, y);
        }
    }
}

function swap(x1,y1,x2,y2){
    const temp=grid[y1][x1];
    grid[y1][x1]=grid[y2][x2];
    grid[y2][x2]=temp;
    updated[y2][x2]=true;
}

function updateSand(x,y){
    if (canFallInto(x,y,x,y+1)){
        swap(x,y,x,y+1);
        return;
    }
    const dir=Math.random()<0.5 ? -1:1;

    if (isInside(x+dir, y+1)&&canFallInto(x,y,x+dir,y+1)){
        swap(x,y,x+dir, y+1);
        return;
    }

    if (isInside(x-dir, y+1)&&canFallInto(x,y,x+dir,y+1)){
        swap(x,y,x-dir, y+1);
    }

    if (windForce!==0 && Math.random()<0.3){
        if (isEmpty(x+windForce,y)){
            swap(x,y,x+windForce, y);
        }
    }
}

function updateFire(x,y){
    if(canFallInto(x,y,x,y-1)){
        swap(x,y,x,y-1);
        y=y-1;
    }
    else{
        const dir=Math.random()<0.5? -1:1;

        if(isEmpty(x+dir, y-1)){
            swap(x,y,x+dir,y-1);
            x=x+dir;
            y=y-1;
        }

    }

    const neighbors=[
        [x,y-1],
        [x-1,y],
        [x+1,y]
    ];

    for (let [nx,ny] of neighbors){
        if(!isInside(nx,ny))continue;

        if(grid[ny][nx]===SAND){
            grid[ny][nx]=GLASS;
        }

        if(grid[ny][nx]===WATER){
            grid[ny][nx]=EMPTY;
        }
    }
    if(Math.random()<0.02){
            grid[y][x]=EMPTY;
        }

        if (windForce!==0 && Math.random()<0.7){
        if (isEmpty(x+windForce,y)){
            swap(x,y,x+windForce, y);
        }
    }
}

function explode(cx,cy,radius=6){
    for(let dy=-radius; dy<=radius; dy++){
        for(let dx=-radius; dx<=radius; dx++){
            const x=cx+dx;
            const y=cy+dy;

            if (!isInside(x,y)) continue;

            if(dx*dx + dy*dy > radius*radius) continue;
            const dist = Math.sqrt(dx*dx + dy*dy);

            const forceX =dx===0 ? 0:dx/dist;
            const forceY=dy===0 ? 0:dy/dist;

            const pushX=Math.round(x+forceX*3);
            const pushY=Math.round(y+forceY*3);

            if (grid[y][x] !==EMPTY &&isInside(pushX,pushY)){
                grid[pushY][pushX]=grid[y][x];
            }

            if(Math.random()<0.7){
                grid[y][x] = EMPTY;
            }
            if(Math.random()<0.3){
                grid[y][x]=FIRE;
            }
            // if(Math.random()<0.2){
            //     const nx=x+Math.floor(Math.random()*5-2);
            //     const ny=y+Math.floor(Math.random()*5-2);

            //     if(isInside(nx,ny)){
            //         grid[ny][nx]=SAND;
            //     }
            // }
        }
        flashTime = 3;
    }
    playExplosion();

    windForce =Math.random()<0.5 ? -1:1;
    windTime=50;

    shakeTime=10;
    shakeStrength=5;

    slowMo=20;
    slowFactor=4;
}

function isInside(x,y){
    return x>= 0 && x<COLS && y>=0 && y<ROWS;
}

function isEmpty(x,y){
    return isInside(x,y) && grid[y][x]===EMPTY;
}

function draw(){
    let offsetX=0;
    let offsetY=0;

    if(shakeTime>0){
        offsetX=(Math.random()-0.5)*shakeStrength;
        offsetY=(Math.random()-0.5)*shakeStrength;
        shakeTime--;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (let y=0; y<ROWS; y++){
        for (let x=0; x<COLS; x++){
            ctx.fillStyle=COLORS[grid[y][x]];
            ctx.fillRect(x*CELL_SIZE, y*CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
        }
    }

    if (flashTime > 0){
        ctx.fillStyle = "rgba(255,255,255, 0.6)";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        flashTime--;
    }

    ctx.restore();
}

let frame=0;

function loop(){
    if(slowMo>0){
        if (frame % slowFactor ===0){
            update();
        }
        slowMo--;
    } else{
        update();
    }

    draw();

    frame++;

    requestAnimationFrame(loop);
}

loop();