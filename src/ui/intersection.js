const fadeSelector = '[data-animate="fade"]';

export function registerAnimations() {
  if (typeof document === 'undefined') {
    return;
  }

  const elements = document.querySelectorAll(fadeSelector);
  const lazyImages = document.querySelectorAll('img.lazy-image');

  const markImageLoaded = (img) => {
    img.dataset.loaded = 'true';
  };

  lazyImages.forEach((img) => {
    if (img.complete) {
      markImageLoaded(img);
    } else if (typeof window !== 'undefined') {
      img.addEventListener('load', () => markImageLoaded(img));
      img.addEventListener('error', () => markImageLoaded(img));
    } else {
      markImageLoaded(img);
    }
  });

  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.remove('fade-enter'));
    return;
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    elements.forEach((el) => {
      el.classList.remove('fade-enter');
      el.classList.remove('fade-enter-active');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-enter-active');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  elements.forEach((el) => {
    el.classList.add('fade-enter');
    observer.observe(el);
  });
}
