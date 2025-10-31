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
});
