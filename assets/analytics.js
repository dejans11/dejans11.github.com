// Public Umami configuration. This website ID is not an account credential.
(() => {
  const domain = 'dejans11.github.io';
  if (window.location.hostname !== domain) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (document.getElementById('umami-tracker')) return;

  const tracker = document.createElement('script');
  tracker.id = 'umami-tracker';
  tracker.defer = true;
  tracker.src = 'https://cloud.umami.is/script.js';
  tracker.setAttribute('data-website-id', 'bd7ebc04-50fb-411f-a235-319790223f5d');
  tracker.setAttribute('data-domains', domain);
  tracker.setAttribute('data-do-not-track', 'true');
  tracker.setAttribute('data-exclude-search', 'true');
  tracker.setAttribute('data-exclude-hash', 'true');
  document.head.appendChild(tracker);
})();
