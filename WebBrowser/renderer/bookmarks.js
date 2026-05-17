const BOOKMARK_KEY = 'edyra-bookmarks-v1';

function loadBookmarks() {
  const raw = localStorage.getItem(BOOKMARK_KEY);
  if (!raw) return { folders: [], items: [] };
  try { return JSON.parse(raw); } catch { return { folders: [], items: [] }; }
}

function saveBookmarks(data) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(data));
}

function getActiveUrl() {
  try { return window.edyraGetActiveWebview()?.getURL() || ''; } catch { return ''; }
}

function getActiveTitle() {
  const tabId = window.edyraState.activeTabId;
  const tab = window.edyraState.tabs.find((t) => t.id === tabId);
  return tab?.title || window.edyraGetActiveWebview()?.getTitle?.() || window.edyraState.ui.homePage;
}

function renderBookmarksBar(container) {
  const data = loadBookmarks();
  const bar = document.createElement('div');
  bar.className = 'row';
  const htmlItems = data.items
    .filter((x) => x.folderId === (data.rootFolderId ?? null))
    .map((it) => `<button class="btn" style="padding:6px 10px" data-bm="${it.id}">${it.title}</button>`)
    .join('');
  bar.innerHTML = htmlItems || '';
  container.appendChild(bar);
}

window.renderBookmarksModal = function renderBookmarksModal() {
  const data = loadBookmarks();

  const rootFolderId = data.rootFolderId ?? null;
  const folders = Array.isArray(data.folders) ? data.folders : [];
  const items = Array.isArray(data.items) ? data.items : [];

  const activeUrl = getActiveUrl();
  const activeTitle = getActiveTitle();

  const selectOptions = folders
    .map((f) => `<option value="${f.id}">${f.name}</option>`)
    .join('');

  const list = items
    .map((it) => {
      const folder = folders.find((f) => f.id === it.folderId)?.name || 'Other';
      return `
        <div class="row" style="align-items:center; justify-content:space-between; gap:12px">
          <div style="flex:1">
            <div style="font-size:13px; opacity:0.95">${it.title}</div>
            <div style="font-size:12px; opacity:0.65">${folder}</div>
          </div>
          <div style="display:flex; gap:8px">
            <button class="btn" data-act="open" data-id="${it.id}">Open</button>
            <button class="btn" data-act="del" data-id="${it.id}">Remove</button>
          </div>
        </div>
      `;
    })
    .join('');

  window.openModal(`
    <h2>Bookmarks</h2>
    <div class="hr"></div>
    <div class="row">
      <button class="btn primary" id="bmAdd">☆ Add current page</button>
      <button class="btn" id="bmNewFolder">+ New folder</button>
    </div>
    <div class="row">
      <input id="bmFolderName" placeholder="Folder name" />
    </div>
    <div class="row">
      <select id="bmFolderSelect"> 
        ${selectOptions}
      </select>
    </div>
    <div class="hr"></div>
    <div style="max-height:340px; overflow:auto; display:flex; flex-direction:column; gap:10px">${list || ''}</div>
    <div class="row" style="justify-content:flex-end; margin-top:10px">
      <button class="btn" id="bmClose">Close</button>
    </div>
  `);

  $('#bmClose').addEventListener('click', () => window.closeModal());

  $('#bmAdd').addEventListener('click', () => {
    const folderId = $('#bmFolderSelect').value || null;
    if (!activeUrl) return;

    const next = loadBookmarks();
    if (!next.folders) next.folders = [];
    if (!next.items) next.items = [];

    // avoid duplicates
    const exists = next.items.find((x) => x.url === activeUrl);
    if (exists) {
      window.edyraShowToast('Already bookmarked');
      return;
    }

    next.items.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url: activeUrl,
      title: activeTitle,
      folderId,
      createdAt: Date.now(),
    });
    saveBookmarks(next);
    window.closeModal();
    window.renderBookmarksModal();
  });

  $('#bmNewFolder').addEventListener('click', () => {
    const name = ($('#bmFolderName').value || '').trim();
    if (!name) return;
    const next = loadBookmarks();
    if (!next.folders) next.folders = [];
    next.folders.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      createdAt: Date.now(),
    });
    saveBookmarks(next);
    window.renderBookmarksModal();
  });

  document.querySelectorAll('[data-act="open"]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      const it = items.find((x) => x.id === id);
      if (!it) return;
      window.edyraNavigateActive(it.url);
      window.closeModal();
    });
  });

  document.querySelectorAll('[data-act="del"]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      const next = loadBookmarks();
      next.items = next.items.filter((x) => x.id !== id);
      saveBookmarks(next);
      window.renderBookmarksModal();
    });
  });
};

