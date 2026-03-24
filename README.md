# DAO-Based Ride Sharing Prototype

This folder now contains a self-contained web prototype based on the SRS in `SRS DAO Based Taxi App Ram Sundar 23BCE1939.pdf`.

## What is implemented

- User onboarding with role selection for passenger and host
- Host vehicle and document capture with admin verification workflow
- Passenger ride request flow with fare and time estimation
- Reputation-aware host matching based on distance, host reputation, and reliability
- Ride lifecycle states: `Searching`, `Host Assigned`, `Arriving`, `Ongoing`, `Completed`, `Post-feedback`
- Fiat payment selection simulation
- DAO-style reputation breakdown and reputation event history
- Dispute filing, arbitrator resolution, and admin dashboards
- Editable DAO rule constants for penalties and rewards

## Run it

From this folder, start the local server:

```powershell
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

## Files

- `server.js` - minimal Node static file server
- `public/index.html` - app shell
- `public/styles.css` - UI styling
- `public/app.js` - prototype logic and seeded data

## Notes

- This is a front-end prototype with local browser persistence using `localStorage`.
- Blockchain, Colony DAO, GPS, payments, KYC, and notifications are simulated in UI logic.
- The app is designed to demonstrate the SRS workflows end-to-end without external packages or build tools.
