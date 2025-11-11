const DATA_URL = './data/mock_listings.json';

const CONNECTOR_SOURCES = [
  {
    id: 'sahibinden',
    name: 'Sahibinden',
    description: 'Türkiye’nin en büyük ilan platformu. Resmî API yok; proxy/scraper gerektirir.',
    sampleUrl: 'https://api.sizin-domen.com/sahibinden/listings',
  },
  {
    id: 'hepsiemlak',
    name: 'Hepsiemlak',
    description: 'Hepsiburada ekosistemindeki emlak listings API’nizle senkronize olur.',
    sampleUrl: 'https://api.sizin-domen.com/hepsiemlak/listings',
  },
  {
    id: 'zingat',
    name: 'Zingat',
    description: 'Bölgede fiyat trendleri sunar. JSON formatında ilan verisi beklenir.',
    sampleUrl: 'https://api.sizin-domen.com/zingat/listings',
  },
  {
    id: 'emlakjet',
    name: 'Emlakjet',
    description: 'Entegrasyon için OAuth/Token kullanabilirsiniz.',
    sampleUrl: 'https://api.sizin-domen.com/emlakjet/listings',
  },
  {
    id: 'coldwell',
    name: 'Coldwell Banker TR',
    description: 'Ofis bazlı portföyler için kurumsal API bağlantısı.',
    sampleUrl: 'https://api.sizin-domen.com/coldwell/listings',
  },
  {
    id: 'remax',
    name: 'RE/MAX Türkiye',
    description: 'Franchise ofislerinden gelen ilanlar için veri köprüsü.',
    sampleUrl: 'https://api.sizin-domen.com/remax/listings',
  },
  {
    id: 'century21',
    name: 'Century 21 Türkiye',
    description: 'Yetkili broker API anahtarıyla otomatik eşitleme.',
    sampleUrl: 'https://api.sizin-domen.com/century21/listings',
  },
  {
    id: 'flatfy',
    name: 'Flatfy Türkiye',
    description: 'Agrega edilmiş ilan verilerini çekmek için JSON endpoint.',
    sampleUrl: 'https://api.sizin-domen.com/flatfy/listings',
  },
  {
    id: 'tremglobal',
    name: 'Trem Global',
    description: 'Lüks projeler için tekil API bağlantısı.',
    sampleUrl: 'https://api.sizin-domen.com/tremglobal/listings',
  },
  {
    id: 'hurriyet',
    name: 'Hürriyet Emlak',
    description: 'Kapanmış olsa bile birçok veri sağlayıcı hâlâ bu formatı kullanıyor.',
    sampleUrl: 'https://api.sizin-domen.com/hurriyet/listings',
  },
];

const state = {
  rawListings: [],
  filteredListings: [],
  filters: {
    city: '',
    district: '',
    neighbourhood: '',
    property_type: '',
    listing_type: '',
    min_size: '',
    max_size: '',
    min_rooms: '',
    max_rooms: '',
    min_age: '',
    max_age: '',
  },
};

const connectors = CONNECTOR_SOURCES.map((source) => ({
  ...source,
  endpoint: '',
  apiKey: '',
  headersText: '',
  headers: undefined,
  status: 'disconnected',
  message: 'Henüz bağlanmadı.',
  lastSync: null,
}));

const ui = {
  filterForm: document.querySelector('#filters-form'),
  filterFields: document.querySelectorAll('[data-filter-key]'),
  actionButtons: document.querySelectorAll('[data-action]'),
  messageBox: document.querySelector('#message-box'),
  summaryList: document.querySelector('#summary-list'),
  chartCanvas: document.querySelector('#trend-chart'),
  recommendationBadge: document.querySelector('#recommendation-badge'),
  metricList: document.querySelector('#metric-list'),
  insightList: document.querySelector('#insight-list'),
  mapCard: document.querySelector('#map-card'),
  tabButtons: document.querySelectorAll('[data-tab-target]'),
  tabViews: document.querySelectorAll('[data-tab-view]'),
  connectorList: document.querySelector('#connector-list'),
  connectorLog: document.querySelector('#connector-log'),
};

let chartInstance = null;
let mapInstance = null;
let mapMarker = null;

