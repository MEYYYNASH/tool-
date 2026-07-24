// ==========================================
// ToolHub Pro — Admin Core & Analytics
// ==========================================

// Handle navigation inside admin sidebar tabs
document.querySelectorAll('[data-admin-tab]').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const paneId = this.getAttribute('data-admin-tab');
    document.querySelectorAll('.admin-pane').forEach(pane => pane.style.display = 'none');
    document.getElementById(paneId).style.display = 'block';

    if (paneId === 'admin-overview') {
      setTimeout(renderAdminCharts, 50);
    }
  });
});

// ========================================================
// CHART.JS: ADMIN ANALYTICS MONITORS
// ========================================================
let adminMrrChartInstance = null;
let adminFilesChartInstance = null;

function renderAdminCharts() {
  if (typeof Chart === 'undefined') return;

  const mrrCtx = document.getElementById('admin-mrr-chart')?.getContext('2d');
  const filesCtx = document.getElementById('admin-files-chart')?.getContext('2d');

  if (mrrCtx) {
    if (adminMrrChartInstance) adminMrrChartInstance.destroy();

    adminMrrChartInstance = new Chart(mrrCtx, {
      type: 'bar',
      data: {
        labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'MRR ($)',
            data: [3200, 4100, 5600, 7200, 6800, 8019],
            backgroundColor: '#2563eb', // Corporate Blue
            borderRadius: 6
          },
          {
            label: 'Enterprise SaaS Contracts',
            data: [1500, 2000, 2500, 4000, 4800, 5200],
            backgroundColor: '#6366f1', // Corporate Indigo
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#a1a1aa' } }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#71717a' } },
          x: { grid: { display: false }, ticks: { color: '#71717a' } }
        }
      }
    });
  }

  if (filesCtx) {
    if (adminFilesChartInstance) adminFilesChartInstance.destroy();

    adminFilesChartInstance = new Chart(filesCtx, {
      type: 'polarArea',
      data: {
        labels: ['PDF Merge & Edits', 'QR Graphic Codes', 'Image Compress/Format', 'Media Queue Encoders', 'ZIP Creators'],
        datasets: [{
          data: [45, 25, 15, 10, 5],
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(99, 102, 241, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#a1a1aa', boxWidth: 12 } }
        },
        scales: {
          r: { grid: { color: 'rgba(255,255,255,0.04)' }, angleLines: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }
}

// ========================================================
// USER DATABASE MANAGER PANEL
// ========================================================
function populateAdminUserTable() {
  const tbody = document.getElementById('admin-user-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const users = JSON.parse(localStorage.getItem('th_users') || '[]');

  users.forEach((user, index) => {
    const tr = document.createElement('tr');
    
    // Pick badge pill color
    let planBadge = 'free';
    if (user.role === 'pro') planBadge = 'pro';
    else if (user.role === 'admin') planBadge = 'enterprise';

    tr.innerHTML = `
      <td style="font-family: var(--font-mono); font-size: 11px;">usr_${index + 1001}</td>
      <td style="font-weight: 600;">${user.name}</td>
      <td>${user.email}</td>
      <td><span class="badge-pill ${planBadge}">${user.role.toUpperCase()}</span></td>
      <td><span style="color: #00ff00; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Active</span></td>
      <td>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="adminToggleUserPlan(${index})">Toggle Plan</button>
        <button class="pdf-action-btn" style="margin-left: 12px;" onclick="adminDeleteUser(${index})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Sync users counter widget
  const usersCounter = document.getElementById('admin-total-users');
  if (usersCounter) usersCounter.innerText = users.length + 1240; // Simulated base value offset
}

window.adminToggleUserPlan = function(idx) {
  const users = JSON.parse(localStorage.getItem('th_users') || '[]');
  if (idx < 0 || idx >= users.length) return;

  const user = users[idx];
  if (user.role === 'free') {
    user.role = 'pro';
  } else if (user.role === 'pro') {
    user.role = 'admin';
  } else {
    user.role = 'free';
  }

  localStorage.setItem('th_users', JSON.stringify(users));
  populateAdminUserTable();
  showToast(`Updated role for ${user.email} to ${user.role.toUpperCase()}`, 'success');
  logSystemMessage(`Admin modified plan for ${user.email} -> ${user.role.toUpperCase()}`, 'info');

  // If the admin is modifying their own logged-in profile, sync state
  const currentSession = JSON.parse(localStorage.getItem('th_session'));
  if (currentSession && currentSession.email === user.email) {
    localStorage.setItem('th_session', JSON.stringify(user));
    // Trigger global UI changes
    location.reload();
  }
};

window.adminDeleteUser = function(idx) {
  const users = JSON.parse(localStorage.getItem('th_users') || '[]');
  if (idx < 0 || idx >= users.length) return;
  
  const user = users[idx];

  if (confirm(`Are you sure you want to delete user account: ${user.email}?`)) {
    users.splice(idx, 1);
    localStorage.setItem('th_users', JSON.stringify(users));
    populateAdminUserTable();
    showToast(`Deleted account: ${user.email}`, 'info');
    logSystemMessage(`Admin deleted user account: ${user.email}`, 'error');
  }
};

// ========================================================
// LIVE BACKGROUND OPERATION LOGGER SIMULATOR
// ========================================================
const mockTerminalLogs = [
  "Inbound request: POST /api/pdf/merge from client th_live_9a87d0f983",
  "Temporary PDF stream buffer created (1.8 MB)",
  "Page extraction completed for doc_v1.pdf (3 pages)",
  "Dynamic redirect route requested: /xyz123 -> redirecting client...",
  "Inbound QR analytics ping from Device: Mobile Safari (172.16.8.9)",
  "Database operation: Select * from 'history' where user_id = 9283",
  "Prisma Client: Connected postgresql connection pool (2 active)",
  "Task worker BullMQ: Completed job conversion_12089387 (Success)",
  "S3 Storage hook: Uploaded output object to /downloads/protected_res.pdf",
  "Virus scan check: passed for inbound stream payload",
  "Security Helmet validation: CORS header parameters verified",
  "Rate Limiter: request bucket checked (0.01% full)",
  "User session cookie refreshed for John Doe"
];

// Append random logs to console logger every 6 seconds to give premium, enterprise server feel
setInterval(() => {
  const adminConsole = document.getElementById('admin-console-logs');
  const adminLogsSec = document.getElementById('admin-logs');
  if (adminConsole && adminLogsSec && adminLogsSec.style.display !== 'none') {
    const randomLog = mockTerminalLogs[Math.floor(Math.random() * mockTerminalLogs.length)];
    const roll = Math.random();
    let type = "info";
    if (roll > 0.85) type = "error";
    else if (roll > 0.6) type = "success";
    
    logSystemMessage(randomLog, type);
  }
}, 6000);

// Clear logs terminal
document.getElementById('admin-log-clear')?.addEventListener('click', () => {
  const consoleBox = document.getElementById("admin-console-logs");
  if (consoleBox) consoleBox.innerHTML = '';
  showToast("Console traces cleared.", "info");
});
