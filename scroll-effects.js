(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero parallax
  if (!reducedMotion) {
    const hero = document.querySelector('.hero');
    const heroShape = document.querySelector('.hero-shape');
    const heroText = document.querySelector('.hero-text');

    if (hero && heroShape) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < hero.offsetHeight * 1.5) {
          heroShape.style.transform = `translateY(calc(-50% + ${y * 0.35}px))`;
          if (heroText) heroText.style.transform = `translateY(${y * 0.12}px)`;
        }
      }, { passive: true });
    }
  }
})();