async function loadData() {
  showMessage('Veriler yükleniyor…', 'info');
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Veri seti yüklenemedi (${response.status})`);
    }
    const data = await response.json();
    state.rawListings = data.map((row) => ({
      ...row,
      source: row.source ?? 'Mock Veri',
      listing_date: row.listing_date ? new Date(row.listing_date) : null,
    }));
    populateFilterOptions();
    applyFilters();
    showMessage('Veriler yüklendi. Filtreleri kullanarak analizi güncelleyebilirsiniz.', 'success');
  } catch (error) {
    showMessage(`Hata: ${error.message}`, 'error');
    console.error(error);
  }
}

function populateFilterOptions() {
  const selectFields = ['city', 'district', 'neighbourhood', 'property_type'];
  selectFields.forEach((key) => {
    const select = document.querySelector(`select[data-filter-key="${key}"]`);
    if (!select) return;
    const currentValue = state.filters[key] ?? '';
    const values = Array.from(new Set(state.rawListings.map((item) => item[key]).filter(Boolean))).sort();
    select.innerHTML =
      '<option value="">Tümü</option>' + values.map((value) => `<option value="${value}">${value}</option>`).join('');
    if (values.includes(currentValue)) {
      select.value = currentValue;
    }
  });
}

function showMessage(text, variant) {
  if (!ui.messageBox) return;
  ui.messageBox.textContent = text;
  const classes = ['message'];
  if (variant === 'error') classes.push('error');
  if (variant === 'success') classes.push('success');
  ui.messageBox.className = classes.join(' ');
}

function applyFilters() {
  const filtered = state.rawListings.filter((item) => {
    if (state.filters.city && item.city !== state.filters.city) return false;
    if (state.filters.district && item.district !== state.filters.district) return false;
    if (state.filters.neighbourhood && item.neighbourhood !== state.filters.neighbourhood) return false;
    if (state.filters.property_type && item.property_type !== state.filters.property_type) return false;
    if (state.filters.listing_type && item.listing_type !== state.filters.listing_type) return false;

    const numericFilters = [
      ['min_size', 'max_size', 'size_m2'],
      ['min_rooms', 'max_rooms', 'rooms'],
      ['min_age', 'max_age', 'building_age'],
    ];

    return numericFilters.every(([minKey, maxKey, dataKey]) => {
      const min = Number.parseFloat(state.filters[minKey]);
      const max = Number.parseFloat(state.filters[maxKey]);
      if (!Number.isNaN(min) && item[dataKey] < min) return false;
      if (!Number.isNaN(max) && item[dataKey] > max) return false;
      return true;
    });
  });

  state.filteredListings = filtered;
  renderAnalysis();
}

function renderAnalysis() {
  if (state.filteredListings.length === 0) {
    showMessage('Bu filtrelerle eşleşen veri bulunamadı. Filtreleri genişletip tekrar deneyin.', 'error');
    updateSummary(null);
    updateMetrics(null);
    updateChart([]);
    updateInsights([]);
    updateMap();
    return;
  }

  showMessage(`${state.filteredListings.length} kayıt analiz edildi.`, 'success');

  const summary = computeSummary(state.filteredListings);
  updateSummary(summary);

  const timeSeries = computeTimeSeries(state.filteredListings);
  updateChart(timeSeries);

  const metrics = computeYieldMetrics(state.filteredListings);
  updateMetrics(metrics);
  updateInsights(buildInsights(summary, metrics));
  updateMap(state.filters.city, state.filters.neighbourhood);
}

function computeSummary(listings) {
  const sale = listings.filter((item) => item.listing_type === 'sale' && item.price);
  const rent = listings.filter((item) => item.listing_type === 'rent' && item.rent);

  const average = (arr, key, divisor) => {
    if (arr.length === 0) return null;
    const numerator = arr.reduce((sum, item) => sum + Number(item[key]), 0);
    return numerator / (divisor ? arr.reduce((sum, item) => sum + (item[divisor] || 0), 0) : arr.length);
  };

  return {
    listings: listings.length,
    average_sale_per_m2: average(sale, 'price', 'size_m2'),
    average_rent_per_m2: average(rent, 'rent', 'size_m2'),
  };
}

function computeTimeSeries(listings) {
  const grouped = new Map();
  listings
    .filter((item) => item.listing_date instanceof Date && !Number.isNaN(item.listing_date.valueOf()))
    .forEach((item) => {
      const key = `${item.listing_date.getFullYear()}-${String(item.listing_date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped.has(key)) {
        grouped.set(key, { saleValues: [], rentValues: [] });
      }
      const entry = grouped.get(key);
      if (item.listing_type === 'sale' && item.price) {
        entry.saleValues.push(item.price);
      }
      if (item.listing_type === 'rent' && item.rent) {
        entry.rentValues.push(item.rent);
      }
    });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, value]) => ({
      period,
      sale: averageArray(value.saleValues),
      rent: averageArray(value.rentValues),
    }));
}

