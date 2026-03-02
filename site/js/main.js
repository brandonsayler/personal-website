// Theme switching, fixed quotes, card toggling, pause/trash controls, floating cursor, dark mode

(function () {
  'use strict';

  // =========================================================================
  // Wikipedia links per fractal theme
  // =========================================================================

  var wikiLinks = {
    ember:  { name: 'Quadratic Koch Island',  url: 'https://en.wikipedia.org/wiki/Koch_snowflake#Variants' },
    ocean:  { name: 'Minkowski Sausage',      url: 'https://en.wikipedia.org/wiki/Minkowski_sausage' },
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
  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var theme = btn.dataset.theme;
      document.body.className = 'theme-' + theme;
      themeButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      // Switch fractal type (does NOT clear canvas — fractals coexist)
      if (window.setFractalTheme) window.setFractalTheme(theme);
      // Update Wikipedia link
      updateWikiLink(theme);
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
  // Dark mode
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
    try { localStorage.setItem('darkMode', isDark ? '1' : '0'); } catch (e) {}
  }

  // Initialize: check localStorage first, then system preference
  var stored = null;
  try { stored = localStorage.getItem('darkMode'); } catch (e) {}

  if (stored !== null) {
    setDarkMode(stored === '1');
  } else {
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }

  // Listen for system preference changes (only if no manual override)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      var hasManual = null;
      try { hasManual = localStorage.getItem('darkMode'); } catch (err) {}
      if (hasManual === null) {
        setDarkMode(e.matches);
      }
    });
  }

  // Manual toggle
  btnDarkMode.addEventListener('click', function () {
    var isDark = htmlEl.getAttribute('data-mode') === 'dark';
    setDarkMode(!isDark);
  });

  // =========================================================================
  // Floating laggy cursor (SVG dot + halo)
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
