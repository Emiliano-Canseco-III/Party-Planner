window.addEventListener("DOMContentLoaded", () => {
  /* ===== STATE ===== */
  const API_BASE =
    "https://fsa-crud-2aa9294fe819.herokuapp.com/api/2509-FTB-CT-WEB-PT";
  const state = {
    events: [], // Array of all events from the API
    selectedEvent: null, // Full event object for selected event.
    loading: false,
    error: null,
  };

  /* ===== BUILD BASE DOM ===== */
  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  const header = document.createElement("header");
  const title = document.createElement("h1");
  title.textContent = "Party Planner";
  header.appendChild(title);
  app.appendChild(header);

  const main = document.createElement("main");
  main.id = "main";
  app.appendChild(main);

  // Left: list of parties
  const listColumn = document.createElement("section");
  listColumn.id = "party-list-column";
  const listHeading = document.createElement("h2");
  listHeading.textContent = "Upcoming Parties";
  listColumn.appendChild(listHeading);
  const listContainer = document.createElement("div");
  listContainer.id = "party-list";
  listColumn.appendChild(listContainer);
  main.appendChild(listColumn);

  // Right: Details
  const detailColumn = document.createElement("section");
  detailColumn.id = "party-detail-column";
  const detailHeading = document.createElement("h2");
  detailHeading.textContent = "Party Details";
  detailColumn.appendChild(detailHeading);
  const detailContainer = document.createElement("div");
  detailContainer.id = "party-detail";
  detailColumn.appendChild(detailContainer);
  main.appendChild(detailColumn);

  // Footer area for messages
  const footer = document.createElement("footer");
  const messageEl = document.createElement("p");
  messageEl.id = "message";
  footer.appendChild(messageEl);
  app.appendChild(footer);

  /* ===== HELPERS ===== */
  function setState(next) {
    Object.assign(state, next);
    render();
  }

  function formatDate(dateString) {
    try {
      const d = new Date(dateString);
      return isNaN(d) ? dateString : d.toLocaleString();
    } catch {
      return dateString;
    }
  }

  /* ===== API CALLS ===== */
  async function fetchEventById(id) {
    setState({ loading: true, error: null });

    // Try to find a local copy first (use extractId to match shapes)
    const local =
      state.events && state.events.find((e) => extractId(e) === String(id));

    try {
      const res = await fetch(`${API_BASE}/events/${id}`);
      const json = await res.json();
      console.log("API response:", json); // Debug log

      // API could return the event directly or wrap it in data; accept different shapes
      let ev = null;
      // direct object with id/_id
      if (json && (json._id || json.id)) ev = json;
      // wrapped object: { data: {...} }
      else if (
        json &&
        json.data &&
        (json.data._id || json.data.id || typeof json.data === "object")
      )
        ev = json.data;
      // wrapped array: { data: [ ... ] }
      else if (json && Array.isArray(json.data))
        ev = json.data.find((i) => extractId(i) === String(id)) || null;
      // other possible array shape
      else if (Array.isArray(json))
        ev = json.find((i) => extractId(i) === String(id)) || null;

      if (!ev) {
        if (local) {
          setState({
            selectedEvent: local,
            loading: false,
            error: "API returned unexpected shape - showing local event",
          });
          return;
        }
        throw new Error("Event not found");
      }

      // normalize the selected event to our internal shape
      const selected = normalizeEventItem(ev) || ev;
      setState({ selectedEvent: selected, loading: false });
    } catch (err) {
      if (local) {
        setState({
          selectedEvent: local,
          loading: false,
          error: err.message || String(err),
        });
      } else {
        setState({ loading: false, error: err.message || String(err) });
      }
    }
  }

  async function fetchEvents() {
    setState({ loading: true, error: null });
    console.log("Fetching events..."); // Debug log

    // Fallback sample so UI still works if API shape is wrong
    const sample = [
      {
        _id: "1",
        name: "Sample Party A",
        when: new Date().toISOString(),
        location: "My House",
        description: "Demo party A",
      },

      {
        _id: "2",
        name: "Sample Party B",
        when: new Date().toISOString(),
        location: "Not my house",
        description: "Demo party B",
      },
    ];
    try {
      const res = await fetch(`${API_BASE}/events`);
      const json = await res.json();
      // normalizeEvents: try several common shapes and return an array
      function normalizeEventsResponse(json) {
        if (!json) return [];
        if (Array.isArray(json)) return json;
        // common wrapper
        if (Array.isArray(json.data)) return json.data;
        // wrapper where data is a single object: { data: { ... } }
        if (
          json.data &&
          !Array.isArray(json.data) &&
          (json.data._id || json.data.id || typeof json.data === "object")
        )
          return [json.data];
        if (Array.isArray(json.events)) return json.events;
        // sometimes API returns { data: { items: [...] } }
        if (json.data && Array.isArray(json.data.items)) return json.data.items;
        // sometimes API returns { result: { items: [...] } }
        if (json.result && Array.isArray(json.result.items))
          return json.result.items;
        // if it returned a single event object, put it in an array
        if (json._id || json.id) return [json];
        // nothing matched
        return [];
      }

      // after reading json: normalize and map to our internal shape
      const eventsArray = normalizeEventsResponse(json);
      if (eventsArray.length > 0) {
        const normalized = eventsArray.map(normalizeEventItem).filter(Boolean);
        setState({ events: normalized, loading: false });
        return;
      }
      // fallback behavior continues...

      // debug: uncomment to inspect API shape
      // console.log('fetchEvents json', json);

      // If API returned an array directly
      if (Array.isArray(json)) {
        setState({ events: json, loading: false });
        return;
      }

      // If API returned { data: [...] } or similar
      if (json && Array.isArray(json.data)) {
        setState({ events: json.data, loading: false });
        return;
      }

      // If res.ok but we don't have an array, use sample and show warning
      if (res.ok) {
        setState({
          events: sample,
          loading: false,
          error: "API returned unexpected shape - using sample data",
        });
        return;
      }

      // If not ok (404/500) use sample and show error
      setState({
        events: sample,
        loading: false,
        error: `API returned ${res.status} - using sample data`,
      });
    } catch (err) {
      // Network fallback
      setState({
        events: sample,
        loading: false,
        error: err.message || String(err),
      });
    }
  }

  /* ===== COMPONENTS =====*/

  // Helper to extract a stable id from various API shapes
  function extractId(ev) {
    if (!ev) return undefined;
    // Common: _id is string
    if (typeof ev._id === "string" && ev._id.trim()) return ev._id.trim();
    // Common: _id is object with $oid
    if (ev._id && typeof ev._id === "object") {
      if (typeof ev._id.$oid === "string" && ev._id.$oid.trim())
        return ev._id.$oid.trim();
      // Other nested shapes like {_id: { "$oid": "..." } } or single key object
      const keys = Object.keys(ev._id);
      if (keys.length === 1 && typeof ev._id[keys[0]] === "string")
        return String(ev._id[keys[0]]).trim();
    }
    // Fallback to id
    if (typeof ev.id === "string" && ev.id.trim()) return ev.id.trim();
    if (typeof ev.id === "number") return String(ev.id);
    return undefined;
  }

  // Normalize a single event object from various API shapes into our internal shape
  function normalizeEventItem(item) {
    if (!item) return null;
    const id = extractId(item) || "";
    return {
      // internal canonical id field
      _id: String(id),
      // prefer common names but fall back to possible alternatives
      name: item.name || item.title || "",
      when: item.when || item.date || item.createdAt || "",
      location: item.location || item.locationName || "",
      description: item.description || item.desc || "",
      // keep original in case we need it for debugging
      __raw: item,
    };
  }

  // renders the list of party names. Clicking a name fetches that party's details.
  function PartyListComponent(events, selectedId) {
    if (!events || events.length === 0) {
      console.log("PartyListComponent: no events or empty array", events);
      return "<p>No parties available.</p>";
    }

    console.log("Events data (PartyListComponent):", events);
    const sel = selectedId ? String(selectedId) : null;

    const items = events
      .map((ev) => {
        const evId = extractId(ev);
        if (!evId) {
          console.error("Invalid event object (missing id):", ev);
          return "";
        }
        const isSelected = String(evId) === sel;
        const cls = isSelected ? "party-item selected" : "party-item";
        const name = ev && ev.name ? ev.name : "Unnamed Party";
        return `<div class="${cls}" data-id="${escapeHtml(evId)}">${escapeHtml(
          name
        )}</div>`;
      })
      .join("");

    return `<div class="party-list-items">${items}</div>`;
  }

  // Render details for selected party
  function PartyDetailComponent(event) {
    if (!event) {
      return `<p>Please select a party from the list to see details.</p>`;
    }
    return `
  <div class = "party-detail-card">
  <h3>${escapeHtml(event.name)}</h3>
  <p><strong>ID:</strong> ${escapeHtml(extractId(event) || "")}</p>
  <p><strong>DATE:</strong> ${formatDate(event.when)}</p>
  <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
  <p><strong>Description:</strong></p>
  <p>${escapeHtml(event.description || "")}</p>
  </div>
  `;
  }

  // Way to escape text for HTML: insertion
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ===== Render ===== */
  function render() {
    // list column
    listContainer.innerHTML = PartyListComponent(
      state.events,
      state.selectedEvent && extractId(state.selectedEvent)
    );
    // Detail column
    detailContainer.innerHTML = PartyDetailComponent(state.selectedEvent);

    // Message / loading / error
    if (state.loading) {
      messageEl.textContent = "Loading...";
    } else if (state.error) {
      messageEl.textContent = `Error: ${state.error}`;
    } else {
      messageEl.textContent = "";
    }

    // After injecting HTML for list, attatched click listeners to each item
    attachListHandlers();
  }

  /* ===== Event wiring for list items ===== */
  function attachListHandlers() {
    const items = document.querySelectorAll(".party-item");
    console.log("Found party items:", items.length);

    items.forEach((el) => {
      el.style.cursor = "pointer";
      el.addEventListener("click", (event) => {
        event.preventDefault();
        const clickedEl = event.currentTarget;

        // Try different ways to get the ID
        const id =
          clickedEl.getAttribute("data-id") ||
          clickedEl.getAttribute("data-party-id") ||
          clickedEl.dataset.id ||
          clickedEl.dataset.partyId;

        console.log("Clicked element:", clickedEl.outerHTML);
        console.log("Data attributes:", Object.keys(clickedEl.dataset));
        console.log("Clicked party id:", id);

        // Find the event in state to ensure we have a valid ID (use extractor)
        const eventData = state.events.find(
          (ev) => extractId(ev) === String(id)
        );

        if (eventData) {
          // call API with the normalized id (id variable is fine)
          fetchEventById(String(id));
        } else {
          console.error("Could not find valid event for id:", id);
          console.log("Current state events:", state.events);
        }
      });
    });
  }

  /* ===== Init: fetch events and render ===== */
  fetchEvents().then(() => {
    // Initial render will be called from setState in fetchEvents
  });
});
