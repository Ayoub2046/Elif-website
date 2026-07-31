(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js').catch(function () {});
  });

  var deferredPrompt = null;
  var installed = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  function removeButton() {
    var btn = document.getElementById('elif-pwa-install-btn');
    if (btn) btn.remove();
  }

  function showButton() {
    if (installed || document.getElementById('elif-pwa-install-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'elif-pwa-install-btn';
    btn.innerHTML = '<i class="fas fa-download"></i> Install Elif PU App';
    btn.setAttribute('aria-label', 'Install the Elif PU College app');
    btn.style.cssText = [
      'position:fixed;bottom:18px;right:18px;z-index:99999;',
      'display:flex;align-items:center;gap:8px;',
      'padding:10px 16px;border:none;border-radius:50px;',
      'background:linear-gradient(135deg,#0f510e,#1b9e1b);color:#fff;',
      'font-size:14px;font-weight:600;font-family:inherit;',
      'box-shadow:0 6px 20px rgba(15,81,14,.4);cursor:pointer;'
    ].join('');
    btn.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
      } else {
        removeButton();
      }
    });
    document.body.appendChild(btn);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showButton();
  });

  window.addEventListener('appinstalled', function () {
    installed = true;
    removeButton();
  });

  window.addEventListener('resize', function () {
    if (installed) removeButton();
  });
})();
