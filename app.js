/* ===== Shijing App ===== */
(function() {
  'use strict';

  // --- State ---
  let currentView = 'home';
  let allPoems = []; // flat list: { sectionName, subsectionName, title, text, annotations, notes, index }
  let currentPoemIndex = -1;

  // --- DOM refs ---
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuBtn = document.getElementById('menu-btn');
  const logoBtn = document.getElementById('logo-btn');
  const tocEl = document.getElementById('toc');
  const searchInput = document.getElementById('search-input');
  const homeView = document.getElementById('home-view');
  const poemView = document.getElementById('poem-view');
  const sectionView = document.getElementById('section-view');
  const homeSections = document.getElementById('home-sections');

  // --- Theme toggle ---
  function initTheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);

    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        updateThemeIcons(next);
      });
    });
  }

  function updateThemeIcons(theme) {
    const sunSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    const moonSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.innerHTML = theme === 'dark' ? sunSVG : moonSVG;
    });
  }

  // --- Build flat poem list ---
  function buildPoemList() {
    let idx = 0;
    SHIJING_DATA.sections.forEach(section => {
      section.subsections.forEach(sub => {
        sub.poems.forEach(poem => {
          allPoems.push({
            sectionName: section.name,
            subsectionName: sub.name,
            title: poem.title,
            text: poem.text,
            annotations: poem.annotations || {},
            notes: poem.notes || '',
            index: idx++
          });
        });
      });
    });
  }

  // --- Build TOC ---
  function buildTOC() {
    let html = '';
    SHIJING_DATA.sections.forEach((section, si) => {
      html += `<div class="toc-section">`;
      html += `<div class="toc-section-title" data-section="${si}"><span class="arrow">▸</span>${section.name}</div>`;
      html += `<div class="toc-subsection" data-section-content="${si}">`;
      section.subsections.forEach(sub => {
        html += `<div class="toc-sub-title">${sub.name}</div>`;
        sub.poems.forEach(poem => {
          const pIdx = allPoems.findIndex(p => p.title === poem.title && p.subsectionName === sub.name);
          html += `<div class="toc-poem" data-poem="${pIdx}">${poem.title}</div>`;
        });
      });
      html += `</div></div>`;
    });
    tocEl.innerHTML = html;

    // Toggle sections
    tocEl.querySelectorAll('.toc-section-title').forEach(el => {
      el.addEventListener('click', () => {
        const si = el.dataset.section;
        const content = tocEl.querySelector(`[data-section-content="${si}"]`);
        const isOpen = el.classList.contains('open');
        // Close all
        tocEl.querySelectorAll('.toc-section-title').forEach(t => t.classList.remove('open'));
        tocEl.querySelectorAll('.toc-subsection').forEach(c => c.classList.remove('open'));
        if (!isOpen) {
          el.classList.add('open');
          content.classList.add('open');
        }
      });
    });

    // Click poems
    tocEl.querySelectorAll('.toc-poem').forEach(el => {
      el.addEventListener('click', () => {
        showPoem(parseInt(el.dataset.poem));
        closeSidebar();
      });
    });
  }

  // --- Build home sections ---
  function buildHome() {
    let html = '';
    SHIJING_DATA.sections.forEach((section, si) => {
      const count = section.subsections.reduce((s, sub) => s + sub.poems.length, 0);
      html += `<div class="home-section-card" data-section="${si}">
        <div class="card-name">${section.name}</div>
        <div class="card-count">${count} 篇</div>
      </div>`;
    });
    homeSections.innerHTML = html;

    homeSections.querySelectorAll('.home-section-card').forEach(el => {
      el.addEventListener('click', () => {
        showSection(parseInt(el.dataset.section));
      });
    });
  }

  // --- Apply ruby annotations to text ---
  function annotateText(text, annotations) {
    if (!annotations || Object.keys(annotations).length === 0) return escapeHtml(text);

    // Sort by key length descending to match longer phrases first
    const keys = Object.keys(annotations).sort((a, b) => b.length - a.length);
    let result = '';
    let i = 0;
    const chars = [...text]; // handle unicode properly

    while (i < chars.length) {
      let matched = false;
      for (const key of keys) {
        const keyChars = [...key];
        const slice = chars.slice(i, i + keyChars.length).join('');
        if (slice === key) {
          result += `<ruby>${escapeHtml(key)}<rt>${annotations[key]}</rt></ruby>`;
          i += keyChars.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += escapeHtml(chars[i]);
        i++;
      }
    }
    return result;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- Show views ---
  function setView(name) {
    currentView = name;
    [homeView, poemView, sectionView].forEach(v => v.classList.remove('active'));
    if (name === 'home') homeView.classList.add('active');
    else if (name === 'poem') poemView.classList.add('active');
    else if (name === 'section') sectionView.classList.add('active');
    window.scrollTo(0, 0);
  }

  function showHome() {
    setView('home');
    currentPoemIndex = -1;
    updateActiveToc();
  }

  function showPoem(idx) {
    if (idx < 0 || idx >= allPoems.length) return;
    currentPoemIndex = idx;
    const poem = allPoems[idx];

    document.getElementById('poem-section').textContent = `${poem.sectionName} · ${poem.subsectionName}`;
    document.getElementById('poem-title').textContent = poem.title;
    document.getElementById('poem-position').textContent = `${idx + 1} / ${allPoems.length}`;

    // Back label
    document.getElementById('back-label').textContent = poem.subsectionName;

    // Body
    let bodyHtml = '';
    poem.text.forEach(stanza => {
      bodyHtml += '<div class="stanza">';
      stanza.forEach(line => {
        bodyHtml += `<div class="poem-line">${annotateText(line, poem.annotations)}</div>`;
      });
      bodyHtml += '</div>';
    });
    document.getElementById('poem-body').innerHTML = bodyHtml;

    // Notes
    const notesEl = document.getElementById('poem-notes');
    if (poem.notes) {
      notesEl.innerHTML = `<div class="poem-notes-title">题 解</div><p class="poem-notes-text">${escapeHtml(poem.notes)}</p>`;
    } else {
      notesEl.innerHTML = '';
    }

    // Nav
    const navEl = document.getElementById('poem-nav-bottom');
    let navHtml = '';
    if (idx > 0) {
      navHtml += `<div class="nav-link prev" data-nav="${idx - 1}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        <div><span class="nav-label">上一篇</span><span class="nav-title">${allPoems[idx-1].title}</span></div>
      </div>`;
    }
    if (idx < allPoems.length - 1) {
      navHtml += `<div class="nav-link next" data-nav="${idx + 1}">
        <div><span class="nav-label">下一篇</span><span class="nav-title">${allPoems[idx+1].title}</span></div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>`;
    }
    navEl.innerHTML = navHtml;
    navEl.querySelectorAll('.nav-link').forEach(el => {
      el.addEventListener('click', () => showPoem(parseInt(el.dataset.nav)));
    });

    setView('poem');
    updateActiveToc();

    // Open the correct TOC section
    const sectionIdx = SHIJING_DATA.sections.findIndex(s => s.name === poem.sectionName);
    if (sectionIdx >= 0) {
      const titleEl = tocEl.querySelector(`.toc-section-title[data-section="${sectionIdx}"]`);
      const contentEl = tocEl.querySelector(`[data-section-content="${sectionIdx}"]`);
      if (titleEl && contentEl) {
        tocEl.querySelectorAll('.toc-section-title').forEach(t => t.classList.remove('open'));
        tocEl.querySelectorAll('.toc-subsection').forEach(c => c.classList.remove('open'));
        titleEl.classList.add('open');
        contentEl.classList.add('open');
      }
    }
  }

  function showSection(si) {
    const section = SHIJING_DATA.sections[si];
    document.getElementById('section-title').textContent = section.name;

    const gridEl = document.getElementById('section-grid');
    let html = '';
    section.subsections.forEach(sub => {
      html += `<div class="section-sub">`;
      html += `<div class="section-sub-title">${sub.name}</div>`;
      html += `<div class="section-poems">`;
      sub.poems.forEach(poem => {
        const pIdx = allPoems.findIndex(p => p.title === poem.title && p.subsectionName === sub.name);
        html += `<div class="section-poem-link" data-poem="${pIdx}">${poem.title}</div>`;
      });
      html += `</div></div>`;
    });
    gridEl.innerHTML = html;

    gridEl.querySelectorAll('.section-poem-link').forEach(el => {
      el.addEventListener('click', () => showPoem(parseInt(el.dataset.poem)));
    });

    // Back button
    document.getElementById('section-back-btn').onclick = showHome;

    setView('section');
  }

  function updateActiveToc() {
    tocEl.querySelectorAll('.toc-poem').forEach(el => el.classList.remove('active'));
    if (currentPoemIndex >= 0) {
      const activeEl = tocEl.querySelector(`.toc-poem[data-poem="${currentPoemIndex}"]`);
      if (activeEl) {
        activeEl.classList.add('active');
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  // --- Search ---
  function initSearch() {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      tocEl.querySelectorAll('.toc-poem').forEach(el => {
        const idx = parseInt(el.dataset.poem);
        const poem = allPoems[idx];
        if (!q) {
          el.style.display = '';
          return;
        }
        const match = poem.title.toLowerCase().includes(q) ||
                      poem.sectionName.includes(q) ||
                      poem.subsectionName.includes(q) ||
                      poem.text.flat().some(line => line.includes(q));
        el.style.display = match ? '' : 'none';
      });

      // Auto open all sections when searching
      if (q) {
        tocEl.querySelectorAll('.toc-section-title').forEach(t => t.classList.add('open'));
        tocEl.querySelectorAll('.toc-subsection').forEach(c => c.classList.add('open'));
      }
    });
  }

  // --- Mobile sidebar ---
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // --- Keyboard navigation ---
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (currentView === 'poem') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentPoemIndex > 0) showPoem(currentPoemIndex - 1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentPoemIndex < allPoems.length - 1) showPoem(currentPoemIndex + 1);
        } else if (e.key === 'Escape') {
          showHome();
        }
      }
      // Cmd/Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        if (window.innerWidth < 769) openSidebar();
      }
    });
  }

  // --- Desktop theme toggle in sidebar ---
  function addDesktopThemeToggle() {
    if (window.innerWidth >= 769) {
      const header = document.querySelector('.sidebar-header');
      const btn = document.createElement('button');
      btn.className = 'theme-btn desktop-theme';
      btn.setAttribute('data-theme-toggle', '');
      btn.setAttribute('aria-label', '切换主题');
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      header.appendChild(btn);
    }
  }

  // --- Init ---
  function init() {
    buildPoemList();
    buildTOC();
    buildHome();
    addDesktopThemeToggle();
    initTheme();
    initSearch();
    initKeyboard();

    logoBtn.addEventListener('click', showHome);
    menuBtn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Back button in poem view
    document.getElementById('back-btn').addEventListener('click', () => {
      const poem = allPoems[currentPoemIndex];
      if (poem) {
        const si = SHIJING_DATA.sections.findIndex(s => s.name === poem.sectionName);
        if (si >= 0) showSection(si);
        else showHome();
      } else {
        showHome();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
