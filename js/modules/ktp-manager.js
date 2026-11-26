import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';

  container.innerHTML = `
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
        ${isSuper ? `<select id="filterDesaKtp"><option value="">Semua Desa</option></select>` : '<div></div>'}
      </div>

      <div id="listKtp">Memuat data KTP...</div>
    </div>
  `;

  const msgEl = document.getElementById('msgKtp');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  let daftarDesa = [];
  const desaEl = document.getElementById('ktpDesa');
  const tpsEl = document.getElementById('ktpTps');
  const filterDesaEl = document.getElementById('filterDesaKtp');

  function isiDropdownTps() {
    const desaId = parseInt(desaEl.value, 10);
    const desa = daftarDesa.find(d => d.id === desaId);
    const listTps = (desa?.tps || []).sort((a, b) => a.nomor_tps.localeCompare(b.nomor_tps));
    tpsEl.innerHTML = '<option value="">-- Pilih TPS (Opsional) --</option>' +
      listTps.map(t => `<option value="${t.id}">TPS ${t.nomor_tps}</option>`).join('');
  }

  // Muat daftar desa & TPS
  const { data: dDesa } = await supabase
    .from('desa')
    .select('id, nama_desa, tps(id, nomor_tps)')
    .order('nama_desa', { ascending: true });

  daftarDesa = dDesa || [];
  desaEl.innerHTML = daftarDesa.length > 0
    ? daftarDesa.map(d => `<option value="${d.id}" ${d.id === profil.desa_id ? 'selected' : ''}>${d.nama_desa}</option>`).join('')
    : '<option value="">-- Belum ada data desa --</option>';

  if (filterDesaEl) {
    filterDesaEl.innerHTML = '<option value="">Semua Desa</option>' +
      daftarDesa.map(d => `<option value="${d.id}">${d.nama_desa}</option>`).join('');
  }

  isiDropdownTps();
  desaEl.addEventListener('change', isiDropdownTps);

  // Fungsi muat data KTP (maksimal 50 baris terbaru agar HP tetap ringan)
  async function muatKtp() {
    const keyword = document.getElementById('cariKtp').value.trim();
    const filterDesa = filterDesaEl ? filterDesaEl.value : '';
    const listEl = document.getElementById('listKtp');

    let query = supabase
      .from('data_ktp')
      .select('id, nik, nama, alamat, created_at, desa(nama_desa), tps(nomor_tps)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50);

    if (filterDesa) {
      query = query.eq('desa_id', parseInt(filterDesa, 10));
    }
    if (keyword) {
      query = query.or(`nik.ilike.%${keyword}%,nama.ilike.%${keyword}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      listEl.innerHTML = `<p style="color:#dc2626; font-size:13px;">Gagal memuat: ${error.message}</p>`;
      return;
    }

    document.getElementById('totalKtpCount').textContent = Number(count || 0).toLocaleString('id-ID');

    if (!data || data.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada data KTP yang sesuai.</p>`;
      return;
    }

    const bisaHapus = profil.role === 'super_admin' || profil.role === 'pengepul';

    listEl.innerHTML = data.map(item => `
      <div class="list-item">
        <div>
          <div style="font-weight:700; font-size:14px;">${item.nama}</div>
          <div style="font-size:12px; font-family:monospace; color:#1e3a8a;">NIK: ${item.nik}</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">
            ${item.desa?.nama_desa || '-'}${item.tps?.nomor_tps ? ' • TPS ' + item.tps.nomor_tps : ''}
            ${item.alamat ? ' • ' + item.alamat : ''}
          </div>
        </div>
        ${bisaHapus ? `<button class="btn-mini" style="color:#dc2626; border-color:#fecaca;" data-hapus="${item.id}" data-nama="${item.nama}">Hapus</button>` : ''}
      </div>
    `).join('');

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

    if (filterDesaEl && filterDesaEl.value) {
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
