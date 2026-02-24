// Theme switching, fixed quotes, card toggling, pause/trash controls, floating cursor

(function () {
  'use strict';

  // =========================================================================
  // Fixed quotes — each theme always shows the same quote
  // =========================================================================
  // Quotes are embedded in the HTML per-theme using .only-{theme} classes.
  // No cycling or rotation needed. Switching themes shows the matching quote.

  // =========================================================================
  // Theme switching
  // =========================================================================

  var themeButtons = document.querySelectorAll('.fractal-btn');
  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var theme = btn.dataset.theme;
      document.body.className = 'theme-' + theme;
      themeButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      // Switch fractal type (does NOT clear canvas — fractals coexist)
      if (window.setFractalTheme) window.setFractalTheme(theme);
    });
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
  // Pause / Trash controls (like Soares)
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
  // Floating laggy cursor (like Soares' SVG dot + halo)
  // =========================================================================

  var dot = document.getElementById('dot');
  var halo = document.getElementById('halo');
  var cursorSvg = document.getElementById('cursor-svg');

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
    }, 25);
  }
})();
