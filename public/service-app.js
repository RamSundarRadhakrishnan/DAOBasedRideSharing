(() => {
  const STORAGE_KEY = "dao-rideshare-shared-v4";
  const CHANNEL_NAME = "dao-rideshare-sync";
  const RIDE_STAGES = ["searching", "host_assigned", "arriving", "ongoing", "completed", "post_feedback"];
  const SERVICE = document.body.dataset.service;
  const APP = document.getElementById("app");
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
  const params = new URLSearchParams(window.location.search);

  const DEFAULT_HOST_SLUG = "asha";
  const DEFAULT_ARBITRATOR_SLUG = "ishan";

  const VIEW_TITLES = {
    rider: "Rider Workspace",
    host: "Host Operations",
    arbitrator: "Arbitrator Desk",
    admin: "Admin Console",
  };

  const LOCATIONS = [
    { id: "loc-campus", name: "VIT Campus", lat: 12.9692, lng: 79.1559 },
    { id: "loc-station", name: "Katpadi Junction", lat: 12.9723, lng: 79.1456 },
    { id: "loc-hospital", name: "CMC Hospital", lat: 12.9246, lng: 79.1351 },
    { id: "loc-mall", name: "Velocity Mall", lat: 12.9464, lng: 79.1332 },
    { id: "loc-airport", name: "Airport Shuttle Hub", lat: 12.9941, lng: 79.1349 },
    { id: "loc-techpark", name: "Tech Park Gate", lat: 12.9574, lng: 79.1614 },
  ];

  const emptyStateHtml = (message = "No live items right now.") => `<div class="empty-state"><h3>Nothing to show</h3><p class="muted">${safeText(message)}</p></div>`;
  const nowIso = () => new Date().toISOString();
  const safeText = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const formatDate = (value) => new Date(value).toLocaleString();
  const shortDate = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const dateDaysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  function statusTag(status) {
    return status === "completed" || status === "post_feedback" || status === "resolved" || status === "approved"
      ? "success"
      : status === "pending" || status === "searching" || status === "submitted" || status === "under_review" || status === "host_assigned" || status === "arriving" || status === "ongoing"
        ? "warn"
        : "danger";
  }

  function createSeedState() {
    return {
      config: {
        rideStake: 2,
        cancellationPenalty: 4,
        disputeReward: 3,
        disputePenalty: 5,
        governanceStake: 3,
        matchingWeights: { reputation: 0.45, distance: 0.3, reliability: 0.25 },
      },
      governanceDecisions: [
        { id: "gov-1", title: "Increase cancellation penalty for repeat no-shows", summary: "Approved after repeated rider complaints and host feedback.", outcome: "Passed", timestamp: "2026-03-10T09:30:00.000Z" },
        { id: "gov-2", title: "Require host document renewal every 180 days", summary: "Improves verification freshness and auditability.", outcome: "Passed", timestamp: "2026-03-16T18:10:00.000Z" },
        { id: "gov-3", title: "Pilot fast-track arbitration for low-value fare disputes", summary: "Community requested quicker closure for minor disputes.", outcome: "Review", timestamp: "2026-03-21T14:45:00.000Z" },
      ],
      governanceProposals: [
        { id: "proposal-1", title: "Require DAO ratification before emergency surge multipliers go live", summary: "Any emergency multiplier should be approved by riders, hosts, and arbitrators before activation.", proposedById: "user-admin-1", status: "open", stakeAmount: 3, votes: [{ userId: "user-passenger-1", choice: "for", stakeAmount: 3, domain: "passenger", votedAt: "2026-03-24T09:15:00.000Z" }, { userId: "user-host-1", choice: "against", stakeAmount: 3, domain: "host", votedAt: "2026-03-24T10:05:00.000Z" }], createdAt: "2026-03-24T08:30:00.000Z", resolvedAt: null, resolutionNote: "", penalties: [] },
      ],
      auditLog: [
        { id: "audit-1", actor: "System", message: "DAO demo state initialized with reputation, disputes, and governance records.", at: nowIso() },
      ],
      users: [
        { id: "user-passenger-1", slug: "ram", name: "Ram Sundar", phone: "+91 98765 43210", email: "ram.sundar@rideshare.app", roles: ["passenger"], verified: true, online: false, reliability: 0.88, currentLocationId: "loc-campus", vehicle: null, reputation: { passenger: 74, host: 8, arbitration: 2 }, reputationHistory: [{ id: "rep-1", timestamp: "2026-03-08T12:00:00.000Z", domain: "passenger", delta: 4, reason: "Completed ride with 5-star host feedback" }, { id: "rep-2", timestamp: "2026-03-19T16:00:00.000Z", domain: "passenger", delta: -2, reason: "Late pickup confirmation on commute request" }] },
        { id: "user-host-1", slug: "asha", name: "Asha Nair", phone: "+91 90000 11111", email: "asha.host@example.com", roles: ["host"], verified: true, online: true, reliability: 0.95, currentLocationId: "loc-station", vehicle: { type: "Sedan", model: "Honda Amaze", plate: "TN09 AB 2233", docsUploaded: true, verificationStatus: "approved" }, reputation: { passenger: 12, host: 92, arbitration: 6 }, reputationHistory: [{ id: "rep-3", timestamp: "2026-03-14T08:00:00.000Z", domain: "host", delta: 5, reason: "Completed 10 rides with zero disputes" }] },
        { id: "user-host-2", slug: "farhan", name: "Farhan Ali", phone: "+91 90000 22222", email: "farhan.host@example.com", roles: ["host"], verified: true, online: true, reliability: 0.86, currentLocationId: "loc-techpark", vehicle: { type: "Hatchback", model: "Maruti Swift", plate: "TN11 CD 5501", docsUploaded: true, verificationStatus: "approved" }, reputation: { passenger: 6, host: 81, arbitration: 4 }, reputationHistory: [] },
        { id: "user-host-3", slug: "meera", name: "Meera Joseph", phone: "+91 90000 33333", email: "meera.host@example.com", roles: ["host"], verified: true, online: true, reliability: 0.91, currentLocationId: "loc-mall", vehicle: { type: "SUV", model: "Hyundai Venue", plate: "TN14 EF 8080", docsUploaded: true, verificationStatus: "approved" }, reputation: { passenger: 10, host: 88, arbitration: 8 }, reputationHistory: [] },
        { id: "user-host-4", slug: "kavya", name: "Kavya Raman", phone: "+91 90000 44444", email: "kavya.host@example.com", roles: ["host"], verified: true, online: false, reliability: 0.84, currentLocationId: "loc-hospital", vehicle: { type: "Sedan", model: "Toyota Etios", plate: "TN21 GH 4412", docsUploaded: true, verificationStatus: "pending" }, reputation: { passenger: 4, host: 79, arbitration: 3 }, reputationHistory: [] },
        { id: "user-arb-1", slug: "ishan", name: "Ishan Menon", phone: "+91 90000 55555", email: "ishan.arb@example.com", roles: ["arbitrator"], verified: true, online: true, reliability: 0.97, currentLocationId: "loc-campus", vehicle: null, reputation: { passenger: 10, host: 12, arbitration: 91 }, reputationHistory: [{ id: "rep-4", timestamp: "2026-03-15T10:15:00.000Z", domain: "arbitration", delta: 3, reason: "Resolved dispute using route logs and receipts" }] },
        { id: "user-admin-1", slug: "operations", name: "DAO Moderator Team", phone: "+91 90000 66666", email: "moderator.dao@example.com", roles: ["admin"], verified: true, online: true, reliability: 1, currentLocationId: "loc-campus", vehicle: null, reputation: { passenger: 0, host: 0, arbitration: 0 }, reputationHistory: [] },
      ],
      rides: [
        { id: "ride-1001", passengerId: "user-passenger-1", pickupId: "loc-campus", dropId: "loc-station", vehicleType: "Sedan", paymentMethod: "UPI", estimatedFare: 182, estimatedTime: 18, distanceKm: 6.1, status: "post_feedback", candidateHostIds: ["user-host-1", "user-host-3"], declinedHostIds: [], assignedHostId: "user-host-1", submittedAt: "2026-03-18T08:05:00.000Z", updatedAt: "2026-03-18T09:05:00.000Z", hostAcceptedAt: "2026-03-18T08:07:00.000Z", passengerRating: 5, hostRating: 4, passengerComment: "Smooth pickup and safe drive.", hostComment: "Passenger was punctual and easy to coordinate with.", hostReputationResolution: "Host reputation +3 after passenger feedback.", passengerReputationResolution: "Passenger reputation +2 after host feedback.", paymentConfirmed: true, reputationStake: 2, activity: [{ status: "searching", at: "2026-03-18T08:05:00.000Z" }, { status: "host_assigned", at: "2026-03-18T08:07:00.000Z" }, { status: "arriving", at: "2026-03-18T08:10:00.000Z" }, { status: "ongoing", at: "2026-03-18T08:19:00.000Z" }, { status: "completed", at: "2026-03-18T08:37:00.000Z" }, { status: "post_feedback", at: "2026-03-18T09:05:00.000Z" }] },
      ],
      disputes: [
        { id: "dispute-1", rideId: "ride-1001", filedById: "user-passenger-1", category: "fare", description: "Driver took a longer route than estimated near the station.", evidence: "Route screenshot, receipt notes, and trip timestamps attached.", status: "resolved", assignedArbitratorIds: ["user-arb-1"], verdict: "Split responsibility", resolutionNote: "Passenger receives partial restoration; host loses 1 host reputation.", reputationImpact: ["Passenger +1 passenger reputation", "Host -1 host reputation", "Arbitrator +2 arbitration reputation"], submittedAt: "2026-03-18T10:10:00.000Z", reviewedAt: "2026-03-18T13:20:00.000Z", resolvedAt: "2026-03-18T18:00:00.000Z" },
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
    try {
      return JSON.parse(raw);
    } catch {
      const seed = createSeedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
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
  function getLocation(id) {
    return LOCATIONS.find((location) => location.id === id);
  }

  function getUser(id) {
    return state.users.find((user) => user.id === id);
  }

  function usersByRole(role) {
    return state.users.filter((user) => user.roles.includes(role));
  }

  function totalReputation(user) {
    return (user.reputation.passenger || 0) + (user.reputation.host || 0) + (user.reputation.arbitration || 0);
  }

  function roleLabel(user) {
    if (!user) return "";
    if (user.roles.includes("admin")) return "Admin";
    if (user.roles.includes("arbitrator")) return "Arbitrator";
    if (user.roles.includes("host")) return "Host";
    return "Passenger";
  }

  function currentUser() {
    if (SERVICE === "rider") return getUser("user-passenger-1");
    if (SERVICE === "admin") return getUser("user-admin-1");
    if (SERVICE === "arbitrator") {
      const slug = params.get("arb") || DEFAULT_ARBITRATOR_SLUG;
      return usersByRole("arbitrator").find((user) => user.slug === slug) || usersByRole("arbitrator")[0];
    }
    const slug = params.get("host") || DEFAULT_HOST_SLUG;
    return usersByRole("host").find((user) => user.slug === slug) || usersByRole("host")[0];
  }

  function currentHost() {
    return SERVICE === "host" ? currentUser() : null;
  }

  function currentArbitrator() {
    return SERVICE === "arbitrator" ? currentUser() : null;
  }

  function currentAdmin() {
    return SERVICE === "admin" ? currentUser() : null;
  }

  function currentDisputeActor() {
    return currentArbitrator() || currentAdmin();
  }

  function canManageDispute(actor, dispute) {
    if (!actor || !dispute) return false;
    if (actor.roles.includes("admin")) return true;
    return actor.roles.includes("arbitrator") && dispute.assignedArbitratorIds.includes(actor.id);
  }

  function hostPageHref(user = currentHost() || usersByRole("host")[0]) {
    return `./host.html?host=${encodeURIComponent(user.slug)}`;
  }

  function arbitratorPageHref(user = currentArbitrator() || usersByRole("arbitrator")[0]) {
    return `./arbitrator.html?arb=${encodeURIComponent(user.slug)}`;
  }

  function addAudit(actor, message) {
    state.auditLog.unshift({ id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, actor, message, at: nowIso() });
    state.auditLog = state.auditLog.slice(0, 18);
  }

  function addReputationEvent(userId, domain, delta, reason) {
    const user = getUser(userId);
    if (!user) return;
    user.reputation[domain] = (user.reputation[domain] || 0) + delta;
    user.reputationHistory.unshift({ id: `rep-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, timestamp: nowIso(), domain, delta, reason });
    user.reputationHistory = user.reputationHistory.slice(0, 18);
  }

  function governanceDomain(user) {
    if (!user) return "passenger";
    if (user.roles.includes("host")) return "host";
    if (user.roles.includes("arbitrator")) return "arbitration";
    return "passenger";
  }

  function governanceVoteTotals(proposal) {
    return (proposal.votes || []).reduce((totals, vote) => {
      if (vote.choice === "for") totals.for += 1;
      if (vote.choice === "against") totals.against += 1;
      return totals;
    }, { for: 0, against: 0 });
  }

  function userVoteForProposal(proposalId, userId) {
    return state.governanceProposals.find((proposal) => proposal.id === proposalId)?.votes?.find((vote) => vote.userId === userId) || null;
  }

  function openGovernanceProposals() {
    return state.governanceProposals.filter((proposal) => proposal.status === "open").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function distanceKm(fromId, toId) {
    const from = getLocation(fromId);
    const to = getLocation(toId);
    if (!from || !to) return 0;
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

  function vehicleFit(hostVehicleType, requestedVehicleType) {
    const rank = { Auto: 1, Hatchback: 2, Sedan: 3, SUV: 4 };
    const hostRank = rank[hostVehicleType] || 0;
    const requestedRank = rank[requestedVehicleType] || 0;
    if (hostRank < requestedRank) return 0;
    return hostRank === requestedRank ? 1 : 0.88;
  }

  function isHostEligible(host, vehicleType) {
    return host.roles.includes("host") && host.online && host.vehicle && host.vehicle.docsUploaded && host.vehicle.verificationStatus === "approved" && vehicleFit(host.vehicle.type, vehicleType) > 0;
  }

  function buildCandidateHosts(rideLike) {
    const weights = state.config.matchingWeights;
    return usersByRole("host").map((host) => {
      const distance = distanceKm(host.currentLocationId, rideLike.pickupId);
      const repScore = Math.min((host.reputation.host || 0) / 100, 1);
      const distanceScore = Math.max(0, 1 - distance / 15);
      const reliabilityScore = host.reliability || 0.5;
      const fitScore = vehicleFit(host.vehicle.type, rideLike.vehicleType);
      const available = isHostEligible(host, rideLike.vehicleType);
      const score = repScore * weights.reputation + distanceScore * weights.distance + reliabilityScore * weights.reliability;
      return { hostId: host.id, score: Number((score + fitScore * 0.1).toFixed(3)), distance: Number(distance.toFixed(1)), available, availabilityLabel: host.vehicle.verificationStatus !== "approved" ? "Pending verification" : host.online ? "Ready" : "Offline" };
    }).sort((a, b) => Number(b.available) - Number(a.available) || b.score - a.score || a.distance - b.distance);
  }

  function passengerActiveRide(userId) {
    return [...state.rides].reverse().find((ride) => ride.passengerId === userId && ride.status !== "post_feedback");
  }

  function ridesForHost(hostId) {
    return [...state.rides].filter((ride) => ride.assignedHostId === hostId || (ride.candidateHostIds || []).includes(hostId)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function disputesForRide(rideId) {
    return state.disputes.filter((dispute) => dispute.rideId === rideId).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  function hasDisputeFromUser(rideId, userId) {
    return state.disputes.some((dispute) => dispute.rideId === rideId && dispute.filedById === userId);
  }

  function refreshRideCandidates(ride) {
    const declined = new Set(ride.declinedHostIds || []);
    ride.candidateHostIds = buildCandidateHosts(ride).filter((entry) => entry.available && !declined.has(entry.hostId)).map((entry) => entry.hostId);
  }

  function syncSearchingRides() {
    state.rides.filter((ride) => ride.status === "searching").forEach((ride) => {
      refreshRideCandidates(ride);
    });
  }
  function createRide(payload) {
    const passenger = currentUser();
    const estimate = estimateRide(payload.pickupId, payload.dropId, payload.vehicleType);
    const timestamp = nowIso();
    const ride = {
      id: `ride-${Date.now()}`,
      passengerId: passenger.id,
      pickupId: payload.pickupId,
      dropId: payload.dropId,
      vehicleType: payload.vehicleType,
      paymentMethod: payload.paymentMethod,
      estimatedFare: estimate.estimatedFare,
      estimatedTime: estimate.estimatedTime,
      distanceKm: estimate.distanceKm,
      status: "searching",
      candidateHostIds: [],
      declinedHostIds: [],
      assignedHostId: null,
      submittedAt: timestamp,
      updatedAt: timestamp,
      hostAcceptedAt: null,
      passengerRating: null,
      hostRating: null,
      passengerComment: "",
      hostComment: "",
      hostReputationResolution: "",
      passengerReputationResolution: "",
      paymentConfirmed: false,
      reputationStake: 0,
      activity: [{ status: "searching", at: timestamp }],
    };
    refreshRideCandidates(ride);
    state.rides.push(ride);
    addAudit(passenger.name, `Submitted ride request ${ride.id} from ${getLocation(ride.pickupId).name} to ${getLocation(ride.dropId).name}.`);
    if (ride.candidateHostIds.length) addAudit("Matching Engine", `Ranked ${ride.candidateHostIds.length} eligible hosts for ${ride.id} using reputation, distance, and reliability.`);
    else addAudit("Matching Engine", `No hosts available near ${getLocation(ride.pickupId).name} for ${ride.id}.`);
  }

  function acceptRide(rideId) {
    const host = currentUser();
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "searching" || !ride.candidateHostIds.includes(host.id)) return;
    const timestamp = nowIso();
    ride.assignedHostId = host.id;
    ride.status = "host_assigned";
    ride.updatedAt = timestamp;
    ride.hostAcceptedAt = timestamp;
    ride.reputationStake = state.config.rideStake;
    ride.activity.push({ status: "host_assigned", at: timestamp });
    addReputationEvent(host.id, "host", 1, `Accepted ride ${ride.id} and staked ${state.config.rideStake} reputation points`);
    addReputationEvent(ride.passengerId, "passenger", 1, `Ride ${ride.id} matched and passenger stake recorded`);
    addAudit(host.name, `Accepted ride ${ride.id}; host reputation stake ${state.config.rideStake} applied.`);
  }

  function declineRide(rideId) {
    const host = currentUser();
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "searching") return;
    ride.declinedHostIds = Array.from(new Set([...(ride.declinedHostIds || []), host.id]));
    ride.updatedAt = nowIso();
    refreshRideCandidates(ride);
    addAudit(host.name, ride.candidateHostIds.length ? `Declined ride ${ride.id}; ${ride.candidateHostIds.length} candidate hosts remain.` : `Declined ride ${ride.id}; no hosts remain in the matching pool.`);
  }

  function autoAssignRide(rideId) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "searching") return;
    refreshRideCandidates(ride);
    const bestHostId = ride.candidateHostIds[0];
    if (!bestHostId) {
      addAudit("Matching Engine", `No eligible hosts available to assign ride ${ride.id}.`);
      return;
    }
    const host = getUser(bestHostId);
    ride.assignedHostId = host.id;
    ride.status = "host_assigned";
    ride.updatedAt = nowIso();
    ride.hostAcceptedAt = nowIso();
    ride.reputationStake = state.config.rideStake;
    ride.activity.push({ status: "host_assigned", at: nowIso() });
    addReputationEvent(host.id, "host", 1, `Auto-match accepted ride ${ride.id} and staked ${state.config.rideStake} reputation points`);
    addReputationEvent(ride.passengerId, "passenger", 1, `Ride ${ride.id} matched through best-host auto assignment`);
    addAudit("Matching Engine", `Auto-assigned ride ${ride.id} to ${host.name}.`);
  }

  function advanceRide(rideId) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride) return;
    const index = RIDE_STAGES.indexOf(ride.status);
    if (index < 0 || index >= RIDE_STAGES.length - 2) return;
    const next = RIDE_STAGES[index + 1];
    ride.status = next;
    ride.updatedAt = nowIso();
    ride.activity.push({ status: next, at: nowIso() });
    if (next === "completed") ride.paymentConfirmed = true;
    addAudit(getUser(ride.assignedHostId)?.name || "Host", `Moved ride ${ride.id} to ${next.replaceAll("_", " ")}.`);
  }

  function finalizeFeedbackIfReady(ride) {
    if (ride.status === "completed" && ride.passengerRating !== null && ride.hostRating !== null) {
      ride.status = "post_feedback";
      ride.updatedAt = nowIso();
      ride.activity.push({ status: "post_feedback", at: nowIso() });
    }
  }

  function submitPassengerFeedback(rideId, hostRating, comment) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "completed" || ride.passengerRating !== null) return;
    const rating = Number(hostRating);
    ride.passengerRating = rating;
    ride.passengerComment = comment.trim();
    ride.updatedAt = nowIso();
    const delta = rating >= 4 ? 3 : rating >= 3 ? 1 : -2;
    addReputationEvent(ride.assignedHostId, "host", delta, `Passenger rated host ${rating}/5 for ride ${ride.id}`);
    ride.hostReputationResolution = `Host reputation ${delta >= 0 ? "+" : ""}${delta} after rider feedback.`;
    addAudit("Rider", `Submitted host feedback for ride ${ride.id}.`);
    finalizeFeedbackIfReady(ride);
  }

  function submitHostFeedback(rideId, passengerRating, comment) {
    const ride = state.rides.find((entry) => entry.id === rideId);
    if (!ride || ride.status !== "completed" || ride.hostRating !== null) return;
    const rating = Number(passengerRating);
    ride.hostRating = rating;
    ride.hostComment = comment.trim();
    ride.updatedAt = nowIso();
    const delta = rating >= 4 ? 2 : rating >= 3 ? 1 : -2;
    addReputationEvent(ride.passengerId, "passenger", delta, `Host rated passenger ${rating}/5 for ride ${ride.id}`);
    ride.passengerReputationResolution = `Passenger reputation ${delta >= 0 ? "+" : ""}${delta} after host feedback.`;
    addAudit(currentUser().name, `Submitted passenger feedback for ride ${ride.id}.`);
    finalizeFeedbackIfReady(ride);
  }

  function fileDispute(payload) {
    const filer = currentUser();
    const arbitrator = usersByRole("arbitrator").sort((a, b) => b.reputation.arbitration - a.reputation.arbitration)[0];
    const domain = filer.roles.includes("host") ? "host" : "passenger";
    state.disputes.unshift({ id: `dispute-${Date.now()}`, rideId: payload.rideId, filedById: filer.id, category: payload.category, description: payload.description, evidence: payload.evidence, status: "submitted", assignedArbitratorIds: [arbitrator.id], verdict: "", resolutionNote: "", reputationImpact: [], submittedAt: nowIso(), reviewedAt: null, resolvedAt: null });
    addReputationEvent(filer.id, domain, -1, `Filed dispute for ride ${payload.rideId}`);
    addAudit(filer.name, `Filed ${payload.category} dispute for ride ${payload.rideId}; assigned to ${arbitrator.name}.`);
  }

  function createGovernanceProposal(payload) {
    const admin = currentAdmin();
    if (!admin) return;
    const title = payload.title?.trim();
    const summary = payload.summary?.trim();
    const stakeAmount = Math.max(1, Number(payload.stakeAmount) || state.config.governanceStake);
    if (!title || !summary) return;
    state.governanceProposals.unshift({ id: `proposal-${Date.now()}`, title, summary, proposedById: admin.id, status: "open", stakeAmount, votes: [], createdAt: nowIso(), resolvedAt: null, resolutionNote: "", penalties: [] });
    addAudit(admin.name, `Introduced governance proposal "${title}" with ${stakeAmount} reputation stake.`);
  }

  function castGovernanceVote(proposalId, choice) {
    const user = currentUser();
    const proposal = state.governanceProposals.find((entry) => entry.id === proposalId);
    if (!user || !proposal || proposal.status !== "open" || user.roles.includes("admin")) return;
    if (userVoteForProposal(proposalId, user.id)) return;
    const domain = governanceDomain(user);
    const stakeAmount = proposal.stakeAmount || state.config.governanceStake;
    if ((user.reputation[domain] || 0) < stakeAmount) return;
    proposal.votes.push({ userId: user.id, choice, stakeAmount, domain, votedAt: nowIso() });
    addAudit(user.name, `Voted ${choice} on governance proposal "${proposal.title}" and staked ${stakeAmount} ${domain} reputation.`);
  }

  function resolveGovernanceProposal(proposalId, resolutionNote) {
    const admin = currentAdmin();
    const proposal = state.governanceProposals.find((entry) => entry.id === proposalId);
    if (!admin || !proposal || proposal.status !== "open") return;
    const totals = governanceVoteTotals(proposal);
    const passed = totals.for > totals.against;
    const losingChoice = passed ? "against" : "for";
    proposal.status = passed ? "passed" : "rejected";
    proposal.resolutionNote = resolutionNote.trim();
    proposal.resolvedAt = nowIso();
    proposal.penalties = [];

    proposal.votes.filter((vote) => vote.choice === losingChoice).forEach((vote) => {
      const voter = getUser(vote.userId);
      if (!voter) return;
      const domain = vote.domain || governanceDomain(voter);
      const penalty = vote.stakeAmount || proposal.stakeAmount || state.config.governanceStake;
      addReputationEvent(voter.id, domain, -penalty, `Lost governance stake on proposal "${proposal.title}" after it ${passed ? "passed" : "failed"}`);
      proposal.penalties.push(`${voter.name} -${penalty} ${domain} reputation`);
    });

    state.governanceDecisions.unshift({
      id: `gov-${Date.now()}`,
      title: proposal.title,
      summary: `${proposal.resolutionNote || proposal.summary} | Votes For ${totals.for}, Against ${totals.against}${proposal.penalties.length ? ` | Penalties ${proposal.penalties.length}` : ""}.`,
      outcome: passed ? "Passed" : "Rejected",
      timestamp: proposal.resolvedAt,
    });
    state.governanceDecisions = state.governanceDecisions.slice(0, 12);
    addAudit(admin.name, `Resolved governance proposal "${proposal.title}" as ${passed ? "Passed" : "Rejected"}; ${proposal.penalties.length} stake penalties applied.`);
  }

  function startDisputeReview(disputeId) {
    const actor = currentDisputeActor();
    const dispute = state.disputes.find((entry) => entry.id === disputeId);
    if (!canManageDispute(actor, dispute) || dispute.status !== "submitted") return;
    dispute.status = "under_review";
    dispute.reviewedAt = nowIso();
    addAudit(actor.name, actor.roles.includes("admin") ? `Moved dispute ${dispute.id} to under review from the admin console.` : `Started review on dispute ${dispute.id}.`);
  }

  function assignDisputeArbitrator(disputeId, arbitratorId) {
    const admin = currentAdmin();
    const dispute = state.disputes.find((entry) => entry.id === disputeId);
    const arbitrator = getUser(arbitratorId);
    if (!admin || !dispute || dispute.status === "resolved" || !arbitrator || !arbitrator.roles.includes("arbitrator")) return;
    dispute.assignedArbitratorIds = [arbitrator.id];
    if (dispute.status === "under_review") {
      dispute.status = "submitted";
      dispute.reviewedAt = null;
    }
    addAudit(admin.name, `Assigned dispute ${dispute.id} to ${arbitrator.name}.`);
  }

  function resolveDispute(disputeId, verdict, resolutionNote) {
    const actor = currentDisputeActor();
    const dispute = state.disputes.find((entry) => entry.id === disputeId);
    const ride = dispute ? state.rides.find((entry) => entry.id === dispute.rideId) : null;
    if (!canManageDispute(actor, dispute) || !ride || dispute.status === "resolved") return;
    const passenger = getUser(ride.passengerId);
    const host = getUser(ride.assignedHostId);
    if (!passenger || !host) return;
    dispute.status = "resolved";
    dispute.verdict = verdict;
    dispute.resolutionNote = resolutionNote.trim();
    dispute.reviewedAt = dispute.reviewedAt || nowIso();
    dispute.resolvedAt = nowIso();
    if (verdict === "Favor passenger") {
      addReputationEvent(passenger.id, "passenger", state.config.disputeReward, `Arbitration upheld passenger claim on ride ${ride.id}`);
      addReputationEvent(host.id, "host", -state.config.disputePenalty, `Arbitration penalty applied after dispute ${dispute.id}`);
      dispute.reputationImpact = [`Passenger +${state.config.disputeReward} passenger reputation`, `Host -${state.config.disputePenalty} host reputation`];
    } else if (verdict === "Favor host") {
      addReputationEvent(host.id, "host", state.config.disputeReward, `Arbitration upheld host response on ride ${ride.id}`);
      addReputationEvent(passenger.id, "passenger", -state.config.disputePenalty, `Arbitration rejected dispute ${dispute.id}`);
      dispute.reputationImpact = [`Host +${state.config.disputeReward} host reputation`, `Passenger -${state.config.disputePenalty} passenger reputation`];
    } else {
      addReputationEvent(passenger.id, "passenger", 1, `Arbitration split responsibility on ride ${ride.id}`);
      addReputationEvent(host.id, "host", -1, `Arbitration split responsibility on ride ${ride.id}`);
      dispute.reputationImpact = ["Passenger +1 passenger reputation", "Host -1 host reputation"];
    }
    if (actor.roles.includes("arbitrator")) {
      addReputationEvent(actor.id, "arbitration", 2, `Resolved dispute ${dispute.id}`);
      dispute.reputationImpact.push("Arbitrator +2 arbitration reputation");
      addAudit(actor.name, `Resolved dispute ${dispute.id} with verdict \"${verdict}\".`);
    } else {
      dispute.reputationImpact.push("Moderator oversight closure");
      addAudit(actor.name, `Resolved dispute ${dispute.id} from the admin console with verdict \"${verdict}\".`);
    }
  }
  function verificationTone(status) {
    return status === "approved" ? "success" : status === "pending" ? "warn" : "danger";
  }

  function renderTimeline(ride) {
    return `<div class="timeline">${RIDE_STAGES.map((stage, index) => { const currentIndex = RIDE_STAGES.indexOf(ride.status); const cls = index < currentIndex ? "done" : index === currentIndex ? "active" : ""; return `<span class="timeline-step ${cls}">${safeText(stage.replaceAll("_", " "))}</span>`; }).join("")}</div>`;
  }

  function renderTopbar(title, statusText) {
    return `<header class="topbar"><div><p class="eyebrow">${safeText(title)}</p><h2>${safeText(VIEW_TITLES[SERVICE])}</h2></div><div class="status-chip"><span class="status-dot"></span>${safeText(statusText)}</div></header>`;
  }

  function renderHeroStats(items) {
    return `<section class="hero-stats">${items.map((item) => `<article class="hero-card"><p class="eyebrow">${safeText(item.label)}</p><h3>${safeText(item.value)}</h3><p class="muted">${safeText(item.help)}</p></article>`).join("")}</section>`;
  }

  function renderDaoPanels(user) {
    const governanceDomainName = governanceDomain(user);
    const proposals = openGovernanceProposals();
    const domainCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Domain Reputation</p><h3>Your DAO standing</h3></div><span class="tag">${safeText(roleLabel(user))}</span></div><div class="stack">${["passenger", "host", "arbitration"].map((domain) => `<div><div class="split-line"><strong>${safeText(domain)}</strong><span>${safeText(user.reputation[domain] || 0)}</span></div><div class="reputation-bar"><span style="width:${Math.min(Math.max(user.reputation[domain] || 0, 0), 100)}%"></span></div></div>`).join("")}</div></article>`;
    const proposalCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Governance</p><h3>Open DAO proposals</h3></div></div><div class="list">${proposals.length ? proposals.map((proposal) => { const totals = governanceVoteTotals(proposal); const existingVote = userVoteForProposal(proposal.id, user.id); const canVote = !existingVote && !user.roles.includes("admin") && (user.reputation[governanceDomainName] || 0) >= proposal.stakeAmount; return `<div class="list-item"><div class="split-line"><strong>${safeText(proposal.title)}</strong><span class="tag warn">Open</span></div><p>${safeText(proposal.summary)}</p><p class="muted">Stake ${proposal.stakeAmount} ${safeText(governanceDomainName)} reputation | For ${totals.for} | Against ${totals.against}</p>${existingVote ? `<p class="muted">Your vote: ${safeText(existingVote.choice)}</p>` : `<p class="muted">Proposed ${safeText(shortDate(proposal.createdAt))}</p>`}${!existingVote && !user.roles.includes("admin") ? canVote ? `<div class="inline-actions"><button data-action="vote-proposal" data-proposal="${proposal.id}" data-vote="for">Vote for</button><button class="secondary" data-action="vote-proposal" data-proposal="${proposal.id}" data-vote="against">Vote against</button></div>` : `<p class="muted">Need ${proposal.stakeAmount} ${safeText(governanceDomainName)} reputation to stake a vote.</p>` : ""}</div>`; }).join("") : emptyStateHtml("No governance proposals are open right now.")}</div></article>`;
    const decisionCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Governance</p><h3>DAO rule decisions</h3></div></div><div class="list">${state.governanceDecisions.length ? state.governanceDecisions.map((entry) => `<div class="list-item"><div class="split-line"><strong>${safeText(entry.title)}</strong><span class="tag ${entry.outcome === "Passed" ? "success" : entry.outcome === "Rejected" ? "danger" : "warn"}">${safeText(entry.outcome)}</span></div><p class="muted">${safeText(entry.summary)}</p><p class="muted">${safeText(shortDate(entry.timestamp))}</p></div>`).join("") : emptyStateHtml("No governance decisions recorded yet.")}</div></article>`;
    const reputationHistory = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Reputation History</p><h3>Recent DAO events</h3></div></div><div class="list">${user.reputationHistory.length ? user.reputationHistory.slice(0, 6).map((entry) => `<div class="list-item"><div class="split-line"><strong>${entry.delta >= 0 ? "+" : ""}${entry.delta} ${safeText(entry.domain)}</strong><span class="muted">${safeText(shortDate(entry.timestamp))}</span></div><p class="muted">${safeText(entry.reason)}</p></div>`).join("") : emptyStateHtml("No reputation events recorded yet.")}</div></article>`;
    return `<section class="grid-two">${domainCard}${proposalCard}</section><section class="grid-two">${decisionCard}${reputationHistory}</section>`;
  }

  function renderRideDisputeList(ride) {
    const rideDisputes = disputesForRide(ride.id);
    if (!rideDisputes.length) return "";
    return `<div class="stack"><div class="card-header"><div><p class="eyebrow">Disputes</p><h3>Ride dispute status</h3></div></div><div class="list">${rideDisputes.map((dispute) => `<div class="list-item"><div class="split-line"><strong>${safeText(dispute.category)} dispute</strong><span class="tag ${statusTag(dispute.status)}">${safeText(dispute.status.replaceAll("_", " "))}</span></div><p class="muted">Filed ${safeText(shortDate(dispute.submittedAt))}</p><p>${safeText(dispute.description)}</p>${dispute.verdict ? `<p class="muted">Verdict: ${safeText(dispute.verdict)} | ${safeText(dispute.resolutionNote)}</p>` : ""}${dispute.reputationImpact?.length ? `<p class="muted">${safeText(dispute.reputationImpact.join(" | "))}</p>` : ""}</div>`).join("")}</div></div>`;
  }

  function renderPassengerRideCard(ride) {
    const assignedHost = ride.assignedHostId ? getUser(ride.assignedHostId) : null;
    const candidates = buildCandidateHosts(ride).filter((entry) => (ride.candidateHostIds || []).includes(entry.hostId)).map((entry) => { const host = getUser(entry.hostId); return `<div class="list-item"><div class="split-line"><strong>${safeText(host.name)}</strong><span class="tag">${safeText(host.vehicle.type)}</span></div><p class="muted">Host rep ${host.reputation.host} | Match score ${entry.score} | ${entry.distance} km away</p><p class="muted">Reliability ${(host.reliability * 100).toFixed(0)}% | Verification ${safeText(host.vehicle.verificationStatus)}</p></div>`; }).join("");
    const disputes = renderRideDisputeList(ride);
    const resolutionNotes = [ride.hostReputationResolution, ride.passengerReputationResolution].filter(Boolean).map((note) => `<div class="list-item">${safeText(note)}</div>`).join("");
    return `<div class="stack"><div class="split-line"><strong>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</strong><span class="tag ${ride.status === "completed" || ride.status === "post_feedback" ? "success" : "warn"}">${safeText(ride.status.replaceAll("_", " "))}</span></div><p class="muted">Fare estimate Rs. ${ride.estimatedFare} | ETA ${ride.estimatedTime} min | Distance ${ride.distanceKm} km | Payment ${safeText(ride.paymentMethod)}</p>${renderTimeline(ride)}${assignedHost ? `<div class="notice">Assigned host: <strong>${safeText(assignedHost.name)}</strong> | Vehicle ${safeText(assignedHost.vehicle.model)} (${safeText(assignedHost.vehicle.plate)}) | Host rep ${assignedHost.reputation.host}</div>` : ride.candidateHostIds.length ? `<div class="stack"><p class="muted">Candidate hosts ranked by reputation, distance, and past reliability:</p><div class="list">${candidates}</div></div>` : `<div class="notice">No hosts in your area currently. Try a different pickup point or vehicle type.</div>`}${resolutionNotes ? `<div class="stack"><div class="card-header"><div><p class="eyebrow">Post-Ride Resolution</p><h3>Reputation outcomes</h3></div></div><div class="list">${resolutionNotes}</div></div>` : ""}${disputes}<div class="inline-actions">${ride.status === "searching" ? `<button data-action="auto-assign" data-ride="${ride.id}">Simulate best host acceptance</button>` : ""}${ride.status === "completed" && ride.passengerRating === null ? `<button class="secondary" data-action="open-feedback" data-ride="${ride.id}">Submit host feedback</button>` : ""}${(ride.status === "completed" || ride.status === "post_feedback") && !hasDisputeFromUser(ride.id, currentUser().id) ? `<button class="ghost" data-action="open-dispute" data-ride="${ride.id}">File dispute</button>` : ""}</div><div id="ride-feedback-area"></div><div id="ride-dispute-slot-${ride.id}"></div></div>`;
  }

  function hostPerformanceSummary(host) {
    const completedRides = state.rides.filter((ride) => ride.assignedHostId === host.id && ["completed", "post_feedback"].includes(ride.status));
    const weeklyRides = completedRides.filter((ride) => new Date(ride.updatedAt) >= new Date(dateDaysAgo(7)));
    const cancellationPenalties = host.reputationHistory.filter((entry) => entry.reason.toLowerCase().includes("cancellation")).length;
    return { rideCount: completedRides.length, cancellationPenalties, weeklySummary: `${weeklyRides.length} completed this week | Reliability ${(host.reliability * 100).toFixed(0)}%` };
  }

  function averageHostReputation() {
    const hosts = usersByRole("host");
    return Math.round(hosts.reduce((sum, host) => sum + host.reputation.host, 0) / Math.max(hosts.length, 1));
  }

  function renderRider() {
    const user = currentUser();
    const ride = passengerActiveRide(user.id);
    const recent = [...state.rides].filter((entry) => entry.passengerId === user.id && entry.status === "post_feedback").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
    const openDisputes = state.disputes.filter((entry) => entry.filedById === user.id && entry.status !== "resolved").length;
    const top = renderTopbar("Trip Booking", ride ? `Active ride: ${ride.status.replaceAll("_", " ")}` : "Ready for a new booking");
    const stats = renderHeroStats([{ label: "Passenger rep", value: user.reputation.passenger, help: "Used in trust and matching screens" }, { label: "Open disputes", value: openDisputes, help: "Track submitted and under-review cases" }, { label: "Completed trips", value: recent.length, help: "Post-ride feedback and payment trail" }]);
    const requestCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Request Ride</p><h3>Create a booking</h3></div><span class="tag">${safeText(getLocation(user.currentLocationId)?.name || "Unknown location")}</span></div><div class="notice">Matching uses host reputation, distance, and past reliability.</div><form id="ride-form" class="stack"><div class="form-grid"><div class="form-field"><label>Pickup</label><select name="pickupId">${LOCATIONS.map((location) => `<option value="${location.id}" ${location.id === user.currentLocationId ? "selected" : ""}>${safeText(location.name)}</option>`).join("")}</select></div><div class="form-field"><label>Drop</label><select name="dropId">${LOCATIONS.map((location) => `<option value="${location.id}">${safeText(location.name)}</option>`).join("")}</select></div><div class="form-field"><label>Vehicle type</label><select name="vehicleType">${["Auto", "Hatchback", "Sedan", "SUV"].map((type) => `<option value="${type}">${type}</option>`).join("")}</select></div><div class="form-field"><label>Payment method</label><select name="paymentMethod">${["UPI", "Cash", "Card"].map((method) => `<option value="${method}">${method}</option>`).join("")}</select></div></div><div class="inline-actions"><button type="submit">Create ride request</button><button type="button" class="secondary" id="sos-button">SOS safety action</button></div></form></article>`;
    const activeCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Ride Lifecycle</p><h3>Your active ride</h3></div></div>${ride ? renderPassengerRideCard(ride) : emptyStateHtml("Create a new ride request to see the matching engine and DAO reputation flow.")}</article>`;
    const recentCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Recent Activity</p><h3>Completed rides and payment trail</h3></div></div><div class="list">${recent.length ? recent.map((entry) => { const host = getUser(entry.assignedHostId); return `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(entry.pickupId).name)} to ${safeText(getLocation(entry.dropId).name)}</strong><span class="tag success">${entry.paymentConfirmed ? "Payment confirmed" : "Pending payment"}</span></div><p class="muted">Host: ${safeText(host?.name || "Unassigned")} | Fare Rs. ${entry.estimatedFare} | ${safeText(shortDate(entry.updatedAt))}</p></div>`; }).join("") : emptyStateHtml()}</div></article>`;
    return shell("Rider App", "Request rides, review matching results, and track reputation outcomes after each trip.", { text: "Passenger verified", className: "success" }, `${top}${stats}<section class="grid-two">${requestCard}${activeCard}</section>${recentCard}${renderDaoPanels(user)}`);
  }
  function renderHost() {
    const user = currentUser();
    const rides = ridesForHost(user.id);
    const pending = rides.filter((ride) => ride.status === "searching" && (ride.candidateHostIds || []).includes(user.id));
    const active = rides.filter((ride) => ride.assignedHostId === user.id && ["host_assigned", "arriving", "ongoing", "completed", "post_feedback"].includes(ride.status));
    const performance = hostPerformanceSummary(user);
    const top = renderTopbar("Host Dashboard", user.online ? "Accepting ride requests" : "Offline");
    const stats = renderHeroStats([{ label: "Host reputation", value: user.reputation.host, help: "Colony domain score for hosting actions" }, { label: "Ride count", value: performance.rideCount, help: "Completed or post-feedback trips" }, { label: "Cancellation penalties", value: performance.cancellationPenalties, help: "Recent penalty count from host actions" }]);
    const performanceCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Performance Dashboard</p><h3>${safeText(user.name)}</h3></div><span class="tag ${user.online ? "success" : "danger"}">${user.online ? "Online" : "Offline"}</span></div><div class="grid-three"><div class="list-item"><p class="muted">Host reputation score</p><strong>${user.reputation.host}</strong></div><div class="list-item"><p class="muted">Ride stake</p><strong>${state.config.rideStake}</strong></div><div class="list-item"><p class="muted">Weekly summary</p><strong>${safeText(performance.weeklySummary)}</strong></div></div><div class="notice">${safeText(user.vehicle.model)} | ${safeText(user.vehicle.plate)} | Verification ${safeText(user.vehicle.verificationStatus)} | Docs uploaded ${user.vehicle.docsUploaded ? "Yes" : "No"}</div><div class="inline-actions"><button id="toggle-host-status">${user.online ? "Go offline" : "Go online"}</button></div></article>`;
    const requestCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Incoming Requests</p><h3>Requests assigned to this host</h3></div></div><div class="list">${pending.length ? pending.map((ride) => { const passenger = getUser(ride.passengerId); const candidate = buildCandidateHosts(ride).find((entry) => entry.hostId === user.id); return `<div class="list-item"><div class="split-line"><strong>${safeText(getLocation(ride.pickupId).name)} to ${safeText(getLocation(ride.dropId).name)}</strong><span class="tag">Passenger rep ${passenger.reputation.passenger}</span></div><p class="muted">${safeText(passenger.name)} | Fare Rs. ${ride.estimatedFare} | Score ${candidate?.score ?? "--"} | Stake ${state.config.rideStake}</p><div class="inline-actions"><button data-action="accept-ride" data-ride="${ride.id}">Accept</button><button class="secondary" data-action="decline-ride" data-ride="${ride.id}">Decline</button></div></div>`; }).join("") : emptyStateHtml("No pending requests for this host persona right now.")}</div></article>`;
    const activeCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Assigned Rides</p><h3>Active host timeline</h3></div></div><div class="list">${active.length ? active.map((ride) => { const passenger = getUser(ride.passengerId); const disputes = renderRideDisputeList(ride); const canFileDispute = !hasDisputeFromUser(ride.id, user.id); return `<div class="list-item"><div class="split-line"><strong>${safeText(passenger.name)}</strong><span class="tag ${ride.status === "completed" || ride.status === "post_feedback" ? "success" : "warn"}">${safeText(ride.status.replaceAll("_", " "))}</span></div><p class="muted">Pickup ${safeText(getLocation(ride.pickupId).name)} | Drop ${safeText(getLocation(ride.dropId).name)} | Passenger rep ${passenger.reputation.passenger}</p>${renderTimeline(ride)}${disputes}<div class="inline-actions">${["host_assigned", "arriving", "ongoing"].includes(ride.status) ? `<button data-action="advance-ride" data-ride="${ride.id}">Advance ride stage</button>` : ""}${ride.status === "completed" && ride.hostRating === null ? `<button class="secondary" data-action="open-passenger-feedback" data-ride="${ride.id}">Rate passenger</button>` : ""}${(ride.status === "completed" || ride.status === "post_feedback") && canFileDispute ? `<button class="ghost" data-action="open-dispute" data-ride="${ride.id}">File dispute</button>` : ""}</div><div id="host-feedback-slot-${ride.id}"></div><div id="ride-dispute-slot-${ride.id}"></div></div>`; }).join("") : emptyStateHtml("Accept a ride to see the live host workflow here.")}</div></article>`;
    return shell("Host App", "Receive requests, stake reputation on acceptance, and manage ride progress and passenger ratings.", { text: user.vehicle.verificationStatus === "approved" ? "KYC and vehicle approved" : "Verification pending", className: user.vehicle.verificationStatus === "approved" ? "success" : "warn" }, `${top}${stats}<section class="grid-two">${performanceCard}${requestCard}</section>${activeCard}${renderDaoPanels(user)}`);
  }

  function renderArbitrator() {
    const user = currentUser();
    const queue = state.disputes.filter((dispute) => dispute.status !== "resolved" && dispute.assignedArbitratorIds.includes(user.id));
    const resolved = state.disputes.filter((dispute) => dispute.status === "resolved" && dispute.assignedArbitratorIds.includes(user.id)).slice(0, 4);
    const top = renderTopbar("Arbitration", queue.length ? `${queue.length} unresolved dispute${queue.length === 1 ? "" : "s"}` : "Queue clear");
    const stats = renderHeroStats([{ label: "Arbitration rep", value: user.reputation.arbitration, help: "Influence earned through dispute resolution" }, { label: "Open cases", value: queue.length, help: "Submitted or under-review disputes assigned to you" }, { label: "Resolved cases", value: resolved.length, help: "Recent verdicts completed by this arbitrator" }]);
    const summaryCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Arbitrator Dashboard</p><h3>${safeText(user.name)}</h3></div></div><div class="notice">Only authorized arbitrators can access evidence, verdict controls, and arbitration-domain reputation updates.</div></article>`;
    const recentCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Resolved History</p><h3>Recent arbitration outcomes</h3></div></div><div class="list">${resolved.length ? resolved.map((dispute) => `<div class="list-item"><div class="split-line"><strong>${safeText(dispute.verdict)}</strong><span class="muted">${safeText(shortDate(dispute.resolvedAt))}</span></div><p class="muted">${safeText(dispute.resolutionNote)}</p><p class="muted">${safeText((dispute.reputationImpact || []).join(" | "))}</p></div>`).join("") : emptyStateHtml("No resolved disputes recorded yet.")}</div></article>`;
    const queueCard = `<section class="content-card"><div class="card-header"><div><p class="eyebrow">Open Cases</p><h3>Evidence and decision tools</h3></div></div><div class="list">${queue.length ? queue.map((dispute) => { const ride = state.rides.find((entry) => entry.id === dispute.rideId); const passenger = ride ? getUser(ride.passengerId) : null; const host = ride ? getUser(ride.assignedHostId) : null; return `<div class="list-item"><div class="split-line"><strong>${safeText(dispute.category)} dispute</strong><span class="tag ${statusTag(dispute.status)}">${safeText(dispute.status.replaceAll("_", " "))}</span></div><p class="muted">Passenger: ${safeText(passenger?.name || "Unknown")} | Host: ${safeText(host?.name || "Pending assignment")}</p><p>${safeText(dispute.description)}</p><p class="muted">Evidence: ${safeText(dispute.evidence)}</p>${dispute.status === "submitted" ? `<div class="inline-actions"><button data-action="start-review" data-dispute="${dispute.id}">Start review</button></div>` : ""}${dispute.status === "under_review" ? `<form class="stack" data-form="resolve-dispute" data-dispute="${dispute.id}"><div class="form-grid"><div class="form-field"><label>Verdict</label><select name="verdict"><option>Favor passenger</option><option>Favor host</option><option>Split responsibility</option></select></div><div class="form-field"><label>Resolution note</label><input name="resolutionNote" value="Evidence reviewed and DAO rules applied." /></div></div><div class="inline-actions"><button type="submit">Resolve dispute</button></div></form>` : ""}</div>`; }).join("") : emptyStateHtml("No unresolved disputes assigned to this arbitrator.")}</div></section>`;
    return shell("Arbitrator App", "Review evidence, cast verdicts, and update arbitration-domain reputation according to DAO rules.", { text: "Authorized arbitrator", className: "warn" }, `${top}${stats}<section class="grid-two">${summaryCard}${recentCard}</section>${queueCard}${renderDaoPanels(user)}`);
  }
  function renderAdmin() {
    const openDisputes = state.disputes.filter((entry) => entry.status !== "resolved");
    const openProposals = openGovernanceProposals();
    const hostReviews = usersByRole("host");
    const arbitrators = usersByRole("arbitrator");
    const top = renderTopbar("Operations", `${openDisputes.length} flagged dispute${openDisputes.length === 1 ? "" : "s"} | ${openProposals.length} open proposal${openProposals.length === 1 ? "" : "s"}`);
    const stats = renderHeroStats([{ label: "Ride volume", value: state.rides.length, help: "Total rides in the shared DAO demo state" }, { label: "Disputes", value: openDisputes.length, help: "Submitted or under-review disputes" }, { label: "Open proposals", value: openProposals.length, help: "Governance rules awaiting DAO resolution" }]);
    const verificationCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Verification Queue</p><h3>Host document review</h3></div></div><div class="list">${hostReviews.map((host) => `<div class="list-item"><div class="split-line"><strong>${safeText(host.name)}</strong><span class="tag ${verificationTone(host.vehicle.verificationStatus)}">${safeText(host.vehicle.verificationStatus)}</span></div><p class="muted">${safeText(host.vehicle.model)} | ${safeText(host.vehicle.plate)} | Docs uploaded ${host.vehicle.docsUploaded ? "Yes" : "No"}</p><div class="inline-actions"><button data-action="verify-host" data-host="${host.id}" data-status="approved">Approve</button><button class="secondary" data-action="verify-host" data-host="${host.id}" data-status="pending">Mark pending</button><button class="ghost" data-action="verify-host" data-host="${host.id}" data-status="rejected">Reject</button></div></div>`).join("")}</div></article>`;
    const configCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">DAO Rule Constants</p><h3>Moderation-safe configuration</h3></div></div><form id="config-form" class="stack"><div class="form-grid"><div class="form-field"><label>Ride reputation stake</label><input name="rideStake" type="number" min="0" value="${state.config.rideStake}" /></div><div class="form-field"><label>Cancellation penalty</label><input name="cancellationPenalty" type="number" min="0" value="${state.config.cancellationPenalty}" /></div><div class="form-field"><label>Dispute reward</label><input name="disputeReward" type="number" min="0" value="${state.config.disputeReward}" /></div><div class="form-field"><label>Dispute penalty</label><input name="disputePenalty" type="number" min="0" value="${state.config.disputePenalty}" /></div><div class="form-field"><label>Governance vote stake</label><input name="governanceStake" type="number" min="1" value="${state.config.governanceStake}" /></div></div><div class="inline-actions"><button type="submit">Save DAO constants</button></div></form></article>`;
    const disputeCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Dispute Oversight</p><h3>Assign, review, and resolve cases</h3></div></div><div class="list">${openDisputes.length ? openDisputes.map((dispute) => { const ride = state.rides.find((entry) => entry.id === dispute.rideId); const passenger = ride ? getUser(ride.passengerId) : null; const host = ride ? getUser(ride.assignedHostId) : null; const assignedArbitrator = getUser(dispute.assignedArbitratorIds[0]); return `<div class="list-item"><div class="split-line"><strong>${safeText(dispute.category)} dispute</strong><span class="tag ${statusTag(dispute.status)}">${safeText(dispute.status.replaceAll("_", " "))}</span></div><p class="muted">Passenger: ${safeText(passenger?.name || "Unknown")} | Host: ${safeText(host?.name || "Unassigned")} | Ride ${safeText(dispute.rideId)}</p><p>${safeText(dispute.description)}</p><p class="muted">Evidence: ${safeText(dispute.evidence)}</p><form class="stack" data-form="assign-arbitrator" data-dispute="${dispute.id}"><div class="form-grid"><div class="form-field"><label>Assigned arbitrator</label><select name="arbitratorId">${arbitrators.map((arbitrator) => `<option value="${arbitrator.id}" ${assignedArbitrator?.id === arbitrator.id ? "selected" : ""}>${safeText(arbitrator.name)} | Rep ${arbitrator.reputation.arbitration}</option>`).join("")}</select></div></div><div class="inline-actions"><button type="submit">Assign arbitrator</button>${dispute.status === "submitted" ? `<button type="button" class="secondary" data-action="start-review" data-dispute="${dispute.id}">Mark under review</button>` : ""}</div></form><form class="stack" data-form="resolve-dispute" data-dispute="${dispute.id}"><div class="form-grid"><div class="form-field"><label>Verdict</label><select name="verdict"><option ${dispute.verdict === "Favor passenger" ? "selected" : ""}>Favor passenger</option><option ${dispute.verdict === "Favor host" ? "selected" : ""}>Favor host</option><option ${dispute.verdict === "Split responsibility" ? "selected" : ""}>Split responsibility</option></select></div><div class="form-field"><label>Resolution note</label><input name="resolutionNote" value="${safeText(dispute.resolutionNote || "Evidence reviewed and DAO rules applied.")}" /></div></div><div class="inline-actions"><button type="submit">Resolve dispute</button></div></form></div>`; }).join("") : emptyStateHtml("No disputes currently require moderator oversight.")}</div></article>`;
    const governanceBuilderCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Governance Builder</p><h3>Introduce DAO rules</h3></div></div><form id="proposal-form" class="stack"><div class="form-grid"><div class="form-field"><label>Proposal title</label><input name="proposalTitle" value="Introduce a 10-minute host grace period for pickup confirmations" /></div><div class="form-field"><label>Vote stake</label><input name="proposalStake" type="number" min="1" value="${state.config.governanceStake}" /></div></div><div class="form-field"><label>Proposal summary</label><textarea name="proposalSummary">Contributors who vote against a passed rule, or for a failed rule, lose their staked governance reputation.</textarea></div><div class="inline-actions"><button type="submit">Publish proposal</button></div></form><div class="list">${openProposals.length ? openProposals.map((proposal) => { const totals = governanceVoteTotals(proposal); return `<div class="list-item"><div class="split-line"><strong>${safeText(proposal.title)}</strong><span class="tag warn">Open</span></div><p>${safeText(proposal.summary)}</p><p class="muted">Stake ${proposal.stakeAmount} reputation | For ${totals.for} | Against ${totals.against}</p>${proposal.votes.length ? `<p class="muted">Voters: ${proposal.votes.map((vote) => `${safeText(getUser(vote.userId)?.name || "Unknown")} (${safeText(vote.choice)})`).join(" | ")}</p>` : `<p class="muted">No votes submitted yet.</p>`}${proposal.penalties?.length ? `<p class="muted">Penalties: ${safeText(proposal.penalties.join(" | "))}</p>` : ""}<form class="stack" data-form="resolve-proposal" data-proposal="${proposal.id}"><div class="form-field"><label>Resolution note</label><input name="resolutionNote" value="Proposal resolved by DAO majority. Losing votes forfeit their governance stake." /></div><div class="inline-actions"><button type="submit">Resolve proposal</button></div></form></div>`; }).join("") : emptyStateHtml("No governance proposals are currently open.")}</div></article>`;
    const decisionHistoryCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Governance History</p><h3>Resolved DAO decisions</h3></div></div><div class="list">${state.governanceDecisions.length ? state.governanceDecisions.map((entry) => `<div class="list-item"><div class="split-line"><strong>${safeText(entry.title)}</strong><span class="tag ${entry.outcome === "Passed" ? "success" : entry.outcome === "Rejected" ? "danger" : "warn"}">${safeText(entry.outcome)}</span></div><p class="muted">${safeText(entry.summary)}</p><p class="muted">${safeText(formatDate(entry.timestamp))}</p></div>`).join("") : emptyStateHtml("No governance decisions recorded yet.")}</div></article>`;
    const auditCard = `<article class="content-card"><div class="card-header"><div><p class="eyebrow">Audit Log</p><h3>Administrative action history</h3></div></div><div class="list">${state.auditLog.map((entry) => `<div class="list-item"><div class="split-line"><strong>${safeText(entry.actor)}</strong><span class="muted">${safeText(shortDate(entry.at))}</span></div><p class="muted">${safeText(entry.message)}</p></div>`).join("")}</div></article>`;
    return shell("Admin Console", "Review verification, platform rules, disputes, and the DAO audit trail.", { text: "Moderator access", className: "warn" }, `${top}${stats}<section class="grid-two">${verificationCard}${configCard}</section><section class="grid-two">${disputeCard}${governanceBuilderCard}</section><section class="grid-two">${decisionHistoryCard}${auditCard}</section>`);
  }

  function shell(title, subtitle, sideBadge, body) {
    const signedIn = currentUser();
    return `
      <div class="app-shell">
        <aside class="sidebar">
          <section class="panel industrial-glow">
            <p class="eyebrow brand-mark">Lattice</p>
            <h1>${safeText(title)}</h1>
            <p class="muted">${safeText(subtitle)}</p>
          </section>
          <section class="panel">
            <p class="panel-title">Signed In</p>
            <div class="stack">
              <div>
                <h3>${safeText(signedIn.name)}</h3>
                <p class="muted">${safeText(signedIn.email)}</p>
              </div>
              <div class="split-line"><span class="tag ${signedIn.verified ? "success" : "warn"}">${signedIn.verified ? "KYC ready" : "KYC pending"}</span><span class="tag ${sideBadge.className || ""}">${safeText(sideBadge.text)}</span></div>
              <div><p class="muted">Total reputation</p><strong>${totalReputation(signedIn)}</strong></div>
            </div>
          </section>
          <section class="panel">
            <p class="panel-title">Quick Link</p>
            <div class="nav-stack">
              <a class="nav-button service-card" href="./index.html">Back to Login</a>
            </div>
          </section>
        </aside>
        <main class="main-content">${body}</main>
      </div>
    `;
  }

  function render() {
    const output = SERVICE === "rider" ? renderRider() : SERVICE === "host" ? renderHost() : SERVICE === "arbitrator" ? renderArbitrator() : renderAdmin();
    APP.innerHTML = output;
    bindEvents();
  }

  function bindEvents() {
    const rideForm = document.getElementById("ride-form");
    if (rideForm) {
      rideForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(rideForm);
        setState(() => createRide({ pickupId: form.get("pickupId"), dropId: form.get("dropId"), vehicleType: form.get("vehicleType"), paymentMethod: form.get("paymentMethod") }));
      });
    }

    document.getElementById("sos-button")?.addEventListener("click", () => {
      window.alert("SOS request sent. Emergency contacts and the safety team have been notified.");
    });

    document.getElementById("toggle-host-status")?.addEventListener("click", () => {
      setState(() => {
        const host = currentHost();
        if (!host) return;
        host.online = !host.online;
        syncSearchingRides();
        addAudit(host.name, host.online ? "Switched availability to online." : "Switched availability to offline.");
      });
    });

    document.querySelectorAll("[data-action='accept-ride']").forEach((button) => button.addEventListener("click", () => setState(() => acceptRide(button.dataset.ride))));
    document.querySelectorAll("[data-action='decline-ride']").forEach((button) => button.addEventListener("click", () => setState(() => declineRide(button.dataset.ride))));
    document.querySelectorAll("[data-action='auto-assign']").forEach((button) => button.addEventListener("click", () => setState(() => autoAssignRide(button.dataset.ride))));
    document.querySelectorAll("[data-action='advance-ride']").forEach((button) => button.addEventListener("click", () => setState(() => advanceRide(button.dataset.ride))));
    document.querySelectorAll("[data-action='start-review']").forEach((button) => button.addEventListener("click", () => setState(() => startDisputeReview(button.dataset.dispute))));
    document.querySelectorAll("[data-action='vote-proposal']").forEach((button) => button.addEventListener("click", () => setState(() => castGovernanceVote(button.dataset.proposal, button.dataset.vote))));

    document.querySelectorAll("[data-action='open-feedback']").forEach((button) => button.addEventListener("click", () => {
      const slot = document.getElementById("ride-feedback-area");
      if (!slot) return;
      slot.innerHTML = `<form id="feedback-form" class="stack"><div class="form-grid"><div class="form-field"><label>Host rating</label><select name="hostRating"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div><div class="form-field"><label>Comment</label><input name="feedbackComment" value="Safe ride and timely arrival." /></div></div><div class="inline-actions"><button type="submit">Save feedback</button></div></form>`;
      document.getElementById("feedback-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setState(() => submitPassengerFeedback(button.dataset.ride, form.get("hostRating"), form.get("feedbackComment")));
      });
    }));

    document.querySelectorAll("[data-action='open-passenger-feedback']").forEach((button) => button.addEventListener("click", () => {
      const slot = document.getElementById(`host-feedback-slot-${button.dataset.ride}`);
      if (!slot) return;
      slot.innerHTML = `<form class="stack" data-form="host-feedback" data-ride="${button.dataset.ride}"><div class="form-grid"><div class="form-field"><label>Passenger rating</label><select name="passengerRating"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div><div class="form-field"><label>Comment</label><input name="hostComment" value="Passenger was punctual and respectful." /></div></div><div class="inline-actions"><button type="submit">Save passenger rating</button></div></form>`;
      slot.querySelector("[data-form='host-feedback']")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setState(() => submitHostFeedback(event.currentTarget.dataset.ride, form.get("passengerRating"), form.get("hostComment")));
      });
    }));
    document.querySelectorAll("[data-action='open-dispute']").forEach((button) => button.addEventListener("click", () => {
      const slot = document.getElementById(`ride-dispute-slot-${button.dataset.ride}`) || document.getElementById("ride-dispute-area");
      if (!slot) return;
      slot.innerHTML = `<form class="stack" data-form="dispute" data-ride="${button.dataset.ride}"><div class="form-grid"><div class="form-field"><label>Category</label><select name="category"><option value="fare">Fare</option><option value="conduct">Conduct</option><option value="route">Route</option><option value="safety">Safety</option></select></div><div class="form-field"><label>Evidence summary</label><input name="evidence" value="Route log, chat transcript, and timestamp record." /></div></div><div class="form-field"><label>Description</label><textarea name="description">Please review this ride using the DAO dispute policy.</textarea></div><div class="inline-actions"><button type="submit">Submit dispute</button></div></form>`;
      slot.querySelector("[data-form='dispute']")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setState(() => fileDispute({ rideId: event.currentTarget.dataset.ride, category: form.get("category"), evidence: form.get("evidence"), description: form.get("description") }));
      });
    }));

    document.querySelectorAll("[data-form='resolve-dispute']").forEach((formEl) => formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setState(() => resolveDispute(event.currentTarget.dataset.dispute, form.get("verdict"), form.get("resolutionNote")));
    }));

    document.querySelectorAll("[data-form='assign-arbitrator']").forEach((formEl) => formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setState(() => assignDisputeArbitrator(event.currentTarget.dataset.dispute, form.get("arbitratorId")));
    }));

    document.querySelectorAll("[data-form='resolve-proposal']").forEach((formEl) => formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setState(() => resolveGovernanceProposal(event.currentTarget.dataset.proposal, form.get("resolutionNote")));
    }));

    document.getElementById("proposal-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setState(() => createGovernanceProposal({ title: form.get("proposalTitle"), summary: form.get("proposalSummary"), stakeAmount: form.get("proposalStake") }));
      event.currentTarget.reset();
    });

    document.querySelectorAll("[data-action='verify-host']").forEach((button) => button.addEventListener("click", () => setState(() => {
      const host = getUser(button.dataset.host);
      if (!host || !host.vehicle) return;
      host.vehicle.verificationStatus = button.dataset.status;
      syncSearchingRides();
      addAudit("Admin", `Updated ${host.name} verification to ${button.dataset.status}.`);
    })));

    document.getElementById("config-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setState(() => {
        state.config.rideStake = Number(form.get("rideStake"));
        state.config.cancellationPenalty = Number(form.get("cancellationPenalty"));
        state.config.disputeReward = Number(form.get("disputeReward"));
        state.config.disputePenalty = Number(form.get("disputePenalty"));
        state.config.governanceStake = Number(form.get("governanceStake"));
        addAudit("Admin", "Updated DAO rule constants for ride stakes, dispute penalties, and governance vote stakes.");
      });
    });
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






