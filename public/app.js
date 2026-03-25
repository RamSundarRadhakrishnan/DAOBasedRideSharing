const STORAGE_KEY = "dao-ride-sharing-app-v2";
const RIDE_STAGES = ["searching", "host_assigned", "arriving", "ongoing", "completed", "post_feedback"];
const VIEW_LABELS = {
  login: "Login",
  passenger: "Passenger Dashboard",
  host: "Host Dashboard",
  arbitrator: "Arbitrator Dashboard",
  admin: "Admin Dashboard",
  dao: "DAO Overview",
  profile: "Profile",
};
const LOCATIONS = [
  { id: "loc-campus", name: "VIT Campus", lat: 12.9692, lng: 79.1559 },
  { id: "loc-station", name: "Katpadi Junction", lat: 12.9723, lng: 79.1456 },
  { id: "loc-hospital", name: "CMC Hospital", lat: 12.9246, lng: 79.1351 },
  { id: "loc-mall", name: "Velocity Mall", lat: 12.9464, lng: 79.1332 },
  { id: "loc-airport", name: "Airport Shuttle Hub", lat: 12.9941, lng: 79.1349 },
  { id: "loc-techpark", name: "Tech Park Gate", lat: 12.9574, lng: 79.1614 },
];

const emptyStateHtml = () => document.getElementById("empty-state-template").innerHTML;
const nowIso = () => new Date().toISOString();
const safeText = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const formatDate = (value) => new Date(value).toLocaleString();
const shortDate = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function createSeedState() {
  return {
    ui: { view: "login", sessionUserId: null },
    config: { rideStake: 2, cancellationPenalty: 4, disputeReward: 3, disputePenalty: 5, matchingWeights: { reputation: 0.5, distance: 0.3, reliability: 0.2 } },
    governanceDecisions: [
      { id: "gov-1", title: "Increase cancellation penalty for repeat no-shows", summary: "Approved after repeated rider complaints.", outcome: "Passed", timestamp: "2026-03-10T09:30:00.000Z" },
      { id: "gov-2", title: "Require host document renewal every 180 days", summary: "Improves verification freshness.", outcome: "Passed", timestamp: "2026-03-16T18:10:00.000Z" },
      { id: "gov-3", title: "Pilot dispute fast-track for low-value fares", summary: "Creates a simplified arbitration path.", outcome: "Review", timestamp: "2026-03-21T14:45:00.000Z" },
    ],
    locations: LOCATIONS,
    users: [
      { id: "user-passenger-1", name: "Ram Sundar", phone: "+91 98765 43210", email: "ram.sundar@rideshare.app", roles: ["passenger"], verified: true, online: false, reliability: 0.88, currentLocationId: "loc-campus", vehicle: null, reputation: { host: 42, passenger: 74, arbitration: 12 }, reputationHistory: [{ id: "rep-1", timestamp: "2026-03-08T12:00:00.000Z", domain: "passenger", delta: 4, reason: "Completed ride with 5-star host feedback" }, { id: "rep-2", timestamp: "2026-03-19T16:00:00.000Z", domain: "passenger", delta: -2, reason: "Late pickup confirmation" }] },
      { id: "user-host-1", name: "Asha Nair", phone: "+91 90000 11111", email: "asha.host@example.com", roles: ["host"], verified: true, online: true, reliability: 0.95, currentLocationId: "loc-station", vehicle: { type: "Sedan", model: "Honda Amaze", plate: "TN09 AB 2233", docsUploaded: true, verificationStatus: "approved" }, reputation: { host: 92, passenger: 35, arbitration: 10 }, reputationHistory: [{ id: "rep-3", timestamp: "2026-03-14T08:00:00.000Z", domain: "host", delta: 5, reason: "Completed 10 rides with zero disputes" }] },
      { id: "user-host-2", name: "Farhan Ali", phone: "+91 90000 22222", email: "farhan.host@example.com", roles: ["host"], verified: true, online: true, reliability: 0.86, currentLocationId: "loc-techpark", vehicle: { type: "Hatchback", model: "Maruti Swift", plate: "TN11 CD 5501", docsUploaded: true, verificationStatus: "approved" }, reputation: { host: 81, passenger: 20, arbitration: 6 }, reputationHistory: [] },
      { id: "user-host-3", name: "Meera Joseph", phone: "+91 90000 33333", email: "meera.host@example.com", roles: ["host"], verified: true, online: false, reliability: 0.91, currentLocationId: "loc-mall", vehicle: { type: "SUV", model: "Hyundai Venue", plate: "TN14 EF 8080", docsUploaded: true, verificationStatus: "pending" }, reputation: { host: 88, passenger: 30, arbitration: 8 }, reputationHistory: [] },
      { id: "user-arb-1", name: "Ishan Menon", phone: "+91 90000 44444", email: "ishan.arb@example.com", roles: ["arbitrator"], verified: true, online: true, reliability: 0.97, currentLocationId: "loc-campus", vehicle: null, reputation: { host: 10, passenger: 10, arbitration: 91 }, reputationHistory: [] },
      { id: "user-admin-1", name: "DAO Moderator Team", phone: "+91 90000 55555", email: "moderator.dao@example.com", roles: ["admin"], verified: true, online: true, reliability: 1, currentLocationId: "loc-campus", vehicle: null, reputation: { host: 0, passenger: 0, arbitration: 0 }, reputationHistory: [] },
    ],
    rides: [
      { id: "ride-1001", passengerId: "user-passenger-1", pickupId: "loc-campus", dropId: "loc-station", vehicleType: "Sedan", paymentMethod: "UPI", estimatedFare: 182, estimatedTime: 18, distanceKm: 6.1, status: "post_feedback", candidateHostIds: ["user-host-1", "user-host-2"], assignedHostId: "user-host-1", submittedAt: "2026-03-18T08:05:00.000Z", updatedAt: "2026-03-18T09:05:00.000Z", hostAcceptedAt: "2026-03-18T08:07:00.000Z", passengerRating: 5, hostRating: 4, feedbackComment: "Smooth pickup and safe drive.", paymentConfirmed: true, reputationStake: 2, activity: [{ status: "searching", at: "2026-03-18T08:05:00.000Z" }, { status: "host_assigned", at: "2026-03-18T08:07:00.000Z" }, { status: "arriving", at: "2026-03-18T08:10:00.000Z" }, { status: "ongoing", at: "2026-03-18T08:19:00.000Z" }, { status: "completed", at: "2026-03-18T08:37:00.000Z" }, { status: "post_feedback", at: "2026-03-18T09:05:00.000Z" }] },
    ],
    disputes: [
      { id: "dispute-1", rideId: "ride-1001", filedById: "user-passenger-1", category: "fare", description: "Driver took a longer route than estimated near the station.", evidence: "Passenger attached route screenshot and receipt notes.", status: "resolved", assignedArbitratorIds: ["user-arb-1"], verdict: "Split responsibility", resolutionNote: "Passenger receives partial reputation restore; host loses 1 host reputation.", submittedAt: "2026-03-18T10:10:00.000Z", resolvedAt: "2026-03-18T18:00:00.000Z" },
    ],
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw); } catch { const seed = createSeedState(); localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return seed; }
}

