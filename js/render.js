/* DOI Banner — renderers.
   One layout, two outputs: canvas (for preview + PNG) and SVG (for vector export).
   The background is transparent unless a backdrop colour is passed in. */

const Render = (() => {

  const BACKDROPS = { checker: null, dark: '#101418', light: '#FFFFFF' };

  function fontString(p) {
    const style = p.italic ? 'italic ' : '';
    return `${style}${p.weight} ${p.size}px ${p.mono ? Layout.FONTS.mono : p.family}`;
  }

  /* ---- canvas --------------------------------------------------------- */

  function toCanvas(doc, scale, canvas, backdrop) {
    const c = canvas || document.createElement('canvas');
    c.width = Math.round(doc.width * scale);
    c.height = Math.round(doc.height * scale);

    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.textBaseline = 'alphabetic';

    if (backdrop) {
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, doc.width, doc.height);
    }

    doc.prims.forEach(p => {
      ctx.globalAlpha = p.opacity != null ? p.opacity : 1;
      if (p.t === 'rect') {
        ctx.fillStyle = p.fill;
        roundRect(ctx, p.x, p.y, p.w, p.h, p.rx || 0);
        ctx.fill();
      } else if (p.t === 'text') {
        ctx.fillStyle = p.fill;
        ctx.font = fontString(p);
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.t === 'qr') {
        ctx.fillStyle = p.fill;
        const unit = p.size / p.modules;
        p.rows.forEach((row, r) => {
          let c0 = -1;
          for (let col = 0; col <= p.modules; col++) {
            const dark = col < p.modules && row[col];
            if (dark && c0 < 0) c0 = col;
            if (!dark && c0 >= 0) {
              ctx.fillRect(
                p.x + c0 * unit, p.y + r * unit,
                (col - c0) * unit + 0.4, unit + 0.4
              );
              c0 = -1;
            }
          }
        });
      }
    });

    ctx.restore();
    return c;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* ---- svg ------------------------------------------------------------ */

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const num = n => (Math.round(n * 100) / 100);

  function toSVG(doc, backdrop) {
    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" ` +
             `viewBox="0 0 ${doc.width} ${doc.height}" fill="none">`);

    if (backdrop) {
      out.push(`<rect x="0" y="0" width="${doc.width}" height="${doc.height}" fill="${backdrop}"/>`);
    }

    doc.prims.forEach(p => {
      const op = (p.opacity != null && p.opacity !== 1) ? ` opacity="${num(p.opacity)}"` : '';
      if (p.t === 'rect') {
        out.push(`<rect x="${num(p.x)}" y="${num(p.y)}" width="${num(p.w)}" height="${num(p.h)}"` +
                 (p.rx ? ` rx="${num(p.rx)}"` : '') + ` fill="${p.fill}"${op}/>`);
      } else if (p.t === 'text') {
        const family = p.mono ? Layout.FONTS.mono : p.family;
        out.push(`<text x="${num(p.x)}" y="${num(p.y)}" font-family="${esc(family)}" ` +
                 `font-size="${p.size}" font-weight="${p.weight}"` +
                 (p.italic ? ' font-style="italic"' : '') +
                 ` fill="${p.fill}"${op} xml:space="preserve">${esc(p.text)}</text>`);
      } else if (p.t === 'qr') {
        const unit = p.size / p.modules;
        const d = [];
        p.rows.forEach((row, r) => {
          let c0 = -1;
          for (let col = 0; col <= p.modules; col++) {
            const dark = col < p.modules && row[col];
            if (dark && c0 < 0) c0 = col;
            if (!dark && c0 >= 0) {
              d.push(`M${num(p.x + c0 * unit)} ${num(p.y + r * unit)}` +
                     `h${num((col - c0) * unit)}v${num(unit)}h${num(-(col - c0) * unit)}z`);
              c0 = -1;
            }
          }
        });
        out.push(`<path d="${d.join('')}" fill="${p.fill}"${op}/>`);
      }
    });

    out.push('</svg>');
    return out.join('\n');
  }

  /* ---- download helpers ---------------------------------------------- */

  function save(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function savePNG(doc, scale, filename, backdrop) {
    const c = toCanvas(doc, scale, null, backdrop);
    c.toBlob(b => save(b, filename), 'image/png');
  }

  function saveSVG(doc, filename, backdrop) {
    save(new Blob([toSVG(doc, backdrop)], { type: 'image/svg+xml' }), filename);
  }

  return { toCanvas, toSVG, savePNG, saveSVG, BACKDROPS };
})();
