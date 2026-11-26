import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { supabase } from '../config.js';

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
            <input type="text" id="akunNama" placeholder="Contoh: Admin Kampung Padang" required />
          </div>
          <div class="form-group">
            <label>No. HP / WhatsApp</label>
            <input type="tel" id="akunHp" placeholder="0812..." />
          </div>
        </div>

        <div class="form-group">
          <label>Jabatan / Role</label>
          <select id="akunRole" required>
            <option value="admin_desa">Admin Desa (Mengurus 1 Desa)</option>
            <option value="pengepul">Pengepul KTP</option>
            <option value="saksi">Saksi TPS</option>
            <option value="super_admin">Super Admin (Semua Wilayah)</option>
          </select>
        </div>

        <div class="form-grid" id="wrapWilayah">
          <div class="form-group">
            <label>Pilih Kecamatan</label>
            <select id="akunKecamatan"></select>
          </div>
          <div class="form-group">
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
            <input type="email" id="akunEmail" placeholder="contoh: kampungpadang@pemilu.id" required />
          </div>
          <div class="form-group">
            <label>Kata Sandi (Min. 6 karakter)</label>
            <input type="text" id="akunPass" placeholder="Contoh: desa2026" minlength="6" required />
          </div>
        </div>

        <button type="submit" class="btn-primary" id="btnBuatAkun">Buat Akun Sekarang</button>
      </form>
    </div>

    <div class="card">
      <h2>Daftar Akun Tim (<span id="jumlahAkun">0</span>)</h2>
      <div class="form-group">
        <input type="text" id="cariAkun" placeholder="Cari nama anggota, kecamatan, atau desa..." />
      </div>
      <div id="listAkun">Memuat daftar akun...</div>
    </div>
  `;

  const msgEl = document.getElementById('msgAkun');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  let semuaKecamatan = [];
  let semuaDesa = [];
  let semuaAkun = [];

  const roleEl = document.getElementById('akunRole');
  const kecEl = document.getElementById('akunKecamatan');
  const desaEl = document.getElementById('akunDesa');
  const tpsEl = document.getElementById('akunTps');
  const wrapWilayah = document.getElementById('wrapWilayah');
  const wrapTps = document.getElementById('wrapTps');

  function updateDropdownDesa() {
    const kecId = kecEl.value;
    const daftarDesa = kecId
      ? semuaDesa.filter(d => String(d.kecamatan_id) === kecId)
      : semuaDesa;

    desaEl.innerHTML = daftarDesa.length > 0
      ? daftarDesa.map(d => `<option value="${d.id}">${d.nama_desa}</option>`).join('')
      : '<option value="">-- Belum ada desa di kecamatan ini --</option>';

    updateDropdownTps();
  }

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
    wrapWilayah.style.display = r === 'super_admin' ? 'none' : 'grid';
    wrapTps.style.display = r === 'saksi' ? 'block' : 'none';
    if (r === 'saksi') updateDropdownTps();
  });

  kecEl.addEventListener('change', updateDropdownDesa);
  desaEl.addEventListener('change', updateDropdownTps);

  async function muatData() {
    const [{ data: dKec }, { data: dDesa }, { data: dUsers, error }] = await Promise.all([
      supabase.from('kecamatan').select('id, nama_kecamatan').order('nama_kecamatan', { ascending: true }),
      supabase.from('desa').select('id, nama_desa, kecamatan_id, kecamatan(nama_kecamatan), tps(id, nomor_tps)').order('nama_desa', { ascending: true }),
      supabase.from('users_tim').select('*, desa(nama_desa, kecamatan(nama_kecamatan)), tps(nomor_tps)').order('created_at', { ascending: false })
    ]);

    if (error) {
      showMsg(`Gagal memuat daftar akun: ${error.message}`, true);
      return;
    }

    semuaKecamatan = dKec || [];
    semuaDesa = dDesa || [];
    semuaAkun = dUsers || [];

    kecEl.innerHTML = semuaKecamatan.length > 0
      ? semuaKecamatan.map(k => `<option value="${k.id}">${k.nama_kecamatan}</option>`).join('')
      : '<option value="">Semua Kecamatan</option>';

    updateDropdownDesa();
    renderListAkun();
  }

  function renderListAkun() {
    const keyword = document.getElementById('cariAkun').value.toLowerCase();
    const hasil = semuaAkun.filter(u =>
      u.nama_lengkap.toLowerCase().includes(keyword) ||
      (u.desa?.nama_desa || '').toLowerCase().includes(keyword) ||
      (u.desa?.kecamatan?.nama_kecamatan || '').toLowerCase().includes(keyword) ||
      u.role.toLowerCase().includes(keyword)
    );

    document.getElementById('jumlahAkun').textContent = hasil.length;
    const listEl = document.getElementById('listAkun');

    if (hasil.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Tidak ada akun yang cocok.</p>`;
      return;
    }

    listEl.innerHTML = hasil.map(u => {
      const kecNama = u.desa?.kecamatan?.nama_kecamatan ? `${u.desa.kecamatan.nama_kecamatan} • ` : '';
      const wilayah = u.desa?.nama_desa
        ? `${kecNama}${u.desa.nama_desa}${u.tps?.nomor_tps ? ' - TPS ' + u.tps.nomor_tps : ''}`
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

      const { data: authData, error: authErr } = await authCreator.auth.signUp({ email, password });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error('Gagal membuat user baru.');

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