let state = loadState();
const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const setState = (mutator) => { mutator(state); saveState(); render(); };
const getUser = (id) => state.users.find((user) => user.id === id);
const getLocation = (id) => state.locations.find((location) => location.id === id);
const totalReputation = (user) => (user.reputation.host || 0) + (user.reputation.passenger || 0) + (user.reputation.arbitration || 0);
const sessionUser = () => state.ui.sessionUserId ? getUser(state.ui.sessionUserId) : null;

function primaryRole(user) {
  if (!user) return null;
  if (user.roles.includes("admin")) return "admin";
  if (user.roles.includes("arbitrator")) return "arbitrator";
  if (user.roles.includes("host")) return "host";
  return "passenger";
}

function roleHomeView(user) {
  return primaryRole(user) || "login";
}

function allowedViews(user) {
  if (!user) return ["login"];
  return [roleHomeView(user), "dao", "profile"];
}

function ensureValidView() {
  const user = sessionUser();
  const allowed = allowedViews(user);
  if (!allowed.includes(state.ui.view)) state.ui.view = allowed[0];
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

function isHostEligible(host, vehicleType) {
  return host.roles.includes("host") && host.online && host.vehicle && host.vehicle.docsUploaded && host.vehicle.verificationStatus === "approved" && (!vehicleType || host.vehicle.type === vehicleType);
}

function buildCandidateHosts(ride) {
  const weights = state.config.matchingWeights;
  return state.users.filter((user) => isHostEligible(user, ride.vehicleType)).map((host) => {
    const repScore = Math.min((host.reputation.host || 0) / 100, 1);
    const dist = distanceKm(host.currentLocationId, ride.pickupId);
    const distanceScore = Math.max(0, 1 - dist / 15);
    const score = repScore * weights.reputation + distanceScore * weights.distance + (host.reliability || 0.5) * weights.reliability;
    return { hostId: host.id, score: Number(score.toFixed(3)), distance: Number(dist.toFixed(1)) };
  }).sort((a, b) => b.score - a.score);
}

function addReputationEvent(userId, domain, delta, reason) {
  const user = getUser(userId); if (!user) return;
  user.reputation[domain] = (user.reputation[domain] || 0) + delta;
  user.reputationHistory.unshift({ id: `rep-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, timestamp: nowIso(), domain, delta, reason });
}

function passengerActiveRide(userId) {
  return [...state.rides].reverse().find((ride) => ride.passengerId === userId && ride.status !== "post_feedback");
}

function ridesForHost(hostId) {
  return [...state.rides].filter((ride) => ride.assignedHostId === hostId || ride.candidateHostIds.includes(hostId)).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

function loginAs(userId) {
  const user = getUser(userId);
  state.ui.sessionUserId = userId;
  state.ui.view = roleHomeView(user);
}

function logout() {
  state.ui.sessionUserId = null;
  state.ui.view = "login";
}

function createRide(payload) {
  const user = sessionUser();
  const estimate = estimateRide(payload.pickupId, payload.dropId, payload.vehicleType);
  state.rides.push({
    id: `ride-${Date.now()}`,
    passengerId: user.id,
    pickupId: payload.pickupId,
    dropId: payload.dropId,
    vehicleType: payload.vehicleType,
    paymentMethod: payload.paymentMethod,
    estimatedFare: estimate.estimatedFare,
    estimatedTime: estimate.estimatedTime,
    distanceKm: estimate.distanceKm,
    status: "searching",
    candidateHostIds: buildCandidateHosts(payload).map((entry) => entry.hostId),
    assignedHostId: null,
    submittedAt: nowIso(),
    updatedAt: nowIso(),
    paymentConfirmed: false,
    passengerRating: null,
    hostRating: null,
    feedbackComment: "",
    reputationStake: 0,
    activity: [{ status: "searching", at: nowIso() }],
  });
}

function acceptRide(rideId) {
  const user = sessionUser();
  const ride = state.rides.find((entry) => entry.id === rideId); if (!ride || ride.status !== "searching") return;
  ride.assignedHostId = user.id; ride.status = "host_assigned"; ride.updatedAt = nowIso(); ride.hostAcceptedAt = nowIso(); ride.reputationStake = state.config.rideStake; ride.activity.push({ status: "host_assigned", at: nowIso() });
  addReputationEvent(user.id, "host", 1, "Accepted ride request and staked host reputation");
  addReputationEvent(ride.passengerId, "passenger", 1, "Ride request matched and stake recorded");
}

function declineRide(rideId) {
  const user = sessionUser();
  const ride = state.rides.find((entry) => entry.id === rideId); if (!ride || ride.status !== "searching") return;
  ride.candidateHostIds = ride.candidateHostIds.filter((candidate) => candidate !== user.id); ride.updatedAt = nowIso();
  if (!ride.candidateHostIds.length) { ride.status = "post_feedback"; ride.activity.push({ status: "post_feedback", at: nowIso() }); }
}

function autoAssignRide(rideId) {
  const ride = state.rides.find((entry) => entry.id === rideId);
  if (ride && ride.status === "searching" && ride.candidateHostIds[0]) {
    ride.assignedHostId = ride.candidateHostIds[0];
    ride.status = "host_assigned";
    ride.updatedAt = nowIso();
    ride.hostAcceptedAt = nowIso();
    ride.reputationStake = state.config.rideStake;
    ride.activity.push({ status: "host_assigned", at: nowIso() });
  }
}

function advanceRide(rideId) {
  const ride = state.rides.find((entry) => entry.id === rideId); if (!ride) return;
  const index = RIDE_STAGES.indexOf(ride.status); if (index < 0 || index >= RIDE_STAGES.length - 1) return;
  const next = RIDE_STAGES[index + 1]; ride.status = next; ride.updatedAt = nowIso(); ride.activity.push({ status: next, at: nowIso() }); if (next === "completed") ride.paymentConfirmed = true;
}

function submitFeedback(rideId, hostRating, comment) {
  const ride = state.rides.find((entry) => entry.id === rideId); if (!ride || ride.status !== "completed") return;
  ride.hostRating = Number(hostRating); ride.feedbackComment = comment.trim(); ride.status = "post_feedback"; ride.updatedAt = nowIso(); ride.activity.push({ status: "post_feedback", at: nowIso() });
  const reward = ride.hostRating >= 4 ? 3 : ride.hostRating >= 3 ? 1 : -2;
  addReputationEvent(ride.assignedHostId, "host", reward, `Passenger feedback score: ${ride.hostRating}/5`);
  addReputationEvent(ride.passengerId, "passenger", 2, "Completed ride and submitted post-ride feedback");
}

function fileDispute(payload) {
  const user = sessionUser();
  state.disputes.unshift({ id: `dispute-${Date.now()}`, rideId: payload.rideId, filedById: user.id, category: payload.category, description: payload.description, evidence: payload.evidence, status: "submitted", assignedArbitratorIds: ["user-arb-1"], verdict: "", resolutionNote: "", submittedAt: nowIso(), resolvedAt: null });
  addReputationEvent(user.id, "passenger", -1, `Dispute filed for ride ${payload.rideId}`);
}

function resolveDispute(disputeId, verdict, resolutionNote) {
  const user = sessionUser();
  const dispute = state.disputes.find((entry) => entry.id === disputeId); if (!dispute || dispute.status === "resolved") return; const ride = state.rides.find((entry) => entry.id === dispute.rideId); if (!ride) return;
  dispute.status = "resolved"; dispute.verdict = verdict; dispute.resolutionNote = resolutionNote; dispute.resolvedAt = nowIso();
  if (verdict === "Favor passenger") { addReputationEvent(ride.passengerId, "passenger", state.config.disputeReward, "Arbitration resolved in passenger's favor"); addReputationEvent(ride.assignedHostId, "host", -state.config.disputePenalty, "Arbitration penalty after dispute verdict"); }
  else if (verdict === "Favor host") { addReputationEvent(ride.assignedHostId, "host", state.config.disputeReward, "Arbitration resolved in host's favor"); addReputationEvent(ride.passengerId, "passenger", -state.config.disputePenalty, "Dispute rejected after arbitration review"); }
  else { addReputationEvent(ride.assignedHostId, "host", -1, "Split responsibility after arbitration review"); addReputationEvent(ride.passengerId, "passenger", 1, "Partial compensation from arbitration"); }
  addReputationEvent(user.id, "arbitration", 2, "Resolved dispute in arbitration queue");
}
function renderHeroStats() {
  const totalUsers = state.users.length;
  const activeHosts = state.users.filter((user) => user.roles.includes("host") && user.online).length;
  const openDisputes = state.disputes.filter((entry) => entry.status !== "resolved").length;
  const averageRep = Math.round(state.users.reduce((sum, user) => sum + totalReputation(user), 0) / state.users.length);
  document.getElementById("hero-stats").innerHTML = [["Registered personas", totalUsers], ["Online hosts", activeHosts], ["Open disputes", openDisputes], ["Average reputation", averageRep]].map((item) => `<article class="hero-card"><p class="label">${safeText(item[0])}</p><p class="value">${safeText(item[1])}</p></article>`).join("");
}

function renderNav() {
  const nav = document.getElementById("nav");
  const user = sessionUser();
  const items = allowedViews(user);
  nav.innerHTML = items.map((view) => `<button class="nav-button ${state.ui.view === view ? "active" : ""}" data-view="${view}">${safeText(VIEW_LABELS[view])}</button>`).join("");
  nav.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setState((draft) => { draft.ui.view = button.dataset.view; })));
}

function renderUserSummary() {
  const container = document.getElementById("user-summary");
  const user = sessionUser();
  if (!user) {
    container.innerHTML = `<div class="stack"><p class="muted">Sign in to continue to your workspace.</p></div>`;
    return;
  }
  container.innerHTML = `<div class="stack"><div><h3>${safeText(user.name)}</h3><p class="muted">${safeText(user.email)}</p></div><div class="split-line"><span class="tag ${user.verified ? "success" : "warn"}">${user.verified ? "KYC ready" : "KYC pending"}</span><span class="tag">${safeText(primaryRole(user))}</span></div><div><p class="muted">Total reputation</p><strong>${totalReputation(user)}</strong></div><div class="inline-actions"><button class="secondary" id="logout-button">Log out</button></div></div>`;
}

function loginCard(user) {
  return `<div class="list-item"><div class="split-line"><strong>${safeText(user.name)}</strong><span class="tag">${safeText(primaryRole(user))}</span></div><p class="muted">${safeText(user.email)}</p><p class="muted">Loads: ${safeText(VIEW_LABELS[roleHomeView(user)])}</p><div class="inline-actions"><button data-login="${user.id}">Log in</button></div></div>`;
}

function renderLoginView() {
  const groups = {
    passenger: state.users.filter((user) => primaryRole(user) === "passenger"),
    host: state.users.filter((user) => primaryRole(user) === "host"),
    arbitrator: state.users.filter((user) => primaryRole(user) === "arbitrator"),
    admin: state.users.filter((user) => primaryRole(user) === "admin"),
  };
  return `<section class="grid-two"><article class="content-card"><div class="card-header"><div><p class="eyebrow">Sign In</p><h3>Choose your workspace</h3></div></div><div class="notice">Sign in with the account that matches your workspace to access the right tools and data.</div><div class="list">${Object.entries(groups).map(([role, users]) => `<div class="list-item"><div class="card-header"><div><h3>${safeText(role)}</h3></div></div><div class="list">${users.map(loginCard).join("")}</div></div>`).join("")}</div></article><article class="content-card"><div class="card-header"><div><p class="eyebrow">Workspace Access</p><h3>Available accounts</h3></div></div><div class="list"><div class="list-item">Rider accounts can request trips, track rides, and manage disputes.</div><div class="list-item">Host accounts can review assignments, accept trips, and manage ride progress.</div><div class="list-item">Arbitrators review submitted cases, while admins manage verification and platform settings.</div><div class="list-item">Each account opens directly into its own workspace.</div></div></article></section>`;
}

function renderPassengerRideCard(ride) {
  const assignedHost = ride.assignedHostId ? getUser(ride.assignedHostId) : null;
  const candidates = buildCandidateHosts(ride).filter((entry) => ride.candidateHostIds.includes(entry.hostId)).map((entry) => { const host = getUser(entry.hostId); return `<div class="list-item"><div class="split-line"><strong>${safeText(host.name)}</strong><span class="tag">${safeText(host.vehicle.type)}</span></div><p class="muted">Match score ${entry.score} | ${entry.distance} km away | Reliability ${(host.reliability * 100).toFixed(0)}%</p></div>`; }).join("");
  return `<div class="stack"><div class="split-line"><strong>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</strong><span class="tag ${ride.status === "completed" || ride.status === "post_feedback" ? "success" : "warn"}">${safeText(ride.status.replaceAll("_", " "))}</span></div><p class="muted">Fare estimate Rs. ${ride.estimatedFare} | Time ${ride.estimatedTime} min | Distance ${ride.distanceKm} km</p><div class="timeline">${RIDE_STAGES.map((stage, index) => { const currentIndex = RIDE_STAGES.indexOf(ride.status); const cls = index < currentIndex ? "done" : index === currentIndex ? "active" : ""; return `<span class="timeline-step ${cls}">${safeText(stage.replaceAll("_", " "))}</span>`; }).join("")}</div>${assignedHost ? `<div class="notice">Assigned host: <strong>${safeText(assignedHost.name)}</strong> | Vehicle: ${safeText(assignedHost.vehicle.model)} (${safeText(assignedHost.vehicle.plate)})</div>` : `<div class="stack"><p class="muted">Candidate hosts ranked by reputation, distance, and reliability:</p><div class="list">${candidates || emptyStateHtml()}</div></div>`}<div class="inline-actions">${ride.status === "searching" ? `<button data-action="auto-assign" data-ride="${ride.id}">Simulate best host acceptance</button>` : ""}${ride.status !== "searching" && ride.status !== "post_feedback" ? `<button data-action="advance-ride" data-ride="${ride.id}">Advance ride stage</button>` : ""}${ride.status === "completed" ? `<button class="secondary" data-action="open-feedback" data-ride="${ride.id}">Submit feedback</button>` : ""}${ride.status === "completed" || ride.status === "post_feedback" ? `<button class="ghost" data-action="open-dispute" data-ride="${ride.id}">File dispute</button>` : ""}</div><div id="ride-feedback-area"></div><div id="ride-dispute-area"></div></div>`;
}

function renderPassengerView() {
  const user = sessionUser();
  const ride = passengerActiveRide(user.id);
  const recent = [...state.rides].filter((entry) => entry.passengerId === user.id && entry.status === "post_feedback").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
  return `<section class="grid-two"><article class="content-card"><div class="card-header"><div><p class="eyebrow">Passenger Access</p><h3>Request a ride</h3></div><span class="tag">${safeText(getLocation(user.currentLocationId)?.name || "Unknown location")}</span></div><form id="ride-request-form" class="stack"><div class="form-grid"><div class="form-field"><label>Pickup</label><select name="pickupId">${state.locations.map((location) => `<option value="${location.id}" ${location.id === user.currentLocationId ? "selected" : ""}>${safeText(location.name)}</option>`).join("")}</select></div><div class="form-field"><label>Drop</label><select name="dropId">${state.locations.map((location) => `<option value="${location.id}">${safeText(location.name)}</option>`).join("")}</select></div><div class="form-field"><label>Vehicle type</label><select name="vehicleType">${["Auto", "Hatchback", "Sedan", "SUV"].map((type) => `<option value="${type}">${type}</option>`).join("")}</select></div><div class="form-field"><label>Payment method</label><select name="paymentMethod">${["UPI", "Cash", "Card"].map((method) => `<option value="${method}">${method}</option>`).join("")}</select></div></div><div class="inline-actions"><button type="submit">Create ride request</button><button type="button" class="secondary" id="sos-button">SOS safety action</button></div></form></article><article class="content-card"><div class="card-header"><div><p class="eyebrow">Ride Lifecycle</p><h3>Your active ride</h3></div></div>${ride ? renderPassengerRideCard(ride) : emptyStateHtml()}</article></section><section class="content-card"><div class="card-header"><div><p class="eyebrow">Recent Activity</p><h3>Completed rides and payment trail</h3></div></div><div class="list">${recent.length ? recent.map((rideItem) => { const host = getUser(rideItem.assignedHostId); return `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(rideItem.pickupId).name)} to ${safeText(getLocation(rideItem.dropId).name)}</strong><span class="tag success">${safeText(rideItem.paymentMethod)} confirmed</span></div><p class="muted">Host: ${safeText(host?.name || "Unassigned")} | Fare: Rs. ${rideItem.estimatedFare} | Feedback date: ${safeText(shortDate(rideItem.updatedAt))}</p></div>`; }).join("") : emptyStateHtml()}</div></section>`;
}

function renderHostView() {
  const user = sessionUser();
  const rides = ridesForHost(user.id);
  const pending = rides.filter((ride) => ride.status === "searching" && ride.candidateHostIds.includes(user.id));
  const active = rides.filter((ride) => ride.assignedHostId === user.id && ride.status !== "searching" && ride.status !== "post_feedback");
  return `<section class="grid-two"><article class="content-card"><div class="card-header"><div><p class="eyebrow">Host Access</p><h3>Your host dashboard</h3></div><span class="tag ${user.online ? "success" : "danger"}">${user.online ? "Online" : "Offline"}</span></div><div class="stack"><div class="inline-actions"><button id="toggle-host-status">${user.online ? "Go offline" : "Go online"}</button></div><div class="grid-three"><div class="list-item"><p class="muted">Host reputation</p><strong>${user.reputation.host}</strong></div><div class="list-item"><p class="muted">Reliability</p><strong>${(user.reliability * 100).toFixed(0)}%</strong></div><div class="list-item"><p class="muted">Vehicle verification</p><strong>${safeText(user.vehicle.verificationStatus)}</strong></div></div><div class="notice">${safeText(user.vehicle.model)} | ${safeText(user.vehicle.plate)} | Only host actions are available in this session.</div></div></article><article class="content-card"><div class="card-header"><div><p class="eyebrow">Incoming Requests</p><h3>Requests assigned to you</h3></div></div><div class="list">${pending.length ? pending.map((ride) => { const passenger = getUser(ride.passengerId); return `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</strong><span class="tag">Passenger rep ${passenger.reputation.passenger}</span></div><p class="muted">${safeText(passenger.name)} | Fare Rs. ${ride.estimatedFare} | Stake ${state.config.rideStake}</p><div class="inline-actions"><button data-action="accept-ride" data-ride="${ride.id}">Accept</button><button class="secondary" data-action="decline-ride" data-ride="${ride.id}">Decline</button></div></div>`; }).join("") : emptyStateHtml()}</div></article></section><section class="content-card"><div class="card-header"><div><p class="eyebrow">Assigned Rides</p><h3>Active host timeline</h3></div></div><div class="list">${active.length ? active.map((ride) => { const passenger = getUser(ride.passengerId); return `<div class="list-item"><div class="split-line"><strong>${safeText(passenger.name)}</strong><span class="tag success">${safeText(ride.status.replaceAll("_", " "))}</span></div><p class="muted">Pickup ${safeText(getLocation(ride.pickupId).name)} | Drop ${safeText(getLocation(ride.dropId).name)}</p><div class="inline-actions"><button data-action="advance-ride" data-ride="${ride.id}">Advance ride stage</button></div></div>`; }).join("") : emptyStateHtml()}</div></section>`;
}

function renderArbitratorView() {
  const user = sessionUser();
  const queue = state.disputes.filter((dispute) => dispute.status !== "resolved" && dispute.assignedArbitratorIds.includes(user.id));
  return `<section class="grid-two"><article class="content-card"><div class="card-header"><div><p class="eyebrow">Arbitrator Access</p><h3>Your dispute queue</h3></div></div><div class="notice">Arbitration reputation: <strong>${user.reputation.arbitration}</strong>. Only arbitration tools are available for this login.</div></article><article class="content-card"><div class="card-header"><div><p class="eyebrow">Resolved History</p><h3>Recent arbitration outcomes</h3></div></div><div class="list">${(state.disputes.filter((entry) => entry.status === "resolved").slice(0, 3).map((entry) => `<div class="list-item"><strong>${safeText(entry.verdict)}</strong><p class="muted">${safeText(entry.resolutionNote)}</p></div>`).join("")) || emptyStateHtml()}</div></article></section><section class="content-card"><div class="card-header"><div><p class="eyebrow">Open Cases</p><h3>Evidence and decision tools</h3></div></div><div class="list">${queue.length ? queue.map((dispute) => { const ride = state.rides.find((entry) => entry.id === dispute.rideId); const passenger = getUser(ride.passengerId); const host = getUser(ride.assignedHostId); return `<div class="list-item"><div class="split-line"><strong>${safeText(dispute.category)} dispute</strong><span class="tag warn">${safeText(dispute.status)}</span></div><p class="muted">Passenger: ${safeText(passenger.name)} | Host: ${safeText(host?.name || "Pending assignment")}</p><p>${safeText(dispute.description)}</p><p class="muted">Evidence: ${safeText(dispute.evidence)}</p><form class="stack" data-form="resolve-dispute" data-dispute="${dispute.id}"><div class="form-grid"><div class="form-field"><label>Verdict</label><select name="verdict"><option>Favor passenger</option><option>Favor host</option><option>Split responsibility</option></select></div><div class="form-field"><label>Resolution note</label><input name="resolutionNote" value="Evidence reviewed and DAO rules applied." /></div></div><div class="inline-actions"><button type="submit">Resolve dispute</button></div></form></div>`; }).join("") : emptyStateHtml()}</div></section>`;
}

function renderAdminView() {
  const hostReviews = state.users.filter((user) => user.roles.includes("host") && user.vehicle && user.vehicle.docsUploaded);
  const openDisputes = state.disputes.filter((entry) => entry.status !== "resolved");
  const avgHostRep = Math.round(state.users.filter((user) => user.roles.includes("host")).reduce((sum, user) => sum + user.reputation.host, 0) / Math.max(1, state.users.filter((user) => user.roles.includes("host")).length));
  return `<section class="grid-three"><article class="content-card"><p class="eyebrow">Global Platform Metrics</p><h3>${state.rides.length}</h3><p class="muted">Total rides on platform</p></article><article class="content-card"><p class="eyebrow">Average Host Reputation</p><h3>${avgHostRep}</h3><p class="muted">Used by matching and trust screens</p></article><article class="content-card"><p class="eyebrow">Flagged Disputes</p><h3>${openDisputes.length}</h3><p class="muted">Awaiting moderator or arbitrator intervention</p></article></section><section class="grid-two"><article class="content-card"><div class="card-header"><div><p class="eyebrow">Verification Queue</p><h3>Host document review</h3></div></div><div class="list">${hostReviews.map((host) => `<div class="list-item"><div class="split-line"><strong>${safeText(host.name)}</strong><span class="tag ${host.vehicle.verificationStatus === "approved" ? "success" : host.vehicle.verificationStatus === "pending" ? "warn" : "danger"}">${safeText(host.vehicle.verificationStatus)}</span></div><p class="muted">${safeText(host.vehicle.model)} | ${safeText(host.vehicle.plate)}</p><div class="inline-actions"><button data-action="verify-host" data-host="${host.id}" data-status="approved">Approve</button><button class="secondary" data-action="verify-host" data-host="${host.id}" data-status="pending">Mark pending</button><button class="ghost" data-action="verify-host" data-host="${host.id}" data-status="rejected">Reject</button></div></div>`).join("")}</div></article><article class="content-card"><div class="card-header"><div><p class="eyebrow">DAO Rule Constants</p><h3>Moderation-safe configuration</h3></div></div><form id="config-form" class="stack"><div class="form-grid"><div class="form-field"><label>Ride reputation stake</label><input name="rideStake" type="number" min="0" value="${state.config.rideStake}" /></div><div class="form-field"><label>Cancellation penalty</label><input name="cancellationPenalty" type="number" min="0" value="${state.config.cancellationPenalty}" /></div><div class="form-field"><label>Dispute reward</label><input name="disputeReward" type="number" min="0" value="${state.config.disputeReward}" /></div><div class="form-field"><label>Dispute penalty</label><input name="disputePenalty" type="number" min="0" value="${state.config.disputePenalty}" /></div></div><div class="inline-actions"><button type="submit">Save DAO constants</button></div></form></article></section>`;
}

function renderDaoView() {
  const user = sessionUser();
  return `<section class="grid-two"><article class="content-card"><div class="card-header"><div><p class="eyebrow">Domain Reputation</p><h3>Your DAO standing</h3></div></div><div class="stack">${["passenger", "host", "arbitration"].map((domain) => `<div><div class="split-line"><strong>${domain}</strong><span>${user.reputation[domain]}</span></div><div class="reputation-bar"><span style="width:${Math.min(user.reputation[domain], 100)}%"></span></div></div>`).join("")}</div></article><article class="content-card"><div class="card-header"><div><p class="eyebrow">Governance</p><h3>Rule proposals and outcomes</h3></div></div><div class="list">${state.governanceDecisions.map((entry) => `<div class="list-item"><div class="split-line"><strong>${safeText(entry.title)}</strong><span class="tag ${entry.outcome === "Passed" ? "success" : "warn"}">${safeText(entry.outcome)}</span></div><p class="muted">${safeText(entry.summary)}</p><p class="muted mono">${safeText(formatDate(entry.timestamp))}</p></div>`).join("")}</div></article></section><section class="content-card"><div class="card-header"><div><p class="eyebrow">Transparency Log</p><h3>Recent reputation adjustments</h3></div></div><div class="list">${user.reputationHistory.slice(0, 8).map((entry) => `<div class="list-item"><div class="split-line"><strong>${entry.delta >= 0 ? "+" : ""}${entry.delta} ${safeText(entry.domain)}</strong><span class="muted">${safeText(shortDate(entry.timestamp))}</span></div><p class="muted">${safeText(entry.reason)}</p></div>`).join("")}</div></section>`;
}

function renderProfileView() {
  const user = sessionUser();
  const rides = [...state.rides].filter((ride) => ride.passengerId === user.id || ride.assignedHostId === user.id).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return `<section class="grid-two"><article class="content-card"><div class="card-header"><div><p class="eyebrow">Profile</p><h3>${safeText(user.name)}</h3></div><span class="tag ${user.verified ? "success" : "warn"}">${user.verified ? "Verified" : "Unverified"}</span></div><div class="stack"><div class="split-line"><span>Email</span><strong>${safeText(user.email)}</strong></div><div class="split-line"><span>Phone</span><strong>${safeText(user.phone)}</strong></div><div class="split-line"><span>Role</span><strong>${safeText(primaryRole(user))}</strong></div><div class="split-line"><span>Base location</span><strong>${safeText(getLocation(user.currentLocationId)?.name || "Unknown")}</strong></div></div></article><article class="content-card"><div class="card-header"><div><p class="eyebrow">Workspace Access</p><h3>Available sections</h3></div></div><div class="list">${allowedViews(user).map((view) => `<div class="list-item">Access: ${safeText(VIEW_LABELS[view])}</div>`).join("")}</div></article></section><section class="content-card"><div class="card-header"><div><p class="eyebrow">Ride Ledger</p><h3>Your ride history</h3></div></div><div class="list">${rides.length ? rides.map((ride) => `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</strong><span class="tag">${safeText(ride.status.replaceAll("_", " "))}</span></div><p class="muted">${safeText(formatDate(ride.updatedAt))} | Payment ${safeText(ride.paymentMethod)}</p></div>`).join("") : emptyStateHtml()}</div></section>`;
}

function renderView() {
  const root = document.getElementById("view-root");
  const views = { login: renderLoginView, passenger: renderPassengerView, host: renderHostView, arbitrator: renderArbitratorView, admin: renderAdminView, dao: renderDaoView, profile: renderProfileView };
  root.innerHTML = (views[state.ui.view] || renderLoginView)();
}
function bindEvents() {
  document.querySelectorAll("[data-login]").forEach((button) => button.addEventListener("click", () => setState(() => loginAs(button.dataset.login))));
  document.getElementById("logout-button")?.addEventListener("click", () => setState(() => logout()));

  const rideForm = document.getElementById("ride-request-form");
  if (rideForm) {
    rideForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(rideForm);
      setState(() => createRide({ pickupId: form.get("pickupId"), dropId: form.get("dropId"), vehicleType: form.get("vehicleType"), paymentMethod: form.get("paymentMethod") }));
    });
    document.getElementById("sos-button")?.addEventListener("click", () => window.alert("SOS request sent. Emergency contacts and the safety team have been notified."));
  }

  document.getElementById("toggle-host-status")?.addEventListener("click", () => setState(() => { const user = sessionUser(); user.online = !user.online; }));
  document.querySelectorAll("[data-action='accept-ride']").forEach((button) => button.addEventListener("click", () => setState(() => acceptRide(button.dataset.ride))));
  document.querySelectorAll("[data-action='decline-ride']").forEach((button) => button.addEventListener("click", () => setState(() => declineRide(button.dataset.ride))));
  document.querySelectorAll("[data-action='auto-assign']").forEach((button) => button.addEventListener("click", () => setState(() => autoAssignRide(button.dataset.ride))));
  document.querySelectorAll("[data-action='advance-ride']").forEach((button) => button.addEventListener("click", () => setState(() => advanceRide(button.dataset.ride))));

  document.querySelectorAll("[data-action='open-feedback']").forEach((button) => button.addEventListener("click", () => {
    const target = document.getElementById("ride-feedback-area"); if (!target) return;
    target.innerHTML = `<form id="feedback-form" class="stack"><div class="form-grid"><div class="form-field"><label>Host rating</label><select name="hostRating"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div><div class="form-field"><label>Comment</label><input name="feedbackComment" value="Safe ride and timely arrival." /></div></div><div class="inline-actions"><button type="submit">Save feedback</button></div></form>`;
    document.getElementById("feedback-form")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setState(() => submitFeedback(button.dataset.ride, form.get("hostRating"), form.get("feedbackComment"))); });
  }));

  document.querySelectorAll("[data-action='open-dispute']").forEach((button) => button.addEventListener("click", () => {
    const target = document.getElementById("ride-dispute-area"); if (!target) return;
    target.innerHTML = `<form id="dispute-form" class="stack"><div class="form-grid"><div class="form-field"><label>Category</label><select name="category"><option value="fare">Fare</option><option value="conduct">Conduct</option><option value="route">Route</option><option value="safety">Safety</option></select></div><div class="form-field"><label>Evidence summary</label><input name="evidence" value="Route log, chat transcript, and timestamp record." /></div></div><div class="form-field"><label>Description</label><textarea name="description">Please review this ride using the DAO dispute policy.</textarea></div><div class="inline-actions"><button type="submit">Submit dispute</button></div></form>`;
    document.getElementById("dispute-form")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setState(() => fileDispute({ rideId: button.dataset.ride, category: form.get("category"), evidence: form.get("evidence"), description: form.get("description") })); });
  }));

  document.querySelectorAll("[data-form='resolve-dispute']").forEach((formEl) => formEl.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setState(() => resolveDispute(event.currentTarget.dataset.dispute, form.get("verdict"), form.get("resolutionNote"))); }));
  document.querySelectorAll("[data-action='verify-host']").forEach((button) => button.addEventListener("click", () => setState(() => { const host = getUser(button.dataset.host); host.vehicle.verificationStatus = button.dataset.status; })));
  document.getElementById("config-form")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setState((draft) => { draft.config.rideStake = Number(form.get("rideStake")); draft.config.cancellationPenalty = Number(form.get("cancellationPenalty")); draft.config.disputeReward = Number(form.get("disputeReward")); draft.config.disputePenalty = Number(form.get("disputePenalty")); }); });
}

function render() {
  ensureValidView();
  document.getElementById("view-title").textContent = VIEW_LABELS[state.ui.view] || "DAO Ride Sharing";
  renderHeroStats();
  renderNav();
  renderUserSummary();
  renderView();
  bindEvents();
}

render();


