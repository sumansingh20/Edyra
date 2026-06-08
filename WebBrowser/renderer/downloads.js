const DOWNLOADS_KEY = 'edyra-downloads-v1';

function loadDownloads() {
  const raw = localStorage.getItem(DOWNLOADS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveDownloads(items) {
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(items));
}

const inMemory = {
  list: loadDownloads(),
};

function upsert(dl) {
  // In this minimal version, we don’t rely on Electron id matching.
  // We'll append if url+filename unique.
  const idx = inMemory.list.findIndex((x) => x.url === dl.url && x.filename === dl.filename);
  if (idx >= 0) inMemory.list[idx] = { ...inMemory.list[idx], ...dl };
  else inMemory.list.unshift(dl);
  inMemory.list = inMemory.list.slice(0, 200);
  saveDownloads(inMemory.list);
}

function updateFromIpc(payload, kind) {
  if (kind === 'created') {
    upsert({
      url: payload.url,
      filename: payload.filename,
      state: payload.state,
      totalBytes: payload.totalBytes,
      receivedBytes: payload.receivedBytes,
      savePath: payload.savePath,
      createdAt: Date.now(),
    });
  } else if (kind === 'updated') {
    const idx = inMemory.list.findIndex((x) => x.filename === payload.filename);
    if (idx >= 0) {
      inMemory.list[idx].state = payload.state;
      inMemory.list[idx].receivedBytes = payload.receivedBytes;
      inMemory.list[idx].totalBytes = payload.totalBytes;
      saveDownloads(inMemory.list);
    }
  } else if (kind === 'done') {
    const idx = inMemory.list.findIndex((x) => x.savePath === payload.savePath);
    if (idx >= 0) {
      inMemory.list[idx].state = payload.state;
      saveDownloads(inMemory.list);
    }
  }
}

window.renderDownloadsModal = function renderDownloadsModal() {
  const list = inMemory.list;

  const itemsHtml = list
    .map((it) => {
      const total = it.totalBytes || 0;
      const recv = it.receivedBytes || 0;
      const pct = total ? Math.floor((recv / total) * 100) : 0;
      return `
        <div class="row" style="align-items:center; justify-content:space-between; gap:12px">
          <div style="flex:1">
            <div style="font-size:13px; opacity:0.95">${it.filename}</div>
            <div style="font-size:12px; opacity:0.65">${it.state || 'unknown'}${total ? ` • ${pct}%` : ''}</div>
          </div>
          <div style="display:flex; gap:8px">
            <button class="btn" data-act="reveal" data-path="${it.savePath || ''}">Show</button>
            <button class="btn" data-act="cancel" data-file="${it.savePath || ''}" ${it.state === 'completed' ? 'disabled' : ''}>Cancel</button>
          </div>
        </div>
      `;
    })
    .join('');

  window.openModal(`
    <h2>Downloads</h2>
    <div class="hr"></div>
    <div style="max-height:360px; overflow:auto; display:flex; flex-direction:column; gap:10px">${itemsHtml || ''}</div>
    <div class="row" style="justify-content:flex-end; margin-top:10px">
      <button class="btn" id="dlClose">Close</button>
    </div>
  `);

  $('#dlClose').addEventListener('click', () => window.closeModal());

  document.querySelectorAll('[data-act="reveal"]').forEach((b) => {
    b.addEventListener('click', () => {
      const p = b.dataset.path;
      window.edyraGetActiveWebview();
      window.edyraPersist();
      window.edyraGetActiveWebview();
      window.edyraShowToast('Revealing file...');
      window.edyraBrowser?.invoke?.('app:reveal-in-folder', p);
    });
  });

  // Cancel isn't fully implemented due to Electron download item handle being main-side.
  // We can add cancel via IPC later; for now UI is present.
  document.querySelectorAll('[data-act="cancel"]').forEach((b) => {
    b.addEventListener('click', () => {
      window.edyraShowToast('Cancel supported in next iteration');
    });
  });
};

// IPC wiring
if (window.edyraBrowser?.on) {
  window.edyraBrowser.on('downloads:created', (payload) => {
    updateFromIpc(payload, 'created');
  });
  window.edyraBrowser.on('downloads:updated', (payload) => updateFromIpc(payload, 'updated'));
  window.edyraBrowser.on('downloads:done', (payload) => updateFromIpc(payload, 'done'));
}

