/**
 * PaidProperly - Main Application JavaScript
 * Handles platform directory, filtering, search, and preferences
 */

// State
let platforms = [];
let filteredPlatforms = [];
let preferences = loadPreferences();

// DOM Elements
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const bestForFilter = document.getElementById('bestfor-filter');
const saFriendlyToggle = document.getElementById('sa-friendly-toggle');
const hideNopedToggle = document.getElementById('hide-noped-toggle');
const platformsGrid = document.getElementById('platforms-grid');
const resultsCount = document.getElementById('results-count');
const featuredSection = document.getElementById('featured-section');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    await loadPlatforms();
    populateFilters();
    setupEventListeners();
    renderFeatured();
    applyFilters();
  } catch (error) {
    console.error('Failed to initialize:', error);
    showError('Failed to load platforms. Please refresh the page.');
  }
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
  // Sort by recommended_rank
  platforms.sort((a, b) => a.recommended_rank - b.recommended_rank);
}

// Preferences (localStorage)
function loadPreferences() {
  try {
    const saved = localStorage.getItem('paidproperly_preferences');
    return saved ? JSON.parse(saved) : { liked: [], noped: [] };
  } catch {
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

function toggleLike(slug) {
  const index = preferences.liked.indexOf(slug);
  if (index > -1) {
    preferences.liked.splice(index, 1);
  } else {
    preferences.liked.push(slug);
    const nopedIndex = preferences.noped.indexOf(slug);
    if (nopedIndex > -1) preferences.noped.splice(nopedIndex, 1);
  }
  savePreferences();
  renderPlatforms();
}

function toggleNope(slug) {
  const index = preferences.noped.indexOf(slug);
  if (index > -1) {
    preferences.noped.splice(index, 1);
  } else {
    preferences.noped.push(slug);
    const likedIndex = preferences.liked.indexOf(slug);
    if (likedIndex > -1) preferences.liked.splice(likedIndex, 1);
  }
  savePreferences();
  applyFilters();
}

// Populate Filter Options
function populateFilters() {
  const categories = [...new Set(platforms.map(p => p.category))].sort();
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  
  const bestForSet = new Set();
  platforms.forEach(p => p.best_for.forEach(bf => bestForSet.add(bf)));
  const bestForOptions = [...bestForSet].sort();
  bestForOptions.forEach(bf => {
    const option = document.createElement('option');
    option.value = bf;
    option.textContent = bf;
    bestForFilter.appendChild(option);
  });
}

// Event Listeners
function setupEventListeners() {
  searchInput.addEventListener('input', debounce(applyFilters, 200));
  categoryFilter.addEventListener('change', applyFilters);
  difficultyFilter.addEventListener('change', applyFilters);
  bestForFilter.addEventListener('change', applyFilters);
  saFriendlyToggle.addEventListener('change', applyFilters);
  hideNopedToggle.addEventListener('change', applyFilters);
  
  document.addEventListener('click', (e) => {
    const likeBtn = e.target.closest('.like-btn');
    const nopeBtn = e.target.closest('.nope-btn');
    
    if (likeBtn) {
      e.preventDefault();
      toggleLike(likeBtn.dataset.slug);
    }
    
    if (nopeBtn) {
      e.preventDefault();
      toggleNope(nopeBtn.dataset.slug);
    }
  });
}

// Filtering
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const category = categoryFilter.value;
  const difficulty = difficultyFilter.value;
  const bestFor = bestForFilter.value;
  const saFriendlyOnly = saFriendlyToggle.checked;
  const hideNoped = hideNopedToggle.checked;
  
  filteredPlatforms = platforms.filter(p => {
    if (p.featured) return false;
    
    if (searchTerm) {
      const searchable = [
        p.name,
        p.description,
        p.category,
        ...p.tags,
        ...p.best_for
      ].join(' ').toLowerCase();
      if (!searchable.includes(searchTerm)) return false;
    }
    
    if (category && p.category !== category) return false;
    if (difficulty && p.difficulty !== difficulty) return false;
    if (bestFor && !p.best_for.includes(bestFor)) return false;
    if (saFriendlyOnly && !p.sa_friendly) return false;
    if (hideNoped && preferences.noped.includes(p.slug)) return false;
    
    return true;
  });
  
  renderPlatforms();
}

// Rendering
function renderFeatured() {
  const featured = platforms.find(p => p.featured);
  if (!featured) {
    featuredSection.style.display = 'none';
    return;
  }
  
  featuredSection.innerHTML = `
    <div class="featured-card">
      <span class="featured-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        Sharp Pick
      </span>
      <div class="featured-content">
        <h2 class="featured-name">${escapeHtml(featured.name)}</h2>
        <p class="featured-description">${escapeHtml(featured.description)}</p>
        <div class="featured-meta">
          <span class="featured-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${escapeHtml(featured.best_for.join(', '))}
          </span>
          <span class="featured-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${escapeHtml(featured.difficulty)}
          </span>
          <span class="featured-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            ${escapeHtml(featured.payout_notes)}
          </span>
        </div>
        <div class="featured-actions">
          <a href="platform.html?slug=${featured.slug}" class="btn btn--white">Check it out</a>
          <a href="go/${featured.slug}.html" target="_blank" rel="noopener" class="btn btn--white-outline">
            Let's Go
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderPlatforms() {
  resultsCount.textContent = `${filteredPlatforms.length} lekker option${filteredPlatforms.length !== 1 ? 's' : ''} found`;
  
  if (filteredPlatforms.length === 0) {
    platformsGrid.innerHTML = `
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
  
  platformsGrid.innerHTML = filteredPlatforms.map(p => renderPlatformCard(p)).join('');
}

function renderPlatformCard(platform) {
  const isLiked = preferences.liked.includes(platform.slug);
  const isNoped = preferences.noped.includes(platform.slug);
  const difficultyClass = platform.difficulty.toLowerCase();
  
  return `
    <article class="platform-card ${isNoped ? 'is-noped' : ''}">
      <div class="card-header">
        <div class="card-title-group">
          <h3 class="card-title">
            ${escapeHtml(platform.name)}
            ${platform.sa_friendly ? `
              <span title="Sorted for Mzansi">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-success)" stroke="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </span>
            ` : ''}
          </h3>
          <span class="card-category">${escapeHtml(platform.category)}</span>
        </div>
        <div class="preference-actions">
          <button class="pref-btn like-btn ${isLiked ? 'liked' : ''}" data-slug="${platform.slug}" title="Like">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="pref-btn nope-btn ${isNoped ? 'noped' : ''}" data-slug="${platform.slug}" title="Not interested">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <p class="card-description">${escapeHtml(platform.description)}</p>
      
      <div class="card-tags">
        ${platform.best_for.map(bf => `<span class="tag tag--best-for">${escapeHtml(bf)}</span>`).join('')}
        ${platform.tags.slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        <span class="difficulty-badge difficulty-badge--${difficultyClass}">${escapeHtml(platform.difficulty)}</span>
      </div>
      
      <p class="card-payout">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        ${escapeHtml(platform.payout_notes)}
      </p>
      
      <div class="card-actions">
        <a href="platform.html?slug=${platform.slug}" class="btn btn--secondary btn--sm">More info</a>
        <a href="go/${platform.slug}.html" target="_blank" rel="noopener" class="btn btn--primary btn--sm">
          Let's Go
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </article>
  `;
}

// Utilities
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
  platformsGrid.innerHTML = `
    <div class="empty-state">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>Haibo! Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
