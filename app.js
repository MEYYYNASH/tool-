// ==========================================
// ToolHub Pro — Core App & State Manager
// ==========================================

const DEFAULT_USERS = [
  { name: "John Doe", email: "john@example.com", password: "password", role: "pro", apiToken: "th_live_9a87d0f983bc1230e9dcf123" },
  { name: "Admin Manager", email: "admin@toolhub.pro", password: "admin", role: "admin", apiToken: "th_live_admin0000000000000000" }
];

const DEFAULT_TEAM = [];

const state = {
  currentUser: null,
  activeRoute: "landing",
  activeSubTab: "tools-list",
  activePdfTab: "pdf-merge",
  activeQrNav: "qr-creator-view",
  activeConvertTab: "img-convert",
  activeSettingsPane: "pane-profile",
  activeAdminTab: "admin-overview",
  history: [],
  teamMembers: [],
  logs: []
};

// Initialize localStorage DB
if (!localStorage.getItem("th_users")) {
  localStorage.setItem("th_users", JSON.stringify(DEFAULT_USERS));
}

// Load state from localStorage on startup
function initAppState() {
  const savedUser = localStorage.getItem("th_session");
  if (savedUser) {
    state.currentUser = JSON.parse(savedUser);
  }
  
  const savedHistory = localStorage.getItem("th_history");
  if (savedHistory) {
    state.history = JSON.parse(savedHistory);
  } else {
    state.history = [
      { id: "job-1", name: "monthly_report_draft.pdf", operation: "PDF Merge", size: "2.4 MB", date: "2026-07-24", status: "Success", url: "#" },
      { id: "job-2", name: "vcard_contact_qr.svg", operation: "QR Generate", size: "12 KB", date: "2026-07-23", status: "Success", url: "#" }
    ];
    localStorage.setItem("th_history", JSON.stringify(state.history));
  }

  const savedTeam = localStorage.getItem("th_team");
  if (savedTeam) {
    state.teamMembers = JSON.parse(savedTeam);
  } else {
    state.teamMembers = [];
    localStorage.setItem("th_team", JSON.stringify([]));
  }
  
  logSystemMessage("System initialized", "info");
  logSystemMessage("In-browser PDF parser compiled", "success");
  logSystemMessage("Connected to local redirect campaign coordinator", "info");
  renderTeamRoster();

  updateAuthUI();
  updateHistoryTable();
  updateStorageIndicator();
  handleRouting();
}

// System Logger (Shows in Admin dashboard logs)
function logSystemMessage(message, type = "info") {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const logEntry = { timestamp, message, type };
  state.logs.push(logEntry);
  
  // Keep logs at max 50
  if (state.logs.length > 50) state.logs.shift();
  
  // Render in Admin Panel if open
  const consoleBox = document.getElementById("admin-console-logs");
  if (consoleBox) {
    const line = document.createElement("div");
    line.className = "console-line";
    let iconClass = "fa-info-circle";
    let colorStyle = "#39ff14";
    if (type === "success") { iconClass = "fa-check-circle"; colorStyle = "#00ffff"; }
    else if (type === "error") { iconClass = "fa-circle-xmark"; colorStyle = "#ff00ff"; }
    
    line.innerHTML = `
      <span class="console-time">[${timestamp}]</span>
      <span class="console-prefix"><i class="fa-solid ${iconClass}"></i> SYS:</span>
      <span style="color: ${colorStyle}">${message}</span>
    `;
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }
}

