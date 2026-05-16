// PocketLM SPA — vanilla ES modules, pure CSS classes from /static/styles.css

const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
};

// ---------------- Icons (Lucide-style SVGs) ----------------
const ICON = {
  chat:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  models:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  train:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  plus:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  send:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  stop:    `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
  download:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  trash:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>`,
  check:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  lock:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  spark:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>`,
  upload:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  sun:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  moon:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  agent:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
  eye:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

// Brand mark — white-on-gradient version of /static/logo.svg, designed to drop
// inside an already-gradient container (.brand-mark, .welcome-mark).
const LOGO_MARK = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12 3 L13.4 9.6 L20 11 L13.4 12.4 L12 19 L10.6 12.4 L4 11 L10.6 9.6 Z" fill="#ffffff"/>
  <circle cx="17.6" cy="5.4" r="1.15" fill="#ffffff" opacity="0.9"/>
</svg>`;
const icon = (name) => h('span', { class: 'i', html: ICON[name] || '' });

// ---------------- Theme ----------------
// `data-theme` is set by an inline script in index.html before first paint to
// avoid a flash of the wrong palette. We just keep things in sync from here on.
const THEME_KEY = 'pocketlm.theme';
function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}
function setTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch {}
  // Swap highlight.js stylesheet so code blocks read correctly in both modes.
  const link = document.getElementById('hljs-theme');
  if (link) {
    link.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github' +
                (t === 'light' ? '' : '-dark') + '.min.css';
  }
}

function ThemeToggle() {
  const mk = (mode, iconName, label) => h('button', {
    type: 'button',
    class: currentTheme() === mode ? 'active' : '',
    title: `${label} theme`,
    'aria-label': `${label} theme`,
    'aria-pressed': currentTheme() === mode ? 'true' : 'false',
    onclick: () => {
      if (currentTheme() === mode) return;
      setTheme(mode);
      render();
    },
    html: ICON[iconName],
  });
  return h('div', { class: 'theme-toggle', role: 'group', 'aria-label': 'Theme' },
    mk('light', 'sun',  'Light'),
    mk('dark',  'moon', 'Dark'),
  );
}

// ---------------- API ----------------
const api = {
  async get(url) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  async post(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(url) { const r = await fetch(url, { method: 'DELETE' }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  // Robust SSE parser (handles \r\n\r\n and \n\n). Pass an AbortSignal via opts.signal.
  async *stream(url, body, opts = {}) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: opts.signal,
    });
    if (!r.ok || !r.body) throw new Error(await r.text());
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const drain = function* (text) {
      const norm = text.replace(/\r\n/g, '\n');
      for (const evt of norm.split('\n\n')) {
        const dataLines = evt.split('\n').filter(l => l.startsWith('data:'));
        if (!dataLines.length) continue;
        const payload = dataLines.map(l => l.slice(5).replace(/^ /, '')).join('\n').trim();
        if (!payload) continue;
        try { yield JSON.parse(payload); } catch {}
      }
    };
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const norm = buf.replace(/\r\n/g, '\n');
      const last = norm.lastIndexOf('\n\n');
      if (last === -1) continue;
      const ready = norm.slice(0, last + 2);
      buf = norm.slice(last + 2);
      yield* drain(ready);
    }
    if (buf.trim()) yield* drain(buf + '\n\n');
  },
};

// --------------- Toast ---------------
function toast(msg, kind = 'info') {
  const el = h('div', { class: `toast ${kind}` }, msg);
  $('#toast').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }, 2800);
  setTimeout(() => el.remove(), 3200);
}

// --------------- Markdown ---------------
marked.setOptions({ breaks: true, gfm: true });

// Run highlight.js on every <pre><code> inside `el`. Idempotent.
// Strategy: trust the fence tag ONLY if hljs already knows it (it handles all
// common aliases — js/ts/py/sh/yml/c++/c# — internally). Otherwise auto-detect.
// Also injects a small header (language label + copy button) on each block.
function highlightAllIn(el) {
  if (!el || !window.hljs) return;

  el.querySelectorAll('pre code').forEach((block) => {
    if (block.dataset.hl === '1') return;

    const cls = [...block.classList].find(c => c.startsWith('language-'));
    const fenceLang = cls ? cls.slice('language-'.length).toLowerCase().trim() : '';
    const known = fenceLang && hljs.getLanguage && hljs.getLanguage(fenceLang);
    let lang = '';

    try {
      if (known) {
        hljs.highlightElement(block);
        // Resolve aliases to canonical name for the header pill (e.g. "js" → "javascript").
        lang = (known.name || fenceLang).toLowerCase();
      } else {
        const res = hljs.highlightAuto(block.textContent || '');
        if (res && res.value) {
          block.innerHTML = res.value;
          block.classList.add('hljs');
          lang = (res.language || '').toLowerCase();
          if (cls) block.classList.remove(cls);
          if (lang) block.classList.add('language-' + lang);
        }
      }
    } catch {}
    block.dataset.hl = '1';

    // Inject header (language pill + copy). Skip if already present.
    const pre = block.parentElement;
    if (pre && pre.tagName === 'PRE' && !pre.querySelector('.code-head')) {
      const head = h('div', { class: 'code-head' },
        h('span', { class: 'code-lang' }, lang || 'text'),
        h('button', {
          class: 'code-copy',
          title: 'Copy code',
          onclick: async (e) => {
            e.stopPropagation();
            try {
              await navigator.clipboard.writeText(block.textContent || '');
              const btn = e.currentTarget;
              const prev = btn.textContent;
              btn.textContent = 'Copied';
              btn.classList.add('ok');
              setTimeout(() => { btn.textContent = prev; btn.classList.remove('ok'); }, 1200);
            } catch { toast('Copy failed', 'error'); }
          },
        }, 'Copy'),
      );
      pre.insertBefore(head, block);
    }
  });
}

const renderMd = (text) => DOMPurify.sanitize(marked.parse(text || ''));

// Render markdown into an element. Pass `highlight=true` to also syntax-highlight
// any code blocks (skip during fast token streaming for performance).
function setMd(el, text, highlight = true) {
  el.innerHTML = renderMd(text);
  if (highlight) highlightAllIn(el);
}

// --------------- State ---------------
const state = {
  view: 'chat',
  chatMode: localStorage.getItem('pocketlm.chatmode') || 'chat',
  catalog: [],
  catalogTotal: 0,
  catalogOffset: 0,
  catalogExhausted: false,
  catalogLoading: false,
  installed: [],
  device: null,
  conversations: [],
  convsExhausted: false,    // no more pages on the server
  convsLoading: false,
  currentConv: null,
  messages: [],
  msgsExhausted: false,     // no older messages for current conv
  msgsLoading: false,
  selectedModel: localStorage.getItem('pocketlm.model') || '',
  generating: false,
  abortCtl: null, // AbortController for the active /api/chat stream
  // Settings page
  settings: null,
  settingsLoading: false,
  // Agent
  mcpServers: [],
  mcpServersLoaded: false,
  agentMessages: [],
  agentSelectedServerIds: [],
  agentGenerating: false,
  agentAbortCtl: null,
  // Settings deep-link target (e.g. focus HF_TOKEN after gated error)
  settingsFocusKey: null,
};

const PAGE_SIZE = 50;
const CATALOG_PAGE = 24;

function resetChatState() {
  if (state.abortCtl) { try { state.abortCtl.abort(); } catch {} }
  state.abortCtl = null;
  state.currentConv = null;
  state.messages = [];
  state.msgsExhausted = false;
  state.msgsLoading = false;
  state.generating = false;
}

async function refreshCatalog() {
  // Reset to first page (used after install/delete or initial load).
  const data = await api.get(`/api/catalog?limit=${CATALOG_PAGE}&offset=0`);
  state.catalog = data.models || [];
  state.catalogTotal = data.total || state.catalog.length;
  state.catalogOffset = state.catalog.length;
  state.catalogExhausted = data.next_offset == null;
  state.catalogLoading = false;
  if (data.device) state.device = data.device;
  const inst = await api.get('/api/models');
  state.installed = inst.models;
  if ((!state.selectedModel || !state.installed.some(m => m.repo_id === state.selectedModel)) && state.installed[0]) {
    state.selectedModel = state.installed[0].repo_id;
    localStorage.setItem('pocketlm.model', state.selectedModel);
  }
}

async function loadMoreCatalog() {
  if (state.catalogLoading || state.catalogExhausted) return 0;
  state.catalogLoading = true;
  try {
    const data = await api.get(`/api/catalog?limit=${CATALOG_PAGE}&offset=${state.catalogOffset}`);
    const page = data.models || [];
    const seen = new Set(state.catalog.map(m => m.repo_id));
    let added = 0;
    for (const m of page) if (!seen.has(m.repo_id)) { state.catalog.push(m); added++; }
    state.catalogOffset += page.length;
    if (data.next_offset == null) state.catalogExhausted = true;
    return added;
  } finally {
    state.catalogLoading = false;
  }
}
async function refreshConversations() {
  // Reset to first page. Used after create/delete/rename or initial load.
  state.conversations = await api.get(`/api/conversations?limit=${PAGE_SIZE}`);
  state.convsExhausted = state.conversations.length < PAGE_SIZE;
  state.convsLoading = false;
}

async function loadMoreConversations() {
  if (state.convsLoading || state.convsExhausted) return;
  const last = state.conversations[state.conversations.length - 1];
  if (!last) { state.convsExhausted = true; return; }
  state.convsLoading = true;
  try {
    const page = await api.get(`/api/conversations?limit=${PAGE_SIZE}&cursor=${last.id}`);
    // Dedupe defensively (in case of races with new chats being created).
    const seen = new Set(state.conversations.map(c => c.id));
    for (const c of page) if (!seen.has(c.id)) state.conversations.push(c);
    if (page.length < PAGE_SIZE) state.convsExhausted = true;
  } finally {
    state.convsLoading = false;
  }
}

