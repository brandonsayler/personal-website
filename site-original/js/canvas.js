// L-System Fractal Canvas — modeled after Soares' approach
// Click the canvas to spawn fractals that grow progressively with color cycling.
// Each theme maps to a different fractal type.
//
// Key insight from Soares' code: the L-system uses "lazy expansion" —
// every symbol popped from the queue gets its expansion (or itself, if no rule)
// appended back to the end of the queue. The '0' sentinel marks iteration
// boundaries for color changes. The cap gates when expansion stops.

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
    this.rules      = opts.rules;
    this.cap        = opts.cap || 10;
    this.colors     = opts.colorWheel.clone();
    this.color      = this.colors.css();
    this.resetFn    = opts.resetFn || null;
    this.onDie      = opts.onDie;

    this.turtle     = new Turtle(this.ctx, this.originX, this.originY, opts.theta || 0);
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
      this.resetFn(this.turtle, this.stepSize, this.originX, this.originY, this.progress, this.angle);
    }
    this.progress--;
  };

  Fractal.prototype.step = function (internal) {
    if (this.dead || !this.queue) return;

    // Batching: rush through old segments for complex fractals
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

    // LAZY EXPANSION: append the symbol's expansion (or itself) back to the queue
    // This is the key to progressive growth — only gate by cap
    if (this.cap - this.iterations > 1) {
      var expansion = this.rules[sym];
      // If there's a rule, expand; otherwise re-append the symbol itself
      this.queue = this.queue.concat((expansion || sym).split(''));
    }

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
      default:  break; // X, Y — structural placeholders
    }

    this.progress++;

    // Keep processing until we draw something (F) or die
    if (sym === 'F') return;
    if (this.queue && this.queue.length > 0 && !this.dead) {
      this.step(internal);
    }
  };

  // =========================================================================
  // Fractal definitions — 4 types matching Soares' originals
  // =========================================================================

  var fractalDefs = {
    _triCounter: 0,

    // SIERPINSKI TRIANGLE (ember theme)
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

    // FRACTAL PLANT / TREE (forest theme)
    forest: function (ctx, x, y, onDie) {
      return new Fractal({
        ctx: ctx, x: x, y: y,
        theta: 0.25,  // quarter turn (pointing down in canvas coords)
        stepSize: 3,  // 3 * base(1) like Soares
        angle: -25/360,
        axiom: 'FX',
        rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' },
        cap: 8,
        colorWheel: new ColorWheel(
          new Oscillator(0.67, 0.09, -0.4, 0.23)
        ),
        resetFn: function (turtle, stepSize, ox, oy, progress) {
          turtle.jump(
            turtle.x + 0.5 * stepSize * Math.pow(Math.max(1, progress), 0.5),
            oy
          );
          turtle.look(-25/360);
        },
        onDie: onDie
      });
    },

    // KOCH SNOWFLAKE (ocean theme)
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

    // DRAGON CURVE (violet theme)
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
          // Dragon: batching speeds up old iterations
          f._batching = f.progress;
        },
        onDie: onDie
      });
      return f;
    }
  };

  // =========================================================================
  // Controller
  // =========================================================================

  var activeFractals = {};
  var fractalId = 0;
  var intervalId = null;
  var currentTheme = 'ember';

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    activeFractals = {};
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
    if (!intervalId) {
      intervalId = setInterval(tick, 0);
    }
  }

  function spawnFractal(x, y) {
    fractalId++;
    var id = fractalId;
    var factory = fractalDefs[currentTheme];
    if (!factory) return;
    activeFractals[id] = factory(ctx, x, y, function () {
      delete activeFractals[id];
    });
    startLoop();
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, W, H);
    activeFractals = {};
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
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

  // Expose to main.js
  window.setFractalTheme = function (theme) {
    currentTheme = theme;
  };
  window.clearFractalCanvas = function () {
    clearCanvas();
  };

  // Init
  resize();
})();
