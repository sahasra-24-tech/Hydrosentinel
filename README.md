# HydroSentinel

HydroSentinel is a MERN stack weather-risk dashboard for Indian districts. It combines weather data, flood-risk scoring, AI advisories, saved locations, and alert subscriptions in one interface.

## Tech Stack

- Frontend: React.js, React Router, Leaflet, Chart.js
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Styling: CSS dark blue theme
- AI: Anthropic Claude via backend only
- Weather: Open-Meteo via backend only

## Features

- District search and India map view
- Weather cards for temperature, humidity, rainfall, and wind speed
- Flood risk score and color-coded risk level
- AI advisory for farmers and general users
- Save location to MongoDB
- Email alert subscription for Orange/Red thresholds
- Demo mode using local data
- Offline cache fallback with last known data
- Rainfall simulation slider with live risk recalculation

## API Routes

Backend routes live under `/api`.

- `GET /api/weather/:lat/:lng`
- `POST /api/risk/score`
- `POST /api/ai/advisory`
- `POST /api/users/register`
- `POST /api/users/login`
- `POST /api/locations/save`
- `GET /api/locations/:userId`
- `POST /api/alerts/subscribe`
- `GET /api/demo/data`

## Environment Variables

Create a `.env` file in the root using the values below:

```env
MONGODB_URI=your_mongodb_atlas_uri
ANTHROPIC_API_KEY=your_anthropic_api_key
JWT_SECRET=hydrosentinel_secret_key
EMAIL_USER=your_gmail
EMAIL_PASS=your_gmail_app_password
PORT=5000
```

## Run Locally

1. Install dependencies from the project root:

```bash
npm install
```

2. Install server and client dependencies if needed:

```bash
npm install --workspace server
npm install --workspace client
```

3. Add your `.env` file at the root.

4. Start both apps in development mode:

```bash
npm run dev
```

5. Seed the demo weather data into MongoDB:

```bash
npm run seed --workspace server
```

The backend runs on port `5000` and the frontend runs on Vite's default port.

## Notes

- React never calls Open-Meteo or Anthropic directly. All external API calls go through Express.
- Demo Mode reads seeded MongoDB data from `/api/demo/data`.
- Email alerts require Gmail SMTP app-password credentials.
- Demo mode and offline cache are handled in the frontend for presentation continuity.