// =================================================================
// SIDEBAR
// =================================================================
function Sidebar() {
  const navItem = (id, label, ico) =>
    h('div', { class: `nav-item ${state.view === id ? 'active' : ''}`, onclick: () => navigate(id) },
      h('span', { html: ICON[ico] }), label);

  const convItem = (c) => h('div', {
    class: `conv-item ${state.currentConv?.id === c.id ? 'active' : ''}`,
    'data-cid': c.id,
    onclick: () => openConversation(c.id),
  },
    h('span', { class: 'title' }, c.title || 'Untitled'),
    h('button', {
      class: 'del', title: 'Delete',
      onclick: async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;
        await api.del(`/api/conversations/${c.id}`);
        if (state.currentConv?.id === c.id) resetChatState();
        await refreshConversations(); render();
      },
    }, '×'),
  );

  const convList = h('div', { class: 'conv-list' });
  if (state.conversations.length === 0) {
    convList.appendChild(h('div', { class: 'empty-hint' }, 'No conversations yet.'));
  } else {
    for (const c of state.conversations) convList.appendChild(convItem(c));
    // Sentinel for infinite scroll. When it scrolls into view, fetch the next page.
    if (!state.convsExhausted) {
      const sentinel = h('div', { class: 'scroll-sentinel', 'aria-hidden': 'true' },
        h('div', { class: 'spinner' }));
      convList.appendChild(sentinel);
      // Observe within the convList scroll container.
      requestAnimationFrame(() => {
        const io = new IntersectionObserver(async (entries) => {
          if (!entries.some(e => e.isIntersecting)) return;
          const before = state.conversations.length;
          await loadMoreConversations();
          if (state.conversations.length > before) {
            // Append the new rows in place — avoids re-rendering the whole sidebar
            // and losing the user's scroll position.
            for (let i = before; i < state.conversations.length; i++) {
              convList.insertBefore(convItem(state.conversations[i]), sentinel);
            }
          }
          if (state.convsExhausted) { io.disconnect(); sentinel.remove(); }
        }, { root: convList, rootMargin: '120px 0px' });
        io.observe(sentinel);
      });
    }
  }

  return h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' },
      h('div', { class: 'brand-mark', html: LOGO_MARK }),
      h('div', {},
        h('div', { class: 'brand-name' }, 'PocketLM'),
        h('div', { class: 'brand-sub' },
          state.device ? `${state.device.device.toUpperCase()} · torch ${state.device.torch.split('+')[0]}` : 'loading…'),
      ),
    ),
    h('div', { class: 'nav' },
      navItem('chat',     'Chat',      'chat'),
      navItem('models',   'Models',    'models'),
      navItem('train',    'Fine-tune', 'train'),
      navItem('settings', 'Settings',  'settings'),
    ),
    h('button', { class: 'new-chat-btn', onclick: newChat },
      h('span', { html: ICON.plus }), 'New chat'),
    h('div', { class: 'section-label' }, 'History'),
    convList,
    h('div', { class: 'footnote' }, 'Local-first · all data stays on your machine'),
  );
}

// --------------- Modal helpers ---------------
function showModal({ title, body, actions }) {
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'modal-title' }, title),
    h('div', { class: 'modal-body' }, body),
    h('div', { class: 'modal-actions' }, ...actions.map(a =>
      h('button', { class: `btn ${a.kind || 'btn-outline'}`, onclick: () => { try { a.onclick && a.onclick(); } finally { close(); } } }, a.label)
    )),
  );
  const wrap = h('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === wrap) close(); } }, card);
  document.body.appendChild(wrap);
  document.addEventListener('keydown', onKey);
  return close;
}

function showGatedModal({ repoId }) {
  return showModal({
    title: '🔒 Gated model',
    body: h('div', {},
      h('p', {}, repoId
        ? `${repoId} requires a Hugging Face access token and an accepted license.`
        : 'This model requires a Hugging Face access token and an accepted license.'),
      h('p', { class: 'hint' },
        '1) Accept the license on the model page. 2) Paste your HF token in Settings → Hugging Face.'),
    ),
    actions: [
      repoId ? { label: 'Open license page', kind: 'btn-outline',
        onclick: () => window.open(`https://huggingface.co/${repoId}`, '_blank', 'noopener') } : null,
      { label: 'Open Settings', kind: 'btn-primary',
        onclick: () => { state.settingsFocusKey = 'HF_TOKEN'; navigate('settings'); } },
    ].filter(Boolean),
  });
}

// --------------- Chat controls (per-conversation) ---------------
const CHAT_CFG_DEFAULT = {
  temperature: 0.7, top_p: 0.95, top_k: 0, repetition_penalty: 1.0,
  max_new_tokens: 512, min_new_tokens: 0,
  do_sample: true, num_beams: 1, seed: '',
  system_prompt: '', stop_sequences: [],
};
function chatCfgKey(convId) { return 'pocketlm.chatcfg.' + (convId || '_default'); }
function getChatCfg(convId) {
  try {
    const raw = localStorage.getItem(chatCfgKey(convId)) || localStorage.getItem(chatCfgKey(null));
    return raw ? { ...CHAT_CFG_DEFAULT, ...JSON.parse(raw) } : { ...CHAT_CFG_DEFAULT };
  } catch { return { ...CHAT_CFG_DEFAULT }; }
}
function saveChatCfg(convId, cfg) {
  try { localStorage.setItem(chatCfgKey(convId), JSON.stringify(cfg)); } catch {}
}
function chatCfgPayload(cfg) {
  const num = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v); return Number.isFinite(n) ? n : null;
  };
  return {
    temperature: num(cfg.temperature) ?? 0.7,
    top_p: num(cfg.top_p) ?? 0.95,
    top_k: num(cfg.top_k) > 0 ? num(cfg.top_k) : null,
    repetition_penalty: num(cfg.repetition_penalty) > 0 ? num(cfg.repetition_penalty) : null,
    max_new_tokens: num(cfg.max_new_tokens) || 512,
    min_new_tokens: num(cfg.min_new_tokens) > 0 ? num(cfg.min_new_tokens) : null,
    do_sample: !!cfg.do_sample,
    num_beams: num(cfg.num_beams) > 1 ? num(cfg.num_beams) : null,
    seed: num(cfg.seed),
    stop_sequences: Array.isArray(cfg.stop_sequences) ? cfg.stop_sequences.filter(Boolean) : null,
    system_prompt: cfg.system_prompt || null,
  };
}

function ChatControlsDrawer(convId) {
  const cfg = getChatCfg(convId);
  const drawer = h('aside', { class: 'drawer', 'aria-label': 'Generation controls' });

  const persist = () => saveChatCfg(convId, cfg);
  const row = (label, hint, control) => h('div', { class: 'drawer-row' },
    h('label', { class: 'label' }, label),
    control,
    hint ? h('div', { class: 'hint' }, hint) : null,
  );
  const num = (key, step, min) => {
    const i = h('input', { class: 'input', type: 'number', step: step || 'any', value: cfg[key] ?? '' });
    if (min !== undefined) i.min = String(min);
    i.oninput = () => { cfg[key] = i.value === '' ? '' : Number(i.value); persist(); };
    return i;
  };
  const text = (key, placeholder) => {
    const i = h('input', { class: 'input', type: 'text', value: cfg[key] || '', placeholder: placeholder || '' });
    i.oninput = () => { cfg[key] = i.value; persist(); };
    return i;
  };
  const toggle = (key) => {
    const sw = h('label', { class: 'switch' },
      h('input', { type: 'checkbox' }),
      h('span', { class: 'switch-track' }),
    );
    const input = sw.querySelector('input');
    input.checked = !!cfg[key];
    input.onchange = () => { cfg[key] = input.checked; persist(); };
    return sw;
  };
  const sysPrompt = h('textarea', { class: 'input', rows: 3, placeholder: 'Optional system prompt…' }, cfg.system_prompt || '');
  sysPrompt.oninput = () => { cfg.system_prompt = sysPrompt.value; persist(); };

  // Stop sequences as a comma-separated input.
  const stops = h('input', { class: 'input', type: 'text', value: (cfg.stop_sequences || []).join(', '),
    placeholder: 'e.g. </end>, \\n\\nUser:' });
  stops.oninput = () => {
    cfg.stop_sequences = stops.value.split(',').map(s => s.trim()).filter(Boolean);
    persist();
  };

  drawer.append(
    h('div', { class: 'drawer-header' },
      h('span', { html: ICON.sliders }),
      h('h3', {}, 'Generation controls'),
    ),
    h('div', { class: 'drawer-body' },
      row('System prompt', 'Prepended to the conversation.', sysPrompt),
      row('Temperature', 'Higher = more creative. 0 = greedy.', num('temperature', '0.05', 0)),
      row('top_p (nucleus)', null, num('top_p', '0.05', 0)),
      row('top_k', '0 = disabled.', num('top_k', '1', 0)),
      row('Repetition penalty', '1.0 = none, ~1.15 reduces loops.', num('repetition_penalty', '0.05', 0)),
      row('Max new tokens', null, num('max_new_tokens', '8', 1)),
      row('Min new tokens', '0 = no minimum.', num('min_new_tokens', '1', 0)),
      row('Beam search width', '1 = no beams.', num('num_beams', '1', 1)),
      row('Sampling', 'Off = greedy / beam search.',
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, toggle('do_sample'), h('span', { class: 'hint', style: { margin: 0 } }, 'do_sample'))),
      row('Seed', 'Set for reproducible output.', num('seed', '1')),
      row('Stop sequences', 'Comma-separated.', stops),
    ),
  );
  return drawer;
}

function ModelPicker(extraOnChange) {
  const sel = h('select', {
    class: 'input', style: { width: 'auto', minWidth: '240px' },
    onchange: (e) => {
      state.selectedModel = e.target.value;
      localStorage.setItem('pocketlm.model', state.selectedModel);
      if (typeof extraOnChange === 'function') extraOnChange(e.target.value);
    },
  });
  if (state.installed.length === 0) {
    sel.appendChild(h('option', { value: '' }, '— No models installed —'));
    sel.disabled = true;
  } else {
    for (const m of state.installed) {
      const label = m.type === 'adapter' ? `🎯 ${m.adapter_name} (on ${m.base_model.split('/').pop()})` : m.repo_id;
      const opt = h('option', { value: m.repo_id }, label);
      if (m.repo_id === state.selectedModel) opt.selected = true;
      sel.appendChild(opt);
    }
  }
  return sel;
}

