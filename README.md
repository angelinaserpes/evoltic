# Evoltic

A neutral EV-charging capacity planner for housing societies in Mumbai and Navi Mumbai. Built for SPARK-A-THON 2026 (E-Cell FCRIT, Smart Energy).

A society committee enters three numbers from its electricity bill and sees how many EVs the building can safely charge today, how many with overnight smart scheduling, and when it would need a load upgrade. It also simulates the night in 15-minute steps, uses a resident survey, and produces a PDF report and a draft society EV policy for the AGM vote.

## Run locally

```
npm install
npm run dev
```

## Build

```
npm run build
```

Deploys as a static site (Vercel config included). Everything runs in the browser; no data leaves the device.

Evoltic gives a planning estimate, not an electrical audit. A licensed electrician should verify any installation.
