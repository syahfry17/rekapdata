import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuper = profil.role === 'super_admin';

  container.innerHTML = `
    <style>
      .wil-actions {
        display: grid;
        grid-template-columns: ${isSuper ? 'repeat(3, 1fr)' : '1fr'};
        gap: 8px;
        margin-bottom: 14px;
      }
      .btn-add-top {
        padding: 11px 8px;
        background: #1e3a8a;
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
      }
      .btn-add-top.secondary {
        background: #2563eb;
      }
      .btn-add-top.tertiary {
        background: #0f766e;
      }
      .kec-card {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .kec-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .kec-title {
        font-size: 13px;
        font-weight: 800;
        color: #1e3a8a;
        text-transform: uppercase;
      }
      .desa-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px;
        margin-top: 8px;
      }
      .desa-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tps-wrap {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
      }
      .tps-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #e2e8f0;
        color: #0f172a;
        padding: 4px 8px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 600;
      }
      .tps-del {
        border: none;
        background: #fee2e2;
        color: #dc2626;
        font-weight: 800;
        border-radius: 4px;
        cursor: pointer;
        padding: 1px 6px;
        font-size: 12px;
      }
      .btn-xs {
        padding: 4px 9px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #1e3a8a;
        cursor: pointer;
      }
      .btn-xs.danger {
        color: #dc2626;
        border-color: #fecaca;
      }

      /* Gaya Modal Pop-up */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 999;
      }
      .modal-backdrop.open {
        display: flex;
      }
      .modal-box {
        width: 100%;
        max-width: 420px;
        background: #ffffff;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.25);
        animation: popIn 0.16s ease-out;
      }
      @keyframes popIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .modal-header h3 {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }
      .modal-close {
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
      .modal-box input, .modal-box select {
        padding: 12px;
        border-radius: 10px;
        font-size: 14px;
        margin-bottom: 12px;
      }
      .modal-btn-cancel {
        width: 100%;
        padding: 12px;
        background: #e2e8f0;
        color: #334155;
        font-size: 14px;
        font-weight: 700;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 4px;
        margin-bottom: 8px;
      }
      .modal-btn-save {
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

    <div id="msgWilayah" class="msg"></div>

    <div class="wil-actions">
      ${isSuper ? `
        <button type="button" class="btn-add-top" id="openModalKec">+ Kecamatan</button>
        <button type="button" class="btn-add-top secondary" id="openModalDesa">+ Desa</button>
        <button type="button" class="btn-add-top tertiary" id="openModalTps">+ TPS</button>
      ` : `
        <button type="button" class="btn-add-top" id="openModalTps">+ Tambah TPS Desa Anda</button>
      `}
    </div>

    <div class="card">
      <h2>${isSuper ? 'Daftar Wilayah (Kecamatan & Desa)' : 'Daftar TPS Desa Anda'}</h2>
      <div id="listWilayah">Memuat data...</div>
    </div>

    <!-- POPUP 1: TAMBAH KECAMATAN -->
    <div class="modal-backdrop" id="modalKec">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Tambah Kecamatan</h3>
          <button type="button" class="modal-close" data-close="modalKec">×</button>
        </div>
        <form id="formKecamatan">
          <input type="text" id="namaKecamatan" placeholder="Nama Kecamatan (misal: Kecamatan Pangkatan)" required />
          <button type="button" class="modal-btn-cancel" data-close="modalKec">Batal</button>
          <button type="submit" class="modal-btn-save">SIMPAN</button>
        </form>
      </div>
    </div>

    <!-- POPUP 2: TAMBAH DESA -->
    <div class="modal-backdrop" id="modalDesa">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Tambah Desa</h3>
          <button type="button" class="modal-close" data-close="modalDesa">×</button>
        </div>
        <form id="formDesa">
          <label>Kecamatan</label>
          <select id="pilihKecamatanDesa" required></select>
          <input type="text" id="namaDesa" placeholder="Nama Desa (misal: Desa Kampung Padang)" required />
          <input type="number" id="targetKtp" placeholder="Target KTP Desa (misal: 1500)" min="0" required />
          <button type="button" class="modal-btn-cancel" data-close="modalDesa">Batal</button>
          <button type="submit" class="modal-btn-save">SIMPAN</button>
        </form>
      </div>
    </div>

    <!-- POPUP 3: TAMBAH TPS -->
    <div class="modal-backdrop" id="modalTps">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Tambah TPS</h3>
          <button type="button" class="modal-close" data-close="modalTps">×</button>
        </div>
        <form id="formTps">
          <label>${isSuper ? 'Pilih Desa' : 'Wilayah Desa Anda'}</label>
          <select id="pilihDesaTps" required ${!isSuper ? 'disabled' : ''}></select>
          <input type="text" id="nomorTps" placeholder="Nomor TPS (misal: 01)" required />
          <button type="button" class="modal-btn-cancel" data-close="modalTps">Batal</button>
          <button type="submit" class="modal-btn-save">SIMPAN</button>
        </form>
      </div>
    </div>
  `;

  const msgEl = document.getElementById('msgWilayah');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Kontrol buka/tutup modal
  const bukaModal = (id) => document.getElementById(id).classList.add('open');
  const tutupModal = (id) => document.getElementById(id).classList.remove('open');

  container.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => tutupModal(btn.dataset.close));
  });

  container.querySelectorAll('.modal-backdrop').forEach(bg => {
    bg.addEventListener('click', (e) => {
      if (e.target === bg) tutupModal(bg.id);
    });
  });

  if (isSuper) {
    document.getElementById('openModalKec').addEventListener('click', () => {
      bukaModal('modalKec');
      document.getElementById('namaKecamatan').focus();
    });
    document.getElementById('openModalDesa').addEventListener('click', () => {
      bukaModal('modalDesa');
      document.getElementById('namaDesa').focus();
    });
  }

  document.getElementById('openModalTps').addEventListener('click', () => {
    bukaModal('modalTps');
    document.getElementById('nomorTps').focus();
  });

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

    const selKec = document.getElementById('pilihKecamatanDesa');
    selKec.innerHTML = kecList.length > 0
      ? kecList.map(k => `<option value="${k.id}">${k.nama_kecamatan}</option>`).join('')
      : '<option value="">-- Tambahkan kecamatan dulu --</option>';

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
            <span class="tps-chip">
              TPS ${t.nomor_tps}
              <button type="button" class="tps-del" data-hapus-tps="${t.id}" data-nomor="${t.nomor_tps}">×</button>
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

      return `
        <div class="desa-box">
          <div class="desa-head">
            <div>
              <strong style="font-size:14px;">${d.nama_desa}</strong>
              <span class="badge" style="margin-left:6px;">Target: ${Number(d.target_ktp || 0).toLocaleString('id-ID')} KTP</span>
            </div>
            <div style="display:flex; gap:5px;">
              <button type="button" class="btn-xs" data-quick-tps="${d.id}">+ TPS</button>
              ${isSuper ? `<button type="button" class="btn-xs danger" data-hapus-desa="${d.id}" data-nama="${d.nama_desa}">Hapus</button>` : ''}
            </div>
          </div>
          <div class="tps-wrap">${badgeTps}</div>
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
        listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada wilayah. Ketuk tombol <strong>+ Kecamatan</strong> di atas untuk mulai.</p>`;
        return;
      }

      let html = '';
      kecList.forEach(k => {
        const desaDiKec = desaList.filter(d => d.kecamatan_id === k.id);
        html += `
          <div class="kec-card">
            <div class="kec-header">
              <div class="kec-title">📍 ${k.nama_kecamatan} (${desaDiKec.length} Desa)</div>
              <div style="display:flex; gap:5px;">
                <button type="button" class="btn-xs" data-quick-desa="${k.id}">+ Desa</button>
                <button type="button" class="btn-xs danger" data-hapus-kec="${k.id}" data-nama="${k.nama_kecamatan}">Hapus</button>
              </div>
            </div>
            ${desaDiKec.length > 0
              ? desaDiKec.map(renderKartuDesa).join('')
              : `<p style="font-size:12px; color:#64748b;">Belum ada desa di kecamatan ini.</p>`}
          </div>
        `;
      });

      const desaTanpaKec = desaList.filter(d => !d.kecamatan_id);
      if (desaTanpaKec.length > 0) {
        html += `
          <div class="kec-card" style="border-color:#fcd34d;">
            <div class="kec-header">
              <div class="kec-title" style="color:#d97706;">⚠️ Belum Masuk Kecamatan (${desaTanpaKec.length})</div>
            </div>
            ${desaTanpaKec.map(renderKartuDesa).join('')}
          </div>
        `;
      }
      listEl.innerHTML = html;
    }

    // Tombol pintas + Desa langsung pada kartu Kecamatan
    listEl.querySelectorAll('[data-quick-desa]').forEach(btn => {
      btn.addEventListener('click', () => {
        selKec.value = btn.dataset.quickDesa;
        bukaModal('modalDesa');
        document.getElementById('namaDesa').focus();
      });
    });

    // Tombol pintas + TPS langsung pada kartu Desa
    listEl.querySelectorAll('[data-quick-tps]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectDesa.value = btn.dataset.quickTps;
        bukaModal('modalTps');
        document.getElementById('nomorTps').focus();
      });
    });

    // Hapus Kecamatan
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

    // Hapus Desa
    listEl.querySelectorAll('[data-hapus-desa]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Hapus ${btn.dataset.nama}? Semua TPS di desa ini juga akan terhapus.`)) return;
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

    // Hapus TPS
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

  document.getElementById('formKecamatan').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama_kecamatan = document.getElementById('namaKecamatan').value.trim();
    const { error } = await supabase.from('kecamatan').insert({ nama_kecamatan });
    if (error) return showMsg(`Gagal menambah kecamatan: ${error.message}`, true);

    e.target.reset();
    tutupModal('modalKec');
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
    tutupModal('modalDesa');
    showMsg(`Desa "${nama_desa}" berhasil ditambahkan.`);
    await muatData();
  });

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
    tutupModal('modalTps');
    showMsg(`TPS ${nomor_tps} berhasil ditambahkan.`);
    await muatData();
  });

  await muatData();
}
