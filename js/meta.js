/* DOI / Link Banner — metadata lookup.
   DOI inputs use Crossref, DataCite and doi.org. Generic URLs are rendered
   locally as editable resources without requiring a metadata proxy. */

const Meta = (() => {

  const DOI_RE = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

  function normalize(input) {
    if (!input) return null;
    const m = String(input).trim().match(DOI_RE);
    return m ? m[0].replace(/[.,;]+$/, '') : null;
  }

  function normalizeUrl(input) {
    if (!input) return null;
    let raw = String(input).trim();
    if (!/^https?:\/\//i.test(raw)) return null;
    try {
      const u = new URL(raw);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      u.hash = '';
      return u.href;
    } catch (e) {
      return null;
    }
  }

  /* Pull every DOI out of a pasted block — one per line, comma separated,
     a wall of doi.org URLs, whatever turns up. Duplicates are dropped. */
  function normalizeAll(input) {
    if (!input) return [];
    const found = String(input).match(new RegExp(DOI_RE.source, 'gi')) || [];
    const seen = new Set();
    const out = [];
    found.forEach(hit => {
      const doi = hit.replace(/[.,;]+$/, '');
      const key = doi.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(doi); }
    });
    return out;
  }

  function parseInputs(input) {
    if (!input) return [];
    const chunks = String(input)
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean);

    const out = [];
    const seen = new Set();

    chunks.forEach(chunk => {
      const doi = normalize(chunk);
      const doiUrlOnly = doi && /^https?:\/\/(?:dx\.)?doi\.org\//i.test(chunk);
      const url = normalizeUrl(chunk);

      let item = null;
      if (doi && (!url || doiUrlOnly)) item = { type: 'doi', value: doi };
      else if (url) item = { type: 'url', value: url };
      else if (doi) item = { type: 'doi', value: doi };

      if (!item) return;
      const key = item.type + ':' + item.value.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    });

    return out;
  }

  async function getJSON(url, headers) {
    const r = await fetch(url, { headers: headers || {} });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  const ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: '\u2019', nbsp: ' ',
    ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', middot: '\u00b7',
    lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
    times: '\u00d7', deg: '\u00b0', plusmn: '\u00b1', micro: '\u00b5',
    alpha: '\u03b1', beta: '\u03b2', gamma: '\u03b3', delta: '\u03b4',
    kappa: '\u03ba', lambda: '\u03bb', mu: '\u03bc', sigma: '\u03c3', omega: '\u03c9'
  };

  function clean(s) {
    if (!s) return '';
    return String(s)
      .replace(/<[^>]*>/g, '')
      .replace(/&#x([0-9a-f]+);/gi, (m, h) => codePoint(parseInt(h, 16), m))
      .replace(/&#(\d+);/g, (m, d) => codePoint(parseInt(d, 10), m))
      .replace(/&([a-z]+\d?);/gi, (m, name) => {
        const hit = ENTITIES[name.toLowerCase()];
        return hit != null ? hit : m;
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  function codePoint(n, fallback) {
    try { return String.fromCodePoint(n); } catch (e) { return fallback; }
  }

  function firstString(v) {
    if (Array.isArray(v)) return v.length ? clean(v[0]) : '';
    return v ? clean(v) : '';
  }

  function shortAuthors(people) {
    const names = (people || [])
      .map(a => clean(a.family || a.name || a.literal || ''))
      .filter(Boolean);
    if (!names.length) return '';
    if (names.length <= 3) return names.join(', ');
    return names.slice(0, 3).join(', ');
  }

  function fromCrossref(msg) {
    const issued = (msg.issued && msg.issued['date-parts'] && msg.issued['date-parts'][0]) || [];
    const doi = (msg.DOI || '').toLowerCase();
    return {
      kind: 'doi',
      title: firstString(msg.title).replace(/\s+/g, ' ').trim(),
      authors: shortAuthors(msg.author),
      authorCount: (msg.author || []).length,
      journal: firstString(msg['short-container-title']) || firstString(msg['container-title']),
      journalFull: firstString(msg['container-title']),
      year: issued[0] ? String(issued[0]) : '',
      volume: msg.volume ? String(msg.volume) : '',
      pages: msg.page ? String(msg.page).replace(/-+/g, '\u2013') : '',
      doi,
      url: doi ? 'https://doi.org/' + doi : '',
      source: 'Crossref'
    };
  }

  function fromDataCite(d) {
    const at = d.attributes || {};
    const people = (at.creators || []).map(c => ({
      family: c.familyName || c.name || '',
      name: c.name || ''
    }));
    const container = at.container || {};
    const doi = (at.doi || '').toLowerCase();
    return {
      kind: 'doi',
      title: firstString((at.titles || []).map(t => t.title)),
      authors: shortAuthors(people),
      authorCount: people.length,
      journal: clean(container.title || at.publisher || ''),
      journalFull: clean(container.title || at.publisher || ''),
      year: at.publicationYear ? String(at.publicationYear) : '',
      volume: container.volume ? String(container.volume) : '',
      pages: container.firstPage
        ? container.firstPage + (container.lastPage ? '\u2013' + container.lastPage : '')
        : '',
      doi,
      url: doi ? 'https://doi.org/' + doi : '',
      source: 'DataCite'
    };
  }

  function fromCSL(d) {
    const issued = (d.issued && d.issued['date-parts'] && d.issued['date-parts'][0]) || [];
    const doi = (d.DOI || '').toLowerCase();
    return {
      kind: 'doi',
      title: firstString(d.title).replace(/\s+/g, ' ').trim(),
      authors: shortAuthors(d.author),
      authorCount: (d.author || []).length,
      journal: firstString(d['container-title-short']) || firstString(d['container-title']),
      journalFull: firstString(d['container-title']),
      year: issued[0] ? String(issued[0]) : '',
      volume: d.volume ? String(d.volume) : '',
      pages: d.page ? String(d.page).replace(/-+/g, '\u2013') : '',
      doi,
      url: doi ? 'https://doi.org/' + doi : '',
      source: 'doi.org'
    };
  }

  async function lookup(raw) {
    const doi = normalize(raw);
    if (!doi) throw new Error('That does not look like a DOI.');

    const attempts = [
      async () => fromCrossref((await getJSON('https://api.crossref.org/works/' + encodeURIComponent(doi))).message),
      async () => fromDataCite(await getJSON('https://api.datacite.org/dois/' + encodeURIComponent(doi))),
      async () => fromCSL(await getJSON('https://doi.org/' + doi, { Accept: 'application/vnd.citationstyles.csl+json' }))
    ];

    let lastErr;
    for (const attempt of attempts) {
      try {
        const meta = await attempt();
        if (meta && meta.title) {
          meta.doi = meta.doi || doi;
          meta.url = meta.url || 'https://doi.org/' + meta.doi;
          return meta;
        }
      } catch (e) { lastErr = e; }
    }
    throw new Error('No metadata found for ' + doi + (lastErr ? ' (' + lastErr.message + ')' : ''));
  }

  function resourceFromUrl(raw) {
    const url = normalizeUrl(raw);
    if (!url) throw new Error('That does not look like an http(s) link.');
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    let title = host;
    const path = decodeURIComponent(u.pathname)
      .replace(/\/+$/, '')
      .split('/')
      .filter(Boolean)
      .pop();
    if (path) {
      title = path.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || host;
      title = title.replace(/\b\w/g, c => c.toUpperCase());
    }
    return {
      kind: 'url',
      title,
      authors: '',
      authorCount: 0,
      journal: host,
      journalFull: host,
      year: '',
      volume: '',
      pages: '',
      doi: '',
      url,
      source: 'Link'
    };
  }

  return { lookup, normalize, normalizeUrl, normalizeAll, parseInputs, resourceFromUrl };
})();
