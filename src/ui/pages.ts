export function renderAppLayout(content: string, title = "SDVOSB Federal Capture Platform") {
  return `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950 text-slate-100">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Sidequest GovTech</title>
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
      min-height: calc(100vh - 240px);
    }
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #020617; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
  </style>
</head>
<body class="h-full flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-900">
  
  <!-- Navigation Header -->
  <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Brand & Badges -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <i class="fa-solid fa-shield-halved text-xl"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-lg tracking-tight text-white">SIDEQUEST</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase badge-sdvosb">
                SDVOSB CAPTURE ENGINE
              </span>
            </div>
            <p class="text-xs text-slate-400">SAM.gov Opportunities & Proposal Lifecycle Platform</p>
          </div>
        </div>

        <!-- Quick Metrics & Actions -->
        <div class="flex items-center space-x-3">
          <div id="sync-status-badge" class="hidden sm:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span id="last-sync-text">SAM.gov Sync: Ready</span>
          </div>

          <button onclick="triggerSamSync()" id="btn-sync" class="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow shadow-amber-500/20">
            <i class="fa-solid fa-rotate"></i>
            <span>Poll SAM.gov</span>
          </button>

          <button onclick="seedDemoData()" id="btn-seed" class="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition">
            <i class="fa-solid fa-database mr-1.5 text-amber-400"></i>Seed Demo Data
          </button>

          <button onclick="openModal('modal-profiles')" class="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">
            <i class="fa-solid fa-sliders mr-1.5"></i>Search Profiles
          </button>

          <button onclick="openModal('modal-capability')" class="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">
            <i class="fa-solid fa-award mr-1.5 text-amber-400"></i>SDVOSB Credentials
          </button>
        </div>

      </div>
    </div>
  </header>

  <!-- Metric Strip -->
  <section class="bg-slate-900/40 border-b border-slate-800/80 py-3">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span class="text-slate-400 block text-[11px]">Identified Opportunities</span>
          <span id="stat-total" class="text-lg font-bold text-white">0</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span class="text-slate-400 block text-[11px]">New Notices</span>
          <span id="stat-new" class="text-lg font-bold text-amber-400">0</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span class="text-slate-400 block text-[11px]">Reviewing SOW</span>
          <span id="stat-reviewing" class="text-lg font-bold text-blue-400">0</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span class="text-slate-400 block text-[11px]">Drafting RFI Proposal</span>
          <span id="stat-active" class="text-lg font-bold text-amber-500">0</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span class="text-slate-400 block text-[11px]">Submitted Proposals</span>
          <span id="stat-submitted" class="text-lg font-bold text-purple-400">0</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span class="text-slate-400 block text-[11px]">Won / Awarded</span>
          <span id="stat-won" class="text-lg font-bold text-emerald-400">0</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Main View Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    ${content}
  </main>

  <!-- Client-side Interactive Logic -->
  <script>
    let currentOpportunities = [];
    let selectedOpp = null;
    const devUserId = "sdvosb_pilot_officer";

    const fetchHeaders = {
      "Content-Type": "application/json",
      "X-Dev-User-Id": devUserId,
      "X-Dev-Role": "admin",
      "X-Dev-Org-Id": "org_demo_sdvosb"
    };

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
        const res = await fetch("/api/v1/opportunities?limit=100", { credentials: "include", headers: fetchHeaders });
        if (res.ok) {
          const json = await res.json();
          currentOpportunities = json.data || [];
          renderKanban(currentOpportunities);
        }
      } catch (e) {
        console.error("Failed to load opportunities", e);
      }
    }

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

      // Clear columns
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
        
        const isSourcesSought = (opp.noticeType || "").toLowerCase() === "r" || (opp.title || "").toLowerCase().includes("sources sought");
        const isSat = (opp.title || "").toLowerCase().includes("simplified acquisition") || 
                      (opp.title || "").toLowerCase().includes("sat") || 
                      (opp.solicitationNumber || "").includes("Q");

        const badgeType = isSourcesSought 
          ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">RFI / Sources Sought</span>'
          : '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">Solicitation</span>';

        const satBadge = isSat
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded badge-sat uppercase">SAT &lt; $250k</span>'
          : '';

        const deadlineHtml = calculateDeadlineBadge(opp.responseDeadline);

        card.innerHTML = \`
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              \${badgeType}
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
              <span class="text-slate-400"><i class="fa-solid fa-tag text-[10px] w-4 text-slate-500"></i>NAICS \${opp.naicsCode || "N/A"}</span>
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

      // Update column badges
      document.getElementById("count-new").innerText = cols.new ? cols.new.children.length : 0;
      document.getElementById("count-reviewing").innerText = cols.reviewing_sow ? cols.reviewing_sow.children.length : 0;
      document.getElementById("count-drafting").innerText = cols.drafting_rfi ? cols.drafting_rfi.children.length : 0;
      document.getElementById("count-submitted").innerText = cols.submitted ? cols.submitted.children.length : 0;
      document.getElementById("count-won").innerText = cols.won ? cols.won.children.length : 0;
    }

    async function triggerSamSync() {
      const btn = document.getElementById("btn-sync");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Ingesting...</span>';
      
      try {
        const res = await fetch("/api/v1/ingest/run", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include"
        });
        const result = await res.json();
        alert(\`SAM.gov Sync Completed! Processed: \${result.noticesProcessed} notices, Generated Alerts: \${result.alertsCreated}\`);
        await loadStats();
        await loadOpportunities();
      } catch (e) {
        alert("Failed to sync with SAM.gov: " + e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate"></i><span>Poll SAM.gov</span>';
      }
    }

    async function seedDemoData() {
      const btn = document.getElementById("btn-seed");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Seeding...';

      try {
        const res = await fetch("/api/v1/seed", {
          method: "POST",
          headers: fetchHeaders,
          credentials: "include"
        });
        if (res.ok) {
          await loadStats();
          await loadOpportunities();
          alert("Demonstration SDVOSB opportunities, capability statements, and profiles initialized successfully!");
        }
      } catch (e) {
        alert("Seed failed: " + e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-database mr-1.5 text-amber-400"></i>Seed Demo Data';
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

      let notesHtml = (notes || []).map(n => \`
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
          <div class="flex items-center justify-between text-slate-400">
            <span class="font-semibold text-slate-300 flex items-center gap-1.5">
              <i class="fa-solid fa-\${n.source === 'email' ? 'envelope text-blue-400' : 'user-pen text-amber-400'}"></i>
              \${n.authorEmail}
            </span>
            <span class="text-[10px] text-slate-500 font-mono">\${n.createdAt || ""}</span>
          </div>
          <div class="font-medium text-slate-200">\${n.subject || ""}</div>
          <p class="text-slate-400 whitespace-pre-wrap leading-relaxed">\${n.content}</p>
        </div>
      \`).join("");

      if (!notesHtml) notesHtml = '<p class="text-xs text-slate-500 italic">No notes or captured emails recorded yet.</p>';

      let attachmentsHtml = (attachments || []).map(a => \`
        <div class="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
          <div class="flex items-center space-x-2 truncate">
            <i class="fa-regular fa-file-lines text-amber-400"></i>
            <span class="truncate text-slate-200">\${a.filename}</span>
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
          
          <!-- Header -->
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

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            
            <!-- Quick Meta Grid -->
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

            <!-- Pipeline Status Changer -->
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

            <!-- SAM.gov Link & Contact -->
            <div class="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span class="text-slate-400">Contracting Officer:</span>
                <span class="text-slate-200 font-mono ml-2">\${opp.pointOfContactEmail || "Listed in SAM.gov solicitation notice"}</span>
              </div>
              <a href="\${opp.uiLink}" target="_blank" class="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium transition">
                <i class="fa-solid fa-arrow-up-right-from-square mr-1.5"></i>SAM.gov Notice
              </a>
            </div>

            <!-- Attachments & Generated Documents -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Proposal Artifacts & Cloudflare R2</h4>
                <button onclick="openRfiModal('\${opp.id}')" class="text-xs text-amber-400 hover:underline">
                  <i class="fa-solid fa-plus mr-1"></i>Generate New Proposal Artifact
                </button>
              </div>
              <div class="space-y-2">\${attachmentsHtml}</div>
            </div>

            <!-- Notes & Captured Inbound Emails -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Contracting Officer Communications & Capture Notes</h4>
              <div class="space-y-2">\${notesHtml}</div>
              
              <!-- Add Note Form -->
              <div class="pt-2 flex gap-2">
                <input id="new-note-text" placeholder="Add manual capture intelligence note..." class="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                <button onclick="submitManualNote('\${opp.id}')" class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold">
                  Add Note
                </button>
              </div>
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end space-x-3">
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
      const opp = currentOpportunities.find(o => o.id === oppId);
      if (!opp) return;

      const existing = document.getElementById("rfi-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "rfi-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm";

      modal.innerHTML = \`
        <div class="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          
          <div class="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
            <div>
              <span class="text-xs font-mono text-amber-400 font-semibold uppercase">SDVOSB Proposal Studio & R2 Engine</span>
              <h3 class="text-base font-bold text-white">\${opp.solicitationNumber || opp.title}</h3>
            </div>
            <button onclick="document.getElementById('rfi-modal').remove()" class="text-slate-400 hover:text-white text-lg p-1">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            
            <!-- Template Selection -->
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Proposal Document Template</label>
              <select id="rfi-template" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100">
                <option value="sources_sought">Sources Sought / RFI Capabilities Statement (Section L Alignment)</option>
                <option value="sat_quote">Simplified Acquisition Threshold Quote (&lt; $250k Commercial Item)</option>
                <option value="past_performance_matrix">Past Performance Relevancy Matrix &amp; CPARS Benchmarks</option>
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
              <label class="block text-slate-400 font-semibold mb-1">Section L Technical Differentiators &amp; FAR 52.219-27 Compliance</label>
              <textarea id="rfi-approach" rows="3" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono text-[11px]" placeholder="Specific technical approach, staffing models, and compliance notes..."></textarea>
            </div>

            <!-- Preview Container -->
            <div id="rfi-preview-container" class="hidden space-y-2 pt-2 border-t border-slate-800">
              <div class="flex items-center justify-between">
                <span class="font-bold text-amber-400 flex items-center gap-1.5">
                  <i class="fa-solid fa-check text-emerald-400"></i>Proposal Generated &amp; Stored in R2:
                </span>
                <span id="rfi-r2-key" class="font-mono text-slate-400 text-[10px]"></span>
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
          alert("Generation failed");
          btn.disabled = false;
        }
      } catch (e) {
        alert("Error: " + e.message);
        btn.disabled = false;
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
      loadStats();
      loadOpportunities();
    });
  </script>
</body>
</html>`;
}

