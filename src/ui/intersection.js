const fadeSelector = '[data-animate="fade"]';

export function registerAnimations() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    document.querySelectorAll(fadeSelector).forEach((el) => el.classList.remove('fade-enter'));
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

  document.querySelectorAll(fadeSelector).forEach((el) => {
    el.classList.add('fade-enter');
    observer.observe(el);
  });

  const lazyImages = document.querySelectorAll('img.lazy-image');
  lazyImages.forEach((img) => {
    if (img.complete) {
      img.dataset.loaded = 'true';
    } else {
      img.addEventListener('load', () => {
        img.dataset.loaded = 'true';
      });
      img.addEventListener('error', () => {
        img.dataset.loaded = 'true';
      });
    }
  });
}