function ChatView() {
  const messagesEl = h('div', { class: 'messages' });
  let topSentinel = null;
  let topObserver = null;

  function MessageBubble(m) {
    const isUser = m.role === 'user';
    const md = h('div', { class: 'md ' + (m.streaming ? 'streaming' : '') });
    setMd(md, m.content || '');
    return h('div', { class: `msg-wrap ${isUser ? 'user' : ''}`, 'data-mid': m.id ?? '' },
      h('div', { class: `avatar ${isUser ? 'user' : 'ai'}` }, isUser ? 'You' : 'AI'),
      h('div', { class: 'msg-col' },
        h('div', { class: 'bubble' }, md),
      ),
    );
  }

  function detachTopObserver() {
    if (topObserver) { try { topObserver.disconnect(); } catch {} topObserver = null; }
    if (topSentinel) { topSentinel.remove(); topSentinel = null; }
  }

  function attachTopObserver() {
    if (state.chatMode === 'agent') return;
    detachTopObserver();
    if (!state.currentConv || state.msgsExhausted || state.messages.length === 0) return;
    // Locally-pushed messages (e.g. the user's first message in a brand-new
    // chat) don't have an `id` until the server persists them. Without an id
    // we can't paginate older messages, and there are by definition none, so
    // skip the sentinel entirely instead of firing 422s in a loop.
    if (state.messages[0]?.id == null) { state.msgsExhausted = true; return; }
    topSentinel = h('div', { class: 'scroll-sentinel top', 'aria-hidden': 'true' },
      h('div', { class: 'spinner' }));
    messagesEl.insertBefore(topSentinel, messagesEl.firstChild);
    topObserver = new IntersectionObserver(async (entries) => {
      if (!entries.some(e => e.isIntersecting)) return;
      if (state.msgsLoading || state.msgsExhausted || !state.currentConv) return;
      const convAtFetch = state.currentConv.id;
      state.msgsLoading = true;

      // Preserve visual position: remember distance from bottom, restore after prepend.
      const prevScrollHeight = messagesEl.scrollHeight;
      const prevScrollTop = messagesEl.scrollTop;

      const oldestId = state.messages[0]?.id;
      let older = [];
      try {
        older = await api.get(`/api/conversations/${convAtFetch}/messages?limit=${PAGE_SIZE}&before=${oldestId}`);
      } catch (e) {
        state.msgsLoading = false;
        return;
      }
      // Bail if user switched conversations mid-fetch.
      if (state.currentConv?.id !== convAtFetch) { state.msgsLoading = false; return; }

      if (older.length < PAGE_SIZE) state.msgsExhausted = true;
      if (older.length === 0) {
        detachTopObserver();
        state.msgsLoading = false;
        return;
      }

      // Prepend in DOM and state, in chronological order.
      const frag = document.createDocumentFragment();
      for (const m of older) frag.appendChild(MessageBubble(m));
      const anchor = topSentinel.nextSibling;
      messagesEl.insertBefore(frag, anchor);
      state.messages = older.concat(state.messages);

      // Restore scroll so the user's eye stays put.
      const newScrollHeight = messagesEl.scrollHeight;
      messagesEl.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);

      state.msgsLoading = false;
      if (state.msgsExhausted) detachTopObserver();
    }, { root: messagesEl, rootMargin: '160px 0px 0px 0px' });
    topObserver.observe(topSentinel);
  }

  function renderMessages() {
    detachTopObserver();
    messagesEl.innerHTML = '';
    if (state.chatMode === 'agent' && state.agentMessages.length === 0) {
      messagesEl.appendChild(h('div', { class: 'welcome' },
        h('div', { class: 'welcome-mark', html: LOGO_MARK }),
        h('h1', {}, 'Agent mode'),
        h('p', {}, 'Use your local model with MCP tools. Select one or more enabled MCP servers first.'),
      ));
      return;
    }
    if (state.chatMode !== 'agent' && !state.currentConv) {
      messagesEl.appendChild(h('div', { class: 'welcome' },
        h('div', { class: 'welcome-mark', html: LOGO_MARK }),
        h('h1', {}, 'Welcome to PocketLM'),
        h('p', {}, 'Pick a model and start chatting — or train your own from any text file.'),
        h('div', { class: 'welcome-grid' },
          ...[
            ['chat',     'Chat',      'Stream responses with markdown & syntax highlighting.'],
            ['download', 'Download',  'Curated catalog of laptop-friendly Hugging Face models.'],
            ['train',    'Fine-tune', 'Point at a .txt or .jsonl and click Start.'],
          ].map(([ic, t, d]) => h('div', { class: 'welcome-card', onclick: () => navigate(ic === 'chat' ? 'chat' : ic === 'download' ? 'models' : 'train') },
            h('div', { class: 'ico', html: ICON[ic === 'download' ? 'download' : ic === 'train' ? 'train' : 'chat'] }),
            h('h3', {}, t), h('p', {}, d),
          )),
        ),
      ));
      return;
    }
    const source = state.chatMode === 'agent' ? state.agentMessages : state.messages;
    for (const m of source) messagesEl.appendChild(MessageBubble(m));
    messagesEl.scrollTop = messagesEl.scrollHeight;
    // Wire up infinite-scroll-up after layout settles.
    if (state.chatMode !== 'agent') requestAnimationFrame(attachTopObserver);
  }

  const input = h('textarea', {
    rows: 1,
    placeholder: state.installed.length ? 'Message your model…' : 'Install a model first — open the Models tab.',
    onkeydown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    },
    oninput: (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'; },
  });
  const sendBtn = h('button', {
    class: 'send', title: 'Send (⏎)',
    onclick: () => { state.generating ? stopGeneration() : sendMessage(); },
  }, h('span', { html: ICON.send }));

  function setSendBtn(mode /* 'send' | 'stop' */) {
    sendBtn.innerHTML = '';
    sendBtn.append(h('span', { html: mode === 'stop' ? ICON.stop : ICON.send }));
    sendBtn.title = mode === 'stop' ? 'Stop generating' : 'Send (⏎)';
    sendBtn.classList.toggle('stop', mode === 'stop');
    sendBtn.disabled = false;
  }

  function stopGeneration() {
    if (state.abortCtl) { try { state.abortCtl.abort(); } catch {} }
  }

  async function sendMessage() {
    if (state.chatMode === 'agent') return sendAgentMessage();
    const text = input.value.trim();
    if (!text || state.generating) return;
    if (!state.selectedModel) { toast('Pick a model first', 'error'); return; }

    // Brand-new chat? Make absolutely sure no stale messages leak in.
    if (!state.currentConv) {
      state.messages = [];
      const c = await api.post('/api/conversations', { model_id: state.selectedModel, title: text.slice(0, 60) });
      state.currentConv = c;
      await refreshConversations(); renderSidebar();
    }

    const convAtSend = state.currentConv;   // capture; we'll bail if user switches
    state.messages.push({ role: 'user', content: text });
    const assistant = { role: 'assistant', content: '', streaming: true };
    state.messages.push(assistant);
    input.value = ''; input.style.height = 'auto';
    state.generating = true; sendBtn.disabled = false;
    state.abortCtl = new AbortController();
    setSendBtn('stop');
    renderMessages();

    try {
      const cfg = chatCfgPayload(getChatCfg(convAtSend.id));
      for await (const evt of api.stream('/api/chat', {
        conversation_id: convAtSend.id,
        model_id: state.selectedModel,
        message: text,
        ...cfg,
      }, { signal: state.abortCtl.signal })) {
        // If the user navigated away / started a new chat / deleted this conv, drop tokens.
        if (state.currentConv?.id !== convAtSend.id) break;
        if (evt.event === 'token') {
          assistant.content += evt.text;
          const bubbles = messagesEl.querySelectorAll('.md');
          const last = bubbles[bubbles.length - 1];
          if (last) { setMd(last, assistant.content, false); last.classList.add('streaming'); }
          messagesEl.scrollTop = messagesEl.scrollHeight;
        } else if (evt.event === 'error') {
          if (evt.code === 'gated') {
            showGatedModal({ repoId: evt.repo_id || state.selectedModel });
            assistant.content += `\n\n*${evt.message || 'Gated model — add your HF token in Settings.'}*`;
          } else {
            toast(evt.message, 'error');
            assistant.content += `\n\n*Error: ${evt.message}*`;
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast(e.message, 'error');
    } finally {
      assistant.streaming = false;
      state.generating = false;
      state.abortCtl = null;
      setSendBtn('send');
      if (state.currentConv?.id === convAtSend.id) renderMessages();
      await refreshConversations(); renderSidebar();
    }
  }

  async function sendAgentMessage() {
    const text = input.value.trim();
    if (!text || state.generating) return;
    if (!state.selectedModel) { toast('Pick a model first', 'error'); return; }
    await ensureMCPServersLoaded();
    const serverIds = state.mcpServers
      .filter(s => state.agentSelectedServerIds.includes(s.id) && s.enabled)
      .map(s => s.id);
    if (serverIds.length === 0) { toast('Select at least one enabled MCP server', 'error'); return; }

    state.agentMessages.push({ role: 'user', content: text });
    const assistant = { role: 'assistant', content: '', streaming: true };
    state.agentMessages.push(assistant);
    input.value = ''; input.style.height = 'auto';
    state.generating = true; sendBtn.disabled = false;
    state.abortCtl = new AbortController();
    setSendBtn('stop');
    renderMessages();

    const cfg = chatCfgPayload(getChatCfg(null));
    try {
      for await (const evt of api.stream('/api/agent/chat', {
        model_id: state.selectedModel,
        message: text,
        server_ids: serverIds,
        temperature: cfg.temperature,
        top_p: cfg.top_p,
        max_new_tokens: cfg.max_new_tokens,
        system_prompt: cfg.system_prompt,
      }, { signal: state.abortCtl.signal })) {
        if (evt.event === 'token') {
          assistant.content += evt.text;
        } else if (evt.event === 'tool_call') {
          assistant.content += `\n\n\`\`\`json\n[tool_call] ${JSON.stringify({ name: evt.name, arguments: evt.arguments || {} }, null, 2)}\n\`\`\``;
        } else if (evt.event === 'tool_result') {
          assistant.content += `\n\n\`\`\`json\n[tool_result] ${JSON.stringify({ name: evt.name, result: evt.result || [] }, null, 2)}\n\`\`\``;
        } else if (evt.event === 'tool_error') {
          assistant.content += `\n\n*Tool error (${evt.server_name || 'server'}): ${evt.error || 'unknown'}*`;
        } else if (evt.event === 'error') {
          toast(evt.message, 'error');
          assistant.content += `\n\n*Error: ${evt.message}*`;
        }
        const bubbles = messagesEl.querySelectorAll('.md');
        const last = bubbles[bubbles.length - 1];
        if (last) {
          setMd(last, assistant.content, false);
          last.classList.add('streaming');
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast(e.message, 'error');
    } finally {
      assistant.streaming = false;
      state.generating = false;
      state.abortCtl = null;
      setSendBtn('send');
      renderMessages();
    }
  }

  setTimeout(renderMessages, 0);

  // Generation-controls drawer (per-conversation; falls back to defaults for new chats).
  const drawer = ChatControlsDrawer(state.currentConv?.id);
  const modeSel = h('select', {
    class: 'input',
    style: { width: 'auto', minWidth: '130px' },
    onchange: async (e) => {
      state.chatMode = e.target.value;
      try { localStorage.setItem('pocketlm.chatmode', state.chatMode); } catch {}
      if (state.chatMode === 'agent') await ensureMCPServersLoaded();
      render();
    },
  },
    h('option', { value: 'chat', selected: state.chatMode === 'chat' ? '' : false }, 'Chat mode'),
    h('option', { value: 'agent', selected: state.chatMode === 'agent' ? '' : false }, 'Agent mode'),
  );

  const mcpBtn = h('button', {
    class: 'btn btn-outline',
    style: { display: state.chatMode === 'agent' ? '' : 'none' },
    onclick: async () => {
      await ensureMCPServersLoaded();
      const rows = state.mcpServers.map((srv) => {
        const cb = h('input', { type: 'checkbox' });
        cb.checked = state.agentSelectedServerIds.includes(srv.id);
        cb.disabled = !srv.enabled;
        cb.onchange = () => {
          if (cb.checked) {
            if (!state.agentSelectedServerIds.includes(srv.id)) state.agentSelectedServerIds.push(srv.id);
          } else {
            state.agentSelectedServerIds = state.agentSelectedServerIds.filter(x => x !== srv.id);
          }
        };
        return h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' } },
          cb,
          h('span', {}, `${srv.name} ${srv.enabled ? '' : '(disabled)'}`),
        );
      });
      showModal({
        title: 'Select MCP servers',
        body: rows.length ? h('div', {}, ...rows) : h('p', { class: 'hint' }, 'No MCP servers yet. Configure one in Settings.'),
        actions: [
          { label: 'Open Settings', kind: 'btn-outline', onclick: () => navigate('settings') },
          { label: 'Done', kind: 'btn-primary' },
        ],
      });
    },
  }, `Servers (${state.agentSelectedServerIds.length})`);
  const slidersBtn = h('button', {
    class: 'btn btn-ghost icon-btn',
    title: 'Generation controls',
    'aria-label': 'Toggle generation controls',
    onclick: () => {
      const open = drawer.classList.toggle('open');
      slidersBtn.classList.toggle('active', open);
    },
  }, h('span', { html: ICON.sliders }));

  return h('main', { class: 'main' },
    h('header', { class: 'topbar' },
      h('div', { class: 'topbar-title' },
        modeSel,
        h('span', {}, 'Model'),
        ModelPicker(),
        mcpBtn,
      ),
      h('div', { class: 'topbar-meta' },
        slidersBtn,
        ThemeToggle(),
      ),
    ),
    h('div', { class: 'chat-body' },
      messagesEl,
      drawer,
    ),
    h('footer', { class: 'composer' },
      h('div', { class: 'composer-inner' }, input, sendBtn),
    ),
  );
}

async function newChat() {
  resetChatState();
  state.view = 'chat';
  render();
}
async function openConversation(id) {
  const conv = state.conversations.find(c => c.id === id);
  if (!conv) return;
  resetChatState();
  state.currentConv = conv;
  state.selectedModel = conv.model_id || state.selectedModel;
  // Latest page only; older messages stream in as the user scrolls up.
  state.messages = await api.get(`/api/conversations/${id}/messages?limit=${PAGE_SIZE}`);
  state.msgsExhausted = state.messages.length < PAGE_SIZE;
  state.view = 'chat';
  render();
}

// =================================================================
// MODELS
// =================================================================
function ModelsView() {
  const adapters = state.installed.filter(m => m.type === 'adapter');
  // "New" badge window — anything downloaded within the last NEW_WINDOW_MS
  // floats to the top of the grid and is rendered with a `new` chip. The
  // chip fades out automatically: a quiet timer re-renders the page once
  // the window expires for the most recent install.
  const NEW_WINDOW_MS = 10 * 60 * 1000;
  const now = Date.now();
  const dlMs = (m) => m.downloaded_at ? Date.parse(m.downloaded_at + 'Z') : 0;
  const isNew = (m) => m.installed && dlMs(m) > 0 && (now - dlMs(m)) < NEW_WINDOW_MS;

  const sorted = state.catalog.slice();   // server already orders correctly

  // ---- Grid with seamless server-driven infinite scroll ----------
  // Mirrors the conversations sidebar pattern: render whatever's in
  // `state.catalog`, then mount an IntersectionObserver sentinel that
  // asks the server for the next page when it scrolls into view.
  const grid = h('div', { class: 'grid-3' });
  for (const m of sorted) grid.appendChild(ModelCard(m, { fresh: isNew(m) }));

  let gridSentinel = null;
  if (!state.catalogExhausted) {
    gridSentinel = h('div', { class: 'scroll-sentinel', 'aria-hidden': 'true' },
      h('div', { class: 'spinner' }));
  }

  setTimeout(() => {
    if (!gridSentinel) return;
    const root = grid.closest('.page') || null;
    const io = new IntersectionObserver(async (entries) => {
      if (!entries.some(e => e.isIntersecting)) return;
      const before = state.catalog.length;
      await loadMoreCatalog();
      for (let i = before; i < state.catalog.length; i++) {
        grid.appendChild(ModelCard(state.catalog[i], { fresh: isNew(state.catalog[i]) }));
      }
      if (state.catalogExhausted) { io.disconnect(); gridSentinel.remove(); gridSentinel = null; }
    }, { root, rootMargin: '240px 0px' });
    io.observe(gridSentinel);
  }, 0);
  // ----------------------------------------------------------------

  // Schedule a one-shot re-render to drop the badge as soon as it expires
  // for the most-recently-installed model. Cleared if the user navigates away.
  if (state._newBadgeTimer) { clearTimeout(state._newBadgeTimer); state._newBadgeTimer = null; }
  const newest = sorted.find(isNew);
  if (newest) {
    const remaining = NEW_WINDOW_MS - (now - dlMs(newest)) + 250;
    state._newBadgeTimer = setTimeout(() => {
      state._newBadgeTimer = null;
      if (state.view === 'models') render();
    }, Math.max(1000, remaining));
  }

  // ---- Add-from-Hugging-Face panel ------------------------------
  const addInput = h('input', {
    class: 'input',
    placeholder: 'Paste a Hugging Face URL or owner/name (e.g. Qwen/Qwen2.5-0.5B-Instruct)',
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); } },
  });
  const addBtn = h('button', { class: 'btn btn-primary', type: 'button' },
    h('span', { html: ICON.plus }), 'Add');
  const addStatus = h('div', { class: 'progress-text', style: { display: 'none', marginTop: '10px' } }, '');
  const addProgress = h('div', { class: 'progress', style: { display: 'none', marginTop: '8px' } }, h('div'));

  addBtn.onclick = async () => {
    const raw = addInput.value.trim();
    if (!raw) { toast('Paste a Hugging Face URL or repo id', 'error'); addInput.focus(); return; }
    addBtn.disabled = true; addInput.disabled = true;
    addStatus.style.display = 'block'; addProgress.style.display = 'block';
    addStatus.textContent = 'Connecting to Hugging Face…';
    let ok = false;
    try {
      for await (const evt of api.stream('/api/models/download', { repo_id: raw })) {
        if (evt.event === 'start')    addStatus.textContent = `Downloading ${evt.repo_id || raw}…`;
        if (evt.event === 'progress') addStatus.textContent = evt.message;
        if (evt.event === 'done')     addStatus.textContent = 'Finalizing…';
        if (evt.event === 'saved')    addStatus.textContent = `Saved (${(evt.size_bytes/1e9).toFixed(2)} GB)`;
        if (evt.event === 'error')    {
          if (evt.code === 'gated') { showGatedModal({ repoId: evt.repo_id || raw }); throw new Error(evt.message || 'Gated model'); }
          toast(evt.message, 'error');
          throw new Error(evt.message);
        }
      }
      ok = true;
      addInput.value = '';
      toast('Model added', 'success');
      await refreshCatalog(); render();
    } catch (e) {
      if (!ok) toast(e.message || 'Add failed', 'error');
    } finally {
      addBtn.disabled = false; addInput.disabled = false;
      addProgress.style.display = 'none';
      if (!ok) addStatus.textContent = '';
    }
  };

  const addSection = h('section', { style: { marginBottom: '24px' } },
    h('div', { class: 'card' },
      h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' } },
        h('span', { html: ICON.download, style: { display: 'inline-flex', color: 'var(--accent)', marginTop: '1px', flex: '0 0 auto' } }),
        h('div', { style: { minWidth: 0, flex: 1 } },
          h('div', { style: { fontWeight: 600, fontSize: '14px', marginBottom: '2px' } }, 'Add a model from Hugging Face'),
          h('p', { class: 'hint', style: { margin: 0 } },
            'Any text-generation model on huggingface.co. Paste the repo URL or just the owner/name.'),
        ),
      ),
      h('div', { style: { display: 'flex', gap: '8px' } }, addInput, addBtn),
      addStatus, addProgress,
    ),
  );
  // ---------------------------------------------------------------

  const adapterSection = adapters.length === 0 ? null : h('section', { style: { marginBottom: '32px' } },
    h('div', { class: 'page-header', style: { marginBottom: '14px' } },
      h('div', {},
        h('h1', { style: { fontSize: '17px' } }, 'Your fine-tuned adapters'),
        h('p', {}, `${adapters.length} LoRA ${adapters.length === 1 ? 'adapter' : 'adapters'} trained on your data.`),
      ),
    ),
    h('div', { class: 'grid-3' }, ...adapters.map(AdapterCard)),
  );

  return h('main', { class: 'main' },
    h('div', { class: 'page' },
      h('div', { class: 'page-inner' },
        h('div', { class: 'page-header' },
          h('div', {},
            h('h1', {}, 'Models'),
            h('p', {}, 'Add any model from Hugging Face or chat with your fine-tunes — all running locally.'),
          ),
          state.device
            ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                h('span', { class: 'device-pill' }, h('span', { class: 'dot' }), `${state.device.device.toUpperCase()} ready`),
                ThemeToggle(),
              )
            : ThemeToggle(),
        ),
        addSection,
        adapterSection,
        adapters.length ? h('div', { class: 'page-header', style: { marginBottom: '14px' } },
          h('div', {}, h('h1', { style: { fontSize: '17px' } }, 'Catalog')),
        ) : null,
        grid,
        gridSentinel,
      ),
    ),
  );
}

