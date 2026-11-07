/**
 * CYCLO Café - Hub & Branch Finder
 * Main Application Logic
 */

let branches = [];
let promotions = [];
let currentFilter = 'all';

// Obfuscated data endpoint to prevent plain-text exposure in source
const _CONFIG = {
  // Base64 encoded Google Sheets gviz endpoint
  _src: atob('aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMXZXOU9nS3JBRm5UUkZjR0xjN0U4Y0NvcGdIMlV4RG9lUEFrOHdtTjhDMmcvZ3Zpei90cQ==')
};

// Dynamically request sheet data and self-destruct the script tag after execution
function requestSheetData(sheetName, callbackName) {
  const script = document.createElement('script');
  script.src = `${_CONFIG._src}?sheet=${encodeURIComponent(sheetName)}&tqx=responseHandler:${callbackName}`;
  script.async = true;

  // Remove script tag immediately upon load/error to keep DOM / Elements tree clean
  script.onload = () => script.remove();
  script.onerror = () => script.remove();

  (document.head || document.documentElement).appendChild(script);
}

function handleBranchesResponse(data) {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.style.display = 'none';

  try {
    const rows = data.table.rows;
    branches = rows.map((r, idx) => {
      const c = r.c;
      return {
        id: idx + 1,
        name: (c[0] && c[0].v !== null) ? String(c[0].v).trim() : '',
        area: (c[1] && c[1].v !== null) ? String(c[1].v).trim() : '',
        telegram: (c[2] && c[2].v !== null) ? String(c[2].v).trim() : '#',
        phone: (c[3] && c[3].v !== null) ? String(c[3].v).trim() : '',
        promo: (c[4] && c[4].v !== null) ? String(c[4].v).trim() : '',
        status: (c[5] && c[5].v !== null) ? String(c[5].v).trim() : 'Open'
      };
    }).filter(b => {
      const lower = b.name.toLowerCase();
      return b.name.length > 0 && lower !== 'branch_name' && lower !== 'name';
    });

    renderGrid(branches);
  } catch (err) {
    console.error('Branches parsing error:', err);
  }
}

function handlePromotionsResponse(data) {
  try {
    const rows = data.table.rows;
    promotions = rows.map(r => {
      const c = r.c;
      const isChecked = c[4] && (c[4].v === true || String(c[4].v).toUpperCase() === 'TRUE');
      return {
        title: (c[1] && c[1].v !== null) ? String(c[1].v).trim() : '',
        desc: (c[2] && c[2].v !== null) ? String(c[2].v).trim() : '',
        tag: (c[3] && c[3].v !== null) ? String(c[3].v).trim() : '',
        active: Boolean(isChecked)
      };
    }).filter(p => p.title.length > 0 && p.title.toLowerCase() !== 'title' && p.active === true);

    renderPromos(promotions);
  } catch (err) {
    console.error('Promotions parsing error:', err);
    renderPromos([]);
  }
}

function renderPromos(promoList) {
  const section = document.getElementById('promoSection');
  const container = document.getElementById('promoContainer');

  if (!promoList || promoList.length === 0) {
    if (section) section.classList.add('hidden');
    if (container) container.innerHTML = '';
    return;
  }

  if (section) section.classList.remove('hidden');
  if (container) {
    container.innerHTML = '';
    promoList.forEach(p => {
      const item = document.createElement('div');
      item.className = "flex-shrink-0 bg-white rounded-xl p-3.5 border border-zinc-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between min-w-[210px] sm:min-w-[230px]";
      item.innerHTML = `
        <div class="flex items-center justify-between gap-1.5 mb-1.5">
          <span class="text-xs font-semibold text-zinc-900">${p.title}</span>
          ${p.tag ? `<span class="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-white font-medium">${p.tag}</span>` : ''}
        </div>
        <p class="text-[11px] font-light text-zinc-500 leading-relaxed">${p.desc}</p>
      `;
      container.appendChild(item);
    });
  }
}