function averageArray(values) {
  if (!values || values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeYieldMetrics(listings) {
  const sale = listings.filter((item) => item.listing_type === 'sale' && item.price);
  const rent = listings.filter((item) => item.listing_type === 'rent' && item.rent);

  const avgSale = averageArray(sale.map((item) => item.price));
  const avgRent = averageArray(rent.map((item) => item.rent));

  let yieldPercent = null;
  if (avgSale && avgRent) {
    yieldPercent = (avgRent * 12 * 100) / avgSale;
  }

  const saleWithDates = sale.filter((item) => item.listing_date instanceof Date).sort((a, b) => a.listing_date - b.listing_date);
  let cagr = null;
  if (saleWithDates.length >= 2) {
    const earliest = saleWithDates[0];
    const latest = saleWithDates[saleWithDates.length - 1];
    const years = Math.max((latest.listing_date - earliest.listing_date) / (365.25 * 24 * 60 * 60 * 1000), 1);
    if (earliest.price > 0) {
      cagr = (Math.pow(latest.price / earliest.price, 1 / years) - 1) * 100;
    }
  }

  let index = null;
  let recommendation = 'HOLD';

  if (yieldPercent !== null && cagr !== null) {
    index = (yieldPercent * 0.5 + cagr * 0.5).toFixed(2);
    recommendation = parseFloat(index) >= 12 ? 'BUY' : parseFloat(index) <= 5 ? 'RENT' : 'HOLD';
  } else if (yieldPercent !== null) {
    index = yieldPercent.toFixed(2);
    recommendation = yieldPercent >= 12 ? 'BUY' : 'HOLD';
  } else if (cagr !== null) {
    index = cagr.toFixed(2);
    recommendation = cagr >= 8 ? 'BUY' : 'HOLD';
  }

  return {
    average_sale_price: avgSale,
    average_rent_price: avgRent,
    rental_yield_percent: yieldPercent,
    five_year_cagr_percent: cagr,
    investment_index: index !== null ? Number(index) : null,
    recommendation,
  };
}

function buildInsights(summary, metrics) {
  const insights = [
    {
      title: 'Piyasa Aktivitesi',
      detail:
        summary.listings > 0
          ? `${summary.listings} ilan temel alınarak analiz yapıldı.`
          : 'Yeterli veri bulunamadı.',
    },
  ];

  if (summary.average_sale_per_m2) {
    insights.push({
      title: 'Satış Fiyatları',
      detail: `Metrekare başına ortalama satış fiyatı ${formatCurrency(summary.average_sale_per_m2)} seviyesinde.`,
    });
  }

  if (summary.average_rent_per_m2) {
    insights.push({
      title: 'Kira Piyasası',
      detail: `Metrekare başına ortalama kira ${formatCurrency(summary.average_rent_per_m2)}.`,
    });
  }

  if (metrics.rental_yield_percent !== null) {
    insights.push({
      title: 'Kira Getirisi',
      detail: `Yıllık brüt kira getirisi ${metrics.rental_yield_percent.toFixed(2)}% olarak hesaplandı.`,
      recommendation: metrics.rental_yield_percent >= 12 ? 'BUY' : null,
    });
  }

  if (metrics.five_year_cagr_percent !== null) {
    insights.push({
      title: 'Fiyat Büyümesi',
      detail: `Beş yıllık bileşik büyüme oranı ${metrics.five_year_cagr_percent.toFixed(2)}%.`,
      recommendation: metrics.five_year_cagr_percent >= 8 ? 'BUY' : null,
    });
  }

  insights.push({
    title: 'Yatırım Değerlendirmesi',
    detail: 'Çekirdek parametreler değerlendirilerek yatırım skoru hesaplandı.',
    recommendation: metrics.recommendation,
  });

  return insights;
}

function updateSummary(summary) {
  if (!ui.summaryList) return;
  if (!summary) {
    ui.summaryList.innerHTML = '';
    return;
  }

  const items = [
    { label: 'İlan Sayısı', value: summary.listings },
    {
      label: 'Ortalama Satış / m²',
      value: summary.average_sale_per_m2 ? formatCurrency(summary.average_sale_per_m2) : '—',
    },
    {
      label: 'Ortalama Kira / m²',
      value: summary.average_rent_per_m2 ? formatCurrency(summary.average_rent_per_m2) : '—',
    },
  ];

  ui.summaryList.innerHTML = items
    .map(
      (item) => `
      <div class="metric-card">
        <dt>${item.label}</dt>
        <dd>${item.value}</dd>
      </div>
    `,
    )
    .join('');
}

function updateChart(series) {
  if (!ui.chartCanvas) return;
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const container = ui.chartCanvas.parentElement;
  let overlay = container.querySelector('.chart-empty');

  if (!series || series.length === 0) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'message chart-empty';
      container.appendChild(overlay);
    }
    overlay.textContent = 'Grafik oluşturmak için yeterli zaman serisi verisi yok.';
    ui.chartCanvas.style.display = 'none';
    return;
  }

  if (overlay) {
    overlay.remove();
  }
  ui.chartCanvas.style.display = 'block';

  const ctx = ui.chartCanvas.getContext('2d');
  const labels = series.map((item) => item.period);
  const saleData = series.map((item) => item.sale);
  const rentData = series.map((item) => item.rent);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Ortalama Satış Fiyatı',
          data: saleData,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          tension: 0.35,
          spanGaps: true,
        },
        {
          label: 'Ortalama Kira',
          data: rentData,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.12)',
          tension: 0.35,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value ? formatCurrency(value) : 'Veri yok'}`;
            },
          },
        },
        legend: {
          labels: { font: { size: 12 } },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatCurrency(value),
            font: { size: 11 },
          },
        },
        x: {
          ticks: { font: { size: 11 } },
        },
      },
    },
  });
}

function updateMetrics(metrics) {
  if (!ui.metricList || !ui.recommendationBadge) return;

  if (!metrics) {
    ui.metricList.innerHTML = '';
    ui.recommendationBadge.textContent = '—';
    ui.recommendationBadge.className = 'tag';
    return;
  }

  const metricItems = [
    { label: 'Ortalama Satış Fiyatı', value: metrics.average_sale_price, format: formatCurrency },
    { label: 'Ortalama Aylık Kira', value: metrics.average_rent_price, format: formatCurrency },
    { label: 'Brüt Kira Getirisi', value: metrics.rental_yield_percent, format: formatPercent },
    { label: '5Y CAGR', value: metrics.five_year_cagr_percent, format: formatPercent },
    { label: 'Yatırım Endeksi', value: metrics.investment_index, format: (value) => (value ? value.toFixed(2) : '—') },
  ];

  ui.metricList.innerHTML = metricItems
    .map(
      (item) => `
    <div class="metric-card">
      <dt>${item.label}</dt>
      <dd>${item.value !== null && item.value !== undefined ? item.format(item.value) : '—'}</dd>
    </div>
  `,
    )
    .join('');

  ui.recommendationBadge.textContent = metrics.recommendation ?? '—';
  ui.recommendationBadge.className = `tag ${
    metrics.recommendation === 'BUY' ? '' : metrics.recommendation === 'RENT' ? 'error' : ''
  }`;
}

function updateInsights(insights) {
  if (!ui.insightList) return;
  if (!insights || insights.length === 0) {
    ui.insightList.innerHTML = '<li class="message">Sunuş için içgörü üretilemedi.</li>';
    return;
  }

  ui.insightList.innerHTML = insights
    .map(
      (insight) => `
      <li class="insight-item">
        <h3>${insight.title}</h3>
        <p>${insight.detail}</p>
        ${insight.recommendation ? `<span class="tag">Öneri: ${insight.recommendation}</span>` : ''}
      </li>
    `,
    )
    .join('');
}

function updateMap(city, neighbourhood) {
  if (!ui.mapCard) return;
  const mapElement = ui.mapCard.querySelector('#map');
  if (!mapElement) return;

  const coordinates = {
    istanbul: [41.015137, 28.97953],
    ankara: [39.925533, 32.866287],
    izmir: [38.423733, 27.142826],
  };

  const center = coordinates[(city || '').toLowerCase()] ?? coordinates.istanbul;

  if (!mapInstance) {
    mapInstance = L.map('map', { zoomControl: true, attributionControl: false }).setView(center, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapInstance);
  } else {
    mapInstance.setView(center, 12);
  }

  const markerText = neighbourhood || city || 'Lokasyon seçilmedi';

  if (!mapMarker) {
    mapMarker = L.marker(center, { riseOnHover: true }).addTo(mapInstance).bindPopup(markerText);
  } else {
    mapMarker.setLatLng(center).bindPopup(markerText);
  }
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
}

function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)}%`;
}