// Toast Notifications Dispatcher
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "fa-circle-info";
  if (type === "success") icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-exmark";

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div style="font-size: 13px; font-weight: 600;">${message}</div>
  `;
  container.appendChild(toast);

  // Remove toast after 4s
  setTimeout(() => {
    toast.style.animation = "toastSlideIn 0.3s reverse forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Single Page Application Navigation & Routing
function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || "#landing";
  let targetId = hash.split("?")[0].replace("#", "");
  
  const isLandingSection = ["features", "pricing", "faq", "contact"].includes(targetId);
  const isDashboardPage = window.location.pathname.includes("dashboard.html");

  // Cross-page routing logic
  if (isDashboardPage) {
    if (targetId === "landing" || isLandingSection || targetId === "login" || targetId === "register") {
      window.location.href = "index.html" + hash;
      return;
    }
  } else {
    // We are on index.html
    if (["dashboard", "admin-panel", "documentation"].includes(targetId)) {
      if (state.currentUser) {
        window.location.href = "dashboard.html" + hash;
      } else {
        showToast("Please sign in to access this workspace.", "info");
        window.location.hash = "#login";
      }
      return;
    }
  }

  if (isLandingSection) {
    targetId = "landing";
  }

  const targetShell = document.getElementById(targetId);
  if (!targetShell) {
    if (isDashboardPage) {
      window.location.hash = "#dashboard";
    } else {
      window.location.hash = "#landing";
    }
    return;
  }

  // Auth Guard check
  if (targetShell.classList.contains("auth-required") && !state.currentUser) {
    showToast("Please sign in to access this workspace.", "info");
    if (isDashboardPage) {
      window.location.href = "index.html#login";
    } else {
      navigateTo("#login");
    }
    return;
  }

  // Admin Guard check
  if (targetShell.classList.contains("admin-only") && (!state.currentUser || state.currentUser.role !== "admin")) {
    showToast("Access Denied: Administrator role required.", "error");
    if (isDashboardPage) {
      navigateTo("#dashboard");
    } else {
      navigateTo("#landing");
    }
    return;
  }

  // Deactivate all page shells and activate target
  document.querySelectorAll(".page-shell").forEach(shell => shell.classList.remove("active"));
  targetShell.classList.add("active");
  state.activeRoute = targetId;

  // Sync nav links highlighting
  document.querySelectorAll(".nav-links a").forEach(link => {
    const linkHash = link.getAttribute("href");
    if (linkHash === hash || (isLandingSection && linkHash === "#" + hash.split("?")[0].replace("#", ""))) {
      link.style.color = "var(--accent-primary)";
    } else {
      link.style.color = "";
    }
  });

  // Log routing action
  logSystemMessage(`Navigated to page: ${targetId}`, "info");

  // Scroll to section or top
  if (isLandingSection) {
    const sectionEl = document.getElementById(hash.split("?")[0].replace("#", ""));
    if (sectionEl) {
      setTimeout(() => {
        sectionEl.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle subtab query parameter routing (e.g., #dashboard?tab=saas-settings)
  const queryString = hash.split("?")[1] || "";
  const urlParams = new URLSearchParams(queryString);
  const requestedTab = urlParams.get("tab");
  if (requestedTab) {
    setTimeout(() => {
      const tabTarget = document.querySelector(`[data-tab="${requestedTab}"]`);
      if (tabTarget) tabTarget.click();
    }, 50);
  }

  // Custom visual actions on navigation
  if (targetId === "admin-panel") {
    renderAdminCharts();
    populateAdminUserTable();
  }
}

// User Profile Avatar Click Listener (opens settings/profile tab)
document.getElementById("user-profile-container")?.addEventListener("click", function(e) {
  if (e.target.closest("#logout-btn")) return;
  if (window.location.pathname.includes("dashboard.html")) {
    const settingsLink = document.querySelector('[data-tab="saas-settings"]');
    if (settingsLink) settingsLink.click();
  } else {
    window.location.href = "dashboard.html#dashboard?tab=saas-settings";
  }
});

// Update UI headers depending on Login states
function updateAuthUI() {
  const authContainer = document.getElementById("auth-buttons-container");
  const userProfile = document.getElementById("user-profile-container");
  const userAvatar = document.getElementById("user-avatar");
  const authLinks = document.querySelectorAll(".auth-required:not(.page-shell)");
  const adminLinks = document.querySelectorAll(".admin-only:not(.page-shell)");

  if (state.currentUser) {
    authContainer.style.display = "none";
    userProfile.style.display = "flex";
    const userInitials = state.currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    userAvatar.innerText = userInitials;
    
    authLinks.forEach(link => link.style.display = "block");
    if (state.currentUser.role === "admin") {
      adminLinks.forEach(link => link.style.display = "block");
    } else {
      adminLinks.forEach(link => link.style.display = "none");
    }

    // Sync Profile Card elements
    const cardAvatar = document.getElementById("profile-card-avatar");
    const cardName = document.getElementById("profile-card-name");
    const cardEmail = document.getElementById("profile-card-email");
    const cardBadge = document.getElementById("profile-card-badge");
    const cardTitle = document.getElementById("profile-card-title");
    const cardCompany = document.getElementById("profile-card-company");

    if (cardAvatar) cardAvatar.innerText = userInitials;
    if (cardName) cardName.innerText = state.currentUser.name;
    if (cardEmail) cardEmail.innerText = state.currentUser.email;
    if (cardTitle) cardTitle.innerText = state.currentUser.title || "Developer";
    if (cardCompany) cardCompany.innerText = state.currentUser.company || "Independent";

    if (cardBadge) {
      if (state.currentUser.role === "pro") {
        cardBadge.className = "badge-pill pro";
        cardBadge.innerText = "PRO MEMBER";
      } else if (state.currentUser.role === "admin") {
        cardBadge.className = "badge-pill enterprise";
        cardBadge.innerText = "ADMIN TIER";
      } else {
        cardBadge.className = "badge-pill free";
        cardBadge.innerText = "FREE TIER";
      }
    }

    // Populate Edit Details Inputs
    const profileNameInput = document.getElementById("profile-name");
    const profileTitleInput = document.getElementById("profile-title");
    const profileCompanyInput = document.getElementById("profile-company");

    if (profileNameInput) profileNameInput.value = state.currentUser.name;
    if (profileTitleInput) profileTitleInput.value = state.currentUser.title || "Developer";
    if (profileCompanyInput) profileCompanyInput.value = state.currentUser.company || "Independent";

    // Show API Key pane parameters depending on Plan Tier
    const keyPaneLocked = document.getElementById("api-pro-locked");
    const keyPaneUnlocked = document.getElementById("api-pro-unlocked");
    if (state.currentUser.role === "pro" || state.currentUser.role === "admin") {
      keyPaneLocked.style.display = "none";
      keyPaneUnlocked.style.display = "flex";
      document.getElementById("api-secret-key").value = state.currentUser.apiToken || "th_live_token_dynamic_placeholder";
    } else {
      keyPaneLocked.style.display = "block";
      keyPaneUnlocked.style.display = "none";
    }

    // Sync active plan descriptors
    const planName = document.getElementById("billing-current-plan");
    const planBadge = document.getElementById("billing-plan-badge");
    const planDesc = document.getElementById("billing-plan-desc");
    const upgradeBtn = document.getElementById("billing-upgrade-btn");
    const cancelBtn = document.getElementById("billing-cancel-btn");

    if (state.currentUser.role === "pro") {
      planName.innerText = "ToolHub Pro Subscription";
      planBadge.className = "badge-pill pro";
      planBadge.innerText = "PRO ACCOUNT";
      planDesc.innerText = "Unlimited daily operations unlocked. Batch queue systems activated. Developer REST key active.";
      upgradeBtn.style.display = "none";
      cancelBtn.style.display = "inline-flex";
    } else if (state.currentUser.role === "admin") {
      planName.innerText = "System administrator";
      planBadge.className = "badge-pill enterprise";
      planBadge.innerText = "ADMIN ACCOUNT";
      planDesc.innerText = "Full database review controls. Operations and logs debugger terminals unlocked.";
      upgradeBtn.style.display = "none";
      cancelBtn.style.display = "none";
    } else {
      planName.innerText = "ToolHub Free Plan";
      planBadge.className = "badge-pill free";
      planBadge.innerText = "FREE TIER";
      planDesc.innerText = "Your daily conversion quota is limited to 5 files per day. Standard static QR outputs.";
      upgradeBtn.style.display = "inline-flex";
      cancelBtn.style.display = "none";
    }

    // Set usage quota parameters
    const conversionsLeft = state.currentUser.role !== "free" ? "Unlimited" : `${getConversionsTodayCount()} / 5 operations`;
    document.getElementById("quota-conversions").innerText = conversionsLeft;
    document.getElementById("quota-conversions-bar").style.width = state.currentUser.role !== "free" ? "100%" : `${(getConversionsTodayCount() / 5) * 100}%`;
    
    const apiCalls = state.currentUser.role !== "free" ? "0 / 10,000 queries" : "Disabled";
    document.getElementById("quota-api").innerText = apiCalls;
    document.getElementById("quota-api-bar").style.width = state.currentUser.role !== "free" ? "0.1%" : "0%";

  } else {
    authContainer.style.display = "flex";
    userProfile.style.display = "none";
    authLinks.forEach(link => link.style.display = "none");
  }
}

function getConversionsTodayCount() {
  const todayStr = new Date().toISOString().split('T')[0];
  return state.history.filter(item => item.date === todayStr && item.operation !== "QR Generate").length;
}

// Update Recent Files List
function updateHistoryTable() {
  const tbody = document.getElementById("history-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  if (state.history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No records found. Run tools above to populate.</td></tr>`;
    return;
  }

  state.history.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight: 600;"><i class="fa-solid ${item.operation.includes("PDF") ? 'fa-file-pdf' : item.operation.includes("QR") ? 'fa-qrcode' : 'fa-file'}"" style="color: var(--neon-cyan); margin-right: 8px;"></i> ${item.name}</td>
      <td>${item.date}</td>
      <td>${item.size}</td>
      <td><span class="badge-pill" style="background: rgba(0, 255, 0, 0.1); color: #00ff00; border: 1px solid rgba(0, 255, 0, 0.2);">${item.status}</span></td>
      <td>
        <a href="${item.url}" download="${item.name}" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; border-radius: var(--radius-sm);">
          <i class="fa-solid fa-download"></i> Grab File
        </a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Storage Quota indicator updates
