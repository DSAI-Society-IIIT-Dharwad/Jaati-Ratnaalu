const main = document.querySelector('#main');
const mainHeight = main.offsetHeight;
const mainWidth = main.offsetWidth;



// module aliases for Matter.js
let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

// create an engine
let engine = Engine.create();


let ballr = 10,
    linel = 200,
    linew = 5,
    rotationSpeed = 0.10,
    x = 7;
// create a renderer
// elements
let render = Render.create({
    element: main,    
    engine: engine,   
    options: { 
        width:mainWidth,
        height:mainHeight,
        wireframes: false,   
    }
});
let ball = Bodies.circle(mainWidth/2, 10, ballr, { 
    restitution: 1.2,
    render:{
        fillStyle:'red',

    }
});
let leftWall = Bodies.rectangle(0,mainHeight,16,mainHeight*x/10,{
    isStatic: true,
    render:{
        fillStyle:'red',
    }
});
let rightWall = Bodies.rectangle(mainWidth-0.5,mainHeight,16,mainHeight*x/10,{
    isStatic: true,
    render:{
        fillStyle:'red',
    }
});
let div = Bodies.rectangle(mainWidth/2,mainHeight,8,mainHeight*x/10,{
    isStatic:true,
    render:{
        fillStyle:'red',
    }
});
let ground = Bodies.rectangle(mainWidth/2,mainHeight,mainWidth,16,{
    isStatic:true,
    render:{
        fillStyle:'red',
    }
});
let line = Bodies.rectangle(mainWidth/2,mainHeight/2,linel,linew,{
    isStatic:true,
    render:{
        fillStyle:'red',
    }
});

let isKeyDown = {};

//KeyPressforRotation
window.addEventListener('keydown', function(event) {
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
      if (!isKeyDown[event.key]) {
        isKeyDown[event.key] = true; 
      }
    }
}); 
window.addEventListener('keyup', function(event) {
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
      if (isKeyDown[event.key]) {
        isKeyDown[event.key] = false; 
      }
    }
});
function LineRotate(){
    if (isKeyDown["ArrowLeft"]) {
        Matter.Body.rotate(line, -rotationSpeed);  
    }
    if (isKeyDown["ArrowRight"]) {
        Matter.Body.rotate(line, rotationSpeed);   
    }
}


Composite.add(engine.world, [ball, line, ground, leftWall, div, rightWall]);
// run the renderer
Render.run(render);
// create a runner to manage the physics engine
let runner = Runner.create();
// run the engine
Runner.run(runner, engine);

function gameLoop() {
    LineRotate();
    requestAnimationFrame(gameLoop);
}

gameLoop();