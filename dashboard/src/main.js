import "./style.css";

// Resolve data url dynamically depending on base url (GitHub Pages or local dev)
const DATA_URL = `${import.meta.env.BASE_URL}results.json`;

let currentData = null;
let activeFilter = "all";
let searchQuery = "";

function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

function formatCompactNumber(num) {
  if (num === null || num === undefined) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return String(num);
}

function formatDate(isoStr) {
  if (!isoStr) return "N/A";
  try {
    const d = new Date(isoStr);
    return d.toISOString().split("T")[0];
  } catch {
    return isoStr;
  }
}

function renderSummaryCards(summary) {
  const container = document.getElementById("summary-section");
  if (!container) return;

  container.innerHTML = `
    <div class="card passed">
      <div class="card-label">Working Implementations</div>
      <div class="card-value">${summary.passed} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/ ${summary.total_packages}</span></div>
      <div class="card-subtext">${summary.pass_rate}% live test pass rate</div>
    </div>
    <div class="card failed">
      <div class="card-label">Broken / Deprecated</div>
      <div class="card-value">${summary.failed}</div>
      <div class="card-subtext">Token desync / missing dependencies</div>
    </div>
    <div class="card info">
      <div class="card-label">Lifetime Downloads</div>
      <div class="card-value">${formatCompactNumber(summary.total_downloads_lifetime)}</div>
      <div class="card-subtext">${formatNumber(summary.total_downloads_lifetime)} all-time (pepy.tech)</div>
    </div>
    <div class="card info">
      <div class="card-label">2026 Downloads</div>
      <div class="card-value">${formatCompactNumber(summary.total_downloads_2026)}</div>
      <div class="card-subtext">Current year volume (pypistats.org)</div>
    </div>
    <div class="card info">
      <div class="card-label">Last Month</div>
      <div class="card-value">${formatCompactNumber(summary.total_downloads_last_month)}</div>
      <div class="card-subtext">Active 30-day installations</div>
    </div>
  `;
}

function renderTable(packages) {
  const tbody = document.getElementById("packages-table-body");
  if (!tbody) return;

  const filtered = packages.filter((pkg) => {
    // 1. Pill Filter
    const status = pkg.test_result.status;
    const apiType = (pkg.test_result.api_type || "").toLowerCase();

    if (activeFilter === "passed" && status !== "passed") return false;
    if (activeFilter === "failed" && status === "passed") return false;
    if (activeFilter === "async" && apiType !== "async") return false;
    if (activeFilter === "sync" && apiType !== "sync") return false;

    // 2. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = pkg.name.toLowerCase().includes(q);
      const matchDesc = (pkg.description || "").toLowerCase().includes(q);
      const matchApi = apiType.includes(q);
      const matchModule = (pkg.default_module || "").toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchApi && !matchModule) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No packages match the selected criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((pkg) => {
      const isPassed = pkg.test_result.status === "passed";
      const statusBadge = isPassed
        ? `<span class="badge badge-passed">PASS</span>`
        : `<span class="badge badge-failed">FAIL</span>`;

      const apiBadge = `<span class="badge-api">${pkg.test_result.api_type || "n/a"}</span>`;
      const latency = pkg.test_result.tests?.translate_en_de?.latency_ms;
      const latencyStr = latency ? `${latency} ms` : "-";

      return `
        <tr>
          <td>${statusBadge}</td>
          <td>
            <div class="pkg-title">
              <a href="${pkg.pypi_url}" target="_blank" rel="noopener" class="pkg-name-link">${pkg.name}</a>
            </div>
            <div class="pkg-desc">${pkg.description}</div>
          </td>
          <td>
            <div class="stat-mono">v${pkg.latest_release}</div>
            <div class="stat-secondary">${formatDate(pkg.latest_release_date)}</div>
          </td>
          <td>${apiBadge}</td>
          <td>
            <div class="stat-mono">${formatCompactNumber(pkg.downloads.lifetime)}</div>
            <div class="stat-secondary">${formatNumber(pkg.downloads.lifetime)}</div>
          </td>
          <td>
            <div class="stat-mono">${formatCompactNumber(pkg.downloads.year_2026)}</div>
            <div class="stat-secondary">${formatNumber(pkg.downloads.year_2026)}</div>
          </td>
          <td>
            <div class="stat-mono">${formatCompactNumber(pkg.downloads.last_month)}</div>
            <div class="stat-secondary">${formatNumber(pkg.downloads.last_month)}</div>
          </td>
          <td class="stat-mono">${latencyStr}</td>
          <td>
            <button class="btn-details" data-pkg="${pkg.id}">Inspect</button>
          </td>
        </tr>
      `;
    })
    .join("");

  // Attach modal trigger listeners
  tbody.querySelectorAll(".btn-details").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pkgId = btn.getAttribute("data-pkg");
      const target = packages.find((p) => p.id === pkgId);
      if (target) openModal(target);
    });
  });
}