function updateStorageIndicator() {
  let totalBytes = 0;
  state.history.forEach(item => {
    if (item.size.includes("MB")) {
      totalBytes += parseFloat(item.size) * 1024 * 1024;
    } else if (item.size.includes("KB")) {
      totalBytes += parseFloat(item.size) * 1024;
    }
  });

  const totalKB = Math.round(totalBytes / 1024);
  const formattedText = totalKB > 1024 ? `${(totalKB / 1024).toFixed(1)} MB / 100 MB` : `${totalKB} KB / 100 MB`;
  
  document.getElementById("storage-text").innerText = formattedText;
  const percentage = Math.min((totalKB / 102400) * 100, 100);
  document.getElementById("storage-bar").style.width = `${percentage}%`;
}

// Add Item to History DB
function addHistoryRecord(name, operation, sizeKB, status = "Success", url = "#") {
  const today = new Date().toISOString().split('T')[0];
  const sizeFormatted = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
  
  const newItem = {
    id: "job-" + Date.now(),
    name,
    operation,
    size: sizeFormatted,
    date: today,
    status,
    url
  };

  state.history.unshift(newItem);
  // Max history 20
  if (state.history.length > 20) state.history.pop();

  localStorage.setItem("th_history", JSON.stringify(state.history));
  
  updateHistoryTable();
  updateStorageIndicator();
  logSystemMessage(`Saved conversion record: ${name} (${operation})`, "success");
}

