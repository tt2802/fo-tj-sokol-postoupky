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
    
    let videoHtml = '';
    if (m.videoUrl) {
      const url = m.videoUrl.trim();
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let ytId = '';
        if (url.includes('youtu.be/')) ytId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) ytId = url.split('v=')[1].split('&')[0];
        else if (url.includes('/embed/')) ytId = url.split('/embed/')[1].split('?')[0];
        
        if (ytId) {
          videoHtml = `
<h2>📹 Video ze zápasu</h2>
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    src="https://www.youtube-nocookie.com/embed/${ytId}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    title="Video ze zápasu">
  </iframe>
</div>`;
        }
      } else if (url.endsWith('.mp4')) {
        videoHtml = `
<h2>📹 Video ze zápasu</h2>
<video controls style="width: 100%; max-width: 800px; margin: 2rem 0;">
  <source src="${url}" type="video/mp4">
  Váš prohlížeč nepodporuje video element.
</video>`;
      } else {
        videoHtml = `<h2>🔗 Video ze zápasu</h2><p><a href="${url}" target="_blank" rel="noopener">Otevřít video</a></p>`;
      }
    }

    const categoryNames = {
      'dorostenci': 'Dorostenci',
      'starsi-zaci': 'Starší žáci',
      'mlads-zaci': 'Mladší žáci',
      'skolicka': 'Školička'
    };
    const catName = categoryNames[m.category] || m.category;

    return `
<nav class="muted" aria-label="Drobečková navigace">
  <a href="${pathPrefix}mladez/${m.category}/zapasy/">${catName}</a>
  <span aria-hidden="true">›</span>
  <span>${m.home} vs ${m.away}</span>
</nav>

<h1>${m.home} vs ${m.away}</h1>

<p class="muted">
  ${new Date(m.date).toLocaleDateString('cs-CZ')}${m.time ? ' · ' + m.time : ''}
  ${m.season ? ' · Sezóna ' + m.season : ''}
  ${m.competition ? ' · ' + m.competition : ''}
</p>

${m.venue ? `<p><strong>Místo:</strong> ${m.venue}</p>` : ''}

${m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined ? `
<div class="card" style="--card-bg: #e8f5e9; margin: 2rem 0; padding: 1.5rem; text-align: center;">
  <h2 style="margin: 0; font-size: 2.5rem; color: #2e7d32;">
    ${m.homeScore} : ${m.awayScore}
  </h2>
</div>` : '<p class="muted">Výsledek zatím není k dispozici</p>'}

${videoHtml}

${m.report ? `<h2>Zpráva ze zápasu</h2><div class="content">${m.report || ''}</div>` : ''}

${m.lineup && m.lineup.length > 0 ? `
<h2>⚽ Sestava</h2>
<ul>
${m.lineup.map(p => `  <li>${p.player || p}</li>`).join('\n')}
</ul>` : ''}

${m.scorers && m.scorers.length > 0 ? `
<h2>🎯 Střelci</h2>
<ul>
${m.scorers.map(s => `  <li>${s.scorer || s}</li>`).join('\n')}
</ul>` : ''}

${m.cards && m.cards.length > 0 ? `
<h2>🟨 Karty</h2>
<ul>
${m.cards.map(c => `  <li>${c.card || c}</li>`).join('\n')}
</ul>` : ''}

${m.substitutions && m.substitutions.length > 0 ? `
<h2>🔄 Střídání</h2>
<ul>
${m.substitutions.map(s => `  <li>${s.substitution || s}</li>`).join('\n')}
</ul>` : ''}

${m.referee ? `<p class="muted"><strong>Rozhodčí:</strong> ${m.referee}</p>` : ''}
`;
  }
};
