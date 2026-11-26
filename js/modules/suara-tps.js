import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';
  const isAdminDesa = profil.role === 'admin_desa';
  const isSaksi = profil.role === 'saksi';

  if (isSaksi && (!profil.desa_id || !profil.tps_id)) {
    container.innerHTML = `
      <div class="card">
        <h2>Akun Saksi Belum Terhubung ke TPS</h2>
        <p style="font-size:14px; color:#64748b;">
          Akun Anda belum diatur lokasi Desa dan Nomor TPS-nya. Silakan hubungi Super Admin untuk melengkapi penugasan TPS Anda.
        </p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div id="msgSuara" class="msg"></div>

    <div class="card">
      <h2>Input Hasil Suara TPS (Model C1)</h2>
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

        <button type="submit" class="btn-primary" id="btnSimpanSuara">Kirim Hasil Suara TPS</button>
      </form>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        <h2 style="margin:0;">Laporan Suara Masuk (<span id="jumlahTpsMasuk">0</span> TPS)</h2>
        ${isSuper ? `<select id="filterDesaSuara" style="width:auto; padding:6px 10px; font-size:12px;"><option value="">Semua Desa</option></select>` : ''}
      </div>
      <div id="listSuara">Memuat laporan suara...</div>
    </div>
  `;

  const msgEl = document.getElementById('msgSuara');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  let daftarDesa = [];
  const desaEl = document.getElementById('suaraDesa');
  const tpsEl = document.getElementById('suaraTps');
  const filterDesaEl = document.getElementById('filterDesaSuara');

  function isiDropdownTps() {
    const desaId = parseInt(desaEl.value, 10);
    const desa = daftarDesa.find(d => d.id === desaId);
    const listTps = (desa?.tps || []).sort((a, b) => a.nomor_tps.localeCompare(b.nomor_tps));

    tpsEl.innerHTML = listTps.length > 0
      ? listTps.map(t => `<option value="${t.id}" ${t.id === profil.tps_id ? 'selected' : ''}>TPS ${t.nomor_tps}</option>`).join('')
      : '<option value="">-- Belum ada TPS --</option>';

    isiFormJikaSudahAda();
  }

  async function isiFormJikaSudahAda() {
    const tpsId = parseInt(tpsEl.value, 10);
    if (!tpsId) return;

    const { data } = await supabase
      .from('suara_tps')
      .select('suara_calon, suara_tidak_sah, catatan')
      .eq('tps_id', tpsId)
      .maybeSingle();

    if (data) {
      document.getElementById('suaraCalon').value = data.suara_calon ?? 0;
      document.getElementById('suaraTidakSah').value = data.suara_tidak_sah ?? 0;
      document.getElementById('suaraCatatan').value = data.catatan || '';
    } else {
      document.getElementById('suaraCalon').value = '';
      document.getElementById('suaraTidakSah').value = '';
      document.getElementById('suaraCatatan').value = '';
    }
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
  tpsEl.addEventListener('change', isiFormJikaSudahAda);

  async function muatLaporanSuara() {
    const listEl = document.getElementById('listSuara');
    let query = supabase
      .from('suara_tps')
      .select('id, suara_calon, suara_tidak_sah, catatan, created_at, desa(nama_desa), tps(nomor_tps), users_tim(nama_lengkap)')
      .order('created_at', { ascending: false });

    if (filterDesaEl && filterDesaEl.value) {
      query = query.eq('desa_id', parseInt(filterDesaEl.value, 10));
    }

    const { data, error } = await query;
    if (error) {
      listEl.innerHTML = `<p style="color:#dc2626; font-size:13px;">Gagal memuat: ${error.message}</p>`;
      return;
    }

    document.getElementById('jumlahTpsMasuk').textContent = (data || []).length;

    if (!data || data.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada laporan suara TPS yang masuk.</p>`;
      return;
    }

    listEl.innerHTML = data.map(item => `
      <div class="list-item" style="flex-direction:column; align-items:flex-start;">
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
          <strong>${item.desa?.nama_desa || '-'} • TPS ${item.tps?.nomor_tps || '-'}</strong>
          <span class="badge" style="background:#d1fae5; color:#065f46; font-size:12px;">
            ${Number(item.suara_calon || 0).toLocaleString('id-ID')} Suara
          </span>
        </div>
        <div style="font-size:12px; color:#475569; margin-top:4px;">
          Tidak Sah: <strong>${Number(item.suara_tidak_sah || 0).toLocaleString('id-ID')}</strong>
          ${item.users_tim?.nama_lengkap ? ' • Saksi: ' + item.users_tim.nama_lengkap : ''}
        </div>
        ${item.catatan ? `<div style="font-size:12px; color:#64748b; margin-top:2px;">Catatan: ${item.catatan}</div>` : ''}
      </div>
    `).join('');
  }

  document.getElementById('formSuara').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSimpanSuara');
    const desa_id = isSuper ? parseInt(desaEl.value, 10) : profil.desa_id;
    const tps_id = isSaksi ? profil.tps_id : parseInt(tpsEl.value, 10);
    const suara_calon = parseInt(document.getElementById('suaraCalon').value, 10) || 0;
    const suara_tidak_sah = parseInt(document.getElementById('suaraTidakSah').value, 10) || 0;
    const catatan = document.getElementById('suaraCatatan').value.trim();

    if (!desa_id || !tps_id) {
      return showMsg('Pilih Desa dan Nomor TPS terlebih dahulu.', true);
    }

    btn.disabled = true;
    btn.textContent = 'Mengirim suara...';

    const { error } = await supabase
      .from('suara_tps')
      .upsert({
        tps_id,
        desa_id,
        suara_calon,
        suara_tidak_sah,
        catatan,
        saksi_id: profil.id
      }, { onConflict: 'tps_id' });

    btn.disabled = false;
    btn.textContent = 'Kirim Hasil Suara TPS';

    if (error) {
      return showMsg(`Gagal menyimpan suara: ${error.message}`, true);
    }

    showMsg(`Hasil suara TPS berhasil disimpan (${suara_calon.toLocaleString('id-ID')} suara)!`);
    await muatLaporanSuara();
  });

  if (filterDesaEl) {
    filterDesaEl.addEventListener('change', muatLaporanSuara);
  }

  await muatLaporanSuara();
}
