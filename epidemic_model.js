// this class describes the properties of a single particle.
function getShape(mu, sigma){
  let x1 = mu**2
  let x2 = Math.sqrt(x1 + sigma**2)
  return Math.log(x1/x2)
}

function getScale(mu, sigma){
  let x1 = 1 + (mu**2)/(sigma**2)
  return Math.sqrt(Math.log(x1))
}

function logNormal(mu, sigma) {

  let muHat = getShape(mu, sigma)
  let sigmaHat = getScale(mu, sigma)
  let xi1 = random(0,1)
  let xi2 = random(0,1)
  let z1 = Math.sqrt(-2*Math.log(1.0-xi1))
  let z2 = Math.sin(2*Math.PI*xi2)
  return Math.exp(muHat * sigmaHat*z1*z2) 
}


let muLatent = 1
let sigmaLatent = 0.5
let muInfectious = 2
let sigmaInfectious = 1
let framesPerSec = 60
let daySeconds = 9
let speedMin = 2
let speedMax = 4
let dayFrames = framesPerSec*daySeconds


class Particle {
    // setting the co-ordinates, radius and the
    // speed of a particle in both the co-ordinates axes.
      constructor(){
        //console.log(logNormal(10,2))
        this.x = random(0,width);
        this.y = random(0,height);
        this.r = 20;
        this.heading = random(0, 2*Math.PI)
        this.speed = random(speedMin,speedMax)
        this.xSpeed = this.speed*Math.cos(this.heading);
        this.ySpeed = this.speed*Math.sin(this.heading);
        this.state = "S"
        this.stateTime = 0
        this.bubble = 0
        this.latentPeriod = logNormal(muLatent, sigmaLatent)*dayFrames
        this.infectiousPeriod = logNormal(muInfectious, sigmaInfectious)*dayFrames
        //this.latentPeriod = muLatent*dayFrames
        //this.infectiousPeriod = muInfectious*dayFrames
      }

    
    // creation of a particle.
      createParticle() {
        noStroke();
        if(this.state=="S")
            fill('rgba(200,200,200,0.8)');
            
        else if(this.state=="E")
            fill('rgba(255, 165, 0, 0.8)');

        else if(this.state=="I")
            fill('rgba(255, 0, 0, 0.8)');

        else if(this.state=="R")
            fill('rgba(0, 128, 128, 0.8)');

        circle(this.x,this.y,this.r);
      }
    
    // setting the particle in motion.
      moveParticle(bubbles) {        

        // turn if hitting another bubble
        let idx = bubbles.indexOf(this.bubble)
        let otherBubbles = bubbles.slice(0, idx).concat(bubbles.slice(idx + 1))
        otherBubbles.forEach(b=>{
          if(b.quarantine==true){
            let d = dist(this.x, this.y, b.x, b.y);
            let minDistance = this.r + b.r + 50;
          
            if (d < minDistance) {
              // Adjust the particle's heading based on the collision with the other bubble
              let angleToBubble = atan2(b.y - this.y, b.x - this.x);
              this.heading = -2*angleToBubble - this.heading;
            }
        }
        }) 

        // turn if hitting the side
        if(this.x < 0 || this.x > width){
          this.heading = Math.PI - this.heading;    
          }
        if(this.y < 0 || this.y > height){
          this.heading = 2*Math.PI - this.heading;
        }
        
        if(this.heading > 2*Math.PI){
          this.heading -=2*Math.PI
        }
        if(this.heading <0){
          this.heading += 2*Math.PI
        }
        
        this.xSpeed = this.speed*Math.cos(this.heading)
        this.ySpeed = this.speed*Math.sin(this.heading)
        this.x+=this.xSpeed;
        this.y+=this.ySpeed;
      }

    
    goHome(){
      this.heading += random(-0.1,0.1)
      //console.log("Bubble properties:", this.bubble)
      let targetHeading = Math.atan2((this.bubble.y-this.y),(this.bubble.x-this.x))
      let dis = dist(this.x, this.y, this.bubble.x, this.bubble.y)
      //stroke('rgba(255,255,255,0.5)');
      //line(this.x,this.y,this.bubble.x,this.bubble.y);          
      if (dis > this.bubble.r) {
        // Gradually adjust heading towards targetHeading
        let angleDifference = targetHeading - this.heading;
        if (angleDifference > Math.PI) {
          angleDifference -= 2 * Math.PI;
        }
        else if (angleDifference < -Math.PI) {
          angleDifference += 2 * Math.PI;
        }
        this.heading += angleDifference * 0.2; // Adjust the factor for smoother transition
      }
    }
    
