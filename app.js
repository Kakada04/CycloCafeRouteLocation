/**
 * CYCLO Café - Hub & Branch Finder
 * Main Application Logic with Geolocation & Nearby Sorting
 */

let branches = [];
let promotions = [];
let currentFilter = 'all';
let userLocation = null; // { lat, lng }
let isNearbyActive = false;
let isLocating = false;

// Obfuscated data endpoint to prevent plain-text exposure in source
const _CONFIG = {
  // Base64 encoded Google Sheets gviz endpoint
  _src: atob('aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMXZXOU9nS3JBRm5UUkZjR0xjN0U4Y0NvcGdIMlV4RG9lUEFrOHdtTjhDMmcvZ3Zpei90cQ==')
};

// Predefined GPS coordinates for CYCLO Café branches
const BRANCH_COORDS_MAP = {
  1: { lat: 11.5461643, lng: 104.9140049 }, // ស៊ីក្លូកាហ្វេ 163
  2: { lat: 11.5492734, lng: 104.9055798 }, // ស៊ីក្លូកាហ្វេ ម៉ៅសេទុង
  3: { lat: 11.5709588, lng: 104.9208671 }, // ស៊ីក្លូកាហ្វេ ផ្សារធំថ្មី
  4: { lat: 11.557238, lng: 104.9191093 },  // ស៊ីក្លូកាហ្វេ ព្រះយុគន្ធរ
  5: { lat: 11.5478314, lng: 104.9197764 }, // ស៊ីក្លូកាហ្វេតូច 360
  6: { lat: 11.5424818, lng: 104.9087527 }, // ស៊ីក្លូកាហ្វេ 430
  7: { lat: 11.538311, lng: 104.9103748 },  // ស៊ីក្លូកាហ្វេ 271
  8: { lat: 11.5775505, lng: 104.8878081 }, // ស៊ីក្លូកាហ្វេ 598
  9: { lat: 11.5578759, lng: 104.860537 },  // ស៊ីក្លូកាហ្វេ 2004
  10: { lat: 11.6252778, lng: 104.9245556 },// ស៊ីក្លូកាហ្វេ ព្រែកលៀប
  11: { lat: 11.541708, lng: 104.9218776 }, // ស៊ីក្លូកាហ្វេ 432
  12: { lat: 11.4933053, lng: 104.9436063 },// ស៊ីក្លូកាហ្វេ ចាក់អង្រែក្រោម
  13: { lat: 11.5730285, lng: 104.8742975 },// ស៊ីក្លូកាហ្វេ សែនសុខ
  14: { lat: 11.5420894, lng: 104.883501 }, // ស៊ីក្លូកាហ្វេ 371 សរឡា
  15: { lat: 11.5506638, lng: 104.8581809 },// ស៊ីក្លូកាហ្វេ 2004 កាកាប2
  16: { lat: 11.5850578, lng: 104.8653496 },// ស៊ីក្លូកាហ្វេ សំរោងអណ្តែត
  17: { lat: 11.5544374, lng: 104.8417606 },// ស៊ីក្លូកាហ្វេ តាំងកសាង
  18: { lat: 11.5645546, lng: 104.9277112 },// ស៊ីក្លូកាហ្វេ ព្រះបរមរាជវាំង
  19: { lat: 11.5292156, lng: 104.85921 },  // ស៊ីក្លូកាហ្វេ ទួលពង្រ - CYCLO Café Toul Pong Ror
  20: { lat: 11.529211, lng: 104.943773 },  // ស៊ីក្លូកាហ្វេ ព្រែកបារាំង ( ច្បារអំពៅ )
  21: { lat: 11.6072287, lng: 104.8870711 },// ស៊ីក្លូកាហ្វេ អង្គរភ្នំពេញ
  22: { lat: 11.5898892, lng: 104.9110163 },// ស៊ីក្លូកាហ្វេ វត្តទួល
  23: { lat: 11.5615214, lng: 104.9261664 },// ស៊ីក្លូកាហ្វេ សម្តេចប៉ាន - CYCLO Café Samdech Pan
  24: { lat: 11.5326969, lng: 104.9814427 },// ស៊ីក្លូកាហ្វេ វាលស្បូវ
  25: { lat: 11.4798163, lng: 104.9455908 },// ស៊ីក្លូកាហ្វេ តាខ្មៅ
  26: { lat: 11.4762458, lng: 104.94135 },  // ស៊ីក្លូកាហ្វេ ព្រែកឬស្សី
  27: { lat: 11.531569, lng: 104.9609086 }, // ស៊ីក្លូកាហ្វេ ប៉េងហួតបឹងស្នោរ ( ក្លាស្ទឺរ )
  28: { lat: 11.531109, lng: 104.923581 },  // ស៊ីក្លូកាហ្វេ បឹងត្របែក
  29: { lat: 11.5826001, lng: 104.846722 }, // ស៊ីក្លូកាហ្វេ ក្រាំងធ្នុង
  30: { lat: 11.5108823, lng: 105.0477257 },// ស៊ីក្លូកាហ្វេ ផ្សារគគីរ
  31: { lat: 11.580314, lng: 104.9002376 }, // ស៊ីក្លូកាហ្វេ ទួលគោកផ្លាហ្សា - CYCLO Café Toul Kork Plaza
  32: { lat: 11.5886875, lng: 104.9189375 },// ស៊ីក្លូកាហ្វេ ផ្សារតូច - CYCLO Café Phsar Toch
  33: { lat: 11.6574336, lng: 104.8651212 }  // ស៊ីក្លូកាហ្វេ ព្រែកព្នៅ CYCLO Café Prek Phnov
};

