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
      .btn-add-top.secondary { background: #2563eb; }
      .btn-add-top.tertiary { background: #0f766e; }

      .kec-card {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 10px;
      }
      .kec-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .kec-title {
        font-size: 13px;
        font-weight: 800;
        color: #1e3a8a;
        text-transform: uppercase;
      }
      .kec-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
      .kec-body {
        display: none;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      }
      .kec-body.open {
        display: block;
      }

      .desa-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px;
        margin-top: 8px;
      }
      .desa-box:first-child {
        margin-top: 0;
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
      .tps-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #e2e8f0;
        color: #0f172a;
        border: 1px solid #cbd5e1;
        padding: 6px 11px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .tps-btn:active {
        background: #cbd5e1;
      }
      .btn-xs {
        padding: 5px 9px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #1e3a8a;
        cursor: pointer;
      }
      .btn-xs.rincian {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1e3a8a;
      }
      .btn-xs.rincian.active {
        background: #1e3a8a;
        border-color: #1e3a8a;
        color: #ffffff;
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
      .modal-backdrop.open { display: flex; }
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
        margin-bottom: 14px;
      }
      .modal-header h3 {
        font-size: 17px;
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
      .modal-btn-danger {
        width: 100%;
        padding: 11px;
        background: #fee2e2;
        color: #dc2626;
        font-size: 13px;
        font-weight: 700;
        border: 1px solid #fecaca;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 8px;
      }
      .tps-stat-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 14px;
        font-size: 13px;
      }
      .tps-stat-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px dashed #e2e8f0;
      }
      .tps-stat-row:last-child { border-bottom: none; }
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

    <!-- POPUP 4: DETAIL & KELOLA TPS -->
    <div class="modal-backdrop" id="modalDetailTps">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="detailTpsTitle">Detail TPS</h3>
          <button type="button" class="modal-close" data-close="modalDetailTps">×</button>
        </div>

        <div class="tps-stat-box" id="detailTpsStats">
          Memuat informasi TPS...
        </div>

        <form id="formEditTps">
          <input type="hidden" id="editTpsId" />
          <label>Ubah Nomor TPS</label>
          <input type="text" id="editNomorTps" required />
          <button type="submit" class="modal-btn-save">SIMPAN PERUBAHAN</button>
        </form>

        <button type="button" class="modal-btn-danger" id="btnHapusDetailTps">Hapus TPS Ini</button>
        <button type="button" class="modal-btn-cancel" data-close="modalDetailTps">Tutup</button>
      </div>
    </div>
  `;

  const msgEl = document.getElementById('msgWilayah');
  const showMsg = (text, isErr = false) => {
    msgEl.textContent = text;
    msgEl.className = `msg ${isErr ? 'err' : 'ok'}`;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Menyimpan ID kecamatan yang sedang dibuka rinciannya agar tidak tertutup saat muat ulang
  const openedKecIds = new Set();

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

  async function bukaDetailTps(tpsId, nomorTps, namaDesa) {
    document.getElementById('detailTpsTitle').textContent = `TPS ${nomorTps} • ${namaDesa}`;
    document.getElementById('editTpsId').value = tpsId;
    document.getElementById('editNomorTps').value = nomorTps;
    document.getElementById('detailTpsStats').innerHTML = 'Memuat data TPS...';
    bukaModal('modalDetailTps');

    const [
      { count: jmlKtp },
      { data: dataSuara },
      { data: daftarSaksi }
    ] = await Promise.all([
      supabase.from('data_ktp').select('id', { count: 'exact', head: true }).eq('tps_id', tpsId),
      supabase.from('suara_tps').select('suara_calon, suara_tidak_sah').eq('tps_id', tpsId).maybeSingle(),
      supabase.from('users_tim').select('nama_lengkap, no_hp').eq('tps_id', tpsId).eq('role', 'saksi')
    ]);

    const namaSaksi = (daftarSaksi && daftarSaksi.length > 0)
      ? daftarSaksi.map(s => `${s.nama_lengkap}${s.no_hp ? ' (' + s.no_hp + ')' : ''}`).join(', ')
      : 'Belum ada saksi';

    const infoSuara = dataSuara
      ? `${Number(dataSuara.suara_calon || 0).toLocaleString('id-ID')} suara (Tidak sah: ${dataSuara.suara_tidak_sah || 0})`
      : 'Belum masuk';

    document.getElementById('detailTpsStats').innerHTML = `
      <div class="tps-stat-row">
        <span style="color:#64748b;">KTP Terdaftar:</span>
        <strong>${Number(jmlKtp || 0).toLocaleString('id-ID')} KTP</strong>
      </div>
      <div class="tps-stat-row">
        <span style="color:#64748b;">Suara C1 Masuk:</span>
        <strong>${infoSuara}</strong>
      </div>
      <div class="tps-stat-row">
        <span style="color:#64748b;">Saksi TPS:</span>
        <strong>${namaSaksi}</strong>
      </div>
    `;
  }

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
            <button type="button" class="tps-btn" data-detail-tps="${t.id}" data-nomor="${t.nomor_tps}" data-desa-nama="${d.nama_desa}">
              TPS ${t.nomor_tps} <span style="color:#64748b; font-size:11px;">▸</span>
            </button>
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
        const totalTps = desaDiKec.reduce((acc, d) => acc + ((d.tps && d.tps.length) || 0), 0);
        const isOpen = openedKecIds.has(String(k.id));

        html += `
          <div class="kec-card">
            <div class="kec-header">
              <div>
                <div class="kec-title">📍 ${k.nama_kecamatan} (${desaDiKec.length} Desa)</div>
                <div class="kec-sub">${totalTps} TPS terdaftar</div>
              </div>
              <div style="display:flex; gap:5px; flex-wrap:wrap;">
                <button type="button" class="btn-xs rincian ${isOpen ? 'active' : ''}" data-toggle-rincian="${k.id}">
                  ${isOpen ? 'Tutup Rincian ▴' : 'Rincian ▾'}
                </button>
                <button type="button" class="btn-xs" data-quick-desa="${k.id}">+ Desa</button>
                <button type="button" class="btn-xs danger" data-hapus-kec="${k.id}" data-nama="${k.nama_kecamatan}">Hapus</button>
              </div>
            </div>
            <div class="kec-body ${isOpen ? 'open' : ''}" id="rincianKec-${k.id}">
              ${desaDiKec.length > 0
                ? desaDiKec.map(renderKartuDesa).join('')
                : `<p style="font-size:12px; color:#64748b;">Belum ada desa di kecamatan ini.</p>`}
            </div>
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
            <div class="kec-body open">
              ${desaTanpaKec.map(renderKartuDesa).join('')}
            </div>
          </div>
        `;
      }
      listEl.innerHTML = html;
    }

    // Tombol Rincian / Tutup Rincian per Kecamatan
    listEl.querySelectorAll('[data-toggle-rincian]').forEach(btn => {
      btn.addEventListener('click', () => {
        const kecId = String(btn.dataset.toggleRincian);
        const bodyEl = document.getElementById(`rincianKec-${kecId}`);
        if (!bodyEl) return;

        const akanBuka = !bodyEl.classList.contains('open');
        bodyEl.classList.toggle('open', akanBuka);
        btn.classList.toggle('active', akanBuka);
        btn.textContent = akanBuka ? 'Tutup Rincian ▴' : 'Rincian ▾';

        if (akanBuka) openedKecIds.add(kecId);
        else openedKecIds.delete(kecId);
      });
    });

    // Klik tombol TPS untuk buka pop-up detail
    listEl.querySelectorAll('[data-detail-tps]').forEach(btn => {
      btn.addEventListener('click', () => {
        bukaDetailTps(
          parseInt(btn.dataset.detailTps, 10),
          btn.dataset.nomor,
          btn.dataset.desaNama
        );
      });
    });

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
        openedKecIds.delete(String(btn.dataset.hapusKec));
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

    // Hubungkan desa lama ke kecamatan
    listEl.querySelectorAll('.btn-assign-kec').forEach(btn => {
      btn.addEventListener('click', async () => {
        const desaId = parseInt(btn.dataset.desa, 10);
        const sel = listEl.querySelector(`.sel-assign-kec[data-desa="${desaId}"]`);
        const kecId = parseInt(sel.value, 10);
        if (!kecId) return showMsg('Pilih kecamatan terlebih dahulu.', true);

        const { error: upErr } = await supabase.from('desa').update({ kecamatan_id: kecId }).eq('id', desaId);
        if (upErr) return showMsg(`Gagal memperbarui: ${upErr.message}`, true);

        openedKecIds.add(String(kecId));
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
      openedKecIds.add(String(kecamatan_id));
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
    tutupModal('modalTps');
    const desaTarget = desaList.find(d => d.id === desa_id);
    if (desaTarget?.kecamatan_id) openedKecIds.add(String(desaTarget.kecamatan_id));
    showMsg(`TPS ${nomor_tps} berhasil ditambahkan.`);
    await muatData();
  });

  document.getElementById('formEditTps').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tpsId = parseInt(document.getElementById('editTpsId').value, 10);
    const nomorBaru = document.getElementById('editNomorTps').value.trim();
    if (!nomorBaru) return;

    const { error } = await supabase.from('tps').update({ nomor_tps: nomorBaru }).eq('id', tpsId);
    if (error) return showMsg(`Gagal mengubah nomor TPS: ${error.message}`, true);

    tutupModal('modalDetailTps');
    showMsg(`Nomor TPS berhasil diubah menjadi TPS ${nomorBaru}.`);
    await muatData();
  });

  document.getElementById('btnHapusDetailTps').addEventListener('click', async () => {
    const tpsId = parseInt(document.getElementById('editTpsId').value, 10);
    const nomor = document.getElementById('editNomorTps').value;
    if (!confirm(`Hapus TPS ${nomor}?`)) return;

    const { error: delErr, count } = await supabase
      .from('tps')
      .delete({ count: 'exact' })
      .eq('id', tpsId);

    if (delErr) return showMsg(`Gagal menghapus TPS: ${delErr.message}`, true);
    if (count === 0) return showMsg('Izin ditolak oleh server.', true);

    tutupModal('modalDetailTps');
    showMsg(`TPS ${nomor} berhasil dihapus.`);
    await muatData();
  });

  await muatData();
}
