/*##################################################################
This handles generating all the wave forms, then pushes the data to the
canvas to be visualized into something more understandable.
##################################################################*/
class WaveData{
	constructor(dtype,apt,scale,freq,can){
		this.ary = [];
		this.aptitude = apt;
		this.scale = scale;
		this.freq = freq;
		this.y = 0;
		this.z = 0;

		this.canvas = can;
		switch(dtype){
			case WaveData.TSIN: this.genFunc = this.genSin; break;
			case WaveData.TPERLIN: this.genFunc = this.genPerlin; break;
			default: this.genFunc = this.genRandom; break;
		}
	}

	setY(v){ this.y = parseFloat(v); return this; }
	setZ(v){ this.z = parseFloat(v); return this; }
	setScale(v){ this.scale = parseFloat(v); return this; }
	setAptitude(v){ this.aptitude = parseFloat(v); return this; }
	setFreq(v){ this.freq = parseFloat(v); console.log(this.freq); this.canvas.reset(); return this; } //Can't animate a freq change, so reset canvas

	gen(doPush){
		this.genFunc();
		if(doPush == true) this.push();
		return this;
	}

	genRandom(){
		var max = this.aptitude / 2, min = -max;
		this.ary = [];
		for(var x=0; x <= this.freq; x++) this.ary.push(min + Math.random() * (max-min));
	}

	genSin(){
		var p=0.0;
		this.ary = [];
		for(var x=0; x <= this.freq; x++){
			this.ary.push(Math.sin(p) * this.aptitude);
			p += this.scale;
		}	
	}

	genPerlin(){
		var x=0.0,min = this.aptitude / -2;
		this.ary = [];
		for(var i=0; i <= this.freq; i++){
			x += this.scale;
			this.ary.push(min + PerlinNoise.noise(x,this.y,this.z) * this.aptitude);
		}	
	}

	push(){ this.canvas.setData(this.ary,false); return this; }
}4

WaveData.TRANDOM = 0;
WaveData.TSIN = 1;
WaveData.TPERLIN = 2;


/*##################################################################
This object just handles drawing and animating on the canvas.
##################################################################*/
class CanvasWave{
	constructor(cID,aptID,scaleID){
		this._can = document.getElementById(cID);	//Save Canvas Ref for future use.
		this._c = this._can.getContext("2d");		//Save Context, its how we draw
		this._c.translate(0,this._can.height/2);		//Move cords so y is centered

		this.h2 = this._can.height / -2;

		this.lerpStep = 0.1;
		this.lerpPos = 0;
		this.lerpAry = null;
		this.ary = null;
		
		this.lineWidth = 2;
		this.lineColor = "#86d530";
		this.barColor = "#707070";

		this.anim = new Animator(35,()=>{return this.draw();});
	}

	setData(ary,doReset){
		this.lerpAry = ary;

		if(doReset){
			this.ary = null;	
			this.draw();
		}else{
			this.lerpPos = 0;
			this.anim.start();
		}
	}

	reset(){ this.ary = null; this.lerpAry = null; }
	clear(){ this._c.clearRect(0,this.h2,this._can.width,this._can.height); }

	drawCenter(){
		var c = this._c;
		c.beginPath();
		c.moveTo(0,0);
		c.lineTo(this._can.width,0);		
		c.strokeStyle = this.barColor;
      	c.stroke();
	}

	draw(){
		var c = this._c,
			x = 0,
			step = this._can.width / (this.lerpAry.length-1),
			state = true;
		
		this.clear();
		this.drawCenter();
		
      	c.beginPath();
		

		if(this.anim.active && this.ary != null){
			let y = easeInOutQuad(this.lerpPos, this.ary[0],this.lerpAry[0]-this.ary[0], 1); 
			c.moveTo(0,y);

			for(let i=1; i < this.lerpAry.length; i++){
				x += step;
				y = easeInOutQuad(this.lerpPos, this.ary[i],this.lerpAry[i]-this.ary[i], 1); 
				c.lineTo(x,y);
			}

			this.lerpPos += this.lerpStep;
			if(this.lerpPos <= 1) state = false; //Not done drawing the animation
		}else{
			this.anim.stop();
			c.moveTo(0,this.lerpAry[0]);
			for(let i=1; i < this.lerpAry.length; i++){
				x += step;
				c.lineTo(x,this.lerpAry[i]);
			}
		}

		c.strokeStyle = this.lineColor;
		c.lineWidth = this.lineWidth;
		c.stroke();

		//When done drawing, save lerp data for next call.
		if(state){
			this.ary = this.lerpAry;
			this.lerpAry = null;
		}

		return state;
	}
}






/*##################################################################
Built it like a task that can take in a runnable. It keeps looping
using animation frame till the runnable returns true.

ex: this.anim = new Animator(35,()=>{return this.draw();});
##################################################################*/
class Animator{
	constructor(t,func){
		this.active = false;		//State if the object is busy animating something
		this.interval = t;			//How much time before calling the func again
		this.lastFrame = null;		//Track time of last func call.
		this.func = func;			//Just a delegate reference, so the object reference can be kept

		this.run = ()=>{
			if(!this.active) return;

			var now = window.performance.now(),
				delta = now - this.lastFrame;
			
			if(delta >= this.interval){
				this.lastFrame = now;
				if(this.func()){ this.stop(); return; }
			}

			requestAnimationFrame(this.run);
		}
	}

	stop(){ this.active = false; }
	start(){
		this.active = true;
		this.lastFrame = window.performance.now();
		this.run();
	}
}

/*##################################################################
Just some functions to help create a smooth animation.
##################################################################*/

function lerp(norm,min,max){ return (max-min) * norm + min }
function easeInOutQuad(t, b, c, d){
	t /= d/2;
	if (t < 1) return c/2*t*t + b;
	t--;
	return -c/2 * (t*(t-2) - 1) + b;
}