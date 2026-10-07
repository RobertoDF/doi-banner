/* DOI / Link Banner — PowerPoint task-pane glue. Rendering lives in app.js. */

(() => {
  const btn = document.getElementById('insert');
  const say = (msg, isErr) => window.Banner && window.Banner.say(msg, isErr);
  let ready = false;

  function outsideOffice(reason) {
    if (ready) return;
    btn.disabled = true;
    btn.title = reason;
  }

  // Office.js may fail to load (offline, blocked) or the page may be opened
  // in a plain browser; in both cases the pane still works for downloads.
  if (typeof Office === 'undefined') {
    outsideOffice('Open this page inside PowerPoint to insert banners.');
    return;
  }

  Office.onReady(info => {
    if (info && info.host === Office.HostType.PowerPoint) {
      ready = true;
      btn.disabled = false;
      btn.title = '';
    } else {
      outsideOffice('Open this page inside PowerPoint to insert banners.');
    }
  });

  // Insert at half the export pixel size in points, capped to fit a 16:9 slide.
  function imageSize() {
    const s = window.Banner.size();
    const w = Math.min(s.width / 2, 860);
    return { imageWidth: Math.round(w), imageHeight: Math.round(w * s.height / s.width) };
  }

  function setData(data, coercionType) {
    return new Promise((resolve, reject) => {
      Office.context.document.setSelectedDataAsync(
        data, Object.assign({ coercionType }, imageSize()),
        r => r.status === Office.AsyncResultStatus.Succeeded
          ? resolve()
          : reject(new Error(r.error ? r.error.message : 'Insert failed')));
    });
  }

  function svgSupported() {
    const req = Office.context.requirements;
    return !!(req && req.isSetSupported('ImageCoercion', '1.2') && Office.CoercionType.XmlSvg);
  }

  async function insert() {
    const svg = window.Banner && window.Banner.svg();
    if (!svg) { say('Nothing to insert yet.', true); return; }
    btn.disabled = true;
    try {
      if (svgSupported()) {
        try {
          await setData(svg, Office.CoercionType.XmlSvg);
          say('Inserted as SVG.');
          return;
        } catch (e) {
          // Some hosts advertise SVG but reject it; fall through to PNG.
        }
      }
      const png = window.Banner.pngDataURL().replace(/^data:image\/png;base64,/, '');
      await setData(png, Office.CoercionType.Image);
      say('Inserted as PNG.');
    } catch (e) {
      say('Could not insert: ' + e.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', insert);
})();
