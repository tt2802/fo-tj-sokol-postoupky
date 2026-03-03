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
      console.error('Could not load upcoming matches:', err);
    }
  }

  // Start loading when doc is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUpcomingMatches);
  } else {
    loadUpcomingMatches();
  }

  function setupAutoFillListener() {
    // Use MutationObserver to watch for changes in the form
    const observer = new MutationObserver(() => {
      attachListenersToFields();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value']
    });

    // Also try immediately
    setTimeout(attachListenersToFields, 500);
  }

  function attachListenersToFields() {
    // Look for the relation field container
    const labels = document.querySelectorAll('label');
    for (let label of labels) {
      if (label.textContent.includes('Převzít')) {
        const parent = label.closest('[class*="field"]') || label.closest('div');
        if (parent) {
          // Look for any input/select in the parent
          const inputs = parent.querySelectorAll('input, select');
          for (let input of inputs) {
            if (!input._autoFillAttached) {
              input._autoFillAttached = true;
              // Monitor for changes
              input.addEventListener('change', handleAutoFill);
              input.addEventListener('blur', handleAutoFill);
              // Also watch for value changes (for combobox)
              const observer = new MutationObserver(() => {
                if (input.value) handleAutoFill();
              });
              observer.observe(input, { attributes: true, attributeFilter: ['value'] });
            }
          }
        }
      }
    }
  }

  function handleAutoFill() {
    // Find the input with the selected slug value
    const labels = document.querySelectorAll('label');
    let selectedSlug = null;

    for (let label of labels) {
      if (label.textContent.includes('Převzít')) {
        const parent = label.closest('[class*="field"]') || label.closest('div');
        if (parent) {
          const input = parent.querySelector('input, select');
          if (input && input.value) {
            selectedSlug = input.value;
            break;
          }
        }
      }
    }

    if (!selectedSlug || selectedSlug.trim() === '') return;

    // Find the matching upcoming match
    const match = upcomingMatches.find(m => m.slug === selectedSlug);
    if (!match) {
      console.log('No match found for slug:', selectedSlug);
      return;
    }

    console.log('Auto-filling with match:', match);

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

    // For Decap CMS, we need to find inputs by looking at parent containers
    const labels = document.querySelectorAll('label');
    for (let label of labels) {
      if (label.textContent.trim().toLowerCase().includes(fieldName.toLowerCase()) ||
          label.textContent.includes('Domácí') && fieldName === 'home' ||
          label.textContent.includes('Hosté') && fieldName === 'away') {
        
        const field = label.closest('[class*="field"]')?.querySelector('input, select, textarea');
        if (field) {
          field.value = value;
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('blur', { bubbles: true }));
          console.log(`Filled ${fieldName}:`, value);
          return;
        }
      }
    }

    // Fallback: try by name attribute
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.value = value;
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`Filled ${fieldName}:`, value);
    }
  }
})();
