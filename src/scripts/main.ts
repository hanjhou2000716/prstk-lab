import AOS from 'aos';
import { createIcons, icons } from 'lucide';
import 'aos/dist/aos.css';
import type { Tool, ToolCategory } from '../types/tool';

const lucide = {
  createIcons,
  icons,
};

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

    lucide.createIcons({ icons: lucide.icons });

    // Secure every external destination, including future cards added in HTML.
    document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]').forEach(link => {
      link.rel = 'noopener noreferrer';
      link.referrerPolicy = 'no-referrer';
    });

    let drawerPreviousFocus: HTMLElement | null = null;
    let panelPreviousFocus: HTMLElement | null = null;
    let closeTimer: number | undefined;

    // 工具唯一資料來源：固定 ID、分類、內容與連結都在此維護。
    const toolDataElement = document.getElementById('tool-data');
    const toolCatalog: Tool[] = toolDataElement ? JSON.parse(toolDataElement.textContent || '[]') : [];


    const categories: Array<{ id: ToolCategory; label: string; icon: string }> = [
      { id: 'explore', label: '探索', icon: 'compass' },
      { id: 'research', label: '研究', icon: 'book-open' },
      { id: 'strategy', label: '策略', icon: 'chart-no-axes-combined' },
      { id: 'risk', label: '風控', icon: 'shield-check' },
      { id: 'allocation', label: '配置', icon: 'pie-chart' }
    ];

    const toolById = new Map<string, Tool>(toolCatalog.map(tool => [tool.id, tool]));
    const favoritesStorageKey = 'prstk-lab-favorites-v2';
    const pinsStorageKey = 'prstk-lab-pins-v2';
    const legacyFavoritesStorageKey = 'prstk-lab-favorites';
    const legacyPinsStorageKey = 'prstk-lab-pins';
    const recentToolsStorageKey = 'prstk-lab-recent-tools-v1';
    const scenarioTasks: Record<string, string> = {
      'find-opportunities': '正在找投資機會',
      'research-security': '正在研究個股',
      'check-risk': '正在檢查風險',
      'plan-assets': '正在規劃長期資產'
    };
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
    const readRecentTools = () => {
      try {
        const values = JSON.parse(localStorage.getItem(recentToolsStorageKey) || '[]');
        return Array.isArray(values) ? values.filter(value => typeof value === 'string' && toolById.has(value)).slice(0, 6) : [];
      } catch { return []; }
    };
    let recentTools = readRecentTools();
    let activeCategory = 'all';
    let activeScenario = '';
    let favoritesOnly = false;
    let panelOpen = false;
    let currentMatches: ToolCardEntry[] = [];
    let homeRefreshTimer: number | undefined;
    const toolSearch = document.getElementById('tool-search') as HTMLInputElement;
    const favoritesFilter = document.getElementById('favorites-filter') as HTMLButtonElement;
    const categoryFilters = document.getElementById('category-filters') as HTMLElement;
    const resultSummary = document.getElementById('tool-result-summary') as HTMLElement;
    const homeGrid = document.getElementById('home-card-grid') as HTMLElement;
    const homeTitle = document.getElementById('home-tools-title') as HTMLElement;
    const homeRecommendationNote = document.getElementById('home-recommendation-note') as HTMLElement;
    const offlineNotice = document.getElementById('offline-notice') as HTMLElement;
    const homeEmpty = document.getElementById('home-empty') as HTMLElement;
    const viewAllTools = document.getElementById('view-all-tools') as HTMLButtonElement;
    const toolPanel = document.getElementById('tool-panel') as HTMLElement;
    const toolPanelGrid = document.getElementById('tool-panel-grid') as HTMLElement;
    const toolPanelTitle = document.getElementById('tool-panel-title') as HTMLElement;
    const closeToolPanel = document.getElementById('close-tool-panel') as HTMLButtonElement;
    const portalShell = document.getElementById('portal-shell') as HTMLElement;
    const drawerOverlay = document.getElementById('drawer-overlay') as HTMLElement;
    const infoDrawer = document.getElementById('info-drawer') as HTMLElement;
    const categorySections = document.getElementById('category-sections') as HTMLElement;
    type ToolCardEntry = { card: HTMLElement; section: HTMLElement | null; tool: Tool; toolId: string };
    const toolCards: ToolCardEntry[] = [];
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const normalise = (value: unknown) => String(value || '').normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/\s+/g, '');
    const readUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      toolSearch.value = params.get('q') || '';
      activeCategory = params.get('category') || 'all';
      activeScenario = params.get('task') || '';
      favoritesOnly = params.get('favorites') === '1';
      favoritesFilter.setAttribute('aria-pressed', String(favoritesOnly));
    };
    const syncUrlState = () => {
      const params = new URLSearchParams();
      if (toolSearch.value.trim()) params.set('q', toolSearch.value.trim());
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (activeScenario) params.set('task', activeScenario);
      if (favoritesOnly) params.set('favorites', '1');
      const query = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
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
      categoryFilters.querySelectorAll<HTMLButtonElement>('button[data-category]').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.category === activeCategory)));

    const createToolCard = (tool: Tool) => {
      const template = document.getElementById('tool-card-template') as HTMLTemplateElement | null;
      if (!template) return null;
      const card = template.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
      if (!card) return null;
      const link = card.querySelector<HTMLAnchorElement>('[data-tool-link]');
      const title = card.querySelector('[data-tool-name]');
      const subtitle = card.querySelector('[data-tool-brand]');
      if (!link) return null;
      link.href = tool.url;
      title.textContent = tool.name;
      subtitle.textContent = tool.brandName;
      link.addEventListener('click', () => recordRecentTool(tool.id));
      return card;
    };

    const saveRecentTools = () => {
      try { localStorage.setItem(recentToolsStorageKey, JSON.stringify(recentTools)); } catch { /* Local browsing remains available. */ }
    };
    const recordRecentTool = (toolId: string) => {
      recentTools = [toolId, ...recentTools.filter(id => id !== toolId)].slice(0, 6);
      saveRecentTools();
    };

    const setupToolCard = (card: HTMLElement, tool: Tool, category: { id: ToolCategory }, index: number) => {
      const toolId = tool.id;
      card.classList.add('tool-card');
      card.dataset.toolId = toolId;
      card.dataset.category = category.id;
      card.style.animationDelay = `${Math.min(index * 40, 120)}ms`;
      if (favorites.has(toolId)) card.classList.add('is-favorite');

      const badge = card.querySelector<HTMLElement>('[data-tool-badge]');
      if (badge) {
        const badgeLabel = tool.status === 'verified' ? '已驗證' : (tool.featured ? 'PRStK' : (tool.status === 'beta' ? 'Beta' : ''));
        badge.textContent = badgeLabel;
        badge.hidden = !badgeLabel;
      }

      const detailButton = card.querySelector<HTMLElement>('[data-tool-action="info"]');
      const favoriteButton = card.querySelector<HTMLElement>('[data-tool-action="favorite"]');
      const pinButton = card.querySelector<HTMLElement>('[data-tool-action="pin"]');
      if (!detailButton || !favoriteButton || !pinButton) return;
      detailButton.dataset.toolId = toolId;
      detailButton.dataset.drawerTrigger = toolId;
      detailButton.setAttribute('aria-controls', 'info-drawer');
      detailButton.setAttribute('aria-expanded', 'false');
      detailButton.setAttribute('aria-label', `詳細資訊：${tool.brandName}`);
      const showDetails = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        openDrawer(toolId);
      };
      detailButton.addEventListener('click', showDetails);

      favoriteButton.setAttribute('aria-label', `加入最愛：${tool.brandName}`);
      favoriteButton.setAttribute('aria-pressed', String(favorites.has(toolId)));
      favoriteButton.addEventListener('click', () => {
        if (favorites.has(toolId)) favorites.delete(toolId);
        else favorites.add(toolId);
        saveStoredSet(favoritesStorageKey, favorites);
        favoriteButton.setAttribute('aria-pressed', String(favorites.has(toolId)));
        card.classList.toggle('is-favorite', favorites.has(toolId));
        globalThis.prstkAnalytics?.track('favorite_toggled', { toolId });
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
        globalThis.prstkAnalytics?.track('pin_toggled', { toolId });
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
      lucide.createIcons({ icons: lucide.icons });
      AOS.refresh?.();
    };

    renderCatalogSections();

    const scoreSearchEntry = (entry: ToolCardEntry, query: string) => {
      const tool = entry.tool;
      const name = normalise(tool.name);
      const brand = normalise(tool.brandName);
      const aliases = (tool.aliases || []).map(normalise);
      const tags = (tool.tags || []).map(normalise);
      const summary = normalise(tool.summary);
      const description = normalise(tool.description);
      let score = 0;
      if (name === query) score += 10;
      if (brand === query) score += 9;
      if (aliases.some(value => value === query)) score += 8;
      if (name.includes(query)) score += 6;
      if (brand.includes(query)) score += 6;
      if (aliases.some(value => value.includes(query))) score += 4;
      if (tags.some(value => value === query)) score += 5;
      if (tags.some(value => value.includes(query))) score += 3;
      if (summary.includes(query)) score += 2;
      if (description.includes(query)) score += 1;
      return score;
    };

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
        return (!query || searchableText.includes(query))
          && (activeCategory === 'all' || card.dataset.category === activeCategory)
          && (!favoritesOnly || favorites.has(toolId));
      });
      if (!query) return matches;
      return matches.sort((left, right) => {
        return scoreSearchEntry(right, query) - scoreSearchEntry(left, query)
          || left.tool.name.localeCompare(right.tool.name, 'zh-TW');
      });
    };

    const moveCardsTo = (entries: ToolCardEntry[], target: HTMLElement) => {
      target.replaceChildren();
      toolCards.forEach(({ card }) => { card.hidden = true; });
      entries.forEach(({ card }) => {
        card.hidden = false;
        target.appendChild(card);
      });
    };

    const getRecommendedEntries = () => {
      const recentCategories = new Set(recentTools.map(id => toolById.get(id)?.categories || []).flat());
      return [...toolCards]
        .map(entry => ({
          entry,
          score: (entry.tool.featured ? 3 : 0)
            + (favorites.has(entry.toolId) ? 2 : 0)
            + (recentCategories.has(entry.tool.categories?.[0]) ? 2 : 0)
            + (entry.tool.status === 'verified' ? 2 : 0)
            - (pins.has(entry.toolId) ? 1 : 0)
        }))
        .sort((left, right) => right.score - left.score || left.entry.tool.name.localeCompare(right.entry.tool.name, 'zh-TW'))
        .map(({ entry }) => entry)
        .slice(0, 4);
    };

    const getRecommendationContext = (matchCount: number) => {
      const query = toolSearch.value.trim();
      if (query) return { title: '搜尋結果', note: `${matchCount} 個結果` };

      if (activeScenario) {
        const scenarioTitle = scenarioTasks[activeScenario] || '研究工具';
        return { title: scenarioTitle, note: `${Math.min(matchCount, 4)} 個適合工具` };
      }

      if (activeCategory !== 'all') {
        const category = categories.find(entry => entry.id === activeCategory);
        return { title: `${category?.label || '分類'}工具`, note: `${matchCount} 個工具` };
      }

      if (pins.size) return { title: '為你整理', note: '你的釘選' };
      if (recentTools.length) return { title: '為你整理', note: '依最近使用' };
      return { title: '為你整理', note: 'PRStK 精選' };
    };

    const renderHome = (entries: ToolCardEntry[]) => {
      const isDefaultView = !toolSearch.value.trim() && activeCategory === 'all' && !favoritesOnly;
      const showHomeActions = activeCategory !== 'all';
      const pinnedEntries = toolCards.filter(({ toolId }) => pins.has(toolId));
      const recommendedEntries = getRecommendedEntries();
      const displayEntries = isDefaultView && pinnedEntries.length
        ? [...pinnedEntries, ...recommendedEntries.filter(({ toolId }) => !pins.has(toolId))]
        : (isDefaultView ? recommendedEntries : entries);
      const recommendationContext = getRecommendationContext(isDefaultView ? displayEntries.length : entries.length);

      homeTitle.textContent = recommendationContext.title;
      homeRecommendationNote.textContent = recommendationContext.note;
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

    const renderPanel = (entries: ToolCardEntry[]) => {
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

    const setCategory = (categoryId: ToolCategory | 'all') => {
      activeCategory = categoryId;
      categoryFilters.querySelectorAll<HTMLButtonElement>('button[data-category]').forEach(chip => {
        chip.setAttribute('aria-pressed', String(chip.dataset.category === categoryId));
      });
      applyFilters();
      syncUrlState();
    };

    categoryFilters.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-category]');
      if (!button) return;
      activeScenario = '';
      setCategory((button.dataset.category || 'all') as ToolCategory | 'all');
    });
    document.querySelectorAll<HTMLButtonElement>('[data-scenario-category]').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        toolSearch.value = '';
        activeScenario = button.dataset.scenarioTask || '';
        favoritesOnly = false;
        favoritesFilter.setAttribute('aria-pressed', 'false');
        document.querySelectorAll('[data-scenario-category]').forEach(entry => {
          entry.setAttribute('aria-pressed', String(entry === button));
        });
        setCategory((button.dataset.scenarioCategory || 'all') as ToolCategory);
      });
    });
    toolSearch.addEventListener('input', () => { activeScenario = ''; applyFilters(); syncUrlState(); });
    favoritesFilter.addEventListener('click', () => {
      favoritesOnly = !favoritesOnly;
      favoritesFilter.setAttribute('aria-pressed', String(favoritesOnly));
      applyFilters();
      syncUrlState();
    });
    viewAllTools.addEventListener('click', () => {
      panelPreviousFocus = document.activeElement as HTMLElement | null;
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
    const updateOfflineNotice = () => { offlineNotice.hidden = navigator.onLine; };
    window.addEventListener('online', updateOfflineNotice);
    window.addEventListener('offline', updateOfflineNotice);
    applyFilters();
    updateOfflineNotice();
    syncUrlState();
    lucide.createIcons({ icons: lucide.icons });

    function renderList(list: HTMLElement, items: string[], markerClass: string) {
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

    function openDrawer(toolId: string) {
      // Cards can be moved between views and older cached markup may carry a
      // slug rather than the canonical id. Resolve both forms so the detail
      // drawer never silently bails out when a card is re-parented.
      const resolvedToolId = String(toolId || '');
      const data = toolById.get(resolvedToolId)
        || toolCatalog.find(tool => tool.id === resolvedToolId || tool.slug === resolvedToolId);
      if (!data) return;
      globalThis.prstkAnalytics?.track('tool_opened', { toolId });
      clearTimeout(closeTimer);
      drawerPreviousFocus = document.activeElement as HTMLElement | null;
      
      (document.getElementById('drawer-title') as HTMLElement).innerText = data.name;
      (document.getElementById('drawer-subtitle') as HTMLElement).innerText = data.brandName;
      (document.getElementById('drawer-link') as HTMLAnchorElement).href = data.url;
      (document.getElementById('drawer-report') as HTMLAnchorElement).href = `https://github.com/hanjhou2000716/prstk-lab/issues/new?template=report-tool.yml&title=${encodeURIComponent(`[工具回報] ${data.brandName}`)}&labels=tool-report`;

      const featuresUl = document.getElementById('drawer-features');
      renderList(featuresUl, data.features, 'bg-muji-brand/60');

      const targetsUl = document.getElementById('drawer-targets');
      renderList(targetsUl, data.targetUsers, 'bg-muji-accent/60');

      document.querySelectorAll('[data-drawer-trigger]').forEach(button => {
        button.setAttribute('aria-expanded', 'false');
      });
      const trigger = document.querySelector(`[data-drawer-trigger="${data.id}"]`);
      trigger?.setAttribute('aria-expanded', 'true');
      drawerOverlay.classList.remove('hidden');
      drawerOverlay.setAttribute('aria-hidden', 'false');
      infoDrawer.setAttribute('aria-hidden', 'false');
      if (panelOpen) toolPanel.inert = true;
      else portalShell.inert = true;
      setTimeout(() => {
        drawerOverlay.classList.add('opacity-100');
        infoDrawer.classList.remove('translate-y-full');
        (infoDrawer.querySelector('[data-drawer-close]') as HTMLElement | null)?.focus();
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
      }, 320); // 對應 css 動畫的 0.32s
    }

    drawerOverlay.addEventListener('click', closeDrawer);
    // Tool cards are moved between the home grid and the catalog panel at runtime.
    // Delegate the info action from the document so the details trigger remains
    // reliable after cards are re-parented or re-rendered.
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      const trigger = target?.closest('[data-tool-action="info"]');
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
      openDrawer((trigger as HTMLElement).dataset.toolId || '');
    });
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
        return;
      }
    });

};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}

const loadPrivacyAnalytics = () => import('./privacy-analytics').catch(() => undefined);
if ('requestIdleCallback' in window) window.requestIdleCallback(loadPrivacyAnalytics, { timeout: 2500 });
else globalThis.setTimeout(loadPrivacyAnalytics, 1200);
