function keepViewerFocus(event) {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll('button')]
    .filter(button => button.getClientRects().length);
  if (!controls.length) return;
  const current = controls.indexOf(document.activeElement);
  const next = event.shiftKey
    ? (current <= 0 ? controls.length - 1 : current - 1)
    : (current + 1) % controls.length;
  event.preventDefault();
  controls[next].focus();
}

baguetteBox.run('.game-list', {
  animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : 'fadeIn',
  overlayBackgroundColor: 'rgba(21, 29, 37, 0.86)',
  afterShow() {
    const viewer = document.getElementById('baguetteBox-overlay');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', 'Game screenshots');
    viewer.removeAttribute('aria-labelledby');
    viewer.addEventListener('keydown', keepViewerFocus);
    viewer.querySelector('#close-button').focus();
  },
  afterHide() {
    document.getElementById('baguetteBox-overlay').removeEventListener('keydown', keepViewerFocus);
  },
});
