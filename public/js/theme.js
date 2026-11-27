/* Runs before first paint (in <head>) so there is no flash of the wrong theme. */
(function () {
  var saved = null;
  try { saved = localStorage.getItem('sz-theme'); } catch (e) { /* storage may be blocked */ }
  var dark = saved ? saved === 'dark' : window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
