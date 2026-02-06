/**
 * PaidProperly - Platform Detail Page JavaScript
 */

const platformContent = document.getElementById('platform-content');

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const slug = getSlugFromUrl();
  
  if (!slug) {
    showError('No platform specified.');
    return;
  }
  
  try {
    const platforms = await loadPlatforms();
    const platform = platforms.find(p => p.slug === slug);
    
    if (!platform) {
      showError('Platform not found.');
      return;
    }
    
    renderPlatform(platform);
    document.title = `${platform.name} - PaidProperly`;
    
  } catch (error) {
    console.error('Failed to load platform:', error);
    showError('Failed to load platform details. Please try again.');
  }
}

function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

async function loadPlatforms() {
  const response = await fetch('data/platforms.json');
  if (!response.ok) throw new Error('Failed to load');
  return response.json();
}

function renderPlatform(platform) {
  const difficultyClass = platform.difficulty.toLowerCase();
  const difficultyLabel = platform.difficulty === 'Easy' ? 'Chilled' : platform.difficulty === 'Hard' ? 'Hectic' : platform.difficulty;
  
  platformContent.innerHTML = `
    <a href="index.html" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Back to the list
    </a>
    
    <div class="detail-header">
      <span class="detail-category">${escapeHtml(platform.category)}</span>
      <h1 class="detail-title">${escapeHtml(platform.name)}</h1>
    </div>
    
    <div class="detail-meta">
      <div class="meta-item">
        <span class="meta-label">How Hectic</span>
        <span class="meta-value">
          <span class="difficulty-badge difficulty-badge--${difficultyClass}">${difficultyLabel}</span>
        </span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Mzansi Friendly</span>
        <span class="meta-value">${platform.sa_friendly ? '✓ Ja, sorted!' : 'Maybe not'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Best For</span>
        <span class="meta-value">${escapeHtml(platform.best_for.join(', '))}</span>
      </div>
    </div>
    
    <section class="detail-section">
      <h2>What's the deal?</h2>
      <p class="detail-description">${escapeHtml(platform.description)}</p>
    </section>
    
    <section class="detail-section">
      <h2>Show me the money</h2>
      <p class="detail-description">${escapeHtml(platform.payout_notes)}</p>
    </section>
    
    <section class="detail-section">
      <h2>Tags</h2>
      <div class="detail-tags">
        ${platform.best_for.map(bf => `<span class="tag tag--best-for">${escapeHtml(bf)}</span>`).join('')}
        ${platform.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </section>
    
    <div class="detail-cta">
      <h3>Ready to check it out?</h3>
      <p>Visit ${escapeHtml(platform.name)} and see if it's your vibe.</p>
      <a href="go/${platform.slug}.html" target="_blank" rel="noopener" class="btn btn--primary btn--lg">
        Let's Go to ${escapeHtml(platform.name)}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>
    
    <div class="affiliate-note">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>Some links might earn us a small referral fee. No stress though - it doesn't change what we recommend.</span>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  platformContent.innerHTML = `
    <a href="index.html" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Back to the list
    </a>
    
    <div class="empty-state">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>Eish!</h3>
      <p>${escapeHtml(message)}</p>
      <a href="index.html" class="btn btn--primary mt-md">Back to the list</a>
    </div>
  `;
}
