// Match detail pages for Mladez categories
module.exports = class {
  data() {
    return {
      layout: "layouts/page.njk",
      pagination: {
        data: "matchesArray",
        size: 1,
        alias: "match",
        before: function(data) {
          return data.filter(m => m.team === 'mladez' && m.slug && m.category);
        }
      },
      permalink: data => `/mladez/${data.match.category}/zapasy/${data.match.slug}/index.html`,
      eleventyExcludeFromCollections: true
    };
  }

  render(data) {
    const m = data.match;
    const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || '/';

    const escapeAttr = (value) => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const normalizeUrl = (value) => String(value || '').trim();

    function renderMediaLink(urlRaw, heading, buttonLabel) {
      const url = normalizeUrl(urlRaw);
      if (!url) return '';

      return `
<h2>${heading}</h2>
<p><a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="btn btn--secondary">${buttonLabel}</a></p>`;
    }
    
    const hasScore = m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined;
    const liveHtml = !hasScore && m.liveUrl
      ? renderMediaLink(m.liveUrl, 'Živý přenos', 'Otevřít na YouTube')
      : '';
    const videoHtml = m.videoUrl ? renderMediaLink(m.videoUrl, 'Video ze zápasu', 'Přehrát video zápasu') : '';

    const categoryNames = {
      'dorostenci': 'Dorostenci',
      'dorostenky-d19': 'Dorostenkyně D19',
      'starsi-zaci': 'Starší žáci',
      'mlads-zaci': 'Mladší žáci',
      'mlads-zaci-b': 'Mladší žáci B',
      'skolicka': 'Školička'
    };
    const catName = categoryNames[m.category] || m.category;

    return `
<div class="content-card">
<h1>${m.home} vs ${m.away}</h1>

<p class="muted">
  ${new Date(m.date).toLocaleDateString('cs-CZ')}${m.time ? ' · ' + m.time : ''}
  ${m.season ? ' · Sezóna ' + m.season : ''}
  ${m.competition ? ' · ' + m.competition : ''}
</p>

${m.venue ? `<p><strong>Místo:</strong> ${m.venue}</p>` : ''}

${m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined ? `
<div class="card" style="margin: 2rem 0; padding: 1.5rem; text-align: center; background: var(--primary-light);">
  <h2 style="margin: 0; font-size: 2.5rem; color: var(--primary);">
    ${m.homeScore} : ${m.awayScore}
  </h2>
</div>` : '<p class="muted">Výsledek zatím není k dispozici</p>'}

${liveHtml}

${videoHtml}

${m.report ? `<h2>Zpráva ze zápasu</h2><div class="content">${m.report || ''}</div>` : ''}

${m.lineup && m.lineup.length > 0 ? `
<h2>Sestava</h2>
<ul>
${m.lineup.map(p => `  <li>${p.player || p}</li>`).join('\n')}
</ul>` : ''}

${m.scorers && m.scorers.length > 0 ? `
<h2>Střelci</h2>
<ul>
${m.scorers.map(s => `  <li>${s.scorer || s}</li>`).join('\n')}
</ul>` : ''}

${m.cards && m.cards.length > 0 ? `
<h2>Karty</h2>
<ul>
${m.cards.map(c => `  <li>${c.card || c}</li>`).join('\n')}
</ul>` : ''}

${m.substitutions && m.substitutions.length > 0 ? `
<h2>Střídání</h2>
<ul>
${m.substitutions.map(s => `  <li>${s.substitution || s}</li>`).join('\n')}
</ul>` : ''}

${m.referee ? `<p class="muted"><strong>Rozhodčí:</strong> ${m.referee}</p>` : ''}
</div>
`;
  }
};
