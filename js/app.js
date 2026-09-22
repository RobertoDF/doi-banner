/* DOI Banner — UI wiring. */

(() => {
  const $ = id => document.getElementById(id);

  const ACCENTS = ['#4B8E8D', '#8C8C8C', '#B0457A', '#2F6FB2', '#C6892B', '#5E5AA8', '#1A1A1A', '#FFFFFF'];

  const el = {
    form: $('lookup'), doi: $('doi'), go: $('go'), status: $('status'),
    stage: $('stage'), canvas: $('preview'), dims: $('dims'),
    preset: $('preset'), theme: $('theme'), typeface: $('typeface'),
    accent: $('accent'), swatches: $('swatches'),
    showQr: $('showQr'), qrPlate: $('qrPlate'), showRule: $('showRule'), showDoi: $('showDoi'),
    dlPng: $('dlPng'), dlSvg: $('dlSvg'),    fields: $('fields')
  };

  const F = {
    title: $('f-title'), authors: $('f-authors'), journal: $('f-journal'),
    year: $('f-year'), volume: $('f-volume'), pages: $('f-pages'), doi: $('f-doi')
  };

  const DEMO = {
    title: 'Keypoint-MoSeq: parsing behavior by linking point tracking to pose dynamics',
    authors: 'Weinreb, Pearl, Lin',
    authorCount: 17,
    journal: 'Nat Methods',
    journalFull: 'Nature Methods',
    year: '2024', volume: '21', pages: '1329\u20131339',
    doi: '10.1038/s41592-024-02318-2'
  };

  let meta = Object.assign({}, DEMO);
  let doc = null;

  /* ---- swatches ---- */
  ACCENTS.forEach(hex => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw';
    b.style.background = hex;
    b.title = hex;
    b.addEventListener('click', () => { el.accent.value = hex; draw(); });
    el.swatches.appendChild(b);
  });

  /* ---- state <-> fields ---- */
  function metaToFields() {
    F.title.value = meta.title || '';
    F.authors.value = meta.authors || '';
    F.journal.value = meta.journal || '';
    F.year.value = meta.year || '';
    F.volume.value = meta.volume || '';
    F.pages.value = meta.pages || '';
    F.doi.value = meta.doi || '';
  }

  function fieldsToMeta() {
    meta.title = F.title.value;
    meta.authors = F.authors.value;
    meta.journal = F.journal.value;
    meta.year = F.year.value;
    meta.volume = F.volume.value;
    meta.pages = F.pages.value;
    meta.doi = Meta.normalize(F.doi.value) || F.doi.value.trim();
  }

  function options() {
    return {
      preset: el.preset.value,
      theme: el.theme.value,
      typeface: el.typeface.value,
      accent: el.accent.value,
      showQr: el.showQr.checked,
      qrPlate: el.qrPlate.checked,
      showRule: el.showRule.checked,
      showDoi: el.showDoi.checked
    };
  }

  /* ---- draw ---- */
  function draw() {
    const opt = options();
    try {
      doc = Layout.build(meta, opt);
    } catch (e) {
      say('Could not lay that out: ' + e.message, true);
      return;
    }
    // Render the preview at 2x so it stays sharp on retina, then let CSS size it.
    Render.toCanvas(doc, 2, el.canvas);
    el.canvas.style.aspectRatio = doc.width + ' / ' + doc.height;
    el.dims.textContent = doc.width + ' × ' + doc.height + ' px';
    el.qrPlate.disabled = !el.showQr.checked;
  }

  function say(msg, isErr) {
    el.status.textContent = msg || '';
    el.status.classList.toggle('err', !!isErr);
  }

  /* ---- lookup ---- */
  el.form.addEventListener('submit', async e => {
    e.preventDefault();
    const raw = el.doi.value.trim();
    if (!raw) { say('Paste a DOI first.', true); return; }

    el.go.disabled = true;
    say('Looking up ' + (Meta.normalize(raw) || raw) + '\u2026');
    try {
      meta = await Meta.lookup(raw);
      metaToFields();
      draw();
      say('Found via ' + meta.source + '.');
      history.replaceState(null, '', '#' + meta.doi);
    } catch (err) {
      say(err.message, true);
    } finally {
      el.go.disabled = false;
    }
  });

  /* ---- controls ---- */
  ['preset', 'theme', 'typeface', 'accent', 'showQr', 'qrPlate', 'showRule', 'showDoi']
    .forEach(k => el[k].addEventListener('input', draw));

  Object.values(F).forEach(input => {
    input.addEventListener('input', () => { fieldsToMeta(); draw(); });
  });

  el.stage.parentElement.querySelectorAll('.seg button').forEach(b => {
    b.addEventListener('click', () => {
      el.stage.parentElement.querySelectorAll('.seg button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      el.stage.dataset.bg = b.dataset.bg;
      syncThemeToBackdrop();
      draw();
    });
  });

  // A dark plate wants white text, a light plate wants near-black. The select
  // stays available for anyone who wants to override afterwards.
  function syncThemeToBackdrop() {
    const bg = el.stage.dataset.bg;
    if (bg === 'dark') el.theme.value = 'light';
    else if (bg === 'light') el.theme.value = 'dark';
  }

  /* ---- export ---- */
  const EXPORT_SCALE = 2;

  function backdrop() {
    return Render.BACKDROPS[el.stage.dataset.bg] || null;
  }

  function slug() {
    const base = (meta.authors || 'banner').split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const bg = el.stage.dataset.bg === 'checker' ? 'transparent' : el.stage.dataset.bg;
    return [base, meta.year, el.preset.value, bg].filter(Boolean).join('-');
  }

  el.dlPng.addEventListener('click', () => {
    if (!doc) return;
    Render.savePNG(doc, EXPORT_SCALE, slug() + '.png', backdrop());
    say(backdrop()
      ? 'Saved PNG on a ' + el.stage.dataset.bg + ' background.'
      : 'Saved PNG \u2014 transparent background.');
  });

  el.dlSvg.addEventListener('click', () => {
    if (!doc) return;
    Render.saveSVG(doc, slug() + '.svg', backdrop());
    say('Saved SVG. Fonts are referenced by name, so PNG is safer for sharing.');
  });

  /* ---- boot ---- */
  metaToFields();

  function fromHash() {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!Meta.normalize(hash)) return false;
    if (Meta.normalize(hash) === Meta.normalize(el.doi.value)) return true;
    el.doi.value = hash;
    el.form.dispatchEvent(new Event('submit'));
    return true;
  }

  window.addEventListener('hashchange', fromHash);

  // Wait for webfont-less metrics to settle before the first measure pass.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    syncThemeToBackdrop();
    draw();
    if (!fromHash()) say('Showing an example. Paste a DOI to replace it.');
  });
})();
