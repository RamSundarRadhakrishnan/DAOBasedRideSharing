# DAO-Based Ride Sharing Application

A repository for a role-based web prototype of a DAO-inspired ride sharing platform.

## Overview

This project demonstrates a ride sharing system with:

- Passenger ride booking and tracking
- Host ride acceptance and trip handling
- Arbitrator dispute review
- Admin verification and rule management
- Basic role-based access control at login
- DAO-style reputation visibility and governance summaries

The application is intentionally lightweight and runs without external packages or build tools.

## Features

- Separate login entry for each demo user
- Role-specific landing pages for:
  - Passenger
  - Host
  - Arbitrator
  - Admin
- Restricted navigation based on the logged-in user's role
- Ride request flow with fare and time estimation
- Host-side request handling and ride progression
- Post-ride feedback and dispute filing
- Arbitrator decision workflow
- Admin review of host verification and platform constants
- Reputation history and DAO overview screens

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Node.js HTTP server
- `localStorage` for demo persistence

## Project Structure

```text
.
|-- public/
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- server.js
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended

### Run Locally

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

## Demo Access

The login screen includes seeded users for each role:

- Passenger
- Host
- Arbitrator
- Admin

Each user is redirected to the correct dashboard after login, and only allowed pages are shown in navigation.

## RBAC Behavior

This project demonstrates basic front-end role-based access control:

- Passengers can access passenger pages, DAO overview, and profile
- Hosts can access host pages, DAO overview, and profile
- Arbitrators can access arbitration pages, DAO overview, and profile
- Admins can access admin pages, DAO overview, and profile

This is UI-level RBAC for demonstration purposes, not production-grade authorization.

## Data and Persistence

- App state is stored in the browser using `localStorage`
- Seeded users, rides, disputes, and reputation records are loaded automatically
- To reset the demo, clear browser storage for the app

## Limitations

- No real authentication backend
- No database
- No real blockchain, DAO, GPS, payments, KYC, or notification integrations
- Reputation, arbitration, and governance are simulated for demonstration

## Purpose

This repository is intended to showcase the functional flows from the SRS and demonstrate how role-based access control can be represented in a simple prototype.
