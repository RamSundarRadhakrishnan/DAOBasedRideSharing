# DAO-Based Ride Sharing Prototype

This folder contains a self-contained web prototype based on the SRS in `SRS DAO Based Taxi App Ram Sundar 23BCE1939.pdf`.

## What is implemented

- Role-based login with separate landing pages for passenger, host, arbitrator, and admin users
- Basic role based access control in the UI: each login only sees its allowed page set
- Passenger ride request flow with fare and time estimation
- Host request review and ride progression
- Arbitrator dispute resolution queue
- Admin verification and DAO rule configuration panels
- DAO-style reputation breakdown and event history

## Run it

```powershell
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

## Files

- `server.js` - minimal Node static file server
- `public/index.html` - app shell
- `public/styles.css` - UI styling
- `public/app.js` - role-based prototype logic and seeded data

## Notes

- This is a front-end prototype with local browser persistence using `localStorage`.
- Blockchain, Colony DAO, GPS, payments, KYC, and notifications are simulated in UI logic.
- To reset demo data, clear the browser's local storage for this app.
