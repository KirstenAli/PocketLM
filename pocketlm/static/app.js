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
  catalog: [],
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
};

const PAGE_SIZE = 50;

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
  const data = await api.get('/api/catalog');
  state.catalog = data.models;
  state.device = data.device;
  const inst = await api.get('/api/models');
  state.installed = inst.models;
  if ((!state.selectedModel || !state.installed.some(m => m.repo_id === state.selectedModel)) && state.installed[0]) {
    state.selectedModel = state.installed[0].repo_id;
    localStorage.setItem('pocketlm.model', state.selectedModel);
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
      navItem('chat',   'Chat',      'chat'),
      navItem('models', 'Models',    'models'),
      navItem('train',  'Fine-tune', 'train'),
    ),
    h('button', { class: 'new-chat-btn', onclick: newChat },
      h('span', { html: ICON.plus }), 'New chat'),
    h('div', { class: 'section-label' }, 'History'),
    convList,
    h('div', { class: 'footnote' }, 'Local-first · all data stays on your machine'),
  );
}

// =================================================================
// CHAT
// =================================================================
function ModelPicker() {
  const sel = h('select', {
    class: 'input', style: { width: 'auto', minWidth: '280px' },
    onchange: (e) => { state.selectedModel = e.target.value; localStorage.setItem('pocketlm.model', state.selectedModel); },
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
    detachTopObserver();
    if (!state.currentConv || state.msgsExhausted || state.messages.length === 0) return;
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
    if (!state.currentConv) {
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
    for (const m of state.messages) messagesEl.appendChild(MessageBubble(m));
    messagesEl.scrollTop = messagesEl.scrollHeight;
    // Wire up infinite-scroll-up after layout settles.
    requestAnimationFrame(attachTopObserver);
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
      for await (const evt of api.stream('/api/chat', {
        conversation_id: convAtSend.id,
        model_id: state.selectedModel,
        message: text,
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
          toast(evt.message, 'error');
          assistant.content += `\n\n*Error: ${evt.message}*`;
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

  setTimeout(renderMessages, 0);

  return h('main', { class: 'main' },
    h('header', { class: 'topbar' },
      h('div', { class: 'topbar-title' },
        h('span', {}, 'Model'),
        ModelPicker(),
      ),
      h('div', { class: 'topbar-meta' },
        ThemeToggle(),
      ),
    ),
    messagesEl,
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
  const grid = h('div', { class: 'grid-3' });
  for (const m of state.catalog) grid.appendChild(ModelCard(m));

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
            h('p', {}, 'Curated, laptop-friendly small models from Hugging Face — plus your own fine-tunes.'),
          ),
          state.device
            ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                h('span', { class: 'device-pill' }, h('span', { class: 'dot' }), `${state.device.device.toUpperCase()} ready`),
                ThemeToggle(),
              )
            : ThemeToggle(),
        ),
        adapterSection,
        adapters.length ? h('div', { class: 'page-header', style: { marginBottom: '14px' } },
          h('div', {}, h('h1', { style: { fontSize: '17px' } }, 'Catalog')),
        ) : null,
        grid,
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

function ModelCard(m) {
  const installed = m.installed;
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

  return h('div', { class: 'card' },
    h('div', { class: 'model-head' },
      h('div', { style: { minWidth: 0, flex: 1 } },
        h('div', { class: 'model-title' },
          h('h3', {}, m.display_name),
          m.gated ? h('span', { class: 'chip warn' }, h('span', { html: ICON.lock, style: { display: 'inline-flex' } }), 'gated') : null,
          installed ? h('span', { class: 'chip success' }, h('span', { html: ICON.check, style: { display: 'inline-flex' } }), 'installed') : null,
        ),
        h('div', { class: 'model-repo' }, m.repo_id),
      ),
      action,
    ),
    h('p', { class: 'model-desc' }, m.description),
    h('div', { class: 'chips' },
      h('span', { class: 'chip' }, `${m.params_b}B params`),
      h('span', { class: 'chip' }, `${m.min_ram_gb} GB RAM+`),
      h('span', { class: 'chip' }, `${(m.context/1024).toFixed(0)}k ctx`),
      h('span', { class: 'chip' }, m.family),
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
        if (evt.event === 'error') { toast(evt.message, 'error'); break; }
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
    const W = canvas.width = canvas.clientWidth * window.devicePixelRatio;
    const H = canvas.height = 160 * window.devicePixelRatio;
    ctx.scale(1,1);
    ctx.clearRect(0,0,W,H);
    if (losses.length < 2) return;
    const min = Math.min(...losses), max = Math.max(...losses);
    const pad = 16 * window.devicePixelRatio;
    const grad2 = ctx.createLinearGradient(0,0,W,0);
    grad2.addColorStop(0, '#7c8cff'); grad2.addColorStop(1, '#9d7cff');
    ctx.strokeStyle = grad2; ctx.lineWidth = 2 * window.devicePixelRatio; ctx.beginPath();
    losses.forEach((v, i) => {
      const x = pad + (W - 2*pad) * (i/(losses.length-1));
      const y = H - pad - (H-2*pad) * ((v-min)/((max-min)||1));
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.fillStyle = '#9d7cff';
    losses.forEach((v, i) => {
      const x = pad + (W - 2*pad) * (i/(losses.length-1));
      const y = H - pad - (H-2*pad) * ((v-min)/((max-min)||1));
      ctx.beginPath(); ctx.arc(x,y, 2.5*window.devicePixelRatio, 0, Math.PI*2); ctx.fill();
    });
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
  root.innerHTML = '';
  root.appendChild(Sidebar());
  let view;
  if (state.view === 'models') view = ModelsView();
  else if (state.view === 'train') view = TrainView();
  else view = ChatView();
  root.appendChild(view);
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