function registerEventListeners() {
  ui.filterFields.forEach((field) => {
    field.addEventListener('change', (event) => {
      const { filterKey } = event.target.dataset;
      state.filters[filterKey] = event.target.value;
      applyFilters();
    });
  });

  ui.actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'sale') {
        state.filters.listing_type = 'sale';
      } else if (button.dataset.action === 'rent') {
        state.filters.listing_type = 'rent';
      } else {
        state.filters.listing_type = '';
      }

      applyFilters();
    });
  });

  ui.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activateTab(button.dataset.tabTarget);
    });
  });

  if (ui.connectorList) {
    ui.connectorList.addEventListener('input', (event) => {
      const field = event.target.dataset.connectorField;
      if (!field) return;
      const card = event.target.closest('[data-connector]');
      if (!card) return;
      const connector = connectors.find((item) => item.id === card.dataset.connector);
      if (!connector) return;
      handleConnectorFieldUpdate(connector, field, event.target);
    });

    ui.connectorList.addEventListener('click', (event) => {
      const action = event.target.dataset.connectorAction;
      if (!action) return;
      const card = event.target.closest('[data-connector]');
      if (!card) return;
      const connector = connectors.find((item) => item.id === card.dataset.connector);
      if (!connector) return;
      if (action === 'test') {
        testConnector(connector);
      } else if (action === 'sync') {
        syncConnector(connector);
      }
    });
  }
}