export function renderKanbanBoard(): string {
  return `
    <div class="space-y-4">
      
      <!-- Filter Bar -->
      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center space-x-2 flex-wrap gap-y-2">
          <span class="text-slate-400 font-semibold"><i class="fa-solid fa-filter mr-1.5 text-slate-500"></i>Filters:</span>
          
          <select id="filter-setaside" onchange="applyFilters()" class="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200">
            <option value="">All Set-Asides</option>
            <option value="SDVOSBC" selected>SDVOSBC (Service-Disabled Veteran)</option>
            <option value="VOSBC">VOSBC (Veteran-Owned)</option>
          </select>

          <select id="filter-naics" onchange="applyFilters()" class="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200">
            <option value="">All NAICS</option>
            <option value="541512">541512 (Systems Integration)</option>
            <option value="541519">541519 (Other IT Services)</option>
            <option value="541511">541511 (Custom Programming)</option>
          </select>

          <button id="btn-sat-toggle" onclick="toggleSatFilter()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Simplified Acquisition (&lt; $250k)</span>
          </button>
        </div>

        <div class="flex items-center space-x-2">
          <input id="search-input" onkeyup="if(event.key==='Enter') applyFilters()" placeholder="Search solicitation, agency, keyword..." class="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-slate-200 placeholder-slate-500 w-64 focus:outline-none focus:border-amber-500">
          <button onclick="applyFilters()" class="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium">Search</button>
        </div>
      </div>

      <!-- Kanban Pipeline Columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
        
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
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">Won / Awarded</h3>
            </div>
            <span id="count-won" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">0</span>
          </div>
          <div id="col-won" class="space-y-3 flex-1 overflow-y-auto"></div>
        </div>

      </div>

    </div>

    <script>
      let satFilterActive = false;

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

      function applyFilters() {
        const naics = document.getElementById("filter-naics").value;
        const setAside = document.getElementById("filter-setaside").value;
        const q = document.getElementById("search-input").value.toLowerCase().trim();

        const filtered = currentOpportunities.filter(o => {
          if (naics && !(o.naicsCode || "").includes(naics)) return false;
          if (setAside && o.setAsideCode !== setAside) return false;
          if (satFilterActive) {
            const isSat = (o.title || "").toLowerCase().includes("simplified acquisition") || 
                          (o.title || "").toLowerCase().includes("sat") || 
                          (o.solicitationNumber || "").includes("Q");
            if (!isSat) return false;
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
