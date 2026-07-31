(function () {
  'use strict';

  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (isStandalone) return;

  var deferredPrompt = null;
  var btn = null;

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function removeButton() {
    if (btn) { btn.remove(); btn = null; }
  }

  function showInstructions() {
    if (document.getElementById('elif-pwa-modal')) return;

    var steps;
    if (isIOS()) {
      steps = [
        'Tap the <b>Share</b> button in Safari',
        'Scroll down and tap <b>Add to Home Screen</b>',
        'Tap <b>Add</b> to install the Elif PU app'
      ];
    } else {
      steps = [
        'Open the browser menu (three dots)',
        'Tap <b>Add to Home screen</b> or <b>Install app</b>',
        'Confirm to install the Elif PU app'
      ];
    }

    var modal = document.createElement('div');
    modal.id = 'elif-pwa-modal';
    modal.style.cssText = [
      'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.6);',
      'display:flex;align-items:center;justify-content:center;padding:20px;'
    ].join('');
    modal.addEventListener('click', function () { modal.remove(); });

    var box = document.createElement('div');
    box.style.cssText = [
      'background:#fff;border-radius:16px;max-width:360px;width:100%;',
      'padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.25);',
      'font-family:inherit;color:#222;'
    ].join('');
    box.addEventListener('click', function (e) { e.stopPropagation(); });

    var icon = document.createElement('img');
    icon.src = '/images/icons/icon-192.png';
    icon.alt = 'Elif PU';
    icon.style.cssText = 'width:56px;height:56px;border-radius:12px;display:block;margin:0 auto 12px;';
    box.appendChild(icon);

    var title = document.createElement('h3');
    title.textContent = 'Install Elif PU College';
    title.style.cssText = 'margin:0 0 14px;font-size:18px;text-align:center;color:#0f510e;';
    box.appendChild(title);

    var list = document.createElement('ol');
    list.style.cssText = 'margin:0 0 18px;padding-left:20px;font-size:14px;line-height:1.9;color:#333;';
    steps.forEach(function (s) {
      var li = document.createElement('li');
      li.innerHTML = s;
      list.appendChild(li);
    });
    box.appendChild(list);

    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'Got it';
    closeBtn.style.cssText = [
      'width:100%;padding:11px;border:none;border-radius:8px;',
      'background:linear-gradient(135deg,#0f510e,#1b9e1b);color:#fff;',
      'font-size:15px;font-weight:600;cursor:pointer;'
    ].join('');
    closeBtn.addEventListener('click', function () { modal.remove(); });
    box.appendChild(closeBtn);

    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  function onInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; removeButton(); });
    } else {
      showInstructions();
    }
  }

  function showButton() {
    if (btn || document.getElementById('elif-pwa-install-btn')) return;
    btn = document.createElement('button');
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
    btn.addEventListener('click', onInstallClick);
    document.body.appendChild(btn);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(function () {});
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showButton();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    removeButton();
  });

  window.setTimeout(showButton, 2000);
})();
