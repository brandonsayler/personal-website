// Theme switching, quote rotation, card toggling

(function () {
  // --- Quotes ---
  // Each quote has text, author name, and a Wikipedia link for the author.
  const quotes = [
    {
      text: "The noblest question in the world is: What good may I do in it?",
      author: "Benjamin Franklin",
      url: "https://en.wikipedia.org/wiki/Benjamin_Franklin"
    },
    {
      text: "Health, daily sustenance, and lack of adversity? Life is momentary and deceptive; and the body is as if on loan.",
      author: "\u015A\u0101ntideva",
      url: "https://en.wikipedia.org/wiki/%C5%9A%C4%81ntideva"
    },
    {
      text: "He who has a why to live can bear almost any how.",
      author: "Friedrich Nietzsche",
      url: "https://en.wikipedia.org/wiki/Friedrich_Nietzsche"
    },
    {
      text: "Poetry is when an emotion has found its thought and the thought has found words.",
      author: "Robert Frost",
      url: "https://en.wikipedia.org/wiki/Robert_Frost"
    },
  ];

  let quoteIndex = 0;
  const quoteText = document.getElementById('quote-text');
  const quoteAuthor = document.getElementById('quote-author');

  function renderAuthor(q) {
    return '<a href="' + q.url + '" target="_blank" rel="noopener">' + q.author + '</a>';
  }

  function showQuote(index) {
    quoteText.classList.remove('visible');
    quoteAuthor.classList.remove('visible');

    setTimeout(function () {
      quoteText.textContent = quotes[index].text;
      quoteAuthor.innerHTML = renderAuthor(quotes[index]);
      quoteText.classList.add('visible');
      quoteAuthor.classList.add('visible');
    }, 400);
  }

  function nextQuote() {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    showQuote(quoteIndex);
  }

  // Show first quote immediately
  quoteText.textContent = quotes[0].text;
  quoteAuthor.innerHTML = renderAuthor(quotes[0]);
  // Small delay so the fade-in transition fires
  requestAnimationFrame(function () {
    quoteText.classList.add('visible');
    quoteAuthor.classList.add('visible');
  });

  // Rotate quotes every 10s
  setInterval(nextQuote, 10000);

  // --- Theme switching ---
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const theme = btn.dataset.theme;
      document.body.className = 'theme-' + theme;
      themeButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      // Update fractal type and clear canvas on theme switch
      if (window.setFractalTheme) window.setFractalTheme(theme);
      if (window.clearFractalCanvas) window.clearFractalCanvas();
      // Advance quote on theme switch
      nextQuote();
    });
  });

  // --- Card toggle (more / less) ---
  const card = document.getElementById('card');
  const more = document.getElementById('more');
  const toggleMore = document.getElementById('toggle-more');
  const toggleLess = document.getElementById('toggle-less');

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
})();