function renderGrid(dataList) {
  const container = document.getElementById('branchGrid');
  if (!container) return;
  container.innerHTML = '';

  if (dataList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-zinc-400 text-xs font-light">
        រកមិនឃើញសាខាក្នុងតំបន់នេះទេ។
      </div>
    `;
    return;
  }

  dataList.forEach(item => {
    const isOpen = (item.status || '').toLowerCase() === 'open';
    const card = document.createElement('div');
    card.className = "bg-white rounded-2xl p-4 flex flex-col justify-between border border-zinc-200/80 hover:border-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200";

    const promoBadge = item.promo ? `
      <div class="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-100/80 border border-zinc-200/70 text-[10px] text-zinc-700 font-normal">
        <span class="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
        <span>${item.promo}</span>
      </div>
    ` : '';

    const statusBadge = isOpen
      ? `<span class="text-[10px] font-medium flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>បើក</span>
         </span>`
      : `<span class="text-[10px] font-normal flex items-center gap-1.5 text-zinc-400 bg-zinc-50 border border-zinc-200/60 px-2.5 py-0.5 rounded-full">
          <span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
          <span>បិទ</span>
         </span>`;

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="text-xs font-semibold text-zinc-900 tracking-tight">${item.name}</h3>
          ${statusBadge}
        </div>
        <p class="text-[11px] font-light text-zinc-500 leading-relaxed line-clamp-2 mt-1">${item.area}</p>
        ${promoBadge}
      </div>

      <div class="pt-3 mt-3.5 border-t border-zinc-100 flex items-center gap-2">
        <a
          href="${item.telegram}?text=${encodeURIComponent(`សួស្តី ${item.name}! ខ្ញុំចង់កម្មង់កាហ្វេដឹកជញ្ជូន...`)}"
          target="_blank"
          class="relative flex-1 h-10 rounded-xl sm:rounded-2xl bg-[#29A9EB] overflow-hidden border border-zinc-200/90 shadow-xs hover:shadow-md transition-all active:scale-[0.99] group flex items-center"
        >
          <!-- Curved White Split Panel (Custom wave divider) -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L53,0 C60,0 57.5,45 59.5,75 C60.5,88 62.5,100 66,100 L0,100 Z" fill="#FFFFFF"></path>
          </svg>

          <!-- Left Text: Centered in white zone -->
          <div class="relative z-10 w-[58%] flex items-center justify-center pl-3">
            <span class="text-xs font-semibold text-zinc-600 tracking-tight">កម្មង់ Telegram</span>
          </div>

          <!-- Right Icon: Centered in blue zone with official Telegram airplane -->
          <div class="relative z-10 w-[42%] flex items-center justify-center pr-2">
            <svg class="w-5 h-5 text-white fill-current transition-transform group-hover:scale-110 drop-shadow-xs" viewBox="0 0 24 24">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
            </svg>
          </div>
        </a>

        ${item.phone ? `
          <a
            href="tel:${item.phone}"
            class="h-10 w-10 rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black transition flex items-center justify-center flex-shrink-0 shadow-xs"
            title="Call"
          >
            <i data-lucide="phone" class="w-3.5 h-3.5 stroke-[1.25]"></i>
          </a>
        ` : ''}
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function handleSearch() {
  const searchInput = document.getElementById('searchBox');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  filterBranches(q, currentFilter);
}

function setFilter(type) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('bg-zinc-900', 'text-white', 'font-medium', 'shadow-xs');
    btn.classList.add('text-zinc-600', 'font-light');
  });

  const activeBtn = document.getElementById(`filter-${type}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-zinc-600', 'font-light');
    activeBtn.classList.add('bg-zinc-900', 'text-white', 'font-medium', 'shadow-xs');
  }

  const searchInput = document.getElementById('searchBox');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  filterBranches(q, currentFilter);
}

function filterBranches(keyword, filterType) {
  let filtered = branches.filter(b =>
    b.name.toLowerCase().includes(keyword) ||
    b.area.toLowerCase().includes(keyword)
  );

  if (filterType === 'open') {
    filtered = filtered.filter(b => (b.status || '').toLowerCase() === 'open');
  }

  renderGrid(filtered);
}

// Ensure global exposure for inline HTML event handlers and JSONP callbacks
window.handleBranchesResponse = handleBranchesResponse;
window.handlePromotionsResponse = handlePromotionsResponse;
window.handleSearch = handleSearch;
window.setFilter = setFilter;

// Initialize icons and data fetching cleanly
let isInitialized = false;
function initApp() {
  if (isInitialized) return;
  isInitialized = true;
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
  requestSheetData('Sheet1', 'handleBranchesResponse');
  requestSheetData('Promotions', 'handlePromotionsResponse');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