function AdapterCard(m) {
  const sizeMB = (m.size_bytes / 1e6).toFixed(1);
  return h('div', { class: 'card' },
    h('div', { class: 'model-head' },
      h('div', { style: { minWidth: 0, flex: 1 } },
        h('div', { class: 'model-title' },
          h('h3', {}, '🎯 ' + m.adapter_name),
          h('span', { class: 'chip success' }, h('span', { html: ICON.spark, style: { display: 'inline-flex' } }), 'fine-tune'),
        ),
        h('div', { class: 'model-repo' }, 'base: ' + m.base_model),
      ),
      h('button', {
        class: 'btn btn-outline',
        onclick: async () => {
          if (!confirm(`Delete adapter "${m.adapter_name}"? This cannot be undone.`)) return;
          try {
            await api.del('/api/adapters/' + encodeURIComponent(m.adapter_name));
            // If the chat is using it, fall back to the base model.
            if (state.selectedModel === m.repo_id) {
              state.selectedModel = m.base_model;
              localStorage.setItem('pocketlm.model', state.selectedModel);
            }
            await refreshCatalog(); render();
            toast('Adapter deleted', 'success');
          } catch (e) { toast(e.message, 'error'); }
        },
      }, h('span', { html: ICON.trash }), 'Delete'),
    ),
    h('p', { class: 'model-desc' },
      m.created_at ? `Trained ${new Date(m.created_at + 'Z').toLocaleString()}.` : 'Trained adapter ready to use.',
    ),
    h('div', { class: 'chips' },
      h('span', { class: 'chip' }, `${sizeMB} MB`),
      h('span', { class: 'chip' }, 'LoRA'),
      h('span', { class: 'chip' }, m.base_model.split('/').pop()),
    ),
    h('div', { style: { marginTop: '12px', display: 'flex', gap: '8px' } },
      h('button', {
        class: 'btn btn-primary',
        onclick: () => {
          state.selectedModel = m.repo_id;
          localStorage.setItem('pocketlm.model', state.selectedModel);
          newChat();
        },
      }, h('span', { html: ICON.chat }), 'Chat with this'),
    ),
  );
}

