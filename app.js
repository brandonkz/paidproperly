/**
 * PaidProperly - Main Application JavaScript
 */

// State
let platforms = [];
let filteredPlatforms = [];
let preferences = loadPreferences();
let activeQuickFilter = 'all';
let selectedDifficulties = ['Easy', 'Medium', 'Hard'];
let selectedCategories = [];
let selectedBestFor = [];

// DOM Elements
const searchInput = document.getElementById('search-input');
const resultsCount = document.getElementById('results-count');
const popularGrid = document.getElementById('popular-grid');
const platformsList = document.getElementById('platforms-list');
const quickPills = document.querySelectorAll('.pill');
const saFriendlyToggle = document.getElementById('sa-friendly-toggle');
const resetFiltersBtn = document.getElementById('reset-filters');
const categoryFiltersContainer = document.getElementById('category-filters');
const bestForFiltersContainer = document.getElementById('bestfor-filters');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    await loadPlatforms();
    updateHeroStats();
    populateFilters();
    setupEventListeners();
    applyFilters();
  } catch (error) {
    console.error('Failed to initialize:', error);
    showError('Failed to load platforms. Please refresh the page.');
  }
}

function updateHeroStats() {
  const totalEl = document.getElementById('total-platforms');
  const entryEl = document.getElementById('entry-level-count');
  
  if (totalEl) totalEl.textContent = platforms.length;
  if (entryEl) entryEl.textContent = platforms.filter(p => p.difficulty === 'Easy').length;
}

// Data Loading
async function loadPlatforms() {
  try {
    const response = await fetch('data/platforms.json');
    if (response.ok) {
      platforms = await response.json();
    } else {
      throw new Error('Fetch failed');
    }
  } catch (e) {
    console.error('Could not load platforms:', e);
    platforms = [];
  }
  platforms.sort((a, b) => a.recommended_rank - b.recommended_rank);
}

// Preferences
function loadPreferences() {
  try {
    const saved = localStorage.getItem('paidproperly_preferences');
    return saved ? JSON.parse(saved) : { liked: [], noped: [] };
  } catch (e) {
    return { liked: [], noped: [] };
  }
}

function savePreferences() {
  try {
    localStorage.setItem('paidproperly_preferences', JSON.stringify(preferences));
  } catch (e) {
    console.warn('Could not save preferences:', e);
  }
}

function toggleSave(slug) {
  const index = preferences.liked.indexOf(slug);
  if (index > -1) {
    preferences.liked.splice(index, 1);
  } else {
    preferences.liked.push(slug);
  }
  savePreferences();
  applyFilters();
}

// Populate Filters
function populateFilters() {
  // Categories
  const categories = [...new Set(platforms.map(p => p.category))].sort();
  categoryFiltersContainer.innerHTML = categories.map(cat => `
    <label class="filter-checkbox">
      <input type="checkbox" value="${escapeHtml(cat)}" class="category-check">
      <span class="checkmark"></span>
      <span>${escapeHtml(cat)}</span>
    </label>
  `).join('');
  
  // Best For
  const bestForSet = new Set();
  platforms.forEach(p => p.best_for.forEach(bf => bestForSet.add(bf)));
  const bestForOptions = [...bestForSet].sort();
  bestForFiltersContainer.innerHTML = bestForOptions.map(bf => `
    <label class="filter-checkbox">
      <input type="checkbox" value="${escapeHtml(bf)}" class="bestfor-check">
      <span class="checkmark"></span>
      <span>${escapeHtml(bf)}</span>
    </label>
  `).join('');
  
  // Update counts
  updateFilterCounts();
}

function updateFilterCounts() {
  const easyCnt = platforms.filter(p => p.difficulty === 'Easy').length;
  const medCnt = platforms.filter(p => p.difficulty === 'Medium').length;
  const hardCnt = platforms.filter(p => p.difficulty === 'Hard').length;
  
  document.querySelector('[data-difficulty="Easy"]').textContent = easyCnt;
  document.querySelector('[data-difficulty="Medium"]').textContent = medCnt;
  document.querySelector('[data-difficulty="Hard"]').textContent = hardCnt;
}

// Event Listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', debounce(applyFilters, 200));
  
  // Quick pills
  quickPills.forEach(pill => {
    pill.addEventListener('click', () => {
      quickPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeQuickFilter = pill.dataset.filter;
      applyFilters();
    });
  });
  
  // Difficulty checkboxes
  document.querySelectorAll('.difficulty-check').forEach(cb => {
    cb.addEventListener('change', () => {
      selectedDifficulties = [...document.querySelectorAll('.difficulty-check:checked')].map(c => c.value);
      applyFilters();
    });
  });
  
  // Category checkboxes
  categoryFiltersContainer.addEventListener('change', () => {
    selectedCategories = [...document.querySelectorAll('.category-check:checked')].map(c => c.value);
    applyFilters();
  });
  
  // Best For checkboxes
  bestForFiltersContainer.addEventListener('change', () => {
    selectedBestFor = [...document.querySelectorAll('.bestfor-check:checked')].map(c => c.value);
    applyFilters();
  });
  
  // SA Friendly toggle
  saFriendlyToggle.addEventListener('change', applyFilters);
  
  // Reset filters
  resetFiltersBtn.addEventListener('click', resetFilters);
  
  // Save buttons (delegated)
  document.addEventListener('click', (e) => {
    const saveBtn = e.target.closest('.save-btn');
    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggleSave(saveBtn.dataset.slug);
    }
  });
}

