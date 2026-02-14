/**
 * UnClosed Landing Page — i18n Toggle + Blobity Cursor
 */

// ============================================================
// i18n
// ============================================================
let currentLang = navigator.language.startsWith('zh') ? 'zh' : 'en';

function toggleLang() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  applyLang();
}

function applyLang() {
  document.querySelectorAll('[data-en][data-zh]').forEach(el => {
    const text = el.getAttribute(`data-${currentLang}`);
    if (el.children.length === 0) {
      el.textContent = text;
    } else {
      el.innerHTML = text;
    }
  });

  const btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.textContent = currentLang === 'en' ? '中文' : 'English';
  }

  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

  document.title = currentLang === 'zh'
    ? 'UnClosed — 每个标签页，都值得第二次机会。'
    : 'UnClosed — Every tab deserves a second chance.';
}

document.addEventListener('DOMContentLoaded', () => {
  applyLang();
  initCardTilt();
});

// ============================================================
// 3D Tilt + Spotlight on Feature Cards
// ============================================================
function initCardTilt() {
  const cards = document.querySelectorAll('.feature-card');

  cards.forEach(card => {
    // Inject spotlight overlay
    const spotlight = document.createElement('div');
    spotlight.className = 'card-spotlight';
    card.appendChild(spotlight);

    card.addEventListener('mouseenter', () => {
      card.classList.add('is-tilting');
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Tilt: max ±12 degrees
      const rotateY = ((x - centerX) / centerX) * 12;
      const rotateX = ((centerY - y) / centerY) * 12;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
      card.style.boxShadow = `${-rotateY}px ${rotateX}px 0 var(--border)`;

      // Spotlight gradient follows cursor
      spotlight.style.background = `radial-gradient(circle 180px at ${x}px ${y}px, rgba(255,255,255,0.25), transparent)`;
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
      card.style.boxShadow = '';
      spotlight.style.background = '';
    });
  });
}

// ============================================================
// Theme Toggle (light → dark → system → light)
// ============================================================
function getSystemTheme() {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getEffectiveTheme(pref) {
  if (pref === 'system' || !pref) return getSystemTheme();
  return pref;
}

function updateThemeIcon(pref) {
  const btn = document.querySelector('[data-theme-icon]');
  if (!btn) return;
  if (pref === 'light') btn.textContent = '☀️';
  else if (pref === 'dark') btn.textContent = '🌙';
  else btn.textContent = '🖥️';
}

function updateBlobityForTheme(theme) {
  if (!window.__blobity) return;
  if (theme === 'dark') {
    window.__blobity.updateOptions({ color: '#ffffff', dotColor: '#059669', fontColor: '#0d1117' });
  } else {
    window.__blobity.updateOptions({ color: '#190a11', dotColor: '#6366f1', fontColor: '#000000' });
  }
}

function applyTheme(pref) {
  const effective = getEffectiveTheme(pref);
  document.documentElement.setAttribute('data-theme', effective);
  updateThemeIcon(pref);
  updateBlobityForTheme(effective);
}

function toggleTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  const next = saved === 'light' ? 'dark' : saved === 'dark' ? 'system' : 'light';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

// On load: restore theme preference
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const pref = saved || 'light';
  applyTheme(pref);

  // Listen for system theme changes when preference is "system"
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = localStorage.getItem('theme');
    if (current === 'system' || !current) applyTheme('system');
  });
})();

// ============================================================
// Blobity Cursor
// ============================================================
import('https://esm.sh/blobity@0.2.3').then(({ default: Blobity }) => {
  // Skip touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const blobity = new Blobity({
    licenseKey: 'opensource',
    invert: true,
    zIndex: 50,
    color: '#190a11',       // Light bg: soft tint after difference blend
    dotColor: '#6366f1',    // Resting dot: extension's purple accent
    radius: 6,
    magnetic: false,
    mode: 'normal',
    focusableElements: 'a, button, [data-blobity]',
    focusableElementsOffsetX: 5,
    focusableElementsOffsetY: 4,
    font: "'Space Grotesk', system-ui, sans-serif",
    fontSize: 15,
    fontWeight: 600,
    fontColor: '#000000',   // Light bg: becomes white after difference
    tooltipPadding: 12,
  });

  window.__blobity = blobity;
  document.body.classList.add('blobity-active');

  // Apply dark mode colors if already in dark theme
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    blobity.updateOptions({ color: '#ffffff', dotColor: '#059669', fontColor: '#0d1117' });
  }

  // Scroll bounce
  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      blobity.bounce();
      scrollTimeout = null;
    }, 150);
  }, { passive: true });
}).catch(() => {
  // Blobity load failed — graceful fallback, default cursor stays
});
