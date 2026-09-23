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
    dlPng: $('dlPng'), dlSvg: $('dlSvg'), fields: $('fields'), fieldsNote: $('fieldsNote')
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

  // One entry per DOI. The edit fields always drive papers[0].
  let papers = [Object.assign({}, DEMO)];
  let doc = null;
  const meta = () => papers[0];

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
    const m = meta();
    F.title.value = m.title || '';
    F.authors.value = m.authors || '';
    F.journal.value = m.journal || '';
    F.year.value = m.year || '';
    F.volume.value = m.volume || '';
    F.pages.value = m.pages || '';
    F.doi.value = m.doi || '';
    el.fieldsNote.hidden = papers.length < 2;
  }

  function fieldsToMeta() {
    const m = meta();
    m.title = F.title.value;
    m.authors = F.authors.value;
    m.journal = F.journal.value;
    m.year = F.year.value;
    m.volume = F.volume.value;
    m.pages = F.pages.value;
    m.doi = Meta.normalize(F.doi.value) || F.doi.value.trim();
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
      doc = Layout.compose(papers.map(p => Layout.build(p, opt)), opt);
    } catch (e) {
      say('Could not lay that out: ' + e.message, true);
      return;
    }
    // Render the preview at 2x so it stays sharp on retina, then let CSS size it.
    Render.toCanvas(doc, 2, el.canvas);
    el.canvas.style.aspectRatio = doc.width + ' / ' + doc.height;
    el.dims.textContent = doc.width + ' × ' + doc.height + ' px' +
      (papers.length > 1 ? '  ·  ' + papers.length + ' papers' : '');
    el.qrPlate.disabled = !el.showQr.checked;
  }

  function say(msg, isErr) {
    el.status.textContent = msg || '';
    el.status.classList.toggle('err', !!isErr);
  }

  /* ---- lookup ---- */
  const MAX_DOIS = 12;

  el.form.addEventListener('submit', async e => {
    e.preventDefault();
    let list = Meta.normalizeAll(el.doi.value);
    if (!list.length) { say('Paste a DOI first.', true); return; }

    const trimmed = list.length > MAX_DOIS;
    if (trimmed) list = list.slice(0, MAX_DOIS);

    el.go.disabled = true;
    say(list.length === 1
      ? 'Looking up ' + list[0] + '\u2026'
      : 'Looking up ' + list.length + ' DOIs\u2026');

    // One failure should not cost you the rest of the list.
    const results = await Promise.all(list.map(async doi => {
      try { return { ok: true, meta: await Meta.lookup(doi) }; }
      catch (err) { return { ok: false, doi, message: err.message }; }
    }));

    const found = results.filter(r => r.ok).map(r => r.meta);
    const failed = results.filter(r => !r.ok);

    if (!found.length) {
      say(failed.length === 1 ? failed[0].message
        : 'None of those ' + failed.length + ' DOIs resolved.', true);
      el.go.disabled = false;
      return;
    }

    papers = found;
    metaToFields();
    draw();

    if (failed.length) {
      say('Rendered ' + found.length + ' of ' + results.length +
          ' \u2014 no metadata for ' + failed.map(f => f.doi).join(', ') + '.', true);
    } else {
      say(found.length === 1
        ? 'Found via ' + found[0].source + '.'
        : 'Found all ' + found.length + ' papers.' +
          (trimmed ? ' Only the first ' + MAX_DOIS + ' were used.' : ''));
    }

    history.replaceState(null, '', '#' + found.map(m => m.doi).join(','));
    el.go.disabled = false;
  });

  // Enter fetches; Shift+Enter adds another DOI on its own line.
  el.doi.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      el.form.requestSubmit ? el.form.requestSubmit() : el.form.dispatchEvent(new Event('submit'));
    }
  });

  function growInput() {
    el.doi.style.height = 'auto';
    el.doi.style.height = Math.min(el.doi.scrollHeight, 260) + 'px';
  }
  el.doi.addEventListener('input', growInput);

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
    const m = meta();
    const base = (m.authors || 'banner').split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const bg = el.stage.dataset.bg === 'checker' ? 'transparent' : el.stage.dataset.bg;
    const many = papers.length > 1 ? 'plus-' + (papers.length - 1) : '';
    return [base, m.year, many, el.preset.value, bg].filter(Boolean).join('-');
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
    const wanted = Meta.normalizeAll(decodeURIComponent(location.hash.replace(/^#/, '')));
    if (!wanted.length) return false;
    const showing = Meta.normalizeAll(el.doi.value).join('|').toLowerCase();
    if (wanted.join('|').toLowerCase() === showing) return true;
    el.doi.value = wanted.join('\n');
    growInput();
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
