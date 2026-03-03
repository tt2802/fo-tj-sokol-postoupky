// Auto-fill fields when a related upcoming match is selected
(function() {
  let upcomingMatches = [];

  // Load upcoming matches data
  async function loadUpcomingMatches() {
    try {
      const response = await fetch('/_data/upcoming_matches.json');
      const data = await response.json();
      upcomingMatches = data.items || [];
      setupAutoFillListener();
    } catch (err) {
      console.log('Could not load upcoming matches:', err);
    }
  }

  // Start loading when doc is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUpcomingMatches);
  } else {
    loadUpcomingMatches();
  }

  function setupAutoFillListener() {
    // Check periodically for the relation field (Decap CMS renders fields dynamically)
    const checkInterval = setInterval(() => {
      const relationField = findRelationField();
      if (relationField && !relationField._autoFillSetup) {
        relationField._autoFillSetup = true;
        relationField.addEventListener('change', handleAutoFill);
        clearInterval(checkInterval);
      }
    }, 300);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  function findRelationField() {
    // Try to find by name attribute
    let field = document.querySelector('[name="relatedUpcoming"]');
    if (field) return field;

    // Try to find by aria-label (Decap CMS uses accessibility attributes)
    const allInputs = document.querySelectorAll('input[role="combobox"], input[type="text"]');
    for (let input of allInputs) {
      if (input.getAttribute('aria-label')?.includes('Převzít') ||
          input.getAttribute('placeholder')?.includes('Převzít')) {
        return input;
      }
    }
    return null;
  }

  function handleAutoFill(e) {
    const slug = e.target.value;
    if (!slug || slug.trim() === '') return;

    // Find the matching upcoming match
    const match = upcomingMatches.find(m => m.slug === slug);
    if (!match) return;

    // Wait a bit for Decap to render fields, then fill them
    setTimeout(() => {
      fillField('team', match.team);
      fillField('category', match.category);
      fillField('date', match.date);
      fillField('home', match.home);
      fillField('away', match.away);
      fillField('isHome', match.isHome);
      fillField('venue', match.venue);
      fillField('season', match.season);
      fillField('competition', match.competition);
      fillField('round', match.round);
    }, 100);
  }

  function fillField(fieldName, value) {
    if (value === null || value === undefined) return;

    // Try different selectors for different field types
    const selectors = [
      `input[name="${fieldName}"]`,
      `select[name="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `[name="${fieldName}"]`
    ];

    let field = null;
    for (const selector of selectors) {
      field = document.querySelector(selector);
      if (field) break;
    }

    if (field) {
      field.value = value;
      // Trigger events so Decap CMS recognizes the change
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  }
})();
