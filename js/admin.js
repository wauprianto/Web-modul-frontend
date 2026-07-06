// admin.js — Logika halaman upload modul (admin.html)

const uploadForm = document.getElementById("upload-form");
const semesterSelect = document.getElementById("semester-select");
const fileInput = document.getElementById("file-input");
const fileNameLabel = document.getElementById("file-name-label");
const statusEl = document.getElementById("upload-status");
const submitBtn = document.getElementById("submit-btn");

// Isi dropdown semester 1-8 secara dinamis (biar tidak menulis 8 <option> manual di HTML)
for (let s = 1; s <= 8; s++) {
  const opt = document.createElement("option");
  opt.value = s;
  opt.textContent = `Semester ${s}`;
  semesterSelect.appendChild(opt);
}

// Tampilkan nama file begitu dipilih
fileInput.addEventListener("change", () => {
  fileNameLabel.textContent = fileInput.files[0]?.name || "Klik untuk pilih file PDF";
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const semester = Number(semesterSelect.value);
  const file = fileInput.files[0];

  if (!file) {
    showStatus("Pilih file PDF terlebih dahulu.", "error");
    return;
  }
  if (file.type !== "application/pdf") {
    showStatus("File harus berformat PDF.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Mengunggah…";
  showStatus("Sedang mengunggah, mohon tunggu…", "info");

  try {
    const result = await uploadModule(semester, file);
    showStatus(`Tersimpan sebagai "${result.filename}" di Semester ${semester}.`, "success");
    uploadForm.reset();
    fileNameLabel.textContent = "Klik untuk pilih file PDF";
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Unggah Modul";
  }
});

function showStatus(message, type) {
  const styles = {
    success: "text-ledger bg-ledger/10 border-ledger/30",
    error: "text-stamp bg-stamp/10 border-stamp/30",
    info: "text-muted bg-hairline/30 border-hairline",
  };
  statusEl.className = `mt-1 px-4 py-3 rounded-lg text-sm border font-medium ${styles[type]}`;
  statusEl.textContent = message;
  statusEl.classList.remove("hidden");
}