// Login Simulator (Disabled during beta)
document.getElementById("login-form")?.addEventListener("submit", function(e) {
  e.preventDefault();
  showToast("Standard email login is disabled. Please use Sandbox Beta Login.", "error");
});

// Sandbox Beta Login trigger listener
document.querySelectorAll(".beta-login-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    const email = "oauth_google@example.com";
    const name = "OAuth User (Google)";
    
    const users = JSON.parse(localStorage.getItem("th_users") || "[]");
    let found = users.find(u => u.email === email);
    
    if (!found) {
      found = {
        name: name,
        email: email,
        password: "beta_password",
        role: "pro",
        apiToken: "th_live_beta_" + Math.random().toString(36).substring(2, 15),
        title: "Beta Tester",
        company: "Google OAuth Sandbox"
      };
      users.push(found);
      localStorage.setItem("th_users", JSON.stringify(users));
    }
    
    state.currentUser = found;
    localStorage.setItem("th_session", JSON.stringify(found));
    updateAuthUI();
    showToast(`Sandbox Beta authenticated as ${found.name}!`, "success");
    navigateTo("#dashboard");
  });
});

// Register Simulator (Disabled during beta)
document.getElementById("register-form")?.addEventListener("submit", function(e) {
  e.preventDefault();
  showToast("Standard email registration is disabled. Please use Sandbox Beta Login.", "error");
});

// OAuth Simulation buttons
document.querySelectorAll(".oauth-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    const provider = this.getAttribute("data-provider");
    showToast(`Redirecting to secure ${provider} Auth Portal...`, "info");
    
    setTimeout(() => {
      const mockUser = {
        name: `OAuth User (${provider})`,
        email: `oauth_${provider.toLowerCase()}@example.com`,
        role: "free",
        apiToken: "th_live_oauth" + Math.random().toString(36).substring(2, 10)
      };

      // Check if user already exists in db
      const users = JSON.parse(localStorage.getItem("th_users") || "[]");
      if (!users.find(u => u.email === mockUser.email)) {
        users.push(mockUser);
        localStorage.setItem("th_users", JSON.stringify(users));
      }

      state.currentUser = mockUser;
      localStorage.setItem("th_session", JSON.stringify(mockUser));
      updateAuthUI();
      showToast(`Successfully logged in via ${provider}!`, "success");
      navigateTo("#dashboard");
    }, 1200);
  });
});

// Logout Action
document.getElementById("logout-btn")?.addEventListener("click", function() {
  state.currentUser = null;
  localStorage.removeItem("th_session");
  updateAuthUI();
  showToast("Logged out successfully.", "info");
  navigateTo("#landing");
});

// Main Dashboard Sidebar, Mobile Drawer & Mobile Bottom Bar Navigation
document.querySelectorAll(".sidebar-link, .mobile-menu-link[data-tab], .mobile-bottom-item[data-tab]").forEach(link => {
  link.addEventListener("click", function(e) {
    const tabId = this.getAttribute("data-tab");
    if (!tabId) return;
    
    // Highlight sidebar, mobile drawer & bottom bar active links
    document.querySelectorAll(".sidebar-link, .mobile-menu-link[data-tab], .mobile-bottom-item[data-tab]").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(l => l.classList.add("active"));
    
    // Show subtab panel
    document.querySelectorAll(".main-content .tab-content").forEach(tc => tc.classList.remove("active"));
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add("active");
    
    state.activeSubTab = tabId;
  });
});

