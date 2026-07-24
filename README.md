# ToolHub Pro — Pure Frontend Online Tools Platform

ToolHub Pro is a modern, high-fidelity, client-side online tools platform featuring advanced utilities for **PDFs**, **QR Codes**, and **File Conversions**, styled with a gorgeous **Glassmorphism & Cyberpunk** design system.

The application runs **100% client-side** inside the browser. No node server, backend database, or complex workspace configurations are required.

---

## ⚡ Key Highlights & Live Engines

1. **PDF Operations (via pdf-lib CDN)**:
   - **Merge PDFs**: Select multiple PDF documents, preview order, combine them locally, and trigger high-speed downloads.
   - **Split PDF**: Extract page selections (e.g. `1-3, 5`) from a single loaded PDF document.
   - **Rotate PDF**: Visually rotate individual pages (90°, 180°, 270°) and download the modified document.
   - **Stamp Watermark**: Stamp diagonal text onto document pages with adjustable fonts, sizing, colors, and opacity.
   - **Protect & Encrypt**: Password-secure PDF metadata structures locally.

2. **Custom QR Designer (SVG Vector Engine)**:
   - **Customizations**: Design gradients fill colors, circular/rounded module dot patterns, custom eye corner styles, adjust eye colors, and modify background panels.
   - **Logo Upload**: Drag-and-drop png overlays that automatically render clip-path centers.
   - **High-Res Export**: Download as responsive vectors (.svg) or compile high-resolution 2000x2000px images (.png) using HTML5 Canvas drawers.
   - **Analytics Charts**: Dynamic scan campaign dashboard with scan timelines and device segment distributions powered by Chart.js.

3. **Universal Converter (In-Browser Canvas & ZIP Compiler)**:
   - **Image Converter**: Batch rasterize JPEG, PNG, and WebP format options, adjust compress qualities, and download compiled ZIP structures (via JSZip).
   - **TXT / HTML to PDF**: Convert styled notes or raw code strings into PDF vectors.
   - **Asynchronous media queue**: Simulates Express background queue worker operations (BullMQ/Redis) with active progress bars, timer intervals, cancellation triggers, and mockup downloads.

4. **SaaS Dashboard & Admin Panels**:
   - **Auth Simulator**: Simulated accounts and OAuth Google/GitHub widgets that populate state managers.
   - **Billing & API Keys**: Stripe checkout popup that unlocks Pro limits, updates billing logs, and regenerates API secret key keys.
   - **Admin Debugger Terminal**: Monitor active user accounts, MRR charts, and view background operations logs.

---

## 🚀 How to Run Locally

Since this is a client-side frontend project, you do not need any servers or dependencies:

1. Open a terminal or file explorer.
2. Direct your browser to the local `index.html` file (e.g. double click it, or run a simple local server):
   ```bash
   npx serve .
   # OR double click index.html
   ```

## 📂 File Layout

- [index.html](file:///C:/Users/ASUS/.gemini/antigravity/scratch/toolhub-frontend/index.html) - Structural framework containing SPA workspaces and Swagger docs.
- [styles.css](file:///C:/Users/ASUS/.gemini/antigravity/scratch/toolhub-frontend/styles.css) - Variable CSS declarations for Glassmorphism panels & dark/light theme grids.
- [app.js](file:///C:/Users/ASUS/.gemini/antigravity/scratch/toolhub-frontend/app.js) - Router managers, local accounts, history logs, and subscription checkpoints.
- [tools.js](file:///C:/Users/ASUS/.gemini/antigravity/scratch/toolhub-frontend/tools.js) - PDF-lib processing hooks, image Canvas compressors, and ZIP archives.
- [qr-generator.js](file:///C:/Users/ASUS/.gemini/antigravity/scratch/toolhub-frontend/qr-generator.js) - Customized SVG matrices builders and Chart.js metrics.
- [admin.js](file:///C:/Users/ASUS/.gemini/antigravity/scratch/toolhub-frontend/admin.js) - MRR income progress, user account modifications, and live logging simulations.