function activateTab(target) {
  ui.tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tabTarget === target);
  });
  ui.tabViews.forEach((view) => {
    view.classList.toggle('active', view.dataset.tabView === target);
  });
}

function handleConnectorFieldUpdate(connector, field, element) {
  const value = element.value.trim();
  if (field === 'endpoint') {
    connector.endpoint = value;
  } else if (field === 'apiKey') {
    connector.apiKey = value;
  } else if (field === 'headers') {
    connector.headersText = value;
    if (!value) {
      connector.headers = undefined;
      element.classList.remove('input-error');
    } else {
      try {
        connector.headers = JSON.parse(value);
        element.classList.remove('input-error');
      } catch {
        element.classList.add('input-error');
      }
    }
  }
}

function renderConnectors() {
  if (!ui.connectorList) return;
  ui.connectorList.innerHTML = connectors
    .map((connector) => {
      const statusClass =
        connector.status === 'connected'
          ? 'connected'
          : connector.status === 'error'
          ? 'error'
          : connector.status === 'connecting'
          ? 'connecting'
          : '';
      const statusText =
        connector.status === 'connected'
          ? 'Bağlı'
          : connector.status === 'error'
          ? 'Hata'
          : connector.status === 'connecting'
          ? 'Bağlanıyor'
          : 'Bağlı değil';
      const headersText = connector.headersText ?? '';
      const messageClass =
        connector.status === 'connected'
          ? 'connector-status success'
          : connector.status === 'error'
          ? 'connector-status error'
          : 'connector-status';
      return `
      <div class="connector-card" data-connector="${connector.id}">
        <div class="connector-header">
          <h3>${connector.name}</h3>
          <span class="status-pill ${statusClass}">${statusText}</span>
        </div>
        <p class="card-description">${connector.description}</p>
        <div class="connector-fields">
          <label>
            API Endpoint
            <input type="url" placeholder="${connector.sampleUrl}" value="${connector.endpoint ?? ''}" data-connector-field="endpoint" />
          </label>
          <label>
            API Anahtarı / Token (opsiyonel)
            <input type="text" placeholder="Bearer .... veya Basic ...." value="${connector.apiKey ?? ''}" data-connector-field="apiKey" />
          </label>
          <label>
            Ek Başlıklar (JSON, opsiyonel)
            <textarea rows="2" data-connector-field="headers" class="${headersText && !connector.headers ? 'input-error' : ''}">${headersText}</textarea>
          </label>
        </div>
        <div class="connector-actions">
          <button type="button" class="btn btn-outline" data-connector-action="test">Test Et</button>
          <button type="button" class="btn btn-primary" data-connector-action="sync">Veri Çek</button>
        </div>
        <div class="${messageClass}">
          <strong>Durum:</strong> ${connector.message}
          ${connector.lastSync ? `<br /><strong>Son Senkron:</strong> ${formatTimestamp(connector.lastSync)}` : ''}
        </div>
      </div>
    `;
    })
    .join('');
}

