import { supabase } from '../config.js';

export async function render(container, profil) {
  const isSuperAdmin = profil?.role === 'super_admin';

  container.innerHTML = `
    <div id="wilayahMsg" class="msg"></div>

    ${isSuperAdmin ? `
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px;">
        <button type="button" id="btnToggleKec" class="btn-primary" style="background:#1e3a8a;">+ Kecamatan</button>
        <button type="button" id="btnToggleDesa" class="btn-primary" style="background:#1d4ed8;">+ Desa</button>
        <button type="button" id="btnToggleTps" class="btn-primary" style="background:#047857;">+ TPS</button>
      </div>

      <div id="boxFormKec" class="card" style="display:none;">
        <h2>Tambah Kecamatan</h2>
        <form id="formTambahKec">
          <div class="form-group">
            <label>Nama Kecamatan</label>
            <input type="text" id="inputNamaKec" placeholder="Contoh: Kecamatan Pangkatan" required />
          </div>
          <button type="submit" class="btn-primary">Simpan Kecamatan</button>
        </form>
      </div>

      <div id="boxFormDesa" class="card" style="display:none;">
        <h2>Tambah Desa</h2>
        <form id="formTambahDesa">
          <div class="form-group">
            <label>Pilih Kecamatan</label>
            <select id="selectKecDesa" required></select>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Nama Desa</label>
              <input type="text" id="inputNamaDesa" placeholder="Contoh: Desa Kampung Padang" required />
            </div>
            <div class="form-group">
              <label>Target KTP</label>
              <input type="number" id="inputTargetDesa" min="0" value="0" required />
            </div>
          </div>
          <button type="submit" class="btn-primary">Simpan Desa</button>
        </form>
      </div>

      <div id="boxFormTps" class="card" style="display:none;">
        <h2>Tambah TPS</h2>
        <form id="formTambahTps">
          <div class="form-group">
            <label>Pilih Desa</label>
            <select id="selectDesaTps" required></select>
          </div>
          <div class="form-group">
            <label>Nomor TPS</label>
            <input type="text" id="inputNomorTps" placeholder="Contoh: 001" required />
          </div>
          <button type="submit" class="btn-primary" style="background:#047857;">Simpan TPS</button>
        </form>
      </div>
    ` : ''}

    <div class="card">
      <h2>Daftar Wilayah (Kecamatan &amp; Desa)</h2>
      <div id="listWilayah">Memuat data wilayah...</div>
    </div>
  `;

  const msgEl = container.querySelector('#wilayahMsg');
  const listEl = container.querySelector('#listWilayah');
  const openKecIds = new Set();

  function showMsg(text, ok = true) {
    msgEl.textContent = text;
    msgEl.className = `msg ${ok ? 'ok' : 'err'}`;
    setTimeout(() => {
      msgEl.className = 'msg';
    }, 3500);
  }

  function toggleBox(targetId) {
    ['boxFormKec', 'boxFormDesa', 'boxFormTps'].forEach(id => {
      const el = container.querySelector(`#${id}`);
      if (!el) return;
      el.style.display = id === targetId && el.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (isSuperAdmin) {
    container.querySelector('#btnToggleKec')?.addEventListener('click', () => toggleBox('boxFormKec'));
    container.querySelector('#btnToggleDesa')?.addEventListener('click', () => toggleBox('boxFormDesa'));
    container.querySelector('#btnToggleTps')?.addEventListener('click', () => toggleBox('boxFormTps'));

    container.querySelector('#formTambahKec')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama = container.querySelector('#inputNamaKec').value.trim();
      if (!nama) return;

      const { error } = await supabase.from('kecamatan').insert({ nama_kecamatan: nama });
      if (error) return showMsg(`Gagal menambah kecamatan: ${error.message}`, false);

      container.querySelector('#inputNamaKec').value = '';
      toggleBox('');
      showMsg('Kecamatan berhasil ditambahkan.');
      await loadWilayah();
    });

    container.querySelector('#formTambahDesa')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const kecamatan_id = container.querySelector('#selectKecDesa').value;
      const nama_desa = container.querySelector('#inputNamaDesa').value.trim();
      const target_ktp = Math.max(0, Number(container.querySelector('#inputTargetDesa').value || 0));
      if (!kecamatan_id || !nama_desa) return;

      const { error } = await supabase.from('desa').insert({ kecamatan_id, nama_desa, target_ktp });
      if (error) return showMsg(`Gagal menambah desa: ${error.message}`, false);

      openKecIds.add(String(kecamatan_id));
      container.querySelector('#inputNamaDesa').value = '';
      container.querySelector('#inputTargetDesa').value = '0';
      toggleBox('');
      showMsg('Desa berhasil ditambahkan.');
      await loadWilayah();
    });

    container.querySelector('#formTambahTps')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const desa_id = container.querySelector('#selectDesaTps').value;
      const nomor_tps = container.querySelector('#inputNomorTps').value.trim();
      if (!desa_id || !nomor_tps) return;

      const { error } = await supabase.from('tps').insert({ desa_id, nomor_tps });
      if (error) return showMsg(`Gagal menambah TPS: ${error.message}`, false);

      container.querySelector('#inputNomorTps').value = '';
      toggleBox('');
      showMsg('TPS berhasil ditambahkan.');
      await loadWilayah();
    });
  }

  async function loadWilayah() {
    let kecQuery = supabase.from('kecamatan').select('id, nama_kecamatan').order('nama_kecamatan', { ascending: true });
    let desaQuery = supabase.from('desa').select('id, nama_desa, kecamatan_id, target_ktp').order('nama_desa', { ascending: true });
    let tpsQuery = supabase.from('tps').select('id, desa_id, nomor_tps').order('nomor_tps', { ascending: true });

    if (!isSuperAdmin && profil?.desa_id) {
      desaQuery = desaQuery.eq('id', profil.desa_id);
      tpsQuery = tpsQuery.eq('desa_id', profil.desa_id);
    }

    const [
      { data: kecList, error: errKec },
      { data: desaList, error: errDesa },
      { data: tpsList, error: errTps }
    ] = await Promise.all([kecQuery, desaQuery, tpsQuery]);

    if (errKec || errDesa || errTps) {
      listEl.innerHTML = `<div class="msg err">Gagal memuat wilayah: ${(errKec || errDesa || errTps).message}</div>`;
      return;
    }

    const kecs = kecList || [];
    const desas = desaList || [];
    const tpss = tpsList || [];

    if (isSuperAdmin) {
      const selKec = container.querySelector('#selectKecDesa');
      if (selKec) {
        selKec.innerHTML = kecs.map(k => `<option value="${k.id}">${k.nama_kecamatan}</option>`).join('');
      }
      const selDesa = container.querySelector('#selectDesaTps');
      if (selDesa) {
        selDesa.innerHTML = desas.map(d => `<option value="${d.id}">${d.nama_desa}</option>`).join('');
      }
    }

    const tpsByDesa = new Map();
    tpss.forEach(t => {
      if (!tpsByDesa.has(t.desa_id)) tpsByDesa.set(t.desa_id, []);
      tpsByDesa.get(t.desa_id).push(t);
    });

    const desaByKec = new Map();
    desas.forEach(d => {
      if (!desaByKec.has(d.kecamatan_id)) desaByKec.set(d.kecamatan_id, []);
      desaByKec.get(d.kecamatan_id).push(d);
    });

    const visibleKecs = isSuperAdmin
      ? kecs
      : kecs.filter(k => (desaByKec.get(k.id) || []).length > 0);

    if (visibleKecs.length === 0) {
      listEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Belum ada data wilayah.</p>`;
      return;
    }

    listEl.innerHTML = visibleKecs.map(k => {
      const daftarDesa = desaByKec.get(k.id) || [];
      const totalTpsKec = daftarDesa.reduce((acc, d) => acc + (tpsByDesa.get(d.id)?.length || 0), 0);
      const isOpen = !isSuperAdmin || openKecIds.has(String(k.id));

      const desaCardsHtml = daftarDesa.map(d => {
        const daftarTps = tpsByDesa.get(d.id) || [];
        const tpsBadges = daftarTps.length > 0
          ? daftarTps.map(t => `<span class="badge" style="margin-right:4px; margin-top:4px;">TPS ${t.nomor_tps}</span>`).join('')
          : `<div style="font-size:12px; color:#64748b; margin-top:6px;">Belum ada TPS</div>`;

        return `
          <div style="border:1px solid #cbd5e1; border-radius:10px; padding:12px; margin-top:10px; background:#ffffff;">
            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; justify-content:space-between;">
              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
                <strong style="font-size:14px; color:#0f172a;">${d.nama_desa}</strong>
                <span class="badge" id="badgeTarget-${d.id}">Target: ${Number(d.target_ktp || 0).toLocaleString('id-ID')} KTP</span>
              </div>
              ${isSuperAdmin ? `
                <button type="button" class="btn-mini btn-edit-target" data-desa-id="${d.id}" data-desa-nama="${d.nama_desa}" data-target="${Number(d.target_ktp || 0)}" style="border-color:#93c5fd; color:#1e3a8a; background:#eff6ff;">
                  ✏️ Edit Target
                </button>
              ` : ''}
            </div>

            ${isSuperAdmin ? `
              <div id="editTargetBox-${d.id}" style="display:none; margin-top:10px; padding:10px; border-radius:8px; background:#f8fafc; border:1px solid #dbeafe;">
                <label style="margin-bottom:4px;">Ubah Target KTP (${d.nama_desa})</label>
                <div style="display:flex; gap:8px; align-items:center;">
                  <input type="number" id="inputEditTarget-${d.id}" min="0" value="${Number(d.target_ktp || 0)}" style="padding:8px 10px; font-size:13px;" />
                  <button type="button" class="btn-mini btn-save-target" data-desa-id="${d.id}" data-kec-id="${k.id}" style="background:#1e3a8a; color:#fff; border:none; padding:8px 12px; white-space:nowrap;">Simpan</button>
                  <button type="button" class="btn-mini btn-cancel-target" data-desa-id="${d.id}" style="padding:8px 10px;">Batal</button>
                </div>
              </div>
            ` : ''}

            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
              <button type="button" class="btn-mini btn-quick-tps" data-desa-id="${d.id}" data-desa-nama="${d.nama_desa}" data-kec-id="${k.id}">+ TPS</button>
              ${isSuperAdmin ? `<button type="button" class="btn-mini btn-del-desa" data-desa-id="${d.id}" data-desa-nama="${d.nama_desa}" data-kec-id="${k.id}" style="color:#dc2626; border-color:#fecaca;">Hapus</button>` : ''}
            </div>

            <div style="margin-top:6px;">${tpsBadges}</div>
          </div>
        `;
      }).join('');

      return `
        <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:12px; background:#f8fafc;">
          <div style="font-weight:800; font-size:14px; color:#0f172a;">📍 ${k.nama_kecamatan.toUpperCase()} (${daftarDesa.length} DESA)</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">${totalTpsKec} TPS terdaftar</div>

          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
            <button type="button" class="btn-mini btn-toggle-rincian" data-kec-id="${k.id}" style="background:#1e3a8a; color:#fff; border:none;">
              ${isOpen ? 'Tutup Rincian ▴' : 'Rincian ▾'}
            </button>
            ${isSuperAdmin ? `
              <button type="button" class="btn-mini btn-quick-desa" data-kec-id="${k.id}">+ Desa</button>
              <button type="button" class="btn-mini btn-del-kec" data-kec-id="${k.id}" data-kec-nama="${k.nama_kecamatan}" style="color:#dc2626; border-color:#fecaca;">Hapus</button>
            ` : ''}
          </div>

          <div id="rincianKec-${k.id}" style="display:${isOpen ? 'block' : 'none'}; margin-top:8px;">
            ${desaCardsHtml || '<p style="font-size:12px; color:#64748b; margin-top:8px;">Belum ada desa di kecamatan ini.</p>'}
          </div>
        </div>
      `;
    }).join('');

    // Toggle Rincian Kecamatan
    listEl.querySelectorAll('.btn-toggle-rincian').forEach(btn => {
      btn.addEventListener('click', () => {
        const kecId = String(btn.dataset.kecId);
        const box = listEl.querySelector(`#rincianKec-${kecId}`);
        if (!box) return;
        const akanBuka = box.style.display === 'none';
        box.style.display = akanBuka ? 'block' : 'none';
        btn.textContent = akanBuka ? 'Tutup Rincian ▴' : 'Rincian ▾';
        if (akanBuka) openKecIds.add(kecId);
        else openKecIds.delete(kecId);
      });
    });

    // Quick + Desa per Kecamatan
    listEl.querySelectorAll('.btn-quick-desa').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBox('boxFormDesa');
        const sel = container.querySelector('#selectKecDesa');
        if (sel) sel.value = btn.dataset.kecId;
        container.querySelector('#inputNamaDesa')?.focus();
      });
    });

    // Quick + TPS per Desa
    listEl.querySelectorAll('.btn-quick-tps').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nomor = prompt(`Masukkan Nomor TPS baru untuk ${btn.dataset.desaNama}:`, '');
        if (!nomor || !nomor.trim()) return;
        const { error } = await supabase.from('tps').insert({
          desa_id: btn.dataset.desaId,
          nomor_tps: nomor.trim()
        });
        if (error) return showMsg(`Gagal menambah TPS: ${error.message}`, false);
        openKecIds.add(String(btn.dataset.kecId));
        showMsg(`TPS ${nomor.trim()} berhasil ditambahkan.`);
        await loadWilayah();
      });
    });

    // Edit Target KTP Desa (Khusus Super Admin)
    if (isSuperAdmin) {
      listEl.querySelectorAll('.btn-edit-target').forEach(btn => {
        btn.addEventListener('click', () => {
          const desaId = btn.dataset.desaId;
          const editBox = listEl.querySelector(`#editTargetBox-${desaId}`);
          if (!editBox) return;
          editBox.style.display = editBox.style.display === 'none' ? 'block' : 'none';
          listEl.querySelector(`#inputEditTarget-${desaId}`)?.focus();
        });
      });

      listEl.querySelectorAll('.btn-cancel-target').forEach(btn => {
        btn.addEventListener('click', () => {
          const editBox = listEl.querySelector(`#editTargetBox-${btn.dataset.desaId}`);
          if (editBox) editBox.style.display = 'none';
        });
      });

      listEl.querySelectorAll('.btn-save-target').forEach(btn => {
        btn.addEventListener('click', async () => {
          const desaId = btn.dataset.desaId;
          const kecId = String(btn.dataset.kecId);
          const inputEl = listEl.querySelector(`#inputEditTarget-${desaId}`);
          const targetBaru = Math.max(0, Number(inputEl?.value || 0));

          btn.disabled = true;
          btn.textContent = 'Menyimpan...';

          const { error } = await supabase
            .from('desa')
            .update({ target_ktp: targetBaru })
            .eq('id', desaId);

          if (error) {
            btn.disabled = false;
            btn.textContent = 'Simpan';
            return showMsg(`Gagal memperbarui Target KTP: ${error.message}`, false);
          }

          openKecIds.add(kecId);
          showMsg(`Target KTP berhasil diperbarui menjadi ${targetBaru.toLocaleString('id-ID')}.`);
          await loadWilayah();
        });
      });

      listEl.querySelectorAll('.btn-del-desa').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Hapus ${btn.dataset.desaNama}?`)) return;
          const { error } = await supabase.from('desa').delete().eq('id', btn.dataset.desaId);
          if (error) return showMsg(`Gagal menghapus desa: ${error.message}`, false);
          openKecIds.add(String(btn.dataset.kecId));
          showMsg(`${btn.dataset.desaNama} berhasil dihapus.`);
          await loadWilayah();
        });
      });

      listEl.querySelectorAll('.btn-del-kec').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Hapus ${btn.dataset.kecNama}?`)) return;
          const { error } = await supabase.from('kecamatan').delete().eq('id', btn.dataset.kecId);
          if (error) return showMsg(`Gagal menghapus kecamatan: ${error.message}`, false);
          showMsg(`${btn.dataset.kecNama} berhasil dihapus.`);
          await loadWilayah();
        });
      });
    }
  }

  await loadWilayah();
}