// Keyword mapping to resolve coordinates even if Sheet row order changes
const BRANCH_NAME_COORDS = {
  '163': { lat: 11.5461643, lng: 104.9140049 },
  'ម៉ៅសេទុង': { lat: 11.5492734, lng: 104.9055798 },
  'ផ្សារធំថ្មី': { lat: 11.5709588, lng: 104.9208671 },
  'ព្រះយុគន្ធរ': { lat: 11.557238, lng: 104.9191093 },
  '360': { lat: 11.5478314, lng: 104.9197764 },
  '430': { lat: 11.5424818, lng: 104.9087527 },
  '271': { lat: 11.538311, lng: 104.9103748 },
  '598': { lat: 11.5775505, lng: 104.8878081 },
  '2004 កាកាប2': { lat: 11.5506638, lng: 104.8581809 },
  '2004': { lat: 11.5578759, lng: 104.860537 },
  'ព្រែកលៀប': { lat: 11.6252778, lng: 104.9245556 },
  '432': { lat: 11.541708, lng: 104.9218776 },
  'ចាក់អង្រែក្រោម': { lat: 11.4933053, lng: 104.9436063 },
  'សែនសុខ': { lat: 11.5730285, lng: 104.8742975 },
  '371': { lat: 11.5420894, lng: 104.883501 },
  'សំរោងអណ្តែត': { lat: 11.5850578, lng: 104.8653496 },
  'តាំងកសាង': { lat: 11.5544374, lng: 104.8417606 },
  'ព្រះបរមរាជវាំង': { lat: 11.5645546, lng: 104.9277112 },
  'ទួលពង្រ': { lat: 11.5292156, lng: 104.85921 },
  'ព្រែកបារាំង': { lat: 11.529211, lng: 104.943773 },
  'អង្គរភ្នំពេញ': { lat: 11.6072287, lng: 104.8870711 },
  'វត្តទួល': { lat: 11.5898892, lng: 104.9110163 },
  'សម្តេចប៉ាន': { lat: 11.5615214, lng: 104.9261664 },
  'វាលស្បូវ': { lat: 11.5326969, lng: 104.9814427 },
  'តាខ្មៅ': { lat: 11.4798163, lng: 104.9455908 },
  'ព្រែកឬស្សី': { lat: 11.4762458, lng: 104.94135 },
  'ប៉េងហួត': { lat: 11.531569, lng: 104.9609086 },
  'បឹងត្របែក': { lat: 11.531109, lng: 104.923581 },
  'ក្រាំងធ្នុង': { lat: 11.5826001, lng: 104.846722 },
  'ផ្សារគគីរ': { lat: 11.5108823, lng: 105.0477257 },
  'ទួលគោកផ្លាហ្សា': { lat: 11.580314, lng: 104.9002376 },
  'ផ្សារតូច': { lat: 11.5886875, lng: 104.9189375 },
  'ព្រែកព្នៅ': { lat: 11.6574336, lng: 104.8651212 }
};

