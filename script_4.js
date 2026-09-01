
(() => {
  'use strict';
  const installButton = document.getElementById('installAppButton');
  const shareButton = document.getElementById('shareAppButton');
  const sheet = document.getElementById('installSheet');
  const sheetBody = document.getElementById('installSheetBody');
  const sheetClose = document.getElementById('installSheetClose');
  const toast = document.getElementById('pwaToast');
  const offlineBadge = document.getElementById('pwaOffline');
  let deferredInstallPrompt = null;
  let toastTimer = 0;
  let installReturnFocus = null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function showToast(message, duration = 2600) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), duration);
  }

  function updateOfflineState(event) {
    if (!offlineBadge) return;
    offlineBadge.hidden = navigator.onLine;
    if (event?.type === 'online') showToast('Back online');
  }

  function openInstallHelp(kind = 'generic') {
    if (!sheet || !sheetBody) return;
    let content = '';
    if (kind === 'ios') {
      content = `
        <h3>Add it to your iPhone or iPad</h3>
        <p>Apple requires you to approve the Home Screen icon. It takes only a few taps.</p>
        <ol class="install-steps">
          <li><span>Open this page in <strong>Safari</strong>.</span></li>
          <li><span>Tap Safari's <strong>Share</strong> button.</span></li>
          <li><span>Choose <strong>Add to Home Screen</strong>.</span></li>
          <li><span>Turn on <strong>Open as Web App</strong>, then tap <strong>Add</strong>.</span></li>
        </ol>
        <div class="install-tip">After installation, look for the green butterfly-and-leaf icon named <strong>TX Lepidoptera</strong>.</div>`;
    } else {
      content = `
        <h3>Install from your browser</h3>
        <p>Your browser has not offered the automatic install box yet.</p>
        <ol class="install-steps">
          <li><span>Open the browser menu.</span></li>
          <li><span>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span></li>
          <li><span>Approve the installation.</span></li>
        </ol>
        <div class="install-tip">On Android, Chrome usually shows an automatic installation box after the site has loaded.</div>`;
    }
    installReturnFocus = document.activeElement;
    sheetBody.innerHTML = content;
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    sheetClose?.focus();
  }

  function closeInstallHelp() {
    if (!sheet || !sheet.classList.contains('open')) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (installReturnFocus && document.contains(installReturnFocus)) installReturnFocus.focus();
    installReturnFocus = null;
  }

  function refreshInstallButton() {
    if (!installButton) return;
    if (isStandalone()) {
      installButton.hidden = true;
      return;
    }
    installButton.hidden = false;
    installButton.textContent = deferredInstallPrompt ? '📲 Install this app' : (isIOS ? '📲 Add to Home Screen' : '📲 Installation help');
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    refreshInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    refreshInstallButton();
    showToast('App installed. You can now open it from your Home Screen.');
  });

  installButton?.addEventListener('click', async () => {
    if (isStandalone()) return;
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      refreshInstallButton();
      if (result.outcome === 'accepted') showToast('Installation approved');
      return;
    }
    openInstallHelp(isIOS ? 'ios' : 'generic');
  });

  shareButton?.addEventListener('click', async () => {
    const shareData = {
      title: 'Texas Butterflies, Moths & Their Host Plants',
      text: 'Explore Texas butterflies, moths, and their recorded caterpillar host plants.',
      url: window.location.href
    };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('App link copied');
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('App link copied');
      } catch (_) {
        window.prompt('Copy this app link:', window.location.href);
      }
    }
  });

  sheetClose?.addEventListener('click', closeInstallHelp);
  sheet?.addEventListener('click', event => { if (event.target === sheet) closeInstallHelp(); });
  document.addEventListener('keydown', event => {
    if (!sheet?.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeInstallHelp();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = [...sheet.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && !el.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('online', updateOfflineState);
  window.addEventListener('offline', updateOfflineState);
  updateOfflineState();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
        registration.update().catch(() => {});
      } catch (error) {
        console.warn('Offline app registration failed:', error);
      }
    });
  }

  refreshInstallButton();
})();
