// Theme switching, fixed quotes, card toggling, pause/trash controls, floating cursor, dark mode

(function () {
  'use strict';

  // =========================================================================
  // Wikipedia links per fractal theme
  // =========================================================================

  var wikiLinks = {
    ember:  { name: 'Quadratic Koch Island',  url: 'https://en.wikipedia.org/wiki/Koch_snowflake#Variants' },
    ocean:  { name: 'Julia Dendrite',         url: 'https://en.wikipedia.org/wiki/Julia_set#Types_of_Julia_sets' },
    violet: { name: 'Terdragon',              url: 'https://en.wikipedia.org/wiki/Terdragon' },
    aurora: { name: 'Pentigree',              url: 'https://en.wikipedia.org/wiki/N-flake' },
    solar:  { name: 'L\u00e9vy C Curve',      url: 'https://en.wikipedia.org/wiki/L%C3%A9vy_C_curve' },
    cosmic: { name: 'Gosper Curve',           url: 'https://en.wikipedia.org/wiki/Gosper_curve' }
  };

  var fractalWiki = document.getElementById('fractal-wiki');

  function updateWikiLink(theme) {
    var info = wikiLinks[theme];
    if (info && fractalWiki) {
      fractalWiki.href = info.url;
      fractalWiki.textContent = info.name;
    }
  }

  // =========================================================================
  // Theme switching
  // =========================================================================

  var themeButtons = document.querySelectorAll('.fractal-btn');
  var cardEl = document.querySelector('.card');
  var themeOrder = ['ember', 'ocean', 'violet', 'aurora', 'solar', 'cosmic'];

  function switchTheme(theme) {
    document.body.className = 'theme-' + theme;
    themeButtons.forEach(function (b) { b.classList.remove('active'); });
    var match = document.querySelector('.fractal-btn[data-theme="' + theme + '"]');
    if (match) match.classList.add('active');
    // Switch fractal type (does NOT clear canvas — fractals coexist)
    if (window.setFractalTheme) window.setFractalTheme(theme);
    // Update Wikipedia link
    updateWikiLink(theme);
    // Brief glow on the card
    if (cardEl) {
      cardEl.classList.add('theme-glow');
      setTimeout(function () { cardEl.classList.remove('theme-glow'); }, 600);
    }
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTheme(btn.dataset.theme);
    });
  });

  // =========================================================================
  // Keyboard shortcuts: 1-6 switch themes
  // =========================================================================

  document.addEventListener('keydown', function (e) {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var num = parseInt(e.key, 10);
    if (num >= 1 && num <= 6) {
      switchTheme(themeOrder[num - 1]);
    }
  });

  // =========================================================================
  // Easter egg: Konami code (↑↑↓↓←→←→BA)
  // =========================================================================

  var konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
                        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
                        'b', 'a'];
  var konamiIndex = 0;

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === konamiSequence[konamiIndex] ||
        e.key.toLowerCase() === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        konamiIndex = 0;
        if (window.spawnAllFractalsAtCenter) {
          window.spawnAllFractalsAtCenter();
        }
        // Brief flash
        var flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
          'background:rgba(255,255,255,0.25);z-index:9999;pointer-events:none;' +
          'transition:opacity 0.5s;opacity:1;';
        document.body.appendChild(flash);
        setTimeout(function () { flash.style.opacity = '0'; }, 50);
        setTimeout(function () { document.body.removeChild(flash); }, 600);
      }
    } else {
      konamiIndex = 0;
      if (e.key === konamiSequence[0]) konamiIndex = 1;
    }
  });

  // =========================================================================
  // Card toggle (more / less)
  // =========================================================================

  var card = document.getElementById('card');
  var more = document.getElementById('more');
  var toggleMore = document.getElementById('toggle-more');
  var toggleLess = document.getElementById('toggle-less');

  toggleMore.addEventListener('click', function (e) {
    e.preventDefault();
    card.style.display = 'none';
    more.style.display = 'block';
  });

  toggleLess.addEventListener('click', function (e) {
    e.preventDefault();
    more.style.display = 'none';
    card.style.display = 'block';
  });

  // =========================================================================
  // Pause / Trash controls
  // =========================================================================

  var btnPause = document.getElementById('btn-pause');
  var btnTrash = document.getElementById('btn-trash');
  var controlsDiv = document.getElementById('controls');

  // Update control visibility: show only when fractals exist
  function updateControls() {
    var hasActive = window.hasActiveFractals && window.hasActiveFractals();
    var isPaused = window.isFractalPaused && window.isFractalPaused();

    if (hasActive || isPaused) {
      controlsDiv.classList.add('visible');
    }

    // Update pause button icon
    if (isPaused) {
      btnPause.innerHTML = '&#9654;'; // play triangle
      btnPause.title = 'Resume';
    } else {
      btnPause.innerHTML = '&#9646;&#9646;'; // pause bars
      btnPause.title = 'Pause';
    }
  }

  btnPause.addEventListener('click', function () {
    if (window.togglePauseFractals) {
      window.togglePauseFractals();
      updateControls();
    }
  });

  btnTrash.addEventListener('click', function () {
    if (window.clearFractalCanvas) {
      window.clearFractalCanvas();
      controlsDiv.classList.remove('visible');
      updateControls();
    }
  });

  // Poll for control state (simple approach)
  setInterval(updateControls, 500);

  // =========================================================================
  // Dark mode — follows system preference, manual toggle is session-only
  // =========================================================================

  var btnDarkMode = document.getElementById('btn-darkmode');
  var htmlEl = document.documentElement;

  function setDarkMode(isDark) {
    if (isDark) {
      htmlEl.setAttribute('data-mode', 'dark');
      btnDarkMode.textContent = '\u2600';  // sun ☀
      btnDarkMode.title = 'Switch to light mode';
    } else {
      htmlEl.removeAttribute('data-mode');
      btnDarkMode.textContent = '\u263E';  // moon ☾
      btnDarkMode.title = 'Switch to dark mode';
    }
  }

  // Initialize: follow system preference (inline <head> script already set
  // the attribute to prevent flash, so just sync the button icon here)
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setDarkMode(prefersDark);

  // System preference changes always take effect (reset any manual toggle)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      setDarkMode(e.matches);
    });
  }

  // Manual toggle — session-only override
  btnDarkMode.addEventListener('click', function () {
    var isDark = htmlEl.getAttribute('data-mode') === 'dark';
    setDarkMode(!isDark);
  });

  // =========================================================================
  // Floating laggy cursor (SVG dot + halo) + cursor trail
  // =========================================================================

  var dot = document.getElementById('dot');
  var halo = document.getElementById('halo');
  var cursorSvg = document.getElementById('cursor-svg');

  // Cursor trail: pool of fading dots
  var TRAIL_SIZE = 12;
  var trailDots = [];
  for (var t = 0; t < TRAIL_SIZE; t++) {
    var td = document.createElement('div');
    td.className = 'trail-dot';
    document.body.appendChild(td);
    trailDots.push({ el: td, x: 0, y: 0 });
  }
  var trailIndex = 0;
  var trailFrame = 0;

  if (dot && halo) {
    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };
    var cursorTick = 0;
    var hasMoved = false;

    // Initialize from current position
    current.x = parseFloat(dot.getAttribute('cx')) || 0;
    current.y = parseFloat(dot.getAttribute('cy')) || 0;
    target.x = current.x;
    target.y = current.y;

    // Track mouse position
    window.addEventListener('mousemove', function (e) {
      if (!hasMoved) {
        hasMoved = true;
        document.documentElement.classList.add('moved');
        // Jump to first position immediately
        current.x = e.pageX;
        current.y = e.pageY;
      }
      target.x = e.pageX - document.body.scrollLeft;
      target.y = e.pageY - document.body.scrollTop;
    });

    // Animate cursor: follow mouse with 25% interpolation, pulse size
    setInterval(function () {
      cursorTick++;
      var pulse = Math.sin(cursorTick / 15);

      // Pulse sizes
      halo.setAttribute('r', 7 + 3 * pulse);
      dot.setAttribute('r', 4.3 + -1.2 * pulse);
      halo.setAttribute('stroke-width', 3 + 1.5 * pulse);

      // Move toward target with lag
      var dx = target.x - current.x;
      var dy = target.y - current.y;
      var distSq = dx * dx + dy * dy;

      if (distSq > 3) {
        current.x += dx * 0.25;
        current.y += dy * 0.25;
        dot.setAttribute('cx', current.x);
        dot.setAttribute('cy', current.y);
        halo.setAttribute('cx', current.x);
        halo.setAttribute('cy', current.y);
      }

      // Drop a trail dot every 3rd frame while cursor is moving
      trailFrame++;
      if (trailFrame % 3 === 0 && hasMoved && distSq > 20) {
        var trail = trailDots[trailIndex % TRAIL_SIZE];
        trail.x = current.x;
        trail.y = current.y;
        trail.el.style.left = trail.x - 2.5 + 'px';
        trail.el.style.top = trail.y - 2.5 + 'px';
        trail.el.style.opacity = '0.5';
        trailIndex++;
      }

      // Fade all trail dots
      for (var i = 0; i < TRAIL_SIZE; i++) {
        var op = parseFloat(trailDots[i].el.style.opacity) || 0;
        if (op > 0.01) {
          trailDots[i].el.style.opacity = (op * 0.92).toFixed(3);
        } else if (op > 0) {
          trailDots[i].el.style.opacity = '0';
        }
      }
    }, 25);
  }
})();