// Helper to extract GPS coordinates from Area URL or known lookup maps
function getBranchCoordinates(branch) {
  const area = branch.area || '';

  // 1. Check embedded coordinates in URL if present
  const m3d = area.match(/!3d([0-9.]+)!4d([0-9.]+)/);
  if (m3d) return { lat: parseFloat(m3d[1]), lng: parseFloat(m3d[2]) };

  const mat = area.match(/@([0-9.]+),([0-9.]+)/);
  if (mat) return { lat: parseFloat(mat[1]), lng: parseFloat(mat[2]) };

  const mcoord = area.match(/([0-9]{2}\.[0-9]+)[,\s+]+([0-9]{2,3}\.[0-9]+)/);
  if (mcoord) return { lat: parseFloat(mcoord[1]), lng: parseFloat(mcoord[2]) };

  // 2. Check keyword map (sorted longest first to match '2004 កាកាប2' before '2004')
  const name = branch.name || '';
  const sortedKeys = Object.keys(BRANCH_NAME_COORDS).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    if (name.includes(k)) {
      return BRANCH_NAME_COORDS[k];
    }
  }

  // 3. Fallback to ID map
  if (BRANCH_COORDS_MAP[branch.id]) {
    return BRANCH_COORDS_MAP[branch.id];
  }

  return null;
}

// Calculate distance between two GPS coordinates using the Haversine formula (km)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance cleanly
function formatDistance(distKm) {
  if (typeof distKm !== 'number' || isNaN(distKm)) return '';
  if (distKm < 0.1) return '< 0.1';
  if (distKm < 10) return distKm.toFixed(1);
  return distKm.toFixed(0);
}

// Dynamically request sheet data with headers=1 to ensure all data rows are returned
function requestSheetData(sheetName, callbackName) {
  const script = document.createElement('script');
  script.src = `${_CONFIG._src}?sheet=${encodeURIComponent(sheetName)}&headers=1&tqx=responseHandler:${callbackName}`;
  script.async = true;

  // Remove script tag immediately upon load/error to keep DOM tree clean
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
      const b = {
        id: idx + 1,
        name: (c[0] && c[0].v !== null) ? String(c[0].v).trim() : '',
        area: (c[1] && c[1].v !== null) ? String(c[1].v).trim() : '',
        telegram: (c[2] && c[2].v !== null) ? String(c[2].v).trim() : '#',
        phone: (c[3] && c[3].v !== null) ? String(c[3].v).trim() : '',
        promo: (c[4] && c[4].v !== null) ? String(c[4].v).trim() : '',
        status: (c[5] && c[5].v !== null) ? String(c[5].v).trim() : 'Open',
        distance: null
      };

      const coords = getBranchCoordinates(b);
      if (coords) {
        b.lat = coords.lat;
        b.lng = coords.lng;
      }
      return b;
    }).filter(b => {
      const lower = b.name.toLowerCase();
      return b.name.length > 0 && lower !== 'branch_name' && lower !== 'name';
    });

    // If user location was already granted earlier, calculate distances now
    if (userLocation) {
      applyDistancesToBranches();
    }

    // Apply current filter and render initial view
    filterBranches(getCurrentSearchKeyword(), currentFilter);
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

