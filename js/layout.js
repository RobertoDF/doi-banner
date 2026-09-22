/* DOI Banner — layout engine.
   Produces a flat list of drawing primitives in banner coordinates.
   Both the canvas renderer and the SVG renderer consume this, so PNG and
   SVG output can never drift apart. */

const Layout = (() => {

  const PRESETS = {
    card:  { w: 1800, h: 500,  mode: 'stack', maxLines: 3 },
    strip: { w: 2400, h: 140,  mode: 'strip', maxLines: 1 }
  };

  const FONTS = {
    sans:    '"Avenir Next", Optima, "Segoe UI", system-ui, sans-serif',
    serif:   'Charter, "Iowan Old Style", Palatino, Georgia, serif',
    grotesk: '"Helvetica Neue", Arial, system-ui, sans-serif',
    mono:    'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
  };

  const _measureCanvas = document.createElement('canvas');
  const _ctx = _measureCanvas.getContext('2d');

  function fontString(run, size, family) {
    const style = run.italic ? 'italic ' : '';
    const weight = run.weight || 400;
    return `${style}${weight} ${size}px ${run.mono ? FONTS.mono : family}`;
  }

  function measure(run, size, family) {
    _ctx.font = fontString(run, size, family);
    return _ctx.measureText(run.text).width;
  }

  /* Split runs into lines that fit maxWidth. A run may break at spaces;
     weight and style ride along with each fragment. */
  function wrapRuns(runs, size, family, maxWidth) {
    const lines = [];
    let line = [];
    let lineW = 0;

    const pushLine = () => { if (line.length) lines.push({ runs: line, width: lineW }); line = []; lineW = 0; };

    runs.forEach(run => {
      const words = run.text.split(/(\s+)/).filter(s => s !== '');
      words.forEach(word => {
        const frag = Object.assign({}, run, { text: word });
        const w = measure(frag, size, family);
        const isSpace = /^\s+$/.test(word);

        if (lineW + w > maxWidth && lineW > 0 && !isSpace) {
          pushLine();
        }
        if (isSpace && lineW === 0) return; // no leading spaces
        line.push(frag);
        lineW += w;
      });
    });
    pushLine();

    // merge adjacent fragments that share styling, to keep output tidy
    lines.forEach(l => {
      const merged = [];
      l.runs.forEach(r => {
        const prev = merged[merged.length - 1];
        if (prev && prev.weight === r.weight && prev.italic === r.italic &&
            prev.mono === r.mono && prev.opacity === r.opacity && prev.fill === r.fill) {
          prev.text += r.text;
        } else {
          merged.push(Object.assign({}, r));
        }
      });
      l.runs = merged;
      l.width = merged.reduce((s, r) => s + measure(r, size, family), 0);
    });

    return lines;
  }

  function titleRuns(title) {
    // "Name: the rest of it" reads better as bold name + light subtitle
    const i = title.indexOf(': ');
    if (i > 0 && i < title.length * 0.6) {
      return [
        { text: title.slice(0, i + 1), weight: 600 },
        { text: ' ' + title.slice(i + 2), weight: 400, opacity: 0.74 }
      ];
    }
    return [{ text: title, weight: 600 }];
  }

  function metaRuns(m, dim) {
    const runs = [];
    const sep = () => runs.push({ text: '  \u2022  ', weight: 400, opacity: dim });

    if (m.authors) {
      runs.push({ text: m.authors, weight: 600 });
      if (m.authorCount > 3) runs.push({ text: ' et al.', weight: 400 });
    }
    if (m.journal) {
      if (runs.length) sep();
      runs.push({ text: m.journal, weight: 400, italic: true });
    }
    if (m.volume) runs.push({ text: ' ' + m.volume, weight: 600 });
    if (m.pages) runs.push({ text: ', ' + m.pages, weight: 400 });
    if (m.year) { if (runs.length) sep(); runs.push({ text: m.year, weight: 400 }); }
    return runs;
  }

  function qrMatrix(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const rows = [];
    for (let r = 0; r < n; r++) {
      const row = [];
      for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
      rows.push(row);
    }
    return rows;
  }

  /* ---- main entry ---------------------------------------------------- */

  function build(meta, opt) {
    const preset = PRESETS[opt.preset] || PRESETS.card;
    const W = preset.w, H = preset.h;
    const family = FONTS[opt.typeface] || FONTS.sans;
    const ink = opt.theme === 'dark' ? '#1A1A1A' : '#FFFFFF';
    const dim = opt.theme === 'dark' ? 0.62 : 0.66;
    const prims = [];

    return preset.mode === 'strip'
      ? buildStrip(meta, opt, { W, H, family, ink, dim, prims })
      : buildStack(meta, opt, { W, H, family, ink, dim, prims, maxLines: preset.maxLines });
  }

  function buildStack(m, opt, s) {
    const { W, H, family, ink, dim, prims } = s;
    const padX = Math.round(W * 0.036);
    const ruleW = opt.showRule ? Math.max(4, Math.round(W * 0.0034)) : 0;
    const ruleGap = opt.showRule ? Math.round(W * 0.024) : 0;

    const qrOn = opt.showQr && m.doi;
    const qrSize = qrOn ? Math.round(Math.min(H * 0.40, W * 0.115)) : 0;
    const platePad = qrOn && opt.qrPlate ? Math.round(qrSize * 0.10) : 0;
    const qrBox = qrSize + platePad * 2;
    const qrGap = qrOn ? Math.round(W * 0.030) : 0;

    const textX = padX + ruleW + ruleGap;
    const textW = W - textX - padX - (qrOn ? qrBox + qrGap : 0);

    const tRuns = titleRuns(m.title || '');
    const mRuns = metaRuns(m, dim);
    const doiText = opt.showDoi && m.doi ? 'doi.org/' + m.doi : '';

    // Shrink the type until the block fits both the line budget and the height.
    let titleSize = Math.round(Math.min(H * 0.115, W * 0.042));
    let lines, metaSize, doiSize, blockH;
    const minSize = titleSize * 0.55;

    for (;;) {
      metaSize = Math.round(titleSize * 0.50);
      doiSize = Math.round(titleSize * 0.36);
      lines = wrapRuns(tRuns, titleSize, family, textW);

      const titleH = lines.length * titleSize * 1.20;
      const metaH = mRuns.length ? metaSize * 1.45 : 0;
      const doiH = doiText ? doiSize * 1.5 : 0;
      const gap1 = mRuns.length ? Math.round(titleSize * 0.40) : 0;
      const gap2 = doiText ? Math.round(titleSize * 0.20) : 0;
      blockH = titleH + gap1 + metaH + gap2 + doiH;

      const fitsLines = lines.length <= s.maxLines;
      const fitsHeight = blockH <= H - Math.round(H * 0.14);
      if ((fitsLines && fitsHeight) || titleSize <= minSize) break;
      titleSize = Math.round(titleSize * 0.93);
    }

    let y = Math.round((H - blockH) / 2);
    const blockTop = y;

    // title
    lines.forEach(line => {
      let x = textX;
      const baseline = y + titleSize * 0.92;
      line.runs.forEach(run => {
        prims.push({
          t: 'text', x, y: baseline, size: titleSize, family,
          weight: run.weight || 400, italic: !!run.italic, mono: !!run.mono,
          fill: ink, opacity: run.opacity != null ? run.opacity : 1, text: run.text
        });
        x += measure(run, titleSize, family);
      });
      y += titleSize * 1.20;
    });

    // meta
    if (mRuns.length) {
      y += Math.round(titleSize * 0.40);
      let x = textX;
      const baseline = y + metaSize * 0.92;
      mRuns.forEach(run => {
        prims.push({
          t: 'text', x, y: baseline, size: metaSize, family,
          weight: run.weight || 400, italic: !!run.italic, mono: false,
          fill: ink, opacity: run.opacity != null ? run.opacity : 1, text: run.text
        });
        x += measure(run, metaSize, family);
      });
      y += metaSize * 1.45;
    }

    // doi
    if (doiText) {
      y += Math.round(titleSize * 0.20);
      prims.push({
        t: 'text', x: textX, y: y + doiSize * 0.92, size: doiSize, family,
        weight: 400, italic: false, mono: true,
        fill: ink, opacity: 0.58, text: doiText
      });
      y += doiSize * 1.5;
    }

    const blockBottom = y;

    // accent rule, spanning the text block
    if (opt.showRule) {
      prims.unshift({
        t: 'rect', x: padX, y: blockTop, w: ruleW, h: Math.max(1, blockBottom - blockTop),
        rx: ruleW / 2, fill: opt.accent, opacity: 1
      });
    }

    // qr, vertically centred on the block
    if (qrOn) {
      const qx = W - padX - qrBox;
      const qy = Math.round((H - qrBox) / 2);
      pushQr(prims, m.doi, qx, qy, qrSize, platePad, ink, opt);
    }

    return { width: W, height: H, prims };
  }

  function buildStrip(m, opt, s) {
    const { W: maxW, family, ink, dim, prims } = s;
    const padX = Math.round(maxW * 0.017);
    const padY = 30;
    const ruleW = opt.showRule ? Math.max(3, Math.round(maxW * 0.0025)) : 0;
    const ruleGap = opt.showRule ? Math.round(maxW * 0.010) : 0;
    const textX = padX + ruleW + ruleGap;

    const doiText = opt.showDoi && m.doi ? m.doi : '';
    let titleSize = 54;
    let metaSize, doiSize, lines, blockH;

    // Prefer a single line: shrink first, and only wrap to a second row when
    // the title is genuinely too long to stay legible.
    const fit = (maxLines, floor) => {
      for (;;) {
        metaSize = Math.round(titleSize * 0.62);
        doiSize = Math.round(titleSize * 0.56);
        lines = wrapRuns(titleRuns(m.title || ''), titleSize, family, maxW - textX - padX);
        blockH = lines.length * titleSize * 1.16 + Math.round(titleSize * 0.30) + metaSize * 1.30;
        if (lines.length <= maxLines || titleSize <= floor) return lines.length <= maxLines;
        titleSize = Math.round(titleSize * 0.95);
      }
    };

    if (!fit(1, 38)) { titleSize = 46; fit(2, 30); }

    const runs = [];
    if (m.authors) {
      runs.push({ text: m.authors.split(',')[0].trim(), weight: 600 });
      if (m.authorCount > 1) runs.push({ text: ' et al.', weight: 400 });
    }
    if (m.journal) {
      if (runs.length) runs.push({ text: '  \u2022  ', weight: 400, opacity: dim });
      runs.push({ text: m.journal, weight: 400, italic: true });
    }
    if (m.year) runs.push({ text: ' ' + m.year, weight: 400 });

    const metaW = runs.reduce((w, r) => w + measure(r, metaSize, family), 0);
    const doiGap = doiText && runs.length ? Math.round(metaSize * 1.4) : 0;
    const doiW = doiText ? measure({ text: doiText, mono: true }, doiSize, family) : 0;

    // The canvas is only as wide as the widest row — no dead space on the right.
    const titleW = lines.reduce((w, l) =>
      Math.max(w, l.runs.reduce((a, r) => a + measure(r, titleSize, family), 0)), 0);
    const W = Math.min(maxW, Math.ceil(Math.max(titleW, metaW + doiGap + doiW) + textX + padX));

    const H = Math.max(120, Math.round(blockH + padY * 2));
    let y = Math.round((H - blockH) / 2);
    const blockTop = y;

    lines.forEach(line => {
      let x = textX;
      const baseline = y + titleSize * 0.90;
      line.runs.forEach(run => {
        prims.push({
          t: 'text', x, y: baseline, size: titleSize, family,
          weight: run.weight || 400, italic: !!run.italic, mono: !!run.mono,
          fill: ink, opacity: run.opacity != null ? run.opacity : 1, text: run.text
        });
        x += measure(run, titleSize, family);
      });
      y += titleSize * 1.16;
    });

    y += Math.round(titleSize * 0.30);
    const metaBaseline = y + metaSize * 0.90;

    let x = textX;
    runs.forEach(run => {
      prims.push({
        t: 'text', x, y: metaBaseline, size: metaSize, family,
        weight: run.weight || 400, italic: !!run.italic, mono: false,
        fill: ink, opacity: run.opacity != null ? run.opacity : dim + 0.18, text: run.text
      });
      x += measure(run, metaSize, family);
    });

    if (doiText) {
      prims.push({
        t: 'text', x: x + doiGap, y: metaBaseline, size: doiSize, family,
        weight: 400, italic: false, mono: true, fill: ink, opacity: 0.55, text: doiText
      });
    }

    y += metaSize * 1.30;

    if (opt.showRule) {
      prims.unshift({
        t: 'rect', x: padX, y: blockTop, w: ruleW, h: Math.max(1, y - blockTop),
        rx: ruleW / 2, fill: opt.accent, opacity: 1
      });
    }

    return { width: W, height: H, prims };
  }

  function pushQr(prims, doi, x, y, size, platePad, ink, opt) {
    const modules = qrMatrix('https://doi.org/' + doi);
    const n = modules.length;
    const box = size + platePad * 2;

    if (platePad > 0) {
      prims.push({ t: 'rect', x, y, w: box, h: box, rx: Math.round(box * 0.06), fill: '#FFFFFF', opacity: 1 });
    }
    prims.push({
      t: 'qr', x: x + platePad, y: y + platePad, size, modules: n, rows: modules,
      fill: platePad > 0 ? '#1A1A1A' : ink
    });
  }

  return { build, PRESETS, FONTS, qrMatrix };
})();