// Mobile bottom bar click handlers for anchor links
document.querySelectorAll(".mobile-bottom-item[href]").forEach(item => {
  item.addEventListener("click", function() {
    document.querySelectorAll(".mobile-bottom-item").forEach(i => i.classList.remove("active"));
    this.classList.add("active");
  });
});

// Mobile menu toggle listener
const menuToggle = document.getElementById("menu-toggle");
const mobileMenuDrawer = document.getElementById("mobile-menu-drawer");

if (menuToggle && mobileMenuDrawer) {
  menuToggle.addEventListener("click", function(e) {
    e.stopPropagation();
    const isActive = mobileMenuDrawer.classList.toggle("active");
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.className = isActive ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    }
  });

  // Close mobile drawer when clicking any link inside it
  mobileMenuDrawer.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function() {
      mobileMenuDrawer.classList.remove("active");
      const icon = menuToggle.querySelector("i");
      if (icon) icon.className = "fa-solid fa-bars";
    });
  });

  // Close mobile drawer when clicking outside
  document.addEventListener("click", function(e) {
    if (mobileMenuDrawer.classList.contains("active") && !mobileMenuDrawer.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileMenuDrawer.classList.remove("active");
      const icon = menuToggle.querySelector("i");
      if (icon) icon.className = "fa-solid fa-bars";
    }
  });
}

// Inner navigation helper back buttons
document.querySelectorAll(".workspace-back-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    // Navigate back to core tools list
    const sidebarLink = document.querySelector('.sidebar-link[data-tab="tools-list"]');
    if (sidebarLink) sidebarLink.click();
  });
});

// Direct workspace shortcut clicks from dashboard tiles
document.querySelectorAll(".tool-card").forEach(card => {
  card.addEventListener("click", function() {
    const actionTab = this.getAttribute("data-action");
    const subtab = this.getAttribute("data-subtab");

    // Click appropriate sidebar item
    const sidebarLink = document.querySelector(`.sidebar-link[data-tab="${actionTab}"]`);
    if (sidebarLink) sidebarLink.click();

    // If PDF or Converter subtab specified, click the tab nav button inside
    if (subtab) {
      setTimeout(() => {
        const subNavBtn = document.querySelector(`.tab-nav-btn[data-pdf-tab="${subtab}"], .tab-nav-btn[data-convert-tab="${subtab}"]`);
        if (subNavBtn) subNavBtn.click();
      }, 50);
    }
  });
});

// Contact ticket simulator
document.getElementById("contact-form")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("contact-name").value;
  showToast(`Thank you, ${name}! Your contact message has been logged.`, "success");
  this.reset();
});

// Quota reset handler simulator (local day checker)
function checkDailyQuotaReset() {
  const lastActiveStr = localStorage.getItem("th_last_active");
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (lastActiveStr && lastActiveStr !== todayStr) {
    // If date changed, reset conversions history counters (simulating queue limit refreshes)
    logSystemMessage("Daily quotas reset successfully", "success");
  }
  localStorage.setItem("th_last_active", todayStr);
}

