// Match detail pages for Muži team
module.exports = class {
  data() {
    return {
      layout: "layouts/page.njk",
      pagination: {
        data: "matchesArray",
        size: 1,
        alias: "match",
        before: function(data) {
          return data.filter(m => m.team === 'muzi' && m.slug);
        }
      },
      permalink: data => `/muzi/zapasy/${data.match.slug}/index.html`,
      eleventyExcludeFromCollections: true
    };
  }

  render(data) {
    const m = data.match;
    const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || '/';
    const fb = data.firebase || {};
    const players = (data.players && data.players.men) || [];
    const playerNames = players.map(p => p.name);
    const hasScore = m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined;
    
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

    // Build voting section HTML (only for played matches with a score)
    let votingHtml = '';
    if (hasScore && fb.apiKey && fb.apiKey !== 'FIREBASE_API_KEY') {
      const optionsHtml = playerNames.map(n => {
        const escaped = n.replace(/"/g, '&quot;').replace(/</g, '&lt;');
        return `<option value="${escaped}">${escaped}</option>`;
      }).join('');
      const slug = (m.slug || '').replace(/"/g, '');

      votingHtml = `
<section class="motm-section" id="motmSection">
  <h2>⭐ Hráč zápasu — hlasování</h2>

  <div id="motmAuth">
    <button id="motmLogin" class="chat-google-btn">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="18" height="18">
      Přihlásit se pro hlasování
    </button>
  </div>

  <div id="motmVoteForm" style="display:none;" class="motm-form">
    <select id="motmSelect" class="motm-select">
      <option value="">— Vyber hráče —</option>
      ${optionsHtml}
    </select>
    <button id="motmVoteBtn" class="btn btn--sm">Hlasovat</button>
    <span id="motmStatus" class="muted"></span>
  </div>

  <div id="motmResults" class="motm-results"></div>
</section>

<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script>
(function() {
  var cfg = ${JSON.stringify(fb)};
  firebase.initializeApp(cfg);
  var auth = firebase.auth();
  var db = firebase.firestore();
  var matchSlug = "${slug}";
  var currentUser = null;

  var loginBtn = document.getElementById('motmLogin');
  var authEl = document.getElementById('motmAuth');
  var formEl = document.getElementById('motmVoteForm');
  var selectEl = document.getElementById('motmSelect');
  var voteBtn = document.getElementById('motmVoteBtn');
  var statusEl = document.getElementById('motmStatus');
  var resultsEl = document.getElementById('motmResults');
  var provider = new firebase.auth.GoogleAuthProvider();

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  loginBtn.addEventListener('click', function() {
    auth.signInWithPopup(provider).catch(function(err) {
      authEl.innerHTML = '<div style="color:#dc2626;">⚠️ ' + escapeHtml(err.message) + '</div>';
    });
  });

  auth.onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
      authEl.style.display = 'none';
      formEl.style.display = 'flex';
      // Check if already voted
      db.collection('matchVotes').doc(matchSlug)
        .collection('votes').doc(user.uid).get()
        .then(function(doc) {
          if (doc.exists) {
            statusEl.textContent = 'Hlasoval/a jsi za: ' + doc.data().player;
            selectEl.disabled = true;
            voteBtn.disabled = true;
            voteBtn.style.opacity = '0.5';
          }
        });
    } else {
      authEl.style.display = '';
      formEl.style.display = 'none';
    }
  });

  voteBtn.addEventListener('click', function() {
    var player = selectEl.value;
    if (!player || !currentUser) return;
    voteBtn.disabled = true;
    db.collection('matchVotes').doc(matchSlug)
      .collection('votes').doc(currentUser.uid).set({
        player: player,
        userName: currentUser.displayName,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        statusEl.textContent = 'Hlasoval/a jsi za: ' + player;
        selectEl.disabled = true;
        voteBtn.style.opacity = '0.5';
      }).catch(function(err) {
        statusEl.textContent = 'Chyba: ' + err.message;
        voteBtn.disabled = false;
      });
  });

  // Live results
  db.collection('matchVotes').doc(matchSlug)
    .collection('votes').onSnapshot(function(snap) {
      var counts = {};
      var total = 0;
      snap.forEach(function(doc) {
        var p = doc.data().player;
        counts[p] = (counts[p] || 0) + 1;
        total++;
      });
      if (total === 0) {
        resultsEl.innerHTML = '<p class="muted">Zatím nikdo nehlasoval.</p>';
        return;
      }
      var sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; });
      var html = '<div class="motm-bars">';
      sorted.forEach(function(item, i) {
        var pct = Math.round(item[1] / total * 100);
        html += '<div class="motm-bar-row">' +
          '<span class="motm-bar-name">' + (i === 0 ? '⭐ ' : '') + escapeHtml(item[0]) + '</span>' +
          '<div class="motm-bar-track"><div class="motm-bar-fill' + (i === 0 ? ' motm-bar-fill--top' : '') + '" style="width:' + pct + '%"></div></div>' +
          '<span class="motm-bar-count">' + item[1] + ' (' + pct + '%)</span>' +
          '</div>';
      });
      html += '<p class="muted" style="margin-top:0.5rem;">Celkem hlasů: ' + total + '</p></div>';
      resultsEl.innerHTML = html;
    });
})();
</script>`;
    }

    return `
<nav class="muted" aria-label="Drobečková navigace">
  <a href="${pathPrefix}muzi/zapasy/">Zápasy Mužů</a>
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

${hasScore ? `
<div class="card" style="margin: 2rem 0; padding: 1.5rem; text-align: center; background: var(--primary-light);">
  <h2 style="margin: 0; font-size: 2.5rem; color: var(--primary);">
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
${m.cards.map(c => {
  if (typeof c === 'string') return `  <li>${c}</li>`;
  const emoji = c.cardType === 'red' ? '🟥' : '🟨';
  return `  <li>${emoji} ${c.player}</li>`;
}).join('\n')}
</ul>` : ''}

${m.substitutions && m.substitutions.length > 0 ? `
<h2>🔄 Střídání</h2>
<ul>
${m.substitutions.map(s => {
  if (typeof s === 'string') return `  <li>${s}</li>`;
  return `  <li>${s.playerOut} ➜ ${s.playerIn}</li>`;
}).join('\n')}
</ul>` : ''}

${m.referee ? `<p class="muted"><strong>Rozhodčí:</strong> ${m.referee}</p>` : ''}

${votingHtml}
`;
  }
};
