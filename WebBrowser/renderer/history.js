const HISTORY_KEY = 'edyra-history-v1';

function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function recordVisit(url, title = '') {
  const trimmed = String(url || '').trim();
  if (!trimmed) return;
  const list = loadHistory();
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    url: trimmed,
    title,
    visitedAt: Date.now(),
  });
  // cap size
  const capped = list.slice(0, 500);
  saveHistory(capped);
}

window.renderHistoryModal = function renderHistoryModal() {
  const list = loadHistory();

  const itemsHtml = list
    .slice(0, 200)
    .map((it) => {
      const when = new Date(it.visitedAt).toLocaleString();
      return `
        <div class="row" style="align-items:center; justify-content:space-between; gap:12px">
          <div style="flex:1">
            <div style="font-size:13px; opacity:0.95">${it.title || it.url}</div>
            <div style="font-size:12px; opacity:0.65">${when}</div>
          </div>
          <div style="display:flex; gap:8px">
            <button class="btn" data-act="open" data-id="${it.id}">Open</button>
          </div>
        </div>
      `;
    })
    .join('');

  window.openModal(`
    <h2>History</h2>
    <div class="row">
      <input id="histSearch" placeholder="Search history..." />
      <button class="btn" id="histClear">Clear</button>
    </div>
    <div class="hr"></div>
    <div id="histList" style="max-height:360px; overflow:auto; display:flex; flex-direction:column; gap:10px">${itemsHtml || ''}</div>
    <div class="row" style="justify-content:flex-end; margin-top:10px">
      <button class="btn" id="histClose">Close</button>
    </div>
  `);

  $('#histClose').addEventListener('click', () => window.closeModal());

  $('#histClear').addEventListener('click', () => {
    saveHistory([]);
    window.renderHistoryModal();
  });

  const renderFiltered = (q) => {
    const needle = (q || '').toLowerCase();
    const filtered = list.filter((x) => (x.title || '').toLowerCase().includes(needle) || x.url.toLowerCase().includes(needle));
    const html = filtered.slice(0, 200).map((it) => {
      const when = new Date(it.visitedAt).toLocaleString();
      return `
        <div class="row" style="align-items:center; justify-content:space-between; gap:12px">
          <div style="flex:1">
            <div style="font-size:13px; opacity:0.95">${it.title || it.url}</div>
            <div style="font-size:12px; opacity:0.65">${when}</div>
          </div>
          <div style="display:flex; gap:8px">
            <button class="btn" data-act="open" data-id="${it.id}">Open</button>
          </div>
        </div>
      `;
    }).join('');
    $('#histList').innerHTML = html;

    document.querySelectorAll('[data-act="open"]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const it = list.find((x) => x.id === id);
        if (!it) return;
        window.edyraNavigateActive(it.url);
        window.closeModal();
      });
    });
  };

  $('#histSearch').addEventListener('input', (e) => renderFiltered(e.target.value));

  // bind open
  document.querySelectorAll('[data-act="open"]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      const it = list.find((x) => x.id === id);
      if (!it) return;
      window.edyraNavigateActive(it.url);
      window.closeModal();
    });
  });
};

// Wire history recording by watching webview navigation in app.js via global hook.
window.__edyraRecordVisit = recordVisit;

