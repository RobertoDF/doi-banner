/* DOI / Link Banner — UI wiring. */

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
    year: $('f-year'), volume: $('f-volume'), pages: $('f-pages'), target: $('f-target')
  };

  const DEMO = {
    title: 'Keypoint-MoSeq: parsing behavior by linking point tracking to pose dynamics',
    authors: 'Weinreb, Pearl, Lin',
    authorCount: 17,
    journal: 'Nat Methods',
    journalFull: 'Nature Methods',
    year: '2024', volume: '21', pages: '1329\u20131339',
    doi: '10.1038/s41592-024-02318-2',
    url: 'https://doi.org/10.1038/s41592-024-02318-2', kind: 'doi'
  };

  // One entry per resource. The edit fields always drive papers[0].
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
    F.target.value = m.kind === 'url' ? (m.url || '') : (m.doi || '');
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
    const rawTarget = F.target.value.trim();
    const doi = Meta.normalize(rawTarget);
    const url = Meta.normalizeUrl(rawTarget);
    if (doi && (!url || /^https?:\/\/(?:dx\.)?doi\.org\//i.test(rawTarget))) {
      m.kind = 'doi';
      m.doi = doi;
      m.url = 'https://doi.org/' + doi;
    } else if (url) {
      m.kind = 'url';
      m.doi = '';
      m.url = url;
    }
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
      (papers.length > 1 ? '  ·  ' + papers.length + ' resources' : '');
    el.qrPlate.disabled = !el.showQr.checked;
  }

  function say(msg, isErr) {
    el.status.textContent = msg || '';
    el.status.classList.toggle('err', !!isErr);
  }

  /* ---- lookup ---- */
  const MAX_ITEMS = 12;

  el.form.addEventListener('submit', async e => {
    e.preventDefault();
    let list = Meta.parseInputs(el.doi.value);
    if (!list.length) { say('Paste a DOI or web link first.', true); return; }

    const trimmed = list.length > MAX_ITEMS;
    if (trimmed) list = list.slice(0, MAX_ITEMS);

    el.go.disabled = true;
    say(list.length === 1
      ? (list[0].type === 'doi' ? 'Looking up ' + list[0].value + '…' : 'Preparing ' + list[0].value + '…')
      : 'Preparing ' + list.length + ' resources…');

    const results = await Promise.all(list.map(async item => {
      try {
        const meta = item.type === 'doi'
          ? await Meta.lookup(item.value)
          : Meta.resourceFromUrl(item.value);
        return { ok: true, meta, item };
      } catch (err) {
        return { ok: false, item, message: err.message };
      }
    }));

    const found = results.filter(r => r.ok).map(r => r.meta);
    const failed = results.filter(r => !r.ok);

    if (!found.length) {
      say(failed.length === 1 ? failed[0].message : 'None of those resources could be prepared.', true);
      el.go.disabled = false;
      return;
    }

    papers = found;
    metaToFields();
    draw();

    if (failed.length) {
      say('Rendered ' + found.length + ' of ' + results.length +
          ' — failed: ' + failed.map(f => f.item.value).join(', ') + '.', true);
    } else if (found.length === 1) {
      say(found[0].kind === 'doi'
        ? 'Found via ' + found[0].source + '.'
        : 'Link ready. Edit the title or label if needed.');
    } else {
      say('Prepared all ' + found.length + ' resources.' +
          (trimmed ? ' Only the first ' + MAX_ITEMS + ' were used.' : ''));
    }

    const hash = found.map(m => m.kind === 'doi' ? m.doi : m.url).join('\n');
    // Office.js removes history.replaceState inside the PowerPoint task pane.
    if (typeof history.replaceState === 'function') {
      history.replaceState(null, '', '#' + encodeURIComponent(hash));
    }
    el.go.disabled = false;
  });

  // Enter fetches; Shift+Enter adds another resource on its own line.
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
    const base = (m.authors || m.journal || m.title || 'banner').split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
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

  // Shared hooks for other front-ends (e.g. the PowerPoint task pane).
  window.Banner = {
    svg: () => doc ? Render.toSVG(doc, backdrop()) : null,
    pngDataURL: () => doc ? Render.toCanvas(doc, EXPORT_SCALE, null, backdrop()).toDataURL('image/png') : null,
    size: () => doc ? { width: doc.width, height: doc.height } : null,
    say
  };

  /* ---- boot ---- */
  metaToFields();

  function fromHash() {
    const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
    const wanted = Meta.parseInputs(raw);
    if (!wanted.length) return false;
    const normalized = wanted.map(x => x.value).join('|').toLowerCase();
    const showing = Meta.parseInputs(el.doi.value).map(x => x.value).join('|').toLowerCase();
    if (normalized === showing) return true;
    el.doi.value = wanted.map(x => x.value).join('\n');
    growInput();
    el.form.dispatchEvent(new Event('submit'));
    return true;
  }

  window.addEventListener('hashchange', fromHash);

  // Wait for webfont-less metrics to settle before the first measure pass.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    syncThemeToBackdrop();
    draw();
    if (!fromHash()) say('Showing an example. Paste a DOI or web link to replace it.');
  });
})();
