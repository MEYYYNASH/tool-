// ==========================================
// ToolHub Pro — QR Code Generator & Analytics
// ==========================================

// State variables
let qrLogoDataUrl = null;
let generatedSvgString = "";

// Tab Switching (Designer vs Metrics)
document.querySelectorAll('[data-qr-nav]').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-qr-nav]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const targetId = this.getAttribute('data-qr-nav');
    document.querySelectorAll('.qr-pane').forEach(p => p.style.display = 'none');
    document.getElementById(targetId).style.display = 'block';
    
    if (targetId === 'qr-analytics-view') {
      setTimeout(renderQrAnalyticsCharts, 50);
    }
  });
});

// Inner customizations tabs
document.querySelectorAll('.qr-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.qr-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    const subTabId = this.getAttribute('data-qr-tab');
    document.querySelectorAll('.qr-subtab').forEach(st => st.style.display = 'none');
    document.getElementById(subTabId).style.display = 'block';
  });
});

// Type fields toggling
document.getElementById('qr-data-type')?.addEventListener('change', function() {
  const type = this.value;
  
  const groups = [
    'qr-url-group', 'qr-text-group', 'qr-wifi-group', 'qr-vcard-group',
    'qr-phone-group', 'qr-sms-group', 'qr-email-group', 'qr-whatsapp-group',
    'qr-tg-chat-group', 'qr-tg-user-group', 'qr-bluetooth-group',
    'qr-net-login-group', 'qr-hotspot-group', 'qr-gps-group',
    'qr-google-maps-group', 'qr-apple-maps-group', 'qr-waze-group'
  ];
  
  groups.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  if (type === 'url') document.getElementById('qr-url-group').style.display = 'block';
  else if (type === 'text') document.getElementById('qr-text-group').style.display = 'block';
  else if (type === 'wifi') document.getElementById('qr-wifi-group').style.display = 'flex';
  else if (type === 'vcard') document.getElementById('qr-vcard-group').style.display = 'flex';
  else if (type === 'phone') document.getElementById('qr-phone-group').style.display = 'block';
  else if (type === 'sms') document.getElementById('qr-sms-group').style.display = 'flex';
  else if (type === 'email') document.getElementById('qr-email-group').style.display = 'flex';
  else if (type === 'whatsapp') document.getElementById('qr-whatsapp-group').style.display = 'flex';
  else if (type === 'tg-chat') document.getElementById('qr-tg-chat-group').style.display = 'block';
  else if (type === 'tg-user') document.getElementById('qr-tg-user-group').style.display = 'block';
  else if (type === 'bluetooth') document.getElementById('qr-bluetooth-group').style.display = 'flex';
  else if (type === 'net-login') document.getElementById('qr-net-login-group').style.display = 'flex';
  else if (type === 'hotspot') document.getElementById('qr-hotspot-group').style.display = 'flex';
  else if (type === 'gps') document.getElementById('qr-gps-group').style.display = 'flex';
  else if (type === 'google-maps') document.getElementById('qr-google-maps-group').style.display = 'flex';
  else if (type === 'apple-maps') document.getElementById('qr-apple-maps-group').style.display = 'flex';
  else if (type === 'waze') document.getElementById('qr-waze-group').style.display = 'flex';
});

// Trigger initial state immediately on load to hide all inactive input groups
setTimeout(() => {
  const qrDataTypeSelect = document.getElementById('qr-data-type');
  if (qrDataTypeSelect) {
    qrDataTypeSelect.dispatchEvent(new Event('change'));
  }
}, 50);

// Hex colors live label update
document.getElementById('qr-color-1')?.addEventListener('input', function() {
  document.getElementById('qr-color-1-text').innerText = this.value;
});
document.getElementById('qr-color-2')?.addEventListener('input', function() {
  document.getElementById('qr-color-2-text').innerText = this.value;
});
document.getElementById('qr-eye-color')?.addEventListener('input', function() {
  document.getElementById('qr-eye-color-text').innerText = this.value;
});