function resetFilters() {
  searchInput.value = '';
  selectedDifficulties = ['Easy', 'Medium', 'Hard'];
  selectedCategories = [];
  selectedBestFor = [];
  activeQuickFilter = 'all';
  
  document.querySelectorAll('.difficulty-check').forEach(cb => cb.checked = true);
  document.querySelectorAll('.category-check').forEach(cb => cb.checked = false);
  document.querySelectorAll('.bestfor-check').forEach(cb => cb.checked = false);
  saFriendlyToggle.checked = true;
  
  quickPills.forEach(p => p.classList.remove('active'));
  document.querySelector('[data-filter="all"]').classList.add('active');
  
  applyFilters();
}

// Filtering
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const saFriendlyOnly = saFriendlyToggle.checked;
  
  filteredPlatforms = platforms.filter(p => {
    // Quick filter
    if (activeQuickFilter === 'entry' && p.difficulty !== 'Easy') return false;
    if (activeQuickFilter === 'non-tech') {
      const isOnlyTech = p.best_for.length === 1 && p.best_for[0] === 'Dev';
      if (isOnlyTech) return false;
    }
    if (activeQuickFilter === 'tech' && !p.best_for.includes('Dev')) return false;
    if (activeQuickFilter === 'competitive' && p.difficulty !== 'Hard') return false;
    
    // Difficulty
    if (!selectedDifficulties.includes(p.difficulty)) return false;
    
    // Category
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    
    // Best For
    if (selectedBestFor.length > 0 && !p.best_for.some(bf => selectedBestFor.includes(bf))) return false;
    
    // SA Friendly
    if (saFriendlyOnly && !p.sa_friendly) return false;
    
    // Search
    if (searchTerm) {
      const searchable = [p.name, p.description, p.category, ...p.tags, ...p.best_for].join(' ').toLowerCase();
      if (!searchable.includes(searchTerm)) return false;
    }
    
    return true;
  });
  
  render();
}

// Rendering
function render() {
  resultsCount.textContent = `${filteredPlatforms.length} platforms`;
  renderPopular();
  renderPlatformsList();
}

function renderPopular() {
  const popular = filteredPlatforms.slice(0, 4);
  
  if (popular.length === 0) {
    popularGrid.innerHTML = '';
    return;
  }
  
  popularGrid.innerHTML = popular.map(p => {
    const isSaved = preferences.liked.includes(p.slug);
    const initial = p.name.charAt(0).toUpperCase();
    const diffClass = p.difficulty.toLowerCase();
    
    return `
      <a href="platform.html?slug=${p.slug}" class="popular-card">
        <button class="save-btn popular-card-bookmark ${isSaved ? 'saved' : ''}" data-slug="${p.slug}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        <div class="popular-card-logo">${getEmoji(p.category) || initial}</div>
        <div class="popular-card-company">${escapeHtml(p.category)}</div>
        <div class="popular-card-title">${escapeHtml(p.name)}</div>
        <div class="popular-card-meta">
          <span class="popular-card-difficulty difficulty-${diffClass}">${getDifficultyLabel(p.difficulty)}</span>
        </div>
      </a>
    `;
  }).join('');
}

function renderPlatformsList() {
  if (filteredPlatforms.length === 0) {
    platformsList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>Eish, nothing here!</h3>
        <p>Try changing your filters, boet.</p>
      </div>
    `;
    return;
  }
  
  platformsList.innerHTML = filteredPlatforms.map(p => {
    const isSaved = preferences.liked.includes(p.slug);
    const initial = p.name.charAt(0).toUpperCase();
    const diffClass = p.difficulty.toLowerCase();
    
    return `
      <article class="platform-card">
        <div class="platform-logo">${initial}</div>
        <div class="platform-info">
          <div class="platform-header">
            <h3 class="platform-name">${escapeHtml(p.name)}</h3>
            ${p.sa_friendly ? '<span class="platform-badge badge-sa">🇿🇦 SA Friendly</span>' : ''}
            <span class="platform-badge difficulty-${diffClass}">${getDifficultyLabel(p.difficulty)}</span>
          </div>
          <div class="platform-meta">
            <span class="platform-meta-item">${escapeHtml(p.category)}</span>
            <span class="platform-meta-item">•</span>
            <span class="platform-meta-item">${escapeHtml(p.best_for.join(', '))}</span>
          </div>
          <p class="platform-description">${escapeHtml(p.description)}</p>
          <div class="platform-tags">
            ${p.tags.slice(0, 4).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        <div class="platform-actions">
          <div class="platform-salary">${escapeHtml(p.payout_notes.split('.')[0])}</div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="btn-icon save-btn ${isSaved ? 'saved' : ''}" data-slug="${p.slug}" title="Save">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <a href="go/${p.slug}.html" target="_blank" rel="noopener" class="btn btn-primary">
              Apply
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Utilities
function getEmoji(category) {
  const emojis = {
    '🎧 Customer Support': '🎧',
    '💻 Tech & Dev': '💻',
    '🔥 Competitive (High Pay)': '🔥',
    '📋 Remote Job Boards & Agencies': '📋',
    '🧪 Testing & Research': '🧪',
    '📚 Teaching & Mentoring': '📚',
    '🤖 AI Training': '🤖',
    '🪙 Crypto & Web3': '🪙',
    '🏢 SaaS Companies': '🏢',
    '🌍 Freelance Marketplaces': '🌍',
    '✍️ Writing & Transcription': '✍️'
  };
  return emojis[category] || null;
}

function getDifficultyLabel(diff) {
  const labels = {
    'Easy': '🟢 Entry Level',
    'Medium': '🟡 Intermediate',
    'Hard': '🔴 Competitive'
  };
  return labels[diff] || diff;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showError(message) {
  platformsList.innerHTML = `
    <div class="empty-state">
      <h3>Haibo! Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
