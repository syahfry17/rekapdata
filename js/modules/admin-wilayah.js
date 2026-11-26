import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';

  container.innerHTML = `
    <div id="msgWilayah" class="msg"></div>

    ${isSuper ? `
    <div class="card">
      <h2>1. Tambah Kecamatan</h2>
      <form id="formKecamatan">
        <div class="form-group">
          <label>Nama Kecamatan</label>
          <input type="text" id="namaKecamatan" placeholder="Contoh: Kecamatan Pangkatan" required />
        </div>
        <button type="submit" class="btn-primary">Simpan Kecamatan</button>
      </form>
    </div>

    <div class="card">
      <h2>2. Tambah Desa di Kecamatan</h2>
      <form id="formDesa">
        <div class="form-group">
          <label>Pilih Kecamatan</label>
          <select id="pilihKecamatanDesa" required></select>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Nama Desa</label>
            <input type="text" id="namaDesa" placeholder="Contoh: Desa Kampung Padang" required />
          </div>
          <div class="form-group">
            <label>Target KTP Desa</label>
            <input type="number" id="targetKtp" placeholder="Contoh: 1500" min="0" required />
          </div>
        </div>
        <button type="submit" class="btn-primary">Simpan Desa</button>
      </form>
    </div>
    ` : ''}

    <div class="card">
      <h2>${isSuper ? '3. Tambah TPS' : 'Tambah TPS di Desa Anda'}</h2>
      <form id="formTps">
        <div class="form-grid">
          <div class="form-group">
            <label>${isSuper ? 'Pilih Desa' : 'Wilayah Desa Anda'}</label>
            <select id="pilihDesaTps" required ${!isSuper ? 'disabled' : ''}></select>
          </div>
          <div class="form-group">
            <label>Nomor TPS</label>
            <input type="text" id="nomorTps" placeholder="Contoh: 01" required />
          </div>
        </div>
        <button type="submit" class="btn-primary">Simpan TPS</button>
      </form>
    </div>

    <div class="card">
      <h2>${isSuper ? 'Daftar Kecamatan, Desa & TPS' : 'Daftar TPS Desa Anda'}</h2>
      <div id="listWilayah">Memuat data...</div>
    </div>
  `;

  const msgEl = document.getElementById('msgWilayah');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  async function muatData() {
    let queryDesa = supabase
      .from('desa')
      .select('id, nama_desa, target_ktp, kecamatan_id, kecamatan(nama_kecamatan), tps(id, nomor_tps)')
      .order('nama_desa', { ascending: true });

    if (!isSuper && profil.desa_id) {
      queryDesa = queryDesa.eq('id', profil.desa_id);
    }

    const [{ data: daftarKec }, { data: daftarDesa, error }] = await Promise.all([
      supabase.from('kecamatan').select('id, nama_kecamatan').order('nama_kecamatan', { ascending: true }),
      queryDesa
    ]);

    if (error) {
      showMsg(`Gagal memuat data wilayah: ${error.message}`, true);
      return;
    }

    const kecList = daftarKec || [];
    const desaList = daftarDesa || [];

    if (isSuper) {
      const selKec = document.getElementById('pilihKecamatanDesa');
      selKec.innerHTML = kecList.length > 0
        ? kecList.map(k => `<option value="${k.id}">${k.nama_kecamatan}</option>`).join('')
        : '<option value="">-- Tambahkan kecamatan dulu di atas --</option>';
    }

    const selectDesa = document.getElementById('pilihDesaTps');
    selectDesa.innerHTML = desaList.length > 0
      ? desaList.map(d => {
          const namaKec = d.kecamatan?.nama_kecamatan ? `${d.kecamatan.nama_kecamatan} — ` : '';
          return `<option value="${d.id}" ${d.id === profil.desa_id ? 'selected' : ''}>${namaKec}${d.nama_desa}</option>`;
        }).join('')
      : '<option value="">-- Belum ada desa --</option>';

    const listEl = document.getElementById('listWilayah');

    const renderKartuDesa = (d) => {
      const tpsUrut = (d.tps || []).sort((a, b) => a.nomor_tps.localeCompare(b.nomor_tps));
      const badgeTps = tpsUrut.length > 0
        ? tpsUrut.map(t => `
            <span style="display:inline-flex; align-items:center; gap:6px; background:#e2e8f0; color:#0f172a; padding:5px 10px; border-radius:8px; font-size:12px; font-weight:600; margin:3px;">
              TPS ${t.nomor_tps}
              <button type="button" data-hapus-tps="${t.id}" data-nomor="${t.nomor_tps}" title="Hapus TPS" style="border:none; background:#fee2e2; color:#dc2626; font-weight:800; border-radius:4px; cursor:pointer; padding:2px 7px; font-size:12px;">×</button>
            </span>
          `).join('')
        : '<span style="font-size:12px; color:#64748b;">Belum ada TPS</span>';

      const tombolAturKec = (isSuper && !d.kecamatan_id && kecList.length > 0) ? `
        <div style="margin-top:8px; display:flex; gap:6px; width:100%;">
          <select class="sel-assign-kec" data-desa="${d.id}" style="padding:6px 8px; font-size:12px;">
            <option value="">-- Masukkan ke Kecamatan --</option>
            ${kecList.map(k => `<option value="${k.id}">${k.nama_kecamatan}</option>`).join('')}
          </select>
          <button type="button" class="btn-mini btn-assign-kec" data-desa="${d.id}">Simpan</button>
        </div>` : '';

      const tombolHapusDesa = isSuper
        ? `<button type="button" class="btn-mini" data-hapus-desa="${d.id}" data-nama="${d.nama_desa}" style="color:#dc2626; border-color:#fecaca; padding:4px 8px;">Hapus</button>`
        : '';

      return `
        <div class="list-item" style="flex-direction:column; align-items:flex-start;">
          <div style="width:100%; display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <strong>${d.nama_desa}</strong>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="badge">Target: ${Number(d.target_ktp || 0).toLocaleString('id-ID')} KTP</span>
              ${tombolHapusDesa}
            </div>
          </div>
          <div style="margin-top:6px;">${badgeTps}</div>
          ${tombolAturKec}
        </div>
      `;
    };

    if (!isSuper) {
      listEl.innerHTML = desaList.length > 0
        ? desaList.map(renderKartuDesa).join('')
        : `<p style="font-size:13px; color:#64748b;">Akun Anda belum terhubung ke desa. Hubungi Super Admin.</p>`;
    } else {
      if (desaList.length === 0 && kecList.length === 0) {
        listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada wilayah. Mulai dengan menambahkan Kecamatan di atas.</p>`;
        return;
      }

      let html = '';
      kecList.forEach(k => {
        const desaDiKec = desaList.filter(d => d.kecamatan_id === k.id);
        html += `
          <div style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div style="font-size:13px; font-weight:800; color:#1e3a8a; text-transform:uppercase;">
                📍 ${k.nama_kecamatan} (${desaDiKec.length} Desa)
              </div>
              <button type="button" class="btn-mini" data-hapus-kec="${k.id}" data-nama="${k.nama_kecamatan}" style="color:#dc2626; border-color:#fecaca; padding:3px 8px; font-size:11px;">Hapus Kec</button>
            </div>
            ${desaDiKec.length > 0
              ? desaDiKec.map(renderKartuDesa).join('')
              : `<p style="font-size:12px; color:#64748b; margin-bottom:8px;">Belum ada desa di kecamatan ini.</p>`}
          </div>
        `;
      });

      const desaTanpaKec = desaList.filter(d => !d.kecamatan_id);
      if (desaTanpaKec.length > 0) {
        html += `
          <div style="margin-bottom:14px;">
            <div style="font-size:13px; font-weight:800; color:#d97706; margin-bottom:6px; text-transform:uppercase;">
              ⚠️ Desa Belum Masuk Kecamatan (${desaTanpaKec.length})
            </div>
            ${desaTanpaKec.map(renderKartuDesa).join('')}
          </div>
        `;
      }
      listEl.innerHTML = html;
    }

    // Event Hapus Kecamatan
    listEl.querySelectorAll('[data-hapus-kec]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Hapus ${btn.dataset.nama}?`)) return;
        const { error: delErr, count } = await supabase
          .from('kecamatan')
          .delete({ count: 'exact' })
          .eq('id', btn.dataset.hapusKec);
        if (delErr) return showMsg(`Gagal menghapus kecamatan: ${delErr.message}`, true);
        if (count === 0) return showMsg('Izin ditolak oleh server.', true);
        showMsg(`${btn.dataset.nama} berhasil dihapus.`);
        await muatData();
      });
    });

    // Event Hapus Desa
    listEl.querySelectorAll('[data-hapus-desa]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Hapus ${btn.dataset.nama}? Semua TPS dan data uji coba di desa ini juga akan terhapus.`)) return;
        const { error: delErr, count } = await supabase
          .from('desa')
          .delete({ count: 'exact' })
          .eq('id', btn.dataset.hapusDesa);
        if (delErr) return showMsg(`Gagal menghapus desa: ${delErr.message}`, true);
        if (count === 0) return showMsg('Izin ditolak oleh server.', true);
        showMsg(`${btn.dataset.nama} berhasil dihapus.`);
        await muatData();
      });
    });

    // Event Hapus TPS
    listEl.querySelectorAll('[data-hapus-tps]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Hapus TPS ${btn.dataset.nomor}?`)) return;
        const { error: delErr, count } = await supabase
          .from('tps')
          .delete({ count: 'exact' })
          .eq('id', btn.dataset.hapusTps);
        if (delErr) return showMsg(`Gagal menghapus TPS: ${delErr.message}`, true);
        if (count === 0) return showMsg('Izin ditolak oleh server.', true);
        showMsg(`TPS ${btn.dataset.nomor} berhasil dihapus.`);
        await muatData();
      });
    });

    // Hubungkan desa lama ke kecamatan
    listEl.querySelectorAll('.btn-assign-kec').forEach(btn => {
      btn.addEventListener('click', async () => {
        const desaId = parseInt(btn.dataset.desa, 10);
        const sel = listEl.querySelector(`.sel-assign-kec[data-desa="${desaId}"]`);
        const kecId = parseInt(sel.value, 10);
        if (!kecId) return showMsg('Pilih kecamatan terlebih dahulu.', true);

        const { error: upErr } = await supabase.from('desa').update({ kecamatan_id: kecId }).eq('id', desaId);
        if (upErr) return showMsg(`Gagal memperbarui: ${upErr.message}`, true);

        showMsg('Desa berhasil dihubungkan ke Kecamatan.');
        await muatData();
      });
    });
  }

  if (isSuper) {
    document.getElementById('formKecamatan').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama_kecamatan = document.getElementById('namaKecamatan').value.trim();
      const { error } = await supabase.from('kecamatan').insert({ nama_kecamatan });
      if (error) return showMsg(`Gagal menambah kecamatan: ${error.message}`, true);

      e.target.reset();
      showMsg(`Kecamatan "${nama_kecamatan}" berhasil ditambahkan.`);
      await muatData();
    });

    document.getElementById('formDesa').addEventListener('submit', async (e) => {
      e.preventDefault();
      const kecamatan_id = parseInt(document.getElementById('pilihKecamatanDesa').value, 10);
      const nama_desa = document.getElementById('namaDesa').value.trim();
      const target_ktp = parseInt(document.getElementById('targetKtp').value, 10) || 0;

      if (!kecamatan_id) return showMsg('Pilih atau tambahkan kecamatan terlebih dahulu.', true);

      const { error } = await supabase.from('desa').insert({ kecamatan_id, nama_desa, target_ktp });
      if (error) return showMsg(`Gagal menambah desa: ${error.message}`, true);

      document.getElementById('namaDesa').value = '';
      document.getElementById('targetKtp').value = '';
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
