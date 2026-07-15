/**
 * Decap CMS – custom "match-selector" widget + preSave hook.
 *
 * Instead of the built-in relation widget (whose internal React state is
 * inaccessible from external JS), we register a CUSTOM widget that renders
 * a native <select>.  Because WE own the widget, we know exactly when the
 * user picks a match and can fill sibling form fields immediately.
 */
(function () {
  var LOG = "[CMS AutoFill]";
  var VERSION_KEY = "cmsDataVersion";
  var VERSION_EVENT = "cms-data-version-updated";
  var BROADCAST_NAME = "cms-data-sync";
  var bc = null;
  var upcomingMatches = [];
  var playedMatches = [];
  var calendarEvents = [];
  var playersData = null; // { men: [...], youth: { dorostenci: [...], ... } }

  function log() { console.log.apply(console, [LOG].concat([].slice.call(arguments))); }
  function warn() { console.warn.apply(console, [LOG].concat([].slice.call(arguments))); }

  /* ───────────── helpers ───────────── */

  function normalizeDate(v) {
    var s = String(v || "");
    return s.length >= 10 ? s.slice(0, 10) : s;
  }

  function toSlug(str) {
    var map = {'á':'a','č':'c','ď':'d','é':'e','ě':'e','í':'i','ň':'n','ó':'o',
               'ř':'r','š':'s','ť':'t','ú':'u','ů':'u','ý':'y','ž':'z'};
    return (str || "").toLowerCase()
      .replace(/[^\x00-\x7F]/g, function (c) { return map[c] || ''; })
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getPathPrefix() {
    var p = window.location.pathname || "";
    var i = p.indexOf("/admin/");
    return i < 0 ? "" : p.slice(0, i);
  }

  function getDataVersion() {
    try {
      return String(localStorage.getItem(VERSION_KEY) || "0");
    } catch (_) {
      return "0";
    }
  }

  function withVersion(url) {
    var sep = String(url).indexOf("?") > -1 ? "&" : "?";
    return url + sep + "v=" + encodeURIComponent(getDataVersion());
  }

  function bumpDataVersion(reason) {
    var next = String(Date.now());
    try {
      localStorage.setItem(VERSION_KEY, next);
    } catch (_) {}

    try {
      if (!bc && typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel(BROADCAST_NAME);
      }
      if (bc) {
        bc.postMessage({ type: VERSION_EVENT, version: next, reason: reason || "unknown" });
      }
    } catch (_) {}

    try {
      window.dispatchEvent(new CustomEvent(VERSION_EVENT, { detail: { version: next, reason: reason || "unknown" } }));
    } catch (_) {}

    log("Data version bumped:", next, "reason:", reason || "unknown");
    return next;
  }

  /* ───────────── data fetch ───────────── */

  function fetchMatches() {
    var prefix = getPathPrefix();
    var urls = [
      "https://raw.githubusercontent.com/tt2802/fo-tj-sokol-postoupky/main/src/_data/upcoming_matches.json",
      prefix ? prefix + "/_data/upcoming_matches.json" : null,
      "../_data/upcoming_matches.json",
      "/_data/upcoming_matches.json"
    ].filter(Boolean);
    return chainFetch(urls);
  }

  function chainFetch(urls) {
    if (!urls.length) return Promise.resolve([]);
    var currentUrl = withVersion(urls[0]);
    return fetch(currentUrl, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var items = Array.isArray(d && d.items) ? d.items : [];
        log("Loaded", items.length, "upcoming matches from", currentUrl);
        return items;
      })
      .catch(function () { return chainFetch(urls.slice(1)); });
  }

  function fetchPlayers() {
    var prefix = getPathPrefix();
    var urls = [
      "https://raw.githubusercontent.com/tt2802/fo-tj-sokol-postoupky/main/src/_data/players.json",
      prefix ? prefix + "/_data/players.json" : null,
      "../_data/players.json",
      "/_data/players.json"
    ].filter(Boolean);
    return chainFetchRaw(urls);
  }

  function fetchPlayedMatches() {
    var prefix = getPathPrefix();
    var urls = [
      "https://raw.githubusercontent.com/tt2802/fo-tj-sokol-postoupky/main/src/_data/played_matches.json",
      prefix ? prefix + "/_data/played_matches.json" : null,
      "../_data/played_matches.json",
      "/_data/played_matches.json"
    ].filter(Boolean);
    return chainFetch(urls);
  }

  function extractCalendarItems(payload) {
    if (!payload || typeof payload !== "object") return [];

    if (Array.isArray(payload.items)) return payload.items;
    if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;

    if (typeof payload.raw === "string") {
      try {
        var parsed = JSON.parse(payload.raw);
        if (parsed && Array.isArray(parsed.items)) return parsed.items;
      } catch (_) {}
    }

    return [];
  }

  function fetchCalendarEvents() {
    var prefix = getPathPrefix();
    var urls = [
      "https://raw.githubusercontent.com/tt2802/fo-tj-sokol-postoupky/main/src/_data/calendar_events.json",
      prefix ? prefix + "/_data/calendar_events.json" : null,
      "../_data/calendar_events.json",
      "/_data/calendar_events.json"
    ].filter(Boolean);
    return chainFetchRaw(urls).then(function (data) {
      return extractCalendarItems(data);
    });
  }

  function listSize(listLike) {
    if (!listLike) return 0;
    if (typeof listLike.size === "number") return listLike.size;
    if (Array.isArray(listLike)) return listLike.length;
    if (listLike.toJS) {
      var arr = listLike.toJS();
      return Array.isArray(arr) ? arr.length : 0;
    }
    return 0;
  }

  function confirmDangerousEmptySave(kindLabel, previousCount) {
    var msg =
      "Chystáte se uložit PRÁZDNÝ seznam „" + kindLabel + "“.\n\n" +
      "Původně obsahoval " + previousCount + " položek.\n" +
      "Pokračovat ve smazání všech položek?";
    try {
      return window.confirm(msg);
    } catch (_) {
      return false;
    }
  }

  function refreshCaches() {
    return Promise.all([
      fetchMatches().then(function (items) {
        upcomingMatches = items || [];
      }).catch(function () {}),
      fetchPlayedMatches().then(function (items) {
        playedMatches = items || [];
      }).catch(function () {}),
      fetchCalendarEvents().then(function (items) {
        calendarEvents = items || [];
      }).catch(function () {}),
      fetchPlayers().then(function (d) {
        playersData = d || playersData;
      }).catch(function () {})
    ]);
  }

  function chainFetchRaw(urls) {
    if (!urls.length) return Promise.resolve(null);
    var currentUrl = withVersion(urls[0]);
    return fetch(currentUrl, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        log("Loaded players from", currentUrl);
        return d;
      })
      .catch(function () { return chainFetchRaw(urls.slice(1)); });
  }

  function registerVersionSync(onRefresh) {
    function handleVersionUpdate() {
      if (typeof onRefresh === "function") onRefresh();
    }

    function onStorage(e) {
      if (e && e.key === VERSION_KEY) handleVersionUpdate();
    }

    function onBroadcast(e) {
      var data = e && e.data;
      if (data && data.type === VERSION_EVENT) handleVersionUpdate();
    }

    function onCustomEvent() {
      handleVersionUpdate();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(VERSION_EVENT, onCustomEvent);

    try {
      if (!bc && typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel(BROADCAST_NAME);
      }
      if (bc) {
        bc.addEventListener("message", onBroadcast);
      }
    } catch (_) {}

    return function cleanup() {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VERSION_EVENT, onCustomEvent);
      try {
        if (bc) {
          bc.removeEventListener("message", onBroadcast);
        }
      } catch (_) {}
    };
  }

  /**
   * Get roster for a given team + category.
   * team = "muzi" | "mladez"
   * category = "dorostenci" | "starsi-zaci" | ... (only for mladez)
   */
  function getPlayersForCategory(team, category) {
    if (!playersData) return [];
    if (team === "muzi") return playersData.men || [];
    if (team === "mladez" && category && playersData.youth) {
      return playersData.youth[category] || [];
    }
    return [];
  }

  /* ───────────── DOM field filling ───────────── */

  /**
   * Walk UP from the widget's own DOM element to find the list-item scope —
   * the nearest ancestor that contains labels for Domácí, Hosté, Skóre
   * (i.e. a single played-match item inside the CMS list).
   */
  function findScope(startEl) {
    var el = startEl;
    var candidate = null;
    for (var i = 0; i < 60 && el && el !== document.body; i++) {
      el = el.parentElement;
      if (!el) break;
      var txt = el.textContent || "";
      // Look for the list item wrapper that contains the field labels
      var hasDomaci = txt.indexOf("Domácí") > -1;
      var hasHoste = txt.indexOf("Hosté") > -1;
      if (hasDomaci && hasHoste) {
        candidate = el;
        // Keep going up a bit more to find the widest item wrapper
        // but stop once we hit the entire list (contains multiple slugs)
        var slugCount = (txt.match(/Slug/gi) || []).length;
        if (slugCount <= 1) {
          // This is a single item — good scope
          return el;
        } else {
          // Multiple items — we went too far, return previous candidate
          break;
        }
      }
    }
    return candidate;
  }

  /**
   * Inside a scope, find the <input>/<select>/<textarea> that sits next to
   * a label whose text contains `labelText`.
   *
   * Decap CMS DOM structure (styled-components) typically:
   *   <div>                   ← field wrapper (grandparent or higher)
   *     <div><label>...</div> ← label wrapper
   *     <div><input /></div>  ← input wrapper
   *   </div>
   *
   * So we walk up several levels from the label to find the wrapper
   * that also contains an input/select/textarea.
   */
  function findInputNearLabel(scope, labelText) {
    var elems = scope.querySelectorAll("label, span");
    var ltLower = labelText.toLowerCase();

    for (var i = 0; i < elems.length; i++) {
      var t = (elems[i].textContent || "").trim();
      // Case-insensitive check: label starts with search text
      if (t.toLowerCase().indexOf(ltLower) !== 0) continue;

      // Walk up 1..5 parent levels until we find a container that has an input
      var node = elems[i];
      for (var lvl = 0; lvl < 5; lvl++) {
        node = node.parentElement;
        if (!node || node === scope) break;
        var inp = node.querySelector("input, select, textarea");
        if (inp) {
          // Make sure it's not our own <select> widget
          if (inp.id && inp.id.indexOf("relatedUpcoming") > -1) continue;
          return inp;
        }
      }
    }
    return null;
  }

  /**
   * Set a React-controlled element's value using the native property setter
   * so that React picks up the change via the synthetic event system.
   */
  function setNativeValue(el, value) {
    if (!el) return;

    // Native <select>
    if (el.tagName === "SELECT") {
      el.value = String(value);
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    // Checkbox / toggle
    if (el.type === "checkbox") {
      var want = Boolean(value);
      if (el.checked !== want) el.click();
      return;
    }
    // Text / number / date inputs
    var setter =
      (Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value") || {}).set ||
      (Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value") || {}).set;
    if (setter) setter.call(el, String(value));
    else el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /**
   * Fill all sibling fields in a played-match list item.
   */
  function fillSiblings(scope, match) {
    var fields = [
      ["Slug", match.slug],
      ["Sezóna", match.season],
      ["Soutěž", match.competition],
      ["Kolo", match.round],
      ["Domácí", match.home],
      ["Hosté", match.away],
      ["Místo utkání", match.venue],
      ["Tým", match.team],
      ["Kategorie", match.category],
      ["Jsme doma", match.isHome],
      ["Datum", normalizeDate(match.date)]
    ];

    log("fillSiblings: scope tag =", scope.tagName, ", children =", scope.children.length);

    var filled = 0;
    var notFound = [];
    var total = fields.length;
    fields.forEach(function (pair, idx) {
      setTimeout(function () {
        var label = pair[0], val = pair[1];
        if (val === undefined || val === null || val === "") {
          total--;
          return;
        }
        var inp = findInputNearLabel(scope, label);
        if (inp) {
          setNativeValue(inp, val);
          filled++;
          log("Filled", label, "→", val, "(", inp.tagName, inp.type || "", ")");
        } else {
          notFound.push(label);
          warn("Not found:", label);
        }
        // After last field, log summary
        if (idx === fields.length - 1) {
          log("Summary: filled", filled, "/", total, "| not found:", notFound.join(", ") || "(none)");
        }
      }, idx * 80);
    });
  }

  /* ───────────── Custom Widget: match-selector ───────────── */

  var MatchSelectorControl = createClass({
    getInitialState: function () {
      return { matches: [], loaded: false, selected: null, status: "" };
    },

    componentDidMount: function () {
      var self = this;
      // Always re-fetch to get latest data after CMS publish
      fetchMatches().then(function (items) {
        upcomingMatches = items;
        self.setState({
          matches: items,
          loaded: true,
          selected: self._find(self.props.value)
        });
      });

      window.addEventListener("focus", self._onWindowFocus);
      self._cleanupVersionSync = registerVersionSync(function () {
        self._onWindowFocus();
      });
    },

    componentWillUnmount: function () {
      window.removeEventListener("focus", this._onWindowFocus);
      if (this._cleanupVersionSync) this._cleanupVersionSync();
    },

    _onWindowFocus: function () {
      var self = this;
      fetchMatches().then(function (items) {
        upcomingMatches = items;
        self.setState({
          matches: items,
          loaded: true,
          selected: self._find(self.props.value)
        });
      });
    },

    _find: function (slug) {
      if (!slug) return null;
      for (var i = 0; i < upcomingMatches.length; i++) {
        if (upcomingMatches[i].slug === slug) return upcomingMatches[i];
      }
      return null;
    },

    handleChange: function (e) {
      var slug = e.target.value;
      this.props.onChange(slug || "");

      var match = this._find(slug);
      this.setState({ selected: match, status: "" });
      if (!match) return;

      var self = this;
      // Give React a moment to re-render, then fill sibling fields via DOM
      setTimeout(function () {
        var el = document.getElementById(self.props.forID);
        if (!el) { warn("Own element not found, forID =", self.props.forID); return; }

        var scope = findScope(el);
        if (!scope) {
          log("Scope not found — fields will be filled on save");
          self.setState({ status: "save" });
          return;
        }

        log("Scope found:", scope.tagName, "class=", (scope.className || "").slice(0, 60));
        fillSiblings(scope, match);
        self.setState({ status: "ok" });
      }, 600);
    },

    render: function () {
      var st = this.state;
      var value = this.props.value || "";

      // Build <option> list
      var options = [
        h("option", { value: "", key: "_empty" },
          st.loaded ? "— Vyberte nadcházející zápas —" : "Načítám zápasy…")
      ];
      st.matches.forEach(function (m) {
        var txt =
          (m.date || "?") + "  ·  " +
          (m.home || "?") + "  vs  " +
          (m.away || "?") + "  (" + (m.competition || "") + ")";
        options.push(h("option", { value: m.slug, key: m.slug }, txt));
      });

      var parts = [];

      // The <select> dropdown
      parts.push(
        h("select", {
          id: this.props.forID,
          className: this.props.classNameWrapper,
          value: value,
          onChange: this.handleChange,
          style: {
            display: "block", width: "100%", padding: "12px 14px",
            fontSize: "15px", border: "2px solid #dfdfe3", borderRadius: "0 5px 5px 0",
            background: "#fff", cursor: "pointer"
          }
        }, options)
      );

      // Preview card showing match details
      if (st.selected) {
        var m = st.selected;
        var teamLabel = m.team === "muzi" ? "Muži" : "Mládež";
        if (m.category) teamLabel += " – " + m.category;

        parts.push(
          h("div", {
            key: "preview",
            style: {
              marginTop: "10px", padding: "12px 14px", background: "#f0f7ff",
              border: "1px solid #b8d4f0", borderRadius: "5px",
              fontSize: "13px", lineHeight: "1.7"
            }
          }, [
            h("strong", { key: "hd" }, "Údaje z nadcházejícího zápasu:"),
            h("br", { key: "b1" }),
            h("span", { key: "s1" }, teamLabel),
            h("br", { key: "b2" }),
            h("span", { key: "s2" }, m.home + "  vs  " + m.away),
            h("br", { key: "b3" }),
            h("span", { key: "s3" },
              "Datum: " + (m.date || "–") +
              "  ·  Soutěž: " + (m.competition || "–") +
              (m.round ? "  ·  Kolo: " + m.round : "")),
            h("br", { key: "b4" }),
            h("span", { key: "s4" }, "Místo: " + (m.venue || "–"))
          ])
        );
      }

      // Status message
      if (st.status === "ok") {
        parts.push(h("div", {
          key: "status",
          style: { marginTop: "8px", color: "#0a7f2e", fontWeight: "bold", fontSize: "13px" }
        }, "Pole ve formuláři byla automaticky vyplněna."));
      } else if (st.status === "save") {
        parts.push(h("div", {
          key: "status",
          style: { marginTop: "8px", color: "#555", fontSize: "12px" }
        }, "Údaje budou automaticky doplněny při uložení."));
      }

      return h("div", null, parts);
    }
  });

  /* ───────────── Custom Widget: player-select ───────────── */

  /**
   * Read the team and category from sibling fields in the DOM.
   * Walks up from the widget element to find the match item scope,
   * then reads the Tým <select> and Kategorie <select>.
   */
  function readTeamFromDOM(startEl) {
    var result = { team: "muzi", category: "" };
    if (!startEl) return result;

    // Walk up to match item scope
    var el = startEl;
    for (var i = 0; i < 60 && el && el !== document.body; i++) {
      el = el.parentElement;
      if (!el) break;
      var txt = el.textContent || "";
      if (txt.indexOf("Domácí") > -1 && txt.indexOf("Hosté") > -1) {
        // Found the match item scope
        var teamSel = findInputNearLabel(el, "Tým");
        if (teamSel && teamSel.value) result.team = teamSel.value;

        var catSel = findInputNearLabel(el, "Kategorie");
        if (catSel && catSel.value) result.category = catSel.value;
        break;
      }
    }
    return result;
  }

  /* ───────────── Custom Widget: lineup-picker (checkboxes) ───────────── */

  var LineupPickerControl = createClass({
    getInitialState: function () {
      return { players: [], loaded: false, teamLabel: "", customName: "" };
    },

    componentDidMount: function () {
      var self = this;
      refreshCaches().then(function () { self._refresh(); });

      window.addEventListener("focus", self._onWindowFocus);
      self._cleanupVersionSync = registerVersionSync(function () {
        self._onWindowFocus();
      });
    },

    componentWillUnmount: function () {
      window.removeEventListener("focus", this._onWindowFocus);
      if (this._cleanupVersionSync) this._cleanupVersionSync();
    },

    _onWindowFocus: function () {
      var self = this;
      refreshCaches().then(function () { self._refresh(); });
    },

    _refresh: function () {
      var el = document.getElementById(this.props.forID);
      var info = readTeamFromDOM(el);
      var roster = getPlayersForCategory(info.team, info.category);
      var catNames = {
        "dorostenci": "Dorostenci", "dorostenky-d19": "Dorostenkyně D19",
        "starsi-zaci": "Starší žáci", "mlads-zaci": "Mladší žáci",
        "mlads-zaci-b": "Mladší žáci B", "skolicka": "Školička"
      };
      var tl = info.team === "muzi" ? "Muži" : (catNames[info.category] || "Mládež");
      this.setState({ players: roster, loaded: true, teamLabel: tl });
    },

    _getSelected: function () {
      var val = this.props.value;
      if (!val) return [];
      // Value is an Immutable List or plain array of {player:"..."} or plain strings
      var arr = val.toJS ? val.toJS() : (Array.isArray(val) ? val : []);
      return arr.map(function (item) {
        return typeof item === "string" ? item : (item.player || "");
      }).filter(Boolean);
    },

    _setSelected: function (names) {
      // Store as array of {player: name} objects for compatibility
      var list = names.map(function (n) { return { player: n }; });
      this.props.onChange(list);
    },

    handleToggle: function (name) {
      var sel = this._getSelected();
      var idx = sel.indexOf(name);
      if (idx >= 0) {
        sel.splice(idx, 1);
      } else {
        sel.push(name);
      }
      this._setSelected(sel);
    },

    handleSelectAll: function () {
      var allNames = this.state.players.map(function (p) { return p.name; });
      this._setSelected(allNames);
    },

    handleDeselectAll: function () {
      this._setSelected([]);
    },

    handleAddCustom: function () {
      var name = (this.state.customName || "").trim();
      if (!name) return;
      var sel = this._getSelected();
      if (sel.indexOf(name) < 0) sel.push(name);
      this._setSelected(sel);
      this.setState({ customName: "" });
    },

    handleCustomInput: function (e) {
      this.setState({ customName: e.target.value });
    },

    handleCustomKeyDown: function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleAddCustom();
      }
    },

    handleRemoveCustom: function (name) {
      var sel = this._getSelected();
      var idx = sel.indexOf(name);
      if (idx >= 0) sel.splice(idx, 1);
      this._setSelected(sel);
    },

    render: function () {
      var self = this;
      var st = this.state;
      var selected = this._getSelected();
      var rosterNames = st.players.map(function (p) { return p.name; });
      // Custom names = selected but not in roster
      var customNames = selected.filter(function (n) { return rosterNames.indexOf(n) < 0; });

      var parts = [];

      // Header with team label and buttons
      parts.push(h("div", {
        key: "hdr",
        style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }
      }, [
        h("strong", { key: "lbl", style: { fontSize: "13px" } },
          st.loaded ? "Soupiska: " + st.teamLabel + " (" + selected.length + " vybráno)" : "Načítám…"),
        h("button", {
          key: "all", type: "button", onClick: this.handleSelectAll,
          style: btnStyle("#e8f5e9", "#2e7d32")
        }, "Vybrat vše"),
        h("button", {
          key: "none", type: "button", onClick: this.handleDeselectAll,
          style: btnStyle("#fce4ec", "#c62828")
        }, "Zrušit vše")
      ]));

      // Player checkboxes grid
      var checkboxes = st.players.map(function (p) {
        var checked = selected.indexOf(p.name) >= 0;
        var label = p.name;
        if (p.number) label = p.number + " · " + label;
        if (p.position) label += " (" + p.position + ")";

        return h("label", {
          key: p.name,
          style: {
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 10px", fontSize: "14px", cursor: "pointer",
            background: checked ? "#e3f2fd" : "#fafafa",
            border: checked ? "1px solid #90caf9" : "1px solid #e0e0e0",
            borderRadius: "4px", transition: "all 0.15s"
          }
        }, [
          h("input", {
            key: "cb",
            type: "checkbox",
            checked: checked,
            onChange: function () { self.handleToggle(p.name); },
            style: { width: "16px", height: "16px", cursor: "pointer" }
          }),
          h("span", { key: "txt" }, label)
        ]);
      });

      parts.push(h("div", {
        key: "grid", id: this.props.forID,
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "6px", maxHeight: "300px", overflowY: "auto",
          padding: "8px", border: "1px solid #e0e0e0", borderRadius: "5px",
          background: "#fff"
        }
      }, checkboxes));

      // Custom player badges (names not in roster)
      if (customNames.length) {
        parts.push(h("div", {
          key: "custom-list",
          style: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }
        }, customNames.map(function (n) {
          return h("span", {
            key: n,
            style: {
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "4px 10px", background: "#fff3e0", border: "1px solid #ffb74d",
              borderRadius: "12px", fontSize: "13px"
            }
          }, [
            h("span", { key: "t" }, n),
            h("button", {
              key: "x", type: "button",
              onClick: function () { self.handleRemoveCustom(n); },
              style: {
                border: "none", background: "transparent", cursor: "pointer",
                fontWeight: "bold", fontSize: "14px", color: "#e65100", padding: "0 2px"
              }
            }, "×")
          ]);
        })));
      }

      // Add custom player input
      parts.push(h("div", {
        key: "add",
        style: { display: "flex", gap: "6px", marginTop: "8px", alignItems: "center" }
      }, [
        h("input", {
          key: "inp", type: "text",
          value: st.customName || "",
          onChange: this.handleCustomInput,
          onKeyDown: this.handleCustomKeyDown,
          placeholder: "Jiný hráč…",
          style: {
            flex: 1, padding: "7px 10px", fontSize: "14px",
            border: "1px solid #ccc", borderRadius: "4px"
          }
        }),
        h("button", {
          key: "btn", type: "button",
          onClick: this.handleAddCustom,
          style: btnStyle("#e8eaf6", "#283593")
        }, "+ Přidat")
      ]));

      return h("div", null, parts);
    }
  });

  function btnStyle(bg, color) {
    return {
      padding: "4px 12px", fontSize: "12px", cursor: "pointer",
      border: "1px solid " + color, borderRadius: "4px",
      background: bg, color: color, fontWeight: "600"
    };
  }

  /* ───────────── Custom Widget: player-select (single dropdown) ───────────── */

  var PlayerSelectControl = createClass({
    getInitialState: function () {
      return { players: [], loaded: false, customMode: false, teamLabel: "" };
    },

    componentDidMount: function () {
      var self = this;
      refreshCaches().then(function () {
        self._refreshPlayers();
      });

      window.addEventListener("focus", self._onWindowFocus);
      self._cleanupVersionSync = registerVersionSync(function () {
        self._onWindowFocus();
      });
    },

    componentWillUnmount: function () {
      window.removeEventListener("focus", this._onWindowFocus);
      if (this._cleanupVersionSync) this._cleanupVersionSync();
    },

    _onWindowFocus: function () {
      var self = this;
      refreshCaches().then(function () {
        self._refreshPlayers();
      });
    },

    _refreshPlayers: function () {
      var el = document.getElementById(this.props.forID);
      var info = readTeamFromDOM(el);
      var roster = getPlayersForCategory(info.team, info.category);

      // Build human readable team label
      var tl = info.team === "muzi" ? "Muži" : "Mládež";
      if (info.category) {
        var catNames = {
          "dorostenci": "Dorostenci",
          "dorostenky-d19": "Dorostenkyně D19",
          "starsi-zaci": "Starší žáci",
          "mlads-zaci": "Mladší žáci",
          "mlads-zaci-b": "Mladší žáci B",
          "skolicka": "Školička"
        };
        tl = catNames[info.category] || info.category;
      }

      log("PlayerSelect: team=", info.team, "cat=", info.category, "players=", roster.length);

      // Check if current value is a custom entry not in roster
      var currentVal = this.props.value || "";
      var inRoster = !currentVal || roster.some(function (p) { return p.name === currentVal; });

      this.setState({
        players: roster,
        loaded: true,
        customMode: currentVal && !inRoster,
        teamLabel: tl
      });
    },

    handleFocus: function () {
      // Re-read team/category every time the dropdown is opened
      this._refreshPlayers();
    },

    handleChange: function (e) {
      var val = e.target.value;
      if (val === "__custom__") {
        this.setState({ customMode: true });
        this.props.onChange("");
      } else {
        this.setState({ customMode: false });
        this.props.onChange(val);
      }
    },

    handleCustomInput: function (e) {
      this.props.onChange(e.target.value);
    },

    handleBackToSelect: function () {
      this._refreshPlayers();
      this.setState({ customMode: false });
      this.props.onChange("");
    },

    render: function () {
      var st = this.state;
      var value = this.props.value || "";

      if (st.customMode) {
        // Free text input + back button
        return h("div", { style: { display: "flex", gap: "8px", alignItems: "center" } }, [
          h("input", {
            key: "inp",
            id: this.props.forID,
            className: this.props.classNameWrapper,
            type: "text",
            value: value,
            onChange: this.handleCustomInput,
            placeholder: "Jméno hráče…",
            style: {
              flex: 1, padding: "10px 12px", fontSize: "15px",
              border: "2px solid #dfdfe3", borderRadius: "5px"
            }
          }),
          h("button", {
            key: "btn",
            type: "button",
            onClick: this.handleBackToSelect,
            style: {
              padding: "8px 14px", fontSize: "13px", cursor: "pointer",
              border: "1px solid #ccc", borderRadius: "5px", background: "#f5f5f5"
            }
          }, "← Seznam")
        ]);
      }

      // Dropdown mode
      var options = [
        h("option", { value: "", key: "_empty" },
          st.loaded
            ? "— Vyberte hráče" + (st.teamLabel ? " (" + st.teamLabel + ")" : "") + " —"
            : "Načítám…")
      ];

      st.players.forEach(function (p) {
        var label = p.name;
        if (p.number) label = p.number + " · " + label;
        if (p.position) label += " (" + p.position + ")";
        options.push(h("option", { value: p.name, key: p.name }, label));
      });

      options.push(h("option", { value: "__custom__", key: "__custom__" }, "Jiný hráč…"));

      return h("select", {
        id: this.props.forID,
        className: this.props.classNameWrapper,
        value: value,
        onChange: this.handleChange,
        onFocus: this.handleFocus,
        style: {
          display: "block", width: "100%", padding: "10px 12px",
          fontSize: "15px", border: "2px solid #dfdfe3", borderRadius: "0 5px 5px 0",
          background: "#fff", cursor: "pointer"
        }
      }, options);
    }
  });

  /* ───────────── preSave hook (safety net) ───────────── */

  var preSaveRegistered = false;

  function registerPreSave() {
    if (preSaveRegistered) return true;
    if (!window.CMS || !window.CMS.registerEventListener) return false;

    window.CMS.registerEventListener({
      name: "preSave",
      handler: function (arg) {
        try {
          bumpDataVersion("preSave");
          var entry = arg.entry;
          if (!entry || !entry.get) return entry;
          var p = String(entry.get("path") || "");

          /* ── calendar events: normalize wrapped payload to { items: [...] } ── */
          if (p.indexOf("calendar_events") >= 0) {
            var cItems = entry.getIn(["data", "items"]) || entry.getIn(["data", "data", "items"]);
            if (!cItems || !cItems.map) return entry;

            var cCount = listSize(cItems);
            if (cCount === 0 && calendarEvents.length > 0) {
              var okCalendar = confirmDangerousEmptySave("Kalendář akcí", calendarEvents.length);
              if (!okCalendar) {
                throw new Error("Uložení zrušeno: seznam kalendářových akcí by byl prázdný.");
              }
            }

            // Prefer replacing entire data object with clean shape
            try {
              var I = window.Immutable;
              if (I && I.fromJS) {
                var plainItems = cItems.toJS ? cItems.toJS() : cItems;
                return entry.set("data", I.fromJS({ items: plainItems }));
              }
            } catch (_) {}

            // Fallback when Immutable is unavailable
            return entry.setIn(["data", "items"], cItems);
          }

          /* ── upcoming matches: auto-slug + auto-fill home/away ── */
          if (p.indexOf("upcoming_matches") >= 0) {
            var uItems = entry.getIn(["data", "items"]);
            if (!uItems || !uItems.map) return entry;

            var uCount = listSize(uItems);
            if (uCount === 0 && upcomingMatches.length > 0) {
              var okUpcoming = confirmDangerousEmptySave("Nadcházející zápasy", upcomingMatches.length);
              if (!okUpcoming) {
                throw new Error("Uložení zrušeno: seznam nadcházejících zápasů by byl prázdný.");
              }
            }

            var uUpdated = uItems.map(function (im) {
              var obj = im && im.toJS ? im.toJS() : im;
              var fills = {};

              if (obj.isHome === true && !obj.home) fills.home = "Postoupky";
              if (obj.isHome === false && !obj.away) fills.away = "Postoupky";

              var h = fills.home || obj.home || "";
              var a = fills.away || obj.away || "";
              var d = normalizeDate(obj.date);
              if (!obj.slug && d && h && a) {
                fills.slug = d + "-" + toSlug(h) + "-" + toSlug(a);
              }

              if (Object.keys(fills).length && im.merge) {
                log("preSave upcoming fill:", Object.keys(fills).join(", "));
                return im.merge(fills);
              }
              return im;
            });

            return entry.setIn(["data", "items"], uUpdated);
          }

          /* ── played matches: fill from related match + auto home/away + auto-slug ── */
          if (p.indexOf("played_matches") < 0) return entry;

          var items = entry.getIn(["data", "items"]);
          if (!items || !items.map) return entry;

          var pCount = listSize(items);
          if (pCount === 0 && playedMatches.length > 0) {
            var okPlayed = confirmDangerousEmptySave("Odehrané zápasy", playedMatches.length);
            if (!okPlayed) {
              throw new Error("Uložení zrušeno: seznam odehraných zápasů by byl prázdný.");
            }
          }

          var updated = items.map(function (im) {
            var obj = im && im.toJS ? im.toJS() : im;
            var fills = {};

            var relSlug = String((obj && obj.relatedUpcoming) || "").trim();
            if (relSlug) {
              var match = null;
              for (var i = 0; i < upcomingMatches.length; i++) {
                if (upcomingMatches[i].slug === relSlug) { match = upcomingMatches[i]; break; }
              }
              if (match) {
                var keys = ["team", "category", "season", "competition", "round",
                            "home", "away", "isHome", "venue", "slug"];
                keys.forEach(function (k) {
                  var mv = match[k];
                  var cv = obj[k];
                  if ((cv === undefined || cv === null || cv === "") &&
                      mv !== undefined && mv !== null && mv !== "") {
                    fills[k] = mv;
                  }
                });
                if (match.date && (!obj.date || obj.date === "")) {
                  fills.date = normalizeDate(match.date);
                }
              }
            }

            var isHome = fills.isHome !== undefined ? fills.isHome : obj.isHome;
            if (isHome === true && !obj.home && !fills.home) fills.home = "Postoupky";
            if (isHome === false && !obj.away && !fills.away) fills.away = "Postoupky";

            if (!obj.slug && !fills.slug) {
              var sh = fills.home || obj.home || "";
              var sa = fills.away || obj.away || "";
              var sd = normalizeDate(fills.date || obj.date);
              if (sd && sh && sa) fills.slug = sd + "-" + toSlug(sh) + "-" + toSlug(sa);
            }

            if (Object.keys(fills).length && im.merge) {
              log("preSave fill:", Object.keys(fills).join(", "));
              return im.merge(fills);
            }
            return im;
          });

          return entry.setIn(["data", "items"], updated);
        } catch (e) {
          warn("preSave error:", e);
          return arg.entry;
        }
      }
    });

    preSaveRegistered = true;
    log("preSave hook registered");
    return true;
  }

  function registerPostSave() {
    if (!window.CMS || !window.CMS.registerEventListener) return false;
    try {
      window.CMS.registerEventListener({
        name: "postSave",
        handler: function () {
          bumpDataVersion("postSave");
          return Promise.resolve();
        }
      });
      log("postSave hook registered");
      return true;
    } catch (e) {
      warn("postSave hook registration failed:", e);
      return false;
    }
  }

  /* ───────────── bootstrap ───────────── */

  function boot() {
    // Start fetching data immediately
    refreshCaches();

    // Register custom widgets BEFORE CMS.init()
    window.CMS.registerWidget("match-selector", MatchSelectorControl);
    window.CMS.registerWidget("player-select", PlayerSelectControl);
    window.CMS.registerWidget("lineup-picker", LineupPickerControl);
    log('Widgets "match-selector" + "player-select" + "lineup-picker" registered');

    // Now initialize CMS (we set CMS_MANUAL_INIT=true in index.njk)
    window.CMS.init();
    log("CMS.init() called");

    // Register preSave hook (retry until CMS event system is ready)
    if (!registerPreSave()) {
      var n = 0;
      var t = setInterval(function () {
        if (registerPreSave() || ++n > 40) clearInterval(t);
      }, 300);
    }

    // Optional hook; preSave already bumps version as fallback.
    registerPostSave();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