// Payment simulator popup (Pro Upgrade)
document.querySelectorAll(".upgrade-pro-trigger").forEach(trigger => {
  trigger.addEventListener("click", function() {
    if (!state.currentUser) {
      showToast("Please log in to upgrade your subscription.", "info");
      navigateTo("#login");
      return;
    }
    
    const cardModalOverlay = document.createElement("div");
    cardModalOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 2000;
    `;

    cardModalOverlay.innerHTML = `
      <div class="glass-panel double-border" style="width: 400px; padding: 32px; border-radius: var(--radius-lg); background: #0c0c14; position: relative;">
        <button id="close-checkout" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 18px;"><i class="fa-solid fa-xmark"></i></button>
        <h3 style="font-size: 20px; margin-bottom: 8px; text-align: center;"><i class="fa-solid fa-credit-card" style="color: var(--neon-pink); margin-right: 8px;"></i> Premium Checkout</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; text-align: center;">Upgrade to ToolHub Pro for $9/month. Sandbox mode.</p>
        
        <form id="checkout-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label>Credit Card Number</label>
            <input type="text" placeholder="4242 •••• •••• 4242" value="4242 4242 4242 4242" required style="font-family: var(--font-mono);">
          </div>
          <div class="form-group-row">
            <div>
              <label>Expires</label>
              <input type="text" placeholder="MM/YY" value="12/28" required style="font-family: var(--font-mono);">
            </div>
            <div>
              <label>CVC Security</label>
              <input type="password" placeholder="•••" value="123" required style="font-family: var(--font-mono);">
            </div>
          </div>
          <button type="submit" class="btn-primary" style="justify-content: center; font-size: 14px; margin-top: 10px;">Authorize $9.00 payment <i class="fa-solid fa-lock"></i></button>
        </form>
      </div>
    `;

    document.body.appendChild(cardModalOverlay);

    // Cancel modal
    document.getElementById("close-checkout").addEventListener("click", () => cardModalOverlay.remove());
    
    // Auth payment
    document.getElementById("checkout-form").addEventListener("submit", function(e) {
      e.preventDefault();
      cardModalOverlay.remove();
      
      // Update session role to pro
      state.currentUser.role = "pro";
      state.currentUser.apiToken = "th_live_" + Math.random().toString(36).substring(2, 15);
      
      // Update in db
      const users = JSON.parse(localStorage.getItem("th_users") || "[]");
      const foundIdx = users.findIndex(u => u.email === state.currentUser.email);
      if (foundIdx !== -1) {
        users[foundIdx] = state.currentUser;
        localStorage.setItem("th_users", JSON.stringify(users));
      }
      
      localStorage.setItem("th_session", JSON.stringify(state.currentUser));
      updateAuthUI();
      showToast("Subscription successful! Welcome to ToolHub Pro.", "success");
      logSystemMessage(`Billing authorized: ${state.currentUser.email} upgraded to PRO`, "success");
    });
  });
});

// Settings save profile
document.getElementById("save-profile-btn")?.addEventListener("click", function() {
  const newName = document.getElementById("profile-name").value.trim();
  const newTitle = document.getElementById("profile-title").value.trim();
  const newCompany = document.getElementById("profile-company").value.trim();
  
  if (!newName) {
    showToast("Profile name cannot be blank.", "error");
    return;
  }

  state.currentUser.name = newName;
  state.currentUser.title = newTitle || "Developer";
  state.currentUser.company = newCompany || "Independent";

  localStorage.setItem("th_session", JSON.stringify(state.currentUser));
  
  const users = JSON.parse(localStorage.getItem("th_users") || "[]");
  const foundIdx = users.findIndex(u => u.email === state.currentUser.email);
  if (foundIdx !== -1) {
    users[foundIdx] = state.currentUser;
    localStorage.setItem("th_users", JSON.stringify(users));
  }

  updateAuthUI();
  showToast("Profile details updated successfully.", "success");
});

// Settings change email
document.getElementById("change-email-btn")?.addEventListener("click", function() {
  const newEmail = document.getElementById("profile-new-email").value.trim().toLowerCase();
  
  if (!newEmail || !newEmail.includes("@")) {
    showToast("Please enter a valid email address.", "error");
    return;
  }

  if (newEmail === state.currentUser.email) {
    showToast("This is already your current email address.", "info");
    return;
  }

  const users = JSON.parse(localStorage.getItem("th_users") || "[]");
  const emailInUse = users.some(u => u.email === newEmail);
  if (emailInUse) {
    showToast("This email address is already registered to another account.", "error");
    return;
  }

  const oldEmail = state.currentUser.email;
  state.currentUser.email = newEmail;
  localStorage.setItem("th_session", JSON.stringify(state.currentUser));
  
  const foundIdx = users.findIndex(u => u.email === oldEmail);
  if (foundIdx !== -1) {
    users[foundIdx] = state.currentUser;
    localStorage.setItem("th_users", JSON.stringify(users));
  }

  document.getElementById("profile-new-email").value = "";
  updateAuthUI();
  showToast("Email address updated successfully.", "success");
});

// Settings change password
document.getElementById("change-password-btn")?.addEventListener("click", function() {
  const currPass = document.getElementById("profile-current-pass").value;
  const newPass = document.getElementById("profile-new-pass").value;
  const confirmPass = document.getElementById("profile-confirm-pass").value;

  if (!currPass || !newPass || !confirmPass) {
    showToast("Please fill in all password fields.", "error");
    return;
  }

  if (currPass !== state.currentUser.password) {
    showToast("Incorrect current password.", "error");
    return;
  }

  if (newPass !== confirmPass) {
    showToast("New passwords do not match.", "error");
    return;
  }

  if (newPass.length < 4) {
    showToast("New password must be at least 4 characters.", "error");
    return;
  }

  state.currentUser.password = newPass;
  localStorage.setItem("th_session", JSON.stringify(state.currentUser));
  
  const users = JSON.parse(localStorage.getItem("th_users") || "[]");
  const foundIdx = users.findIndex(u => u.email === state.currentUser.email);
  if (foundIdx !== -1) {
    users[foundIdx] = state.currentUser;
    localStorage.setItem("th_users", JSON.stringify(users));
  }

  document.getElementById("profile-current-pass").value = "";
  document.getElementById("profile-new-pass").value = "";
  document.getElementById("profile-confirm-pass").value = "";

  showToast("Password updated successfully.", "success");
});

// Settings API show/hide toggle
document.getElementById("api-key-toggle-show")?.addEventListener("click", function() {
  const keyInput = document.getElementById("api-secret-key");
  const eyeIcon = this.querySelector("i");
  if (keyInput.type === "password") {
    keyInput.type = "text";
    eyeIcon.className = "fa-solid fa-eye-slash";
  } else {
    keyInput.type = "password";
    eyeIcon.className = "fa-solid fa-eye";
  }
});

// Settings API copy
document.getElementById("api-key-copy")?.addEventListener("click", function() {
  const keyInput = document.getElementById("api-secret-key");
  navigator.clipboard.writeText(keyInput.value);
  showToast("API secret key copied to clipboard.", "success");
});

// Settings API regenerate
document.getElementById("api-key-regenerate")?.addEventListener("click", function() {
  const newToken = "th_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  state.currentUser.apiToken = newToken;
  document.getElementById("api-secret-key").value = newToken;
  
  localStorage.setItem("th_session", JSON.stringify(state.currentUser));
  const users = JSON.parse(localStorage.getItem("th_users") || "[]");
  const foundIdx = users.findIndex(u => u.email === state.currentUser.email);
  if (foundIdx !== -1) {
    users[foundIdx] = state.currentUser;
    localStorage.setItem("th_users", JSON.stringify(users));
  }
  showToast("API client secret token refreshed.", "success");
  logSystemMessage("API key regenerated for account", "info");
});

// Settings sub-pane navigations
document.querySelectorAll(".settings-nav-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".settings-nav-btn").forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    
    const paneId = this.getAttribute("data-settings-pane");
    document.querySelectorAll(".settings-pane").forEach(p => p.classList.remove("active"));
    document.getElementById(paneId).classList.add("active");
  });
});

// Clear history helper
document.getElementById("clear-history-btn")?.addEventListener("click", function() {
  state.history = [];
  localStorage.setItem("th_history", JSON.stringify([]));
  updateHistoryTable();
  updateStorageIndicator();
  showToast("Workspace history cleared.", "info");
});

// Settings Action Handlers
document.getElementById("export-user-data-btn")?.addEventListener("click", function() {
  const data = JSON.stringify(state.currentUser || {}, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  triggerBlobDownload(blob, `toolhub_profile_backup_${Date.now()}.json`);
  showToast("Account backup JSON exported successfully.", "success");
});

document.getElementById("save-webhook-btn")?.addEventListener("click", function() {
  const url = document.getElementById("webhook-url-input")?.value.trim();
  if (url) {
    showToast("Webhook endpoint saved successfully!", "success");
    logSystemMessage(`Configured target webhook endpoint: ${url}`, "success");
  } else {
    showToast("Please enter a valid webhook URL.", "error");
  }
});

// Real Team Workspace Roster Renderer
function renderTeamRoster() {
  const tbody = document.getElementById("team-roster-tbody");
  const seatBadge = document.getElementById("team-seat-badge");
  if (!tbody) return;

  const team = state.teamMembers || [];
  if (seatBadge) {
    seatBadge.innerText = `${team.length} / 5 Seats Used`;
  }

  if (team.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13px;">
          <i class="fa-solid fa-users-slash" style="font-size: 28px; margin-bottom: 10px; display: block; color: var(--accent-primary); opacity: 0.6;"></i>
          No team members added yet. Invite colleagues using the form above to start collaborating.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = team.map(m => {
    const initials = m.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const statusHtml = m.status === "Active"
      ? `<span style="font-size: 11px; color: #34d399; font-weight: 600;"><i class="fa-solid fa-circle" style="font-size: 7px; margin-right: 4px;"></i> Active</span>`
      : `<span style="font-size: 11px; color: #fbbf24; font-weight: 600;"><i class="fa-regular fa-clock" style="font-size: 10px; margin-right: 4px;"></i> Pending</span>`;

    let actionBtnHtml = "";
    if (m.role === "owner") {
      actionBtnHtml = `<span style="font-size: 11px; color: var(--text-muted);">Owner</span>`;
    } else if (m.status === "Pending") {
      actionBtnHtml = `<button class="btn-cyber-outline team-resend-btn" data-id="${m.id}" style="padding: 3px 10px; font-size: 10px; border-radius: 4px;">Resend</button>`;
    } else {
      actionBtnHtml = `<button class="btn-cyber-outline team-remove-btn" data-id="${m.id}" style="padding: 3px 10px; font-size: 10px; border-radius: 4px; color: #f87171; border-color: rgba(248,113,113,0.3);">Remove</button>`;
    }

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="avatar" style="width: 32px; height: 32px; font-size: 11px; background: ${m.bg || 'var(--accent-primary)'};">${initials}</div>
            <div>
              <div style="font-weight: 600; font-size: 13px;">${m.name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${m.email}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-pill ${m.roleBadge || 'pro'}" style="font-size: 9px;">${m.roleLabel || m.role.toUpperCase()}</span></td>
        <td>${statusHtml}</td>
        <td style="font-size: 12px; color: var(--text-secondary);">${m.joined}</td>
        <td style="text-align: right;">${actionBtnHtml}</td>
      </tr>
    `;
  }).join("");

  // Attach Resend button listeners
  tbody.querySelectorAll(".team-resend-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const id = this.getAttribute("data-id");
      const member = team.find(m => m.id === id);
      if (member) {
        showToast(`Invitation email resent to ${member.email}!`, "success");
        logSystemMessage(`Resent workspace team invitation email to ${member.email}`, "info");
      }
    });
  });

  // Attach Remove button listeners
  tbody.querySelectorAll(".team-remove-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const id = this.getAttribute("data-id");
      const member = team.find(m => m.id === id);
      if (member) {
        state.teamMembers = state.teamMembers.filter(m => m.id !== id);
        localStorage.setItem("th_team", JSON.stringify(state.teamMembers));
        renderTeamRoster();
        showToast(`${member.name} removed from workspace team.`, "info");
        logSystemMessage(`Removed ${member.name} (${member.email}) from team roster`, "warning");
      }
    });
  });
}

