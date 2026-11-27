import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';
  const isAdminDesa = profil.role === 'admin_desa';
  const isSaksi = profil.role === 'saksi';
  const canManage = isSuper || isAdminDesa;

  if (isSaksi && (!profil.desa_id || !profil.tps_id)) {
    container.innerHTML = `
      <div class="card">
        <h2>Akun Saksi Belum Terhubung ke TPS</h2>
        <p style="font-size:14px; color:#64748b;">
          Akun Anda belum diatur lokasi Desa dan Nomor TPS-nya. Silakan hubungi Admin Desa atau Super Admin untuk melengkapi penugasan TPS Anda.
        </p>
      </div>`;
    return;
  }

  const labelTombolUtama = isSaksi
    ? '📝 Input Hasil Suara TPS (Model C1)'
    : '📝 Input / Koreksi Suara TPS (Model C1)';

  container.innerHTML = `
    <style>
      .btn-open-suara {
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
      .btn-open-suara:active {
        transform: scale(0.99);
      }

      .suara-kec-group {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .suara-kec-group.expanded {
        border-color: #60a5fa;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
      }
      .suara-kec-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .suara-kec-title {
        font-size: 13px;
        font-weight: 800;
        color: #1e3a8a;
        text-transform: uppercase;
      }
      .suara-kec-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
      .suara-kec-body {
        display: none;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      }
      .suara-kec-body.open {
        display: block;
      }
      .btn-rincian-suara {
        padding: 5px 9px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 6px;
        border: 1px solid #bfdbfe;
        background: #eff6ff;
        color: #1e3a8a;
        cursor: pointer;
      }
      .btn-rincian-suara.active {
        background: #1e3a8a;
        border-color: #1e3a8a;
        color: #ffffff;
      }

      /* Kartu laporan suara dengan garis biru saat rincian kecamatan dibuka */
      .suara-tps-item {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px 12px;
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
      }
      .suara-tps-item:first-child {
        margin-top: 0;
      }
      .suara-kec-body.open .suara-tps-item {
        background: #ffffff;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 0 10px rgba(37, 99, 235, 0.16);
      }

      /* Gaya Modal Pop-up Suara TPS */
      .modal-suara-bg {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 14px;
        z-index: 999;
      }
      .modal-suara-bg.open { display: flex; }
      .modal-suara-box {
        width: 100%;
        max-width: 430px;
        max-height: 88vh;
        overflow-y: auto;
        background: #ffffff;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.25);
        animation: popSuara 0.16s ease-out;
      }
      @keyframes popSuara {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .modal-suara-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .modal-suara-head h3 {
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
      }
      .modal-suara-close {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: none;
        background: #f1f5f9;
        color: #334155;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
      }
      .suara-btn-cancel {
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
    </style>

    <div id="msgSuara" class="msg"></div>

    <button type="button" class="btn-open-suara" id="openModalSuara">${labelTombolUtama}</button>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        <h2 style="margin:0;">Laporan Suara Masuk (<span id="jumlahTpsMasuk">0</span> TPS)</h2>
        ${isSuper ? `<select id="filterDesaSuara" style="width:auto; padding:6px 10px; font-size:12px;"><option value="">Semua Desa</option></select>` : ''}
      </div>
      <div id="listSuara">Memuat laporan suara...</div>
    </div>

    <!-- POPUP INPUT / KOREKSI SUARA TPS -->
    <div class="modal-suara-bg" id="modalInputSuara">
      <div class="modal-suara-box">
        <div class="modal-suara-head">
          <h3>${isSaksi ? 'Input Hasil Suara (Model C1)' : 'Input / Koreksi Suara (Model C1)'}</h3>
          <button type="button" class="modal-suara-close" id="closeModalSuara">×</button>
        </div>

        <div id="lockBanner" style="display:none; padding:11px 12px; border-radius:10px; font-size:13px; margin-bottom:12px;"></div>

        <form id="formSuara">
          <div class="form-grid">
            <div class="form-group">
              <label>Desa / Kelurahan</label>
              <select id="suaraDesa" required ${!isSuper ? 'disabled' : ''}></select>
            </div>
            <div class="form-group">
              <label>Nomor TPS</label>
              <select id="suaraTps" required ${isSaksi ? 'disabled' : ''}></select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Perolehan Suara Calon</label>
              <input type="number" id="suaraCalon" inputmode="numeric" min="0" placeholder="0" required />
            </div>
            <div class="form-group">
              <label>Suara Tidak Sah (Opsional)</label>
              <input type="number" id="suaraTidakSah" inputmode="numeric" min="0" placeholder="0" />
            </div>
          </div>

          <div class="form-group">
            <label>Catatan Saksi / Keterangan C1 (Opsional)</label>
            <input type="text" id="suaraCatatan" placeholder="Contoh: Saksi hadir lengkap, C1 plano aman" />
          </div>

          <button type="button" class="suara-btn-cancel" id="batalModalSuara">Batal</button>
          <button type="submit" class="btn-primary" id="btnSimpanSuara">Kirim Hasil Suara TPS</button>
        </form>
      </div>
    </div>
  `;

  const msgEl = document.getElementById('msgSuara');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Menyimpan ID kelompok kecamatan yang sedang dibuka rinciannya
  const openedKecSuaraIds = new Set();

  let daftarDesa = [];
  let existingRecord = null;

  const modalSuara = document.getElementById('modalInputSuara');
  const desaEl = document.getElementById('suaraDesa');
  const tpsEl = document.getElementById('suaraTps');
  const inputCalon = document.getElementById('suaraCalon');
  const inputTidakSah = document.getElementById('suaraTidakSah');
  const inputCatatan = document.getElementById('suaraCatatan');
  const btnSimpan = document.getElementById('btnSimpanSuara');
  const lockBanner = document.getElementById('lockBanner');
  const filterDesaEl = document.getElementById('filterDesaSuara');

  function bukaModalSuara() {
    modalSuara.classList.add('open');
    if (!inputCalon.disabled) inputCalon.focus();
  }
  function tutupModalSuara() {
    modalSuara.classList.remove('open');
  }

  document.getElementById('openModalSuara').addEventListener('click', bukaModalSuara);
  document.getElementById('closeModalSuara').addEventListener('click', tutupModalSuara);
  document.getElementById('batalModalSuara').addEventListener('click', tutupModalSuara);
  modalSuara.addEventListener('click', (e) => {
    if (e.target === modalSuara) tutupModalSuara();
  });

  function setFormDisabled(disabled) {
    inputCalon.disabled = disabled;
    inputTidakSah.disabled = disabled;
    inputCatatan.disabled = disabled;
  }

  function isiDropdownTps() {
    const desaId = parseInt(desaEl.value, 10);
    const desa = daftarDesa.find(d => d.id === desaId);
    const listTps = (desa?.tps || []).sort((a, b) => a.nomor_tps.localeCompare(b.nomor_tps));

    tpsEl.innerHTML = listTps.length > 0
      ? listTps.map(t => `<option value="${t.id}" ${t.id === profil.tps_id ? 'selected' : ''}>TPS ${t.nomor_tps}</option>`).join('')
      : '<option value="">-- Belum ada TPS --</option>';
  }

  async function isiFormJikaSudahAda() {
    const tpsId = parseInt(tpsEl.value, 10);
    existingRecord = null;

    if (!tpsId) {
      inputCalon.value = '';
      inputTidakSah.value = '';
      inputCatatan.value = '';
      lockBanner.style.display = 'none';
      return;
    }

    const { data } = await supabase
      .from('suara_tps')
      .select('id, suara_calon, suara_tidak_sah, catatan, terkunci')
      .eq('tps_id', tpsId)
      .maybeSingle();

    existingRecord = data || null;

    if (existingRecord) {
      inputCalon.value = existingRecord.suara_calon ?? 0;
      inputTidakSah.value = existingRecord.suara_tidak_sah ?? 0;
      inputCatatan.value = existingRecord.catatan || '';

      const isLocked = existingRecord.terkunci !== false;

      if (isSaksi) {
        if (isLocked) {
          setFormDisabled(true);
          btnSimpan.style.display = 'none';
          lockBanner.style.display = 'block';
          lockBanner.style.background = '#fef3c7';
          lockBanner.style.border = '1px solid #fde68a';
          lockBanner.style.color = '#92400e';
          lockBanner.innerHTML = '<strong>🔒 Data Suara TPS Sudah Terkunci</strong><br>Laporan suara sudah masuk ke pusat. Jika ada kesalahan angka, hubungi <strong>Admin Desa</strong> untuk membuka kunci atau mengoreksi data.';
        } else {
          setFormDisabled(false);
          btnSimpan.style.display = 'block';
          btnSimpan.textContent = 'Kirim Perbaikan & Kunci Suara';
          lockBanner.style.display = 'block';
          lockBanner.style.background = '#d1fae5';
          lockBanner.style.border = '1px solid #a7f3d0';
          lockBanner.style.color = '#065f46';
          lockBanner.innerHTML = '<strong>🔓 Kunci Dibuka oleh Admin</strong><br>Silakan perbaiki angka sesuai formulir C1 Plano lalu tekan tombol simpan. Data akan otomatis terkunci kembali setelah dikirim.';
        }
      } else {
        setFormDisabled(false);
        btnSimpan.style.display = 'block';
        btnSimpan.textContent = 'Simpan Perubahan Suara';
        lockBanner.style.display = 'block';
        lockBanner.style.background = isLocked ? '#eff6ff' : '#fef3c7';
        lockBanner.style.border = isLocked ? '1px solid #bfdbfe' : '1px solid #fde68a';
        lockBanner.style.color = isLocked ? '#1e3a8a' : '#92400e';
        lockBanner.innerHTML = isLocked
          ? '🔒 <strong>Status TPS ini: Terkunci.</strong> Anda dapat langsung mengubah angka di bawah jika terjadi kesalahan input Saksi.'
          : '🔓 <strong>Status TPS ini: Kunci Terbuka.</strong> Saksi sedang diizinkan mengirim ulang angka dari HP-nya.';
      }
    } else {
      inputCalon.value = '';
      inputTidakSah.value = '';
      inputCatatan.value = '';
      setFormDisabled(false);
      btnSimpan.style.display = 'block';
      btnSimpan.textContent = 'Kirim Hasil Suara TPS';
      lockBanner.style.display = 'none';
    }
  }

  let queryDesa = supabase
    .from('desa')
    .select('id, nama_desa, kecamatan_id, kecamatan(nama_kecamatan), tps(id, nomor_tps)')
    .order('nama_desa', { ascending: true });

  if (!isSuper && profil.desa_id) {
    queryDesa = queryDesa.eq('id', profil.desa_id);
  }

  const { data: dDesa } = await queryDesa;
  daftarDesa = dDesa || [];

  desaEl.innerHTML = daftarDesa.length > 0
    ? daftarDesa.map(d => {
        const namaKec = (isSuper && d.kecamatan?.nama_kecamatan) ? `${d.kecamatan.nama_kecamatan} — ` : '';
        return `<option value="${d.id}" ${d.id === profil.desa_id ? 'selected' : ''}>${namaKec}${d.nama_desa}</option>`;
      }).join('')
    : '<option value="">-- Belum ada data desa --</option>';

  if (filterDesaEl) {
    filterDesaEl.innerHTML = '<option value="">Semua Desa</option>' +
      daftarDesa.map(d => {
        const namaKec = d.kecamatan?.nama_kecamatan ? `${d.kecamatan.nama_kecamatan} — ` : '';
        return `<option value="${d.id}">${namaKec}${d.nama_desa}</option>`;
      }).join('');
  }

  isiDropdownTps();
  await isiFormJikaSudahAda();

  desaEl.addEventListener('change', async () => {
    isiDropdownTps();
    await isiFormJikaSudahAda();
  });

  tpsEl.addEventListener('change', isiFormJikaSudahAda);

  function renderKartuSuara(item) {
    const isLocked = item.terkunci !== false;
    const badgeKunci = isLocked
      ? `<span class="badge" style="background:#f1f5f9; color:#334155;">🔒 Terkunci</span>`
      : `<span class="badge" style="background:#fef3c7; color:#92400e;">🔓 Terbuka</span>`;

    const kecIdVal = item.desa?.kecamatan_id || '';

    const aksiAdmin = canManage ? `
      <div style="display:flex; gap:6px; margin-top:8px; width:100%;">
        <button type="button" class="btn-mini btn-edit-suara" data-desa="${item.desa_id}" data-tps="${item.tps_id}" data-kec="${kecIdVal}">
          ✏️ Edit Angka
        </button>
        <button type="button" class="btn-mini btn-toggle-kunci" data-tps="${item.tps_id}" data-kec="${kecIdVal}" data-locked="${isLocked}">
          ${isLocked ? '🔓 Buka Kunci Saksi' : '🔒 Kunci Kembali'}
        </button>
      </div>` : '';

    return `
      <div class="suara-tps-item">
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
          <strong>${item.desa?.nama_desa || '-'} • TPS ${item.tps?.nomor_tps || '-'}</strong>
          <div style="display:flex; gap:5px; align-items:center;">
            ${badgeKunci}
            <span class="badge" style="background:#d1fae5; color:#065f46; font-size:12px;">
              ${Number(item.suara_calon || 0).toLocaleString('id-ID')} Suara
            </span>
          </div>
        </div>
        <div style="font-size:12px; color:#475569; margin-top:4px;">
          Tidak Sah: <strong>${Number(item.suara_tidak_sah || 0).toLocaleString('id-ID')}</strong>
          ${item.users_tim?.nama_lengkap ? ' • Saksi: ' + item.users_tim.nama_lengkap : ''}
        </div>
        ${item.catatan ? `<div style="font-size:12px; color:#64748b; margin-top:2px;">Catatan: ${item.catatan}</div>` : ''}
        ${aksiAdmin}
      </div>
    `;
  }

  async function muatLaporanSuara() {
    const listEl = document.getElementById('listSuara');
    let query = supabase
      .from('suara_tps')
      .select('id, desa_id, tps_id, suara_calon, suara_tidak_sah, catatan, terkunci, created_at, desa(nama_desa, kecamatan_id, kecamatan(nama_kecamatan)), tps(nomor_tps), users_tim(nama_lengkap)')
      .order('created_at', { ascending: false });

    if (!isSuper && profil.desa_id) {
      query = query.eq('desa_id', profil.desa_id);
    } else if (filterDesaEl && filterDesaEl.value) {
      query = query.eq('desa_id', parseInt(filterDesaEl.value, 10));
    }

    const { data, error } = await query;
    if (error) {
      listEl.innerHTML = `<p style="color:#dc2626; font-size:13px;">Gagal memuat: ${error.message}</p>`;
      return;
    }

    const rows = data || [];
    document.getElementById('jumlahTpsMasuk').textContent = rows.length;

    if (rows.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada laporan suara TPS yang masuk.</p>`;
      return;
    }

    // Kelompokkan laporan suara per Kecamatan
    const grupKecMap = new Map();
    rows.forEach(item => {
      const kecKey = item.desa?.kecamatan_id ? `kec-${item.desa.kecamatan_id}` : 'tanpa-kec';
      const namaKec = item.desa?.kecamatan?.nama_kecamatan || 'Wilayah Belum Masuk Kecamatan';
      if (!grupKecMap.has(kecKey)) {
        grupKecMap.set(kecKey, {
          key: kecKey,
          namaKec,
          items: [],
          totalSuara: 0
        });
      }
      const g = grupKecMap.get(kecKey);
      g.items.push(item);
      g.totalSuara += Number(item.suara_calon || 0);
    });

    const grupList = Array.from(grupKecMap.values()).sort((a, b) =>
      a.namaKec.localeCompare(b.namaKec)
    );

    listEl.innerHTML = grupList.map(g => {
      const isOpen = openedKecSuaraIds.has(g.key);
      return `
        <div class="suara-kec-group ${isOpen ? 'expanded' : ''}" id="suaraGrpCard-${g.key}">
          <div class="suara-kec-head">
            <div>
              <div class="suara-kec-title">📍 ${g.namaKec} (${g.items.length} TPS)</div>
              <div class="suara-kec-sub">Total Suara: <strong>${g.totalSuara.toLocaleString('id-ID')}</strong></div>
            </div>
            <button type="button" class="btn-rincian-suara ${isOpen ? 'active' : ''}" data-toggle-suara-kec="${g.key}">
              ${isOpen ? 'Tutup Rincian ▴' : 'Rincian ▾'}
            </button>
          </div>
          <div class="suara-kec-body ${isOpen ? 'open' : ''}" id="suaraGrpBody-${g.key}">
            ${g.items.map(renderKartuSuara).join('')}
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-toggle-suara-kec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = String(btn.dataset.toggleSuaraKec);
        const bodyEl = document.getElementById(`suaraGrpBody-${key}`);
        const cardEl = document.getElementById(`suaraGrpCard-${key}`);
        if (!bodyEl) return;

        const akanBuka = !bodyEl.classList.contains('open');
        bodyEl.classList.toggle('open', akanBuka);
        if (cardEl) cardEl.classList.toggle('expanded', akanBuka);
        btn.classList.toggle('active', akanBuka);
        btn.textContent = akanBuka ? 'Tutup Rincian ▴' : 'Rincian ▾';

        if (akanBuka) openedKecSuaraIds.add(key);
        else openedKecSuaraIds.delete(key);
      });
    });

    if (canManage) {
      listEl.querySelectorAll('.btn-edit-suara').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (isSuper) {
            desaEl.value = btn.dataset.desa;
            isiDropdownTps();
          }
          tpsEl.value = btn.dataset.tps;
          if (btn.dataset.kec) openedKecSuaraIds.add(`kec-${btn.dataset.kec}`);
          await isiFormJikaSudahAda();
          bukaModalSuara();
        });
      });

      listEl.querySelectorAll('.btn-toggle-kunci').forEach(btn => {
        btn.addEventListener('click', async () => {
          const tpsId = parseInt(btn.dataset.tps, 10);
          const kunciBaru = btn.dataset.locked !== 'true';
          const { error: upErr } = await supabase
            .from('suara_tps')
            .update({ terkunci: kunciBaru, updated_at: new Date().toISOString() })
            .eq('tps_id', tpsId);

          if (upErr) return showMsg(`Gagal mengubah status kunci: ${upErr.message}`, true);

          if (btn.dataset.kec) openedKecSuaraIds.add(`kec-${btn.dataset.kec}`);

          showMsg(kunciBaru
            ? 'Laporan suara TPS berhasil dikunci kembali.'
            : 'Kunci dibuka! Saksi sekarang dapat memperbaiki dan mengirim ulang suara TPS ini.');

          await isiFormJikaSudahAda();
          await muatLaporanSuara();
        });
      });
    }
  }

  document.getElementById('formSuara').addEventListener('submit', async (e) => {
    e.preventDefault();
    const desa_id = isSuper ? parseInt(desaEl.value, 10) : profil.desa_id;
    const tps_id = isSaksi ? profil.tps_id : parseInt(tpsEl.value, 10);
    const suara_calon = parseInt(inputCalon.value, 10) || 0;
    const suara_tidak_sah = parseInt(inputTidakSah.value, 10) || 0;
    const catatan = inputCatatan.value.trim();

    if (!desa_id || !tps_id) {
      return showMsg('Pilih Desa dan Nomor TPS terlebih dahulu.', true);
    }

    if (isSaksi) {
      if (existingRecord && existingRecord.terkunci !== false) {
        return showMsg('Data suara sudah terkunci. Hubungi Admin Desa untuk melakukan koreksi.', true);
      }
      const nomorTpsText = tpsEl.options[tpsEl.selectedIndex]?.text || '';
      const yakin = confirm(
        `Konfirmasi Kirim Suara (${nomorTpsText}):\n\n` +
        `• Suara Calon: ${suara_calon.toLocaleString('id-ID')}\n` +
        `• Suara Tidak Sah: ${suara_tidak_sah.toLocaleString('id-ID')}\n\n` +
        `Pastikan angka sudah sesuai C1 Plano. Setelah dikirim, formulir akan otomatis DIKUNCI.`
      );
      if (!yakin) return;
    }

    btnSimpan.disabled = true;
    btnSimpan.textContent = 'Menyimpan & mengunci...';

    let error;
    if (existingRecord) {
      const res = await supabase
        .from('suara_tps')
        .update({
          suara_calon,
          suara_tidak_sah,
          catatan,
          terkunci: true,
          updated_at: new Date().toISOString()
        })
        .eq('tps_id', tps_id);
      error = res.error;
    } else {
      const res = await supabase
        .from('suara_tps')
        .insert({
          tps_id,
          desa_id,
          suara_calon,
          suara_tidak_sah,
          catatan,
          saksi_id: profil.id,
          terkunci: true
        });
      error = res.error;
    }

    btnSimpan.disabled = false;

    if (error) {
      btnSimpan.textContent = 'Kirim Hasil Suara TPS';
      tutupModalSuara();
      return showMsg(`Gagal menyimpan suara: ${error.message}`, true);
    }

    const desaObj = daftarDesa.find(d => d.id === desa_id);
    if (desaObj?.kecamatan_id) openedKecSuaraIds.add(`kec-${desaObj.kecamatan_id}`);

    tutupModalSuara();
    showMsg(`Hasil suara TPS berhasil disimpan (${suara_calon.toLocaleString('id-ID')} suara) dan otomatis dikunci.`);
    await isiFormJikaSudahAda();
    await muatLaporanSuara();
  });

  if (filterDesaEl) {
    filterDesaEl.addEventListener('change', muatLaporanSuara);
  }

  await muatLaporanSuara();
}
