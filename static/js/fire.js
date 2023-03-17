const transferAmount = .2
const heatLoss = 0.005
frames = 0

function Ball(x, y, radius, e, mass, colour){
	this.position = {x: x, y: y}; //m
	this.velocity = {x: 0, y: 0}; // m/s
	this.e = -0.05; // has no units
	this.mass = mass; //kg
	this.radius = 10; //m
	this.colour = colour; 
	this.area = (Math.PI * radius * radius) / 10000; //m^2
	this.heat = .4
}
var canvas = null;
var ctx = null;
var fps = 1/60; //60 FPS
var dt = fps * 1000; //ms 
var timer = false;
var Cd = 0.47;
var rho = 1.22; //kg/m^3 
var mouse = {x: 0, y:0, isDown: false};
var ag = 9.81; //m/s^2 acceleration due to gravity on earth = 9.81 m/s^2. 
var width = 0;
var height = 0;
var balls = [];

var setup = function(){
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	width = canvas.width;
	height = canvas.height;

	canvas.onmousedown = mouseDown;
	canvas.onmouseup = mouseUp;
	canvas.onmousemove = getMousePosition;
	timer = setInterval(loop, dt);
}

var mouseDown = function(e){
	if(e.which == 1){
		getMousePosition(e);
		mouse.isDown = true;
		var max = 255;
		var min = 20;
		var r = 75 + Math.floor(Math.random() * (max - min) - min);
		var g = 75 + Math.floor(Math.random() * (max - min) - min);
		var b = 75 + Math.floor(Math.random() * (max - min) - min);
		balls.push(new Ball(mouse.x, mouse.y, 10, 0.7,10, "rgb(" + r + "," + g + "," + b + ")"));
	}
}

var mouseUp = function(e){
	if(e.which == 1){
		mouse.isDown = false;
		balls[balls.length - 1].velocity.x = (balls[balls.length - 1].position.x - mouse.x) / 10;
		balls[balls.length - 1].velocity.y = (balls[balls.length - 1].position.y - mouse.y) / 10;
	}
}

function getMousePosition(e){
	mouse.x = e.pageX - canvas.offsetLeft;
	mouse.y = e.pageY - canvas.offsetTop;
}

function loop(){
	frames++
	//create constants
	var gravity = document.getElementById("gravity");
	var density = document.getElementById("density");
	var drag = document.getElementById("drag");

	//Clear window at the begining of every frame
	ctx.clearRect(0, 0, width, height);
	for(var i = 0; i < balls.length; i++){
		if(!mouse.isDown || i != balls.length - 1){
			//physics - calculating the aerodynamic forces to drag
			// -0.5 * Cd * A * v^2 * rho
			var fx = -0.5 * drag.value * density.value * balls[i].area * balls[i].velocity.x * balls[i].velocity.x * (balls[i].velocity.x / Math.abs(balls[i].velocity.x));
			var fy = -0.5 * drag.value * density.value * balls[i].area * balls[i].velocity.y * balls[i].velocity.y * (balls[i].velocity.y / Math.abs(balls[i].velocity.y));

			fx = (isNaN(fx)? 0 : fx);
			fy = (isNaN(fy)? 0 : fy);
			//Calculating the accleration of the ball
			//F = ma or a = F/m
			var ax = fx / balls[i].mass;
			var ay = (ag * gravity.value) + (fy / balls[i].mass) - balls[i].heat*40;

			//Calculating the ball velocity 
			balls[i].velocity.x += ax * fps;
			balls[i].velocity.y += ay * fps;

			//Calculating the position of the ball
			balls[i].position.x += balls[i].velocity.x * fps * 100;
			balls[i].position.y += balls[i].velocity.y * fps * 100;

			balls[i].heat -= heatLoss
		}
		
		//Rendering the ball
		ctx.beginPath();
		heat = balls[i].heat;
		colour = HSLtoRGB((heat/2)**2, 1, heat);
		strColor = 'rgb('+colour[0]+','+colour[1]+','+colour[2]+')'
		ctx.fillStyle = strColor;
		ctx.arc(balls[i].position.x, balls[i].position.y, balls[i].radius, 0, 2 * Math.PI, true);
		ctx.fill();
		ctx.shadowBlur = 20;
		ctx.shadowColor = strColor;
		ctx.closePath();

		if(mouse.isDown){
			ctx.beginPath();
			ctx.strokeStyle = "rgb(0,255,0)";
			ctx.moveTo(balls[balls.length - 1].position.x, balls[balls.length - 1].position.y);
			ctx.lineTo(mouse.x, mouse.y);
			ctx.stroke();
			ctx.closePath();
		}
		//Handling the ball collisions
		collisionBall(balls[i]);
		collisionWall(balls[i]);	
	}

	//Rendering Text
	ctx.fillStyle = 'white';
	ctx.font = "11pt Ariel";
	ctx.fillText("Number of Balls: " + balls.length, 0, 16);
	ctx.fillText("Drag Coefficient: " + drag.value, 0, 32);
	ctx.fillText("Fluid Density: " + density.value + " kg/m^3", 0, 48);
	ctx.fillText("Acceleration due to gravity: " + gravity.value + " g", 0, 64);
	ctx.fillText("Room Width: " + width / 1000 + " m", 0, 80);
	ctx.fillText("Room Height: " + height / 1000 + " m", 0, 96);
}
	
