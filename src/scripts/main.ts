// @ts-nocheck
import AOS from 'aos';
import { createIcons } from 'lucide';
import 'aos/dist/aos.css';

const lucide = { createIcons };

const handleLogoError = () => {
  const img = document.getElementById('logo-img');
  const fallback = document.getElementById('logo-fallback');
  if (img) img.style.display = 'none';
  if (fallback) fallback.classList.remove('hidden');
};
globalThis.handleLogoError = handleLogoError;

const bootstrap = () => {
    document.getElementById('logo-img')?.addEventListener('error', handleLogoError, { once: true });
    // 優化動畫：取消個別過長的 delay，改由整組 fade-up 解決卡頓感
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 10
    });

    lucide.createIcons();

    // Secure every external destination, including future cards added in HTML.
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      link.rel = 'noopener noreferrer';
      link.referrerPolicy = 'no-referrer';
    });

    let drawerPreviousFocus = null;
    let panelPreviousFocus = null;
    let closeTimer = null;

    // 工具唯一資料來源：固定 ID、分類、內容與連結都在此維護。
    const toolDataElement = document.getElementById('tool-data');
    const toolCatalog = toolDataElement ? JSON.parse(toolDataElement.textContent || '[]') : [];


    const categories = [
      { id: 'explore', label: '探索', icon: 'compass' },
      { id: 'research', label: '研究', icon: 'book-open' },
      { id: 'strategy', label: '策略', icon: 'chart-no-axes-combined' },
      { id: 'risk', label: '風控', icon: 'shield-check' },
      { id: 'allocation', label: '配置', icon: 'pie-chart' }
    ];

    const toolById = new Map(toolCatalog.map(tool => [tool.id, tool]));
    const favoritesStorageKey = 'prstk-lab-favorites-v2';
    const pinsStorageKey = 'prstk-lab-pins-v2';
    const legacyFavoritesStorageKey = 'prstk-lab-favorites';
    const legacyPinsStorageKey = 'prstk-lab-pins';
    const recommendedToolIds = ['stockintelli', 'quantgems', 'solitude', 'twstock-pulse'];
    const readStoredSet = key => {
      try {
        const values = JSON.parse(localStorage.getItem(key) || '[]');
        return new Set(Array.isArray(values) ? values.filter(value => typeof value === 'string' && toolById.has(value)) : []);
      } catch { return new Set(); }
    };
    const saveStoredSet = (key, values) => {
      try { localStorage.setItem(key, JSON.stringify([...values])); }
      catch { /* Browsing remains fully usable when storage is unavailable. */ }
    };
    const migrateLegacySet = (storageKey, legacyKey) => {
      const current = readStoredSet(storageKey);
      if (current.size || localStorage.getItem(storageKey) !== null) return current;
      try {
        const legacyValues = JSON.parse(localStorage.getItem(legacyKey) || '[]');
        const migrated = new Set((Array.isArray(legacyValues) ? legacyValues : [])
          .map(index => toolCatalog[Number(index)]?.id)
          .filter(Boolean));
        saveStoredSet(storageKey, migrated);
        return migrated;
      } catch { return new Set(); }
    };

    const favorites = migrateLegacySet(favoritesStorageKey, legacyFavoritesStorageKey);
    const pins = migrateLegacySet(pinsStorageKey, legacyPinsStorageKey);
    let activeCategory = 'all';
    let favoritesOnly = false;
    const facetFilters = { pricing: '', status: '', requiresLogin: '', mobileSupport: '' };
    let panelOpen = false;
    let currentMatches = [];
    let homeRefreshTimer;
    const toolSearch = document.getElementById('tool-search');
    const favoritesFilter = document.getElementById('favorites-filter');
    const categoryFilters = document.getElementById('category-filters');
    const resultSummary = document.getElementById('tool-result-summary');
    const homeGrid = document.getElementById('home-card-grid');
    const homeTitle = document.getElementById('home-tools-title');
    const homeEmpty = document.getElementById('home-empty');
    const viewAllTools = document.getElementById('view-all-tools');
    const advancedFilterToggle = document.getElementById('advanced-filter-toggle');
    const advancedFilters = document.getElementById('advanced-filters');
    const filterReset = document.getElementById('filter-reset');
    const facetSelects = [...document.querySelectorAll('[data-facet]')];
    const primaryNav = document.getElementById('primary-nav');
    const toolPanel = document.getElementById('tool-panel');
    const toolPanelGrid = document.getElementById('tool-panel-grid');
    const toolPanelTitle = document.getElementById('tool-panel-title');
    const closeToolPanel = document.getElementById('close-tool-panel');
    const portalShell = document.getElementById('portal-shell');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const infoDrawer = document.getElementById('info-drawer');
    const categorySections = document.getElementById('category-sections');
    const toolCards = [];
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const statusLabels = {
      verified: '已驗證',
      'pending-verification': '待驗證',
      beta: 'Beta',
      'temporarily-unavailable': '暫時無法使用',
      'discontinued': '已停止服務'
    };
    const normalise = value => String(value || '').normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/\s+/g, '');
    const readUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      toolSearch.value = params.get('q') || '';
      activeCategory = params.get('category') || 'all';
      favoritesOnly = params.get('favorites') === '1';
      Object.keys(facetFilters).forEach(key => { facetFilters[key] = params.get(key) || ''; });
      facetSelects.forEach(select => { select.value = facetFilters[select.dataset.facet] || ''; });
      favoritesFilter.setAttribute('aria-pressed', String(favoritesOnly));
    };
    const syncUrlState = () => {
      const params = new URLSearchParams();
      if (toolSearch.value.trim()) params.set('q', toolSearch.value.trim());
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (favoritesOnly) params.set('favorites', '1');
      Object.entries(facetFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const query = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
      const hasFacet = Object.values(facetFilters).some(Boolean);
      filterReset.classList.toggle('hidden', !toolSearch.value.trim() && activeCategory === 'all' && !favoritesOnly && !hasFacet);
    };

    const trapFocus = (event, container) => {
      if (event.key !== 'Tab') return;
      const focusable = [...container.querySelectorAll(focusableSelector)]
        .filter(element => !element.hidden && element.getClientRects().length);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const makeFilterChip = (id, label, icon) => {
      const button = document.createElement('button');
      const iconElement = document.createElement('i');
      button.type = 'button';
      button.dataset.category = id;
      button.setAttribute('aria-pressed', id === 'all' ? 'true' : 'false');
      button.className = 'filter-chip inline-flex shrink-0 items-center gap-1.5 rounded-full border border-muji-border bg-white px-3 py-2 text-xs text-muji-brand transition hover:border-sage hover:text-muji-brand';
      iconElement.setAttribute('data-lucide', icon);
      iconElement.className = 'h-3.5 w-3.5';
      button.append(iconElement, document.createTextNode(label));
      return button;
    };

    categoryFilters.append(makeFilterChip('all', '全部', 'grid-2x2'));
    categories.forEach(category => categoryFilters.append(makeFilterChip(category.id, category.label, category.icon)));
    readUrlState();
    categoryFilters.querySelectorAll('button[data-category]').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.category === activeCategory)));

    const createToolCard = tool => {
      const template = document.getElementById('tool-card-template');
      if (!template) return null;
      const card = template.content.firstElementChild.cloneNode(true);
      const link = card.querySelector('[data-tool-link]');
      const title = card.querySelector('[data-tool-name]');
      const subtitle = card.querySelector('[data-tool-brand]');
      const status = card.querySelector('[data-tool-status]');
      link.href = tool.url;
      title.textContent = tool.name;
      subtitle.textContent = tool.brandName;
      status.textContent = statusLabels[tool.status] || '尚未驗證';
      status.dataset.status = tool.status || 'unknown';
      return card;
    };

    const setupToolCard = (card, tool, category, index) => {
      const toolId = tool.id;
      card.classList.add('tool-card');
      card.dataset.toolId = toolId;
      card.dataset.category = category.id;
      card.style.animationDelay = `${Math.min(index * 45, 180)}ms`;
      if (favorites.has(toolId)) card.classList.add('is-favorite');

      const detailButton = card.querySelector('[data-tool-action="info"]');
      const favoriteButton = card.querySelector('[data-tool-action="favorite"]');
      const pinButton = card.querySelector('[data-tool-action="pin"]');
      if (!detailButton || !favoriteButton || !pinButton) return;
      detailButton.dataset.toolId = toolId;
      detailButton.dataset.drawerTrigger = toolId;
      detailButton.setAttribute('aria-controls', 'info-drawer');
      detailButton.setAttribute('aria-expanded', 'false');
      detailButton.setAttribute('aria-label', `詳細資訊：${tool.brandName}`);
      detailButton.addEventListener('click', () => openDrawer(toolId));

      favoriteButton.setAttribute('aria-label', `加入最愛：${tool.brandName}`);
      favoriteButton.setAttribute('aria-pressed', String(favorites.has(toolId)));
      favoriteButton.addEventListener('click', () => {
        if (favorites.has(toolId)) favorites.delete(toolId);
        else favorites.add(toolId);
        saveStoredSet(favoritesStorageKey, favorites);
        favoriteButton.setAttribute('aria-pressed', String(favorites.has(toolId)));
        card.classList.toggle('is-favorite', favorites.has(toolId));
        applyFilters();
      });
      pinButton.setAttribute('aria-label', `釘選工具：${tool.brandName}`);
      pinButton.setAttribute('aria-pressed', String(pins.has(toolId)));
      pinButton.addEventListener('click', () => {
        if (pins.has(toolId)) {
          pins.delete(toolId);
        } else if (pins.size < 4) {
          pins.add(toolId);
        } else {
          resultSummary.textContent = '首頁最多釘選 4 個工具，請先取消一個圖釘。';
          return;
        }
        saveStoredSet(pinsStorageKey, pins);
        pinButton.setAttribute('aria-pressed', String(pins.has(toolId)));
        applyFilters();
      });
      toolCards.push({ card, section: null, tool, toolId });
    };

    const renderCatalogSections = () => {
      categorySections.replaceChildren();
      categories.forEach(category => {
        const section = document.createElement('section');
        const heading = document.createElement('h2');
        const icon = document.createElement('i');
        const grid = document.createElement('div');
        section.dataset.category = category.id;
        section.dataset.aos = 'fade-up';
        section.hidden = true;
        heading.className = 'text-[12px] font-semibold text-muji-section tracking-[0.1em] flex items-center gap-2 mb-3 pl-1';
        icon.setAttribute('data-lucide', category.icon);
        icon.className = 'w-3.5 h-3.5';
        heading.append(icon, document.createTextNode(category.label));
        grid.className = 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3';
        toolCatalog
          .filter(tool => tool.categories.includes(category.id))
          .forEach((tool, index) => {
            const card = createToolCard(tool);
            if (!card) return;
            grid.appendChild(card);
            setupToolCard(card, tool, category, index);
          });
        section.append(heading, grid);
        categorySections.appendChild(section);
      });
      lucide.createIcons();
      AOS.refresh?.();
    };

    renderCatalogSections();

    const getMatches = () => {
      const query = normalise(toolSearch.value);
      const matches = toolCards.filter(({ card, tool, toolId }) => {
        const searchableText = [
          tool.name,
          tool.brandName,
          tool.summary,
          tool.description,
          ...tool.features,
          ...tool.useCases,
          ...tool.targetUsers,
          ...tool.tags,
          ...tool.aliases
        ].map(normalise).join(' ');
        const facetsMatch = Object.entries(facetFilters).every(([key, value]) => !value || String(tool[key] || 'unknown') === value);
        return (!query || searchableText.includes(query))
          && (activeCategory === 'all' || card.dataset.category === activeCategory)
          && (!favoritesOnly || favorites.has(toolId))
          && facetsMatch;
      });
      if (!query) return matches;
      return matches.sort((left, right) => {
        const score = entry => {
          const text = normalise([entry.tool.name, entry.tool.brandName, entry.tool.summary, entry.tool.tags, entry.tool.aliases].flat().join(' '));
          return (text.startsWith(query) ? 4 : 0) + (normalise(entry.tool.name).includes(query) ? 3 : 0) + (text.includes(query) ? 1 : 0);
        };
        return score(right) - score(left);
      });
    };

    const moveCardsTo = (entries, target) => {
      target.replaceChildren();
      toolCards.forEach(({ card }) => { card.hidden = true; });
      entries.forEach(({ card }) => {
        card.hidden = false;
        target.appendChild(card);
      });
    };

    const renderHome = entries => {
      const isDefaultView = !toolSearch.value.trim() && activeCategory === 'all' && !favoritesOnly;
      const showHomeActions = activeCategory !== 'all';
      const pinnedEntries = toolCards.filter(({ toolId }) => pins.has(toolId));
      const recommendedEntries = recommendedToolIds.map(id => toolCards.find(({ toolId }) => toolId === id)).filter(Boolean);
      const displayEntries = isDefaultView && pinnedEntries.length
        ? [...pinnedEntries, ...recommendedEntries.filter(({ toolId }) => !pins.has(toolId))]
        : (isDefaultView ? recommendedEntries : entries);
      const title = isDefaultView ? (pinnedEntries.length ? '我的首頁' : '為你精選') : '搜尋結果';

      homeTitle.textContent = title;
      homeEmpty.classList.toggle('hidden', displayEntries.length > 0);
      homeEmpty.classList.toggle('flex', displayEntries.length === 0);
      if (!displayEntries.length) {
        homeEmpty.textContent = favoritesOnly ? '尚未收藏工具，請點擊卡片上的愛心。' : '沒有符合的工具，請嘗試其他關鍵字或分類。';
      }
      moveCardsTo(displayEntries.slice(0, 4), homeGrid);
      homeGrid.classList.toggle('show-actions', showHomeActions);
      resultSummary.textContent = isDefaultView
        ? (pinnedEntries.length ? `已釘選 ${pinnedEntries.length} / 4 個工具` : '預設推薦 4 個工具，可用圖釘自訂首頁')
        : (entries.length ? `找到 ${entries.length} 個工具，顯示前 4 個` : '沒有符合的工具');
      viewAllTools.classList.toggle('hidden', entries.length <= 4);
    };

    const renderPanel = entries => {
      toolPanelTitle.textContent = `全部工具 · ${entries.length}`;
      moveCardsTo(entries, toolPanelGrid);
    };

    const animateHomeUpdate = () => {
      homeGrid.classList.remove('is-updating');
      void homeGrid.offsetWidth;
      homeGrid.classList.add('is-updating');
      clearTimeout(homeRefreshTimer);
      homeRefreshTimer = setTimeout(() => homeGrid.classList.remove('is-updating'), 260);
    };

    function applyFilters() {
      currentMatches = getMatches();
      if (panelOpen) renderPanel(currentMatches);
      else {
        renderHome(currentMatches);
        animateHomeUpdate();
      }
    }

    const setCategory = categoryId => {
      activeCategory = categoryId;
      categoryFilters.querySelectorAll('button[data-category]').forEach(chip => {
        chip.setAttribute('aria-pressed', String(chip.dataset.category === categoryId));
      });
      applyFilters();
      syncUrlState();
    };

    categoryFilters.addEventListener('click', event => {
      const button = event.target.closest('button[data-category]');
      if (!button) return;
      setCategory(button.dataset.category);
    });
    document.querySelectorAll('[data-scenario-category]').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        toolSearch.value = '';
        favoritesOnly = false;
        favoritesFilter.setAttribute('aria-pressed', 'false');
        document.querySelectorAll('[data-scenario-category]').forEach(entry => {
          entry.setAttribute('aria-pressed', String(entry === button));
        });
        setCategory(button.dataset.scenarioCategory);
      });
    });
    toolSearch.addEventListener('input', () => { applyFilters(); syncUrlState(); });
    favoritesFilter.addEventListener('click', () => {
      favoritesOnly = !favoritesOnly;
      favoritesFilter.setAttribute('aria-pressed', String(favoritesOnly));
      applyFilters();
      syncUrlState();
    });
    primaryNav?.addEventListener('click', event => {
      const item = event.target.closest('[data-primary-nav]');
      if (!item || item.tagName === 'A') return;
      const action = item.dataset.navAction;
      const category = item.dataset.navCategory;
      if (item.dataset.primaryNav === 'tools') {
        viewAllTools.click();
        return;
      }
      if (category) {
        toolSearch.value = '';
        favoritesOnly = false;
        favoritesFilter.setAttribute('aria-pressed', 'false');
        setCategory(category);
        document.getElementById('tool-search-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (action === 'favorites') {
        favoritesOnly = true;
        favoritesFilter.setAttribute('aria-pressed', 'true');
        setCategory('all');
        document.getElementById('home-tools')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (action === 'catalog') {
        favoritesOnly = false;
        favoritesFilter.setAttribute('aria-pressed', 'false');
        setCategory('all');
        viewAllTools.click();
      }
    });
    advancedFilterToggle?.addEventListener('click', () => {
      const expanded = advancedFilters.hidden;
      advancedFilters.hidden = !expanded;
      advancedFilterToggle.setAttribute('aria-expanded', String(expanded));
      advancedFilterToggle.classList.toggle('bg-muji-brand/5', expanded);
    });
    facetSelects.forEach(select => select.addEventListener('change', () => {
      facetFilters[select.dataset.facet] = select.value;
      applyFilters();
      syncUrlState();
    }));
    filterReset?.addEventListener('click', () => {
      toolSearch.value = '';
      activeCategory = 'all';
      favoritesOnly = false;
      Object.keys(facetFilters).forEach(key => { facetFilters[key] = ''; });
      facetSelects.forEach(select => { select.value = ''; });
      favoritesFilter.setAttribute('aria-pressed', 'false');
      categoryFilters.querySelectorAll('button[data-category]').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.category === 'all')));
      applyFilters();
      syncUrlState();
    });
    viewAllTools.addEventListener('click', () => {
      panelPreviousFocus = document.activeElement;
      panelOpen = true;
      toolPanel.classList.remove('hidden');
      toolPanel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('tool-panel-open');
      portalShell.inert = true;
      renderPanel(currentMatches);
      closeToolPanel.focus();
    });
    const closePanel = () => {
      panelOpen = false;
      toolPanel.classList.add('hidden');
      toolPanel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tool-panel-open');
      portalShell.inert = false;
      applyFilters();
      panelPreviousFocus?.focus?.();
    };
    closeToolPanel.addEventListener('click', closePanel);
    applyFilters();
    syncUrlState();
    lucide.createIcons();

    function renderList(list, items, markerClass) {
      list.replaceChildren();
      items.forEach(item => {
        const li = document.createElement('li');
        const marker = document.createElement('span');
        const text = document.createElement('span');
        li.className = 'flex items-start gap-3 relative';
        marker.className = `mt-2.5 w-1.5 h-1.5 rounded-full ${markerClass} flex-shrink-0`;
        text.className = 'flex-1';
        text.textContent = item;
        li.append(marker, text);
        list.appendChild(li);
      });
    }

    function openDrawer(toolId) {
      const data = toolById.get(toolId);
      if (!data) return;
      clearTimeout(closeTimer);
      drawerPreviousFocus = document.activeElement;
      
      document.getElementById('drawer-title').innerText = data.name;
      document.getElementById('drawer-subtitle').innerText = data.brandName;
      document.getElementById('drawer-link').href = data.url;

      const featuresUl = document.getElementById('drawer-features');
      renderList(featuresUl, data.features, 'bg-muji-brand/60');

      const targetsUl = document.getElementById('drawer-targets');
      renderList(targetsUl, data.targetUsers, 'bg-muji-accent/60');

      document.querySelectorAll('[data-drawer-trigger]').forEach(button => {
        button.setAttribute('aria-expanded', 'false');
      });
      const trigger = document.querySelector(`[data-drawer-trigger="${toolId}"]`);
      trigger?.setAttribute('aria-expanded', 'true');
      drawerOverlay.classList.remove('hidden');
      drawerOverlay.setAttribute('aria-hidden', 'false');
      infoDrawer.setAttribute('aria-hidden', 'false');
      if (panelOpen) toolPanel.inert = true;
      else portalShell.inert = true;
      setTimeout(() => {
        drawerOverlay.classList.add('opacity-100');
        infoDrawer.classList.remove('translate-y-full');
        infoDrawer.querySelector('[data-drawer-close]')?.focus();
      }, 10);
    }

    function closeDrawer() {
      drawerOverlay.classList.remove('opacity-100');
      infoDrawer.classList.add('translate-y-full');
      drawerOverlay.setAttribute('aria-hidden', 'true');
      infoDrawer.setAttribute('aria-hidden', 'true');
      if (panelOpen) toolPanel.inert = false;
      else portalShell.inert = false;
      document.querySelectorAll('[data-drawer-trigger]').forEach(button => button.setAttribute('aria-expanded', 'false'));
      
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        drawerOverlay.classList.add('hidden');
        drawerPreviousFocus?.focus?.();
      }, 400); // 對應 css 動畫的 0.4s
    }

    drawerOverlay.addEventListener('click', closeDrawer);
    document.querySelectorAll('[data-drawer-close]').forEach(button => {
      button.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', event => {
      const drawerOpen = !infoDrawer.classList.contains('translate-y-full');
      if (drawerOpen) {
        if (event.key === 'Escape') closeDrawer();
        else trapFocus(event, infoDrawer);
        return;
      }
      if (panelOpen) {
        if (event.key === 'Escape') closePanel();
        else trapFocus(event, toolPanel);
      }
    });

};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
