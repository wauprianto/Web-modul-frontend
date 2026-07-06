// reader.js — Mode Baca PDF kustom menggunakan library PDF.js
//
// File ini dimuat sebagai ES module (lihat <script type="module"> di reader.html)
// karena versi terbaru pdfjs-dist (6.x) hanya didistribusikan dalam format
// ES module (.mjs), sudah tidak ada build UMD/global lagi. Karena itu kita
// import langsung dari CDN jsDelivr di baris paling atas.

import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/build/pdf.min.mjs";

// Worker PDF.js wajib diarahkan secara eksplisit supaya proses parsing PDF
// berjalan di background thread (tidak nge-freeze halaman utama saat render).
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/build/pdf.worker.min.mjs";

// ── State viewer ──────────────────────────────────────────────────────────
let pdfDoc = null;
let currentPage = 1;
let currentScale = 1.25;
const SCALE_STEP = 0.2;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
let isRendering = false;
let pendingPage = null;

// ── Referensi elemen DOM ─────────────────────────────────────────────────
const canvas = document.getElementById("pdf-canvas");
const ctx = canvas.getContext("2d");
const pageNumEl = document.getElementById("page-num");
const pageCountEl = document.getElementById("page-count");
const zoomLevelEl = document.getElementById("zoom-level");
const titleEl = document.getElementById("pdf-title");
const loadingOverlay = document.getElementById("loading-overlay");
const errorOverlay = document.getElementById("error-overlay");

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const zoomInBtn = document.getElementById("zoom-in-btn");
const zoomOutBtn = document.getElementById("zoom-out-btn");
const pageInput = document.getElementById("page-input");

// Ambil parameter dari URL, contoh: reader.html?file=...&title=...
// (dikirim dari main.js saat pengguna menekan tombol "Baca")
const params = new URLSearchParams(window.location.search);
const fileUrl = params.get("file");
const fileTitle = params.get("title") || "Modul PDF";
titleEl.textContent = fileTitle;

/** Render 1 halaman PDF ke <canvas> pada skala zoom saat ini. */
function renderPage(num) {
  isRendering = true;

  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: currentScale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderTask = page.render({ canvasContext: ctx, viewport });

    renderTask.promise.then(() => {
      isRendering = false;
      // Jika ada permintaan pindah halaman/zoom yang masuk SAAT render
      // sebelumnya masih berjalan, proses itu ditunda lalu dijalankan sekarang.
      if (pendingPage !== null) {
        const next = pendingPage;
        pendingPage = null;
        renderPage(next);
      }
    });
  });

  currentPage = num;
  pageNumEl.textContent = num;
  pageInput.value = num;
  zoomLevelEl.textContent = `${Math.round(currentScale * 100)}%`;
  prevBtn.disabled = num <= 1;
  nextBtn.disabled = num >= pdfDoc.numPages;
}

/** Antrekan render supaya tidak ada 2 proses render tabrakan bersamaan. */
function queueRenderPage(num) {
  if (isRendering) {
    pendingPage = num;
  } else {
    renderPage(num);
  }
}

function goPrev() {
  if (currentPage <= 1) return;
  queueRenderPage(currentPage - 1);
}

function goNext() {
  if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
  queueRenderPage(currentPage + 1);
}

function zoomIn() {
  if (currentScale >= MAX_SCALE) return;
  currentScale = Math.min(currentScale + SCALE_STEP, MAX_SCALE);
  queueRenderPage(currentPage);
}

function zoomOut() {
  if (currentScale <= MIN_SCALE) return;
  currentScale = Math.max(currentScale - SCALE_STEP, MIN_SCALE);
  queueRenderPage(currentPage);
}

// ── Event listeners ──────────────────────────────────────────────────────
prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);
zoomInBtn.addEventListener("click", zoomIn);
zoomOutBtn.addEventListener("click", zoomOut);

// Lompat ke halaman tertentu lewat input angka
pageInput.addEventListener("change", () => {
  const target = Number(pageInput.value);
  if (pdfDoc && target >= 1 && target <= pdfDoc.numPages) {
    queueRenderPage(target);
  } else {
    pageInput.value = currentPage;
  }
});

// Navigasi cepat pakai tombol panah keyboard
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") goPrev();
  if (e.key === "ArrowRight") goNext();
});

// ── Muat dokumen PDF ─────────────────────────────────────────────────────
if (!fileUrl) {
  loadingOverlay.classList.add("hidden");
  errorOverlay.textContent = "Tidak ada file yang dipilih.";
  errorOverlay.classList.remove("hidden");
} else {
  pdfjsLib
    .getDocument(fileUrl)
    .promise.then((doc) => {
      pdfDoc = doc;
      pageCountEl.textContent = doc.numPages;
      loadingOverlay.classList.add("hidden");
      renderPage(currentPage);
    })
    .catch((err) => {
      console.error(err);
      loadingOverlay.classList.add("hidden");
      errorOverlay.textContent =
        "Gagal memuat file PDF. Pastikan server backend menyala dan file tersedia.";
      errorOverlay.classList.remove("hidden");
    });
}
