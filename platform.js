/**
 * PaidProperly - Platform Detail Page JavaScript
 * Loads and displays a single platform based on URL slug
 */

// DOM Elements
const platformContent = document.getElementById('platform-content');

// Initialize
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
  // Try fetch first, fall back to embedded data
  try {
    const response = await fetch('data/platforms.json');
    if (response.ok) {
      return response.json();
    }
    throw new Error('Fetch failed');
  } catch (e) {
    // Return embedded data as fallback
    console.log('Using embedded platform data');
    return getEmbeddedPlatforms();
  }
}

// Embedded platform data for when fetch fails (file:// protocol)
function getEmbeddedPlatforms() {
  return [
    {"id":1,"name":"Somewhere","slug":"somewhere","url":"https://somewhere.com","ref_url":"https://somewhere.com/referral-programs/contact-us?referral_referred_by=brandonkz@gmail.com","category":"Remote hiring platforms","description":"Connects talented professionals from emerging markets with US startups. Known for quality placements and fair pay.","best_for":["Ops","Admin","Marketing","Support","Sales"],"payout_notes":"Monthly salary via Deel or direct deposit. USD rates.","difficulty":"Medium","tags":["full-time","startups","USD pay","benefits"],"sa_friendly":true,"recommended_rank":1,"featured":true},
    {"id":2,"name":"RecruitCRM","slug":"recruitcrm","url":"https://recruitcrm.io/careers","ref_url":"https://recruitcrm.io/careers","category":"Remote hiring platforms","description":"Hiring platform for recruitment agencies that also hires remote talent globally for their own operations.","best_for":["Sales","Support","Dev"],"payout_notes":"Monthly salary. Competitive international rates.","difficulty":"Medium","tags":["full-time","SaaS","remote-first"],"sa_friendly":true,"recommended_rank":5,"featured":false},
    {"id":3,"name":"Turing","slug":"turing","url":"https://turing.com","ref_url":"https://turing.com","category":"Remote hiring platforms","description":"AI-powered platform matching developers with US companies. Rigorous vetting but excellent long-term opportunities.","best_for":["Dev"],"payout_notes":"Weekly or bi-weekly USD payments. Top rates for senior devs.","difficulty":"Hard","tags":["developers","USD pay","long-term","vetting required"],"sa_friendly":true,"recommended_rank":3,"featured":false},
    {"id":4,"name":"Toptal","slug":"toptal","url":"https://toptal.com","ref_url":"https://toptal.com","category":"Specialist freelance networks","description":"Elite freelance network for top 3% of talent. Very selective but premium rates and clients.","best_for":["Dev","Design","Finance"],"payout_notes":"Weekly payments via Payoneer or wire. Premium hourly rates.","difficulty":"Hard","tags":["freelance","premium","top-tier clients","strict vetting"],"sa_friendly":true,"recommended_rank":4,"featured":false},
    {"id":5,"name":"Braintrust","slug":"braintrust","url":"https://braintrust.com","ref_url":"https://braintrust.com","category":"Specialist freelance networks","description":"User-owned talent network. No middleman fees means you keep 100% of what clients pay.","best_for":["Dev","Design","Marketing"],"payout_notes":"Direct client payments. No platform fees.","difficulty":"Medium","tags":["freelance","no fees","web3-adjacent","tech"],"sa_friendly":true,"recommended_rank":6,"featured":false},
    {"id":6,"name":"UserTesting","slug":"usertesting","url":"https://usertesting.com/get-paid-to-test","ref_url":"https://usertesting.com/get-paid-to-test","category":"Research interviews and user testing","description":"Get paid to test websites and apps. Share your screen and speak your thoughts aloud.","best_for":["Anyone"],"payout_notes":"$4-$10 per 20-min test. PayPal weekly.","difficulty":"Easy","tags":["side income","flexible","no experience needed"],"sa_friendly":true,"recommended_rank":8,"featured":false},
    {"id":7,"name":"Respondent","slug":"respondent","url":"https://respondent.io","ref_url":"https://respondent.io","category":"Research interviews and user testing","description":"Participate in research studies and interviews. Higher payouts for professional expertise.","best_for":["Anyone","Professionals"],"payout_notes":"$50-$400 per study. PayPal payouts.","difficulty":"Easy","tags":["research","interviews","high payouts","flexible"],"sa_friendly":true,"recommended_rank":7,"featured":false},
    {"id":8,"name":"Testbirds","slug":"testbirds","url":"https://nest.testbirds.com","ref_url":"https://nest.testbirds.com","category":"Research interviews and user testing","description":"Crowdtesting platform for websites, apps, and IoT devices. Bug hunting and UX testing.","best_for":["QA","Anyone"],"payout_notes":"€20-€50 per test. PayPal or bank transfer.","difficulty":"Easy","tags":["testing","bug hunting","flexible"],"sa_friendly":true,"recommended_rank":15,"featured":false},
    {"id":9,"name":"Codementor","slug":"codementor","url":"https://codementor.io","ref_url":"https://codementor.io","category":"Mentoring and teaching","description":"Help developers learn to code through 1-on-1 mentoring sessions. Set your own rates.","best_for":["Dev"],"payout_notes":"$60-$150/hr typical. PayPal or Payoneer.","difficulty":"Medium","tags":["mentoring","teaching","developers","set own rates"],"sa_friendly":true,"recommended_rank":10,"featured":false},
    {"id":10,"name":"ADPList","slug":"adplist","url":"https://adplist.org","ref_url":"https://adplist.org","category":"Mentoring and teaching","description":"Mentor designers and product people. Build your reputation while giving back.","best_for":["Design","Product"],"payout_notes":"Free platform. Premium features for paid sessions.","difficulty":"Easy","tags":["mentoring","design","product","community"],"sa_friendly":true,"recommended_rank":18,"featured":false},
    {"id":11,"name":"Preply","slug":"preply","url":"https://preply.com/en/teach","ref_url":"https://preply.com/en/teach","category":"Mentoring and teaching","description":"Teach English or other languages online. Flexible hours, students worldwide.","best_for":["Teaching"],"payout_notes":"$15-$25/hr average. Set your own rates.","difficulty":"Easy","tags":["teaching","languages","flexible","set own rates"],"sa_friendly":true,"recommended_rank":12,"featured":false},
    {"id":12,"name":"Italki","slug":"italki","url":"https://italki.com/become-a-teacher","ref_url":"https://italki.com/become-a-teacher","category":"Mentoring and teaching","description":"Language teaching marketplace. Great for native English speakers or multilingual South Africans.","best_for":["Teaching"],"payout_notes":"$10-$30/hr typical. PayPal or Payoneer.","difficulty":"Easy","tags":["teaching","languages","flexible"],"sa_friendly":true,"recommended_rank":13,"featured":false},
    {"id":13,"name":"Belay","slug":"belay","url":"https://belaysolutions.com","ref_url":"https://belaysolutions.com","category":"Ops and admin remote work","description":"Virtual assistant and bookkeeping services for US businesses. Contract-based.","best_for":["Admin","Finance"],"payout_notes":"Competitive hourly rates. Direct deposit.","difficulty":"Medium","tags":["virtual assistant","bookkeeping","US clients"],"sa_friendly":true,"recommended_rank":11,"featured":false},
    {"id":14,"name":"Time Etc","slug":"time-etc","url":"https://timeetc.com/become-a-va","ref_url":"https://timeetc.com/become-a-va","category":"Ops and admin remote work","description":"Virtual assistant agency serving entrepreneurs. Part-time and flexible.","best_for":["Admin","Ops"],"payout_notes":"$11-$16/hr starting. Experience increases rates.","difficulty":"Easy","tags":["virtual assistant","part-time","flexible"],"sa_friendly":true,"recommended_rank":14,"featured":false},
    {"id":15,"name":"Support Driven Jobs","slug":"support-driven","url":"https://supportdriven.com/jobs","ref_url":"https://supportdriven.com/jobs","category":"Remote hiring platforms","description":"Curated job board for customer support professionals. Quality remote positions.","best_for":["Support"],"payout_notes":"Varies by company. Many offer competitive global rates.","difficulty":"Medium","tags":["customer support","job board","remote"],"sa_friendly":true,"recommended_rank":16,"featured":false},
    {"id":16,"name":"Working Not Working","slug":"working-not-working","url":"https://workingnotworking.com","ref_url":"https://workingnotworking.com","category":"Specialist freelance networks","description":"Creative network for designers, directors, and producers. High-end freelance gigs.","best_for":["Design","Creative"],"payout_notes":"Premium rates. Direct client negotiations.","difficulty":"Hard","tags":["creative","freelance","premium","portfolio required"],"sa_friendly":true,"recommended_rank":17,"featured":false},
    {"id":17,"name":"Gun.io","slug":"gunio","url":"https://gun.io","ref_url":"https://gun.io","category":"Specialist freelance networks","description":"Vetted freelance platform for senior developers. Enterprise and startup clients.","best_for":["Dev"],"payout_notes":"$100-$200/hr for seniors. Weekly payments.","difficulty":"Hard","tags":["developers","senior","premium rates","vetting"],"sa_friendly":true,"recommended_rank":9,"featured":false},
    {"id":18,"name":"Lemon.io","slug":"lemonio","url":"https://lemon.io","ref_url":"https://lemon.io","category":"Specialist freelance networks","description":"Developer marketplace focusing on Eastern Europe but accepting global talent.","best_for":["Dev"],"payout_notes":"$25-$100/hr. Bi-weekly payments.","difficulty":"Medium","tags":["developers","startups","remote"],"sa_friendly":true,"recommended_rank":19,"featured":false},
    {"id":19,"name":"Crossover","slug":"crossover","url":"https://crossover.com","ref_url":"https://crossover.com","category":"Remote hiring platforms","description":"Full-time remote positions with rigorous cognitive testing. High salaries if you pass.","best_for":["Dev","Ops","Marketing","Sales"],"payout_notes":"Weekly pay. Competitive annual salaries.","difficulty":"Hard","tags":["full-time","cognitive testing","high pay"],"sa_friendly":true,"recommended_rank":20,"featured":false},
    {"id":20,"name":"Outlier","slug":"outlier","url":"https://outlier.ai","ref_url":"https://outlier.ai","category":"AI training and data","description":"Train AI models by providing feedback and creating training data. Ideal for specialists.","best_for":["Dev","Writing","Research"],"payout_notes":"$15-$50/hr depending on expertise. Weekly PayPal.","difficulty":"Medium","tags":["AI training","flexible","remote"],"sa_friendly":true,"recommended_rank":2,"featured":false},
    {"id":21,"name":"Scale AI","slug":"scale-ai","url":"https://scale.com/careers","ref_url":"https://scale.com/careers","category":"AI training and data","description":"Data labeling and AI training tasks. Good for detail-oriented workers.","best_for":["Anyone","Research"],"payout_notes":"$10-$25/hr. Regular payments.","difficulty":"Easy","tags":["AI training","data labeling","flexible"],"sa_friendly":true,"recommended_rank":21,"featured":false},
    {"id":22,"name":"Rev","slug":"rev","url":"https://rev.com/freelancers","ref_url":"https://rev.com/freelancers","category":"Transcription and writing","description":"Transcription and captioning work. Good for native English speakers.","best_for":["Writing","Admin"],"payout_notes":"$0.30-$1.10 per audio minute. Weekly PayPal.","difficulty":"Easy","tags":["transcription","captions","flexible","entry-level"],"sa_friendly":true,"recommended_rank":22,"featured":false},
    {"id":23,"name":"Contra","slug":"contra","url":"https://contra.com","ref_url":"https://contra.com","category":"Specialist freelance networks","description":"Commission-free freelance platform. Keep 100% of what you earn.","best_for":["Dev","Design","Marketing","Writing"],"payout_notes":"No platform fees. Direct client payments.","difficulty":"Medium","tags":["freelance","no fees","portfolio"],"sa_friendly":true,"recommended_rank":23,"featured":false},
    {"id":24,"name":"Malt","slug":"malt","url":"https://malt.com","ref_url":"https://malt.com","category":"Specialist freelance networks","description":"European freelance marketplace expanding globally. Quality clients and projects.","best_for":["Dev","Design","Marketing","Consulting"],"payout_notes":"10% platform fee. Secure payments.","difficulty":"Medium","tags":["freelance","European clients","professional"],"sa_friendly":true,"recommended_rank":24,"featured":false},
    {"id":25,"name":"Hubstaff Talent","slug":"hubstaff-talent","url":"https://talent.hubstaff.com","ref_url":"https://talent.hubstaff.com","category":"Remote hiring platforms","description":"Free remote job board. No fees for freelancers or employers.","best_for":["Dev","Design","Admin","Marketing"],"payout_notes":"Direct client payments. No platform fees.","difficulty":"Easy","tags":["job board","free","remote","no fees"],"sa_friendly":true,"recommended_rank":25,"featured":false},
    {"id":26,"name":"We Work Remotely","slug":"we-work-remotely","url":"https://weworkremotely.com","ref_url":"https://weworkremotely.com","category":"Remote hiring platforms","description":"Largest remote work community. Quality job listings, many SA-friendly.","best_for":["Dev","Design","Marketing","Support","Sales"],"payout_notes":"Varies by employer. Many offer competitive global rates.","difficulty":"Medium","tags":["job board","remote","quality listings"],"sa_friendly":true,"recommended_rank":26,"featured":false},
    {"id":27,"name":"Arc.dev","slug":"arc-dev","url":"https://arc.dev","ref_url":"https://arc.dev","category":"Remote hiring platforms","description":"Remote developer jobs and freelance gigs. Good vetting leads to quality matches.","best_for":["Dev"],"payout_notes":"Competitive rates. Direct employer payments.","difficulty":"Medium","tags":["developers","remote","vetting","quality"],"sa_friendly":true,"recommended_rank":27,"featured":false},
    {"id":28,"name":"Doist","slug":"doist","url":"https://doist.com/careers","ref_url":"https://doist.com/careers","category":"Remote-first companies","description":"Makers of Todoist and Twist. Fully remote, async-first culture. Great benefits.","best_for":["Dev","Design","Marketing","Support"],"payout_notes":"Competitive salaries. Full benefits package.","difficulty":"Hard","tags":["remote-first","async","product company","benefits"],"sa_friendly":true,"recommended_rank":28,"featured":false},
    {"id":29,"name":"Zapier","slug":"zapier","url":"https://zapier.com/jobs","ref_url":"https://zapier.com/jobs","category":"Remote-first companies","description":"100% remote company. Known for excellent culture and competitive pay.","best_for":["Dev","Support","Marketing","Ops"],"payout_notes":"Competitive salaries based on role. Full benefits.","difficulty":"Hard","tags":["remote-first","SaaS","great culture","benefits"],"sa_friendly":true,"recommended_rank":29,"featured":false},
    {"id":30,"name":"Automattic","slug":"automattic","url":"https://automattic.com/work-with-us","ref_url":"https://automattic.com/work-with-us","category":"Remote-first companies","description":"Company behind WordPress.com. Fully distributed team across 90+ countries.","best_for":["Dev","Design","Support","Marketing"],"payout_notes":"Competitive global rates. Open vacation policy.","difficulty":"Hard","tags":["remote-first","WordPress","distributed","benefits"],"sa_friendly":true,"recommended_rank":30,"featured":false}
  ];
}

function renderPlatform(platform) {
  const difficultyClass = platform.difficulty.toLowerCase();
  
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
          <span class="difficulty-badge difficulty-badge--${difficultyClass}">${platform.difficulty === 'Easy' ? 'Chilled' : platform.difficulty === 'Hard' ? 'Hectic' : platform.difficulty}</span>
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
