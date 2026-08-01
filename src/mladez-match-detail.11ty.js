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

    function getYouTubeId(url) {
      if (!url) return '';
      if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0].split('&')[0].trim();
      if (url.includes('youtube.com/shorts/')) return url.split('youtube.com/shorts/')[1].split('?')[0].split('&')[0].trim();
      if (url.includes('v=')) return url.split('v=')[1].split('&')[0].trim();
      if (url.includes('/embed/')) return url.split('/embed/')[1].split('?')[0].split('&')[0].trim();
      return '';
    }

    function renderMediaEmbed(urlRaw, heading) {
      const url = normalizeUrl(urlRaw);
      if (!url) return '';

      const lower = url.toLowerCase();
      const ytId = getYouTubeId(url);
      const isVideoFile = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg');

      if (ytId) {
        return `
<h2>${heading}</h2>
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0 2rem; border-radius: 12px;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    src="https://www.youtube-nocookie.com/embed/${escapeAttr(ytId)}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    title="${heading}">
  </iframe>
</div>`;
      }

      if (isVideoFile) {
        return `
<h2>${heading}</h2>
<video controls preload="metadata" style="width: 100%; max-width: 900px; margin: 1rem 0 2rem; border-radius: 12px; background: #000;">
  <source src="${escapeAttr(url)}" type="video/${lower.endsWith('.webm') ? 'webm' : lower.endsWith('.ogg') ? 'ogg' : 'mp4'}">
  Váš prohlížeč nepodporuje video element.
</video>`;
      }

      if (lower.includes('facebook.com')) {
        const pluginUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=1280`;
        return `
<h2>${heading}</h2>
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0 2rem; border-radius: 12px;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    src="${escapeAttr(pluginUrl)}"
    loading="lazy"
    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
    allowfullscreen
    title="${heading}">
  </iframe>
</div>`;
      }

      if (lower.includes('veo.co')) {
        return `
<h2>${heading}</h2>
<div class="card" style="margin: 1rem 0 2rem; padding: 1rem 1.25rem; border-left: 4px solid var(--primary);">
  <p class="muted" style="margin: 0 0 .75rem;">Veo na některých webech blokuje vložené přehrávání (CSP).</p>
  <p style="margin:0;"><a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="btn btn--secondary">Otevřít ve Veo</a></p>
</div>`;
      }

      return `<h2>${heading}</h2><p><a href="${escapeAttr(url)}" target="_blank" rel="noopener">Otevřít přenos/video</a></p>`;
    }
    
    const hasScore = m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined;
    const liveHtml = !hasScore && m.liveUrl
      ? `<h2>Živý přenos</h2><div class="card" style="margin: 1rem 0 2rem; padding: 1rem 1.25rem; border-left: 4px solid #ef4444;"><p class="muted" style="margin:0 0 .75rem;">Přenos otevřete přes oficiální odkaz.</p><p style="margin:0;"><a href="${escapeAttr(m.liveUrl)}" target="_blank" rel="noopener" class="btn btn--live">Sledovat živě</a></p></div>`
      : '';
    const videoHtml = m.videoUrl ? renderMediaEmbed(m.videoUrl, 'Video ze zápasu') : '';

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