function openModal(pkg) {
  const modal = document.getElementById("modal-container");
  const modalBody = document.getElementById("modal-body");
  if (!modal || !modalBody) return;

  const isPassed = pkg.test_result.status === "passed";
  const tr = pkg.test_result;

  const translateTest = tr.tests?.translate_en_de || {};
  const detectTest = tr.tests?.detect_language || {};
  const importTest = tr.tests?.import || {};
  const pkgTest = tr.tests?.packaging || {};

  modalBody.innerHTML = `
    <div class="modal-header">
      <h3>
        ${pkg.name}
        <span class="badge ${isPassed ? "badge-passed" : "badge-failed"}">${tr.status}</span>
      </h3>
      <p style="color: var(--text-muted); margin-top: 0.25rem;">${pkg.description}</p>
    </div>

    <div class="modal-section">
      <h4>Telemetry & PyPI Metadata</h4>
      <div class="test-grid">
        <div class="test-item">
          <div class="test-item-title"><span>Latest Release</span><span>PyPI</span></div>
          <div class="test-item-content">v${pkg.latest_release} (${formatDate(pkg.latest_release_date)})</div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>Import Namespace</span><span>Python</span></div>
          <div class="test-item-content"><code>import ${tr.module_name || pkg.default_module}</code></div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>API Paradigm</span><span>Async / Sync</span></div>
          <div class="test-item-content">${tr.api_type}</div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>Total Lifetime Downloads</span><span>pepy.tech</span></div>
          <div class="test-item-content">${formatNumber(pkg.downloads.lifetime)}</div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>2026 Downloads</span><span>pypistats.org</span></div>
          <div class="test-item-content">${formatNumber(pkg.downloads.year_2026)} (w/ mirrors: ${formatNumber(pkg.downloads.year_2026_with_mirrors)})</div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>Last Month Downloads</span><span>pypistats.org</span></div>
          <div class="test-item-content">${formatNumber(pkg.downloads.last_month)} (last week: ${formatNumber(pkg.downloads.last_week)})</div>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <h4>Harness Test Runs</h4>
      <div class="test-grid">
        <div class="test-item">
          <div class="test-item-title"><span>Packaging / Install</span><span class="badge ${pkgTest.status === "passed" ? "badge-passed" : "badge-failed"}">${pkgTest.status}</span></div>
          <div class="test-item-content">${pkgTest.details || "-"}</div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>Import Resolution</span><span class="badge ${importTest.status === "passed" ? "badge-passed" : "badge-failed"}">${importTest.status}</span></div>
          <div class="test-item-content">${importTest.details || "-"}</div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>EN -> DE Translation</span><span class="badge ${translateTest.status === "passed" ? "badge-passed" : "badge-failed"}">${translateTest.status}</span></div>
          <div class="test-item-content">${translateTest.result ? `"${translateTest.result}" (${translateTest.latency_ms} ms)` : "-"}</div>
        </div>
        <div class="test-item">
          <div class="test-item-title"><span>Language Detection</span><span class="badge ${detectTest.status === "passed" ? "badge-passed" : "badge-failed"}">${detectTest.status}</span></div>
          <div class="test-item-content">${detectTest.result ? `Detected: ${detectTest.result} (${detectTest.latency_ms} ms)` : (detectTest.details || "-")}</div>
        </div>
      </div>
    </div>

    ${
      tr.error_summary
        ? `
      <div class="modal-section">
        <h4>Diagnosis & Error Output</h4>
        <div class="code-block">${tr.error_summary}</div>
      </div>
    `
        : ""
    }

    <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
      <a href="${pkg.pypi_url}" target="_blank" rel="noopener" class="btn btn-github">View on PyPI</a>
      <a href="${pkg.pepy_url}" target="_blank" rel="noopener" class="btn btn-github">pepy.tech Stats</a>
      <a href="${pkg.pypistats_url}" target="_blank" rel="noopener" class="btn btn-github">pypistats.org Stats</a>
    </div>
  `;

  modal.classList.remove("hidden");
}

function initEventListeners() {
  // Modal close
  const closeBtn = document.getElementById("modal-close");
  const modal = document.getElementById("modal-container");
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  }

  // Filter Pills
  const pillsContainer = document.getElementById("filter-pills");
  if (pillsContainer) {
    pillsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill");
      if (!btn) return;
      pillsContainer.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter") || "all";
      if (currentData) renderTable(currentData.packages);
    });
  }

  // Search input
  const searchInput = document.getElementById("package-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      if (currentData) renderTable(currentData.packages);
    });
  }
}

async function loadData() {
  const tsIndicator = document.getElementById("timestamp-indicator");
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${DATA_URL}`);
    const data = await response.json();
    currentData = data;

    renderSummaryCards(data.summary);
    renderTable(data.packages);

    if (tsIndicator) {
      const date = new Date(data.generated_at);
      tsIndicator.textContent = `Updated: ${date.toLocaleString()}`;
    }
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    if (tsIndicator) tsIndicator.textContent = "Failed to load results.json";
    const tbody = document.getElementById("packages-table-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--status-failed); padding: 2rem;">Error loading data: ${err.message}</td></tr>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  loadData();
});