// Helper to resolve map details from the sheet's Area column
function getMapInfo(area, branchName) {
  const trimmed = (area || '').trim();
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  const url = urlMatch ? urlMatch[0] : '';

  let label = trimmed
    .replace(/https?:\/\/[^\s]+/i, '')
    .replace(/^[-–—:,|/\s]+|[-–—:,|/\s]+$/g, '')
    .trim();

  if (!label) {
    label = 'មើលទីតាំងលើផែនទី';
  }

  const targetUrl = url || (branchName
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branchName + (label !== 'មើលទីតាំងលើផែនទី' ? ' ' + label : ''))}`
    : '');

  return {
    url: targetUrl,
    label: label,
    hasMap: Boolean(targetUrl)
  };
}

// Compute distance for all branches from userLocation
function applyDistancesToBranches() {
  if (!userLocation) return;
  branches.forEach(b => {
    if (typeof b.lat === 'number' && typeof b.lng === 'number') {
      b.distance = calculateDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
    } else {
      b.distance = null;
    }
  });
}

// Request user location with browser geolocation API
function requestUserLocation() {
  if (!('geolocation' in navigator)) {
    showNotice('ឧបករណ៍របស់អ្នកមិនគាំទ្រប្រព័ន្ធ Geolocation ទេ។');
    return;
  }

  // Immediately activate button loading and render the cyclo loading animation
  setNearbyButtonState('loading');
  showNearbyLoadingScreen();

  isLocating = true;
  const startTime = Date.now();

  navigator.geolocation.getCurrentPosition(
    position => {
      isLocating = false;
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      isNearbyActive = true;
      applyDistancesToBranches();

      // Play 1 complete cycle of our cyclo drawing animation (~3000ms / 3s) to engage the user
      const elapsed = Date.now() - startTime;
      const minDelay = Math.max(0, 3000 - elapsed);

      setTimeout(() => {
        setNearbyButtonState('active');
        dismissLocationNotice();

        // Re-filter and render branches sorted by distance
        filterBranches(getCurrentSearchKeyword(), currentFilter);
      }, minDelay);
    },
    error => {
      isLocating = false;
      setNearbyButtonState(isNearbyActive ? 'active' : 'default');

      // Restore the branch grid from the loading screen
      filterBranches(getCurrentSearchKeyword(), currentFilter);

      if (error.code === error.PERMISSION_DENIED) {
        showNotice('មិនអាចទទួលបានទីតាំងទេ។ សូមចុចអនុញ្ញាត Location (Allow) លើ Browser Settings របស់អ្នក ដើម្បីស្វែងរកសាខាជិតបំផុត។');
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        showNotice('មិនអាចស្វែងរកទីតាំងរបស់អ្នកបានទេ។ សូមពិនិត្យមើល GPS ឬសេវាអ៊ីនធឺណិត។');
      } else {
        showNotice('ការស្វែងរកទីតាំងមានការពន្យារពេល។ សូមសាកល្បងចុចម្តងទៀត។');
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

// Display the cyclo drawing loading animation in the branch grid area
function showNearbyLoadingScreen() {
  const container = document.getElementById('branchGrid');
  if (!container) return;

  // Cache-buster timestamp ensures the GIF animation always plays from frame 1
  const gifUrl = `assets/image/loading/cyclo-loading.gif?t=${Date.now()}`;

  container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-12 sm:py-16 space-y-3.5 animate-fadeIn">
      <div class="relative w-48 sm:w-60 max-w-full aspect-[4/3] flex items-center justify-center">
        <img
          src="${gifUrl}"
          alt="CYCLO Café Loading..."
          class="w-full h-auto object-contain select-none"
        />
      </div>
      <div class="space-y-1 text-center">
        <div class="flex items-center justify-center gap-2 text-xs font-medium text-zinc-900 tracking-tight">
          <span class="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse"></span>
          <span>កំពុងស្វែងរកសាខាដែលនៅជិតអ្នកបំផុត...</span>
        </div>
        <p class="text-[11px] font-light text-zinc-400">ប្រព័ន្ធកំពុងគណនាចម្ងាយ GPS និងតម្រៀបសាខាតាមចម្ងាយជិត</p>
      </div>
    </div>
  `;
}

// Find Nearby button click handler (toggles between Nearby sort and Default order)
function handleNearbyClick() {
  if (isLocating) return;

  // If already active, clicking unticks and returns to default order
  if (isNearbyActive) {
    resetNearbySort();
    return;
  }

  // Otherwise, request location and sort by nearby
  requestUserLocation();
}

// Reset nearby sorting back to default sheet order
function resetNearbySort() {
  isNearbyActive = false;
  setNearbyButtonState('default');
  filterBranches(getCurrentSearchKeyword(), currentFilter);
}