// Logo file uploads handling
const qrLogoDropZone = document.getElementById('qr-logo-drop');
const qrLogoInput = document.getElementById('qr-logo-input');
const qrLogoDetails = document.getElementById('qr-logo-details');
const qrLogoName = document.getElementById('qr-logo-name');
const qrLogoClear = document.getElementById('qr-logo-clear');

qrLogoDropZone?.addEventListener('click', () => qrLogoInput.click());
qrLogoInput?.addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        qrLogoDataUrl = evt.target.result;
        qrLogoName.innerText = file.name;
        qrLogoDetails.style.display = 'flex';
        qrLogoDropZone.style.display = 'none';
        showToast("Logo overlay loaded successfully.", "success");
        generateVectorQrCode(false);
      };
      reader.readAsDataURL(file);
    } else {
      showToast("Selected file must be an image.", "error");
    }
  }
});

qrLogoClear?.addEventListener('click', () => {
  qrLogoDataUrl = null;
  qrLogoDetails.style.display = 'none';
  qrLogoDropZone.style.display = 'block';
  qrLogoInput.value = '';
  generateVectorQrCode(false);
});

// ========================================================
// GENERATE CUSTOM VECTOR QR CODE (SUPPORTING LIVE PREVIEW)
// ========================================================
function generateVectorQrCode(showToastNotice = true) {
  if (typeof qrcode === 'undefined') {
    if (showToastNotice) showToast("QR Engine not loaded yet.", "error");
    return;
  }

  // Compile content payload
  const type = document.getElementById('qr-data-type')?.value || 'url';
  let payload = "";

  if (type === 'url') {
    payload = document.getElementById('qr-input-url')?.value.trim() || 'https://google.com';
  } else if (type === 'text') {
    payload = document.getElementById('qr-input-text')?.value || 'Hello from ToolHub!';
  } else if (type === 'wifi') {
    const ssid = document.getElementById('qr-wifi-ssid')?.value || 'WiFi SSID';
    const pass = document.getElementById('qr-wifi-password')?.value || '';
    const security = document.getElementById('qr-wifi-encryption')?.value || 'WPA';
    payload = `WIFI:S:${ssid};T:${security};P:${pass};;`;
  } else if (type === 'vcard') {
    const name = document.getElementById('qr-vcard-name')?.value || 'John';
    const surname = document.getElementById('qr-vcard-surname')?.value || 'Doe';
    const phone = document.getElementById('qr-vcard-phone')?.value || '';
    const email = document.getElementById('qr-vcard-email')?.value || '';
    payload = `BEGIN:VCARD\nVERSION:3.0\nN:${surname};${name};;;\nFN:${name} ${surname}\nTEL;TYPE=CELL:${phone}\nEMAIL;TYPE=WORK:${email}\nEND:VCARD`;
  } else if (type === 'phone') {
    const phone = document.getElementById('qr-input-phone')?.value.trim() || '+1234567890';
    payload = `tel:${phone}`;
  } else if (type === 'sms') {
    const phone = document.getElementById('qr-sms-phone')?.value.trim() || '+1234567890';
    const msg = document.getElementById('qr-sms-message')?.value || '';
    payload = `SMSTO:${phone}:${msg}`;
  } else if (type === 'email') {
    const rec = document.getElementById('qr-email-recipient')?.value.trim() || 'hello@company.com';
    const sub = document.getElementById('qr-email-subject')?.value || '';
    const body = document.getElementById('qr-email-body')?.value || '';
    payload = `mailto:${rec}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
  } else if (type === 'whatsapp') {
    const phone = document.getElementById('qr-whatsapp-phone')?.value.trim() || '15551234567';
    const msg = document.getElementById('qr-whatsapp-message')?.value || '';
    payload = msg ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/${phone}`;
  } else if (type === 'tg-chat') {
    payload = document.getElementById('qr-input-tg-chat')?.value.trim() || 'https://t.me/telegram';
  } else if (type === 'tg-user') {
    const user = document.getElementById('qr-input-tg-user')?.value.trim().replace('@', '') || 'telegram';
    payload = `https://t.me/${user}`;
  } else if (type === 'bluetooth') {
    const name = document.getElementById('qr-bt-name')?.value.trim() || 'Bluetooth-Device';
    const mac = document.getElementById('qr-bt-address')?.value.trim() || '00:11:22:33:44:55';
    payload = `BT:ADDR:${mac};NAME:${name};`;
  } else if (type === 'net-login') {
    payload = document.getElementById('qr-net-login-url')?.value.trim() || 'https://hotspot-login.net';
  } else if (type === 'hotspot') {
    const ssid = document.getElementById('qr-hotspot-ssid')?.value.trim() || 'Hotspot SSID';
    const pass = document.getElementById('qr-hotspot-password')?.value.trim() || '';
    payload = `WIFI:S:${ssid};T:WPA;P:${pass};;`;
  } else if (type === 'gps') {
    const lat = document.getElementById('qr-gps-lat')?.value.trim() || '37.7749';
    const lng = document.getElementById('qr-gps-lng')?.value.trim() || '-122.4194';
    payload = `geo:${lat},${lng}`;
  } else if (type === 'google-maps') {
    const query = document.getElementById('qr-gmaps-search')?.value.trim();
    const lat = document.getElementById('qr-gmaps-lat')?.value.trim();
    const lng = document.getElementById('qr-gmaps-lng')?.value.trim();
    if (query) {
      payload = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    } else {
      const targetLat = lat || '37.4220';
      const targetLng = lng || '-122.0841';
      payload = `https://www.google.com/maps/place/${targetLat},${targetLng}`;
    }
  } else if (type === 'apple-maps') {
    const lat = document.getElementById('qr-amaps-lat')?.value.trim() || '37.3318';
    const lng = document.getElementById('qr-amaps-lng')?.value.trim() || '-122.0312';
    payload = `https://maps.apple.com/?ll=${lat},${lng}`;
  } else if (type === 'waze') {
    const lat = document.getElementById('qr-waze-lat')?.value.trim() || '32.0853';
    const lng = document.getElementById('qr-waze-lng')?.value.trim() || '34.7818';
    payload = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }

  // Configuration settings
  const color1 = document.getElementById('qr-color-1')?.value || '#09090b';
  const color2 = document.getElementById('qr-color-2')?.value || '#2563eb';
  const eyeColor = document.getElementById('qr-eye-color')?.value || '#2563eb';
  const dotStyle = document.getElementById('qr-dot-style')?.value || 'square';
  const eyeStyle = document.getElementById('qr-eye-style')?.value || 'square';
  const bgRadius = parseInt(document.getElementById('qr-border-radius')?.value || '12');
  const logoSizePercent = parseInt(document.getElementById('qr-logo-size')?.value || '20') / 100;

  try {
    const qr = qrcode(0, 'M');
    qr.addData(payload);
    qr.make();

    const count = qr.getModuleCount();
    const size = 360;
    const padding = 20;
    const innerSize = size - (padding * 2);
    const moduleSize = innerSize / count;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
      <defs>
        <linearGradient id="qr-grad-${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      
      <!-- Rounded background panel -->
      <rect x="0" y="0" width="${size}" height="${size}" rx="${bgRadius}" ry="${bgRadius}" fill="#ffffff" />
    `;

    let dotsPath = "";

    // Render individual modules
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!qr.isDark(r, c)) continue;

        const eyeLoc = isEyeArea(r, c);
        
        // Skip drawing default modules inside the eyes area, we will draw custom styled eyes below
        if (eyeLoc) continue;

        // Skip center logo overlay area if logo is uploaded
        if (qrLogoDataUrl) {
          const centerMin = Math.floor(count * (0.5 - logoSizePercent / 2));
          const centerMax = Math.ceil(count * (0.5 + logoSizePercent / 2));
          if (r >= centerMin && r <= centerMax && c >= centerMin && c <= centerMax) {
            continue;
          }
        }

        const x = padding + (c * moduleSize);
        const y = padding + (r * moduleSize);

        if (dotStyle === 'rounded') {
          dotsPath += `M ${x + moduleSize*0.1} ${y + moduleSize*0.1} h ${moduleSize*0.8} a ${moduleSize*0.1} ${moduleSize*0.1} 0 0 1 ${moduleSize*0.1} ${moduleSize*0.1} v ${moduleSize*0.8} a ${moduleSize*0.1} ${moduleSize*0.1} 0 0 1 -${moduleSize*0.1} ${moduleSize*0.1} h -${moduleSize*0.8} a ${moduleSize*0.1} ${moduleSize*0.1} 0 0 1 -${moduleSize*0.1} -${moduleSize*0.1} v -${moduleSize*0.8} a ${moduleSize*0.1} ${moduleSize*0.1} 0 0 1 ${moduleSize*0.1} -${moduleSize*0.1} Z `;
        } else if (dotStyle === 'dots') {
          const cx = x + (moduleSize / 2);
          const cy = y + (moduleSize / 2);
          const rad = (moduleSize / 2) * 0.85;
          dotsPath += `M ${cx} ${cy} m -${rad}, 0 a ${rad},${rad} 0 1,0 ${rad * 2},0 a ${rad},${rad} 0 1,0 -${rad * 2},0 Z `;
        } else {
          // standard square
          dotsPath += `M ${x} ${y} h ${moduleSize} v ${moduleSize} h -${moduleSize} Z `;
        }
      }
    }

    // Append dots path with gradient fill
    const gradId = `qr-grad-${Date.now()}`;
    svgContent += `<path d="${dotsPath}" fill="url(#${gradId})" />`;

    // Draw customizable eyes
    const eyeLocations = [
      { r: 0, c: 0 },
      { r: 0, c: count - 7 },
      { r: count - 7, c: 0 }
    ];

    eyeLocations.forEach(loc => {
      const ex = padding + (loc.c * moduleSize);
      const ey = padding + (loc.r * moduleSize);
      const eSize = moduleSize * 7;

      if (eyeStyle === 'rounded') {
        // Rounded border & inner center
        svgContent += `
          <!-- Outer border -->
          <rect x="${ex}" y="${ey}" width="${eSize}" height="${eSize}" rx="${moduleSize*1.5}" ry="${moduleSize*1.5}" fill="none" stroke="${eyeColor}" stroke-width="${moduleSize}" />
          <!-- Inner dot -->
          <rect x="${ex + moduleSize*2}" y="${ey + moduleSize*2}" width="${moduleSize*3}" height="${moduleSize*3}" rx="${moduleSize}" ry="${moduleSize}" fill="${eyeColor}" />
        `;
      } else if (eyeStyle === 'circle') {
        // Circular borders
        const ecx = ex + (eSize / 2);
        const ecy = ey + (eSize / 2);
        svgContent += `
          <circle cx="${ecx}" cy="${ecy}" r="${eSize/2 - moduleSize/2}" fill="none" stroke="${eyeColor}" stroke-width="${moduleSize}" />
          <circle cx="${ecx}" cy="${ecy}" r="${moduleSize*1.5}" fill="${eyeColor}" />
        `;
      } else {
        // Standard square
        svgContent += `
          <rect x="${ex + moduleSize/2}" y="${ey + moduleSize/2}" width="${eSize - moduleSize}" height="${eSize - moduleSize}" fill="none" stroke="${eyeColor}" stroke-width="${moduleSize}" />
          <rect x="${ex + moduleSize*2}" y="${ey + moduleSize*2}" width="${moduleSize*3}" height="${moduleSize*3}" fill="${eyeColor}" />
        `;
      }
    });

    // Draw central logo overlay if present
    if (qrLogoDataUrl) {
      const logoSize = innerSize * logoSizePercent;
      const lx = padding + (innerSize / 2) - (logoSize / 2);
      const ly = padding + (innerSize / 2) - (logoSize / 2);
      const logoRad = logoSize * 0.15;

      svgContent += `
        <!-- White card border backing for logo visibility -->
        <rect x="${lx - 4}" y="${ly - 4}" width="${logoSize + 8}" height="${logoSize + 8}" rx="${logoRad + 2}" fill="#ffffff" />
        <!-- Logo image -->
        <image x="${lx}" y="${ly}" width="${logoSize}" height="${logoSize}" href="${qrLogoDataUrl}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0% round ${logoRad}px)" />
      `;
    }

    svgContent += `</svg>`;
    generatedSvgString = svgContent;

    // Inject SVG in preview container
    const previewContainer = document.getElementById('qr-result-container');
    if (previewContainer) {
      previewContainer.innerHTML = svgContent;
    }

    const svgBtn = document.getElementById('qr-download-svg');
    const pngBtn = document.getElementById('qr-download-png');
    if (svgBtn) svgBtn.disabled = false;
    if (pngBtn) pngBtn.disabled = false;
    
    if (showToastNotice) {
      showToast("QR code generated successfully!", "success");
      addHistoryRecord("styled_qr_code.svg", "QR Generate", 24, "Success");
    }
  } catch (err) {
    console.error(err);
    if (showToastNotice) showToast("Error compiling QR code vector layout.", "error");
  }
}

// Generate button listener
document.getElementById('qr-generate-btn')?.addEventListener('click', function() {
  generateVectorQrCode(true);
});

// Bind real-time live preview listeners
const attachLiveQrListeners = () => {
  const selectors = [
    '#qr-color-1', '#qr-color-2', '#qr-dot-style', '#qr-eye-style',
    '#qr-eye-color', '#qr-border-radius', '#qr-logo-size', '#qr-data-type',
    '#qr-creator-view input', '#qr-creator-view textarea', '#qr-creator-view select'
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('input', () => generateVectorQrCode(false));
      el.addEventListener('change', () => generateVectorQrCode(false));
    });
  });
  
  // Initial live render
  generateVectorQrCode(false);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(attachLiveQrListeners, 300));
} else {
  setTimeout(attachLiveQrListeners, 300);
}

// Download SVG file handler
document.getElementById('qr-download-svg')?.addEventListener('click', function() {
  if (!generatedSvgString) return;
  const blob = new Blob([generatedSvgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerBlobDownload(blob, `toolhub_qr_${Date.now()}.svg`);
  showToast("SVG download triggered.", "success");
});

// Download PNG high resolution (Uses canvas drawing engine)
document.getElementById('qr-download-png')?.addEventListener('click', function() {
  if (!generatedSvgString) return;

  showToast("Compiling high-resolution PNG image...", "info");
  
  const img = new Image();
  const svgBlob = new Blob([generatedSvgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function() {
    // Render on large canvas (2000 x 2000) for sharp printing vector quality
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    
    // Draw SVG onto canvas
    ctx.drawImage(img, 0, 0, 2000, 2000);
    
    canvas.toBlob(function(pngBlob) {
      triggerBlobDownload(pngBlob, `toolhub_qr_${Date.now()}.png`);
      showToast("High-Res PNG downloaded successfully!", "success");
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  
  img.src = url;
});

// ========================================================
// CHART.JS: QR SCAN ANALYTICS RENDERING
// ========================================================
let qrScansChartInstance = null;
let qrDevicesChartInstance = null;

function renderQrAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  const scansCtx = document.getElementById('qr-scans-chart')?.getContext('2d');
  const devicesCtx = document.getElementById('qr-devices-chart')?.getContext('2d');

  if (scansCtx) {
    if (qrScansChartInstance) qrScansChartInstance.destroy();
    
    qrScansChartInstance = new Chart(scansCtx, {
      type: 'line',
      data: {
        labels: ['Jul 18', 'Jul 19', 'Jul 20', 'Jul 21', 'Jul 22', 'Jul 23', 'Jul 24'],
        datasets: [{
          label: 'Total Scans',
          data: [1200, 1850, 1420, 2200, 1980, 2800, 3382],
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#71717a' } },
          x: { grid: { display: false }, ticks: { color: '#71717a' } }
        }
      }
    });
  }

  if (devicesCtx) {
    if (qrDevicesChartInstance) qrDevicesChartInstance.destroy();
    
    qrDevicesChartInstance = new Chart(devicesCtx, {
      type: 'doughnut',
      data: {
        labels: ['iPhone', 'Android Mobile', 'Windows Desktop', 'MacOS Client', 'Others'],
        datasets: [{
          data: [54, 28, 11, 5, 2],
          backgroundColor: ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#71717a'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#a1a1aa', boxWidth: 12 } }
        }
      }
    });
  }
}

// ========================================================
// QR DECODER (PICK QR TO GENERATE)
// ========================================================
const qrScanDropZone = document.getElementById('qr-scan-drop');
const qrScanInput = document.getElementById('qr-scan-input');
const qrScanResultCard = document.getElementById('qr-scan-result-card');
const qrScanDecodedText = document.getElementById('qr-scan-decoded-text');
const qrScanLoadBtn = document.getElementById('qr-scan-load-btn');

let decodedQrValue = "";

qrScanDropZone?.addEventListener('click', () => qrScanInput.click());
qrScanInput?.addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              decodedQrValue = code.data;
              qrScanDecodedText.innerText = decodedQrValue;
              qrScanResultCard.style.display = 'block';
              showToast("QR Code successfully decoded!", "success");
            } else {
              qrScanResultCard.style.display = 'none';
              showToast("Could not read QR code. Make sure the image is clear.", "error");
            }
          } catch (err) {
            console.error(err);
            showToast("Failed to process QR image pixels.", "error");
          }
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      showToast("Please upload an image file.", "error");
    }
  }
});

qrScanLoadBtn?.addEventListener('click', function() {
  if (!decodedQrValue) return;

  const dataType = document.getElementById('qr-data-type');
  
  // Smart type detection
  if (decodedQrValue.startsWith('http://') || decodedQrValue.startsWith('https://')) {
    dataType.value = 'url';
    document.getElementById('qr-input-url').value = decodedQrValue;
  } else if (decodedQrValue.startsWith('tel:')) {
    dataType.value = 'phone';
    document.getElementById('qr-input-phone').value = decodedQrValue.replace('tel:', '');
  } else if (decodedQrValue.startsWith('mailto:')) {
    dataType.value = 'email';
    const match = decodedQrValue.match(/mailto:([^?]+)/);
    if (match) {
      document.getElementById('qr-email-recipient').value = match[1];
    }
  } else if (decodedQrValue.startsWith('WIFI:')) {
    dataType.value = 'wifi';
    const ssidMatch = decodedQrValue.match(/S:([^;]+)/);
    const passMatch = decodedQrValue.match(/P:([^;]+)/);
    const encMatch = decodedQrValue.match(/T:([^;]+)/);
    if (ssidMatch) document.getElementById('qr-wifi-ssid').value = ssidMatch[1];
    if (passMatch) document.getElementById('qr-wifi-password').value = passMatch[1];
    if (encMatch) document.getElementById('qr-wifi-encryption').value = encMatch[1];
  } else {
    dataType.value = 'text';
    document.getElementById('qr-input-text').value = decodedQrValue;
  }

  // Trigger change event to sync visibility
  dataType.dispatchEvent(new Event('change'));

  // Switch back to Content tab
  const contentTab = document.querySelector('.qr-tab[data-qr-tab="qr-content"]');
  if (contentTab) contentTab.click();

  // Reset scanner state
  qrScanResultCard.style.display = 'none';
  qrScanInput.value = '';

  // Auto-generate QR code
  document.getElementById('qr-generate-btn').click();
  showToast("Loaded decoded parameters into editor!", "success");
});

// ========================================================
// DEVICE GEOLOCATION DETECTION (GPS CO-ORDINATES)
// ========================================================
function detectUserLocation(successCallback) {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.", "error");
    return;
  }
  
  showToast("Requesting device GPS coordinates...", "info");
  
  navigator.geolocation.getCurrentPosition(
    function(position) {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);
      successCallback(lat, lng);
      showToast("Location coordinates loaded successfully!", "success");
      // Auto-trigger a rebuild of the QR code graphics
      document.getElementById('qr-generate-btn').click();
    },
    function(error) {
      console.error(error);
      switch(error.code) {
        case error.PERMISSION_DENIED:
          showToast("Location access denied by user.", "error");
          break;
        case error.POSITION_UNAVAILABLE:
          showToast("Location info unavailable.", "error");
          break;
        case error.TIMEOUT:
          showToast("Location lookup timed out.", "error");
          break;
        default:
          showToast("Error retrieving device coordinates.", "error");
          break;
      }
    },
    { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
  );
}

// Attach listeners to all location detect buttons
document.querySelector('.gps-detect-btn')?.addEventListener('click', function() {
  detectUserLocation((lat, lng) => {
    document.getElementById('qr-gps-lat').value = lat;
    document.getElementById('qr-gps-lng').value = lng;
  });
});

document.querySelector('.gmaps-detect-btn')?.addEventListener('click', function() {
  detectUserLocation((lat, lng) => {
    document.getElementById('qr-gmaps-lat').value = lat;
    document.getElementById('qr-gmaps-lng').value = lng;
  });
});

document.querySelector('.amaps-detect-btn')?.addEventListener('click', function() {
  detectUserLocation((lat, lng) => {
    document.getElementById('qr-amaps-lat').value = lat;
    document.getElementById('qr-amaps-lng').value = lng;
  });
});

document.querySelector('.waze-detect-btn')?.addEventListener('click', function() {
  detectUserLocation((lat, lng) => {
    document.getElementById('qr-waze-lat').value = lat;
    document.getElementById('qr-waze-lng').value = lng;
  });
});

// ========================================================
// CUSTOM DROPDOWN SELECT HANDLERS
// ========================================================
const customTrigger = document.getElementById('custom-qr-select-trigger');
const customDropdown = document.getElementById('custom-qr-select-dropdown');
const nativeSelect = document.getElementById('qr-data-type');

if (customTrigger && customDropdown && nativeSelect) {
  // Toggle dropdown menu display on click
  customTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = customDropdown.style.display === 'block';
    closeAllCustomDropdowns();
    if (!isOpen) {
      customDropdown.style.display = 'block';
      customTrigger.classList.add('open');
    }
  });

  // Handle custom option click selection
  customDropdown.querySelectorAll('.custom-select-option').forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const val = this.getAttribute('data-value');
      
      // Update native select value
      nativeSelect.value = val;
      
      // Close dropdown
      customDropdown.style.display = 'none';
      customTrigger.classList.remove('open');
      
      // Trigger native change event listener to run fields toggling
      nativeSelect.dispatchEvent(new Event('change'));
    });
  });

  // Sync custom dropdown trigger UI whenever native select value changes
  nativeSelect.addEventListener('change', function() {
    const val = this.value;
    const activeOption = customDropdown.querySelector(`.custom-select-option[data-value="${val}"]`);
    if (activeOption) {
      // Update active selection highlighting
      customDropdown.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('active'));
      activeOption.classList.add('active');
      
      // Update trigger button text and icon
      const labelText = activeOption.innerText.trim();
      const iconClass = activeOption.querySelector('i')?.className || 'fa-solid fa-link';
      customTrigger.querySelector('.custom-select-trigger-text').innerHTML = `<i class="${iconClass}" style="color: var(--accent-primary); margin-right: 8px;"></i> ${labelText}`;
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', function() {
    closeAllCustomDropdowns();
  });
}

function closeAllCustomDropdowns() {
  const dropdown = document.getElementById('custom-qr-select-dropdown');
  const trigger = document.getElementById('custom-qr-select-trigger');
  if (dropdown) dropdown.style.display = 'none';
  if (trigger) trigger.classList.remove('open');
}
