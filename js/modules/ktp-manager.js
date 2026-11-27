import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';
  const isAdminDesa = profil.role === 'admin_desa';
  const isPengepul = profil.role === 'pengepul';
  const canSeeUploader = isSuper || isAdminDesa;

  container.innerHTML = `
    <style>
      .btn-open-ktp {
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
      .btn-open-ktp:active {
        transform: scale(0.99);
      }

      .ktp-desa-group {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .ktp-desa-group.expanded {
        border-color: #60a5fa;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
      }
      .ktp-desa-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ktp-desa-title {
        font-size: 13px;
        font-weight: 800;
        color: #1e3a8a;
        text-transform: uppercase;
      }
      .ktp-desa-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
      .ktp-desa-body {
        display: none;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      }
      .ktp-desa-body.open {
        display: block;
      }
      .btn-rincian-ktp {
        padding: 5px 9px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 6px;
        border: 1px solid #bfdbfe;
        background: #eff6ff;
        color: #1e3a8a;
        cursor: pointer;
      }
      .btn-rincian-ktp.active {
        background: #1e3a8a;
        border-color: #1e3a8a;
        color: #ffffff;
      }

      /* Kartu warga dengan garis biru saat rincian desa dibuka */
      .ktp-warga-item {
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
      .ktp-warga-item:first-child {
        margin-top: 0;
      }
      .ktp-desa-body.open .ktp-warga-item {
        background: #ffffff;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14), 0 0 10px rgba(37, 99, 235, 0.16);
      }

      .uploader-tag {
        display: inline-block;
        margin-top: 5px;
        padding: 2px 8px;
        background: #eff6ff;
        border: 1px solid #dbeafe;
        color: #1e3a8a;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }

      /* Gaya Modal Pop-up KTP */
      .modal-ktp-bg {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 14px;
        z-index: 999;
      }
      .modal-ktp-bg.open { display: flex; }
      .modal-ktp-box {
        width: 100%;
        max-width: 430px;
        max-height: 88vh;
        overflow-y: auto;
        background: #ffffff;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.25);
        animation: popKtp 0.16s ease-out;
      }
      @keyframes popKtp {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .modal-ktp-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .modal-ktp-head h3 {
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
      }
      .modal-ktp-close {
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
      .ktp-btn-cancel {
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

    <div id="msgKtp" class="msg"></div>

    <button type="button" class="btn-open-ktp" id="openModalInputKtp">+ Input Data KTP Pendukung</button>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        <h2 style="margin:0;">Data Terkumpul (<span id="totalKtpCount">0</span>)</h2>
        <button type="button" class="btn-mini" id="btnExportKtp">⬇ Unduh CSV</button>
      </div>

      <div class="form-grid" style="margin-bottom:8px;">
        <input type="text" id="cariKtp" placeholder="Cari 16 digit NIK atau nama..." />
        <select id="filterTpsKtp">
          <option value="">Semua Status TPS</option>
          <option value="kosong">⚠️ Belum Ada TPS</option>
          <option value="ada">✅ Sudah Ada TPS</option>
        </select>
      </div>

      ${canSeeUploader ? `
        <div class="form-grid" style="margin-bottom:10px;">
          ${isSuper ? `<select id="filterDesaKtp"><option value="">Semua Desa</option></select>` : ''}
          <select id="filterPenginputKtp"><option value="">Semua Penginput</option></select>
        </div>
      ` : ''}

      <div id="listKtp">Memuat data KTP...</div>
    </div>

    <!-- POPUP 1: INPUT DATA KTP BARU -->
    <div class="modal-ktp-bg" id="modalInputKtp">
      <div class="modal-ktp-box">
        <div class="modal-ktp-head">
          <h3>Input Data KTP Pendukung</h3>
          <button type="button" class="modal-ktp-close" id="closeModalInputKtp">×</button>
        </div>
        <form id="formKtp">
          <div class="form-group">
            <label>NIK (Wajib 16 Digit Angka)</label>
            <input type="text" id="ktpNik" inputmode="numeric" pattern="[0-9]{16}" maxlength="16" placeholder="16 digit NIK sesuai KTP" required />
          </div>

          <div class="form-group">
            <label>Nama Lengkap Sesuai KTP</label>
            <input type="text" id="ktpNama" placeholder="Nama lengkap warga" required />
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Desa / Kelurahan</label>
              <select id="ktpDesa" required ${!isSuper ? 'disabled' : ''}></select>
            </div>
            <div class="form-group">
              <label>TPS (Opsional)</label>
              <select id="ktpTps">
                <option value="">-- Pilih TPS --</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Alamat / Dusun / RT-RW</label>
            <input type="text" id="ktpAlamat" placeholder="Contoh: Dusun II RT 03" />
          </div>

          <button type="button" class="ktp-btn-cancel" id="batalModalInputKtp">Batal</button>
          <button type="submit" class="btn-primary" id="btnSimpanKtp">Simpan Data KTP</button>
        </form>
      </div>
    </div>

    <!-- POPUP 2: EDIT DATA & TPS WARGA -->
    <div class="modal-ktp-bg" id="modalEditKtp">
      <div class="modal-ktp-box">
        <div class="modal-ktp-head">
          <h3>Lengkapi / Edit Data KTP</h3>
          <button type="button" class="modal-ktp-close" id="closeModalEditKtp">×</button>
        </div>
        <form id="formEditKtp">
          <input type="hidden" id="editKtpId" />

          <div class="form-group">
            <label>NIK (Terkunci Anti-Ganda)</label>
            <input type="text" id="editKtpNik" disabled style="background:#f1f5f9; font-family:monospace; font-weight:700;" />
          </div>

          <div class="form-group">
            <label>Nama Lengkap Sesuai KTP</label>
            <input type="text" id="editKtpNama" required />
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Desa / Kelurahan</label>
              <select id="editKtpDesa" ${!isSuper ? 'disabled' : ''}></select>
            </div>
            <div class="form-group">
              <label>Nomor TPS</label>
              <select id="editKtpTps">
                <option value="">-- Belum Diketahui --</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Alamat / Dusun / RT-RW</label>
            <input type="text" id="editKtpAlamat" placeholder="Contoh: Dusun II RT 03" />
          </div>

          <button type="button" class="ktp-btn-cancel" id="batalModalEditKtp">Batal</button>
          <button type="submit" class="btn-primary" id="btnUpdateKtp">Simpan Perubahan</button>
        </form>
      </div>
    </div>
  `;

  const msgEl = document.getElementById('msgKtp');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Menyimpan ID kelompok desa yang sedang dibuka rinciannya
  const openedDesaKtpIds = new Set();

  let daftarDesa = [];
  let cacheListKtp = [];

  const desaEl = document.getElementById('ktpDesa');
  const tpsEl = document.getElementById('ktpTps');
  const filterDesaEl = document.getElementById('filterDesaKtp');
  const filterPenginputEl = document.getElementById('filterPenginputKtp');
  const filterTpsEl = document.getElementById('filterTpsKtp');

  const modalInput = document.getElementById('modalInputKtp');
  const modalEdit = document.getElementById('modalEditKtp');
  const editDesaEl = document.getElementById('editKtpDesa');
  const editTpsEl = document.getElementById('editKtpTps');
  const nikInput = document.getElementById('ktpNik');

  function bukaModalInput() {
    modalInput.classList.add('open');
    nikInput.focus();
  }
  function tutupModalInput() {
    modalInput.classList.remove('open');
  }

  document.getElementById('openModalInputKtp').addEventListener('click', bukaModalInput);
  document.getElementById('closeModalInputKtp').addEventListener('click', tutupModalInput);
  document.getElementById('batalModalInputKtp').addEventListener('click', tutupModalInput);
  modalInput.addEventListener('click', (e) => {
    if (e.target === modalInput) tutupModalInput();
  });

  function tutupModalEdit() {
    modalEdit.classList.remove('open');
  }
  document.getElementById('closeModalEditKtp').addEventListener('click', tutupModalEdit);
  document.getElementById('batalModalEditKtp').addEventListener('click', tutupModalEdit);
  modalEdit.addEventListener('click', (e) => {
    if (e.target === modalEdit) tutupModalEdit();
  });

  function isiDropdownTps(selectDesa, selectTps, selectedTpsId = '') {
    const desaId = parseInt(selectDesa.value, 10);
    const desa = daftarDesa.find(d => d.id === desaId);
    const listTps = (desa?.tps || []).sort((a, b) => a.nomor_tps.localeCompare(b.nomor_tps));
    selectTps.innerHTML = '<option value="">-- Belum Diketahui (Opsional) --</option>' +
      listTps.map(t => `<option value="${t.id}" ${String(t.id) === String(selectedTpsId) ? 'selected' : ''}>TPS ${t.nomor_tps}</option>`).join('');
  }

  // Muat daftar desa & TPS
  let queryDesa = supabase
    .from('desa')
    .select('id, nama_desa, kecamatan(nama_kecamatan), tps(id, nomor_tps)')
    .order('nama_desa', { ascending: true });

  if (!isSuper && profil.desa_id) {
    queryDesa = queryDesa.eq('id', profil.desa_id);
  }

  const { data: dDesa } = await queryDesa;
  daftarDesa = dDesa || [];

  const opsiDesaHtml = daftarDesa.length > 0
    ? daftarDesa.map(d => {
        const namaKec = (isSuper && d.kecamatan?.nama_kecamatan) ? `${d.kecamatan.nama_kecamatan} — ` : '';
        return `<option value="${d.id}" ${d.id === profil.desa_id ? 'selected' : ''}>${namaKec}${d.nama_desa}</option>`;
      }).join('')
    : '<option value="">-- Belum ada data desa --</option>';

  desaEl.innerHTML = opsiDesaHtml;
  editDesaEl.innerHTML = opsiDesaHtml;

  if (filterDesaEl) {
    filterDesaEl.innerHTML = '<option value="">Semua Desa</option>' +
      daftarDesa.map(d => {
        const namaKec = d.kecamatan?.nama_kecamatan ? `${d.kecamatan.nama_kecamatan} — ` : '';
        return `<option value="${d.id}">${namaKec}${d.nama_desa}</option>`;
      }).join('');
  }

  if (filterPenginputEl) {
    let qUsers = supabase
      .from('users_tim')
      .select('id, nama_lengkap, role, email')
      .order('nama_lengkap', { ascending: true });

    if (isAdminDesa && profil.desa_id) {
      qUsers = qUsers.eq('desa_id', profil.desa_id);
    }

    const { data: dUsers } = await qUsers;
    filterPenginputEl.innerHTML = '<option value="">Semua Penginput</option>' +
      (dUsers || []).map(u => {
        const infoEmail = u.email ? ` (${u.email})` : '';
        return `<option value="${u.id}">${u.nama_lengkap}${infoEmail}</option>`;
      }).join('');
  }

  isiDropdownTps(desaEl, tpsEl);
  desaEl.addEventListener('change', () => isiDropdownTps(desaEl, tpsEl));
  editDesaEl.addEventListener('change', () => isiDropdownTps(editDesaEl, editTpsEl));

  function bukaModalEdit(item) {
    document.getElementById('editKtpId').value = item.id;
    document.getElementById('editKtpNik').value = item.nik;
    document.getElementById('editKtpNama').value = item.nama;
    document.getElementById('editKtpAlamat').value = item.alamat || '';
    editDesaEl.value = item.desa_id;
    isiDropdownTps(editDesaEl, editTpsEl, item.tps_id || '');
    modalEdit.classList.add('open');
  }

  function renderKartuWarga(item, idx) {
    const bisaKelola = isSuper || isAdminDesa || isPengepul;
    const badgeTps = item.tps?.nomor_tps
      ? `<span class="badge" style="background:#d1fae5; color:#065f46;">TPS ${item.tps.nomor_tps}</span>`
      : `<span class="badge" style="background:#fef3c7; color:#92400e;">TPS Belum Diisi</span>`;

    const namaPenginput = item.users_tim?.nama_lengkap || 'Tidak diketahui';
    const emailPenginput = item.users_tim?.email ? ` (${item.users_tim.email})` : '';
    const waktuInput = new Date(item.created_at).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    const infoPenginputHtml = canSeeUploader
      ? `<div class="uploader-tag">👤 Diinput oleh: ${namaPenginput}${emailPenginput} • ${waktuInput}</div>`
      : '';

    return `
      <div class="ktp-warga-item">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-weight:700; font-size:14px;">${item.nama}</span>
            ${badgeTps}
          </div>
          <div style="font-size:12px; font-family:monospace; color:#1e3a8a; margin-top:2px;">NIK: ${item.nik}</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">
            ${item.desa?.nama_desa || '-'}${item.alamat ? ' • ' + item.alamat : ''}
          </div>
          ${infoPenginputHtml}
        </div>
        ${bisaKelola ? `
          <div style="display:flex; flex-direction:column; gap:5px; flex-shrink:0;">
            <button type="button" class="btn-mini" style="color:#1e3a8a; border-color:#bfdbfe;" data-edit-idx="${idx}">Edit</button>
            <button type="button" class="btn-mini" style="color:#dc2626; border-color:#fecaca;" data-hapus="${item.id}" data-nama="${item.nama}" data-desa-id="${item.desa_id}">Hapus</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  async function muatKtp() {
    const keyword = document.getElementById('cariKtp').value.trim();
    const filterDesa = filterDesaEl ? filterDesaEl.value : '';
    const filterPenginput = filterPenginputEl ? filterPenginputEl.value : '';
    const statusTps = filterTpsEl.value;
    const listEl = document.getElementById('listKtp');

    let query = supabase
      .from('data_ktp')
      .select('id, nik, nama, alamat, desa_id, tps_id, pengepul_id, created_at, desa(nama_desa, kecamatan(nama_kecamatan)), tps(nomor_tps), users_tim(nama_lengkap, role, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100);

    if (!isSuper && profil.desa_id) {
      query = query.eq('desa_id', profil.desa_id);
    } else if (filterDesa) {
      query = query.eq('desa_id', parseInt(filterDesa, 10));
    }

    if (filterPenginput) {
      query = query.eq('pengepul_id', filterPenginput);
    }

    if (statusTps === 'kosong') {
      query = query.is('tps_id', null);
    } else if (statusTps === 'ada') {
      query = query.not('tps_id', 'is', null);
    }

    if (keyword) {
      query = query.or(`nik.ilike.%${keyword}%,nama.ilike.%${keyword}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      listEl.innerHTML = `<p style="color:#dc2626; font-size:13px;">Gagal memuat: ${error.message}</p>`;
      return;
    }

    cacheListKtp = data || [];
    document.getElementById('totalKtpCount').textContent = Number(count || 0).toLocaleString('id-ID');

    if (cacheListKtp.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada data KTP yang sesuai.</p>`;
      return;
    }

    // Kelompokkan KTP berdasarkan Desa
    const grupDesaMap = new Map();
    cacheListKtp.forEach((item, idx) => {
      const key = String(item.desa_id || 'lainnya');
      const namaDesa = item.desa?.nama_desa || 'Desa Lainnya';
      const namaKec = item.desa?.kecamatan?.nama_kecamatan || '';
      if (!grupDesaMap.has(key)) {
        grupDesaMap.set(key, {
          key,
          namaDesa,
          namaKec,
          items: []
        });
      }
      grupDesaMap.get(key).items.push({ item, idx });
    });

    const grupList = Array.from(grupDesaMap.values()).sort((a, b) =>
      a.namaDesa.localeCompare(b.namaDesa)
    );

    listEl.innerHTML = grupList.map(g => {
      const isOpen = openedDesaKtpIds.has(g.key);
      const tpsTerisi = g.items.filter(x => x.item.tps?.nomor_tps).length;
      const subKec = (isSuper && g.namaKec) ? `${g.namaKec} • ` : '';

      return `
        <div class="ktp-desa-group ${isOpen ? 'expanded' : ''}" id="ktpGrpCard-${g.key}">
          <div class="ktp-desa-head">
            <div>
              <div class="ktp-desa-title">🏘️ ${g.namaDesa} (${g.items.length} KTP)</div>
              <div class="ktp-desa-sub">${subKec}${tpsTerisi} sudah ada TPS</div>
            </div>
            <button type="button" class="btn-rincian-ktp ${isOpen ? 'active' : ''}" data-toggle-ktp-desa="${g.key}">
              ${isOpen ? 'Tutup Rincian ▴' : 'Rincian ▾'}
            </button>
          </div>
          <div class="ktp-desa-body ${isOpen ? 'open' : ''}" id="ktpGrpBody-${g.key}">
            ${g.items.map(({ item, idx }) => renderKartuWarga(item, idx)).join('')}
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-toggle-ktp-desa]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = String(btn.dataset.toggleKtpDesa);
        const bodyEl = document.getElementById(`ktpGrpBody-${key}`);
        const cardEl = document.getElementById(`ktpGrpCard-${key}`);
        if (!bodyEl) return;

        const akanBuka = !bodyEl.classList.contains('open');
        bodyEl.classList.toggle('open', akanBuka);
        if (cardEl) cardEl.classList.toggle('expanded', akanBuka);
        btn.classList.toggle('active', akanBuka);
        btn.textContent = akanBuka ? 'Tutup Rincian ▴' : 'Rincian ▾';

        if (akanBuka) openedDesaKtpIds.add(key);
        else openedDesaKtpIds.delete(key);
      });
    });

    listEl.querySelectorAll('[data-edit-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = cacheListKtp[parseInt(btn.dataset.editIdx, 10)];
        if (item) bukaModalEdit(item);
      });
    });

    listEl.querySelectorAll('[data-hapus]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Hapus data KTP atas nama ${btn.dataset.nama}?`)) return;
        const { error: delErr } = await supabase.from('data_ktp').delete().eq('id', btn.dataset.hapus);
        if (delErr) return showMsg(`Gagal menghapus: ${delErr.message}`, true);
        if (btn.dataset.desaId) openedDesaKtpIds.add(String(btn.dataset.desaId));
        showMsg(`Data ${btn.dataset.nama} berhasil dihapus.`);
        await muatKtp();
      });
    });
  }

  document.getElementById('formEditKtp').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnUpdateKtp');
    const id = parseInt(document.getElementById('editKtpId').value, 10);
    const nama = document.getElementById('editKtpNama').value.trim().toUpperCase();
    const desa_id = isSuper ? parseInt(editDesaEl.value, 10) : profil.desa_id;
    const tpsVal = editTpsEl.value;
    const tps_id = tpsVal ? parseInt(tpsVal, 10) : null;
    const alamat = document.getElementById('editKtpAlamat').value.trim();

    btn.disabled = true;
    btn.textContent = 'Menyimpan perubahan...';

    const { error } = await supabase
      .from('data_ktp')
      .update({ nama, desa_id, tps_id, alamat })
      .eq('id', id);

    btn.disabled = false;
    btn.textContent = 'Simpan Perubahan';

    if (error) {
      return showMsg(`Gagal memperbarui data: ${error.message}`, true);
    }

    openedDesaKtpIds.add(String(desa_id));
    tutupModalEdit();
    showMsg(`Data KTP ${nama} berhasil diperbarui.`);
    await muatKtp();
  });

  nikInput.addEventListener('input', () => {
    nikInput.value = nikInput.value.replace(/\D/g, '').slice(0, 16);
  });

  document.getElementById('formKtp').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSimpanKtp');
    const nik = nikInput.value.trim();
    const nama = document.getElementById('ktpNama').value.trim().toUpperCase();
    const desa_id = isSuper ? parseInt(desaEl.value, 10) : profil.desa_id;
    const tpsVal = tpsEl.value;
    const tps_id = tpsVal ? parseInt(tpsVal, 10) : null;
    const alamat = document.getElementById('ktpAlamat').value.trim();

    if (nik.length !== 16) {
      return showMsg('NIK harus pas 16 digit angka.', true);
    }
    if (!desa_id) {
      return showMsg('Desa belum dipilih.', true);
    }

    btn.disabled = true;
    btn.textContent = 'Memeriksa & menyimpan...';

    const { error } = await supabase.from('data_ktp').insert({
      nik,
      nama,
      desa_id,
      tps_id,
      alamat,
      pengepul_id: profil.id
    });

    btn.disabled = false;
    btn.textContent = 'Simpan Data KTP';

    if (error) {
      if (error.code === '23505') {
        return showMsg(`DITOLAK: NIK ${nik} sudah terdaftar di sistem (data ganda)!`, true);
      }
      return showMsg(`Gagal menyimpan: ${error.message}`, true);
    }

    nikInput.value = '';
    document.getElementById('ktpNama').value = '';
    document.getElementById('ktpAlamat').value = '';
    openedDesaKtpIds.add(String(desa_id));
    tutupModalInput();
    showMsg(`Berhasil menyimpan KTP: ${nama} (${nik})`);
    await muatKtp();
  });

  let timerCari;
  document.getElementById('cariKtp').addEventListener('input', () => {
    clearTimeout(timerCari);
    timerCari = setTimeout(muatKtp, 350);
  });
  filterTpsEl.addEventListener('change', muatKtp);
  if (filterDesaEl) filterDesaEl.addEventListener('change', muatKtp);
  if (filterPenginputEl) filterPenginputEl.addEventListener('change', muatKtp);

  document.getElementById('btnExportKtp').addEventListener('click', async () => {
    const btn = document.getElementById('btnExportKtp');
    btn.textContent = 'Menyiapkan...';

    let query = supabase
      .from('data_ktp')
      .select('nik, nama, alamat, created_at, desa(nama_desa), tps(nomor_tps), users_tim(nama_lengkap, email)')
      .order('created_at', { ascending: false })
      .limit(15000);

    if (!isSuper && profil.desa_id) {
      query = query.eq('desa_id', profil.desa_id);
    } else if (filterDesaEl && filterDesaEl.value) {
      query = query.eq('desa_id', parseInt(filterDesaEl.value, 10));
    }

    if (filterPenginputEl && filterPenginputEl.value) {
      query = query.eq('pengepul_id', filterPenginputEl.value);
    }

    const { data, error } = await query;
    btn.textContent = '⬇ Unduh CSV';

    if (error || !data || data.length === 0) {
      return showMsg('Tidak ada data untuk diunduh.', true);
    }

    const baris = [
      ['NIK', 'Nama Lengkap', 'Desa', 'TPS', 'Alamat', 'Diinput Oleh', 'Email Penginput', 'Waktu Input'].join(','),
      ...data.map(r => [
        `"${r.nik}"`,
        `"${(r.nama || '').replace(/"/g, '""')}"`,
        `"${r.desa?.nama_desa || ''}"`,
        `"${r.tps?.nomor_tps || ''}"`,
        `"${(r.alamat || '').replace(/"/g, '""')}"`,
        `"${(r.users_tim?.nama_lengkap || '').replace(/"/g, '""')}"`,
        `"${r.users_tim?.email || ''}"`,
        `"${new Date(r.created_at).toLocaleString('id-ID')}"`
      ].join(','))
    ];

    const blob = new Blob([baris.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-ktp-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  await muatKtp();
}
