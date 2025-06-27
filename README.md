# Weather App Monorepo

A modular, layered-architecture weather advisory application using the OpenWeather API. This monorepo contains both the frontend (Next.js) and backend (Express.js) projects, and is designed for scalability and maintainability.

## Features
- Real-time weather data and climate advisories
- Modular monorepo structure (client & server)
- Layered architecture for clean separation of concerns
- Planned integration: [MUI](https://mui.com/), [Firebase](https://firebase.google.com/), [Firestore](https://firebase.google.com/products/firestore), Docker

---

## Project Structure

```
weather-app/
  client/   # Next.js frontend (React)
  server/   # Express.js backend API
  docs/     # Documentation
  scripts/  # Utility scripts
```

## Architecture
- **Frontend:** Next.js (React), planned: MUI, Firebase Auth, Firestore
- **Backend:** Express.js, planned: Dockerization, integration with Firebase/Firestore
- **API:** OpenWeather API for weather data

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm, yarn, or pnpm

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd weather-app
   ```

2. **Install dependencies:**
   - For frontend:
     ```bash
     cd client
     npm install
     # or yarn or pnpm
     ```
   - For backend:
     ```bash
     cd ../server
     npm install
     ```

3. **Run the apps:**
   - Frontend:
     ```bash
     npm run dev
     ```
   - Backend:
     ```bash
     npm start
     ```

---

## OpenWeather API Setup
1. Sign up at [OpenWeather](https://openweathermap.org/api) and get your API key.
2. Add your API key to the appropriate config file or environment variable (see client/server setup docs).

---

## Planned Integrations

### MUI (Material UI)
- Install: `npm install @mui/material @emotion/react @emotion/styled`
- [MUI Documentation](https://mui.com/)

### Firebase & Firestore
- Install: `npm install firebase`
- [Firebase Console](https://console.firebase.google.com/)
- Add your Firebase config to the frontend and/or backend as needed.

### Docker
- Add Dockerfiles for both client and server (see future updates)
- Example usage:
  ```bash
  docker build -t weather-app-client ./client
  docker build -t weather-app-server ./server
  ```

---

## Contributing
1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a Pull Request

---

## License
[ISC](LICENSE)

---

## Credits
- [OpenWeather API](https://openweathermap.org/api)
- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [MUI](https://mui.com/)
- [Firebase](https://firebase.google.com/) 