document.getElementById("send-invite-btn")?.addEventListener("click", function() {
  const emailInput = document.getElementById("invite-email-input");
  const email = emailInput?.value.trim();
  const roleSelect = document.getElementById("invite-role-select")?.value || "developer";
  
  if (!email || !email.includes("@")) {
    showToast("Please enter a valid email address to invite.", "error");
    return;
  }

  if (state.teamMembers.length >= 5) {
    showToast("Team seat quota full (5/5). Upgrade plan for more seats.", "warning");
    return;
  }

  if (state.teamMembers.some(m => m.email.toLowerCase() === email.toLowerCase())) {
    showToast(`${email} is already in your workspace team.`, "info");
    return;
  }

  const namePart = email.split("@")[0].replace(".", " ");
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const roleLabel = roleSelect === "admin" ? "ADMIN" : (roleSelect === "viewer" ? "VIEWER" : "DEVELOPER");
  const roleBadge = roleSelect === "admin" ? "enterprise" : (roleSelect === "viewer" ? "free" : "pro");
  const gradients = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #06b6d4, #0891b2)",
    "linear-gradient(135deg, #ec4899, #d946ef)",
    "linear-gradient(135deg, #84cc16, #65a30d)"
  ];
  const bg = gradients[Math.floor(Math.random() * gradients.length)];

  const newMember = {
    id: "team-" + Date.now(),
    name: formattedName,
    email: email,
    role: roleSelect,
    roleBadge: roleBadge,
    roleLabel: roleLabel,
    status: "Pending",
    joined: "Invited Today",
    bg: bg
  };

  state.teamMembers.push(newMember);
  localStorage.setItem("th_team", JSON.stringify(state.teamMembers));
  renderTeamRoster();

  showToast(`Team invitation sent to ${email} as ${roleLabel}!`, "success");
  logSystemMessage(`Sent workspace team invitation to ${email} (${roleLabel})`, "info");
  emailInput.value = "";
});

