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
    <style>
      .btn-open-akun {
        width: 100%;
        padding: 12px 14px;
        background: #1e3a8a;
        color: #ffffff;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        margin-bottom: 14px;
        box-shadow: 0 2px 6px rgba(30, 58, 138, 0.2);
      }
      .btn-open-akun:active {
        transform: scale(0.99);
      }
      .tim-group {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .tim-group.expanded {
        border-color: #60a5fa;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
      }
      .tim-group-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tim-group-title {
        font-size: 13px;
        font-weight: 800;
        color: #1e3a8a;
        text-transform: uppercase;
      }
      .tim-group-body {
        display: none;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      }
      .tim-group-body.open {
        display: block;
      }
      .btn-rincian-akun {
        padding: 5px 9px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 6px;
        border: 1px solid #bfdbfe;
        background: #eff6ff;
        color: #1e3a8a;
        cursor: pointer;
      }
      .btn-rincian-akun.active {
        background: #1e3a8a;
        border-color: #1e3a8a;
        color: #ffffff;
      }

      /* Kartu anggota dengan garis biru saat rincian dibuka */
      .tim-item {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px 12px;
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
      }
      .tim-item:first-child {
        margin-top: 0;
      }
      .tim-group-body.open .tim-item {
        background: #ffffff;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 0 10px rgba(37, 99, 235, 0.16);
      }

      .email-pill {
        display: inline-block;
        margin-top: 4px;
        padding: 2px 7px;
        background: #eff6ff;
        border: 1px solid #dbeafe;
        color: #1e3a8a;
        border-radius: 5px;
        font-family: monospace;
        font-size: 11px;
        font-weight: 600;
        word-break: break-all;
      }

      /* Gaya Modal Pop-up Akun */
      .akun-modal-bg {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 14px;
        z-index: 999;
      }
      .akun-modal-bg.open {
        display: flex;
      }
      .akun-modal-box {
        width: 100%;
        max-width: 440px;
        max-height: 88vh;
        overflow-y: auto;
        background: #ffffff;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.25);
        animation: popAkun 0.16s ease-out;
      }
      @keyframes popAkun {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .akun-modal-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .akun-modal-head h3 {
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
      }
      .akun-modal-close {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: none;
        background: #f1f5f9;
        color: #334155;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .akun-btn-cancel {
        width: 100%;
        padding: 11px;
        background: #e2e8f0;
        color: #334155;
        font-size: 14px;
        font-weight: 700;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 6px;
        margin-bottom: 8px;
      }
      .akun-btn-save {
        width: 100%;
        padding: 12px;
        background: #2563eb;
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        letter-spacing: 0.4px;
      }
    </style>

    <div id="msgAkun" class="msg"></div>

    <button type="button" class="btn-open-akun" id="openModalAkun">+ Buat Akun Tim Baru</button>

    <div class="card">
      <h2>Daftar Akun Tim (<span id="jumlahAkun">0</span>)</h2>
      <div class="form-grid" style="margin-bottom:10px;">
        <input type="text" id="cariAkun" placeholder="Cari nama, email, atau desa..." />
        <select id="filterKecAkun">
          <option value="">Semua Wilayah / Kecamatan</option>
        </select>
      </div>
      <div id="listAkun">Memuat daftar akun...</div>
    </div>

    <!-- POPUP BUAT AKUN TIM -->
    <div class="akun-modal-bg" id="modalBuatAkun">
      <div class="akun-modal-box">
        <div class="akun-modal-head">
          <h3>Buat Akun Tim Baru</h3>
          <button type="button" class="akun-modal-close" id="closeModalAkun">×</button>
        </div>

        <form id="formAkun">
          <div class="form-group">
            <label>Nama Lengkap Anggota</label>
            <input type="text" id="akunNama" placeholder="Contoh: Admin Kampung Padang" required />
          </div>

          <div class="form-group">
            <label>No. HP / WhatsApp</label>
            <input type="tel" id="akunHp" placeholder="0812..." />
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

          <div class="form-group">
            <label>Email Login</label>
            <input type="email" id="akunEmail" placeholder="contoh: kampungpadang@pemilu.id" required />
          </div>

          <div class="form-group">
            <label>Kata Sandi (Min. 6 karakter)</label>
            <input type="text" id="akunPass" placeholder="Contoh: desa2026" minlength="6" required />
          </div>

          <button type="button" class="akun-btn-cancel" id="batalModalAkun">Batal</button>
          <button type="submit" class="akun-btn-save" id="btnBuatAkun">BUAT AKUN SEKARANG</button>
        </form>
      </div>
    </div>
  `;

  const msgEl = document.getElementById('msgAkun');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Menyimpan ID grup yang sedang dibuka rinciannya
  const openedGroupIds = new Set();

  const modalAkun = document.getElementById('modalBuatAkun');
  const bukaModalAkun = () => {
    modalAkun.classList.add('open');
    document.getElementById('akunNama').focus();
  };
  const tutupModalAkun = () => modalAkun.classList.remove('open');

  document.getElementById('openModalAkun').addEventListener('click', bukaModalAkun);
  document.getElementById('closeModalAkun').addEventListener('click', tutupModalAkun);
  document.getElementById('batalModalAkun').addEventListener('click', tutupModalAkun);
  modalAkun.addEventListener('click', (e) => {
    if (e.target === modalAkun) tutupModalAkun();
  });

  let semuaKecamatan = [];
  let semuaDesa = [];
  let semuaAkun = [];

  const roleEl = document.getElementById('akunRole');
  const kecEl = document.getElementById('akunKecamatan');
  const desaEl = document.getElementById('akunDesa');
  const tpsEl = document.getElementById('akunTps');
  const wrapWilayah = document.getElementById('wrapWilayah');
  const wrapTps = document.getElementById('wrapTps');
  const filterKecEl = document.getElementById('filterKecAkun');

  const labelRole = {
    super_admin: 'Super Admin',
    admin_desa: 'Admin Desa',
    pengepul: 'Pengepul KTP',
    saksi: 'Saksi TPS'
  };

  const urutanRole = {
    super_admin: 1,
    admin_desa: 2,
    pengepul: 3,
    saksi: 4
  };

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
      supabase.from('users_tim').select('*, desa(id, nama_desa, kecamatan_id, kecamatan(id, nama_kecamatan)), tps(nomor_tps)').order('created_at', { ascending: false })
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

    const filterValLama = filterKecEl.value;
    filterKecEl.innerHTML =
      '<option value="">Semua Wilayah / Kecamatan</option>' +
      '<option value="super">⭐ Super Admin Pusat</option>' +
      semuaKecamatan.map(k => `<option value="${k.id}">📍 ${k.nama_kecamatan}</option>`).join('');
    filterKecEl.value = filterValLama;

    updateDropdownDesa();
    renderListAkun();
  }

  function renderKartuAnggota(u) {
    const wilayah = u.desa?.nama_desa
      ? `${u.desa.nama_desa}${u.tps?.nomor_tps ? ' • TPS ' + u.tps.nomor_tps : ''}`
      : 'Semua Wilayah';

    return `
      <div class="tim-item">
        <div style="flex:1;">
          <div>
            <strong>${u.nama_lengkap}</strong>
            <span class="badge ${u.aktif ? '' : 'off'}" style="margin-left:4px;">${labelRole[u.role] || u.role}</span>
          </div>
          <div style="font-size:12px; color:#475569; margin-top:3px;">
            ${wilayah}${u.no_hp ? ' • ' + u.no_hp : ''}
          </div>
          ${u.email ? `<div class="email-pill">✉️ ${u.email}</div>` : ''}
        </div>
        <button class="btn-mini" data-id="${u.id}" data-aktif="${u.aktif}">
          ${u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>
    `;
  }

  function renderKelompokAkun(groupKey, judul, anggotaList, extraStyle = '', titleColor = '') {
    if (!anggotaList || anggotaList.length === 0) return '';
    const isOpen = openedGroupIds.has(groupKey);

    return `
      <div class="tim-group ${isOpen ? 'expanded' : ''}" id="grpCard-${groupKey}" style="${extraStyle}">
        <div class="tim-group-head">
          <div class="tim-group-title" style="${titleColor ? 'color:' + titleColor + ';' : ''}">
            ${judul} (${anggotaList.length} Anggota)
          </div>
          <button type="button" class="btn-rincian-akun ${isOpen ? 'active' : ''}" data-toggle-akun="${groupKey}">
            ${isOpen ? 'Tutup Rincian ▴' : 'Rincian ▾'}
          </button>
        </div>
        <div class="tim-group-body ${isOpen ? 'open' : ''}" id="grpBody-${groupKey}">
          ${anggotaList.map(renderKartuAnggota).join('')}
        </div>
      </div>
    `;
  }

  function urutkanAnggota(list) {
    return [...list].sort((a, b) => {
      const desaA = a.desa?.nama_desa || '';
      const desaB = b.desa?.nama_desa || '';
      if (desaA !== desaB) return desaA.localeCompare(desaB);

      const roleA = urutanRole[a.role] || 9;
      const roleB = urutanRole[b.role] || 9;
      if (roleA !== roleB) return roleA - roleB;

      const tpsA = a.tps?.nomor_tps || '';
      const tpsB = b.tps?.nomor_tps || '';
      return tpsA.localeCompare(tpsB);
    });
  }

  function renderListAkun() {
    const keyword = document.getElementById('cariAkun').value.toLowerCase().trim();
    const filterKec = filterKecEl.value;

    const hasil = semuaAkun.filter(u => {
      const cocokKata =
        u.nama_lengkap.toLowerCase().includes(keyword) ||
        (u.email || '').toLowerCase().includes(keyword) ||
        (u.desa?.nama_desa || '').toLowerCase().includes(keyword) ||
        (u.desa?.kecamatan?.nama_kecamatan || '').toLowerCase().includes(keyword) ||
        (labelRole[u.role] || u.role).toLowerCase().includes(keyword);

      if (!cocokKata) return false;
      if (filterKec === 'super') return u.role === 'super_admin';
      if (filterKec) return String(u.desa?.kecamatan_id || '') === filterKec;
      return true;
    });

    document.getElementById('jumlahAkun').textContent = hasil.length;
    const listEl = document.getElementById('listAkun');

    if (hasil.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Tidak ada akun yang cocok.</p>`;
      return;
    }

    let html = '';

    // 1. Kelompok Super Admin Pusat
    const superAdmins = hasil.filter(u => u.role === 'super_admin');
    html += renderKelompokAkun(
      'super',
      '⭐ Super Admin Pusat',
      superAdmins,
      'border-color:#93c5fd; background:#f8faff;'
    );

    // 2. Kelompokkan per Kecamatan
    semuaKecamatan.forEach(k => {
      const anggotaKec = urutkanAnggota(
        hasil.filter(u => u.role !== 'super_admin' && u.desa?.kecamatan_id === k.id)
      );
      html += renderKelompokAkun(`kec-${k.id}`, `📍 ${k.nama_kecamatan}`, anggotaKec);
    });

    // 3. Kelompok Anggota yang desanya belum terhubung ke kecamatan
    const tanpaKec = urutkanAnggota(
      hasil.filter(u => u.role !== 'super_admin' && !u.desa?.kecamatan_id)
    );
    html += renderKelompokAkun(
      'tanpa-kec',
      '⚠️ Wilayah Belum Masuk Kecamatan',
      tanpaKec,
      'border-color:#fcd34d;',
      '#d97706'
    );

    listEl.innerHTML = html;

    // Tombol Rincian / Tutup Rincian per kelompok
    listEl.querySelectorAll('[data-toggle-akun]').forEach(btn => {
      btn.addEventListener('click', () => {
        const grpKey = String(btn.dataset.toggleAkun);
        const bodyEl = document.getElementById(`grpBody-${grpKey}`);
        const cardEl = document.getElementById(`grpCard-${grpKey}`);
        if (!bodyEl) return;

        const akanBuka = !bodyEl.classList.contains('open');
        bodyEl.classList.toggle('open', akanBuka);
        if (cardEl) cardEl.classList.toggle('expanded', akanBuka);
        btn.classList.toggle('active', akanBuka);
        btn.textContent = akanBuka ? 'Tutup Rincian ▴' : 'Rincian ▾';

        if (akanBuka) openedGroupIds.add(grpKey);
        else openedGroupIds.delete(grpKey);
      });
    });

    listEl.querySelectorAll('.btn-mini[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const statusBaru = btn.dataset.aktif !== 'true';
        await supabase.from('users_tim').update({ aktif: statusBaru }).eq('id', id);
        await muatData();
      });
    });
  }

  document.getElementById('cariAkun').addEventListener('input', renderListAkun);
  filterKecEl.addEventListener('change', renderListAkun);

  document.getElementById('formAkun').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnBuatAkun');
    btn.disabled = true;
    btn.textContent = 'MENDAFTARKAN AKUN...';

    const nama_lengkap = document.getElementById('akunNama').value.trim();
    const no_hp = document.getElementById('akunHp').value.trim();
    const role = roleEl.value;
    const desa_id = role === 'super_admin' ? null : (parseInt(desaEl.value, 10) || null);
    const tps_id = role === 'saksi' ? (parseInt(tpsEl.value, 10) || null) : null;
    const email = document.getElementById('akunEmail').value.trim().toLowerCase();
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
        email,
        no_hp,
        role,
        desa_id,
        tps_id,
        aktif: true
      });
      if (dbErr) throw dbErr;

      if (role === 'super_admin') {
        openedGroupIds.add('super');
      } else {
        const desaObj = semuaDesa.find(d => d.id === desa_id);
        if (desaObj?.kecamatan_id) openedGroupIds.add(`kec-${desaObj.kecamatan_id}`);
      }

      e.target.reset();
      roleEl.dispatchEvent(new Event('change'));
      tutupModalAkun();
      showMsg(`Akun ${nama_lengkap} (${email} | Sandi: ${password}) berhasil dibuat!`);
      await muatData();
    } catch (err) {
      showMsg(`Gagal: ${err.message}`, true);
      tutupModalAkun();
    } finally {
      btn.disabled = false;
      btn.textContent = 'BUAT AKUN SEKARANG';
    }
  });

  await muatData();
}