// Update Find Nearby button UI states
function setNearbyButtonState(state) {
  const btn = document.getElementById('btnFindNearby');
  const btnText = document.getElementById('nearbyBtnText');

  if (!btn || !btnText) return;

  if (state === 'loading') {
    btn.disabled = true;
    btn.title = "កំពុងស្វែងរកទីតាំង...";
    btn.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal text-zinc-500 bg-zinc-100 border border-zinc-200 cursor-wait shadow-2xs transition-all";
    btn.innerHTML = `
      <div class="w-3.5 h-3.5 border-[1.5px] border-zinc-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
      <span id="nearbyBtnText">កំពុងស្វែងរកទីតាំង...</span>
    `;
  } else if (state === 'active') {
    btn.disabled = false;
    btn.title = "ចុចម្តងទៀតដើម្បីដោះធីក (Untick) និងត្រឡប់ទៅការតម្រៀបដើម";
    btn.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-900 shadow-xs transition-all active:scale-[0.98]";
    btn.innerHTML = `
      <i data-lucide="check" class="w-3.5 h-3.5 text-white flex-shrink-0"></i>
      <span id="nearbyBtnText">ជិតអ្នកបំផុត</span>
    `;
  } else {
    // Default state
    btn.disabled = false;
    btn.title = "ស្វែងរកសាខាដែលនៅជិតអ្នកបំផុត";
    btn.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal text-zinc-700 hover:text-zinc-950 bg-white hover:bg-zinc-100/80 border border-zinc-200/90 hover:border-zinc-300 shadow-2xs transition-all active:scale-[0.98]";
    btn.innerHTML = `
      <i id="nearbyIcon" data-lucide="locate-fixed" class="w-3.5 h-3.5 text-zinc-600 flex-shrink-0"></i>
      <span id="nearbyBtnText">ស្វែងរកសាខាជិតបំផុត</span>
    `;
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Notice banner helpers
function showNotice(msg) {
  const noticeEl = document.getElementById('locationNotice');
  const noticeText = document.getElementById('noticeText');
  if (noticeEl && noticeText) {
    noticeText.textContent = msg;
    noticeEl.classList.remove('hidden');
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }
}

function dismissLocationNotice() {
  const noticeEl = document.getElementById('locationNotice');
  if (noticeEl) noticeEl.classList.add('hidden');
}

// Update total locations counter and filter indicators in the UI
function updateCounts(filteredCount, totalCount) {
  const allCountEl = document.getElementById('filterAllCount');
  if (allCountEl) allCountEl.textContent = `(${totalCount})`;

  const openCount = branches.filter(b => (b.status || '').toLowerCase() === 'open').length;
  const openCountEl = document.getElementById('filterOpenCount');
  if (openCountEl) openCountEl.textContent = `(${openCount})`;
}

function renderGrid(dataList) {
  const container = document.getElementById('branchGrid');
  if (!container) return;
  container.innerHTML = '';

  updateCounts(dataList.length, branches.length);

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
      <div class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-100/80 border border-zinc-200/70 text-[10px] text-zinc-700 font-normal">
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

    // Distance badge shown only when distance is known
    const distanceBadge = (typeof item.distance === 'number') ? `
      <span class="text-[10px] font-medium flex items-center gap-1 text-zinc-700 bg-zinc-100/90 border border-zinc-200/80 px-2 py-0.5 rounded-full shadow-2xs" title="ចម្ងាយពីអ្នក: ${item.distance.toFixed(2)} km">
        <i data-lucide="navigation-2" class="w-2.5 h-2.5 text-zinc-800 fill-zinc-800"></i>
        <span><span class="num">${formatDistance(item.distance)}</span> km</span>
      </span>
    ` : '';

    const mapInfo = getMapInfo(item.area, item.name);
    const areaContent = mapInfo.hasMap ? `
      <div class="mt-1.5">
        <a
          href="${mapInfo.url}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-[11px] font-normal text-zinc-600 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/70 hover:border-zinc-300 px-2.5 py-1 rounded-lg transition-all group shadow-xs w-fit"
          title="បើកមើលទីតាំងលើ Google Maps"
        >
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 transition-colors flex-shrink-0"></i>
          <span class="font-light">${mapInfo.label}</span>
          <i data-lucide="arrow-up-right" class="w-3 h-3 text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"></i>
        </a>
      </div>
    ` : (item.area ? `
      <p class="text-[11px] font-light text-zinc-500 leading-relaxed line-clamp-2 mt-1">${item.area}</p>
    ` : '');

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="text-sm sm:text-base font-semibold text-zinc-950 tracking-tight leading-snug">${item.name}</h3>
          <div class="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            ${distanceBadge}
            ${statusBadge}
          </div>
        </div>
        ${areaContent}
        ${promoBadge}
      </div>

      <div class="pt-3 mt-3.5 border-t border-zinc-100 flex items-center gap-2">
        <a
          href="${item.telegram}?text=${encodeURIComponent(`សួស្តី ${item.name}! ខ្ញុំចង់កម្មង់កាហ្វេដឹកជញ្ជូន...`)}"
          target="_blank"
          class="relative flex-1 h-10 rounded-xl sm:rounded-2xl bg-[#29A9EB] overflow-hidden border border-zinc-200/90 shadow-xs hover:shadow-md transition-all active:scale-[0.99] group flex items-center btn-telegram-shimmer"
        >
          <!-- Curved White Split Panel (Custom wave divider) -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L53,0 C60,0 57.5,45 59.5,75 C60.5,88 62.5,100 66,100 L0,100 Z" fill="#FFFFFF"></path>
          </svg>

          <!-- Left Text: Centered in white zone -->
          <div class="relative z-10 w-[58%] flex items-center justify-center pl-3">
            <span class="text-xs font-semibold text-zinc-600 tracking-tight">កម្មង់ Telegram</span>
          </div>

          <!-- Right Icon: Centered in blue zone with official Telegram airplane & releub-releub gleam -->
          <div class="relative z-10 w-[42%] flex items-center justify-center pr-2">
            <svg class="w-5 h-5 text-white fill-current transition-transform group-hover:scale-125 drop-shadow-xs telegram-icon-anim" viewBox="0 0 24 24">
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

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function getCurrentSearchKeyword() {
  const searchInput = document.getElementById('searchBox');
  return searchInput ? searchInput.value.toLowerCase().trim() : '';
}

function handleSearch() {
  filterBranches(getCurrentSearchKeyword(), currentFilter);
}

function setFilter(type) {
  currentFilter = type;
  const btnAll = document.getElementById('filter-all');
  const btnOpen = document.getElementById('filter-open');
  if (!btnAll || !btnOpen) return;

  const baseClasses = 'filter-btn flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[11px] transition flex items-center justify-center gap-1';
  const activeClass = `${baseClasses} font-medium bg-zinc-900 text-white shadow-xs`;
  const inactiveClass = `${baseClasses} font-light text-zinc-600 hover:text-zinc-900 hover:bg-white/80`;

  if (type === 'all') {
    btnAll.className = activeClass;
    btnOpen.className = inactiveClass;
  } else {
    btnOpen.className = activeClass;
    btnAll.className = inactiveClass;
  }

  filterBranches(getCurrentSearchKeyword(), currentFilter);
}

function filterBranches(keyword, filterType) {
  let filtered = branches.filter(b => {
    const mapInfo = getMapInfo(b.area, b.name);
    return b.name.toLowerCase().includes(keyword) ||
      b.area.toLowerCase().includes(keyword) ||
      mapInfo.label.toLowerCase().includes(keyword);
  });

  if (filterType === 'open') {
    filtered = filtered.filter(b => (b.status || '').toLowerCase() === 'open');
  }

  // Sort by distance if nearby mode is active and user location exists
  if (isNearbyActive && userLocation) {
    filtered.sort((a, b) => {
      if (typeof a.distance === 'number' && typeof b.distance === 'number') {
        return a.distance - b.distance;
      }
      if (typeof a.distance === 'number') return -1;
      if (typeof b.distance === 'number') return 1;
      return a.id - b.id;
    });
  } else {
    // Normal show: keep original sheet order
    filtered.sort((a, b) => a.id - b.id);
  }

  renderGrid(filtered);
}

// Ensure global exposure for inline HTML event handlers and JSONP callbacks
window.handleBranchesResponse = handleBranchesResponse;
window.handlePromotionsResponse = handlePromotionsResponse;
window.handleSearch = handleSearch;
window.setFilter = setFilter;
window.handleNearbyClick = handleNearbyClick;
window.resetNearbySort = resetNearbySort;
window.dismissLocationNotice = dismissLocationNotice;

// Initialize icons and data fetching cleanly
let isInitialized = false;
function initApp() {
  if (isInitialized) return;
  isInitialized = true;
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  requestSheetData('Sheet1', 'handleBranchesResponse');
  requestSheetData('Promotions', 'handlePromotionsResponse');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