function ModelCard(m, opts = {}) {
  const installed = m.installed;
  const fresh = !!opts.fresh;
  const action = installed
    ? h('button', {
        class: 'btn btn-outline',
        onclick: async () => {
          if (!confirm(`Delete ${m.display_name}?`)) return;
          await api.del('/api/models/' + encodeURIComponent(m.repo_id));
          await refreshCatalog(); render();
          toast('Deleted', 'success');
        },
      }, h('span', { html: ICON.trash }), 'Remove')
    : h('button', { class: 'btn btn-primary', onclick: (e) => downloadModel(m, e.currentTarget) },
        h('span', { html: ICON.download }), 'Download');

  const progress = h('div', { class: 'progress', style: { display: 'none' } }, h('div'));
  const progressText = h('div', { class: 'progress-text', style: { display: 'none' } }, '');

  return h('div', { class: 'card' + (fresh ? ' fresh' : '') },
    h('div', { class: 'model-head' },
      h('div', { style: { minWidth: 0, flex: 1 } },
        h('div', { class: 'model-title' },
          h('h3', {}, m.display_name),
          fresh ? h('span', { class: 'chip new' }, 'new') : null,
          // Distinguish models the user pulled in themselves (via the
          // "Add a model from Hugging Face" panel) from the curated catalog
          // entries shipped with the app. Shown on every custom card so it
          // stays meaningful even after the "new" badge has expired.
          m.custom ? h('span', { class: 'chip custom' }, h('span', { html: ICON.download, style: { display: 'inline-flex' } }), 'user-added') : null,
          m.gated ? h('span', { class: 'chip warn' }, h('span', { html: ICON.lock, style: { display: 'inline-flex' } }), 'gated') : null,
          installed ? h('span', { class: 'chip success' }, h('span', { html: ICON.check, style: { display: 'inline-flex' } }), 'installed') : null,
        ),
        h('div', { class: 'model-repo' }, m.repo_id),
      ),
      action,
    ),
    h('p', { class: 'model-desc' }, m.description),
    h('div', { class: 'chips' },
      m.params_b   ? h('span', { class: 'chip' }, `${m.custom ? '≈' : ''}${m.params_b}B params`) : null,
      m.min_ram_gb ? h('span', { class: 'chip' }, `${m.min_ram_gb} GB RAM+`) : null,
      m.context    ? h('span', { class: 'chip' }, `${(m.context/1024).toFixed(0)}k ctx`) : null,
      m.family     ? h('span', { class: 'chip' }, m.family) : null,
    ),
    progress, progressText,
  );

  async function downloadModel(model, btn) {
    btn.disabled = true; btn.innerHTML = ''; btn.append(h('span', { html: ICON.download }), 'Downloading…');
    progress.style.display = 'block'; progressText.style.display = 'block';
    progressText.textContent = 'Connecting to Hugging Face…';
    try {
      for await (const evt of api.stream('/api/models/download', { repo_id: model.repo_id })) {
        if (evt.event === 'progress') progressText.textContent = evt.message;
        if (evt.event === 'start') progressText.textContent = 'Starting…';
        if (evt.event === 'done') progressText.textContent = 'Finalizing…';
        if (evt.event === 'saved') progressText.textContent = `Saved (${(evt.size_bytes/1e9).toFixed(2)} GB)`;
        if (evt.event === 'error') {
          if (evt.code === 'gated') showGatedModal({ repoId: evt.repo_id || model.repo_id });
          else toast(evt.message, 'error');
          break;
        }
      }
      await refreshCatalog(); render();
      toast(`${model.display_name} ready`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }
}

// =================================================================
// TRAIN
// =================================================================
function TrainView() {
  const baseSel = h('select', { class: 'input' });
  const trainable = state.installed.filter(m => m.type !== 'adapter');
  if (trainable.length === 0) {
    baseSel.appendChild(h('option', { value: '' }, '— No installed base models —'));
    baseSel.disabled = true;
  } else {
    for (const m of trainable) baseSel.appendChild(h('option', { value: m.repo_id }, m.repo_id));
  }

  const datasetPath = h('input', { class: 'input', placeholder: '/path/to/data.txt or .jsonl' });
  const fileInput = h('input', { type: 'file', style: { display: 'none' }, onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading…';
    try {
      const r = await fetch('/api/datasets/upload', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      datasetPath.value = data.path;
      toast(`Uploaded ${data.name}`, 'success');
    } catch (err) { toast('Upload failed: ' + err.message, 'error'); }
    finally { uploadBtn.disabled = false; uploadBtn.innerHTML = ''; uploadBtn.append(h('span', { html: ICON.upload }), 'Upload'); }
  }});
  const uploadBtn = h('button', { class: 'btn btn-outline', onclick: () => fileInput.click() },
    h('span', { html: ICON.upload }), 'Upload');

  const num = (v) => h('input', { class: 'input', type: 'number', value: v, step: 'any' });
  const epochs = num(1), lr = num(0.0002), loraR = num(8), loraAlpha = num(16);
  const maxSeq = num(512), batch = num(1), grad = num(8);
  const outputName = h('input', { class: 'input', placeholder: 'Auto (timestamped)' });

  const logEl = h('div', { class: 'log' }, '');
  const stepLine = h('div', { style: { fontSize: '13px', color: 'var(--muted)' } }, 'Idle.');
  const barInner = h('div');
  const bar = h('div', { class: 'bar' }, barInner);
  const canvas = h('canvas', { class: 'loss' });
  const losses = [];

  function drawLoss() {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width = canvas.clientWidth * dpr;
    const H = canvas.height = 160 * dpr;
    ctx.clearRect(0, 0, W, H);
    if (losses.length < 1) return;
    const pad = 16 * dpr;

    // Stable y-axis: anchor to [0, initial_loss] (with a touch of headroom
    // in case loss spikes above the starting point). This stops the chart
    // from rescaling on every new point — early steps no longer look like
    // a perfect diagonal just because the window is tiny.
    const initial = losses[0];
    const observedMax = Math.max(...losses);
    const yMax = Math.max(initial, observedMax) * 1.05;
    const yMin = 0;
    const xAt = (i) => pad + (W - 2 * pad) * (losses.length === 1 ? 0.5 : i / (losses.length - 1));
    const yAt = (v) => H - pad - (H - 2 * pad) * ((v - yMin) / ((yMax - yMin) || 1));

    // Faint baseline at y=0 for context.
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(pad, H - pad);
    ctx.lineTo(W - pad, H - pad);
    ctx.stroke();

    // Raw loss line (gradient).
    if (losses.length >= 2) {
      const grad2 = ctx.createLinearGradient(0, 0, W, 0);
      grad2.addColorStop(0, '#7c8cff');
      grad2.addColorStop(1, '#9d7cff');
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      losses.forEach((v, i) => {
        const x = xAt(i), y = yAt(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Point markers.
    ctx.fillStyle = '#9d7cff';
    losses.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yAt(v), 2.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    });

    // Smoothed trend line (centered moving average) — emphasises the
    // underlying decrease through the per-batch noise.
    if (losses.length >= 4) {
      const win = Math.max(3, Math.min(9, Math.round(losses.length / 4)));
      const half = Math.floor(win / 2);
      const smooth = losses.map((_, i) => {
        const a = Math.max(0, i - half);
        const b = Math.min(losses.length, i + half + 1);
        let s = 0; for (let k = a; k < b; k++) s += losses[k];
        return s / (b - a);
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath();
      smooth.forEach((v, i) => {
        const x = xAt(i), y = yAt(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  const startBtn = h('button', { class: 'btn btn-primary', onclick: startTraining },
    h('span', { html: ICON.spark }), 'Start fine-tuning');

  async function startTraining() {
    if (!baseSel.value) { toast('Pick a base model', 'error'); return; }
    if (!datasetPath.value.trim()) { toast('Provide a dataset path or upload a file', 'error'); return; }
    startBtn.disabled = true; startBtn.innerHTML = ''; startBtn.append(h('span', { html: ICON.spark }), 'Training…');
    losses.length = 0; logEl.textContent = ''; barInner.style.width = '0%';
    try {
      for await (const evt of api.stream('/api/train', {
        base_model: baseSel.value,
        dataset_path: datasetPath.value.trim(),
        epochs: parseFloat(epochs.value) || 1,
        learning_rate: parseFloat(lr.value) || 2e-4,
        lora_r: parseInt(loraR.value) || 8,
        lora_alpha: parseInt(loraAlpha.value) || 16,
        max_seq_len: parseInt(maxSeq.value) || 512,
        batch_size: parseInt(batch.value) || 1,
        grad_accum: parseInt(grad.value) || 8,
        output_name: outputName.value.trim() || null,
      })) {
        if (evt.event === 'log') { logEl.textContent += evt.message + '\n'; logEl.scrollTop = logEl.scrollHeight; }
        if (evt.event === 'begin') stepLine.textContent = `Starting — ${evt.total_steps} steps`;
        if (evt.event === 'step') {
          stepLine.textContent = `step ${evt.step}/${evt.total} · loss ${evt.loss.toFixed(4)}`;
          barInner.style.width = (100 * evt.step / Math.max(evt.total||1,1)) + '%';
          losses.push(evt.loss); drawLoss();
          logEl.textContent += `step ${evt.step}: loss=${evt.loss.toFixed(4)}\n`;
          logEl.scrollTop = logEl.scrollHeight;
        }
        if (evt.event === 'done') {
          stepLine.textContent = `✓ Done — adapter "${evt.adapter_name}" ready in chat`;
          barInner.style.width = '100%';
          toast('Fine-tuning complete', 'success');
          await refreshCatalog();
        }
        if (evt.event === 'error') {
          stepLine.textContent = `✗ Error: ${evt.message}`;
          toast(evt.message, 'error');
        }
      }
    } catch (e) { toast(e.message, 'error'); }
    finally { startBtn.disabled = false; startBtn.innerHTML = ''; startBtn.append(h('span', { html: ICON.spark }), 'Start fine-tuning'); }
  }

  const field = (label, el, hint) => h('div', {},
    h('label', { class: 'label' }, label), el,
    hint ? h('div', { class: 'hint' }, hint) : null);

  return h('main', { class: 'main' },
    h('div', { class: 'page' },
      h('div', { class: 'page-inner' },
        h('div', { class: 'page-header' },
          h('div', {},
            h('h1', {}, 'Fine-tune a model'),
            h('p', {}, 'LoRA + TRL SFTTrainer. Point at a text/JSONL/CSV file and hit Start.'),
          ),
          ThemeToggle(),
        ),
        h('div', { class: 'train-grid' },
          h('div', { class: 'card', style: { gap: '14px' } },
            field('Base model', baseSel, 'Only installed base models can be fine-tuned.'),
            field('Dataset',
              h('div', { style: { display: 'flex', gap: '8px' } }, datasetPath, uploadBtn, fileInput),
              'Plain .txt (paragraphs), .jsonl with {text} / {messages} / {prompt,response} / {instruction,output}, or .csv.'),
            h('div', { class: 'field-grid' },
              field('Epochs', epochs),
              field('Learning rate', lr),
              field('LoRA r', loraR),
              field('LoRA alpha', loraAlpha),
              field('Max seq len', maxSeq),
              field('Batch size', batch),
              field('Grad accum', grad),
              field('Adapter name', outputName),
            ),
            h('div', {}, startBtn),
          ),
          h('div', { class: 'card', style: { gap: '14px' } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              h('h3', { style: { margin: 0, color: 'white', fontSize: '14px', fontWeight: 600 } }, 'Live progress'),
              stepLine,
            ),
            bar, canvas, logEl,
          ),
        ),
      ),
    ),
  );
}

// =================================================================
// SETTINGS
// =================================================================
async function loadSettings() {
  state.settingsLoading = true;
  try { state.settings = await api.get('/api/settings'); }
  finally { state.settingsLoading = false; }
}

function SettingsView() {
  const wrap = h('main', { class: 'main' },
    h('div', { class: 'page' },
      h('div', { class: 'page-inner' },
        h('div', { class: 'page-header' },
          h('div', {},
            h('h1', {}, 'Settings'),
            h('p', {}, 'Configure PocketLM. Secrets are encrypted at rest and never shown after saving.'),
          ),
          ThemeToggle(),
        ),
        state.settingsLoading || !state.settings
          ? h('div', { class: 'card' }, h('div', { class: 'spinner' }))
          : h('div', {}, SettingsForm(state.settings), MCPSettingsSection()),
      ),
    ),
  );
  if (!state.settings && !state.settingsLoading) {
    loadSettings().then(() => { if (state.view === 'settings') render(); });
  }
  return wrap;
}

function MCPSettingsSection() {
  const section = h('section', { class: 'settings-cat' },
    h('h2', { class: 'settings-cat-title' }, 'Agent / MCP servers'),
  );
  const body = h('div', { class: 'card settings-grid settings-grid-compact' });
  section.appendChild(body);

  const renderBody = async () => {
    await ensureMCPServersLoaded();
    body.innerHTML = '';
    body.appendChild(h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' } },
      h('p', { class: 'hint', style: { margin: 0 } }, 'Configure MCP servers used by Agent mode in Chat.'),
      h('button', { class: 'btn btn-primary', onclick: () => openMCPEditor(null, async () => { await loadMCPServers(); await renderBody(); }) },
        h('span', { html: ICON.plus }), 'Add server'),
    ));
    if (state.mcpServers.length === 0) {
      body.appendChild(h('div', { class: 'empty-hint' }, 'No MCP servers configured.'));
      return;
    }
    for (const srv of state.mcpServers) {
      body.appendChild(h('div', { class: 'setting-row' },
        h('div', { class: 'setting-label' },
          h('div', { class: 'label' }, srv.name),
          h('div', { class: 'hint' }, `${srv.transport} · ${srv.url || srv.command || '(unconfigured)'}`),
          h('div', { class: 'chips', style: { marginTop: '6px' } },
            h('span', { class: `chip ${srv.enabled ? 'success' : 'warn'}` }, srv.enabled ? 'enabled' : 'disabled'),
          ),
        ),
        h('div', { class: 'setting-control', style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          h('button', { class: 'btn btn-outline', onclick: async () => {
            try {
              const r = await api.get(`/api/agent/servers/${srv.id}/tools`);
              showModal({
                title: `Tools — ${srv.name}`,
                body: h('div', {}, r.tools.length === 0
                  ? h('p', { class: 'hint' }, 'No tools advertised.')
                  : h('ul', { class: 'tool-list' }, ...r.tools.map(t => h('li', {}, h('code', {}, t.name), ' — ', t.description || 'no description')))),
                actions: [{ label: 'Close', kind: 'btn-primary' }],
              });
            } catch (e) { toast('List tools failed: ' + e.message, 'error'); }
          } }, 'Tools'),
          h('button', { class: 'btn btn-outline', onclick: () => openMCPEditor(srv, async () => { await loadMCPServers(); await renderBody(); }) }, 'Edit'),
          h('button', { class: 'btn btn-outline', onclick: async () => {
            if (!confirm(`Delete server "${srv.name}"?`)) return;
            await api.del(`/api/agent/servers/${srv.id}`);
            state.agentSelectedServerIds = state.agentSelectedServerIds.filter(x => x !== srv.id);
            await loadMCPServers();
            await renderBody();
          } }, h('span', { html: ICON.trash }), 'Delete'),
        ),
      ));
    }
  };

  // Render async after initial frame.
  setTimeout(() => { renderBody(); }, 0);
  return section;
}

function SettingsForm(data) {
  const mask = data.mask || '••••••••';
  const statusBadge = h('span', { class: 'autosave-badge', 'aria-live': 'polite' }, 'All changes saved');

  // Debounced auto-save: coalesce rapid edits (typing) into one PUT.
  let timer = null;
  const pending = {};
  function flagDirty() {
    statusBadge.textContent = 'Saving…';
    statusBadge.classList.remove('saved'); statusBadge.classList.add('saving');
  }
  function flagSaved() {
    statusBadge.textContent = 'Saved';
    statusBadge.classList.remove('saving'); statusBadge.classList.add('saved');
  }
  function schedule(key, value) {
    pending[key] = value;
    flagDirty();
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 500);
  }
  async function flush() {
    timer = null;
    if (Object.keys(pending).length === 0) return;
    const payload = { ...pending };
    Object.keys(pending).forEach(k => delete pending[k]);
    try {
      const resp = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: payload }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      flagSaved();
    } catch (e) {
      statusBadge.textContent = 'Save failed';
      statusBadge.classList.remove('saving', 'saved'); statusBadge.classList.add('error');
      toast('Save failed: ' + e.message, 'error');
    }
  }

  const renderField = (item) => {
    let control;
    const id = 'set_' + item.key;
    const initialValue = item.value ?? '';
    if (item.type === 'select') {
      control = h('select', { class: 'input', id },
        ...item.options.map(opt =>
          h('option', { value: opt, selected: String(opt) === String(initialValue) ? '' : false }, opt)
        ),
      );
      control.onchange = () => schedule(item.key, control.value);
    } else if (item.type === 'toggle') {
      const sw = h('label', { class: 'switch' },
        h('input', { type: 'checkbox', id }),
        h('span', { class: 'switch-track' }),
      );
      const inp = sw.querySelector('input');
      inp.checked = !!initialValue;
      inp.onchange = () => schedule(item.key, inp.checked);
      control = sw;
    } else if (item.type === 'number') {
      control = h('input', { class: 'input', type: 'number', id, value: initialValue === null ? '' : initialValue });
      control.oninput = () => schedule(item.key, control.value);
    } else if (item.type === 'password') {
      const inp = h('input', { class: 'input secret-input', type: 'password', id,
        placeholder: item.has_value ? mask : 'Not set',
        value: '',
        autocomplete: 'new-password',
      });
      const eyeBtn = h('button', { type: 'button', class: 'btn-ghost icon-btn eye', title: 'Show/hide',
        onclick: () => { inp.type = inp.type === 'password' ? 'text' : 'password'; },
        html: ICON.eye,
      });
      const clearBtn = h('button', { type: 'button', class: 'btn btn-ghost',
        onclick: async () => {
          inp.value = ''; inp.placeholder = 'Not set';
          schedule(item.key, '');
        },
      }, 'Clear');
      inp.oninput = () => schedule(item.key, inp.value);
      const extras = [eyeBtn, clearBtn];
      if (item.key === 'HF_TOKEN') {
        extras.push(h('button', { type: 'button', class: 'btn btn-outline',
          onclick: async () => {
            // Flush any pending typing so the test reflects what's stored.
            if (timer) { clearTimeout(timer); await flush(); }
            try {
              const r = await api.post('/api/settings/test-hf-token', { token: inp.value || undefined });
              toast(`✓ Authenticated as ${r.user}`, 'success');
            } catch (e) {
              let msg = e.message || 'Token rejected';
              try { msg = (JSON.parse(msg).detail) || msg; } catch {}
              toast(msg, 'error');
            }
          },
        }, 'Test'));
      }
      control = h('div', { class: 'secret-row' }, inp, ...extras);
    } else {
      control = h('input', { class: 'input', type: 'text', id, value: initialValue ?? '' });
      control.oninput = () => schedule(item.key, control.value);
    }

    const meta = [];
    if (item.env_present) meta.push(h('span', { class: 'chip' }, 'from .env'));
    if (item.has_value && item.secret) meta.push(h('span', { class: 'chip success' }, 'stored'));
    if (item.restart_required) meta.push(h('span', { class: 'chip warn' }, 'restart required'));

    const focus = state.settingsFocusKey === item.key;
    const row = h('div', { class: 'setting-row' + (focus ? ' focus-target' : '') },
      h('div', { class: 'setting-label' },
        h('label', { class: 'label', for: id }, item.label),
        item.description ? h('div', { class: 'hint' }, item.description) : null,
        meta.length ? h('div', { class: 'chips', style: { marginTop: '6px' } }, ...meta) : null,
      ),
      h('div', { class: 'setting-control' }, control),
    );
    if (focus) {
      requestAnimationFrame(() => {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const f = row.querySelector('input,select,textarea');
        if (f) f.focus();
        state.settingsFocusKey = null;
      });
    }
    return row;
  };

  return h('div', {},
    h('div', { class: 'settings-status' }, statusBadge),
    ...data.categories.map(cat => h('section', { class: 'settings-cat' },
      h('h2', { class: 'settings-cat-title' }, cat.name),
      h('div', { class: 'card settings-grid' },
        ...cat.items.map(renderField),
      ),
    )),
  );
}

// =================================================================
// AGENT
// =================================================================
async function loadMCPServers() {
  try {
    state.mcpServers = await api.get('/api/agent/servers');
  } catch (e) {
    state.mcpServers = [];
    toast('Failed to load MCP servers: ' + e.message, 'error');
  } finally {
    state.mcpServersLoaded = true;
  }
}

async function ensureMCPServersLoaded(force = false) {
  if (!force && state.mcpServersLoaded) return;
  await loadMCPServers();
}

function AgentView() {
  const wrap = h('main', { class: 'main' },
    h('div', { class: 'page' },
      h('div', { class: 'page-inner' },
        h('div', { class: 'page-header' },
          h('div', {},
            h('h1', {}, 'Agent'),
            h('p', {}, 'Let your local model use MCP tools. Connect to a Model Context Protocol server, pick which servers to expose, and chat.'),
          ),
          ThemeToggle(),
        ),
        state.mcpServersLoaded
          ? AgentBody()
          : h('div', { class: 'card' }, h('div', { class: 'spinner' })),
      ),
    ),
  );
  if (!state.mcpServersLoaded) {
    loadMCPServers().then(() => { if (state.view === 'agent') render(); });
  }
  return wrap;
}

function AgentBody() {
  const left = h('div', { class: 'agent-left' });
  const right = h('div', { class: 'agent-right' });

  // ---- Server list / CRUD ----
  const header = h('div', { class: 'agent-section-head' },
    h('h3', {}, 'MCP servers'),
    h('button', { class: 'btn btn-primary',
      onclick: () => openMCPEditor(null, async () => { await loadMCPServers(); render(); }),
    }, h('span', { html: ICON.plus }), 'Add server'),
  );
  left.appendChild(header);

  if (state.mcpServers.length === 0) {
    left.appendChild(h('div', { class: 'card empty-hint' }, 'No MCP servers yet. Add one to enable tool use.'));
  } else {
    for (const srv of state.mcpServers) left.appendChild(MCPServerCard(srv));
  }

  // ---- Agent chat ----
  const messagesEl = h('div', { class: 'agent-messages' });
  const renderAgentMessages = () => {
    messagesEl.innerHTML = '';
    if (state.agentMessages.length === 0) {
      messagesEl.appendChild(h('div', { class: 'empty-hint' },
        'Pick one or more enabled servers on the left, then ask a question that needs a tool.'));
      return;
    }
    for (const m of state.agentMessages) messagesEl.appendChild(AgentBubble(m));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const input = h('textarea', { class: 'input', rows: 2, placeholder: 'Ask the agent…',
    onkeydown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } });

  const sendBtn = h('button', { class: 'btn btn-primary',
    onclick: () => state.agentGenerating ? stop() : send(),
  }, h('span', { html: ICON.send }), 'Send');

  function stop() {
    if (state.agentAbortCtl) { try { state.agentAbortCtl.abort(); } catch {} }
  }

  async function send() {
    const text = input.value.trim();
    if (!text || state.agentGenerating) return;
    if (!state.selectedModel) { toast('Pick a model first', 'error'); return; }
    const serverIds = state.mcpServers.filter(s => state.agentSelectedServerIds.includes(s.id) && s.enabled).map(s => s.id);
    if (serverIds.length === 0) { toast('Select at least one enabled MCP server', 'error'); return; }
    state.agentMessages.push({ role: 'user', content: text });
    const assistant = { role: 'assistant', content: '', events: [] };
    state.agentMessages.push(assistant);
    input.value = ''; renderAgentMessages();
    state.agentGenerating = true; state.agentAbortCtl = new AbortController();
    sendBtn.innerHTML = ''; sendBtn.append(h('span', { html: ICON.stop }), 'Stop');
    try {
      for await (const evt of api.stream('/api/agent/chat', {
        model_id: state.selectedModel,
        message: text,
        server_ids: serverIds,
      }, { signal: state.agentAbortCtl.signal })) {
        if (evt.event === 'token') {
          assistant.content += (assistant.content ? '\n\n' : '') + evt.text;
        } else if (evt.event === 'tool_call' || evt.event === 'tool_result' || evt.event === 'tool_error') {
          assistant.events.push(evt);
        } else if (evt.event === 'error') {
          toast(evt.message, 'error');
          assistant.content += `\n\n*Error: ${evt.message}*`;
        }
        renderAgentMessages();
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast(e.message, 'error');
    } finally {
      state.agentGenerating = false; state.agentAbortCtl = null;
      sendBtn.innerHTML = ''; sendBtn.append(h('span', { html: ICON.send }), 'Send');
    }
  }

  right.append(
    h('div', { class: 'agent-section-head' },
      h('h3', {}, 'Chat'),
      ModelPicker(),
    ),
    messagesEl,
    h('div', { class: 'agent-composer' }, input, sendBtn),
  );
  setTimeout(renderAgentMessages, 0);

  return h('div', { class: 'agent-grid' }, left, right);
}

function AgentBubble(m) {
  const isUser = m.role === 'user';
  const body = h('div', { class: 'bubble' });
  if (m.events && m.events.length) {
    for (const ev of m.events) {
      if (ev.event === 'tool_call') {
        body.appendChild(h('div', { class: 'tool-card' },
          h('div', { class: 'tool-head' }, h('strong', {}, 'tool_call'), h('code', {}, ev.name)),
          h('pre', { class: 'tool-json' }, JSON.stringify(ev.arguments || {}, null, 2)),
        ));
      } else if (ev.event === 'tool_result') {
        body.appendChild(h('div', { class: 'tool-card ok' },
          h('div', { class: 'tool-head' }, h('strong', {}, 'tool_result'), h('code', {}, ev.name)),
          h('pre', { class: 'tool-json' }, JSON.stringify(ev.result || {}, null, 2)),
        ));
      } else if (ev.event === 'tool_error') {
        body.appendChild(h('div', { class: 'tool-card err' },
          h('div', { class: 'tool-head' }, h('strong', {}, 'tool_error'), h('code', {}, ev.server_name || '')),
          h('pre', { class: 'tool-json' }, ev.error || ''),
        ));
      }
    }
  }
  const md = h('div', { class: 'md' });
  setMd(md, m.content || (isUser ? '' : '…'));
  body.appendChild(md);
  return h('div', { class: `msg-wrap ${isUser ? 'user' : ''}` },
    h('div', { class: `avatar ${isUser ? 'user' : 'ai'}` }, isUser ? 'You' : 'AI'),
    h('div', { class: 'msg-col' }, body),
  );
}

function MCPServerCard(srv) {
  const checked = state.agentSelectedServerIds.includes(srv.id);
  const cb = h('input', { type: 'checkbox' });
  cb.checked = checked;
  cb.onchange = () => {
    if (cb.checked) {
      if (!state.agentSelectedServerIds.includes(srv.id)) state.agentSelectedServerIds.push(srv.id);
    } else {
      state.agentSelectedServerIds = state.agentSelectedServerIds.filter(x => x !== srv.id);
    }
  };
  return h('div', { class: 'card mcp-card' + (srv.enabled ? '' : ' disabled') },
    h('div', { class: 'mcp-head' },
      h('label', { class: 'mcp-check' }, cb,
        h('div', {},
          h('div', { class: 'mcp-name' }, srv.name),
          h('div', { class: 'model-repo' }, `${srv.transport} · ${srv.url || srv.command || '(unconfigured)'}`),
        ),
      ),
      h('div', { class: 'mcp-actions' },
        h('button', { class: 'btn btn-outline',
          onclick: async () => {
            try {
              const r = await api.get(`/api/agent/servers/${srv.id}/tools`);
              showModal({
                title: `Tools — ${srv.name}`,
                body: h('div', {}, r.tools.length === 0
                  ? h('p', { class: 'hint' }, 'No tools advertised.')
                  : h('ul', { class: 'tool-list' }, ...r.tools.map(t =>
                      h('li', {}, h('code', {}, t.name), ' — ', t.description || h('em', {}, 'no description'))))),
                actions: [{ label: 'Close', kind: 'btn-primary' }],
              });
            } catch (e) { toast('List tools failed: ' + e.message, 'error'); }
          },
        }, 'Tools'),
        h('button', { class: 'btn btn-outline',
          onclick: () => openMCPEditor(srv, async () => { await loadMCPServers(); render(); }),
        }, 'Edit'),
        h('button', { class: 'btn btn-outline',
          onclick: async () => {
            if (!confirm(`Delete server "${srv.name}"?`)) return;
            await api.del(`/api/agent/servers/${srv.id}`);
            await loadMCPServers(); render();
          },
        }, h('span', { html: ICON.trash })),
      ),
    ),
  );
}

function openMCPEditor(srv, onSaved) {
  const isNew = !srv;
  const form = {
    name: srv?.name || '',
    transport: srv?.transport || 'http',
    url: srv?.url || '',
    command: srv?.command || '',
    args: (srv?.args || []).join(' '),
    enabled: srv ? !!srv.enabled : true,
    headers: { ...(srv?.headers || {}) },
  };
  const headersContainer = h('div', { class: 'kv-list' });
  function renderHeaders() {
    headersContainer.innerHTML = '';
    const entries = Object.entries(form.headers);
    if (entries.length === 0) {
      headersContainer.appendChild(h('div', { class: 'hint' }, 'No custom headers.'));
    }
    for (const [k, v] of entries) {
      const ki = h('input', { class: 'input', type: 'text', value: k, placeholder: 'Header' });
      const vi = h('input', { class: 'input', type: 'text', value: v, placeholder: 'Value' });
      const row = h('div', { class: 'kv-row' }, ki, vi,
        h('button', { class: 'btn btn-ghost', onclick: () => { delete form.headers[k]; renderHeaders(); } }, '×'));
      ki.onchange = () => {
        const newK = ki.value.trim();
        if (!newK || newK === k) return;
        form.headers[newK] = form.headers[k]; delete form.headers[k]; renderHeaders();
      };
      vi.oninput = () => { form.headers[ki.value.trim() || k] = vi.value; };
      headersContainer.appendChild(row);
    }
  }
  renderHeaders();

  const nameI = h('input', { class: 'input', value: form.name, placeholder: 'My MCP server' });
  nameI.oninput = () => { form.name = nameI.value; };
  const transportI = h('select', { class: 'input' },
    ...['http', 'sse', 'stdio'].map(t => h('option', { value: t, selected: form.transport === t ? '' : false }, t)));
  transportI.onchange = () => { form.transport = transportI.value; toggleFields(); };
  const urlI = h('input', { class: 'input', value: form.url, placeholder: 'https://example.com/mcp' });
  urlI.oninput = () => { form.url = urlI.value; };
  const cmdI = h('input', { class: 'input', value: form.command, placeholder: '/usr/bin/python' });
  cmdI.oninput = () => { form.command = cmdI.value; };
  const argsI = h('input', { class: 'input', value: form.args, placeholder: '-m mypkg.server --flag' });
  argsI.oninput = () => { form.args = argsI.value; };
  const enabledI = h('label', { class: 'switch' }, h('input', { type: 'checkbox' }), h('span', { class: 'switch-track' }));
  enabledI.querySelector('input').checked = form.enabled;
  enabledI.querySelector('input').onchange = (e) => { form.enabled = e.target.checked; };

  const urlRow = h('div', { class: 'setting-row' },
    h('div', { class: 'setting-label' }, h('label', { class: 'label' }, 'URL'),
      h('div', { class: 'hint' }, 'For http/sse transports.')), h('div', { class: 'setting-control' }, urlI));
  const cmdRow = h('div', { class: 'setting-row' },
    h('div', { class: 'setting-label' }, h('label', { class: 'label' }, 'Command'),
      h('div', { class: 'hint' }, 'For stdio transport.')), h('div', { class: 'setting-control' }, cmdI));
  const argsRow = h('div', { class: 'setting-row' },
    h('div', { class: 'setting-label' }, h('label', { class: 'label' }, 'Args'),
      h('div', { class: 'hint' }, 'Space-separated, for stdio.')), h('div', { class: 'setting-control' }, argsI));

  function toggleFields() {
    const isStdio = form.transport === 'stdio';
    urlRow.style.display = isStdio ? 'none' : '';
    cmdRow.style.display = isStdio ? '' : 'none';
    argsRow.style.display = isStdio ? '' : 'none';
  }

  const body = h('div', { class: 'settings-grid' },
    h('div', { class: 'setting-row' },
      h('div', { class: 'setting-label' }, h('label', { class: 'label' }, 'Name')),
      h('div', { class: 'setting-control' }, nameI)),
    h('div', { class: 'setting-row' },
      h('div', { class: 'setting-label' }, h('label', { class: 'label' }, 'Transport')),
      h('div', { class: 'setting-control' }, transportI)),
    urlRow, cmdRow, argsRow,
    h('div', { class: 'setting-row' },
      h('div', { class: 'setting-label' }, h('label', { class: 'label' }, 'Headers'),
        h('div', { class: 'hint' }, 'Sent on http/sse requests. Values are encrypted at rest.')),
      h('div', { class: 'setting-control' }, headersContainer,
        h('button', { class: 'btn btn-outline', style: { marginTop: '8px' },
          onclick: () => { form.headers[''] = ''; renderHeaders(); } },
          h('span', { html: ICON.plus }), 'Add header'))),
    h('div', { class: 'setting-row' },
      h('div', { class: 'setting-label' }, h('label', { class: 'label' }, 'Enabled')),
      h('div', { class: 'setting-control' }, enabledI)),
  );
  toggleFields();

  showModal({
    title: isNew ? 'Add MCP server' : `Edit — ${srv.name}`,
    body,
    actions: [
      { label: 'Cancel', kind: 'btn-outline' },
      { label: isNew ? 'Add' : 'Save', kind: 'btn-primary', onclick: async () => {
        const payload = {
          name: form.name, transport: form.transport, url: form.url,
          command: form.command,
          args: (form.args || '').split(/\s+/).filter(Boolean),
          headers: Object.fromEntries(Object.entries(form.headers).filter(([k]) => k.trim())),
          enabled: form.enabled,
        };
        try {
          if (isNew) await api.post('/api/agent/servers', payload);
          else {
            const r = await fetch(`/api/agent/servers/${srv.id}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error(await r.text());
          }
          toast(isNew ? 'Server added' : 'Server saved', 'success');
          if (onSaved) await onSaved();
        } catch (e) { toast(e.message, 'error'); }
      }},
    ],
  });
}

// =================================================================
// ROUTER
// =================================================================
function navigate(view) { state.view = view; render(); }

function renderSidebar() {
  const root = $('#app');
  const old = root.firstChild;
  const sb = Sidebar();
  if (old) root.replaceChild(sb, old); else root.appendChild(sb);
}

function render() {
  const root = $('#app');
  // Preserve .page scroll only when re-rendering the SAME view.
  const prevPage = root.querySelector('.page');
  const prevScroll = prevPage ? prevPage.scrollTop : 0;
  const prevView = state._lastRenderedView || null;
  root.innerHTML = '';
  root.appendChild(Sidebar());
  let view;
  if (state.view === 'models') view = ModelsView();
  else if (state.view === 'train') view = TrainView();
  else if (state.view === 'settings') view = SettingsView();
  else if (state.view === 'agent') { state.chatMode = 'agent'; view = ChatView(); }
  else view = ChatView();
  root.appendChild(view);
  if (prevScroll && prevView === state.view) {
    const newPage = root.querySelector('.page');
    if (newPage) newPage.scrollTop = prevScroll;
  }
  state._lastRenderedView = state.view;
}

(async () => {
  render();
  try {
    await Promise.all([refreshCatalog(), refreshConversations()]);
  } catch (e) {
    toast('Failed to reach backend: ' + e.message, 'error');
  }
  render();
})();



