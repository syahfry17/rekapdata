import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';

  container.innerHTML = `
    <div id="msgWilayah" class="msg"></div>

    ${isSuper ? `
    <div class="card">
      <h2>Tambah Desa Baru</h2>
      <form id="formDesa">
        <div class="form-grid">
          <div class="form-group">
            <label>Nama Desa / Kelurahan</label>
            <input type="text" id="namaDesa" placeholder="Contoh: Kampung Padang" required />
          </div>
          <div class="form-group">
            <label>Target KTP Desa</label>
            <input type="number" id="targetKtp" placeholder="Contoh: 2000" min="0" required />
          </div>
        </div>
        <button type="submit" class="btn-primary">Simpan Desa</button>
      </form>
    </div>
    ` : ''}

    <div class="card">
      <h2>Tambah TPS</h2>
      <form id="formTps">
        <div class="form-grid">
          <div class="form-group">
            <label>Pilih Desa</label>
            <select id="pilihDesaTps" required ${!isSuper ? 'disabled' : ''}></select>
          </div>
          <div class="form-group">
            <label>Nomor TPS</label>
            <input type="text" id="nomorTps" placeholder="Contoh: 001" required />
          </div>
        </div>
        <button type="submit" class="btn-primary">Simpan TPS</button>
      </form>
    </div>

    <div class="card">
      <h2>Daftar Desa & TPS Terdaftar</h2>
      <div id="listWilayah">Memuat data...</div>
    </div>
  `;

  const msgEl = document.getElementById('msgWilayah');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
  };

  async function muatData() {
    const { data: daftarDesa, error } = await supabase
      .from('desa')
      .select('id, nama_desa, target_ktp, tps(id, nomor_tps)')
      .order('nama_desa', { ascending: true });

    if (error) {
      showMsg(`Gagal memuat data wilayah: ${error.message}`, true);
      return;
    }

    const selectDesa = document.getElementById('pilihDesaTps');
    selectDesa.innerHTML = (daftarDesa || []).length > 0
      ? daftarDesa.map(d => `<option value="${d.id}" ${d.id === profil.desa_id ? 'selected' : ''}>${d.nama_desa}</option>`).join('')
      : '<option value="">-- Tambahkan desa dulu --</option>';

    const listEl = document.getElementById('listWilayah');
    if (!daftarDesa || daftarDesa.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada desa. Tambahkan desa terlebih dahulu di atas.</p>`;
      return;
    }

    listEl.innerHTML = daftarDesa.map(d => {
      const tpsUrut = (d.tps || []).sort((a, b) => a.nomor_tps.localeCompare(b.nomor_tps));
      const labelTps = tpsUrut.length > 0
        ? tpsUrut.map(t => `TPS ${t.nomor_tps}`).join(', ')
        : 'Belum ada TPS';
      return `
        <div class="list-item" style="flex-direction:column; align-items:flex-start;">
          <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
            <strong>${d.nama_desa}</strong>
            <span class="badge">Target: ${Number(d.target_ktp || 0).toLocaleString('id-ID')} KTP</span>
          </div>
          <div style="font-size:12px; color:#475569;">
            <strong>${tpsUrut.length} TPS:</strong> ${labelTps}
          </div>
        </div>
      `;
    }).join('');
  }

  if (isSuper) {
    document.getElementById('formDesa').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama_desa = document.getElementById('namaDesa').value.trim();
      const target_ktp = parseInt(document.getElementById('targetKtp').value, 10) || 0;

      const { error } = await supabase.from('desa').insert({ nama_desa, target_ktp });
      if (error) return showMsg(`Gagal menambah desa: ${error.message}`, true);

      e.target.reset();
      showMsg(`Desa "${nama_desa}" berhasil ditambahkan.`);
      await muatData();
    });
  }

  document.getElementById('formTps').addEventListener('submit', async (e) => {
    e.preventDefault();
    const desa_id = isSuper
      ? parseInt(document.getElementById('pilihDesaTps').value, 10)
      : profil.desa_id;
    const nomor_tps = document.getElementById('nomorTps').value.trim();

    if (!desa_id) return showMsg('Pilih desa terlebih dahulu.', true);

    const { error } = await supabase.from('tps').insert({ desa_id, nomor_tps });
    if (error) return showMsg(`Gagal menambah TPS (pastikan nomor TPS belum ada di desa ini): ${error.message}`, true);

    document.getElementById('nomorTps').value = '';
    showMsg(`TPS ${nomor_tps} berhasil ditambahkan.`);
    await muatData();
  });

  await muatData();
}
