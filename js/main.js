// main.js — Logika halaman daftar modul (index.html)
// Alur: render 8 tab semester -> saat tab diklik, fetch modul semester itu
// dari backend -> render sebagai kartu.

const semesterTabsEl = document.getElementById("semester-tabs");
const moduleListEl = document.getElementById("module-list");
const emptyStateEl = document.getElementById("empty-state");
const loadingStateEl = document.getElementById("loading-state");

let activeSemester = 1;

/** Menggambar ulang 8 tab semester, menandai tab yang sedang aktif. */
function renderTabs() {
  semesterTabsEl.innerHTML = "";
  for (let s = 1; s <= 8; s++) {
    const btn = document.createElement("button");
    btn.className = `tab-binder${s === activeSemester ? " is-active" : ""}`;
    btn.innerHTML = `<span class="tab-num">${String(s).padStart(2, "0")}</span>Semester`;
    btn.addEventListener("click", () => {
      if (s === activeSemester) return;
      activeSemester = s;
      renderTabs();
      loadModules(s);
    });
    semesterTabsEl.appendChild(btn);
  }
}

/** Menggambar daftar kartu modul dari data yang didapat backend. */
function renderModules(modules) {
  moduleListEl.innerHTML = "";
  emptyStateEl.classList.toggle("hidden", modules.length > 0);

  modules.forEach((mod) => {
    const readerUrl =
      `reader.html?file=${encodeURIComponent(resolveFileUrl(mod.url))}` +
      `&title=${encodeURIComponent(mod.title)}`;

    const card = document.createElement("div");
    card.className =
      "module-card bg-paper border border-hairline rounded-lg p-4 flex flex-col gap-3";
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded bg-ink text-paper flex items-center justify-center font-mono text-[0.62rem] font-semibold shrink-0">PDF</div>
        <div class="min-w-0">
          <h3 class="font-serif text-[0.95rem] text-ink leading-snug truncate" title="${mod.title}">${mod.title}</h3>
          <p class="font-mono text-[0.7rem] text-muted mt-0.5">${mod.size_kb} KB</p>
        </div>
      </div>
      <a href="${readerUrl}"
         class="mt-auto text-center bg-brass text-white text-sm font-medium py-2 rounded-md hover:bg-brass-dark transition-colors">
        Baca
      </a>
    `;
    moduleListEl.appendChild(card);
  });
}

/** Ambil data dari backend untuk 1 semester, lalu render (dengan loading/error state). */
async function loadModules(semester) {
  loadingStateEl.classList.remove("hidden");
  moduleListEl.innerHTML = "";
  emptyStateEl.classList.add("hidden");

  try {
    const data = await fetchModulesBySemester(semester);
    renderModules(data.modules);
  } catch (err) {
    moduleListEl.innerHTML = `<p class="text-stamp text-sm col-span-full">${err.message} — pastikan server backend sedang berjalan.</p>`;
  } finally {
    loadingStateEl.classList.add("hidden");
  }
}

renderTabs();
loadModules(activeSemester);
