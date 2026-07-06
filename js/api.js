// api.js
// Konfigurasi & helper function untuk berkomunikasi dengan backend FastAPI.
// Dipakai bersama oleh main.js dan admin.js (reader.js punya alurnya sendiri
// karena dia mengambil file PDF langsung, bukan lewat JSON API).

const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Mengambil daftar modul PDF untuk satu semester (1-8).
 * @param {number} semester
 * @returns {Promise<{semester:number, total:number, modules:Array}>}
 */
async function fetchModulesBySemester(semester) {
  const res = await fetch(`${API_BASE_URL}/api/modules/${semester}`);
  if (!res.ok) {
    throw new Error(`Gagal mengambil data modul (status ${res.status})`);
  }
  return res.json();
}

/**
 * Mengunggah file PDF baru ke backend.
 * @param {number} semester
 * @param {File} file
 */
async function uploadModule(semester, file) {
  const formData = new FormData();
  formData.append("semester", semester);
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    // Catatan penting: JANGAN set header Content-Type secara manual di sini.
    // Browser otomatis mengisi "multipart/form-data; boundary=..." yang benar
    // ketika body berupa FormData. Kalau kita override manual, boundary-nya
    // akan salah dan backend gagal mem-parsing file.
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Upload gagal, coba lagi.");
  }
  return data;
}

/**
 * Menggabungkan path relatif dari backend (mis. "/files/semester_1/x.pdf")
 * menjadi URL lengkap yang bisa diakses browser.
 * @param {string} relativeUrl
 */
function resolveFileUrl(relativeUrl) {
  return `${API_BASE_URL}${relativeUrl}`;
}
