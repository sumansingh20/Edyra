window.renderSettingsModal = function renderSettingsModal() {
  const ui = window.edyraState.ui;

  const html = `
    <h2>Settings</h2>
    <div class="row">
      <label style="flex:1">
        <div style="font-size:12px; opacity:0.7; margin-bottom:6px">Theme</div>
        <select id="setTheme">
          <option value="dark" ${ui.theme === 'dark' ? 'selected' : ''}>Dark</option>
          <option value="light" ${ui.theme === 'light' ? 'selected' : ''}>Light</option>
        </select>
      </label>
      <label style="flex:1">
        <div style="font-size:12px; opacity:0.7; margin-bottom:6px">Search engine</div>
        <select id="setSearch">
          <option value="google" ${ui.searchEngine === 'google' ? 'selected' : ''}>Google</option>
          <option value="duckduckgo" ${ui.searchEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
        </select>
      </label>
    </div>
    <div class="row">
      <label style="flex:1">
        <div style="font-size:12px; opacity:0.7; margin-bottom:6px">Homepage</div>
        <input id="setHome" value="${ui.homePage}" />
      </label>
    </div>
    <div class="row">
      <label style="flex:1">
        <div style="font-size:12px; opacity:0.7; margin-bottom:6px">Ad blocker (basic)</div>
        <select id="setAdblock">
          <option value="on" ${ui.adblockEnabled ? 'selected' : ''}>On</option>
          <option value="off" ${!ui.adblockEnabled ? 'selected' : ''}>Off</option>
        </select>
      </label>
    </div>
    <div class="row">
      <label style="flex:1">
        <div style="font-size:12px; opacity:0.7; margin-bottom:6px">DevTools</div>
        <select id="setDevtools">
          <option value="off" ${!ui.devtoolsEnabled ? 'selected' : ''}>Off</option>
          <option value="on" ${ui.devtoolsEnabled ? 'selected' : ''}>On</option>
        </select>
      </label>
    </div>
    <div class="hr"></div>
    <div class="row" style="justify-content:flex-end; gap:10px">
      <button class="btn" id="setCancel">Cancel</button>
      <button class="btn primary" id="setSave">Save</button>
    </div>
  `;

  window.openModal(html);

  $('#setCancel').addEventListener('click', () => window.closeModal());

  $('#setSave').addEventListener('click', () => {
    window.edyraState.ui.theme = $('#setTheme').value;
    window.edyraState.ui.searchEngine = $('#setSearch').value;
    window.edyraState.ui.homePage = $('#setHome').value;
    window.edyraState.ui.adblockEnabled = $('#setAdblock').value === 'on';
    window.edyraState.ui.devtoolsEnabled = $('#setDevtools').value === 'on';
    window.edyraPersist();

    // Apply theme quickly
    if (window.edyraState.ui.theme === 'light') {
      document.documentElement.style.filter = 'invert(0)';
    } else {
      document.documentElement.style.filter = 'invert(0)';
    }

    window.closeModal();
    window.edyraShowToast('Settings saved');
  });
};

