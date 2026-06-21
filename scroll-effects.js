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

  // Scroll reveal
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.section-header').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  document.querySelectorAll('.content').forEach(el => {
    if (!el.querySelector('.services-grid')) {
      el.classList.add('reveal');
      revealObserver.observe(el);
    }
  });

  document.querySelectorAll('.service-item').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${i * 0.12}s`;
    revealObserver.observe(el);
  });
})();
