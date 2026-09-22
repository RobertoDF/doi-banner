/* DOI Banner — metadata lookup.
   Crossref first (best journal metadata), DataCite second, doi.org CSL as a last resort. */

const Meta = (() => {

  const DOI_RE = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

  function normalize(input) {
    if (!input) return null;
    const m = String(input).trim().match(DOI_RE);
    return m ? m[0].replace(/[.,;]+$/, '') : null;
  }

  async function getJSON(url, headers) {
    const r = await fetch(url, { headers: headers || {} });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function firstString(v) {
    if (Array.isArray(v)) return v.length ? String(v[0]) : '';
    return v ? String(v) : '';
  }

  /* Collapse the author list the way a slide would: up to three family names. */
  function shortAuthors(people) {
    const names = (people || [])
      .map(a => a.family || a.name || a.literal || '')
      .filter(Boolean);
    if (!names.length) return '';
    if (names.length <= 3) return names.join(', ');
    return names.slice(0, 3).join(', ');
  }

  function fromCrossref(msg) {
    const issued = (msg.issued && msg.issued['date-parts'] && msg.issued['date-parts'][0]) || [];
    return {
      title: firstString(msg.title).replace(/\s+/g, ' ').trim(),
      authors: shortAuthors(msg.author),
      authorCount: (msg.author || []).length,
      journal: firstString(msg['short-container-title']) || firstString(msg['container-title']),
      journalFull: firstString(msg['container-title']),
      year: issued[0] ? String(issued[0]) : '',
      volume: msg.volume ? String(msg.volume) : '',
      pages: msg.page ? String(msg.page).replace(/-+/g, '\u2013') : '',
      doi: (msg.DOI || '').toLowerCase(),
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
    return {
      title: firstString((at.titles || []).map(t => t.title)),
      authors: shortAuthors(people),
      authorCount: people.length,
      journal: container.title || at.publisher || '',
      journalFull: container.title || at.publisher || '',
      year: at.publicationYear ? String(at.publicationYear) : '',
      volume: container.volume ? String(container.volume) : '',
      pages: container.firstPage
        ? container.firstPage + (container.lastPage ? '\u2013' + container.lastPage : '')
        : '',
      doi: (at.doi || '').toLowerCase(),
      source: 'DataCite'
    };
  }

  function fromCSL(d) {
    const issued = (d.issued && d.issued['date-parts'] && d.issued['date-parts'][0]) || [];
    return {
      title: firstString(d.title).replace(/\s+/g, ' ').trim(),
      authors: shortAuthors(d.author),
      authorCount: (d.author || []).length,
      journal: firstString(d['container-title-short']) || firstString(d['container-title']),
      journalFull: firstString(d['container-title']),
      year: issued[0] ? String(issued[0]) : '',
      volume: d.volume ? String(d.volume) : '',
      pages: d.page ? String(d.page).replace(/-+/g, '\u2013') : '',
      doi: (d.DOI || '').toLowerCase(),
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
          return meta;
        }
      } catch (e) { lastErr = e; }
    }
    throw new Error('No metadata found for ' + doi + (lastErr ? ' (' + lastErr.message + ')' : ''));
  }

  return { lookup, normalize };
})();

