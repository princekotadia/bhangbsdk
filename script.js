const button = document.querySelector('.menu-button');
const menu = document.querySelector('.mobile-menu');
const closeButton = document.querySelector('.menu-close');
const menuLinks = document.querySelectorAll('.mobile-menu a');
const mainContent = document.querySelector('main');
let closeTimer;

const setPageInert = (isInert) => {
  if (!mainContent) return;
  mainContent.inert = isInert;
  if (isInert) {
    mainContent.setAttribute('aria-hidden', 'true');
  } else {
    mainContent.removeAttribute('aria-hidden');
  }
};

const trapMenuFocus = (event) => {
  if (event.key !== 'Tab' || !menu?.classList.contains('is-open')) return;
  const focusableItems = [...menu.querySelectorAll('a[href], button:not([disabled])')];
  const firstItem = focusableItems[0];
  const lastItem = focusableItems[focusableItems.length - 1];

  if (!firstItem || !lastItem) return;
  if (event.shiftKey && document.activeElement === firstItem) {
    event.preventDefault();
    lastItem.focus();
  } else if (!event.shiftKey && document.activeElement === lastItem) {
    event.preventDefault();
    firstItem.focus();
  }
};

const closeMenu = ({ returnFocus = true } = {}) => {
  if (!button || !menu) return;
  button.setAttribute('aria-expanded', 'false');
  button.querySelector('.sr-only').textContent = 'Open menu';
  button.setAttribute('aria-label', 'Open navigation menu');
  menu.classList.remove('is-open');
  document.body.classList.remove('menu-is-open');
  setPageInert(false);
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => {
    menu.hidden = true;
    if (returnFocus) button.focus();
  }, 480);
};

const openMenu = () => {
  if (!button || !menu) return;
  window.clearTimeout(closeTimer);
  menu.hidden = false;
  window.requestAnimationFrame(() => menu.classList.add('is-open'));
  button.setAttribute('aria-expanded', 'true');
  button.querySelector('.sr-only').textContent = 'Close menu';
  button.setAttribute('aria-label', 'Close navigation menu');
  document.body.classList.add('menu-is-open');
  setPageInert(true);
  window.setTimeout(() => closeButton?.focus(), 30);
};

if (button && menu) {
  button.addEventListener('click', () => {
    button.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });
  closeButton?.addEventListener('click', closeMenu);
  menuLinks.forEach((link) => link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    const target = href?.startsWith('#') ? document.querySelector(href) : null;

    if (!target) {
      closeMenu({ returnFocus: false });
      return;
    }

    event.preventDefault();
    closeMenu({ returnFocus: false });
    window.history.pushState(null, '', href);
    window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }));
  document.addEventListener('keydown', (event) => {
    if (button.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') closeMenu();
    trapMenuFocus(event);
  });
}

const careCarousel = document.querySelector('.care-carousel');
const careTrack = document.querySelector('.care-track');
const careCards = [...document.querySelectorAll('.care-card')];
const carePrevious = document.querySelector('[data-care-previous]');
const careNext = document.querySelector('[data-care-next]');