function formatTimestamp(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('tr-TR');
}

function setConnectorStatus(connector, status, message, options = {}) {
  connector.status = status;
  connector.message = message;
  if (options.lastSync) {
    connector.lastSync = options.lastSync;
  }
  renderConnectors();
}

function logConnectorEvent(message) {
  if (!ui.connectorLog) return;
  const entry = document.createElement('div');
  entry.className = 'connector-log-entry';
  const time = document.createElement('time');
  time.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  entry.appendChild(time);
  entry.append(message);
  ui.connectorLog.prepend(entry);
  while (ui.connectorLog.children.length > 50) {
    ui.connectorLog.removeChild(ui.connectorLog.lastChild);
  }
}

function buildHeaders(connector) {
  const headers = {};
  if (connector.apiKey) {
    if (/^bearer\s+/i.test(connector.apiKey)) {
      headers.Authorization = connector.apiKey;
    } else {
      headers.Authorization = `Bearer ${connector.apiKey}`;
    }
  }
  if (connector.headers && typeof connector.headers === 'object') {
    Object.assign(headers, connector.headers);
  }
  return headers;
}

async function requestConnectorData(connector) {
  if (!connector.endpoint) {
    throw new Error('Önce geçerli bir API endpoint girin.');
  }

  const response = await fetch(connector.endpoint, {
    method: 'GET',
    headers: buildHeaders(connector),
  });

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  if (!contentType.includes('json')) {
    throw new Error(`JSON yanıt bekleniyordu ancak "${contentType}" alındı.`);
  }

  const payload = await response.json();
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.results)
    ? payload.results
    : Array.isArray(payload.items)
    ? payload.items
    : null;

  if (!records) {
    throw new Error('Veri dizisi bulunamadı. `data`, `results` veya `items` anahtarlarını kontrol edin.');
  }

  return { payload, records };
}

async function testConnector(connector) {
  try {
    setConnectorStatus(connector, 'connecting', 'Bağlantı test ediliyor…');
    const { records } = await requestConnectorData(connector);
    setConnectorStatus(connector, 'connected', `Bağlantı başarılı. ${records.length} kayıt döndü (kaydedilmedi).`);
    logConnectorEvent(`${connector.name}: Test başarılı, ${records.length} kayıt.`);
  } catch (error) {
    console.error(error);
    setConnectorStatus(connector, 'error', `Bağlantı başarısız: ${error.message}`);
    logConnectorEvent(`${connector.name}: Hata - ${error.message}`);
  }
}

