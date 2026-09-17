const modeSel = document.getElementById('mode');
const customBox = document.getElementById('customBox');
const enabledBox = document.getElementById('enabled');
const status = document.getElementById('status');

const catBoxes = {
  functional: document.getElementById('functional'),
  analytics: document.getElementById('analytics'),
  marketing: document.getElementById('marketing'),
};

function refreshCustomVisibility() {
  customBox.style.display = modeSel.value === 'custom' ? 'block' : 'none';
}
modeSel.addEventListener('change', refreshCustomVisibility);

chrome.storage.sync.get(['prefs'], (data) => {
  const p = data.prefs || { mode: 'rejectAll', categories: {}, enabled: true };
  modeSel.value = p.mode;
  enabledBox.checked = p.enabled !== false;
  for (const key in catBoxes) {
    catBoxes[key].checked = !!(p.categories && p.categories[key]);
  }
  refreshCustomVisibility();
});

document.getElementById('save').addEventListener('click', () => {
  const prefs = {
    mode: modeSel.value,
    enabled: enabledBox.checked,
    categories: {
      necessary: true,
      functional: catBoxes.functional.checked,
      analytics: catBoxes.analytics.checked,
      marketing: catBoxes.marketing.checked,
    },
  };
  chrome.storage.sync.set({ prefs }, () => {
    status.textContent = 'Saved.';
    setTimeout(() => (status.textContent = ''), 1500);
  });
});

// --- Tabs ---
const tabs = document.querySelectorAll('.tab');
const panes = document.querySelectorAll('.pane');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    panes.forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.pane).classList.add('active');
    if (tab.dataset.pane === 'logPane') renderLog();
  });
});

// --- History log ---
const logDiv = document.getElementById('log');
const searchBox = document.getElementById('search');

function renderLog() {
  chrome.storage.local.get(['log'], (data) => {
    const log = (data.log || []).slice().reverse(); // newest first
    const term = searchBox.value.trim().toLowerCase();
    const filtered = term ? log.filter((e) => e.site.toLowerCase().includes(term)) : log;

    if (filtered.length === 0) {
      logDiv.innerHTML = '<div class="empty">No history yet.</div>';
      return;
    }

    logDiv.innerHTML = filtered
      .map((e) => {
        const date = new Date(e.time).toLocaleString();
        return `<div class="entry">
          <div class="site">${escapeHtml(e.site)}</div>
          <div class="meta">${escapeHtml(e.choice)} via ${escapeHtml(e.method)} · ${date}</div>
        </div>`;
      })
      .join('');
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

searchBox.addEventListener('input', renderLog);

document.getElementById('clearLog').addEventListener('click', () => {
  chrome.storage.local.set({ log: [] }, renderLog);
});