// Light/Dark Theme selector
document.getElementById("theme-toggle")?.addEventListener("click", function() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const icon = this.querySelector("i");
  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
    icon.className = "fa-solid fa-sun";
    showToast("Switched to Light mode theme.", "info");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    icon.className = "fa-solid fa-moon";
    showToast("Switched to Dark mode theme.", "info");
  }
});

// Tool Search Filtration
document.getElementById("tool-search")?.addEventListener("input", function() {
  const filter = this.value.toLowerCase();
  document.querySelectorAll("#tools-grid-items .tool-card").forEach(card => {
    const title = card.querySelector(".tool-card-title").innerText.toLowerCase();
    const desc = card.querySelector(".tool-card-desc").innerText.toLowerCase();
    if (title.includes(filter) || desc.includes(filter)) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
});

// Category Chips Selection Filters
document.querySelectorAll("#tool-categories .category-chip").forEach(chip => {
  chip.addEventListener("click", function() {
    document.querySelectorAll("#tool-categories .category-chip").forEach(c => c.classList.remove("active"));
    this.classList.add("active");

    const category = this.getAttribute("data-category");
    document.querySelectorAll("#tools-grid-items .tool-card").forEach(card => {
      const cardCategory = card.getAttribute("data-category");
      if (category === "all" || cardCategory === category) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  });
});

// Check quota on load
checkDailyQuotaReset();

// Router init hooks
window.addEventListener("hashchange", handleRouting);
document.addEventListener("DOMContentLoaded", initAppState);