async function syncConnector(connector) {
  try {
    setConnectorStatus(connector, 'connecting', 'Veriler çekiliyor ve analiz ediliyor…');
    const { records } = await requestConnectorData(connector);
    const normalized = records
      .map((record) => normalizeExternalListing(record, connector.name))
      .filter((item) => item !== null);
    const inserted = mergeListings(normalized);
    setConnectorStatus(
      connector,
      'connected',
      `${records.length} kayıt alındı, ${inserted} yeni kayıt analize eklendi.`,
      { lastSync: new Date() },
    );
    logConnectorEvent(`${connector.name}: ${records.length} kayıt alındı, ${inserted} yeni kayıt eklendi.`);
    populateFilterOptions();
    applyFilters();
  } catch (error) {
    console.error(error);
    setConnectorStatus(connector, 'error', `Senkronizasyon başarısız: ${error.message}`);
    logConnectorEvent(`${connector.name}: Hata - ${error.message}`);
  }
}

function normalizeExternalListing(listing, sourceName) {
  const city = extractField(listing, ['city', 'City', 'il', 'province']);
  const district = extractField(listing, ['district', 'District', 'ilce', 'county']);
  const neighbourhood = extractField(listing, ['neighbourhood', 'Neighborhood', 'mahalle', 'quarter']);
  const propertyType = extractField(listing, ['property_type', 'type', 'category']);
  const listingTypeRaw = (extractField(listing, ['listing_type', 'sale_type', 'status']) || '').toString().toLowerCase();

  const listingType =
    listingTypeRaw.includes('rent') || listingTypeRaw.includes('kir') ? 'rent' : listingTypeRaw.includes('sale') || listingTypeRaw.includes('sat') ? 'sale' : null;

  const size = parseNumber(extractField(listing, ['size_m2', 'size', 'grossSize', 'netSize']));
  const rooms = parseRoomValue(extractField(listing, ['rooms', 'room_count', 'roomsTotal']));
  const age = parseNumber(extractField(listing, ['building_age', 'age', 'construction_year']));
  const price = parseNumber(extractField(listing, ['price', 'salePrice', 'price_value'])) || null;
  const rent = parseNumber(extractField(listing, ['rent', 'monthly_rent', 'rentPrice'])) || null;
  const listingDateValue = extractField(listing, ['listing_date', 'published_at', 'date', 'created_at']);
  const listingDate = listingDateValue ? new Date(listingDateValue) : null;

  if (!city || !district || !propertyType || !listingType) {
    return null;
  }

  return {
    city,
    district,
    neighbourhood: neighbourhood ?? '',
    property_type: propertyType,
    listing_type: listingType,
    size_m2: size ?? null,
    rooms: rooms ?? null,
    building_age: age ?? null,
    price: listingType === 'sale' ? price : null,
    rent: listingType === 'rent' ? rent : null,
    listing_date: listingDate && !Number.isNaN(listingDate.valueOf()) ? listingDate : null,
    source: sourceName,
  };
}

function extractField(record, keys) {
  if (!record || typeof record !== 'object') return undefined;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      return record[key];
    }
    const lowerKey = key.toLowerCase();
    const matchKey = Object.keys(record).find((candidate) => candidate.toLowerCase() === lowerKey);
    if (matchKey && record[matchKey] !== undefined && record[matchKey] !== null && record[matchKey] !== '') {
      return record[matchKey];
    }
  }
  return undefined;
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const normalized = typeof value === 'string' ? value.replace(/[^0-9.,-]/g, '').replace(',', '.') : value;
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseRoomValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/(\d+)(?:\s*\+\s*\d+)?/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  return null;
}

function mergeListings(newListings) {
  const keyFor = (listing) =>
    [
      listing.city,
      listing.district,
      listing.neighbourhood,
      listing.property_type,
      listing.listing_type,
      listing.size_m2,
      listing.rooms,
      listing.building_age,
      listing.price,
      listing.rent,
      listing.listing_date ? listing.listing_date.toISOString() : '',
      listing.source,
    ]
      .map((part) => (part ?? '').toString().toLowerCase())
      .join('|');

  const existingKeys = new Set(state.rawListings.map(keyFor));
  let added = 0;

  newListings.forEach((listing) => {
    const normalizedListing = {
      ...listing,
      listing_date: listing.listing_date ? new Date(listing.listing_date) : null,
    };
    const key = keyFor(normalizedListing);
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      state.rawListings.push(normalizedListing);
      added += 1;
    }
  });

  return added;
}

function initialize() {
  renderConnectors();
  registerEventListeners();
  activateTab('analytics');
  loadData();
}

initialize();

