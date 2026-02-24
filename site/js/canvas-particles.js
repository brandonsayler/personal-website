// Interactive particle constellation canvas
// Click to spawn clusters; particles drift and connect with lines

(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const MAX_PARTICLES = 300;
  const CONNECT_DIST = 120;
  let mouse = { x: null, y: null };
  let animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function getThemeColors() {
    const style = getComputedStyle(document.body);
    return {
      primary: style.getPropertyValue('--canvas-primary').trim() || '#ff6b35',
      secondary: style.getPropertyValue('--canvas-secondary').trim() || '#ffa040',
    };
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function createParticle(x, y, burst) {
    if (particles.length >= MAX_PARTICLES) return;
    const speed = burst ? (Math.random() * 1.5 + 0.5) : (Math.random() * 0.4 + 0.1);
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 2.2 + 0.8,
      life: 1,
      decay: Math.random() * 0.001 + 0.0005,
      useSecondary: Math.random() > 0.5,
    });
  }

  // Seed some initial particles
  function seed() {
    for (let i = 0; i < 60; i++) {
      createParticle(Math.random() * W, Math.random() * H, false);
    }
  }

  function spawnBurst(x, y) {
    const count = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      createParticle(x, y, true);
    }
  }

  function update() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      // Gentle drift
      p.vx *= 0.999;
      p.vy *= 0.999;

      // Wrap edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Keep a minimum number alive
    while (particles.length < 40) {
      createParticle(Math.random() * W, Math.random() * H, false);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const colors = getThemeColors();
    const rgbPrimary = hexToRgb(colors.primary);
    const rgbSecondary = hexToRgb(colors.secondary);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.15 * Math.min(particles[i].life, particles[j].life);
          ctx.strokeStyle = `rgba(${rgbPrimary.r},${rgbPrimary.g},${rgbPrimary.b},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw mouse connections
    if (mouse.x !== null) {
      for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST * 1.5) {
          const alpha = (1 - dist / (CONNECT_DIST * 1.5)) * 0.2 * particles[i].life;
          ctx.strokeStyle = `rgba(${rgbSecondary.r},${rgbSecondary.g},${rgbSecondary.b},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      const rgb = p.useSecondary ? rgbSecondary : rgbPrimary;
      const alpha = p.life * 0.7;
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Events
  window.addEventListener('resize', resize);

  canvas.addEventListener('click', function (e) {
    spawnBurst(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  canvas.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  // Touch support
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    const t = e.touches[0];
    spawnBurst(t.clientX, t.clientY);
  }, { passive: false });

  // Init
  resize();
  seed();
  loop();
})();
