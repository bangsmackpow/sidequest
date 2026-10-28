export function renderAppLayout(content: string, title = "SDVOSB Federal Capture Platform") {
  return `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950 text-slate-100 theme-light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Sidequest GovTech</title>
  <meta name="description" content="SAM.gov SDVOSB Contract Capture, Compliance & Proposal Lifecycle Platform">
  <meta name="theme-color" id="meta-theme-color" content="#f8fafc">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Sidequest">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/icon-192.svg">
  <script>
    (function() {
      try {
        var savedTheme = localStorage.getItem("sidequest_theme") || "light";
        var root = document.documentElement;
        if (savedTheme === "dark") {
          root.classList.remove("theme-light");
          root.classList.add("theme-dark");
        } else {
          root.classList.remove("theme-dark");
          root.classList.add("theme-light");
        }
      } catch (e) {}
    })();
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    .badge-sat {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
    }
    .badge-sdvosb {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
    }
    .kanban-col {
      min-height: 480px;
      max-height: calc(100vh - 185px);
    }
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #020617; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }

    /* ==========================================================================
       LIGHT MODE (DEFAULT) THEME OVERRIDES
       ========================================================================== */
    html.theme-light,
    html.theme-light body {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
    }
    html.theme-light ::-webkit-scrollbar-track { background: #e2e8f0; }
    html.theme-light ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
    html.theme-light ::-webkit-scrollbar-thumb:hover { background: #64748b; }

    /* Primary Card, Header & Modal Surfaces */
    html.theme-light .bg-slate-900,
    html.theme-light .bg-slate-900\\/90,
    html.theme-light .bg-slate-900\\/80,
    html.theme-light .bg-slate-900\\/60,
    html.theme-light .bg-slate-900\\/40 {
      background-color: #ffffff !important;
      box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
    }
    /* Page Wells, Kanban Columns & Code Blocks */
    html.theme-light .bg-slate-950,
    html.theme-light .bg-slate-950\\/90,
    html.theme-light .bg-slate-950\\/80,
    html.theme-light .bg-slate-950\\/70,
    html.theme-light .bg-slate-950\\/60,
    html.theme-light .bg-slate-950\\/50 {
      background-color: #f8fafc !important;
    }
    /* Inputs, Secondary Buttons & Badges */
    html.theme-light .bg-slate-800,
    html.theme-light .bg-slate-800\\/80,
    html.theme-light .bg-slate-800\\/70,
    html.theme-light .bg-slate-800\\/60,
    html.theme-light .bg-slate-800\\/40 {
      background-color: #f1f5f9 !important;
    }
    html.theme-light .hover\\:bg-slate-800:hover,
    html.theme-light .hover\\:bg-slate-700:hover,
    html.theme-light .hover\\:bg-slate-800\\/60:hover {
      background-color: #e2e8f0 !important;
    }
    /* Borders & Dividers */
    html.theme-light .border-slate-800,
    html.theme-light .border-slate-800\\/80,
    html.theme-light .border-slate-700,
    html.theme-light .border-slate-700\\/60,
    html.theme-light .divide-slate-800 > :not([hidden]) ~ :not([hidden]),
    html.theme-light .divide-slate-800\\/60 > :not([hidden]) ~ :not([hidden]) {
      border-color: #cbd5e1 !important;
    }
    /* Typography */
    html.theme-light .text-white:not(.bg-indigo-600):not(.bg-emerald-600):not(.bg-rose-600):not(.bg-cyan-600):not(.bg-amber-600),
    html.theme-light .text-slate-100,
    html.theme-light .text-slate-200 {
      color: #0f172a !important;
    }
    html.theme-light .text-slate-300 {
      color: #1e293b !important;
    }
    html.theme-light .text-slate-400 {
      color: #475569 !important;
    }
    html.theme-light .text-slate-500 {
      color: #64748b !important;
    }
    /* Semantic Accent Readability in Light Mode */
    html.theme-light .badge-sat {
      background: rgba(16, 185, 129, 0.14);
      border-color: rgba(5, 150, 105, 0.45);
      color: #047857 !important;
    }
    html.theme-light .badge-sdvosb {
      background: rgba(245, 158, 11, 0.16);
      border-color: rgba(217, 119, 6, 0.45);
      color: #b45309 !important;
    }
    html.theme-light .text-amber-400,
    html.theme-light .text-amber-300 { color: #b45309 !important; }
    html.theme-light .text-emerald-400,
    html.theme-light .text-emerald-300 { color: #047857 !important; }
    html.theme-light .text-cyan-400,
    html.theme-light .text-cyan-300 { color: #0e7490 !important; }
    html.theme-light .text-blue-400,
    html.theme-light .text-blue-300 { color: #1d4ed8 !important; }
    html.theme-light .text-purple-400,
    html.theme-light .text-purple-300 { color: #6d28d9 !important; }
    html.theme-light .text-fuchsia-400,
    html.theme-light .text-fuchsia-300 { color: #a21caf !important; }
    html.theme-light .text-indigo-400,
    html.theme-light .text-indigo-300 { color: #4338ca !important; }
    html.theme-light .text-rose-400,
    html.theme-light .text-rose-300,
    html.theme-light .text-rose-200 { color: #be123c !important; }
    html.theme-light .bg-amber-950\\/60,
    html.theme-light .bg-amber-950\\/20 { background-color: #fef3c7 !important; }
    html.theme-light .bg-rose-950\\/80,
    html.theme-light .bg-rose-950\\/60,
    html.theme-light .bg-rose-950\\/40 { background-color: #ffe4e6 !important; }
    html.theme-light .bg-emerald-950\\/40,
    html.theme-light .bg-emerald-950\\/20 { background-color: #d1fae5 !important; }
    html.theme-light .bg-cyan-950\\/20 { background-color: #cffafe !important; }
    html.theme-light .bg-indigo-950\\/30 { background-color: #e0e7ff !important; }
  </style>
</head>
<body class="h-full flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-900">
  
  <!-- Compact Navigation Header (Optimized for 15" Laptop Screens) -->
  <header class="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
    <div class="max-w-[1600px] mx-auto px-3 sm:px-5">
      <div class="flex items-center justify-between h-13 py-2 gap-3">
        
        <!-- Left: Brand + Inline KPI Summary -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow shrink-0">
            <i class="fa-solid fa-shield-halved text-sm"></i>
          </div>
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-bold text-base tracking-tight text-white">SIDEQUEST</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase badge-sdvosb shrink-0">
              SDVOSB CAPTURE
            </span>
          </div>

          <!-- Compact Inline Pipeline KPIs (replaces bulky 6-card row) -->
          <div class="hidden xl:flex items-center gap-1.5 pl-3 ml-1 border-l border-slate-800 text-[11px]">
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              Total: <strong id="stat-total" class="text-white font-mono">0</strong>
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              New: <strong id="stat-new" class="text-amber-400 font-mono">0</strong>
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              SOW: <strong id="stat-reviewing" class="text-blue-400 font-mono">0</strong>
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              Drafting: <strong id="stat-active" class="text-amber-500 font-mono">0</strong>
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              Submitted: <strong id="stat-submitted" class="text-purple-400 font-mono">0</strong>
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              Won: <strong id="stat-won" class="text-emerald-400 font-mono">0</strong>
            </span>
          </div>
        </div>

        <!-- Right: Streamlined Action Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <div id="sync-status-badge" class="hidden md:flex items-center gap-1.5 text-[11px] px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span id="last-sync-text">Sync Ready</span>
          </div>

          <button onclick="triggerSamSync()" id="btn-sync" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm">
            <i class="fa-solid fa-rotate"></i>
            <span>Poll SAM.gov</span>
          </button>

          <!-- Capture Tools Dropdown (Consolidates KO Directory, 50% Calc, Profiles, Credentials) -->
          <div class="relative">
            <button onclick="toggleToolsMenu()" id="btn-tools-menu" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition font-medium">
              <i class="fa-solid fa-briefcase text-amber-400"></i>
              <span>Capture Tools</span>
              <i class="fa-solid fa-chevron-down text-[10px] text-slate-500"></i>
            </button>
            <div id="tools-dropdown" class="hidden absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs space-y-0.5">
              <button onclick="openContactsModal(); toggleToolsMenu();" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5 text-slate-200">
                <i class="fa-solid fa-address-book w-4 text-center text-cyan-400"></i>
                <div>
                  <div class="font-semibold">KO &amp; OSDBU Directory</div>
                  <div class="text-[10px] text-slate-400">78+ Federal Contracting Officers</div>
                </div>
              </button>
              <button onclick="openComplianceCalculatorModal(); toggleToolsMenu();" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5 text-slate-200">
                <i class="fa-solid fa-scale-balanced w-4 text-center text-emerald-400"></i>
                <div>
                  <div class="font-semibold">50% Subcontracting &amp; NMR Calc</div>
                  <div class="text-[10px] text-slate-400">FAR 52.219-27 &amp; 13 CFR § 125.6</div>
                </div>
              </button>
              <button onclick="openModal('modal-profiles'); toggleToolsMenu();" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5 text-slate-200">
                <i class="fa-solid fa-sliders w-4 text-center text-amber-400"></i>
                <div>
                  <div class="font-semibold">SAM.gov Search Profiles</div>
                  <div class="text-[10px] text-slate-400">13 Priority NAICS &amp; Set-Asides</div>
                </div>
              </button>
              <button onclick="openModal('modal-capability'); toggleToolsMenu();" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5 text-slate-200">
                <i class="fa-solid fa-award w-4 text-center text-purple-400"></i>
                <div>
                  <div class="font-semibold">SDVOSB Credentials</div>
                  <div class="text-[10px] text-slate-400">UEI, CAGE &amp; Capability Statement</div>
                </div>
              </button>
            </div>
          </div>

          <!-- PWA Install App Button (shown when installable) -->
          <button id="btn-pwa-install" onclick="installPwaApp()" class="hidden items-center gap-1 px-2 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition" title="Install Sidequest App">
            <i class="fa-solid fa-download"></i>
            <span class="hidden lg:inline">Install</span>
          </button>

          <!-- Light / Dark Theme Toggle Button -->
          <button id="btn-theme-toggle" onclick="toggleTheme()" class="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition" title="Switch between Light Mode and Dark Mode">
            <i id="theme-toggle-icon" class="fa-solid fa-moon text-indigo-400"></i>
            <span id="theme-toggle-label" class="hidden sm:inline font-medium">Dark</span>
          </button>

          <!-- User Account & Admin Menu -->
          <div class="relative flex items-center gap-1.5">
            <button onclick="toggleUserMenu()" id="btn-user-menu" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition">
              <i class="fa-solid fa-circle-user text-amber-400"></i>
              <span id="nav-user-name" class="font-semibold max-w-[100px] truncate">Admin</span>
              <span id="nav-mfa-indicator" class="w-2 h-2 rounded-full bg-amber-400" title="MFA Status"></span>
              <i class="fa-solid fa-chevron-down text-[10px] text-slate-500"></i>
            </button>

            <!-- Compact Header Log Out Button -->
            <button onclick="handleSignOut()" id="btn-header-logout" class="flex items-center px-2 py-1.5 rounded-md bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-xs text-slate-300 border border-slate-700 hover:border-rose-800/80 transition" title="Log out of platform">
              <i class="fa-solid fa-arrow-right-from-bracket text-rose-400"></i>
            </button>

            <!-- Header Sign In Button (shown when logged out) -->
            <button onclick="openSignInModal()" id="btn-header-signin" class="hidden flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-xs text-slate-950 font-bold transition">
              <i class="fa-solid fa-right-to-bracket"></i>
              <span>Sign In</span>
            </button>

            <!-- Dropdown Menu -->
            <div id="user-dropdown" class="hidden absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs space-y-1">
              <div class="px-3 py-2 border-b border-slate-800 text-[11px]">
                <div id="menu-user-email" class="font-mono text-slate-300 truncate">admin@sdvosb-proposals.mil</div>
                <div id="menu-user-role" class="text-amber-400 font-semibold uppercase mt-0.5">Role: Administrator</div>
              </div>
              <button onclick="openAdminConsoleModal(); toggleUserMenu();" id="menu-admin-item" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 flex items-center text-indigo-300 font-semibold">
                <i class="fa-solid fa-users-gear mr-2 text-indigo-400"></i>Admin Console (Users &amp; Roles)
              </button>
              <button onclick="openMfaModal(); toggleUserMenu();" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 flex items-center justify-between text-slate-200">
                <span><i class="fa-solid fa-shield-halved mr-2 text-amber-400"></i>Two-Factor Authentication</span>
                <span id="menu-mfa-badge" class="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">Grace</span>
              </button>
              <button onclick="openChangePasswordModal(); toggleUserMenu();" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 flex items-center text-slate-200">
                <i class="fa-solid fa-key mr-2 text-slate-400"></i>Change Password
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button onclick="purgeDemoData(); toggleUserMenu();" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 text-emerald-400 flex items-center font-medium">
                <i class="fa-solid fa-broom mr-2 text-emerald-400"></i>Reset Pipeline (Live Only)
              </button>
              <button onclick="seedDemoData(); toggleUserMenu();" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 text-slate-400 flex items-center">
                <i class="fa-solid fa-database mr-2 text-slate-500"></i>Seed Demo Data
              </button>
              <button onclick="openSignInModal(); toggleUserMenu();" class="w-full text-left px-3 py-2 rounded hover:bg-slate-800 text-slate-400 flex items-center">
                <i class="fa-solid fa-right-to-bracket mr-2 text-slate-500"></i>Switch Account
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button onclick="handleSignOut(); toggleUserMenu();" class="w-full text-left px-3 py-2 rounded hover:bg-rose-950/60 text-rose-300 flex items-center font-medium transition">
                <i class="fa-solid fa-arrow-right-from-bracket mr-2 text-rose-400"></i>Log Out / Sign Out
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  </header>

  <!-- MFA Security Reminder / Enforcement Banner (Dismissible) -->
  <div id="mfa-alert-banner" class="hidden border-b py-1.5 px-4 text-xs font-medium">
    <div class="max-w-[1600px] mx-auto w-full flex items-center justify-between gap-2">
      <div class="flex items-center space-x-2" id="mfa-banner-text">
        <i class="fa-solid fa-shield-halved text-amber-400"></i>
        <span>Security Alert: Multi-Factor Authentication (MFA) is mandatory for federal SDVOSB capture compliance.</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="openMfaModal()" class="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shadow">
          Setup MFA
        </button>
        <button onclick="document.getElementById('mfa-alert-banner').classList.add('hidden')" class="text-slate-400 hover:text-slate-200 px-1" title="Dismiss banner">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- Main View Container -->
  <main class="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 py-3">
    ${content}
  </main>

  <!-- Modals Container -->
  <div id="modal-container"></div>

  <!-- Client-side Interactive Logic -->
  <script>
    let currentOpportunities = [];
    let selectedOpp = null;
    let currentUser = null;
    let mfaStatus = null;

    // Check stored credentials or default to initial administrator session
    const storedToken = localStorage.getItem("sidequest_token");
    const isLoggedOut = localStorage.getItem("sidequest_logged_out") === "true";

    const fetchHeaders = {
      "Content-Type": "application/json",
    };

    if (storedToken) {
      fetchHeaders["Authorization"] = "Bearer " + storedToken;
    } else if (!isLoggedOut) {
      // Default initial admin session during bootstrap
      fetchHeaders["X-Dev-User-Id"] = "user_curtis_admin";
      fetchHeaders["X-Dev-Role"] = "admin";
      fetchHeaders["X-Dev-Org-Id"] = "org_demo_sdvosb";
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function toggleUserMenu() {
      const menu = document.getElementById("user-dropdown");
      const tools = document.getElementById("tools-dropdown");
      if (tools) tools.classList.add("hidden");
      if (menu) menu.classList.toggle("hidden");
    }

    function toggleToolsMenu() {
      const tools = document.getElementById("tools-dropdown");
      const menu = document.getElementById("user-dropdown");
      if (menu) menu.classList.add("hidden");
      if (tools) tools.classList.toggle("hidden");
    }
    window.toggleToolsMenu = toggleToolsMenu;

    // Close menus when clicking outside
    document.addEventListener("click", (e) => {
      const btn = document.getElementById("btn-user-menu");
      const dropdown = document.getElementById("user-dropdown");
      if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
      const toolsBtn = document.getElementById("btn-tools-menu");
      const toolsDropdown = document.getElementById("tools-dropdown");
      if (toolsBtn && toolsDropdown && !toolsBtn.contains(e.target) && !toolsDropdown.contains(e.target)) {
        toolsDropdown.classList.add("hidden");
      }
    });

    function updateAuthUI(isLoggedIn, user = null, role = null, mfa = null) {
      const userMenu = document.getElementById("btn-user-menu");
      const logoutBtn = document.getElementById("btn-header-logout");
      const signinBtn = document.getElementById("btn-header-signin");
      const adminBtn = document.getElementById("btn-admin-console");
      const adminMenu = document.getElementById("menu-admin-item");
      const banner = document.getElementById("mfa-alert-banner");
      const bannerText = document.getElementById("mfa-banner-text");

      if (isLoggedIn && user) {
        currentUser = user;
        mfaStatus = mfa;

        if (userMenu) userMenu.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (signinBtn) signinBtn.classList.add("hidden");

        document.getElementById("nav-user-name").innerText = user.name || user.email;
        document.getElementById("menu-user-email").innerText = user.email;
        document.getElementById("menu-user-role").innerText = "Role: " + (role || "Member").toUpperCase();

        const indicator = document.getElementById("nav-mfa-indicator");
        const menuBadge = document.getElementById("menu-mfa-badge");

        if (mfa && mfa.enabled) {
          indicator.className = "w-2 h-2 rounded-full bg-emerald-400";
          menuBadge.className = "px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400";
          menuBadge.innerText = "ACTIVE";
          if (banner) banner.classList.add("hidden");
        } else if (mfa && mfa.mfaEnforced) {
          indicator.className = "w-2 h-2 rounded-full bg-rose-500 animate-ping";
          menuBadge.className = "px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold";
          menuBadge.innerText = "EXPIRED";
          if (banner && bannerText) {
            banner.className = "bg-rose-950/80 border-b border-rose-800 text-rose-200 py-2 px-4 text-xs font-semibold flex items-center justify-between";
            bannerText.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-400 mr-2 text-sm"></i><span><strong>MFA MANDATORY:</strong> Your 3-day grace period has expired. Two-Factor Authentication is required to access proposal features.</span>';
            banner.classList.remove("hidden");
          }
        } else {
          indicator.className = "w-2 h-2 rounded-full bg-amber-400";
          menuBadge.className = "px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300";
          menuBadge.innerText = (mfa ? mfa.remainingDays : 3) + "d Grace";
          if (banner && bannerText) {
            banner.className = "bg-amber-950/60 border-b border-amber-800/80 text-amber-200 py-2 px-4 text-xs font-medium flex items-center justify-between";
            bannerText.innerHTML = \`<i class="fa-solid fa-shield-halved text-amber-400 mr-2"></i><span>MFA Compliance Notice: Two-Factor Authentication is required. You have <strong>\${mfa ? mfa.remainingDays : 3} days</strong> remaining in your grace period.</span>\`;
            banner.classList.remove("hidden");
          }
        }

        const isAdmin = (role || "").toLowerCase() === "admin";
        if (adminBtn) adminBtn.style.display = isAdmin ? "flex" : "none";
        if (adminMenu) adminMenu.style.display = isAdmin ? "flex" : "none";
      } else {
        currentUser = null;
        mfaStatus = null;
        if (userMenu) userMenu.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (signinBtn) signinBtn.classList.remove("hidden");
        if (adminBtn) adminBtn.style.display = "none";
        if (banner) banner.classList.add("hidden");
        const dropdown = document.getElementById("user-dropdown");
        if (dropdown) dropdown.classList.add("hidden");
      }
    }

    async function handleSignOut() {
      try {
        await fetch("/api/v1/auth/sign-out", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include"
        });
      } catch (e) {
        console.error("Sign out error", e);
      }
      localStorage.removeItem("sidequest_token");
      localStorage.setItem("sidequest_logged_out", "true");
      delete fetchHeaders["Authorization"];
      delete fetchHeaders["X-Dev-User-Id"];
      delete fetchHeaders["X-Dev-Role"];
      delete fetchHeaders["X-Dev-Org-Id"];
      updateAuthUI(false);
      openSignInModal();
    }

    window.handleSignOut = handleSignOut;
    window.openSignInModal = openSignInModal;
    window.toggleUserMenu = toggleUserMenu;

    async function loadUserProfile() {
      try {
        const res = await fetch("/api/v1/auth/me", { credentials: "include", headers: fetchHeaders });
        if (res.ok) {
          const data = await res.json();
          updateAuthUI(true, data.user, data.role, data.mfa);
        } else {
          updateAuthUI(false);
        }
      } catch (e) {
        console.error("Failed to load user profile", e);
        updateAuthUI(false);
      }
    }

    async function loadStats() {
      try {
        const res = await fetch("/api/v1/stats", { credentials: "include", headers: fetchHeaders });
        if (res.ok) {
          const stats = await res.json();
          document.getElementById("stat-total").innerText = stats.totalOpportunities;
          document.getElementById("stat-new").innerText = stats.newOpportunities;
          document.getElementById("stat-reviewing").innerText = stats.reviewingOpportunities || 0;
          document.getElementById("stat-active").innerText = stats.activeProposals;
          document.getElementById("stat-submitted").innerText = stats.submittedProposals;
          document.getElementById("stat-won").innerText = stats.wonContracts;
          if (stats.lastSamSync) {
            const d = new Date(stats.lastSamSync);
            document.getElementById("last-sync-text").innerText = "Last Sync: " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        }
      } catch (e) {
        console.error("Stats load failed", e);
      }
    }

    async function loadOpportunities() {
      try {
        const res = await fetch("/api/v1/opportunities?limit=200", { credentials: "include", headers: fetchHeaders });
        if (res.ok) {
          const json = await res.json();
          currentOpportunities = json.data || [];
          populateDynamicNaicsFilter(currentOpportunities);
          renderKanban(currentOpportunities);
        }
      } catch (e) {
        console.error("Failed to load opportunities", e);
      }
    }

    const PRIORITY_NAICS = [
      { code: "541519", shortLabel: "IT Services / VAR", title: "Other Computer Related Services" },
      { code: "423430", shortLabel: "Computer & SW Wholesale", title: "Computer & Peripheral Equipment & Software Wholesalers" },
      { code: "513210", shortLabel: "Software Publishers", title: "Software Publishers" },
      { code: "334111", shortLabel: "Electronic Computers", title: "Electronic Computer Manufacturing" },
      { code: "423840", shortLabel: "Industrial Supplies", title: "Industrial Supplies Merchant Wholesalers" },
      { code: "423450", shortLabel: "Medical & Hospital Equip", title: "Medical, Dental, & Hospital Equipment Wholesalers" },
      { code: "423490", shortLabel: "Prof. Equipment", title: "Other Professional Equipment & Supplies Wholesalers" },
      { code: "339940", shortLabel: "Office Supplies Mfg", title: "Office Supplies (except Paper) Manufacturing" },
      { code: "541512", shortLabel: "Systems Design", title: "Computer Systems Design Services" },
      { code: "541511", shortLabel: "Custom Programming", title: "Custom Computer Programming Services" },
      { code: "541330", shortLabel: "Engineering Services", title: "Engineering Services" },
      { code: "541611", shortLabel: "Management Consulting", title: "Administrative & General Management Consulting" },
      { code: "541690", shortLabel: "Tech Consulting", title: "Other Scientific & Technical Consulting Services" }
    ];
    const PRIORITY_NAICS_SET = new Set(PRIORITY_NAICS.map(n => n.code));

    function applyThemeUI(theme) {
      const root = document.documentElement;
      const icon = document.getElementById("theme-toggle-icon");
      const label = document.getElementById("theme-toggle-label");
      const metaColor = document.getElementById("meta-theme-color");
      if (theme === "dark") {
        root.classList.remove("theme-light");
        root.classList.add("theme-dark");
        if (icon) icon.className = "fa-solid fa-sun text-amber-400";
        if (label) label.innerText = "Light";
        if (metaColor) metaColor.setAttribute("content", "#090d16");
      } else {
        root.classList.remove("theme-dark");
        root.classList.add("theme-light");
        if (icon) icon.className = "fa-solid fa-moon text-indigo-400";
        if (label) label.innerText = "Dark";
        if (metaColor) metaColor.setAttribute("content", "#f8fafc");
      }
    }

    function toggleTheme() {
      const current = localStorage.getItem("sidequest_theme") || "light";
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem("sidequest_theme", next);
      applyThemeUI(next);
    }
    window.toggleTheme = toggleTheme;

    let deferredPwaPrompt = null;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      const btn = document.getElementById("btn-pwa-install");
      if (btn) {
        btn.classList.remove("hidden");
        btn.classList.add("flex");
      }
    });

    async function installPwaApp() {
      if (!deferredPwaPrompt) return;
      deferredPwaPrompt.prompt();
      await deferredPwaPrompt.userChoice;
      deferredPwaPrompt = null;
      const btn = document.getElementById("btn-pwa-install");
      if (btn) {
        btn.classList.add("hidden");
        btn.classList.remove("flex");
      }
    }
    window.installPwaApp = installPwaApp;

    function populateDynamicNaicsFilter(opps) {
      const sel = document.getElementById("filter-naics");
      const currentVal = sel ? sel.value : "";
      const counts = {};
      let priorityTotal = 0;

      opps.forEach(o => {
        if (o.naicsCode) {
          counts[o.naicsCode] = (counts[o.naicsCode] || 0) + 1;
          if (PRIORITY_NAICS_SET.has(o.naicsCode)) {
            priorityTotal++;
          }
        }
      });

      if (sel) {
        const priorityOptions = PRIORITY_NAICS.map(n => {
          const cnt = counts[n.code] || 0;
          return \`<option value="\${n.code}">★ \${n.code} — \${escapeHtml(n.shortLabel)} (\${cnt})</option>\`;
        }).join("");

        const otherOptions = Object.entries(counts)
          .filter(([code]) => !PRIORITY_NAICS_SET.has(code))
          .sort((a, b) => b[1] - a[1])
          .map(([code, cnt]) => \`<option value="\${escapeHtml(code)}">NAICS \${escapeHtml(code)} (\${cnt})</option>\`)
          .join("");

        sel.innerHTML =
          \`<option value="">All NAICS (\${opps.length})</option>\` +
          \`<option value="PRIORITY_ALL">★ All 13 Target NAICS (\${priorityTotal})</option>\` +
          \`<optgroup label="★ Priority Target NAICS (13 Codes)">\${priorityOptions}</optgroup>\` +
          (otherOptions ? \`<optgroup label="Other Active SAM.gov NAICS">\${otherOptions}</optgroup>\` : "");

        if (currentVal) {
          sel.value = currentVal;
        }
      }

      renderPriorityNaicsBar(opps, counts, priorityTotal);
    }

    function renderPriorityNaicsBar(opps, counts, priorityTotal) {
      const bar = document.getElementById("priority-naics-pills");
      const summaryBadge = document.getElementById("priority-naics-summary");
      if (!bar) return;
      const sel = document.getElementById("filter-naics");
      const activeNaics = sel ? sel.value : "";

      if (summaryBadge) {
        summaryBadge.innerText = \`\${priorityTotal} of \${opps.length} live notices match your 13 target NAICS\`;
      }

      const allBtnClass = activeNaics === ""
        ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm"
        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700";

      const priorityAllClass = activeNaics === "PRIORITY_ALL"
        ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm"
        : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/40 font-semibold";

      const pillsHtml = PRIORITY_NAICS.map(n => {
        const cnt = counts[n.code] || 0;
        const isSelected = activeNaics === n.code;
        const cls = isSelected
          ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm"
          : cnt > 0
            ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/40 font-semibold"
            : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700";
        return \`<button onclick="selectPriorityNaics('\${n.code}')" title="\${escapeHtml(n.code + ' — ' + n.shortLabel + ': ' + n.title)}" class="px-2 py-0.5 rounded-md border text-[11px] transition flex items-center gap-1 \${cls}">
          <span class="font-mono">\${n.code}</span>
          <span class="opacity-75 font-mono text-[10px]">(\${cnt})</span>
        </button>\`;
      }).join("");

      bar.innerHTML = \`
        <button onclick="selectPriorityNaics('')" class="px-2 py-0.5 rounded-md border text-[11px] transition flex items-center gap-1 \${allBtnClass}">
          <span>All</span>
          <span class="opacity-80 font-mono text-[10px]">(\${opps.length})</span>
        </button>
        <button onclick="selectPriorityNaics('PRIORITY_ALL')" class="px-2.5 py-0.5 rounded-md border text-[11px] transition flex items-center gap-1 \${priorityAllClass}">
          <i class="fa-solid fa-star text-[9px]"></i>
          <span>13 Target NAICS</span>
          <span class="opacity-80 font-mono text-[10px]">(\${priorityTotal})</span>
        </button>
        \${pillsHtml}
      \`;
    }

    function selectPriorityNaics(code) {
      const sel = document.getElementById("filter-naics");
      if (sel) {
        sel.value = code;
      }
      populateDynamicNaicsFilter(currentOpportunities);
      applyFilters();
    }
    window.selectPriorityNaics = selectPriorityNaics;

    function calculateDeadlineBadge(deadlineStr) {
      if (!deadlineStr) return '<span class="text-slate-500 font-mono text-[11px]">No deadline</span>';
      const deadline = new Date(deadlineStr);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return '<span class="text-rose-400 font-semibold text-[11px]"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Expired</span>';
      } else if (diffDays <= 3) {
        return \`<span class="text-rose-400 font-bold text-[11px] animate-pulse"><i class="fa-solid fa-clock mr-1"></i>\${diffDays}d left (Urgent)</span>\`;
      } else if (diffDays <= 7) {
        return \`<span class="text-amber-400 font-semibold text-[11px]"><i class="fa-regular fa-clock mr-1"></i>\${diffDays}d left</span>\`;
      } else {
        return \`<span class="text-slate-300 font-medium text-[11px]"><i class="fa-regular fa-calendar mr-1"></i>\${diffDays}d left</span>\`;
      }
    }

    function renderKanban(opps) {
      const cols = {
        new: document.getElementById("col-new"),
        reviewing_sow: document.getElementById("col-reviewing"),
        drafting_rfi: document.getElementById("col-drafting"),
        submitted: document.getElementById("col-submitted"),
        won: document.getElementById("col-won")
      };

      Object.values(cols).forEach(col => { if(col) col.innerHTML = ""; });

      opps.forEach(opp => {
        let colKey = "new";
        if (["reviewing_sow", "analyzing"].includes(opp.status)) colKey = "reviewing_sow";
        else if (["drafting_rfi", "pursuing"].includes(opp.status)) colKey = "drafting_rfi";
        else if (["submitted"].includes(opp.status)) colKey = "submitted";
        else if (["won", "lost"].includes(opp.status)) colKey = "won";

        const targetCol = cols[colKey] || cols.new;
        if (!targetCol) return;

        const card = document.createElement("div");
        card.className = "p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:shadow-lg transition space-y-2.5 cursor-pointer group";
        
        const nType = (opp.noticeType || "").toLowerCase();
        const isSourcesSought = nType === "r" || nType.includes("sources sought") || (opp.title || "").toLowerCase().includes("sources sought");
        const isRuleOfTwoFlip = isSourcesSought && opp.setAsideCode && !["SDVOSBC", "SDVOSBS"].includes(opp.setAsideCode);
        const isSoleSource = opp.setAsideCode === "SDVOSBS" || nType === "s" || nType.includes("special");
        const isCombinedSynopsis = nType === "k" || nType.includes("combined");
        const isAwardNotice = nType === "a" || nType.includes("award");
        const isPresol = nType === "p" || nType.includes("presolicitation");
        const isSat = isCombinedSynopsis ||
                      (opp.title || "").toLowerCase().includes("simplified acquisition") || 
                      (opp.title || "").toLowerCase().includes("sat") || 
                      (opp.solicitationNumber || "").includes("Q");

        let badgeType = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">Solicitation</span>';
        if (isRuleOfTwoFlip) {
          badgeType = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40 uppercase" title="Respond with 2+ SDVOSBs to flip to SDVOSBC under FAR 19.1405">🎯 Rule-of-Two Flip</span>';
        } else if (isSoleSource) {
          badgeType = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/40 uppercase">🔒 Sole Source</span>';
        } else if (isAwardNotice) {
          badgeType = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 uppercase" title="Public SAM.gov Award Notice (Awarded to another vendor)">🏆 Market Award (Competitor)</span>';
        } else if (isSourcesSought) {
          badgeType = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">RFI / Sources Sought</span>';
        } else if (isCombinedSynopsis) {
          badgeType = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase">⚡ Combined Synopsis</span>';
        } else if (isPresol) {
          badgeType = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">📅 Presolicitation</span>';
        }

        const isPriorityNaics = opp.naicsCode && PRIORITY_NAICS_SET.has(opp.naicsCode);
        const priorityNaicsObj = isPriorityNaics ? PRIORITY_NAICS.find(n => n.code === opp.naicsCode) : null;
        const targetNaicsBadge = isPriorityNaics
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded badge-sdvosb uppercase">★ Target NAICS</span>'
          : '';

        const satBadge = isSat
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded badge-sat uppercase">SAT &lt; $250k</span>'
          : '';

        const deadlineHtml = calculateDeadlineBadge(opp.responseDeadline);

        card.innerHTML = \`
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              \${badgeType}
              \${targetNaicsBadge}
              \${satBadge}
            </div>
            <span class="text-[10px] font-mono text-slate-400">\${opp.solicitationNumber || opp.id.substring(0,8)}</span>
          </div>

          <h4 class="text-xs font-semibold text-slate-100 group-hover:text-amber-400 transition line-clamp-2 leading-snug">
            \${opp.title}
          </h4>

          <div class="text-[11px] text-slate-400 space-y-1">
            <div class="flex items-center text-slate-400 truncate">
              <i class="fa-solid fa-landmark text-[10px] w-4 text-slate-500"></i>
              <span class="truncate">\${opp.agency || "Federal Agency"}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="\${isPriorityNaics ? 'text-amber-400 font-semibold' : 'text-slate-400'}"><i class="fa-solid fa-tag text-[10px] w-4 text-slate-500"></i>NAICS \${opp.naicsCode || "N/A"}\${priorityNaicsObj ? ' · ' + escapeHtml(priorityNaicsObj.shortLabel) : ''}</span>
              \${deadlineHtml}
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button onclick="event.stopPropagation(); viewDetails('\${opp.id}')" class="text-slate-400 hover:text-white transition flex items-center text-[11px]">
              <i class="fa-solid fa-folder-open mr-1 text-slate-500"></i>Details
            </button>
            <button onclick="event.stopPropagation(); openRfiModal('\${opp.id}')" class="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition flex items-center">
              <i class="fa-solid fa-pen-nib mr-1 text-[10px]"></i>Draft RFI
            </button>
          </div>
        \`;

        card.onclick = () => viewDetails(opp.id);
        targetCol.appendChild(card);
      });

      document.getElementById("count-new").innerText = cols.new ? cols.new.children.length : 0;
      document.getElementById("count-reviewing").innerText = cols.reviewing_sow ? cols.reviewing_sow.children.length : 0;
      document.getElementById("count-drafting").innerText = cols.drafting_rfi ? cols.drafting_rfi.children.length : 0;
      document.getElementById("count-submitted").innerText = cols.submitted ? cols.submitted.children.length : 0;
      document.getElementById("count-won").innerText = cols.won ? cols.won.children.length : 0;
    }

    async function triggerSamSync(customNaicsCode = "") {
      const btn = document.getElementById("btn-sync");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Ingesting...</span>';
      }
      
      try {
        const sel = document.getElementById("filter-naics");
        const activeFilterNaics = customNaicsCode || (sel && sel.value && sel.value !== "PRIORITY_ALL" ? sel.value : "");
        const res = await fetch("/api/v1/ingest/run", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({
            lookbackDays: activeFilterNaics ? 30 : 14,
            naicsCode: activeFilterNaics || undefined
          })
        });
        const result = await res.json();
        const quotaMsg = result.quotaThrottled
          ? \`\\n(Note: SAM.gov daily API quota reached; resets at \${result.nextAccessTime}.)\`
          : "";
        alert(\`SAM.gov Sync Completed! Processed: \${result.noticesProcessed} notices, Alerts: \${result.alertsCreated}, Amendments: \${result.amendmentsDetected || 0}\${quotaMsg}\`);
        await loadStats();
        await loadOpportunities();
      } catch (e) {
        alert("Failed to sync with SAM.gov: " + e.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-rotate"></i><span>Poll SAM.gov</span>';
        }
      }
    }

    async function purgeDemoData() {
      if (!confirm("Purge all seeded demo opportunities and leave ONLY real live SAM.gov records?")) return;
      try {
        const res = await fetch("/api/v1/seed/purge", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include"
        });
        const data = await res.json();
        if (res.ok) {
          await loadStats();
          await loadOpportunities();
          alert(data.message);
        } else {
          alert(data.error || "Purge failed");
        }
      } catch (e) {
        alert("Purge error: " + e.message);
      }
    }

    async function seedDemoData() {
      if (!confirm("Seed demonstration SDVOSB opportunities, admin credentials, and profiles?")) return;
      try {
        const res = await fetch("/api/v1/seed", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include"
        });
        if (res.ok) {
          await loadUserProfile();
          await loadStats();
          await loadOpportunities();
          alert("Initial user and SDVOSB demo pipeline seeded successfully! Initial credentials:\\nUser: admin@sdvosb-proposals.mil\\nPassword: AdminSDVOSB!2026#Secure");
        }
      } catch (e) {
        alert("Seed failed: " + e.message);
      }
    }

    async function transitionStatus(oppId, newStatus) {
      try {
        const res = await fetch(\`/api/v1/opportunities/\${oppId}/status\`, {
          method: "PATCH",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          await loadStats();
          await loadOpportunities();
          if (selectedOpp && selectedOpp.id === oppId) {
            viewDetails(oppId);
          }
        }
      } catch (e) {
        alert("Status update failed: " + e.message);
      }
    }

    async function viewDetails(oppId) {
      try {
        const res = await fetch(\`/api/v1/opportunities/\${oppId}\`, { credentials: "include", headers: fetchHeaders });
        if (!res.ok) return;
        const data = await res.json();
        selectedOpp = data.opportunity;
        renderDetailsModal(data);
      } catch (e) {
        console.error("Failed to load details", e);
      }
    }

    function renderDetailsModal({ opportunity: opp, attachments, notes, alerts }) {
      const existing = document.getElementById("detail-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "detail-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      const sourceIconMap = {
        email: { icon: "envelope text-blue-400", border: "border-blue-500/30 bg-blue-950/20" },
        outbound_email: { icon: "paper-plane text-emerald-400", border: "border-emerald-500/30 bg-emerald-950/20" },
        amendment: { icon: "triangle-exclamation text-rose-400", border: "border-rose-500/40 bg-rose-950/20" },
        award_intel: { icon: "trophy text-amber-400", border: "border-amber-500/40 bg-amber-950/20" },
        compliance_audit: { icon: "scale-balanced text-indigo-400", border: "border-indigo-500/40 bg-indigo-950/20" },
        poc_directory: { icon: "address-card text-cyan-400", border: "border-cyan-500/30 bg-slate-900" },
      };

      let notesHtml = (notes || []).map(n => {
        const style = sourceIconMap[n.source] || { icon: "user-pen text-amber-400", border: "border-slate-800 bg-slate-900" };
        return \`
        <div class="p-3 rounded-lg border \${style.border} space-y-1 text-xs">
          <div class="flex items-center justify-between text-slate-400">
            <span class="font-semibold text-slate-200 flex items-center gap-1.5">
              <i class="fa-solid fa-\${style.icon}"></i>
              \${escapeHtml(n.authorEmail)}
            </span>
            <span class="text-[10px] text-slate-500 font-mono">\${n.createdAt || ""}</span>
          </div>
          <div class="font-semibold text-slate-100">\${escapeHtml(n.subject || "")}</div>
          <p class="text-slate-300 whitespace-pre-wrap leading-relaxed">\${escapeHtml(n.content)}</p>
        </div>
      \`;
      }).join("");

      if (!notesHtml) notesHtml = '<p class="text-xs text-slate-500 italic">No notes or captured emails recorded yet.</p>';

      let attachmentsHtml = (attachments || []).map(a => \`
        <div class="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
          <div class="flex items-center space-x-2 truncate">
            <i class="fa-regular fa-file-lines text-amber-400"></i>
            <span class="truncate text-slate-200">\${escapeHtml(a.filename)}</span>
          </div>
          <a href="/api/v1/opportunities/\${opp.id}/attachments/\${a.id}/download" target="_blank" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition">
            <i class="fa-solid fa-download mr-1"></i>Download
          </a>
        </div>
      \`).join("");

      if (!attachmentsHtml) attachmentsHtml = '<p class="text-xs text-slate-500 italic">No attachments or proposals generated yet.</p>';

      const deadlineBadge = calculateDeadlineBadge(opp.responseDeadline);

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          
          <div class="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
            <div>
              <div class="flex items-center space-x-2 text-xs">
                <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">\${opp.solicitationNumber || opp.id}</span>
                <span class="text-slate-400">• \${opp.agency || "Federal Agency"}</span>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-white mt-1">\${opp.title}</h3>
            </div>
            <button onclick="document.getElementById('detail-modal').remove()" class="text-slate-400 hover:text-white text-lg p-1">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[11px]">NAICS Code</span>
                <span class="font-bold text-slate-100 font-mono">\${opp.naicsCode || "N/A"}</span>
              </div>
              <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[11px]">Set-Aside Designation</span>
                <span class="font-bold text-amber-400">\${opp.setAsideCode || "SDVOSBC"}</span>
              </div>
              <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[11px]">Response Deadline</span>
                <div class="font-bold mt-0.5">\${deadlineBadge}</div>
              </div>
              <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[11px]">Pipeline Status</span>
                <span class="font-bold text-emerald-400 uppercase font-mono">\${opp.status}</span>
              </div>
            </div>

            <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span class="text-xs font-semibold text-slate-300">Pipeline Transition:</span>
              <div class="flex flex-wrap gap-2 text-xs">
                <button onclick="transitionStatus('\${opp.id}', 'reviewing_sow')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200">Review SOW</button>
                <button onclick="transitionStatus('\${opp.id}', 'drafting_rfi')" class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950">Draft RFI</button>
                <button onclick="transitionStatus('\${opp.id}', 'submitted')" class="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white">Mark Submitted</button>
                <button onclick="transitionStatus('\${opp.id}', 'won')" class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950">Won / Awarded</button>
                <button onclick="transitionStatus('\${opp.id}', 'archived')" class="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700">Archive</button>
              </div>
            </div>

            <!-- Contracting Officer Channel & Strategic Tools Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span class="text-slate-400">Contracting Officer POC:</span>
                <span class="text-amber-300 font-mono font-semibold ml-1.5">\${opp.pointOfContactEmail || "Listed in SAM.gov notice"}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button onclick="openSendEmailModal('\${opp.id}')" class="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 font-semibold transition">
                  <i class="fa-solid fa-paper-plane mr-1.5"></i>Email KO / OSDBU
                </button>
                <button onclick="openComplianceCalculatorModal('\${opp.id}', '\${opp.naicsCode || '541512'}')" class="px-3 py-1.5 rounded bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/40 font-semibold transition">
                  <i class="fa-solid fa-scale-balanced mr-1.5"></i>50% Rule / NMR Calc
                </button>
                <button onclick="loadAwardIntelForOpp('\${opp.id}')" class="px-3 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-semibold transition">
                  <i class="fa-solid fa-chart-line mr-1.5"></i>Incumbent &amp; Award Intel
                </button>
                <a href="\${opp.uiLink}" target="_blank" class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition">
                  <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>SAM.gov
                </a>
              </div>
            </div>

            <!-- Dynamic Award & Incumbent Intelligence Panel -->
            <div id="opp-award-intel-panel" class="hidden p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3 text-xs"></div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Proposal Artifacts &amp; Cloudflare R2</h4>
                <button onclick="openRfiModal('\${opp.id}')" class="text-xs text-amber-400 hover:underline">
                  <i class="fa-solid fa-plus mr-1"></i>Generate New Proposal Artifact
                </button>
              </div>
              <div class="space-y-2">\${attachmentsHtml}</div>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Contracting Officer Communications, Amendments &amp; Capture Notes</h4>
              <div class="space-y-2">\${notesHtml}</div>
              
              <div class="pt-2 flex gap-2">
                <input id="new-note-text" placeholder="Add manual capture intelligence note..." class="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                <button onclick="submitManualNote('\${opp.id}')" class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold">
                  Add Note
                </button>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-between items-center">
            <button onclick="openSendEmailModal('\${opp.id}')" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs border border-slate-700 transition">
              <i class="fa-solid fa-envelope-open-text mr-1.5"></i>Send Question / Capability to KO
            </button>
            <button onclick="openRfiModal('\${opp.id}')" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition">
              <i class="fa-solid fa-pen-nib mr-1.5"></i>Launch Proposal Studio
            </button>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function submitManualNote(oppId) {
      const input = document.getElementById("new-note-text");
      const content = input.value.trim();
      if (!content) return;

      try {
        const res = await fetch(\`/api/v1/opportunities/\${oppId}/notes\`, {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ content })
        });
        if (res.ok) {
          input.value = "";
          viewDetails(oppId);
        }
      } catch (e) {
        alert("Failed to add note: " + e.message);
      }
    }

    function openRfiModal(oppId) {
      const opp = currentOpportunities.find(o => o.id === oppId) || selectedOpp;
      if (!opp) return;

      const existing = document.getElementById("rfi-modal");
      if (existing) existing.remove();

      const isRuleOfTwoCandidate = (opp.noticeType || "").toLowerCase() === "r" && opp.setAsideCode && !["SDVOSBC", "SDVOSBS"].includes(opp.setAsideCode);

      const modal = document.createElement("div");
      modal.id = "rfi-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
            <div>
              <span class="text-xs font-mono text-amber-400 font-semibold uppercase">SDVOSB Proposal Studio &amp; R2 Engine</span>
              <h3 class="text-base font-bold text-white">\${opp.solicitationNumber || opp.title}</h3>
            </div>
            <button onclick="document.getElementById('rfi-modal').remove()" class="text-slate-400 hover:text-white text-lg p-1">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Proposal Document Template</label>
              <select id="rfi-template" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
                <option value="sources_sought">Sources Sought / RFI Capabilities Statement (Section L Alignment)</option>
                <option value="rule_of_two_shaping" \${isRuleOfTwoCandidate ? 'selected' : ''}>🎯 "Rule of Two" Set-Aside Conversion &amp; Sole-Source Pitch (FAR 19.1405 / Kingdomware)</option>
                <option value="sat_quote">⚡ Simplified Acquisition Threshold Quote (&lt; $250k Commercial Item)</option>
                <option value="rfp_qa_inquiries">❓ Formal Solicitation Q&amp;A &amp; Technical Clarification Submittal</option>
                <option value="past_performance_matrix">🏆 Past Performance Relevancy Matrix &amp; CPARS Benchmarks</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 font-semibold mb-1">Company Legal Name</label>
                <input id="rfi-company" value="VALIANT VETERAN DEFENSE TECHNOLOGIES LLC" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
              </div>
              <div>
                <label class="block text-slate-400 font-semibold mb-1">SBA VetCert / SDVOSB Status</label>
                <select id="rfi-cert" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
                  <option value="true">Certified SDVOSB (100% Veteran-Owned)</option>
                  <option value="false">Veteran-Owned Small Business (VOSB)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 font-semibold mb-1">Unique Entity ID (SAM.gov UEI)</label>
                <input id="rfi-uei" value="VET876543210" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono">
              </div>
              <div>
                <label class="block text-slate-400 font-semibold mb-1">CAGE Code</label>
                <input id="rfi-cage" value="9ABC4" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono">
              </div>
            </div>

            <div>
              <label class="block text-slate-400 font-semibold mb-1">Section L Technical Differentiators, Q&amp;A Items, or FAR 52.219-27 Notes</label>
              <textarea id="rfi-approach" rows="3" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono text-[11px]" placeholder="Specific technical approach, custom questions for the KO, or Similarly Situated Entity teaming details..."></textarea>
            </div>

            <div id="rfi-preview-container" class="hidden space-y-2 pt-2 border-t border-slate-800">
              <div class="flex items-center justify-between">
                <span class="font-bold text-amber-400 flex items-center gap-1.5">
                  <i class="fa-solid fa-check text-emerald-400"></i>Proposal Generated &amp; Stored in R2:
                </span>
                <div class="flex items-center gap-2">
                  <span id="rfi-r2-key" class="font-mono text-slate-400 text-[10px]"></span>
                  <button onclick="dispatchGeneratedRfiToKo('\${opp.id}')" class="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition">
                    <i class="fa-solid fa-paper-plane mr-1"></i>Email Directly to KO
                  </button>
                </div>
              </div>
              <pre id="rfi-preview-content" class="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200 overflow-x-auto max-h-56 whitespace-pre-wrap font-mono"></pre>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end space-x-3">
            <button onclick="document.getElementById('rfi-modal').remove()" class="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs">Close</button>
            <button id="btn-generate-rfi" onclick="generateRfi('\${opp.id}')" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition">
              <i class="fa-solid fa-bolt mr-1.5"></i>Generate &amp; Archive to R2
            </button>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    function dispatchGeneratedRfiToKo(oppId) {
      const previewEl = document.getElementById("rfi-preview-content");
      const content = previewEl ? previewEl.innerText : "";
      const opp = currentOpportunities.find(o => o.id === oppId) || selectedOpp;
      const solNum = opp ? (opp.solicitationNumber || opp.id) : oppId;
      openSendEmailModal(
        oppId,
        opp ? opp.pointOfContactEmail : "",
        \`SDVOSB Submittal for \${solNum}: \${opp ? opp.title : "Capability Statement"}\`,
        content
      );
    }

    // ==========================================
    // BIDIRECTIONAL KO & OSDBU EMAIL DISPATCH MODAL
    // ==========================================
    function openSendEmailModal(oppId, prefillTo = "", prefillSubject = "", prefillContent = "") {
      const opp = currentOpportunities.find(o => o.id === oppId) || selectedOpp;
      if (!opp) return;

      const existing = document.getElementById("send-email-modal");
      if (existing) existing.remove();

      const solNum = opp.solicitationNumber || opp.id;
      const toAddr = prefillTo || opp.pointOfContactEmail || "contracting.officer@agency.mil";
      const defaultSubj = prefillSubject || \`[\${solNum}] SDVOSB Capability & Acquisition Inquiry - \${opp.title}\`;
      const defaultBody = prefillContent || \`Dear Contracting Officer,\\n\\nRespectfully submitting our Verified Service-Disabled Veteran-Owned Small Business (SDVOSB) capability credentials (UEI: VET876543210 | CAGE: 9ABC4) in reference to solicitation \${solNum} ("\${opp.title}").\\n\\nPer FAR 19.1405 (SDVOSB Rule of Two) and FAR 52.219-27, our team will execute >50% of direct contract performance and welcomes any pre-solicitation clarifications.\\n\\nRespectfully,\\nDirector of Federal Capture\\nVALIANT VETERAN DEFENSE TECHNOLOGIES LLC\`;

      const modal = document.createElement("div");
      modal.id = "send-email-modal";
      modal.className = "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-paper-plane text-emerald-400 text-base"></i>
              <h3 class="font-bold text-white text-base">Dispatch Official Correspondence to KO / OSDBU</h3>
            </div>
            <button onclick="document.getElementById('send-email-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-2.5 rounded bg-emerald-950/30 border border-emerald-800/50 text-emerald-200 text-[11px]">
              <i class="fa-solid fa-reply mr-1.5 text-emerald-400"></i>
              <strong>Automatic Bidirectional Threading:</strong> Replies from the Contracting Officer are routed via Cloudflare Email Routing and automatically logged under solicitation <span class="font-mono font-bold">\${escapeHtml(solNum)}</span>.
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 font-semibold mb-1">To: Contracting Officer / CS Email</label>
                <input id="ko-email-to" type="email" value="\${escapeHtml(toAddr)}" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono">
              </div>
              <div>
                <label class="block text-slate-400 font-semibold mb-1">CC: Agency OSDBU / Small Business Specialist (Optional)</label>
                <input id="ko-email-cc" type="email" placeholder="osdbu.advocate@agency.mil" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono">
              </div>
            </div>

            <div>
              <label class="block text-slate-400 font-semibold mb-1">Subject Line</label>
              <input id="ko-email-subject" type="text" value="\${escapeHtml(defaultSubj)}" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
            </div>

            <div>
              <label class="block text-slate-400 font-semibold mb-1">Message Body / Proposal Text</label>
              <textarea id="ko-email-body" rows="8" class="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 font-mono text-[11px]">\${escapeHtml(defaultBody)}</textarea>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="ko-mark-submitted" class="rounded bg-slate-900 border-slate-800 text-emerald-500">
              <label for="ko-mark-submitted" class="text-slate-300">Transition solicitation status to <strong>Submitted</strong> upon dispatch</label>
            </div>

            <div class="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button onclick="document.getElementById('send-email-modal').remove()" class="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</button>
              <button onclick="submitOutboundEmail('\${opp.id}')" id="btn-send-ko-email" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20">
                <i class="fa-solid fa-paper-plane mr-1.5"></i>Dispatch to Contracting Officer
              </button>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function submitOutboundEmail(oppId) {
      const to = document.getElementById("ko-email-to").value.trim();
      const ccOsdbu = document.getElementById("ko-email-cc").value.trim();
      const subject = document.getElementById("ko-email-subject").value.trim();
      const content = document.getElementById("ko-email-body").value.trim();
      const markAsSubmitted = document.getElementById("ko-mark-submitted").checked;
      const btn = document.getElementById("btn-send-ko-email");

      if (!to || !subject || !content) {
        alert("Recipient email, subject, and message content are required.");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Dispatching...';

      try {
        const res = await fetch(\`/api/v1/opportunities/\${oppId}/send-email\`, {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ to, ccOsdbu, subject, content, markAsSubmitted })
        });
        const data = await res.json();
        if (res.ok) {
          alert(\`Correspondence dispatched to \${data.recipients.join(", ")}!\\nReply-To Threading Address: \${data.replyTo}\`);
          document.getElementById("send-email-modal").remove();
          await loadStats();
          await loadOpportunities();
          if (document.getElementById("detail-modal")) {
            viewDetails(oppId);
          }
        } else {
          alert(data.error || "Failed to send email");
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1.5"></i>Dispatch to Contracting Officer';
        }
      } catch (e) {
        alert("Dispatch error: " + e.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1.5"></i>Dispatch to Contracting Officer';
      }
    }

    // ==========================================
    // CONTRACTING OFFICER & OSDBU DIRECTORY MODAL
    // ==========================================
    async function openContactsModal() {
      const existing = document.getElementById("contacts-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "contacts-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-address-book text-cyan-400 text-lg"></i>
              <div>
                <h3 class="font-bold text-white text-base">Contracting Officer (KO) &amp; Agency OSDBU Contact Registry</h3>
                <p class="text-[11px] text-slate-400">Direct communication channels extracted from SAM.gov notices and inbound correspondence</p>
              </div>
            </div>
            <button onclick="document.getElementById('contacts-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="contacts-list-body" class="flex-1 overflow-y-auto p-6 space-y-3 text-xs">
            <div class="text-center text-slate-400 py-8"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading Contracting Officer &amp; OSDBU Directory...</div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);

      try {
        const res = await fetch("/api/v1/contacts", { credentials: "include", headers: fetchHeaders });
        const data = await res.json();
        const container = document.getElementById("contacts-list-body");
        const contacts = data.contacts || [];

        if (contacts.length === 0) {
          container.innerHTML = '<p class="text-slate-500 italic text-center py-6">No Contracting Officer contacts indexed yet. Poll SAM.gov or seed demo data.</p>';
          return;
        }

        container.innerHTML = contacts.map(c => {
          const isOsdbu = (c.role || "").toLowerCase().includes("osdbu") || (c.role || "").toLowerCase().includes("small business");
          const badge = isOsdbu
            ? '<span class="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 text-[10px] font-bold uppercase">OSDBU Advocate</span>'
            : '<span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase">Contracting Officer</span>';

          const firstOppId = c.solicitations && c.solicitations[0] ? c.solicitations[0].id : "";
          const solsHtml = (c.solicitations || []).map(s => \`
            <button onclick="document.getElementById('contacts-modal').remove(); viewDetails('\${s.id}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] transition">
              \${escapeHtml(s.solicitationNumber)}
            </button>
          \`).join(" ");

          return \`
            <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-white text-sm">\${escapeHtml(c.name)}</span>
                  \${badge}
                </div>
                <div class="text-slate-400 text-[11px]">
                  <i class="fa-solid fa-landmark mr-1 text-slate-500"></i>\${escapeHtml(c.agency)} — <span class="text-slate-300">\${escapeHtml(c.office)}</span>
                </div>
                <div class="flex items-center gap-4 text-[11px] font-mono pt-0.5">
                  <span class="text-amber-300"><i class="fa-regular fa-envelope mr-1"></i>\${escapeHtml(c.email)}</span>
                  <span class="text-slate-300"><i class="fa-solid fa-phone mr-1 text-slate-500"></i>\${escapeHtml(c.phone)}</span>
                </div>
                <div class="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] text-slate-500">Linked Solicitations:</span>
                  \${solsHtml}
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                \${firstOppId ? \`
                  <button onclick="document.getElementById('contacts-modal').remove(); openSendEmailModal('\${firstOppId}', '\${escapeHtml(c.email)}')" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 font-semibold text-xs transition">
                    <i class="fa-solid fa-paper-plane mr-1.5"></i>Compose Message
                  </button>
                \` : ''}
              </div>
            </div>
          \`;
        }).join("");
      } catch (e) {
        document.getElementById("contacts-list-body").innerHTML = '<p class="text-rose-400 text-center">Failed to load contacts: ' + e.message + '</p>';
      }
    }

    // ==========================================
    // FAR 52.219-27 (50% SUBCONTRACTING) & NMR CALCULATOR MODAL
    // ==========================================
    function openComplianceCalculatorModal(oppId = "", naicsCode = "541512") {
      const existing = document.getElementById("los-calc-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "los-calc-modal";
      modal.className = "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-scale-balanced text-emerald-400 text-lg"></i>
              <div>
                <h3 class="font-bold text-white text-base">FAR 52.219-27 &amp; 13 CFR § 125.6 Subcontracting Calculator</h3>
                <p class="text-[11px] text-slate-400">Verify SDVOSB Self-Performance, "Similarly Situated Entity" Teaming &amp; Non-Manufacturer Rule</p>
              </div>
            </div>
            <button onclick="document.getElementById('los-calc-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Procurement Category (13 CFR § 125.6)</label>
                <select id="los-category" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
                  <option value="services">Services (Max 50% Non-SDVOSB Subcontracting)</option>
                  <option value="supplies">Supplies / Products (Max 50% + Non-Manufacturer Rule)</option>
                  <option value="general_construction">General Construction (Max 85% Non-SDVOSB)</option>
                  <option value="specialty_construction">Specialty Trade Construction (Max 75% Non-SDVOSB)</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Target NAICS Code (for NMR Waiver Check)</label>
                <input id="los-naics" value="\${escapeHtml(naicsCode || '541512')}" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 font-semibold mb-1">Total Contract Award Value ($)</label>
                <input id="los-total" type="number" value="500000" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono">
              </div>
              <div>
                <label class="block text-slate-400 font-semibold mb-1">Cost of Materials Excluded ($ — Supplies/Const Only)</label>
                <input id="los-materials" type="number" value="0" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-emerald-400 font-semibold mb-1">Your Prime SDVOSB Direct ($)</label>
                <input id="los-prime" type="number" value="200000" class="w-full bg-slate-900 border border-emerald-500/40 rounded p-2 text-slate-100 font-mono">
              </div>
              <div>
                <label class="block text-amber-400 font-semibold mb-1" title="Another SBA VetCert SDVOSB subcontractor counts 100% toward your self-performance!">Similarly Situated SDVOSB Sub ($)</label>
                <input id="los-sim-sub" type="number" value="100000" class="w-full bg-slate-900 border border-amber-500/40 rounded p-2 text-slate-100 font-mono">
              </div>
              <div>
                <label class="block text-rose-400 font-semibold mb-1">Non-SDVOSB / Large Sub ($)</label>
                <input id="los-non-sub" type="number" value="200000" class="w-full bg-slate-900 border border-rose-500/40 rounded p-2 text-slate-100 font-mono">
              </div>
            </div>

            <div class="flex items-center justify-between pt-2">
              <button onclick="runLosCalculation('\${oppId}', false)" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow">
                <i class="fa-solid fa-calculator mr-1.5"></i>Calculate FAR 52.219-27 Compliance
              </button>
              \${oppId ? \`
                <button onclick="runLosCalculation('\${oppId}', true)" class="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition">
                  <i class="fa-solid fa-file-shield mr-1.5"></i>Calculate &amp; Save Audit to Solicitation
                </button>
              \` : ''}
            </div>

            <div id="los-result-box" class="hidden p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"></div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
      runLosCalculation(oppId, false);
    }

    async function runLosCalculation(oppId = "", saveToNotes = false) {
      const payload = {
        opportunityId: oppId || undefined,
        procurementType: document.getElementById("los-category").value,
        naicsCode: document.getElementById("los-naics").value.trim(),
        totalContractValue: Number(document.getElementById("los-total").value || 0),
        costOfMaterials: Number(document.getElementById("los-materials").value || 0),
        primeDirectDollars: Number(document.getElementById("los-prime").value || 0),
        similarlySituatedSubDollars: Number(document.getElementById("los-sim-sub").value || 0),
        nonSdvosbSubDollars: Number(document.getElementById("los-non-sub").value || 0),
        saveToNotes
      };

      try {
        const res = await fetch("/api/v1/compliance/calculate-los", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify(payload)
        });
        const { los, nmr } = await res.json();
        const box = document.getElementById("los-result-box");
        box.classList.remove("hidden");

        const statusBadge = los.compliant
          ? '<span class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs"><i class="fa-solid fa-circle-check mr-1"></i>FAR 52.219-27 COMPLIANT</span>'
          : '<span class="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs"><i class="fa-solid fa-triangle-exclamation mr-1"></i>VIOLATION: ILLEGAL PASS-THROUGH RISK</span>';

        box.innerHTML = \`
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span class="font-bold text-white">Compliance Determination</span>
            \${statusBadge}
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="p-2 rounded bg-slate-950 border border-slate-800">
              <span class="text-[10px] text-slate-400 block">SDVOSB Team Share (Prime + Sim. Situated)</span>
              <span class="text-sm font-bold text-emerald-400 font-mono">\${los.effectiveSdvosbTeamPercent}%</span>
            </div>
            <div class="p-2 rounded bg-slate-950 border border-slate-800">
              <span class="text-[10px] text-slate-400 block">Non-SDVOSB Sub Share</span>
              <span class="text-sm font-bold \${los.actualNonSdvosbPercent <= los.maxAllowedNonSdvosbPercent ? 'text-amber-300' : 'text-rose-400'} font-mono">\${los.actualNonSdvosbPercent}% (Max \${los.maxAllowedNonSdvosbPercent}%)</span>
            </div>
            <div class="p-2 rounded bg-slate-950 border border-slate-800">
              <span class="text-[10px] text-slate-400 block">Remaining Non-SDVOSB Sub Cap</span>
              <span class="text-sm font-bold text-slate-200 font-mono">$\${los.remainingNonSdvosbCapacityDollars.toLocaleString()}</span>
            </div>
          </div>
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div class="font-semibold text-amber-400">Non-Manufacturer Rule (13 CFR § 121.406) Check — NAICS \${escapeHtml(nmr.naicsCode)}:</div>
            <div>\${escapeHtml(nmr.waiverSummary)}</div>
            <div class="text-slate-400 italic">\${escapeHtml(nmr.resellerStrategy)}</div>
          </div>
        \`;

        if (saveToNotes && oppId) {
          alert("FAR 52.219-27 Subcontracting Compliance Audit saved to solicitation notes!");
          if (document.getElementById("detail-modal")) {
            viewDetails(oppId);
          }
        }
      } catch (e) {
        alert("Calculation failed: " + e.message);
      }
    }

    async function loadAwardIntelForOpp(oppId) {
      const panel = document.getElementById("opp-award-intel-panel");
      if (!panel) return;
      panel.classList.remove("hidden");
      panel.innerHTML = '<div class="text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Querying USAspending.gov Historical Award &amp; Incumbent Intelligence...</div>';

      try {
        const res = await fetch(\`/api/v1/opportunities/\${oppId}/award-intel\`, { credentials: "include", headers: fetchHeaders });
        const data = await res.json();
        const awards = (data.awardIntelligence && data.awardIntelligence.awards) || [];
        const nmr = data.nmrWaiverStatus || {};

        const rowsHtml = awards.map(a => \`
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="font-bold text-amber-300">\${escapeHtml(a.recipientName)} <span class="text-slate-400 font-mono text-[10px]">(\${escapeHtml(a.awardId)})</span></div>
              <div class="text-slate-300 text-[11px]">\${escapeHtml(a.description)}</div>
              <div class="text-emerald-400 text-[10px] font-semibold mt-0.5"><i class="fa-solid fa-bullseye mr-1"></i>\${escapeHtml(a.capturePlay)}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="font-bold text-white font-mono text-sm">$\${Number(a.awardAmount || 0).toLocaleString()}</div>
              <div class="text-[10px] text-slate-400">Ends: \${escapeHtml(a.endDate)}</div>
            </div>
          </div>
        \`).join("");

        panel.innerHTML = \`
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-amber-400 uppercase tracking-wider"><i class="fa-solid fa-trophy mr-1.5"></i>Historical Award, Incumbent &amp; Subcontracting Intelligence (NAICS \${escapeHtml(data.naicsCode || '541512')})</span>
            <button onclick="document.getElementById('opp-award-intel-panel').classList.add('hidden')" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-2">\${rowsHtml}</div>
          <div class="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
            <strong class="text-cyan-400">SBA Non-Manufacturer Rule Advisory:</strong> \${escapeHtml(nmr.waiverSummary || '')} — \${escapeHtml(nmr.resellerStrategy || '')}
          </div>
        \`;
      } catch (e) {
        panel.innerHTML = '<div class="text-rose-400">Failed to load award intelligence: ' + e.message + '</div>';
      }
    }

    async function generateRfi(oppId) {
      const btn = document.getElementById("btn-generate-rfi");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Saving to R2...';

      const payload = {
        templateType: document.getElementById("rfi-template").value,
        companyName: document.getElementById("rfi-company").value,
        uei: document.getElementById("rfi-uei").value,
        cageCode: document.getElementById("rfi-cage").value,
        sdvosbCertified: document.getElementById("rfi-cert").value === "true",
        customApproach: document.getElementById("rfi-approach").value
      };

      try {
        const res = await fetch(\`/api/v1/opportunities/\${oppId}/generate-rfi\`, {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          document.getElementById("rfi-preview-container").classList.remove("hidden");
          document.getElementById("rfi-preview-content").innerText = data.preview;
          document.getElementById("rfi-r2-key").innerText = data.r2Key;
          btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Saved in R2!';
          await loadStats();
          await loadOpportunities();
        } else {
          const err = await res.json();
          alert("Generation failed: " + (err.message || "Error"));
          btn.disabled = false;
        }
      } catch (e) {
        alert("Error: " + e.message);
        btn.disabled = false;
      }
    }

    // ==========================================
    // MFA SETUP & MANAGEMENT MODAL
    // ==========================================
    async function openMfaModal() {
      const existing = document.getElementById("mfa-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "mfa-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-shield-halved text-amber-400 text-lg"></i>
              <h3 class="font-bold text-white text-base">Multi-Factor Authentication (MFA)</h3>
            </div>
            <button onclick="document.getElementById('mfa-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div id="mfa-content-area" class="space-y-4 text-xs">
            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 space-y-2">
              <p>MFA adds an essential layer of security compliant with <strong>FAR Part 52</strong> and <strong>DoD Zero Trust / NIST SP 800-171</strong> requirements for defense contracting platforms.</p>
              <div id="mfa-current-status" class="pt-1 text-slate-400">Loading current MFA enrollment...</div>
            </div>

            <div id="mfa-setup-step" class="space-y-3">
              <button onclick="startMfaSetup()" id="btn-start-mfa" class="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow shadow-amber-500/20">
                <i class="fa-solid fa-qrcode mr-1.5"></i>Generate Authenticator Secret
              </button>
            </div>

            <div id="mfa-verification-step" class="hidden space-y-3">
              <div class="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
                <span class="text-slate-400 font-semibold block">1. Add to Authenticator App:</span>
                <p class="text-[11px] text-slate-300">Scan using Google Authenticator, Microsoft Authenticator, 1Password, or Authy, or copy the manual key:</p>
                <div class="flex items-center gap-2">
                  <input id="mfa-secret-display" readonly class="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-amber-300 text-xs selection:bg-amber-500">
                  <button onclick="navigator.clipboard.writeText(document.getElementById('mfa-secret-display').value); alert('Copied secret key!');" class="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs">Copy</button>
                </div>
                <div class="pt-1">
                  <a id="mfa-otpauth-link" href="#" class="text-[11px] text-amber-400 hover:underline"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>Open Authenticator Link</a>
                </div>
              </div>

              <div class="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span class="text-slate-400 font-semibold block">2. Save Emergency Backup Codes:</span>
                <div id="mfa-backup-codes-list" class="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-300 pt-1"></div>
              </div>

              <div class="space-y-2">
                <label class="block text-slate-300 font-semibold">3. Enter 6-Digit Code from App:</label>
                <div class="flex gap-2">
                  <input id="mfa-verify-code" maxlength="6" placeholder="123456" class="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-amber-500">
                  <button onclick="submitMfaVerify()" id="btn-verify-mfa" class="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">
                    Verify &amp; Activate
                  </button>
                </div>
              </div>
            </div>

            <div id="mfa-disable-step" class="hidden space-y-3 pt-2 border-t border-slate-800">
              <span class="text-rose-400 font-semibold block">Disable Two-Factor Authentication:</span>
              <p class="text-slate-400 text-[11px]">Enter your account password to remove MFA from your profile.</p>
              <div class="flex gap-2">
                <input id="mfa-disable-pass" type="password" placeholder="Account Password" class="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-xs">
                <button onclick="submitMfaDisable()" class="px-3 py-2 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold text-xs transition border border-rose-500/40">
                  Disable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);

      // Check current user MFA status
      if (mfaStatus && mfaStatus.enabled) {
        document.getElementById("mfa-current-status").innerHTML = '<span class="text-emerald-400 font-bold"><i class="fa-solid fa-circle-check mr-1.5"></i>MFA is ACTIVE on your account</span>';
        document.getElementById("mfa-setup-step").classList.add("hidden");
        document.getElementById("mfa-disable-step").classList.remove("hidden");
      } else {
        const graceMsg = mfaStatus && mfaStatus.mfaEnforced 
          ? '<span class="text-rose-400 font-bold"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Grace period expired. MFA is mandatory.</span>'
          : \`<span class="text-amber-400 font-medium"><i class="fa-solid fa-clock mr-1.5"></i>Grace period active (\${mfaStatus ? mfaStatus.remainingDays : 3} days remaining)</span>\`;
        document.getElementById("mfa-current-status").innerHTML = graceMsg;
      }
    }

    async function startMfaSetup() {
      const btn = document.getElementById("btn-start-mfa");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Generating Secret...';

      try {
        const res = await fetch("/api/v1/auth/mfa/generate", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include"
        });

        if (res.ok) {
          const data = await res.json();
          document.getElementById("mfa-secret-display").value = data.secret;
          document.getElementById("mfa-otpauth-link").href = data.otpAuthUri;
          
          const codesContainer = document.getElementById("mfa-backup-codes-list");
          codesContainer.innerHTML = (data.backupCodes || []).map(c => \`<span class="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-center">\${c}</span>\`).join("");

          document.getElementById("mfa-setup-step").classList.add("hidden");
          document.getElementById("mfa-verification-step").classList.remove("hidden");
        } else {
          alert("Failed to generate MFA secret");
          btn.disabled = false;
        }
      } catch (e) {
        alert("Error: " + e.message);
        btn.disabled = false;
      }
    }

    async function submitMfaVerify() {
      const code = document.getElementById("mfa-verify-code").value.trim();
      if (!code || code.length !== 6) {
        alert("Please enter a valid 6-digit code.");
        return;
      }

      try {
        const res = await fetch("/api/v1/auth/mfa/enable", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ code })
        });

        const data = await res.json();
        if (res.ok) {
          alert("Two-Factor Authentication successfully activated!");
          document.getElementById("mfa-modal").remove();
          await loadUserProfile();
        } else {
          alert(data.error || "Verification failed");
        }
      } catch (e) {
        alert("Error: " + e.message);
      }
    }

    async function submitMfaDisable() {
      const password = document.getElementById("mfa-disable-pass").value;
      if (!password) {
        alert("Please enter your account password to confirm.");
        return;
      }

      try {
        const res = await fetch("/api/v1/auth/mfa/disable", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ password })
        });

        const data = await res.json();
        if (res.ok) {
          alert("MFA disabled.");
          document.getElementById("mfa-modal").remove();
          await loadUserProfile();
        } else {
          alert(data.error || "Failed to disable MFA");
        }
      } catch (e) {
        alert("Error: " + e.message);
      }
    }

    // ==========================================
    // CHANGE PASSWORD MODAL
    // ==========================================
    function openChangePasswordModal() {
      const existing = document.getElementById("change-pass-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "change-pass-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="font-bold text-white text-base">Change Account Password</h3>
            <button onclick="document.getElementById('change-pass-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Current Password</label>
              <input id="cp-current" type="password" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">New Password (min 8 chars)</label>
              <input id="cp-new" type="password" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Confirm New Password</label>
              <input id="cp-confirm" type="password" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200">
            </div>
            <button onclick="submitChangePassword()" class="w-full py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">
              Update Password
            </button>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function submitChangePassword() {
      const currentPassword = document.getElementById("cp-current").value;
      const newPassword = document.getElementById("cp-new").value;
      const confirmPass = document.getElementById("cp-confirm").value;

      if (!currentPassword || !newPassword) {
        alert("Please fill in both current and new passwords.");
        return;
      }

      if (newPassword !== confirmPass) {
        alert("New passwords do not match.");
        return;
      }

      try {
        const res = await fetch("/api/v1/auth/change-password", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();
        if (res.ok) {
          alert("Password successfully updated!");
          document.getElementById("change-pass-modal").remove();
        } else {
          alert(data.error || "Password change failed");
        }
      } catch (e) {
        alert("Error: " + e.message);
      }
    }

    // ==========================================
    // FORGOT & RESET PASSWORD MODAL
    // ==========================================
    function openForgotPasswordModal() {
      const existing = document.getElementById("forgot-pass-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "forgot-pass-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="font-bold text-white text-base">Password Recovery</h3>
            <button onclick="document.getElementById('forgot-pass-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-3 text-xs">
            <p class="text-slate-400">Enter your account email to receive a password reset token.</p>
            <input id="fp-email" type="email" placeholder="user@sdvosb-proposals.mil" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200">
            <button onclick="submitForgotPassword()" id="btn-fp" class="w-full py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">
              Dispatch Reset Link
            </button>
            <div id="fp-result" class="hidden p-3 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-2"></div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function submitForgotPassword() {
      const email = document.getElementById("fp-email").value.trim();
      if (!email) return alert("Email required");

      const btn = document.getElementById("btn-fp");
      btn.disabled = true;

      try {
        const res = await fetch("/api/v1/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        const resDiv = document.getElementById("fp-result");
        resDiv.classList.remove("hidden");
        resDiv.innerHTML = \`
          <p class="text-emerald-400 font-semibold">\${data.message}</p>
          \${data.resetToken ? \`<p class="pt-1">Reset Token: <code class="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-amber-300">\${data.resetToken}</code></p>
          <button onclick="openResetPasswordModal('\${data.resetToken}', '\${email}')" class="mt-2 w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold">Enter New Password Now</button>\` : ''}
        \`;
      } catch (e) {
        alert(e.message);
      } finally {
        btn.disabled = false;
      }
    }

    function openResetPasswordModal(token = "", email = "") {
      const existing = document.getElementById("reset-pass-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "reset-pass-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="font-bold text-white text-base">Set New Password</h3>
            <button onclick="document.getElementById('reset-pass-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Email</label>
              <input id="rp-email" value="\${email}" type="email" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Reset Verification Token</label>
              <input id="rp-token" value="\${token}" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-[11px]">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">New Password (min 8 chars)</label>
              <input id="rp-newpass" type="password" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200">
            </div>
            <button onclick="submitResetPassword()" class="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">
              Confirm New Password
            </button>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function submitResetPassword() {
      const email = document.getElementById("rp-email").value.trim();
      const token = document.getElementById("rp-token").value.trim();
      const newPassword = document.getElementById("rp-newpass").value;

      try {
        const res = await fetch("/api/v1/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          document.getElementById("reset-pass-modal").remove();
          const fp = document.getElementById("forgot-pass-modal");
          if (fp) fp.remove();
        } else {
          alert(data.error || "Reset failed");
        }
      } catch (e) {
        alert(e.message);
      }
    }

    // ==========================================
    // ADMIN USER MANAGEMENT CONSOLE MODAL
    // ==========================================
    async function openAdminConsoleModal() {
      const existing = document.getElementById("admin-console-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "admin-console-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-users-gear text-indigo-400 text-lg"></i>
              <h3 class="font-bold text-white text-base">Administrative User &amp; Access Control Console</h3>
            </div>
            <button onclick="document.getElementById('admin-console-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-white">Authorized Platform Users</h4>
                <p class="text-slate-400 text-[11px]">Manage user credentials, organization access levels, and MFA compliance states.</p>
              </div>
              <button onclick="openCreateUserModal()" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center">
                <i class="fa-solid fa-user-plus mr-1.5"></i>Create New User
              </button>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="py-3 px-4">User</th>
                    <th class="py-3 px-3">Role</th>
                    <th class="py-3 px-3">MFA Compliance</th>
                    <th class="py-3 px-3">Created</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-user-table-body" class="divide-y divide-slate-800/80">
                  <tr><td colspan="5" class="p-4 text-center text-slate-500">Loading user registry...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
      await loadAdminUsers();
    }

    async function loadAdminUsers() {
      const tbody = document.getElementById("admin-user-table-body");
      if (!tbody) return;

      try {
        const res = await fetch("/api/v1/admin/users", { credentials: "include", headers: fetchHeaders });
        if (!res.ok) {
          tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-rose-400">Access denied or failed to load users.</td></tr>';
          return;
        }

        const { users: list } = await res.json();
        tbody.innerHTML = (list || []).map(u => {
          let mfaBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold"><i class="fa-solid fa-check mr-1"></i>Active</span>';
          if (u.mfaStatus === 'grace_period') {
            mfaBadge = \`<span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium"><i class="fa-solid fa-clock mr-1"></i>\${u.remainingGraceDays}d Grace</span>\`;
          } else if (u.mfaStatus === 'enforced_expired') {
            mfaBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold animate-pulse"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Expired</span>';
          }

          const roleColors = {
            admin: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            manager: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            member: 'bg-slate-800 text-slate-300 border-slate-700'
          };
          const roleClass = roleColors[u.role] || roleColors.member;

          return \`
            <tr class="hover:bg-slate-900/60 transition">
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-100">\${u.name}</div>
                <div class="text-[11px] font-mono text-slate-400">\${u.email}</div>
              </td>
              <td class="py-3 px-3">
                <span class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase \${roleClass}">\${u.role}</span>
              </td>
              <td class="py-3 px-3">\${mfaBadge}</td>
              <td class="py-3 px-3 text-slate-400 text-[11px]">\${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
              <td class="py-3 px-4 text-right space-x-1">
                <button onclick="openEditUserModal('\${u.id}', '\${encodeURIComponent(u.name)}', '\${encodeURIComponent(u.email)}', '\${u.role}')" class="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px]" title="Edit User Name, Email, or Role">
                  <i class="fa-solid fa-user-pen mr-1"></i>Edit
                </button>
                <button onclick="adminResetUserPassword('\${u.id}', '\${u.email}')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]" title="Reset Password">
                  <i class="fa-solid fa-key mr-1 text-slate-400"></i>Reset Pass
                </button>
                <button onclick="adminResetUserMfa('\${u.id}', '\${u.email}')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px]" title="Reset MFA">
                  <i class="fa-solid fa-shield-halved mr-1"></i>Reset 2FA
                </button>
                <button onclick="adminDeleteUser('\${u.id}', '\${encodeURIComponent(u.name)}')" class="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px]" title="Delete User">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          \`;
        }).join("");
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-rose-400">Error loading users: ' + e.message + '</td></tr>';
      }
    }

    function openEditUserModal(id, encName, encEmail, currentRole) {
      const name = decodeURIComponent(encName);
      const email = decodeURIComponent(encEmail);

      const existing = document.getElementById("edit-user-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "edit-user-modal";
      modal.className = "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-user-pen text-indigo-400 text-base"></i>
              <h3 class="font-bold text-white text-base">Edit User Profile</h3>
            </div>
            <button onclick="document.getElementById('edit-user-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="edit-user-error" class="hidden p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"></div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Full Name</label>
              <input id="edit-user-name" type="text" value="\${escapeHtml(name)}" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Email Address</label>
              <input id="edit-user-email" type="email" value="\${escapeHtml(email)}" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Organization Role</label>
              <select id="edit-user-role" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
                <option value="admin" \${currentRole === 'admin' ? 'selected' : ''}>Admin (Platform Control)</option>
                <option value="manager" \${currentRole === 'manager' ? 'selected' : ''}>Manager (Proposal Director)</option>
                <option value="member" \${currentRole === 'member' ? 'selected' : ''}>Member (Capture Analyst)</option>
              </select>
            </div>
            <div class="pt-2 flex justify-end space-x-2 border-t border-slate-800">
              <button onclick="document.getElementById('edit-user-modal').remove()" class="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs">
                Cancel
              </button>
              <button onclick="submitEditUser('\${id}')" id="btn-save-user" class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function submitEditUser(userId) {
      const name = document.getElementById("edit-user-name").value.trim();
      const email = document.getElementById("edit-user-email").value.trim();
      const role = document.getElementById("edit-user-role").value;
      const errBox = document.getElementById("edit-user-error");
      const btn = document.getElementById("btn-save-user");

      if (!name || !email) {
        errBox.innerText = "Full name and email address are required.";
        errBox.classList.remove("hidden");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Saving...';

      try {
        const res = await fetch(\`/api/v1/admin/users/\${userId}\`, {
          method: "PATCH",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ name, email, role })
        });
        const data = await res.json();
        if (res.ok) {
          document.getElementById("edit-user-modal").remove();
          await loadAdminUsers();
          if (currentUser && currentUser.id === userId) {
            await loadUserProfile();
          }
          alert("User profile updated successfully!");
        } else {
          errBox.innerText = data.error || "Failed to update user profile.";
          errBox.classList.remove("hidden");
        }
      } catch (e) {
        errBox.innerText = e.message;
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
      }
    }

    function openCreateUserModal() {
      const existing = document.getElementById("create-user-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "create-user-modal";
      modal.className = "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-user-plus text-indigo-400 text-base"></i>
              <h3 class="font-bold text-white text-base">Create New Platform User</h3>
            </div>
            <button onclick="document.getElementById('create-user-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="create-user-error" class="hidden p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"></div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Full Name</label>
              <input id="create-user-name" type="text" placeholder="e.g. John Doe" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Email Address</label>
              <input id="create-user-email" type="email" placeholder="e.g. j.doe@sdvosb-firm.mil" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Role</label>
              <select id="create-user-role" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
                <option value="member" selected>Member (Capture Analyst)</option>
                <option value="manager">Manager (Proposal Director)</option>
                <option value="admin">Admin (Platform Administrator)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Temporary Password (optional)</label>
              <input id="create-user-pass" type="text" placeholder="Defaults to SidequestSDVOSB!2026" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono text-[11px]">
            </div>
            <div class="pt-2 flex justify-end space-x-2 border-t border-slate-800">
              <button onclick="document.getElementById('create-user-modal').remove()" class="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs">
                Cancel
              </button>
              <button onclick="submitCreateUser()" id="btn-submit-create-user" class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition">
                Create User
              </button>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function submitCreateUser() {
      const name = document.getElementById("create-user-name").value.trim();
      const email = document.getElementById("create-user-email").value.trim();
      const role = document.getElementById("create-user-role").value;
      const password = document.getElementById("create-user-pass").value.trim();
      const errBox = document.getElementById("create-user-error");
      const btn = document.getElementById("btn-submit-create-user");

      if (!name || !email) {
        errBox.innerText = "Full name and email are required.";
        errBox.classList.remove("hidden");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Creating...';

      try {
        const res = await fetch("/api/v1/admin/users", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({ name, email, role, password: password || undefined })
        });
        const data = await res.json();
        if (res.ok) {
          document.getElementById("create-user-modal").remove();
          await loadAdminUsers();
          alert(data.message);
        } else {
          errBox.innerText = data.error || "Failed to create user.";
          errBox.classList.remove("hidden");
        }
      } catch (e) {
        errBox.innerText = e.message;
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create User';
      }
    }

    function adminResetUserPassword(userId, email) {
      if (!confirm(\`Generate a new temporary password for \${email}?\`)) return;

      fetch(\`/api/v1/admin/users/\${userId}/reset-password\`, {
        method: "POST",
        headers: fetchHeaders,
        credentials: "include",
        body: JSON.stringify({})
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(\`Password Reset Successful!\\nTemporary Password: \${data.temporaryPassword}\`);
          loadAdminUsers();
        } else {
          alert(data.error || "Reset failed");
        }
      });
    }

    function adminResetUserMfa(userId, email) {
      if (!confirm(\`Reset Two-Factor Authentication for \${email}? This allows the user to re-enroll with a new device.\`)) return;

      fetch(\`/api/v1/admin/users/\${userId}/reset-mfa\`, {
        method: "POST",
        headers: fetchHeaders,
        credentials: "include",
        body: JSON.stringify({})
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          loadAdminUsers();
        } else {
          alert(data.error || "MFA Reset failed");
        }
      });
    }

    function adminDeleteUser(userId, name) {
      const decodedName = decodeURIComponent(name);
      if (!confirm(\`Are you sure you want to delete user "\${decodedName}"? This will permanently revoke access.\`)) return;

      fetch(\`/api/v1/admin/users/\${userId}\`, {
        method: "DELETE",
        headers: fetchHeaders,
        credentials: "include"
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          loadAdminUsers();
        } else {
          alert(data.error || "Delete failed");
        }
      });
    }

    function openSignInModal() {
      const existing = document.getElementById("signin-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "signin-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      const defaultEmail = currentUser ? currentUser.email : "admin@sdvosb-proposals.mil";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-shield-halved text-amber-400 text-lg"></i>
              <h3 class="font-bold text-white text-base">Sign In to SDVOSB Capture</h3>
            </div>
            <button onclick="document.getElementById('signin-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="signin-error" class="hidden p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"></div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Email Address</label>
              <input id="signin-email" type="email" value="\${defaultEmail}" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100" placeholder="user@sdvosb.mil">
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-slate-400 font-semibold">Password</label>
                <button type="button" onclick="openForgotPasswordModal()" class="text-[11px] text-amber-400 hover:underline">Forgot password?</button>
              </div>
              <input id="signin-password" type="password" value="AdminSDVOSB!2026#Secure" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100" placeholder="••••••••••••">
            </div>
            <div id="signin-mfa-group" class="hidden">
              <label class="block text-amber-400 font-semibold mb-1">6-Digit Authenticator Code (MFA)</label>
              <input id="signin-mfa-code" maxlength="6" class="w-full bg-slate-900 border border-amber-500/50 rounded p-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-amber-400" placeholder="123456">
            </div>
            <button onclick="submitSignIn()" id="btn-submit-signin" class="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20">
              Sign In
            </button>
            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Default Admin: <span class="font-mono text-slate-300">admin@sdvosb-proposals.mil</span></span>
              <button onclick="fillAdminDemoCreds()" class="text-amber-400 hover:underline font-semibold">Auto-Fill</button>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    function fillAdminDemoCreds() {
      const emailInput = document.getElementById("signin-email");
      const passInput = document.getElementById("signin-password");
      if (emailInput) emailInput.value = "admin@sdvosb-proposals.mil";
      if (passInput) passInput.value = "AdminSDVOSB!2026#Secure";
    }

    async function submitSignIn() {
      const errBox = document.getElementById("signin-error");
      errBox.classList.add("hidden");
      const email = document.getElementById("signin-email").value.trim();
      const password = document.getElementById("signin-password").value;
      const code = document.getElementById("signin-mfa-code") ? document.getElementById("signin-mfa-code").value.trim() : "";
      const btn = document.getElementById("btn-submit-signin");

      if (!email || !password) {
        errBox.innerText = "Please enter both email address and password.";
        errBox.className = "p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs";
        errBox.classList.remove("hidden");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Signing In...';

      try {
        const res = await fetch("/api/v1/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, code: code || undefined })
        });
        const data = await res.json();

        if (res.ok) {
          if (data.mfaRequired) {
            document.getElementById("signin-mfa-group").classList.remove("hidden");
            document.getElementById("signin-mfa-code").focus();
            errBox.innerText = data.message;
            errBox.className = "p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs";
            errBox.classList.remove("hidden");
            btn.disabled = false;
            btn.innerHTML = 'Verify &amp; Sign In';
            return;
          }

          localStorage.removeItem("sidequest_logged_out");
          if (data.token) {
            localStorage.setItem("sidequest_token", data.token);
            fetchHeaders["Authorization"] = "Bearer " + data.token;
          }
          delete fetchHeaders["X-Dev-User-Id"];
          delete fetchHeaders["X-Dev-Role"];
          delete fetchHeaders["X-Dev-Org-Id"];

          document.getElementById("signin-modal").remove();
          await loadUserProfile();
          await loadStats();
          await loadOpportunities();
        } else {
          errBox.innerText = data.error || "Authentication failed.";
          errBox.className = "p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs";
          errBox.classList.remove("hidden");
        }
      } catch (e) {
        errBox.innerText = e.message;
        errBox.className = "p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs";
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    }

    function openModal(id) {
      if (id === "modal-profiles") {
        renderProfilesModal();
      } else if (id === "modal-capability") {
        renderCapabilityModal();
      }
    }

    async function renderProfilesModal() {
      const res = await fetch("/api/v1/saved-search-profiles", { credentials: "include", headers: fetchHeaders });
      const { data: profiles } = await res.json();

      const existing = document.getElementById("profiles-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "profiles-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      let listHtml = (profiles || []).map(p => \`
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-100">\${p.name}</span>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold \${p.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
                \${p.active ? 'ACTIVE' : 'PAUSED'}
              </span>
              <button onclick="deleteProfile('\${p.id}')" class="text-slate-500 hover:text-rose-400 text-xs">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="text-slate-400 text-[11px]">NAICS: <span class="font-mono text-slate-300">\${p.naicsCodes}</span></div>
          <div class="text-slate-400 text-[11px]">Set-Asides: <span class="font-mono text-amber-400">\${p.setAsides}</span></div>
          \${p.maxValue ? \`<div class="text-slate-400 text-[11px]">Max Ceiling: <span class="text-emerald-400 font-mono">$\${p.maxValue.toLocaleString()} (Simplified Acquisition)</span></div>\` : ''}
        </div>
      \`).join("");

      if (!listHtml) listHtml = '<p class="text-xs text-slate-500 italic">No profiles created yet. Add one below!</p>';

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="font-bold text-white text-base">SDVOSB Saved Search &amp; Alert Profiles</h3>
            <button onclick="document.getElementById('profiles-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto">\${listHtml}</div>
          <div class="border-t border-slate-800 pt-3 space-y-3">
            <h4 class="text-xs font-bold text-amber-400 uppercase">Create New Search Profile</h4>
            <input id="new-prof-name" placeholder="Profile Name (e.g. Defense Health IT)" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100">
            <input id="new-prof-naics" placeholder="NAICS codes comma separated (e.g. 541512, 541519)" value="541512, 541519" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="new-prof-sat" checked class="rounded bg-slate-900 border-slate-800 text-amber-500">
              <label for="new-prof-sat" class="text-xs text-slate-300">Simplified Acquisition Threshold Cap ($250,000)</label>
            </div>
            <button onclick="submitNewProfile()" class="w-full py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">Save Profile</button>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function deleteProfile(id) {
      if (!confirm("Delete this saved search profile?")) return;
      try {
        const res = await fetch(\`/api/v1/saved-search-profiles/\${id}\`, {
          method: "DELETE",
          headers: fetchHeaders,
          credentials: "include"
        });
        if (res.ok) renderProfilesModal();
      } catch (e) {
        alert(e.message);
      }
    }

    async function submitNewProfile() {
      const name = document.getElementById("new-prof-name").value.trim();
      const naicsRaw = document.getElementById("new-prof-naics").value.trim();
      const naicsCodes = naicsRaw.split(",").map(s => s.trim()).filter(Boolean);
      const isSat = document.getElementById("new-prof-sat").checked;

      try {
        const res = await fetch("/api/v1/saved-search-profiles", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({
            name,
            naicsCodes,
            setAsides: ["SDVOSBC"],
            maxValue: isSat ? 250000 : null
          })
        });
        if (res.ok) {
          renderProfilesModal();
        }
      } catch (e) {
        alert(e.message);
      }
    }

    async function renderCapabilityModal() {
      const res = await fetch("/api/v1/capability-statements", { credentials: "include", headers: fetchHeaders });
      const { data: stmts } = await res.json();

      const existing = document.getElementById("cap-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "cap-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      let listHtml = (stmts || []).map(s => \`
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-100">\${s.title}</span>
            <button onclick="deleteCap('\${s.id}')" class="text-slate-500 hover:text-rose-400 text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div class="text-slate-400 font-mono text-[11px]">UEI: \${s.dunsUei} | CAGE: \${s.cageCode}</div>
          <div class="text-amber-400 text-[10px] font-semibold">\${s.sdvosbCertified ? 'VERIFIED SDVOSB' : 'VOSB'}</div>
        </div>
      \`).join("");

      if (!listHtml) listHtml = '<p class="text-xs text-slate-500 italic">No capability statements stored. Add one below!</p>';

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="font-bold text-white text-base">Corporate Capability Statements</h3>
            <button onclick="document.getElementById('cap-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto">\${listHtml}</div>
          <div class="border-t border-slate-800 pt-3 space-y-3">
            <h4 class="text-xs font-bold text-amber-400 uppercase">Save New Credentials</h4>
            <input id="cap-title" placeholder="Profile Title (e.g. Master SDVOSB Cyber Profile)" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100">
            <div class="grid grid-cols-2 gap-2">
              <input id="cap-uei" placeholder="UEI (e.g. VET123456789)" class="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono">
              <input id="cap-cage" placeholder="CAGE Code (e.g. 8XYZ1)" class="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono">
            </div>
            <button onclick="submitNewCap()" class="w-full py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">Save Statement</button>
          </div>
        </div>
      \`;

      document.body.appendChild(modal);
    }

    async function deleteCap(id) {
      if (!confirm("Delete this capability statement?")) return;
      try {
        const res = await fetch(\`/api/v1/capability-statements/\${id}\`, {
          method: "DELETE",
          headers: fetchHeaders,
          credentials: "include"
        });
        if (res.ok) renderCapabilityModal();
      } catch (e) {
        alert(e.message);
      }
    }

    async function submitNewCap() {
      const title = document.getElementById("cap-title").value.trim();
      const dunsUei = document.getElementById("cap-uei").value.trim();
      const cageCode = document.getElementById("cap-cage").value.trim();

      try {
        const res = await fetch("/api/v1/capability-statements", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include",
          body: JSON.stringify({
            title,
            dunsUei,
            cageCode,
            coreCompetencies: "Enterprise Cloud, Zero Trust Architecture, DevSecOps",
            pastPerformance: "DHA, VA, DoD Cyber Command Past Performance"
          })
        });
        if (res.ok) {
          renderCapabilityModal();
        }
      } catch (e) {
        alert(e.message);
      }
    }

    // Auto load on init
    window.addEventListener("DOMContentLoaded", () => {
      // Sync Light/Dark Theme Toggle UI (Light Mode default)
      const savedTheme = localStorage.getItem("sidequest_theme") || "light";
      applyThemeUI(savedTheme);

      // Register PWA Service Worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("ServiceWorker registration warning:", err);
        });
      }

      // Check for password reset token in query string
      const urlParams = new URLSearchParams(window.location.search);
      const resetToken = urlParams.get("reset_token");
      const email = urlParams.get("email");
      if (resetToken) {
        openResetPasswordModal(resetToken, email || "");
      }

      loadUserProfile();
      loadStats();
      loadOpportunities();
    });
  </script>
</body>
</html>`;
}

