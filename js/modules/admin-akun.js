import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { supabase } from '../config.js';

// Client terpisah agar saat Super Admin membuat akun baru, sesi Super Admin tidak ikut keluar
const authCreator = createClient(supabase.supabaseUrl, supabase.supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export async function render(container) {
  container.innerHTML = `
    <div id="msgAkun" class="msg"></div>

    <div class="card">
      <h2>Buat Akun Tim Baru</h2>
      <form id="formAkun">
        <div class="form-grid">
          <div class="form-group">
            <label>Nama Lengkap Anggota</label>
            <input type="text" id="akunNama" placeholder="Contoh: Budi Santoso" required />
          </div>
          <div class="form-group">
            <label>No. HP / WhatsApp</label>
            <input type="tel" id="akunHp" placeholder="0812..." />
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Jabatan / Role</label>
            <select id="akunRole" required>
              <option value="pengepul">Pengepul KTP</option>
              <option value="saksi">Saksi TPS</option>
              <option value="admin_desa">Admin Desa</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div class="form-group" id="wrapDesa">
            <label>Tugas di Desa</label>
            <select id="akunDesa"></select>
          </div>
        </div>

        <div class="form-group" id="wrapTps" style="display:none;">
          <label>Tugas di TPS (Khusus Saksi)</label>
          <select id="akunTps"></select>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Email Login</label>
            <input type="email" id="akunEmail" placeholder="contoh: budi01@pemilu.id" required />
          </div>
          <div class="form-group">
            <label>Kata Sandi (Min. 6 karakter)</label>
            <input type="text" id="akunPass" placeholder="Contoh: tim2026" minlength="6" required />
          </div>
        </div>

        <button type="submit" class="btn-primary" id="btnBuatAkun">Buat Akun Sekarang</button>
      </form>
    </div>

    <div class="card">
      <h2>Daftar Akun Tim (<span id="jumlahAkun">0</span>)</h2>
      <div class="form-group">
        <input type="text" id="cariAkun" placeholder="Cari nama anggota atau desa..." />
      </div>
      <div id="listAkun">Memuat daftar akun...</div>
    </div>
  `;

  const msgEl = document.getElementById('msgAkun');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
  };

  let semuaDesa = [];
  let semuaAkun = [];

  const roleEl = document.getElementById('akunRole');
  const desaEl = document.getElementById('akunDesa');
  const tpsEl = document.getElementById('akunTps');
  const wrapDesa = document.getElementById('wrapDesa');
  const wrapTps = document.getElementById('wrapTps');

  function updateDropdownTps() {
    const desaId = parseInt(desaEl.value, 10);
    const desa = semuaDesa.find(d => d.id === desaId);
    const daftarTps = (desa?.tps || []).sort((a, b) => a.nomor_tps.localeCompare(b.nomor_tps));
    tpsEl.innerHTML = daftarTps.length > 0
      ? daftarTps.map(t => `<option value="${t.id}">TPS ${t.nomor_tps}</option>`).join('')
      : '<option value="">-- Belum ada TPS di desa ini --</option>';
  }

  roleEl.addEventListener('change', () => {
    const r = roleEl.value;
    wrapDesa.style.display = r === 'super_admin' ? 'none' : 'block';
    wrapTps.style.display = r === 'saksi' ? 'block' : 'none';
    if (r === 'saksi') updateDropdownTps();
  });

  desaEl.addEventListener('change', updateDropdownTps);

  async function muatData() {
    const { data: dDesa } = await supabase
      .from('desa')
      .select('id, nama_desa, tps(id, nomor_tps)')
      .order('nama_desa', { ascending: true });
    semuaDesa = dDesa || [];

    desaEl.innerHTML = semuaDesa.length > 0
      ? semuaDesa.map(d => `<option value="${d.id}">${d.nama_desa}</option>`).join('')
      : '<option value="">-- Tambahkan desa dulu --</option>';
    updateDropdownTps();

    const { data: dUsers, error } = await supabase
      .from('users_tim')
      .select('*, desa(nama_desa), tps(nomor_tps)')
      .order('created_at', { ascending: false });

    if (error) {
      showMsg(`Gagal memuat daftar akun: ${error.message}`, true);
      return;
    }

    semuaAkun = dUsers || [];
    renderListAkun();
  }

  function renderListAkun() {
    const keyword = document.getElementById('cariAkun').value.toLowerCase();
    const hasil = semuaAkun.filter(u =>
      u.nama_lengkap.toLowerCase().includes(keyword) ||
      (u.desa?.nama_desa || '').toLowerCase().includes(keyword) ||
      u.role.toLowerCase().includes(keyword)
    );

    document.getElementById('jumlahAkun').textContent = hasil.length;
    const listEl = document.getElementById('listAkun');

    if (hasil.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Tidak ada akun yang cocok.</p>`;
      return;
    }

    listEl.innerHTML = hasil.map(u => {
      const wilayah = u.desa?.nama_desa
        ? `${u.desa.nama_desa}${u.tps?.nomor_tps ? ' - TPS ' + u.tps.nomor_tps : ''}`
        : 'Semua Wilayah';
      return `
        <div class="list-item">
          <div>
            <strong>${u.nama_lengkap}</strong>
            <span class="badge ${u.aktif ? '' : 'off'}">${u.role}</span>
            <div style="font-size:12px; color:#64748b; margin-top:2px;">
              ${wilayah} ${u.no_hp ? '• ' + u.no_hp : ''}
            </div>
          </div>
          <button class="btn-mini" data-id="${u.id}" data-aktif="${u.aktif}">
            ${u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-mini').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const statusBaru = btn.dataset.aktif !== 'true';
        await supabase.from('users_tim').update({ aktif: statusBaru }).eq('id', id);
        await muatData();
      });
    });
  }

  document.getElementById('cariAkun').addEventListener('input', renderListAkun);

  document.getElementById('formAkun').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnBuatAkun');
    btn.disabled = true;
    btn.textContent = 'Mendaftarkan akun...';

    const nama_lengkap = document.getElementById('akunNama').value.trim();
    const no_hp = document.getElementById('akunHp').value.trim();
    const role = roleEl.value;
    const desa_id = role === 'super_admin' ? null : (parseInt(desaEl.value, 10) || null);
    const tps_id = role === 'saksi' ? (parseInt(tpsEl.value, 10) || null) : null;
    const email = document.getElementById('akunEmail').value.trim();
    const password = document.getElementById('akunPass').value.trim();

    try {
      if (role !== 'super_admin' && !desa_id) {
        throw new Error('Pilih desa terlebih dahulu.');
      }
      if (role === 'saksi' && !tps_id) {
        throw new Error('Pilih TPS untuk saksi terlebih dahulu.');
      }

      // 1. Buat user di Supabase Auth
      const { data: authData, error: authErr } = await authCreator.auth.signUp({ email, password });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error('Gagal membuat user baru.');

      // 2. Simpan profil peran & wilayah ke users_tim
      const { error: dbErr } = await supabase.from('users_tim').insert({
        id: authData.user.id,
        nama_lengkap,
        no_hp,
        role,
        desa_id,
        tps_id,
        aktif: true
      });
      if (dbErr) throw dbErr;

      e.target.reset();
      roleEl.dispatchEvent(new Event('change'));
      showMsg(`Akun ${nama_lengkap} (${email} | Sandi: ${password}) berhasil dibuat!`);
      await muatData();
    } catch (err) {
      showMsg(`Gagal: ${err.message}`, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Buat Akun Sekarang';
    }
  });

  await muatData();
}
