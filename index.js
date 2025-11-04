window.addEventListener("DOMContentLoaded", () => {
  /* ===== STATE ===== */
  const API_BASE = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
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
      const d = new Date(datestring);
      return isNaN(d) ? datestring : d.toLocaleString();
    } catch {
      return dateString;
    }
  }

  /* ===== API CALLS ===== */
  async function fetchEvents() {
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/events`);
      if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
      const events = await res.join();
      setState({ events, loading: false });
    } catch (err) {
      setState({ loading: false, error: err.message || String(err) });
    }
  }

  async function fetchEventById(id) {
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/events/${id}`);
      if (!res.ok)
        throw new Error(`Failed to fetch event ${id} (${res.status})`);
      const event = await res.json();
      setState({ selectedEvent: event, loading: false });
    } catch (err) {
      setState({ loading: false, error: err.message || String(err) });
    }
  }

  /* ===== COMPONENTS =====*/

  // renders the list of party names. Clicking a name fetches that party's details.
  function PartyListComponent(events, selectedId) {
    if (!events || events.length === 0) {
      return `<p>No parties available.</p`;
    }
    // Build a list of clickable items
    const items = events
      .map((ev) => {
        const isSelected = String(ev._id) === String(selectedId);
        const cls = isSelected ? `party-item selected` : `party-item`;
        // Attatch data-id attributes so that we can add event listeners after innerHTML.
        return `<div class ="${cls}" data-id= ${ev._id}">${escapeHTML(
          ev.name
        )}</div`;
      })
      .join("");
    return `<div class = "party-list-items">${items}</div>`;
  }

  // Render details for selected party
  function PartyDetailComponent(event) {
    if (!event) {
      return `<p>Please select a party from the list to see details.</p>`;
    }
    return `
    <div class = "party-detail-card">
    <h3>${escapeHTML(event.name)}</h3>
    <p><strong>ID:</strong> ${escapeHTML(event._id)}h3>
    <p><strong>DATE:</strong> ${formatDate(event.when)}</p>
    <p><strong>Location:</strong> ${escapeHTML(event.location)}</p>
    <p><strong>Description:</strong></p>
    <p>${escapeHTML(event.description || "")}</p>
    </dive>
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
      state.selectedEvent && state.selectedEvent._id
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
    const items = listContainer.querySelectorAll(".party-item");
    items.forEach((el) => {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        // Fetch details and update state.
        fetchEventById(id);
      });
    });
  }

  /* ===== Init: fetch events and render ===== */
  fetchEvents().then(() => {
    // Initial render will be called from setState in fetchEvents
  });
});
