# Remove AQI Fetching Feature

## Tasks
- [x] Remove `fetchPollutionData` function from `frontend/src/utils/weatherApi.js`
- [x] Modify `fetchEnvironmentData` to return only `{ temperature }`
- [x] Update `CitizenDashboard.jsx` to only fetch temperature in `fetchCurrentLocation`
- [x] Update `AdminPanel.jsx` to only set temperature in auto-fill
- [x] Update `MapView.jsx` to only fetch temperature in `handleFetchLocation`
- [x] Update `HospitalDashboard.jsx` to only fetch temperature
- [x] Update `PharmacistDashboard.jsx` to only fetch temperature