function collisionWall(ball){
	if(ball.position.x > width - ball.radius){
		ball.velocity.x *= ball.e;
		ball.position.x = width - ball.radius;
	}
	if(ball.position.y > height - ball.radius){
		ball.velocity.y *= ball.e;
		ball.position.y = height - ball.radius;
	}
	if(ball.position.x < ball.radius){
		ball.velocity.x *= ball.e;
		ball.position.x = ball.radius;
	}
	if(ball.position.y < ball.radius){
		ball.velocity.y *= ball.e;
		ball.position.y = ball.radius;
	}
	//heat source
	if (ball.position.x > width/2-200 && ball.position.x < width/2+200 && ball.position.y > height - ball.radius - 5) {
		ball.heat += 0.08
		ball.heat = Math.min(ball.heat, 1)
	}
}
function collisionBall(b1){
	for(var i = 0; i < balls.length; i++){
		var b2 = balls[i];
		if(b1.position.x != b2.position.x && b1.position.y != b2.position.y){
			//quick check for potential collisions using AABBs
			if(b1.position.x + b1.radius + b2.radius > b2.position.x
				&& b1.position.x < b2.position.x + b1.radius + b2.radius
				&& b1.position.y + b1.radius + b2.radius > b2.position.y
				&& b1.position.y < b2.position.y + b1.radius + b2.radius){
				
				//pythagoras 
				var distX = b1.position.x - b2.position.x;
				var distY = b1.position.y - b2.position.y;
				var d = Math.sqrt((distX) * (distX) + (distY) * (distY));
	
				//checking circle vs circle collision
				if(d < b1.radius + b2.radius){
					heatDelta = b1.heat - b2.heat
					b1.heat -= heatDelta * transferAmount
					b2.heat += heatDelta * transferAmount
					var nx = (b2.position.x - b1.position.x) / d;
					var ny = (b2.position.y - b1.position.y) / d;
					var p = 2 * (b1.velocity.x * nx + b1.velocity.y * ny - b2.velocity.x * nx - b2.velocity.y * ny) / (b1.mass + b2.mass);

					// calulating the point of collision 
					var colPointX = ((b1.position.x * b2.radius) + (b2.position.x * b1.radius)) / (b1.radius + b2.radius);
					var colPointY = ((b1.position.y * b2.radius) + (b2.position.y * b1.radius)) / (b1.radius + b2.radius);
					
					//stoping overlap 
					b1.position.x = colPointX + b1.radius * (b1.position.x - b2.position.x) / d;
					b1.position.y = colPointY + b1.radius * (b1.position.y - b2.position.y) / d;
					b2.position.x = colPointX + b2.radius * (b2.position.x - b1.position.x) / d;
					b2.position.y = colPointY + b2.radius * (b2.position.y - b1.position.y) / d;

					//updating velocity to reflect collision 
					b1.velocity.x -= p * b1.mass * nx;
					b1.velocity.y -= p * b1.mass * ny;
					b2.velocity.x += p * b2.mass * nx;
					b2.velocity.y += p * b2.mass * ny;
				}
			}
		}
	}
}


	/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function HSLtoRGB(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


window.onload  = function () {
	setup()
	resize()

	for (i=0;i<350;i++) {
		balls.push(new Ball(width/2 + Math.random(), height/2, 10, 0.7,10, null));
	}

}

window.addEventListener('resize', function(e) {
	resize()
})
function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	width = canvas.width;
	height = canvas.height;
}

setInterval(function() {
    console.log("fps    " + frames)
    frames = 0
    }, 1000);