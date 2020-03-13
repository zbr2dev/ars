const easeOutSine = (t, b, c, d) => {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  };
  
  const easeOutQuad = (t, b, c, d) => {
    t /= d;
    return -c * t * (t - 2) + b;
  };
  
  class CanvasTexture {
    constructor(config) {
      this.size = 64;
      this.radius = this.size * 0.1;
      this.maxAge = this.size;
      this.points = [];
      this.last = null;
      this.intensity = { value: 1 };
      this.debug = config.debug;
    }
  
    createCanvas() {
      // Crea el canvas que sera la textura para usarse en los shaders
      const canvas = document.createElement("canvas");
      this.ctx2d = canvas.getContext("2d");
  
      canvas.setAttribute("data-sampler", "canvasTexture");
  
      // Si es true el canvas se colocara en el DOM
      if (this.debug) {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
  
        this.radius = canvas.width * 0.1;
  
        document.getElementById('web-gl').append(canvas);
      } else {
        canvas.width = canvas.height = this.size;
      }
    }
  
    onResize(canvas) {
      if (this.debug) {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        
        this.radius = canvas.width * 0.1;
      }
    }
  
    addPoints(point) {
      let force = 0;
      let vx = 0;
      let vy = 0;
      const last = this.last;
  
      if (last) {
        // Calcular la distancia del punto actual con el punto anterior
        const x = point[0] - this.last.x;
        const y = point[1] - this.last.y;
        const distanceSquared = x * x + y * y;
        const distance = Math.sqrt(distanceSquared);
        vx = x / distance;
        vy = y / distance;
        force = Math.min(distanceSquared, 1000);
      }
  
      this.last = { x: point[0], y: point[1] };
  
      // Agrega la posicion y el año de vida de los puntos
      this.points.push({ x: point[0], y: point[1], age: 0, force, vx, vy });
    }
  
    updatePoints() {
      // Limpiar el canvas
      this.ctx2d.clearRect(0, 0, innerWidth, innerHeight);
  
      const agePart = 1 / this.maxAge;
  
      // Puntos que se renderizaran
      if (this.points.length > 0) {
        this.points.forEach((point, i) => {
          let slowAsOlder = 1 - point.age / this.maxAge;
          let force = point.force * agePart * slowAsOlder;
  
          point.x += point.vx * force;
          point.y += point.vy * force;
  
          // Incrementar 1 a la edad
          point.age += 1;
  
          // Elimina los puntos que pasen la edad maxima
          if (point.age > this.maxAge) {
            this.points.splice(i, 1);
          }
        });
  
        this.points.forEach(point => {
          this.drawPoint(point);
        });
      }
    }
  
    drawPoint(point) {
      const offset = this.radius * 50;
  
      let intensity = 1;
  
      if (point.age < this.maxAge * 0.3) {
        intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1);
      } else {
        intensity = easeOutQuad(
          1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7),
          0,
          1,
          1
        );
      }
      
      intensity *= point.force / 300
  
      // Dibuja los puntos en el canvas
      this.ctx2d.shadowOffsetX = offset;
      this.ctx2d.shadowOffsetY = offset;
      this.ctx2d.shadowColor = `rgba(255, 255, 255, ${0.2 * intensity})`;
      this.ctx2d.shadowBlur = this.radius;
  
      this.ctx2d.beginPath();
      this.ctx2d.fillStyle = "rgba(255,0,0,1)";
      this.ctx2d.arc(
        point.x - offset,
        point.y - offset,
        this.radius,
        0,
        Math.PI * 2
      );
  
      this.ctx2d.fill();
    }
  }
  
  class WEBGL {
    constructor(set) {
      this.canvas = set.canvas;
      this.webGLCurtain = new Curtains("canvas");
      this.planeElement = set.planeElement;
      this.mouse = {
        x: 0,
        y: 0
      };
      this.params = {
        vertexShader: document.getElementById("vs").textContent, // our vertex shader ID
        fragmentShader: document.getElementById("fs").textContent, // our framgent shader ID
        widthSegments: 40,
        heightSegments: 40, // we now have 40*40*6 = 9600 vertices !
        uniforms: {
          time: {
            name: "uTime", // uniform name that will be passed to our shaders
            type: "1f", // this means our uniform is a float
            value: 0
          },
          mousepos: {
            name: "uMouse",
            type: "2f",
            value: [0, 0]
          },
          resolution: {
            name: "uReso",
            type: "2f",
            value: [innerWidth, innerHeight]
          },
          progress: {
            name: "uProgress",
            type: "1f",
            value: 0
          }
        }
      };
  
      this.canvasTexture = new CanvasTexture({ debug: true });
    }
  
    initPlane() {
      // create our plane mesh
      this.plane = this.webGLCurtain.addPlane(this.planeElement, this.params);
      this.canvasTexture.createCanvas();
      // use the onRender method of our plane fired at each requestAnimationFrame call
  
      this.plane.loadCanvas(this.canvasTexture.ctx2d.canvas);
  
      if (this.plane) {
        this.plane.onReady(() => {
          this.update();
          this.initEvent();
        });
      }
    }
  
    update() {
      this.plane.onRender(() => {
        this.plane.uniforms.time.value += 0.01; // update our time uniform value
  
        this.plane.uniforms.resolution.value = [innerWidth, innerHeight];
  
        this.canvasTexture.updatePoints();
  
        // Actualiza la textura del plano
        /*if (this.plane.textures.length > 0) {
          this.plane.textures[0].needUpdate();
        }*/
      });
    }
  
    initEvent() {
      window.addEventListener("mousemove", e => {
        gsap.to(this.plane.uniforms.mousepos.value, 0.7, {
          0: e.clientX,
          1: e.clientY
        });
  
        this.canvasTexture.addPoints(this.plane.uniforms.mousepos.value);
      });
  
      window.addEventListener("resize", () => {
        this.canvasTexture.onResize(this.canvasTexture.ctx2d.canvas);
      });
    }
  }
  
  const webgl = new WEBGL({
    canvas: document.getElementById("canvas"),
    planeElement: document.getElementsByClassName("plane")[0]
  });
  
  webgl.initPlane();
  