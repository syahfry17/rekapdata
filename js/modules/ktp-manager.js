import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';
  const isAdminDesa = profil.role === 'admin_desa';
  const isPengepul = profil.role === 'pengepul';

  container.innerHTML = `
    <style>
      .modal-ktp-bg {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 999;
      }
      .modal-ktp-bg.open { display: flex; }
      .modal-ktp-box {
        width: 100%;
        max-width: 420px;
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
    </style>

    <div id="msgKtp" class="msg"></div>

    <div class="card">
      <h2>Input Data KTP Pendukung</h2>
      <form id="formKtp">
        <div class="form-grid">
          <div class="form-group">
            <label>NIK (Wajib 16 Digit Angka)</label>
            <input type="text" id="ktpNik" inputmode="numeric" pattern="[0-9]{16}" maxlength="16" placeholder="16 digit NIK sesuai KTP" required />
          </div>
          <div class="form-group">
            <label>Nama Lengkap Sesuai KTP</label>
            <input type="text" id="ktpNama" placeholder="Nama lengkap warga" required />
          </div>
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

        <button type="submit" class="btn-primary" id="btnSimpanKtp">Simpan Data KTP</button>
      </form>
    </div>

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

      ${isSuper ? `
        <div class="form-group" style="margin-bottom:10px;">
          <select id="filterDesaKtp"><option value="">Semua Desa</option></select>
        </div>
      ` : ''}

      <div id="listKtp">Memuat data KTP...</div>
    </div>

    <!-- POPUP EDIT DATA & TPS WARGA -->
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

          <button type="submit" class="btn-primary" id="btnUpdateKtp" style="margin-top:4px;">Simpan Perubahan</button>
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

  let daftarDesa = [];
  let cacheListKtp = [];

  const desaEl = document.getElementById('ktpDesa');
  const tpsEl = document.getElementById('ktpTps');
  const filterDesaEl = document.getElementById('filterDesaKtp');
  const filterTpsEl = document.getElementById('filterTpsKtp');

  const modalEdit = document.getElementById('modalEditKtp');
  const editDesaEl = document.getElementById('editKtpDesa');
  const editTpsEl = document.getElementById('editKtpTps');

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

  isiDropdownTps(desaEl, tpsEl);
  desaEl.addEventListener('change', () => isiDropdownTps(desaEl, tpsEl));
  editDesaEl.addEventListener('change', () => isiDropdownTps(editDesaEl, editTpsEl));

  // Tutup modal edit
  document.getElementById('closeModalEditKtp').addEventListener('click', () => modalEdit.classList.remove('open'));
  modalEdit.addEventListener('click', (e) => {
    if (e.target === modalEdit) modalEdit.classList.remove('open');
  });

  function bukaModalEdit(item) {
    document.getElementById('editKtpId').value = item.id;
    document.getElementById('editKtpNik').value = item.nik;
    document.getElementById('editKtpNama').value = item.nama;
    document.getElementById('editKtpAlamat').value = item.alamat || '';
    editDesaEl.value = item.desa_id;
    isiDropdownTps(editDesaEl, editTpsEl, item.tps_id || '');
    modalEdit.classList.add('open');
  }

  async function muatKtp() {
    const keyword = document.getElementById('cariKtp').value.trim();
    const filterDesa = filterDesaEl ? filterDesaEl.value : '';
    const statusTps = filterTpsEl.value;
    const listEl = document.getElementById('listKtp');

    let query = supabase
      .from('data_ktp')
      .select('id, nik, nama, alamat, desa_id, tps_id, created_at, desa(nama_desa), tps(nomor_tps)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50);

    if (!isSuper && profil.desa_id) {
      query = query.eq('desa_id', profil.desa_id);
    } else if (filterDesa) {
      query = query.eq('desa_id', parseInt(filterDesa, 10));
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

    const bisaKelola = isSuper || isAdminDesa || isPengepul;

    listEl.innerHTML = cacheListKtp.map((item, idx) => {
      const badgeTps = item.tps?.nomor_tps
        ? `<span class="badge" style="background:#d1fae5; color:#065f46;">TPS ${item.tps.nomor_tps}</span>`
        : `<span class="badge" style="background:#fef3c7; color:#92400e;">TPS Belum Diisi</span>`;

      return `
        <div class="list-item" style="align-items:flex-start;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="font-weight:700; font-size:14px;">${item.nama}</span>
              ${badgeTps}
            </div>
            <div style="font-size:12px; font-family:monospace; color:#1e3a8a; margin-top:2px;">NIK: ${item.nik}</div>
            <div style="font-size:12px; color:#64748b; margin-top:2px;">
              ${item.desa?.nama_desa || '-'}${item.alamat ? ' • ' + item.alamat : ''}
            </div>
          </div>
          ${bisaKelola ? `
            <div style="display:flex; flex-direction:column; gap:5px;">
              <button type="button" class="btn-mini" style="color:#1e3a8a; border-color:#bfdbfe;" data-edit-idx="${idx}">Edit</button>
              <button type="button" class="btn-mini" style="color:#dc2626; border-color:#fecaca;" data-hapus="${item.id}" data-nama="${item.nama}">Hapus</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

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
        showMsg(`Data ${btn.dataset.nama} berhasil dihapus.`);
        await muatKtp();
      });
    });
  }

  // Simpan perubahan dari modal Edit KTP
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

    modalEdit.classList.remove('open');
    showMsg(`Data KTP ${nama} berhasil diperbarui.`);
    await muatKtp();
  });

  // Filter hanya angka pada kolom NIK
  const nikInput = document.getElementById('ktpNik');
  nikInput.addEventListener('input', () => {
    nikInput.value = nikInput.value.replace(/\D/g, '').slice(0, 16);
  });

  // Simpan KTP baru
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
    nikInput.focus();
    showMsg(`Berhasil menyimpan KTP: ${nama} (${nik})`);
    await muatKtp();
  });

  // Pencarian & filter
  let timerCari;
  document.getElementById('cariKtp').addEventListener('input', () => {
    clearTimeout(timerCari);
    timerCari = setTimeout(muatKtp, 350);
  });
  filterTpsEl.addEventListener('change', muatKtp);
  if (filterDesaEl) filterDesaEl.addEventListener('change', muatKtp);

  // Export CSV
  document.getElementById('btnExportKtp').addEventListener('click', async () => {
    const btn = document.getElementById('btnExportKtp');
    btn.textContent = 'Menyiapkan...';

    let query = supabase
      .from('data_ktp')
      .select('nik, nama, alamat, created_at, desa(nama_desa), tps(nomor_tps)')
      .order('created_at', { ascending: false })
      .limit(15000);

    if (!isSuper && profil.desa_id) {
      query = query.eq('desa_id', profil.desa_id);
    } else if (filterDesaEl && filterDesaEl.value) {
      query = query.eq('desa_id', parseInt(filterDesaEl.value, 10));
    }

    const { data, error } = await query;
    btn.textContent = '⬇ Unduh CSV';

    if (error || !data || data.length === 0) {
      return showMsg('Tidak ada data untuk diunduh.', true);
    }

    const baris = [
      ['NIK', 'Nama Lengkap', 'Desa', 'TPS', 'Alamat', 'Waktu Input'].join(','),
      ...data.map(r => [
        `"${r.nik}"`,
        `"${(r.nama || '').replace(/"/g, '""')}"`,
        `"${r.desa?.nama_desa || ''}"`,
        `"${r.tps?.nomor_tps || ''}"`,
        `"${(r.alamat || '').replace(/"/g, '""')}"`,
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
