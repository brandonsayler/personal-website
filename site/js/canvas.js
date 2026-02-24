// L-System Fractal Canvas — 8 fractal types
// Click canvas to spawn fractals. Multiple fractal types coexist on the same canvas.
// Switching fractal type does NOT clear the canvas. Use trash to clear.

(function () {
  'use strict';

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var W, H;

  // =========================================================================
  // Color utilities
  // =========================================================================

  function hslToRgb(h, s, l) {
    h = ((h % 1) + 1) % 1;
    if (s === 0) {
      var v = Math.round(l * 255);
      return [v, v, v];
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    return [
      Math.round(hue2rgb(p, q, h + 1/3) * 255),
      Math.round(hue2rgb(p, q, h)       * 255),
      Math.round(hue2rgb(p, q, h - 1/3) * 255)
    ];
  }

  function Oscillator(phase, amplitude, frequency, offset) {
    this.phase     = phase     || 0;
    this.amplitude = amplitude || 1;
    this.frequency = frequency || 1;
    this.offset    = offset    || 0;
  }
  Oscillator.prototype.value = function (t) {
    return this.offset + this.amplitude * Math.sin(
      this.frequency * 2 * Math.PI * t + this.phase * 2 * Math.PI
    );
  };

  function ColorWheel(h, s, l) {
    this.h = h;
    this.s = (s !== undefined) ? s : 1;
    this.l = (l !== undefined) ? l : 0.5;
    this.t = 0;
  }
  ColorWheel.prototype.clone = function () {
    return new ColorWheel(this.h, this.s, this.l);
  };
  ColorWheel.prototype.step = function () { this.t++; return this; };
  ColorWheel.prototype.css = function () {
    var b = this.t / 15;
    var hv = (typeof this.h === 'number') ? this.h : this.h.value(b);
    var sv = (typeof this.s === 'number') ? this.s : this.s.value(b);
    var lv = (typeof this.l === 'number') ? this.l : this.l.value(b);
    var rgb = hslToRgb(hv, Math.max(0, Math.min(1, sv)), Math.max(0, Math.min(1, lv)));
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
  };

  // =========================================================================
  // Turtle graphics
  // =========================================================================

  var TAU = 2 * Math.PI;

  function Turtle(ctx, x, y, theta) {
    this.ctx   = ctx;
    this.x     = x || 0;
    this.y     = y || 0;
    this.theta = theta || 0;
  }
  Turtle.prototype.save = function () {
    return { x: this.x, y: this.y, theta: this.theta };
  };
  Turtle.prototype.restore = function (s) {
    this.x = s.x; this.y = s.y; this.theta = s.theta;
  };
  Turtle.prototype.turn = function (a) {
    this.theta = (this.theta + a) % 1;
  };
  Turtle.prototype._step = function (d) {
    this.x += d * Math.cos(this.theta * TAU);
    this.y += d * Math.sin(this.theta * TAU);
  };
  Turtle.prototype.forward = function (d) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.x, this.y);
    this._step(d);
    this.ctx.lineTo(this.x, this.y);
    this.ctx.stroke();
  };
  Turtle.prototype.go = function (d) {
    this._step(d);
    this.ctx.moveTo(this.x, this.y);
  };
  Turtle.prototype.jump = function (x, y) { this.x = x; this.y = y; };
  Turtle.prototype.look = function (a) { this.theta = a; };

  // =========================================================================
  // L-System fractal (matches Soares' lazy-expansion model)
  // =========================================================================

  function Fractal(opts) {
    this.ctx        = opts.ctx;
    this.originX    = opts.x;
    this.originY    = opts.y;
    this.stepSize   = opts.stepSize || 1;
    this.angle      = opts.angle;
    this.initTheta  = opts.theta || 0;
    this.rules      = opts.rules;
    this.cap        = opts.cap || 10;
    this.colors     = opts.colorWheel.clone();
    this.color      = this.colors.css();
    this.resetFn    = opts.resetFn || null;
    this.onDie      = opts.onDie;

    this.turtle     = new Turtle(this.ctx, this.originX, this.originY, this.initTheta);
    this.queue      = (opts.axiom + '0').split('');
    this.states     = [];
    this.iterations = 0;
    this.progress   = 0;
    this.dead       = false;
    this._batching  = 0;
  }

  Fractal.prototype.iterate = function () {
    this.iterations++;
    if (this.cap > 0 && this.iterations >= this.cap) {
      this.queue = null;
      this.dead = true;
      if (this.onDie) this.onDie();
      return;
    }
    this.color = this.colors.step().css();
    if (this.resetFn) {
      this.resetFn(this.turtle, this.stepSize, this.originX, this.originY, this.progress, this.initTheta);
    }
    this.progress--;
  };

  Fractal.prototype.step = function (internal) {
    if (this.dead || !this.queue) return;

    // Batching: rush through old segments without drawing (for dragon curve)
    if (!internal && this._batching > 0) {
      var n = Math.min(100, this._batching);
      for (var i = 0; i < n; i++) this.step(true);
      this._batching -= n;
      return;
    }

    if (this.queue.length === 0) { this.dead = true; return; }

    this.ctx.strokeStyle = this.color;

    // Pop next symbol
    var sym = this.queue.shift();

    // LAZY EXPANSION: append the symbol's expansion back to the queue
    if (this.cap - this.iterations > 1) {
      var expansion = this.rules[sym];
      this.queue = this.queue.concat((expansion || sym).split(''));
    }

    // KEY FIX: When batching (internal), only expand the queue — do NOT
    // execute drawing actions, increment progress, or recurse.
    if (internal) return;

    // Execute the symbol
    var t = this.turtle;
    var d = this.stepSize;

    switch (sym) {
      case 'F': t.forward(d); break;
      case 'G': t.go(d); break;
      case '+': t.turn(this.angle); break;
      case '-': t.turn(-this.angle); break;
      case '[': this.states.push(t.save()); break;
      case ']': t.restore(this.states.pop()); break;
      case '0': this.iterate(); break;
      default:  break; // X, Y, A, B — structural placeholders
    }

    this.progress++;

    // Keep processing until we draw something (F) or die
    if (sym === 'F') return;
    if (this.queue && this.queue.length > 0 && !this.dead) {
      this.step(false);
    }
  };

  // =========================================================================
  // Fractal definitions — 8 types
  // =========================================================================

  var fractalDefs = {
    _triCounter: 0,

    // SIERPINSKI TRIANGLE (ember / red theme)
    ember: function (ctx, x, y, onDie) {
      var c = fractalDefs._triCounter;
      var hueOff = (c % 6) / 6;
      fractalDefs._triCounter = c + 1;
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: hueOff,
        stepSize: 1,
        angle: -1/6,
        axiom: 'FX',
        rules: { X: 'Y-FX-FY', Y: 'X+FY+FX' },
        cap: 9,
        colorWheel: new ColorWheel(
          new Oscillator(0.29 * c % 1, 0.5, 0.265, 0.76)
        ),
        onDie: onDie
      });
    },

    // FRACTAL PLANT / TREE (forest / green theme)
    // Matches Soares' "hidden" fractal: drift resetFn + negative angle
    forest: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.75,        // pointing up
        stepSize: 3,         // matches Soares
        angle: -25 / 360,   // negative 25° — Soares' exact angle
        axiom: 'FX',
        rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' },
        cap: 8,
        colorWheel: new ColorWheel(
          new Oscillator(0.67, 0.09, -0.4, 0.23)
        ),
        resetFn: function (turtle, stepSize, ox, oy, progress, initTheta) {
          // Soares' drift: shift sideways each iteration for fanning effect
          turtle.jump(
            turtle.x + 0.5 * stepSize * Math.pow(Math.abs(progress), 0.5),
            oy
          );
          turtle.look(initTheta);
        },
        onDie: onDie
      });
    },

    // KOCH SNOWFLAKE (ocean / blue theme)
    ocean: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0,
        stepSize: 1,
        angle: 1/6,
        axiom: 'F++F++F',
        rules: { F: 'F-F++F-F' },
        cap: 9,
        colorWheel: new ColorWheel(
          new Oscillator(0.125, 0.08, 1, 0.54),
          1,
          new Oscillator(0.25, 0.125, 0.5, 0.625)
        ),
        onDie: onDie
      });
    },

    // DRAGON CURVE (violet / purple theme)
    violet: function (ctx, x, y, onDie) {
      var f = new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0,
        stepSize: 3,
        angle: 0.25,
        axiom: 'FX',
        rules: { X: 'X+YF', Y: 'FX-Y' },
        cap: 15,
        colorWheel: new ColorWheel(
          new Oscillator(0.25, 0.075, 0.5, 0.075)
        ),
        resetFn: function () {
          f._batching = f.progress;
        },
        onDie: onDie
      });
      return f;
    },

    // JULIA SET (aurora / teal theme) — pixel-based progressive renderer
    aurora: function (ctx, x, y, onDie) {
      var size = 220;
      var half = size / 2;
      var ox = Math.round(x - half);
      var oy = Math.round(y - half);
      var maxIter = 80;
      // Cycle through interesting c values
      var cPresets = [
        { r: -0.7, i: 0.27015 },
        { r: -0.8, i: 0.156 },
        { r: 0.355, i: 0.355 },
        { r: -0.4, i: 0.6 },
        { r: 0.285, i: 0.01 }
      ];
      var cIdx = Math.floor(Math.random() * cPresets.length);
      var c = cPresets[cIdx];
      var row = 0;
      var dead = false;

      return {
        dead: false,
        step: function () {
          if (dead || row >= size) {
            this.dead = true;
            dead = true;
            if (onDie) onDie();
            return;
          }
          // Render 4 rows per step for speed
          var endRow = Math.min(row + 4, size);
          for (var py = row; py < endRow; py++) {
            for (var px = 0; px < size; px++) {
              var zr = (px - half) / (half / 1.5);
              var zi = (py - half) / (half / 1.5);
              var iter = 0;
              while (zr * zr + zi * zi < 4 && iter < maxIter) {
                var tmp = zr * zr - zi * zi + c.r;
                zi = 2 * zr * zi + c.i;
                zr = tmp;
                iter++;
              }
              if (iter < maxIter) {
                var hue = 0.48 + iter / maxIter * 0.15;
                var sat = 0.7 + 0.3 * (iter / maxIter);
                var lit = 0.15 + 0.55 * (iter / maxIter);
                var rgb = hslToRgb(hue, sat, lit);
                ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
                ctx.fillRect(ox + px, oy + py, 1, 1);
              }
            }
          }
          row = endRow;
        }
      };
    },

    // LÉVY C CURVE (solar / amber theme)
    solar: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0,
        stepSize: 2,
        angle: 1/8,     // 45 degrees
        axiom: 'F',
        rules: { F: '+F--F+' },
        cap: 14,
        colorWheel: new ColorWheel(
          new Oscillator(0.08, 0.04, 0.8, 0.10),
          new Oscillator(0, 0.2, 0.5, 0.85),
          new Oscillator(0, 0.1, 0.3, 0.55)
        ),
        onDie: onDie
      });
    },

    // HILBERT CURVE (cosmic / pink theme)
    cosmic: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0,
        stepSize: 5,
        angle: 0.25,    // 90 degrees
        axiom: 'A',
        rules: { A: '-BF+AFA+FB-', B: '+AF-BFB-FA+' },
        cap: 6,
        colorWheel: new ColorWheel(
          new Oscillator(0.92, 0.06, 0.7, 0.92),
          new Oscillator(0, 0.15, 0.4, 0.75),
          new Oscillator(0, 0.1, 0.5, 0.55)
        ),
        onDie: onDie
      });
    },

    // BARNSLEY FERN (terra / brown theme) — IFS random dot plotting
    terra: function (ctx, x, y, onDie) {
      var px = 0, py = 0;
      var totalDots = 50000;
      var dotsDone = 0;
      var dead = false;
      var scale = 38;
      var offsetX = x;
      var offsetY = y;

      // Barnsley fern affine transforms with probabilities
      function iterate() {
        var r = Math.random();
        var nx, ny;
        if (r < 0.01) {
          // Stem
          nx = 0;
          ny = 0.16 * py;
        } else if (r < 0.86) {
          // Main body (successively smaller leaflets)
          nx = 0.85 * px + 0.04 * py;
          ny = -0.04 * px + 0.85 * py + 1.6;
        } else if (r < 0.93) {
          // Largest left leaflet
          nx = 0.20 * px - 0.26 * py;
          ny = 0.23 * px + 0.22 * py + 1.6;
        } else {
          // Largest right leaflet
          nx = -0.15 * px + 0.28 * py;
          ny = 0.26 * px + 0.24 * py + 0.44;
        }
        px = nx;
        py = ny;
      }

      return {
        dead: false,
        step: function () {
          if (dead || dotsDone >= totalDots) {
            this.dead = true;
            dead = true;
            if (onDie) onDie();
            return;
          }
          // Plot 80 dots per step
          var batch = Math.min(80, totalDots - dotsDone);
          for (var i = 0; i < batch; i++) {
            iterate();
            var sx = offsetX + px * scale;
            var sy = offsetY - py * scale; // flip Y (fern grows up)
            // Color: earthy brown-green gradient based on progress
            var t = dotsDone / totalDots;
            var hue = 0.08 + t * 0.06;
            var sat = 0.45 + t * 0.2;
            var lit = 0.25 + t * 0.2;
            var rgb = hslToRgb(hue, sat, lit);
            ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
            ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
            dotsDone++;
          }
        }
      };
    }
  };

  // =========================================================================
  // Controller
  // =========================================================================

  var activeFractals = {};
  var fractalId = 0;
  var intervalId = null;
  var currentTheme = 'ember';
  var paused = false;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    activeFractals = {};
    paused = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  }

  function tick() {
    var keys = Object.keys(activeFractals);
    if (keys.length === 0) {
      clearInterval(intervalId);
      intervalId = null;
      return;
    }
    for (var i = 0; i < keys.length; i++) {
      var f = activeFractals[keys[i]];
      if (f && !f.dead) {
        f.step();
      } else if (f && f.dead) {
        delete activeFractals[keys[i]];
      }
    }
  }

  function startLoop() {
    if (!intervalId && !paused) {
      intervalId = setInterval(tick, 0);
    }
  }

  function spawnFractal(x, y) {
    // If paused, unpause and clear old fractals (matches Soares behavior)
    if (paused) {
      activeFractals = {};
      paused = false;
    }

    fractalId++;
    var id = fractalId;
    var factory = fractalDefs[currentTheme];
    if (!factory) return;
    activeFractals[id] = factory(ctx, x, y, function () {
      delete activeFractals[id];
    });
    startLoop();
  }

  // =========================================================================
  // Events
  // =========================================================================

  window.addEventListener('resize', resize);

  canvas.addEventListener('click', function (e) {
    spawnFractal(e.clientX, e.clientY);
  });

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var t = e.touches[0];
    spawnFractal(t.clientX, t.clientY);
  }, { passive: false });

  // =========================================================================
  // Public API (exposed to main.js)
  // =========================================================================

  window.setFractalTheme = function (theme) {
    currentTheme = theme;
  };

  window.clearFractalCanvas = function () {
    ctx.clearRect(0, 0, W, H);
    activeFractals = {};
    paused = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  };

  window.pauseFractals = function () {
    paused = true;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  };

  window.resumeFractals = function () {
    paused = false;
    startLoop();
  };

  window.togglePauseFractals = function () {
    if (paused) {
      window.resumeFractals();
    } else {
      window.pauseFractals();
    }
    return paused;
  };

  window.isFractalPaused = function () { return paused; };

  window.hasActiveFractals = function () {
    return Object.keys(activeFractals).length > 0;
  };

  // Init
  resize();
})();
