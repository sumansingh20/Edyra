const STORAGE_KEY = 'edyra-browser-v1';

const state = {
  tabs: [],
  activeTabId: null,
  incognito: false,
  ui: {
    theme: 'dark',
    homePage: 'https://www.google.com',
    searchEngine: 'google',
    adblockEnabled: true,
    devtoolsEnabled: false,
  },
};

const $ = (sel) => document.querySelector(sel);

const root = $('#root');

function parseState(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function loadPersisted() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const persisted = parseState(raw);
  if (!persisted) return;
  state.ui = { ...state.ui, ...(persisted.ui || {}) };
  state.tabs = Array.isArray(persisted.tabs) ? persisted.tabs : [];
  state.activeTabId = persisted.activeTabId || (state.tabs[0]?.id ?? null);
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ui: state.ui,
      tabs: state.tabs,
      activeTabId: state.activeTabId,
    })
  );
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function detectIncognitoFromWindow() {
  // Incognito windows are separate Electron partitions; for UI we keep a flag in memory only.
  // We infer from pathname loaded from main process: use dataset from window name if set.
  return false;
}

function getWebviewForTab(tabId) {
  return document.querySelector(`webview[data-tab-id="${tabId}"]`);
}

function renderBaseUI() {
  root.innerHTML = `
    <div class="tabs" id="tabsStrip"></div>
    <div class="topbar">
      <button class="btn" id="btnBack">←</button>
      <button class="btn" id="btnForward">→</button>
      <button class="btn" id="btnRefresh">⟳</button>
      <button class="btn" id="btnHome">⌂</button>
      <div class="addr" title="Address / Search">
        <span id="chipMode" class="text-xs opacity-70"></span>
        <input id="addrInput" spellcheck="false" value="" />
      </div>
      <button class="btn primary" id="btnGo">Go</button>
      <button class="btn" id="btnNewTab">＋</button>
      <button class="btn" id="btnBookmarks">☆</button>
      <button class="btn" id="btnDownloads">⬇</button>
      <button class="btn" id="btnHistory">🕘</button>
      <button class="btn" id="btnSettings">⚙</button>
    </div>
    <div class="content" id="content"></div>

    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal" id="modal"></div>
    </div>
    <div class="toast" id="toast" style="display:none"></div>
  `;
}

function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => (t.style.display = 'none'), 2500);
}

function makeTabElement(tab) {
  const title = tab.title || tab.url;
  return `
    <div class="tab ${tab.id === state.activeTabId ? 'active' : ''}" 
      draggable="true" data-tab-id="${tab.id}" title="${escapeHtml(title)}">
      <span class="tab-favicon" aria-hidden="true">🌐</span>
      <span class="tab-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">${escapeHtml(title)}</span>
      <button class="tab-close" data-action="close" style="border:none;background:transparent;color:inherit;cursor:pointer;opacity:0.7">✕</button>
    </div>
  `;
}

function renderTabs() {
  const strip = $('#tabsStrip');
  strip.innerHTML = state.tabs.map(makeTabElement).join('');
  // Update input
  const active = state.tabs.find((t) => t.id === state.activeTabId);
  $('#addrInput').value = active?.url || '';

  // Bind events
  strip.querySelectorAll('.tab').forEach((el) => {
    el.addEventListener('click', () => switchToTab(el.dataset.tabId));

    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', el.dataset.tabId);
      e.dataTransfer.effectAllowed = 'move';
    });

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromId = e.dataTransfer.getData('text/plain');
      const toId = el.dataset.tabId;
      if (!fromId || !toId || fromId === toId) return;
      reorderTabs(fromId, toId);
    });

    el.querySelector('[data-action="close"]')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeTab(el.dataset.tabId);
    });

    // Hover preview
    el.addEventListener('mouseenter', () => {
      const tabId = el.dataset.tabId;
      previewTab(tabId);
    });
  });
}

function renderWebviews() {
  const content = $('#content');
  const existing = new Set([...content.querySelectorAll('webview')].map((w) => w.dataset.tabId));

  // remove old
  [...existing].forEach((id) => {
    if (!state.tabs.some((t) => t.id === id)) {
      content.querySelector(`webview[data-tab-id="${id}"]`)?.remove();
    }
  });

  // add missing
  for (const tab of state.tabs) {
    if (existing.has(tab.id)) continue;
    const w = document.createElement('webview');
    w.dataset.tabId = tab.id;
    w.src = tab.url;
    w.setAttribute('partition', tab.incognito ? 'persist:edyra-incognito' : 'persist:edyra-default');
    w.preload = '';
    w.style.display = tab.id === state.activeTabId ? 'block' : 'none';
    content.appendChild(w);

    w.addEventListener('did-navigate', () => {
      // tab.url updates via IPC is not possible; best effort read
      try {
        // webview URL is exposed via getURL
        const url = w.getURL();
        tab.url = url;
        $('#addrInput').value = tab.id === state.activeTabId ? url : $('#addrInput').value;
        persist();
      } catch {}
    });

    w.addEventListener('page-title-updated', (e) => {
      tab.title = e.title;
      if (tab.id === state.activeTabId) renderTabs();
      persist();
    });
  }

  // show active only
  content.querySelectorAll('webview').forEach((w) => {
    w.style.display = w.dataset.tabId === state.activeTabId ? 'block' : 'none';
  });
}

