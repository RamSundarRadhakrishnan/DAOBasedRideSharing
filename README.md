# Lattice

Lattice is a role-based web prototype for a DAO-governed ride sharing system. It demonstrates how riders, hosts, arbitrators, and admins can interact inside a shared mobility platform with reputation scoring, dispute handling, and governance voting.

The app runs as a lightweight static front end served by a small Node.js HTTP server. There are no external packages, no build step, and no database.

## Current Prototype Scope

The current application includes:

- A branded login and landing page for Lattice
- Credential-based login that opens the correct workspace in a new tab
- Separate rider, host, arbitrator, and admin workspaces
- Shared browser state using `localStorage`
- Reputation tracking across passenger, host, and arbitration domains
- Ride request creation, host matching, ride progression, and post-ride feedback
- Dispute filing, review, reassignment, and resolution
- DAO governance proposals created by admin
- Governance voting by riders, hosts, and arbitrators
- Governance stake penalties for users on the losing side of a resolved proposal
- Admin controls for verification, rule constants, dispute oversight, and proposal resolution

## Demo Workspaces

### Rider

- Create ride requests
- View ranked host matches
- Track ride lifecycle stages
- Submit post-ride feedback
- File disputes
- Vote on open DAO proposals
- View reputation history and governance decisions

### Host

- Review incoming ride requests
- Accept or decline requests
- Advance assigned rides through the ride lifecycle
- Rate passengers after ride completion
- File disputes on completed rides
- View host reputation and performance summary
- Vote on open DAO proposals

### Arbitrator

- Review assigned disputes
- Move disputes to review
- Resolve disputes with verdicts
- Earn arbitration reputation through dispute resolution
- Vote on open DAO proposals

### Admin

- Review and update host verification status
- Update DAO rule constants
- Reassign or resolve disputes
- Publish governance proposals
- Resolve governance proposals
- Review governance history and audit logs

## Governance Flow

The governance system is now an active part of the demo:

- Admin can publish a governance proposal with a title, summary, and vote stake
- Riders vote using passenger reputation
- Hosts vote using host reputation
- Arbitrators vote using arbitration reputation
- A user can vote once per proposal
- Proposals resolve through admin action
- The losing side of a resolved proposal loses the staked reputation amount

Example:

- If a proposal passes, users who voted `against` lose their governance stake
- If a proposal fails, users who voted `for` lose their governance stake

Resolved proposals are copied into governance history along with vote totals and penalty counts.

## Dispute Flow

The dispute system includes:

- Dispute filing by riders and hosts
- Arbitrator assignment and reassignment
- Admin oversight
- Status progression:
  - `submitted`
  - `under_review`
  - `resolved`
- Reputation adjustments after verdicts
- Audit logging for moderation activity

## Demo Credentials

Use these credentials from the login page:

- `ram` / `rider123`
- `asha` / `host123`
- `farhan` / `host234`
- `meera` / `host345`
- `kavya` / `host456`
- `ishan` / `arb123`
- `admin` / `admin123`

## Run Locally

### Prerequisites

- Node.js 18+ recommended

### Start the server

```powershell
node server.js
```

Then open:

```text
http://localhost:3000
```

If port `3000` is already in use:

```powershell
$env:PORT=3001
node server.js
```

## Project Structure

```text
.
|-- public/
|   |-- admin.html
|   |-- arbitrator.html
|   |-- host.html
|   |-- index.html
|   |-- login.js
|   |-- rider.html
|   |-- service-app.js
|   |-- styles.css
|   `-- app.js
|-- server.js
`-- README.md
```

Notes:

- `public/service-app.js` is the main shared application script used by the active workspaces
- `public/login.js` handles credential-based workspace launch
- `public/app.js` is an older prototype file and is not the main entry path for the current UI

## Persistence

- The prototype uses browser `localStorage` to persist demo state
- Multiple open tabs stay in sync through shared browser storage and `BroadcastChannel`
- To reset the app state, clear browser storage for the app and reload

The current storage key is versioned in the front end so major demo changes can reseed fresh data when needed.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Node.js HTTP server
- Browser `localStorage`
- Browser `BroadcastChannel`

## Limitations

This is still a demo prototype. It does not include:

- Real authentication or authorization back end
- Real blockchain or Colony integration
- Real GPS or oracle integrations
- Real payments or fiat settlement rails
- Real KYC provider integration
- Real-time backend persistence across devices

Reputation, disputes, governance voting, and staking logic are simulated in the browser for demonstration purposes.

## Purpose

This repository is intended to demonstrate a DAO-style ride sharing concept in a working browser prototype. It is especially suited for showcasing:

- Role-based workflows
- Reputation-based matching
- DAO-inspired moderation
- Governance proposals and voting
- Stake-based penalties tied to proposal outcomes