if (careCarousel && careTrack && careCards.length) {
  let activeCare = 0;
  let activePointerId = null;
  let dragAxis = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScroll = 0;
  let dragStartCare = 0;
  let scrollFrame;
  let careAnimation;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const carePosition = (index) => {
    const safeIndex = Math.max(0, Math.min(index, careCards.length - 1));
    const card = careCards[safeIndex];
    if (window.matchMedia('(max-width: 47.9375rem)').matches) {
      return Math.max(0, card.offsetLeft - ((careTrack.clientWidth - card.offsetWidth) / 2));
    }

    const trackInset = Number.parseFloat(window.getComputedStyle(careTrack).paddingLeft) || 0;
    return Math.max(0, card.offsetLeft - trackInset);
  };

  const setActiveCare = (index) => {
    activeCare = Math.max(0, Math.min(index, careCards.length - 1));
    if (carePrevious) carePrevious.disabled = activeCare === 0;
    if (careNext) careNext.disabled = activeCare === careCards.length - 1;
  };

  const findActiveCare = () => {
    const nearest = careCards.reduce((closest, card, index) => {
      const distance = Math.abs(carePosition(index) - careTrack.scrollLeft);
      return distance < closest.distance ? { index, distance } : closest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY });
    setActiveCare(nearest.index);
  };

  const animateCareTo = (index) => {
    const target = carePosition(index);
    const start = careTrack.scrollLeft;
    const distance = target - start;
    const duration = reducedMotion ? 0 : 460;
    const startTime = window.performance.now();
    window.cancelAnimationFrame(careAnimation);
    careTrack.classList.add('is-animating');

    if (!duration || Math.abs(distance) < 1) {
      careTrack.scrollLeft = target;
      careTrack.classList.remove('is-animating');
      setActiveCare(index);
      return;
    }

    const frame = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - ((1 - progress) ** 3);
      careTrack.scrollLeft = start + (distance * easeOut);
      if (progress < 1) {
        careAnimation = window.requestAnimationFrame(frame);
      } else {
        careTrack.classList.remove('is-animating');
        setActiveCare(index);
      }
    };

    careAnimation = window.requestAnimationFrame(frame);
  };

  const moveCare = (direction) => {
    const target = Math.max(0, Math.min(activeCare + direction, careCards.length - 1));
    animateCareTo(target);
  };

  carePrevious?.addEventListener('click', () => moveCare(-1));
  careNext?.addEventListener('click', () => moveCare(1));

  careCarousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveCare(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveCare(-1);
    }
  });

  careTrack.addEventListener('scroll', () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(findActiveCare);
  }, { passive: true });

  careTrack.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    window.cancelAnimationFrame(careAnimation);
    careTrack.classList.remove('is-animating');
    activePointerId = event.pointerId;
    dragAxis = null;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartScroll = careTrack.scrollLeft;
    dragStartCare = activeCare;
  });

  careTrack.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointerId) return;
    const horizontalDistance = event.clientX - dragStartX;
    const verticalDistance = event.clientY - dragStartY;

    if (!dragAxis) {
      if (Math.max(Math.abs(horizontalDistance), Math.abs(verticalDistance)) < 8) return;
      dragAxis = Math.abs(horizontalDistance) > Math.abs(verticalDistance) ? 'horizontal' : 'vertical';
      if (dragAxis === 'vertical') return;
      careTrack.setPointerCapture(event.pointerId);
      careTrack.classList.add('is-dragging');
    }

    if (dragAxis !== 'horizontal') return;
    if (event.cancelable) event.preventDefault();
    careTrack.scrollLeft = dragStartScroll - horizontalDistance;
  });

  const finishDrag = (event) => {
    if (event.pointerId !== activePointerId) return;
    const horizontalDistance = event.clientX - dragStartX;
    const cardStep = careCards.length > 1 ? carePosition(1) - carePosition(0) : careCards[0].offsetWidth;
    const threshold = Math.max(42, Math.min(72, cardStep * 0.16));
    let target = activeCare;

    if (dragAxis === 'horizontal') {
      if (Math.abs(horizontalDistance) > threshold) {
        const cardCount = Math.max(1, Math.round(Math.abs(horizontalDistance) / cardStep));
        target = dragStartCare + (horizontalDistance < 0 ? cardCount : -cardCount);
      } else {
        findActiveCare();
        target = activeCare;
      }
    }

    activePointerId = null;
    dragAxis = null;
    careTrack.classList.remove('is-dragging');
    if (careTrack.hasPointerCapture(event.pointerId)) careTrack.releasePointerCapture(event.pointerId);
    animateCareTo(target);
  };

  careTrack.addEventListener('pointerup', finishDrag);
  careTrack.addEventListener('pointercancel', finishDrag);
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(careAnimation);
    careTrack.scrollLeft = carePosition(activeCare);
  }, { passive: true });
  setActiveCare(0);
}
