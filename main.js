"use strict";

/* ---- Hamburger / Mobile Nav ---- */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

hamburger.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);
});

/* Close mobile nav on link click */
mobileNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileNav.classList.remove('open'));
});

/* ---- Sticky Navbar ---- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ---- Smooth scroll for all anchor links ---- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target && !a.classList.contains('open-modal')) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ---- Scroll to Top ---- */
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---- Intersection Observer for reveal animations ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      /* Trigger counters if inside this element */
      entry.target.querySelectorAll('.counter').forEach(startCounter);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, [data-stagger]').forEach(el => observer.observe(el));

/* Also observe counter sections directly */
document.querySelectorAll('.hero-stats, .about-stats').forEach(el => observer.observe(el));

/* ---- Counter animation ---- */
const countersStarted = new WeakSet();

function startCounter(el) {
  if (countersStarted.has(el)) return;
  countersStarted.add(el);
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

/* Run counters in hero immediately (already visible on load) */
window.addEventListener('load', () => {
  document.querySelectorAll('.hero .counter').forEach(startCounter);
});

/* ---- Products Carousel ---- */
(function () {
  const track = document.getElementById('productsTrack');
  const dotsContainer = document.getElementById('productsDots');
  const cards = track.querySelectorAll('.product-card');
  let current = 0;

  function getPerView() {
    if (window.innerWidth < 480) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    const pv = getPerView();
    const pages = Math.ceil(cards.length / pv);
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('span');
      if (i === current) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function goTo(index) {
    const pv = getPerView();
    const pages = Math.ceil(cards.length / pv);
    current = Math.max(0, Math.min(index, pages - 1));
    const cardWidth = cards[0].offsetWidth + 24; /* gap */
    track.style.transform = `translateX(-${current * pv * cardWidth}px)`;
    dotsContainer.querySelectorAll('span').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  document.getElementById('prodPrev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('prodNext').addEventListener('click', () => goTo(current + 1));

  buildDots();
  window.addEventListener('resize', () => { current = 0; buildDots(); goTo(0); });

  /* Auto-play */
  setInterval(() => {
    const pv = getPerView();
    const pages = Math.ceil(cards.length / pv);
    goTo(current + 1 < pages ? current + 1 : 0);
  }, 4500);
})();

/* ---- Testimonials Slider ---- */
(function () {
  const track = document.getElementById('testimonialsTrack');
  const slides = track.querySelectorAll('.testimonial-slide');
  const dotsContainer = document.getElementById('tDots');
  let current = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer.querySelectorAll('span').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  document.getElementById('tPrev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('tNext').addEventListener('click', () => goTo(current + 1));

  /* Auto-play */
  let autoplay = setInterval(() => goTo(current + 1), 6000);
  const slider = document.querySelector('.testimonials-slider');
  slider.addEventListener('mouseenter', () => clearInterval(autoplay));
  slider.addEventListener('mouseleave', () => { autoplay = setInterval(() => goTo(current + 1), 6000); });
})();

/* ---- Contact Modal ---- */
const modal = document.getElementById('contactModal');

function openModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  const firstFocusable = modal.querySelector('input, select, textarea');
  if (firstFocusable) firstFocusable.focus();
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.open-modal').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    openModal();
  });
});

document.getElementById('modalClose').addEventListener('click', closeModal);

modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

/* ---- Auto-popup: requires 3 scrolls AND at least 6 seconds on page ---- */
(function () {
  const SCROLL_THRESHOLD = 3;
  const MIN_TIME_MS      = 6000; // 6 seconds
  const SESSION_KEY      = 'bb_popup_shown';

  if (sessionStorage.getItem(SESSION_KEY)) return;

  let scrollCount  = 0;
  let timeElapsed  = false;
  let scrollMet    = false;

  // Start the minimum-time timer immediately
  setTimeout(() => {
    timeElapsed = true;
    maybeOpen();
  }, MIN_TIME_MS);

  function maybeOpen() {
    if (timeElapsed && scrollMet && !modal.classList.contains('open')) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setTimeout(openModal, 400);
    }
  }

  function onScroll() {
    scrollCount++;
    if (scrollCount >= SCROLL_THRESHOLD) {
      window.removeEventListener('scroll', onScroll);
      scrollMet = true;
      maybeOpen();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---- Zoho Forms: resize iframes + close modal on submission ---- */
window.addEventListener('message', function (event) {
  var data = event.data;
  if (!data || typeof data !== 'string') return;
  var parts = data.split('|');
  if (parts.length < 2) return;
  var perma   = parts[0];
  var newHeight = (parseInt(parts[1], 10) + 15) + 'px';
  var submitted = parts.length === 3;

  var sectionIframe = document.getElementById('zohoSectionIframe');
  if (sectionIframe && sectionIframe.src.indexOf(perma) > 0) {
    if (sectionIframe.style.height !== newHeight) sectionIframe.style.height = newHeight;
  }

  var modalIframe = document.getElementById('zohoModalIframe');
  if (modalIframe && modalIframe.src.indexOf(perma) > 0) {
    if (modalIframe.style.height !== newHeight) modalIframe.style.height = newHeight;
    if (submitted && modal.classList.contains('open')) {
      setTimeout(closeModal, 2200);
    }
  }
}, false);

/* ---- FAQ Accordion ---- */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ---- Hero Image Slider ---- */
(function () {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.hero-slide');
  const dots   = slider.querySelectorAll('.slider-dot');
  const total  = slides.length;
  let current  = 0;
  let autoplay;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + total) % total;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function startAutoplay() {
    autoplay = setInterval(() => goTo(current + 1), 4000);
  }

  function stopAutoplay() {
    clearInterval(autoplay);
  }

  slider.querySelector('.slider-prev').addEventListener('click', () => { stopAutoplay(); goTo(current - 1); startAutoplay(); });
  slider.querySelector('.slider-next').addEventListener('click', () => { stopAutoplay(); goTo(current + 1); startAutoplay(); });

  dots.forEach(dot => {
    dot.addEventListener('click', () => { stopAutoplay(); goTo(parseInt(dot.dataset.index, 10)); startAutoplay(); });
  });

  /* Pause on hover */
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  /* Touch / swipe support */
  let touchStartX = 0;
  slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      stopAutoplay();
      goTo(delta < 0 ? current + 1 : current - 1);
      startAutoplay();
    }
  }, { passive: true });

  startAutoplay();
})();