export function renderKanbanBoard(): string {
  return `
    <div class="space-y-3">

      <!-- Unified Search, Filter & 13 Target NAICS Control Bar -->
      <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm text-xs">
        
        <!-- Row 1: Search & Dropdown Filters -->
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <select id="filter-naics" onchange="populateDynamicNaicsFilter(currentOpportunities); applyFilters();" class="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-200 font-medium">
              <option value="">All NAICS</option>
              <option value="PRIORITY_ALL">★ All 13 Target NAICS</option>
            </select>

            <select id="filter-setaside" onchange="applyFilters()" class="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-200">
              <option value="" selected>All Set-Asides</option>
              <option value="SDVOSBC">SDVOSBC (Set-Aside)</option>
              <option value="SDVOSBS">SDVOSBS (Sole Source)</option>
              <option value="VOSBC">VOSBC (Veteran-Owned)</option>
              <option value="SBA">SBA (Rule-of-Two Flip)</option>
            </select>

            <select id="filter-notice-type" onchange="applyFilters()" class="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-200">
              <option value="">All Stages</option>
              <option value="p">Presolicitation (p)</option>
              <option value="r">Sources Sought / RFI (r)</option>
              <option value="k">Combined Synopsis / SAT (k)</option>
              <option value="o">Solicitation / RFP (o)</option>
              <option value="s">Special / Sole Source (s)</option>
              <option value="a">Market Awards (a)</option>
            </select>

            <button id="btn-sat-toggle" onclick="toggleSatFilter()" class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>SAT &lt; $250k</span>
            </button>

            <button id="btn-ro2-toggle" onclick="toggleRuleOfTwoFilter()" class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1" title="Show Unrestricted/Small Business Sources Sought to flip to SDVOSBC">
              <span class="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
              <span>Rule-of-Two</span>
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <input id="search-input" onkeyup="if(event.key==='Enter') applyFilters()" placeholder="Search solicitation, agency, keyword..." class="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 placeholder-slate-500 w-52 sm:w-64 focus:outline-none focus:border-amber-500">
            <button onclick="applyFilters()" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium">Search</button>
          </div>
        </div>

        <!-- Row 2: Compact 13 Priority Target NAICS Quick-Filter Strip -->
        <div class="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
          <div class="flex items-center gap-1 flex-wrap" id="priority-naics-pills">
            <!-- Populated dynamically by renderPriorityNaicsBar() -->
          </div>
          <span id="priority-naics-summary" class="text-[10px] text-slate-400 font-mono hidden xl:inline shrink-0"></span>
        </div>

      </div>

      <!-- Kanban Pipeline Columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
        
        <!-- Column 1: New Opportunities -->
        <div class="flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3 kanban-col shadow-inner">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">New Notices</h3>
            </div>
            <span id="count-new" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">0</span>
          </div>
          <div id="col-new" class="space-y-3 flex-1 overflow-y-auto"></div>
        </div>

        <!-- Column 2: Reviewing SOW -->
        <div class="flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3 kanban-col shadow-inner">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">Reviewing SOW</h3>
            </div>
            <span id="count-reviewing" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">0</span>
          </div>
          <div id="col-reviewing" class="space-y-3 flex-1 overflow-y-auto"></div>
        </div>

        <!-- Column 3: Drafting RFI -->
        <div class="flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3 kanban-col shadow-inner">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">Drafting RFI</h3>
            </div>
            <span id="count-drafting" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">0</span>
          </div>
          <div id="col-drafting" class="space-y-3 flex-1 overflow-y-auto"></div>
        </div>

        <!-- Column 4: Submitted -->
        <div class="flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3 kanban-col shadow-inner">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">Submitted</h3>
            </div>
            <span id="count-submitted" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">0</span>
          </div>
          <div id="col-submitted" class="space-y-3 flex-1 overflow-y-auto"></div>
        </div>

        <!-- Column 5: Won / Awarded -->
        <div class="flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3 kanban-col shadow-inner">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">My Won Contracts</h3>
            </div>
            <span id="count-won" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">0</span>
          </div>
          <div id="col-won" class="space-y-3 flex-1 overflow-y-auto"></div>
        </div>

      </div>

    </div>

    <script>
      let satFilterActive = false;
      let ruleOfTwoFilterActive = false;

      function toggleSatFilter() {
        satFilterActive = !satFilterActive;
        const btn = document.getElementById("btn-sat-toggle");
        if (satFilterActive) {
          btn.classList.add("bg-emerald-500/20", "text-emerald-300", "border-emerald-500/40");
        } else {
          btn.classList.remove("bg-emerald-500/20", "text-emerald-300", "border-emerald-500/40");
        }
        applyFilters();
      }

      function toggleRuleOfTwoFilter() {
        ruleOfTwoFilterActive = !ruleOfTwoFilterActive;
        const btn = document.getElementById("btn-ro2-toggle");
        if (ruleOfTwoFilterActive) {
          btn.classList.add("bg-fuchsia-500/20", "text-fuchsia-300", "border-fuchsia-500/40");
        } else {
          btn.classList.remove("bg-fuchsia-500/20", "text-fuchsia-300", "border-fuchsia-500/40");
        }
        applyFilters();
      }

      function applyFilters() {
        const naics = document.getElementById("filter-naics").value;
        const setAside = document.getElementById("filter-setaside").value;
        const noticeType = document.getElementById("filter-notice-type") ? document.getElementById("filter-notice-type").value : "";
        const q = document.getElementById("search-input").value.toLowerCase().trim();

        const filtered = currentOpportunities.filter(o => {
          if (naics === "PRIORITY_ALL") {
            if (!o.naicsCode || !PRIORITY_NAICS_SET.has(o.naicsCode)) return false;
          } else if (naics) {
            if (!(o.naicsCode || "").includes(naics)) return false;
          }
          if (setAside && o.setAsideCode !== setAside) return false;
          const nt = (o.noticeType || "").toLowerCase();
          if (noticeType) {
            const targetNt = noticeType.toLowerCase();
            if (targetNt === "r" && !(nt === "r" || nt.includes("sources sought"))) return false;
            else if (targetNt === "k" && !(nt === "k" || nt.includes("combined"))) return false;
            else if (targetNt === "o" && !(nt === "o" || nt === "solicitation")) return false;
            else if (targetNt === "s" && !(nt === "s" || nt.includes("special"))) return false;
            else if (targetNt === "a" && !(nt === "a" || nt.includes("award"))) return false;
            else if (targetNt === "p" && !(nt === "p" || nt.includes("presolicitation"))) return false;
          }
          if (satFilterActive) {
            const isSat = nt === "k" ||
                          nt.includes("combined") ||
                          (o.title || "").toLowerCase().includes("simplified acquisition") || 
                          (o.title || "").toLowerCase().includes("sat") || 
                          (o.solicitationNumber || "").includes("Q");
            if (!isSat) return false;
          }
          if (ruleOfTwoFilterActive) {
            const isRo2 = (nt === "r" || nt.includes("sources sought")) && !["SDVOSBC", "SDVOSBS"].includes(o.setAsideCode || "");
            if (!isRo2) return false;
          }
          if (q) {
            const haystack = ((o.title || "") + " " + (o.solicitationNumber || "") + " " + (o.agency || "")).toLowerCase();
            if (!haystack.includes(q)) return false;
          }
          return true;
        });

        renderKanban(filtered);
      }
    </script>
  `;
}
