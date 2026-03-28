(() => {
  const STORAGE_KEY = "dao-rideshare-shared-v1";
  const CHANNEL_NAME = "dao-rideshare-sync";
  const RIDE_STAGES = ["requested", "assigned", "arriving", "ongoing", "completed", "post_feedback"];
  const SERVICE = document.body.dataset.service;
  const APP = document.getElementById("app");
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

  const USERS = {
    rider: { id: "user-rider-1", name: "Ram Sundar", email: "ram.sundar@rideshare.app", role: "Rider", locationId: "loc-campus", reputation: { rider: 74, trust: 88 } },
    host: { id: "user-host-1", name: "Asha Nair", email: "asha.nair@rideshare.app", role: "Host", locationId: "loc-station", online: true, verified: true, vehicle: { type: "Sedan", model: "Honda Amaze", plate: "TN09 AB 2233" }, reputation: { host: 92, reliability: 95 } },
    admin: { id: "user-admin-1", name: "Operations Control", email: "ops@rideshare.app", role: "Admin" },
  };

  const LOCATIONS = [
    { id: "loc-campus", name: "VIT Campus", lat: 12.9692, lng: 79.1559 },
    { id: "loc-station", name: "Katpadi Junction", lat: 12.9723, lng: 79.1456 },
    { id: "loc-hospital", name: "CMC Hospital", lat: 12.9246, lng: 79.1351 },
    { id: "loc-mall", name: "Velocity Mall", lat: 12.9464, lng: 79.1332 },
    { id: "loc-airport", name: "Airport Shuttle Hub", lat: 12.9941, lng: 79.1349 },
    { id: "loc-techpark", name: "Tech Park Gate", lat: 12.9574, lng: 79.1614 },
  ];

  function nowIso() { return new Date().toISOString(); }
  function safeText(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
  function formatDate(value) { return new Date(value).toLocaleString(); }
  function shortDate(value) { return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" }); }
  function getLocation(id) { return LOCATIONS.find((location) => location.id === id); }
  function statusTag(status) { return status === "completed" || status === "resolved" || status === "approved" ? "success" : status === "pending" || status === "requested" || status === "submitted" ? "warn" : status === "rejected" ? "danger" : ""; }

  function seedState() {
    return {
      hostOnline: true,
      hostVerification: "approved",
      systemConfig: { rideStake: 2, cancellationPenalty: 4, disputePenalty: 5 },
      rides: [
        {
          id: "ride-1001",
          riderId: USERS.rider.id,
          hostId: USERS.host.id,
          pickupId: "loc-campus",
          dropId: "loc-station",
          vehicleType: "Sedan",
          paymentMethod: "UPI",
          estimatedFare: 182,
          estimatedTime: 18,
          distanceKm: 6.1,
          status: "post_feedback",
          feedback: { rating: 4, comment: "Smooth pickup and safe drive." },
          activity: [
            { status: "requested", at: "2026-03-18T08:05:00.000Z" },
            { status: "assigned", at: "2026-03-18T08:07:00.000Z" },
            { status: "arriving", at: "2026-03-18T08:10:00.000Z" },
            { status: "ongoing", at: "2026-03-18T08:19:00.000Z" },
            { status: "completed", at: "2026-03-18T08:37:00.000Z" },
            { status: "post_feedback", at: "2026-03-18T09:05:00.000Z" },
          ],
          updatedAt: "2026-03-18T09:05:00.000Z",
        },
      ],
      disputes: [],
      activityFeed: [
        { id: "feed-1", actor: "System", message: "Platform state initialized", at: nowIso() },
      ],
    };
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    try { return JSON.parse(raw); } catch { const seed = seedState(); localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return seed; }
  }

  let state = loadState();

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (channel) channel.postMessage({ type: "state-updated", at: Date.now() });
  }

  function setState(mutator) {
    mutator(state);
    persist();
    render();
  }

  function distanceKm(fromId, toId) {
    const from = getLocation(fromId); const to = getLocation(toId); if (!from || !to) return 0;
    const degToRad = Math.PI / 180;
    const dLat = (to.lat - from.lat) * degToRad;
    const dLng = (to.lng - from.lng) * degToRad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * degToRad) * Math.cos(to.lat * degToRad) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function estimateRide(pickupId, dropId, vehicleType) {
    const km = distanceKm(pickupId, dropId);
    const rate = { Auto: 16, Hatchback: 18, Sedan: 22, SUV: 28 }[vehicleType] || 20;
    return { distanceKm: Number(km.toFixed(1)), estimatedFare: Math.max(80, Math.round(km * rate)), estimatedTime: Math.max(8, Math.round(km * 3)) };
  }

  function activeRide() {
    return [...state.rides].reverse().find((ride) => ride.status !== "post_feedback");
  }

  function addFeed(actor, message) {
    state.activityFeed.unshift({ id: `feed-${Date.now()}`, actor, message, at: nowIso() });
    state.activityFeed = state.activityFeed.slice(0, 12);
  }

  function createRide(payload) {
    const estimate = estimateRide(payload.pickupId, payload.dropId, payload.vehicleType);
    state.rides.push({
      id: `ride-${Date.now()}`,
      riderId: USERS.rider.id,
      hostId: null,
      pickupId: payload.pickupId,
      dropId: payload.dropId,
      vehicleType: payload.vehicleType,
      paymentMethod: payload.paymentMethod,
      estimatedFare: estimate.estimatedFare,
      estimatedTime: estimate.estimatedTime,
      distanceKm: estimate.distanceKm,
      status: "requested",
      feedback: null,
      activity: [{ status: "requested", at: nowIso() }],
      updatedAt: nowIso(),
    });
    addFeed("Rider", `Requested a ${payload.vehicleType.toLowerCase()} ride from ${getLocation(payload.pickupId).name}.`);
  }

  function acceptRide(rideId) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "requested" || !state.hostOnline || state.hostVerification !== "approved") return;
    ride.hostId = USERS.host.id;
    ride.status = "assigned";
    ride.updatedAt = nowIso();
    ride.activity.push({ status: "assigned", at: nowIso() });
    addFeed("Host", `Accepted ride ${ride.id}.`);
  }

  function declineRide(rideId) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "requested") return;
    ride.status = "post_feedback";
    ride.updatedAt = nowIso();
    ride.activity.push({ status: "post_feedback", at: nowIso() });
    addFeed("Host", `Declined ride ${ride.id}.`);
  }

  function advanceRide(rideId) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride) return;
    const index = RIDE_STAGES.indexOf(ride.status);
    if (index < 1 || index >= RIDE_STAGES.length - 2) return;
    const next = RIDE_STAGES[index + 1];
    ride.status = next;
    ride.updatedAt = nowIso();
    ride.activity.push({ status: next, at: nowIso() });
    addFeed("Host", `Updated ride ${ride.id} to ${next.replaceAll("_", " ")}.`);
  }

  function submitFeedback(rideId, rating, comment) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "completed") return;
    ride.feedback = { rating: Number(rating), comment: comment.trim() };
    ride.status = "post_feedback";
    ride.updatedAt = nowIso();
    ride.activity.push({ status: "post_feedback", at: nowIso() });
    addFeed("Rider", `Submitted feedback for ride ${ride.id}.`);
  }

  function fileDispute(rideId, category, description) {
    state.disputes.unshift({ id: `dispute-${Date.now()}`, rideId, category, description, status: "submitted", resolution: "", createdAt: nowIso(), resolvedAt: null });
    addFeed("Rider", `Opened a ${category} dispute for ride ${rideId}.`);
  }

  function resolveDispute(disputeId, resolution) {
    const dispute = state.disputes.find((entry) => entry.id === disputeId);
    if (!dispute || dispute.status === "resolved") return;
    dispute.status = "resolved";
    dispute.resolution = resolution;
    dispute.resolvedAt = nowIso();
    addFeed("Admin", `Resolved dispute ${dispute.id}.`);
  }
  function shell(title, subtitle, sideBadge, body) {
    return `
      <div class="app-shell">
        <aside class="sidebar">
          <section class="panel industrial-glow">
            <p class="eyebrow">DAO Ride Sharing</p>
            <h1>${safeText(title)}</h1>
            <p class="muted">${safeText(subtitle)}</p>
          </section>
          <section class="panel">
            <p class="panel-title">Signed In</p>
            <div class="stack">
              <div>
                <h3>${safeText(USERS[SERVICE].name)}</h3>
                <p class="muted">${safeText(USERS[SERVICE].email)}</p>
              </div>
              <span class="tag ${sideBadge.className || ""}">${safeText(sideBadge.text)}</span>
            </div>
          </section>
          <section class="panel">
            <p class="panel-title">Quick Links</p>
            <div class="nav-stack">
              <a class="nav-button service-card" href="./rider.html" target="_blank" rel="noopener noreferrer">Rider App</a>
              <a class="nav-button service-card" href="./host.html" target="_blank" rel="noopener noreferrer">Host App</a>
              <a class="nav-button service-card" href="./admin.html" target="_blank" rel="noopener noreferrer">Admin Console</a>
              <a class="nav-button service-card" href="./index.html">Launcher</a>
            </div>
          </section>
        </aside>
        <main class="main-content">
          ${body}
        </main>
      </div>
    `;
  }

  function renderTopbar(title, statusText) {
    return `<header class="topbar"><div><p class="eyebrow">${safeText(title)}</p><h2>${safeText(VIEW_TITLES[SERVICE])}</h2></div><div class="status-chip"><span class="status-dot"></span>${safeText(statusText)}</div></header>`;
  }

  const VIEW_TITLES = {
    rider: "Rider Workspace",
    host: "Host Operations",
    admin: "Admin Console",
  };

  function renderHeroStats(items) {
    return `<section class="hero-stats">${items.map((item) => `<article class="hero-card"><p class="eyebrow">${safeText(item.label)}</p><h3>${safeText(item.value)}</h3><p class="muted">${safeText(item.help)}</p></article>`).join("")}</section>`;
  }

  function renderTimeline(ride) {
    return `<div class="timeline">${RIDE_STAGES.map((stage, index) => { const currentIndex = RIDE_STAGES.indexOf(ride.status); const cls = index < currentIndex ? "done" : index === currentIndex ? "active" : ""; return `<span class="timeline-step ${cls}">${safeText(stage.replaceAll("_", " "))}</span>`; }).join("")}</div>`;
  }

  function renderRider() {
    const ride = activeRide();
    const recent = [...state.rides].filter((entry) => entry.riderId === USERS.rider.id).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);
    const top = renderTopbar("Trip Booking", ride ? `Active ride: ${ride.status.replaceAll("_", " ")}` : "Ready for a new booking");
    const stats = renderHeroStats([
      { label: "Rider score", value: USERS.rider.reputation.rider, help: "Trust rating from recent trips" },
      { label: "Open disputes", value: state.disputes.filter((entry) => entry.status !== "resolved").length, help: "Cases awaiting review" },
      { label: "Completed trips", value: state.rides.filter((entry) => entry.status === "post_feedback").length, help: "Trips closed successfully" },
    ]);
    const requestCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Request Ride</p><h3>Create a booking</h3></div></div><form id="ride-form" class="stack"><div class="form-grid"><div class="form-field"><label>Pickup</label><select name="pickupId">${LOCATIONS.map((location) => `<option value="${location.id}" ${location.id === USERS.rider.locationId ? "selected" : ""}>${safeText(location.name)}</option>`).join("")}</select></div><div class="form-field"><label>Drop</label><select name="dropId">${LOCATIONS.map((location) => `<option value="${location.id}">${safeText(location.name)}</option>`).join("")}</select></div><div class="form-field"><label>Vehicle type</label><select name="vehicleType">${["Auto", "Hatchback", "Sedan", "SUV"].map((type) => `<option value="${type}">${type}</option>`).join("")}</select></div><div class="form-field"><label>Payment</label><select name="paymentMethod">${["UPI", "Cash", "Card"].map((method) => `<option value="${method}">${method}</option>`).join("")}</select></div></div><div class="inline-actions"><button type="submit">Request ride</button><button type="button" class="secondary" id="sos-button">SOS</button></div></form></article>`;
    const activeCard = ride ? `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Current Ride</p><h3>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</h3></div><span class="tag ${statusTag(ride.status)}">${safeText(ride.status.replaceAll("_", " "))}</span></div><p class="muted">Fare Rs. ${ride.estimatedFare} | ETA ${ride.estimatedTime} min | Vehicle ${safeText(ride.vehicleType)}</p>${renderTimeline(ride)}${ride.hostId ? `<div class="notice">Host assigned: <strong>${safeText(USERS.host.name)}</strong> | ${safeText(USERS.host.vehicle.model)}</div>` : `<div class="notice">Waiting for a host to review this request.</div>`}<div class="inline-actions">${ride.status === "requested" ? `<button data-action="auto-assign" data-ride="${ride.id}">Find available host</button>` : ""}${ride.status === "completed" ? `<button class="secondary" data-action="open-feedback" data-ride="${ride.id}">Submit feedback</button>` : ""}${ride.status === "completed" || ride.status === "post_feedback" ? `<button class="ghost" data-action="open-dispute" data-ride="${ride.id}">Raise dispute</button>` : ""}</div><div id="rider-feedback-slot"></div><div id="rider-dispute-slot"></div></article>` : `<article class="content-card">${emptyStateHtml()}</article>`;
    const recentCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Trip History</p><h3>Recent rider activity</h3></div></div><div class="list">${recent.length ? recent.map((entry) => `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(entry.pickupId).name)} to ${safeText(getLocation(entry.dropId).name)}</strong><span class="tag ${statusTag(entry.status)}">${safeText(entry.status.replaceAll("_", " "))}</span></div><p class="muted">${safeText(shortDate(entry.updatedAt))} | Fare Rs. ${entry.estimatedFare} | ${safeText(entry.paymentMethod)}</p></div>`).join("") : emptyStateHtml()}</div></article>`;
    return shell("Rider App", "Book rides, track trip progress, and manage post-ride issues.", { text: "Rider Session", className: "success" }, `${top}${stats}<section class="grid-two">${requestCard}${activeCard}</section>${recentCard}`);
  }

  function renderHost() {
    const requests = state.rides.filter((ride) => ride.status === "requested");
    const assigned = state.rides.filter((ride) => ride.hostId === USERS.host.id && ["assigned", "arriving", "ongoing", "completed"].includes(ride.status));
    const top = renderTopbar("Dispatch", state.hostOnline ? "Accepting ride requests" : "Offline");
    const stats = renderHeroStats([
      { label: "Host score", value: USERS.host.reputation.host, help: "Current host trust score" },
      { label: "Vehicle verification", value: state.hostVerification, help: "Current document review status" },
      { label: "Pending requests", value: requests.length, help: "Waiting for host action" },
    ]);
    const statusCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Availability</p><h3>${safeText(USERS.host.name)}</h3></div><span class="tag ${state.hostOnline ? "success" : "danger"}">${state.hostOnline ? "Online" : "Offline"}</span></div><div class="notice">${safeText(USERS.host.vehicle.model)} | ${safeText(USERS.host.vehicle.plate)} | ${safeText(USERS.host.vehicle.type)}</div><div class="inline-actions"><button id="toggle-host">${state.hostOnline ? "Go offline" : "Go online"}</button></div></article>`;
    const requestCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Incoming Requests</p><h3>Trips waiting for acceptance</h3></div></div><div class="list">${requests.length ? requests.map((ride) => `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</strong><span class="tag warn">requested</span></div><p class="muted">Fare Rs. ${ride.estimatedFare} | ${safeText(ride.vehicleType)} | ${safeText(ride.paymentMethod)}</p><div class="inline-actions"><button data-action="accept" data-ride="${ride.id}" ${!state.hostOnline || state.hostVerification !== "approved" ? "disabled" : ""}>Accept</button><button class="secondary" data-action="decline" data-ride="${ride.id}">Decline</button></div></div>`).join("") : emptyStateHtml()}</div></article>`;
    const assignedCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Assigned Trips</p><h3>Active host work</h3></div></div><div class="list">${assigned.length ? assigned.map((ride) => `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</strong><span class="tag ${statusTag(ride.status)}">${safeText(ride.status.replaceAll("_", " "))}</span></div><p class="muted">Ride ${safeText(ride.id)} | Fare Rs. ${ride.estimatedFare}</p>${renderTimeline(ride)}<div class="inline-actions">${["assigned", "arriving", "ongoing"].includes(ride.status) ? `<button data-action="advance" data-ride="${ride.id}">Advance ride</button>` : ""}</div></div>`).join("") : emptyStateHtml()}</div></article>`;
    return shell("Host App", "Receive ride requests, manage trip progress, and stay in sync with riders.", { text: state.hostOnline ? "Online" : "Offline", className: state.hostOnline ? "success" : "danger" }, `${top}${stats}<section class="grid-two">${statusCard}${requestCard}</section>${assignedCard}`);
  }

  function renderAdmin() {
    const openDisputes = state.disputes.filter((entry) => entry.status !== "resolved");
    const top = renderTopbar("Operations", `${openDisputes.length} open dispute${openDisputes.length === 1 ? "" : "s"}`);
    const stats = renderHeroStats([
      { label: "Trips on platform", value: state.rides.length, help: "Total ride records in shared state" },
      { label: "Open disputes", value: openDisputes.length, help: "Requires operations review" },
      { label: "Host verification", value: state.hostVerification, help: "Current onboarding status" },
    ]);
    const verificationCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Verification</p><h3>Host compliance review</h3></div></div><div class="notice">${safeText(USERS.host.name)} | ${safeText(USERS.host.vehicle.model)} | ${safeText(USERS.host.vehicle.plate)}</div><div class="inline-actions"><button data-action="verify-host" data-status="approved">Approve</button><button class="secondary" data-action="verify-host" data-status="pending">Mark pending</button><button class="ghost" data-action="verify-host" data-status="rejected">Reject</button></div></article>`;
    const disputeCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Disputes</p><h3>Admin review queue</h3></div></div><div class="list">${openDisputes.length ? openDisputes.map((entry) => `<div class="list-item"><div class="split-line"><strong>${safeText(entry.category)} dispute</strong><span class="tag warn">${safeText(entry.status)}</span></div><p class="muted">Ride ${safeText(entry.rideId)} | Opened ${safeText(shortDate(entry.createdAt))}</p><p>${safeText(entry.description)}</p><form class="stack" data-form="resolve-dispute" data-dispute="${entry.id}"><div class="form-field"><label>Resolution note</label><textarea name="resolution">Fare adjusted and incident closed by operations.</textarea></div><div class="inline-actions"><button type="submit">Resolve case</button></div></form></div>`).join("") : emptyStateHtml()}</div></article>`;
    const activityCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Activity Feed</p><h3>Cross-service events</h3></div></div><div class="list">${state.activityFeed.map((entry) => `<div class="list-item"><div class="split-line"><strong>${safeText(entry.actor)}</strong><span class="muted">${safeText(shortDate(entry.at))}</span></div><p class="muted">${safeText(entry.message)}</p></div>`).join("")}</div></article>`;
    return shell("Admin Console", "Monitor network activity, review host compliance, and close rider issues.", { text: "Operations Live", className: "warn" }, `${top}${stats}<section class="grid-two">${verificationCard}${disputeCard}</section>${activityCard}`);
  }
  function bindEvents() {
    document.getElementById("ride-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setState(() => createRide({ pickupId: form.get("pickupId"), dropId: form.get("dropId"), vehicleType: form.get("vehicleType"), paymentMethod: form.get("paymentMethod") }));
    });

    document.getElementById("sos-button")?.addEventListener("click", () => {
      window.alert("SOS request sent. The rider safety team and emergency contacts have been notified.");
    });

    document.getElementById("toggle-host")?.addEventListener("click", () => {
      setState((draft) => {
        draft.hostOnline = !draft.hostOnline;
        addFeed("Host", draft.hostOnline ? "Switched availability to online." : "Switched availability to offline.");
      });
    });

    document.querySelectorAll("[data-action='accept']").forEach((button) => button.addEventListener("click", () => setState(() => acceptRide(button.dataset.ride))));
    document.querySelectorAll("[data-action='decline']").forEach((button) => button.addEventListener("click", () => setState(() => declineRide(button.dataset.ride))));
    document.querySelectorAll("[data-action='advance']").forEach((button) => button.addEventListener("click", () => setState(() => advanceRide(button.dataset.ride))));
    document.querySelectorAll("[data-action='auto-assign']").forEach((button) => button.addEventListener("click", () => setState(() => autoAssignRide(button.dataset.ride))));

    document.querySelectorAll("[data-action='open-feedback']").forEach((button) => button.addEventListener("click", () => {
      const slot = document.getElementById("rider-feedback-slot");
      if (!slot) return;
      slot.innerHTML = `<form id="feedback-form" class="stack"><div class="form-grid"><div class="form-field"><label>Rating</label><select name="rating"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div><div class="form-field"><label>Comment</label><input name="comment" value="Safe trip and clear communication." /></div></div><div class="inline-actions"><button type="submit">Send feedback</button></div></form>`;
      document.getElementById("feedback-form")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setState(() => submitFeedback(button.dataset.ride, form.get("rating"), form.get("comment"))); });
    }));

    document.querySelectorAll("[data-action='open-dispute']").forEach((button) => button.addEventListener("click", () => {
      const slot = document.getElementById("rider-dispute-slot");
      if (!slot) return;
      slot.innerHTML = `<form id="dispute-form" class="stack"><div class="form-grid"><div class="form-field"><label>Category</label><select name="category"><option value="fare">Fare</option><option value="conduct">Conduct</option><option value="route">Route</option><option value="safety">Safety</option></select></div><div class="form-field"><label>Issue summary</label><input name="description" value="Fare did not match the expected route." /></div></div><div class="inline-actions"><button type="submit">Submit case</button></div></form>`;
      document.getElementById("dispute-form")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setState(() => fileDispute(button.dataset.ride, form.get("category"), form.get("description"))); });
    }));

    document.querySelectorAll("[data-form='resolve-dispute']").forEach((formEl) => formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setState(() => resolveDispute(event.currentTarget.dataset.dispute, form.get("resolution")));
    }));

    document.querySelectorAll("[data-action='verify-host']").forEach((button) => button.addEventListener("click", () => {
      setState((draft) => {
        draft.hostVerification = button.dataset.status;
        addFeed("Admin", `Updated host verification to ${button.dataset.status}.`);
      });
    }));
  }

  function render() {
    const output = SERVICE === "rider" ? renderRider() : SERVICE === "host" ? renderHost() : renderAdmin();
    APP.innerHTML = output;
    bindEvents();
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    state = JSON.parse(event.newValue);
    render();
  });

  if (channel) {
    channel.addEventListener("message", () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      state = JSON.parse(raw);
      render();
    });
  }

  render();
})();