function switchToTab(tabId) {
  state.activeTabId = tabId;
  renderTabs();
  renderWebviews();
  persist();
}

function reorderTabs(fromId, toId) {
  const fromIndex = state.tabs.findIndex((t) => t.id === fromId);
  const toIndex = state.tabs.findIndex((t) => t.id === toId);
  if (fromIndex < 0 || toIndex < 0) return;
  const [moved] = state.tabs.splice(fromIndex, 1);
  state.tabs.splice(toIndex, 0, moved);
  state.activeTabId = fromId;
  renderTabs();
  renderWebviews();
  persist();
}

function closeTab(tabId) {
  if (state.tabs.length <= 1) {
    showToast('At least one tab is required');
    return;
  }
  const idx = state.tabs.findIndex((t) => t.id === tabId);
  if (idx < 0) return;
  state.tabs.splice(idx, 1);
  if (state.activeTabId === tabId) {
    const next = state.tabs[Math.max(0, idx - 1)]?.id ?? state.tabs[0].id;
    state.activeTabId = next;
  }
  renderTabs();
  renderWebviews();
  persist();
}

function previewTab(tabId) {
  // Lightweight preview: just update title chip.
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!tab) return;
  $('#chipMode').textContent = (tabId === state.activeTabId) ? 'Active' : 'Preview';
}

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resolveInputToUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return state.ui.homePage;

  // If it looks like a URL
  const hasProtocol = /^https?:\/\//i.test(raw);
  const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(raw);

  if (hasProtocol) return raw;
  if (looksLikeDomain) return `https://${raw}`;

  // Otherwise search query
  const q = encodeURIComponent(raw);
  if (state.ui.searchEngine === 'google') return `https://www.google.com/search?q=${q}`;
  if (state.ui.searchEngine === 'duckduckgo') return `https://duckduckgo.com/?q=${q}`;
  return `https://www.google.com/search?q=${q}`;
}

function setupNavigationControls() {
  $('#btnGo').addEventListener('click', () => goFromAddress());
  $('#addrInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goFromAddress();
  });

  $('#btnNewTab').addEventListener('click', () => {
    const url = state.ui.homePage;
    const tab = { id: randomId(), url, title: 'New Tab', incognito: false };
    state.tabs.push(tab);
    state.activeTabId = tab.id;
    renderTabs();
    renderWebviews();
    persist();
  });

  $('#btnBack').addEventListener('click', () => {
    const w = getWebviewForTab(state.activeTabId);
    w?.goBack();
  });

  $('#btnForward').addEventListener('click', () => {
    const w = getWebviewForTab(state.activeTabId);
    w?.goForward();
  });

  $('#btnRefresh').addEventListener('click', () => {
    const w = getWebviewForTab(state.activeTabId);
    w?.reload();
  });

  $('#btnHome').addEventListener('click', () => {
    navigateActive(state.ui.homePage);
  });
}

function goFromAddress() {
  const input = $('#addrInput').value;
  const url = resolveInputToUrl(input);
  navigateActive(url);
}

function navigateActive(url) {
  const w = getWebviewForTab(state.activeTabId);
  if (!w) return;
  $('#addrInput').value = url;

  // Loading indicator would be in UI; for now show toast.
  w.loadURL(url);
}

function setupModals() {
  const backdrop = $('#modalBackdrop');
  const modal = $('#modal');

  window.openModal = (html) => {
    modal.innerHTML = html;
    backdrop.style.display = 'flex';
  };

  window.closeModal = () => {
    backdrop.style.display = 'none';
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) window.closeModal();
  });
}

function bootstrap() {
  state.incognito = detectIncognitoFromWindow();
  renderBaseUI();
  setupModals();
  loadPersisted();

  if (state.tabs.length === 0) {
    state.tabs = [{ id: randomId(), url: state.ui.homePage, title: 'Home', incognito: false }];
    state.activeTabId = state.tabs[0].id;
  }

  renderTabs();
  renderWebviews();
  setupNavigationControls();

  $('#btnBookmarks').addEventListener('click', () => window.renderBookmarksModal?.());
  $('#btnHistory').addEventListener('click', () => window.renderHistoryModal?.());
  $('#btnDownloads').addEventListener('click', () => window.renderDownloadsModal?.());
  $('#btnSettings').addEventListener('click', () => window.renderSettingsModal?.());
}

bootstrap();

// Expose minimal API to modules
window.edyraState = state;
window.edyraNavigateActive = navigateActive;
window.edyraRenderTabs = renderTabs;
window.edyraRenderWebviews = renderWebviews;
window.edyraSwitchToTab = switchToTab;
window.edyraCloseTab = closeTab;
window.edyraResolveInputToUrl = resolveInputToUrl;
window.edyraGetActiveWebview = () => getWebviewForTab(state.activeTabId);
window.edyraPersist = persist;
window.edyraShowToast = showToast;