    // quarantine infected particles
      quarantineInfected(){
        if (this.state=="I"){
            this.xSpeed = 0
            this.ySpeed = 0
        }
      }
    // between particles which are less than a certain distance apart
      infectParticle(particles) {
        particles.forEach(element =>{
          let dis = dist(this.x,this.y,element.x,element.y);
          if (this.state=="S" & element.state=="I" & dis <this.r){
              this.state='E';
              this.stateTime=0;
          }
            })
        }
    
      transitionState(){
        if(this.state==="E" & this.stateTime > this.latentPeriod){
            this.state="I";
            this.stateTime=0;
        }
        if(this.state==="I" & this.stateTime > this.infectiousPeriod){
            this.state="R";
            this.stateTime=0;
            //this.xSpeed=random(-1,1)
            //this.ySpeed=random(-1,1)
        }
      }
    // this function creates the connections(lines)
    // between particles which are less than a certain distance apart
      joinParticles(particles) {
        particles.forEach(element =>{
          let dis = dist(this.x,this.y,element.x,element.y);
          if(dis<this.r + element.r) {
            stroke('rgba(255,255,255,0.5)');
            line(this.x,this.y,element.x,element.y);
          }
        });
      }
    

      updateTimer() {
        this.stateTime+=1;
      }
}
class Bubble {

  constructor(){
    this.time = 0
    this.x = random(0, width)
    this.y = random(0, height)
    this.r = 20
    this.particles = []
    this.quarantine = false
    }
  createBubble(){
    noFill()
    if (this.quarantine == false){
      stroke('rgba(200,200,200,0.6)');
    }
    else{
      stroke('rgba(200,100,100,0.6)');
    }
    
    strokeWeight(3)
    circle(this.x, this.y, 100);

  }

  checkInfection(){
    this.quarantine= false
    this.particles.forEach(p =>{
    if(p.state=="I"){
      this.quarantine = true
      }

    })


    }
  

    updateTimer(){
      this.time +=1;
    
    }
    }



    // an array to add multiple particles
    let particles = [];
    let bubbles = [];
    let nBubbles = 12


    
    function setup() {
      createCanvas(750,750);

      let cols = int(sqrt(nBubbles));  // Number of columns (adjust as needed)
      let rows = ceil(nBubbles / cols); // Number of rows
    

      
      for (let i = 0; i < nBubbles; i++) {
        let col = i % cols;
        let row = floor(i / cols);
    
        let x = map(col, 0, cols - 1, 100, width - 100);
        let y = map(row, 0, rows - 1, 100, height - 100);
    
        let b = new Bubble();
        b.x = x;
        b.y = y;
        bubbles.push(b);
      }

      for(let i = 0;i<width/10;i++){
        let p = new Particle();
        p.bubble = bubbles[Math.floor(random(bubbles.length))];;
        p.x = p.bubble.x + random(-10, 10);
        p.y = p.bubble.y + random(-10, 10);
        p.bubble.particles.push(p);
        particles.push(p);
      }

      // add a single infected particle
      pExposed = new Particle();
      pExposed.state = "E";
      pExposed.bubble = bubbles[0]
      pExposed.x = pExposed.bubble.x + random(-10,10)
      pExposed.y = pExposed.bubble.y + random(-10,10)
      pExposed.latentPeriod = (daySeconds-1)*framesPerSec
      console.log(pExposed.latentPeriod)
      pExposed.bubble.particles.push(pExposed)
      particles.push(pExposed)
    //  for (let i=0; i< particles.length;i++){
    //   console.log(particles[i].bubble.x)
    //    //console.log(particles[i].bubble.y)
    //  }
      
    }

  
    function draw() {
      frameRate(framesPerSec);
      background('#0f0f0f');
      for(let i=0;i<bubbles.length;i++){
        bubbles[i].createBubble()
        //bubbles[i].checkInfection()
      }
      for(let i = 0;i<particles.length;i++) {
        particles[i].createParticle();
        particles[i].moveParticle(bubbles);
        particles[i].transitionState();
        particles[i].infectParticle(particles);
        particles[i].updateTimer();
        particles[i].joinParticles(particles.slice(i));
        if(frameCount%dayFrames <dayFrames*2/3){
          //particles[i].speed = 3
          particles[i].goHome();
            //background('rgba(100,0,100,0.01)');
        }
        else{
          //particles[i].speed = random(1,2)
          if(particles[i].bubble.quarantine){
            particles[i].goHome();
          }
        }

        
        //particles[i].quarantineInfected();


      }
    }
    