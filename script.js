/* ============================================================
   FIN 3313 · Financial Management — interactions
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Scroll spy ---------- */
  const nav = document.getElementById('chapterNav');
  const navLinks = Array.from(nav.querySelectorAll('a[data-nav]'));
  const sections = navLinks.map(a => document.getElementById(a.getAttribute('data-nav'))).filter(Boolean);
  const setActive = (id) => navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('data-nav') === id));
  const spy = () => {
    const line = window.innerHeight * 0.3;
    let current = sections[0];
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top <= line) current = sec; else break;
    }
    if (current) setActive(current.id);
  };
  window.addEventListener('scroll', spy, { passive: true });

  /* ---------- Reveal answers ---------- */
  document.querySelectorAll('.qa .reveal').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.qa').classList.add('open'));
  });

  /* ---------- Copy (formula rows, one-liners) ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
  };
  document.querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(el.getAttribute('data-copy'));
        el.classList.add('copied');
        setTimeout(() => el.classList.remove('copied'), 1200);
        showToast('Copied');
      } catch { showToast('Copy failed'); }
    });
  });

  /* ---------- Search ---------- */
  const scrim = document.getElementById('searchScrim');
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const searchBtn = document.getElementById('searchBtn');

  const index = [];
  document.querySelectorAll('.chapter').forEach(ch => {
    const id = ch.id;
    const chTitle = ch.querySelector('.chapter-title')?.textContent.trim() || '';
    const chNum = ch.querySelector('.chapter-num')?.textContent.trim() || '';
    index.push({ id, title: chTitle, ch: `Chapter ${chNum}`, hay: (chTitle + ' ' + chNum).toLowerCase() });
    ch.querySelectorAll('.concept').forEach(c => {
      const label = c.querySelector('.concept-label')?.textContent.trim();
      const body = c.textContent.replace(/\s+/g, ' ').trim();
      if (label) index.push({ id, title: label, ch: chTitle, hay: body.toLowerCase() });
    });
    ch.querySelectorAll('details.worked').forEach(d => {
      const tag = d.querySelector('.w-label')?.textContent.trim() || '';
      const name = d.querySelector('.w-title')?.textContent.trim() || '';
      const body = d.textContent.replace(/\s+/g, ' ').trim();
      index.push({ id, title: name, ch: `${chTitle}${tag ? ' · ' + tag : ''}`, hay: body.toLowerCase(), el: d });
    });
    ch.querySelectorAll('tr.copyable').forEach(tr => {
      const name = tr.querySelector('th')?.textContent.trim() || '';
      const body = tr.textContent.replace(/\s+/g, ' ').trim();
      if (name) index.push({ id, title: name, ch: `${chTitle} · formula`, hay: body.toLowerCase(), el: tr });
    });
  });

  let focused = 0;
  const hitHTML = (h, i) =>
    `<a class="hit${i === 0 ? ' focused' : ''}" href="#${h.id}" data-i="${i}"><div class="hit-ch">${h.ch}</div><div class="hit-title">${h.title}</div></a>`;
  let shown = [];
  const renderResults = (q) => {
    const query = q.trim().toLowerCase();
    if (query) {
      const rank = h => (h.el ? 0 : 1) + (h.title.toLowerCase().includes(query) ? -0.5 : 0);
      const seen = new Set();
      shown = index.filter(h => h.hay.includes(query))
        .sort((a, b) => rank(a) - rank(b))
        .filter(h => { const k = h.title.toLowerCase() + '|' + h.id; if (seen.has(k)) return false; seen.add(k); return true; })
        .slice(0, 14);
    } else {
      shown = index.filter(h => h.ch.startsWith('Chapter'));
    }
    results.innerHTML = shown.length ? shown.map(hitHTML).join('') : '<div class="empty">No matches. Try another term.</div>';
    focused = 0;
    results.querySelectorAll('.hit').forEach(el => {
      el.addEventListener('mouseenter', () => {
        results.querySelectorAll('.hit').forEach(x => x.classList.remove('focused'));
        el.classList.add('focused');
        focused = parseInt(el.dataset.i, 10);
      });
      el.addEventListener('click', (e) => { e.preventDefault(); go(parseInt(el.dataset.i, 10)); });
    });
  };
  const go = (i) => {
    const h = shown[i];
    if (!h) return;
    closeSearch();
    if (h.el) {
      const d = h.el.closest('details');
      if (d) d.open = true;
      h.el.scrollIntoView({ block: 'center' });
      h.el.classList.add('flash');
      setTimeout(() => h.el.classList.remove('flash'), 1600);
    } else {
      window.location.hash = '#' + h.id;
    }
  };
  const openSearch = () => {
    scrim.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 30);
    renderResults('');
  };
  const closeSearch = () => {
    scrim.classList.remove('open');
    document.body.style.overflow = '';
    input.value = '';
  };
  searchBtn.addEventListener('click', openSearch);
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeSearch(); });
  input.addEventListener('input', (e) => renderResults(e.target.value));

  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const cmd = isMac ? e.metaKey : e.ctrlKey;
    if (cmd && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      scrim.classList.contains('open') ? closeSearch() : openSearch();
      return;
    }
    if (!scrim.classList.contains('open')) return;
    if (e.key === 'Escape') { closeSearch(); return; }
    const hits = Array.from(results.querySelectorAll('.hit'));
    if (!hits.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      hits.forEach(h => h.classList.remove('focused'));
      focused = (focused + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length;
      hits[focused].classList.add('focused');
      hits[focused].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(focused);
    }
  });

  /* ---------- Initial nav state ---------- */
  spy();
})();
