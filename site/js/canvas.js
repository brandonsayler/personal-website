// L-System Fractal Canvas — 6 fractal types (all L-systems, all multi-colored)
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

  function ColorWheel(h, s, l, speed) {
    this.h = h;
    this.s = (s !== undefined) ? s : 1;
    this.l = (l !== undefined) ? l : 0.5;
    this.t = 0;
    this.speed = (speed !== undefined) ? speed : 1/15;
  }
  ColorWheel.prototype.clone = function () {
    return new ColorWheel(this.h, this.s, this.l, this.speed);
  };
  ColorWheel.prototype.step = function () { this.t++; return this; };
  ColorWheel.prototype.css = function () {
    var b = this.t * this.speed;
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
  // L-System fractal (lazy-expansion model)
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

    // Batching: rush through old segments without drawing
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

    // When batching (internal), only expand — do NOT draw
    if (internal) return;

    // Execute the symbol
    var t = this.turtle;
    var d = this.stepSize;

    switch (sym) {
      case 'F': case 'A': case 'B':
        t.forward(d);
        // Per-segment color stepping for multi-color effect
        this.color = this.colors.step().css();
        break;
      case 'G': t.go(d); break;
      case '+': t.turn(this.angle); break;
      case '-': t.turn(-this.angle); break;
      case '[': this.states.push(t.save()); break;
      case ']': t.restore(this.states.pop()); break;
      case '0': this.iterate(); break;
      default:  break; // X, Y — structural placeholders
    }

    this.progress++;

    // Keep processing until we draw something (F/A/B) or die
    if (sym === 'F' || sym === 'A' || sym === 'B') return;
    if (this.queue && this.queue.length > 0 && !this.dead) {
      this.step(false);
    }
  };

  // =========================================================================
  // Fractal definitions — 6 types (all L-systems, all multi-colored)
  // =========================================================================

  var fractalDefs = {

    // QUADRATIC KOCH ISLAND (ember / red theme)
    // Ornamental square snowflake, 90° turns
    ember: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.75 + (Math.random() - 0.5) * 0.05,
        stepSize: 2,
        angle: 1/4,     // 90 degrees
        axiom: 'F+F+F+F',
        rules: { F: 'F+F-F-FF+F+F-F' },
        cap: 6,
        colorWheel: new ColorWheel(
          new Oscillator(0, 0.04, 0.3, 0.03),
          new Oscillator(0, 0.06, 0.25, 0.80),
          new Oscillator(0, 0.06, 0.35, 0.50),
          1/500
        ),
        onDie: onDie
      });
    },

    // MINKOWSKI SAUSAGE (ocean / blue theme)
    // Bumpy recursive curve, 90° turns
    ocean: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.75 + (Math.random() - 0.5) * 0.05,
        stepSize: 2,
        angle: 1/4,     // 90 degrees
        axiom: 'F',
        rules: { F: 'F+F-F-F+F' },
        cap: 8,
        colorWheel: new ColorWheel(
          new Oscillator(0, 0.04, 0.3, 0.58),
          new Oscillator(0, 0.06, 0.25, 0.72),
          new Oscillator(0, 0.06, 0.3, 0.50),
          1/400
        ),
        onDie: onDie
      });
    },

    // TERDRAGON (violet / purple theme)
    // Triple dragon curve with 120° turns, creates triangular tiling
    violet: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.75 + (Math.random() - 0.5) * 0.05,
        stepSize: 2,
        angle: 1/3,     // 120 degrees
        axiom: 'F',
        rules: { F: 'F+F-F' },
        cap: 12,
        colorWheel: new ColorWheel(
          new Oscillator(0, 0.04, 0.35, 0.75),
          new Oscillator(0, 0.06, 0.3, 0.68),
          new Oscillator(0, 0.06, 0.25, 0.52),
          1/350
        ),
        onDie: onDie
      });
    },

    // PENTIGREE (aurora / teal theme)
    // Pentagonal Koch snowflake with 5-fold symmetry, 72° turns
    aurora: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.75 + (Math.random() - 0.5) * 0.05,
        stepSize: 2,
        angle: 1/5,     // 72 degrees
        axiom: 'F-F-F-F-F',
        rules: { F: 'F-F++F+F-F-F' },
        cap: 6,
        colorWheel: new ColorWheel(
          new Oscillator(0, 0.04, 0.4, 0.50),
          new Oscillator(0, 0.06, 0.3, 0.78),
          new Oscillator(0, 0.06, 0.25, 0.52),
          1/400
        ),
        onDie: onDie
      });
    },

    // LEVY C CURVE (solar / amber theme)
    // Self-similar fractal dust, 45° turns
    solar: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.75 + (Math.random() - 0.5) * 0.05,
        stepSize: 2,
        angle: 1/8,     // 45 degrees
        axiom: 'F',
        rules: { F: '+F--F+' },
        cap: 18,
        colorWheel: new ColorWheel(
          new Oscillator(0, 0.03, 0.35, 0.08),
          new Oscillator(0, 0.06, 0.25, 0.82),
          new Oscillator(0, 0.06, 0.3, 0.52),
          1/350
        ),
        onDie: onDie
      });
    },

    // GOSPER CURVE / FLOWSNAKE (cosmic / pink theme)
    // Hexagonal space-filling curve, 60° turns. A and B both draw forward.
    cosmic: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.75 + (Math.random() - 0.5) * 0.05,
        stepSize: 3,
        angle: 1/6,     // 60 degrees
        axiom: 'A',
        rules: { A: 'A-B--B+A++AA+B-', B: '+A-BB--B-A++A+B' },
        cap: 7,
        colorWheel: new ColorWheel(
          new Oscillator(0, 0.03, 0.35, 0.88),
          new Oscillator(0, 0.06, 0.3, 0.72),
          new Oscillator(0, 0.06, 0.25, 0.52),
          1/450
        ),
        onDie: onDie
      });
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
