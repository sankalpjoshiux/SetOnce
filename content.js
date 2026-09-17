(() => {
  let prefs = null;
  let handled = false;

  chrome.storage.sync.get(['prefs'], (data) => {
    prefs = data.prefs || { mode: 'rejectAll', categories: {}, enabled: true };
    if (prefs.enabled === false) return;
    tryHandle();
    watchForBanner();
  });

  // Try repeatedly for a while, since banners often load late.
  function watchForBanner() {
    const observer = new MutationObserver(() => {
      if (!handled) tryHandle();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // Stop watching after 20s to save resources.
    setTimeout(() => observer.disconnect(), 20000);
  }

  function tryHandle() {
    if (handled) return;
    const acceptAll = prefs.mode === 'acceptAll';
    const rejectAll = prefs.mode === 'rejectAll';
    const cats = prefs.categories || {};

    // 1. OneTrust
    if (window.OneTrust || document.getElementById('onetrust-banner-sdk')) {
      try {
        if (acceptAll && window.OneTrust) { window.OneTrust.AllowAll(); markDone('OneTrust', 'acceptAll'); return; }
        if (rejectAll) {
          const rejectBtn = document.getElementById('onetrust-reject-all-handler');
          if (rejectBtn) { rejectBtn.click(); markDone('OneTrust', 'rejectAll'); return; }
        }
        // Custom: toggle group checkboxes then save.
        if (!acceptAll && !rejectAll) {
          const saveBtn = document.querySelector('.save-preference-btn-handler');
          if (saveBtn) {
            setOneTrustGroups(cats);
            saveBtn.click();
            markDone('OneTrust', 'custom');
            return;
          }
        }
      } catch (e) { /* fall through to generic */ }
    }

    // 2. Cookiebot
    if (window.Cookiebot) {
      try {
        if (acceptAll) { window.Cookiebot.submitCustomConsent(true, true, true); markDone('Cookiebot', 'acceptAll'); return; }
        if (rejectAll) { window.Cookiebot.submitCustomConsent(false, false, false); markDone('Cookiebot', 'rejectAll'); return; }
        window.Cookiebot.submitCustomConsent(!!cats.functional, !!cats.analytics, !!cats.marketing);
        markDone('Cookiebot', 'custom'); return;
      } catch (e) {}
    }

    // 3. Didomi
    if (window.Didomi) {
      try {
        if (acceptAll) { window.Didomi.setUserAgreeToAll(); markDone('Didomi', 'acceptAll'); return; }
        if (rejectAll) { window.Didomi.setUserDisagreeToAll(); markDone('Didomi', 'rejectAll'); return; }
        window.Didomi.setUserStatus({
          purposes: { enabled: enabledCatList(cats), disabled: disabledCatList(cats) },
        });
        markDone('Didomi', 'custom'); return;
      } catch (e) {}
    }

    // 4. IAB TCF API (Quantcast Choice and others use this)
    if (window.__tcfapi) {
      try {
        if (acceptAll) {
          window.__tcfapi('setAllVendorConsent', 2, () => {}, true);
        } else if (rejectAll) {
          window.__tcfapi('setAllVendorConsent', 2, () => {}, false);
        }
      } catch (e) {}
      // Many TCF UIs still need a click; fall through to generic matching too.
    }

    // 5. Generic: look for buttons by their visible text.
    genericButtonMatch(acceptAll, rejectAll);
  }

  function setOneTrustGroups(cats) {
    // OneTrust group checkboxes carry ids like onetrust-group-id-something;
    // easiest reliable path is the SDK's own consent object where present.
    if (window.OnetrustActiveGroups !== undefined && window.Optanon) {
      try { window.Optanon.setSetting && window.Optanon.setSetting(); } catch (e) {}
    }
  }

  function enabledCatList(cats) {
    return Object.keys(cats).filter((k) => cats[k]);
  }
  function disabledCatList(cats) {
    return Object.keys(cats).filter((k) => !cats[k]);
  }

  const ACCEPT_WORDS = ['accept all', 'allow all', 'agree', 'i accept', 'accept cookies', 'allow cookies'];
  const REJECT_WORDS = ['reject all', 'decline all', 'reject cookies', 'necessary only', 'only necessary', 'deny'];

  function genericButtonMatch(acceptAll, rejectAll) {
    const wanted = acceptAll ? ACCEPT_WORDS : (rejectAll ? REJECT_WORDS : null);
    if (!wanted) return; // custom mode with no CMP matched: leave banner alone.

    const candidates = document.querySelectorAll('button, a[role="button"], input[type="button"], div[role="button"]');
    for (const el of candidates) {
      const text = (el.innerText || el.value || '').trim().toLowerCase();
      if (!text || text.length > 40) continue;
      if (wanted.some((w) => text === w || text.includes(w))) {
        el.click();
        markDone('generic button match', acceptAll ? 'acceptAll' : 'rejectAll');
        return;
      }
    }
  }

  function markDone(method, choice) {
    handled = true;
    logAction(method, choice);
  }

  function logAction(method, choice) {
    const entry = {
      site: location.hostname,
      url: location.href,
      time: Date.now(),
      method,
      choice,
    };
    chrome.storage.local.get(['log'], (data) => {
      const log = data.log || [];
      log.push(entry);
      // Cap the log so it doesn't grow forever.
      const trimmed = log.length > 500 ? log.slice(log.length - 500) : log;
      chrome.storage.local.set({ log: trimmed });
    });
  }
})();
