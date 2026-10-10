# googletrans-all

[![Test Implementations Matrix](https://github.com/aikenf/googletrans-all/actions/workflows/test-implementations.yml/badge.svg)](https://github.com/aikenf/googletrans-all/actions/workflows/test-implementations.yml)
[![Deploy Dashboard to GitHub Pages](https://github.com/aikenf/googletrans-all/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/aikenf/googletrans-all/actions/workflows/deploy-pages.yml)

An agentic multi-target testing harness, telemetry collector, and interactive Vite dashboard for validating and comparing **all 11 major PyPI packages and forks** of the Python `googletrans` ecosystem.

Inspired by [`aikenf/googletrans-test`](https://github.com/aikenf/googletrans-test) and [`flynn0/googletrans-curl-tester`](https://github.com/flynn0/googletrans-curl-tester).

---

## 📊 Live Dashboard

The interactive test dashboard is deployed to GitHub Pages:
👉 **[https://aikenf.github.io/googletrans-all/](https://aikenf.github.io/googletrans-all/)**

### Dashboard Features
- **Working vs. Failing Status:** Real-time test results for every implementation.
- **PyPI & Telemetry Stats:** Lifetime downloads (pepy.tech), 2026 current year downloads (pypistats.org), and last month active volume.
- **Detailed Inspection Drawer:** View import resolutions, latency (ms), async vs. sync signatures, and error diagnostics.
- **Instant Search & Filter:** Filter by API paradigm (`async` / `sync`) or test status.

---

## 📦 Evaluated Implementations

| Package | Status | Latest Release | API Paradigm | Lifetime DL (pepy) | 2026 DL (pypistats) | Last Month DL |
|---|---|---|---|---|---|---|
| [`googletrans`](https://pypi.org/project/googletrans/) | ✅ **PASS** | 4.0.2 | `async` | 98.0M | 19,253,816 | 1,748,758 |
| [`googletrans-curl`](https://pypi.org/project/googletrans-curl/) | ✅ **PASS** | 4.1.0 | `async` | 650 | 215 | 0 |
| [`googletrans-py`](https://pypi.org/project/googletrans-py/) | ✅ **PASS** | 4.0.0 | `sync` | 2.0M | 487,522 | 102,950 |
| [`googletrans-py39`](https://pypi.org/project/googletrans-py39/) | ✅ **PASS** | 4.0.2 | `sync` | 23.0k | 4,546 | 791 |
| [`googletrans-sw`](https://pypi.org/project/googletrans-sw/) | ✅ **PASS** | 4.0.1 | `sync` | 3.8k | 133 | 14 |
| [`googletrans-modified`](https://pypi.org/project/googletrans-modified/) | ✅ **PASS** | 1.1.1 | `sync` | 14.7k | 1,860 | 23 |
| [`googletrans-wheel2-py`](https://pypi.org/project/googletrans-wheel2-py/) | ✅ **PASS** | 4.0.0 | `sync` | 2.6k | 123 | 10 |
| [`py-googletrans`](https://pypi.org/project/py-googletrans/) | ❌ **FAIL** | 4.0.0 | - | 83.6k | 9,876 | 1,013 |
| [`googletrans-wheel`](https://pypi.org/project/googletrans-wheel/) | ❌ **FAIL** | 3.0.0 | - | 1.9k | 109 | 13 |
| [`googletrans-python`](https://pypi.org/project/googletrans-python/) | ❌ **FAIL** | 0.2.0 | - | 11.0k | 1,106 | 89 |
| [`googletrans-di`](https://pypi.org/project/googletrans-di/) | ❌ **FAIL** | 4.0.2 | - | 9.0k | 588 | 66 |

---

## 🛠️ Repository Layout

```
googletrans-all/
├── .github/
│   └── workflows/
│       ├── test-implementations.yml  # Daily matrix test & telemetry updater
│       └── deploy-pages.yml          # GitHub Pages Vite deployment on push
├── data/
│   ├── packages.json                 # Single source of truth for the 11 packages
│   ├── stats.json                    # Raw telemetry data (PyPI, pypistats, pepy)
│   ├── matrix_results.json           # Raw harness test results
│   └── latest_results.json           # Combined dataset consumed by agents & dashboard
├── runner/
│   ├── fetch_stats.py                # Telemetry collector
│   ├── run_matrix.py                 # Multi-target isolated test executor
│   └── test_single_target.py         # Sub-process test runner for a single target
├── dashboard/                        # Modern Vite + Vanilla JS web application
│   ├── public/
│   │   └── results.json              # Dashboard data payload
│   ├── src/
│   │   ├── main.js                   # Reactive UI rendering
│   │   └── style.css                 # Theme & layout
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   ├── sync_dashboard_data.py        # Synchronizer for test and stats datasets
│   └── dev.sh                        # Development helper script
├── requirements-harness.txt          # Runner dependencies
├── AGENTS.md                         # Agentic guide and instructions
└── README.md                         # Repository documentation
```

---

## 🚀 Quickstart & Commands

### 1. Collect Telemetry
```bash
python3 runner/fetch_stats.py
```
Fetches:
- Latest release version and upload timestamp from PyPI.
- Lifetime total downloads from pepy.tech.
- 2026 total downloads and last month downloads from pypistats.org.

### 2. Run Test Matrix
```bash
# Test all 11 packages
python3 runner/run_matrix.py

# Test a specific package
python3 runner/run_matrix.py --package googletrans-curl
```

### 3. Sync Data & Build Dashboard
```bash
python3 scripts/sync_dashboard_data.py

cd dashboard
npm install
npm run build
npm run preview
```

Or run everything with the helper script:
```bash
./scripts/dev.sh
```

---

## 🔄 CI / GitHub Actions Workflows

1. **`test-implementations.yml`**:
   - Runs on schedule (`0 5 * * *`) and `workflow_dispatch`.
   - Runs test matrix across implementations and collects latest statistics.
   - Commits updated `data/latest_results.json` and automatically triggers dashboard deployment.

2. **`deploy-pages.yml`**:
   - Runs on push to `main` and manual dispatch.
   - Builds Vite application in `dashboard/` with relative base path `./`.
   - Deploys static site to GitHub Pages using official GitHub Actions Pages deployer.

---

## 🤖 Guidelines for AI Agents

See [`AGENTS.md`](./AGENTS.md) for full architecture instructions and agentic conventions.
