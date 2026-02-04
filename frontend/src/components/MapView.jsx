import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getWards, getAllAlerts, saveUserData } from '../api';
import { fetchEnvironmentData } from '../utils/weatherApi';
import { fetchIpLocation } from '../utils/ipLocation';

// Fix default marker icons for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return '#ff4b4b';
  if (confidence >= 50) return '#f6c453';
  if (confidence > 0) return '#5bc0be';
  return '#4a5568';
};

const ColoredMarker = ({ position, color, children, onClick }) => {
  const icon = L.divIcon({
    className: '',
    html: `<span style="
        display:inline-flex;
        width:16px;
        height:16px;
        border-radius:999px;
        border:2px solid white;
        box-shadow:0 0 8px rgba(0,0,0,0.6);
        background:${color};
      "></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  return (
    <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
      {children}
    </Marker>
  );
};

const AutoCenter = ({ wards }) => {
  const map = useMap();

  useEffect(() => {
    if (!wards || wards.length === 0) return;
    const bounds = L.latLngBounds(
      wards.map((w) => [Number(w.lat), Number(w.lng)])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [wards, map]);

  return null;
};

const MapView = ({ selectedWard, onSelectWard, currentUser }) => {
  const [wards, setWards] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);
  const [confidenceByWard, setConfidenceByWard] = useState({});
  const [wardAlerts, setWardAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [userPollution, setUserPollution] = useState(null);
  const [userTemperature, setUserTemperature] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showAllWards, setShowAllWards] = useState(false);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const alertsRes = await getAllAlerts();
        const alerts = alertsRes.data || [];
        
        const fetchedWards = alerts.map(a => ({
          id: a.wardId,
          name: a.wardName,
          lat: a.lat,
          lng: a.lng,
        }));
        setWards(fetchedWards);

        const confidenceMap = {};
        const alertsMap = {};
        alerts.forEach(a => {
          confidenceMap[a.wardId] = a.alert?.confidence ?? 0;
          alertsMap[a.wardId] = { alert: a.alert || {}, diseaseData: a.diseaseData || {} };
        });
        setConfidenceByWard(confidenceMap);
        setWardAlerts(alertsMap);
        setFilteredWards(fetchedWards); // Initialize filtered wards
      } catch (err) {
        console.error(err);
        setError('Unable to load wards from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter wards by proximity for citizens
  useEffect(() => {
    if (currentUser?.role === 'citizen' && userLocation && !showAllWards) {
      // Filter wards within 10km radius
      const nearbyWards = wards.filter(ward => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          ward.lat,
          ward.lng
        );
        return distance <= 10; // 10km radius
      });
      setFilteredWards(nearbyWards);
    } else {
      setFilteredWards(wards);
    }
  }, [wards, userLocation, showAllWards, currentUser]);

  const handleFetchLocation = async () => {
    setFetchingLocation(true);
    setError('');
    try {
      let latitude;
      let longitude;

      // Try precise browser geolocation first
      try {
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
          });
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoErr) {
        console.warn('Browser geolocation failed, falling back to IP:', geoErr);
        const ipLoc = await fetchIpLocation();
        if (ipLoc) {
          latitude = ipLoc.lat;
          longitude = ipLoc.lng;
        } else {
          // Final fallback: use a fixed demo city center
          latitude = 28.6139;
          longitude = 77.2090;
        }
      }

      // Fetch environment data (pollution & temperature) for this location
      const { pollution, temperature } = await fetchEnvironmentData(latitude, longitude);

      setUserLocation({ lat: latitude, lng: longitude });
      setUserPollution(pollution);
      setUserTemperature(temperature);
      setShowAllWards(false);

      // Save to backend if user is logged in
      if (currentUser?.id) {
        try {
          await saveUserData(currentUser.id, {
            location: { lat: latitude, lng: longitude },
            pollution,
            temperature,
            diseases: [],
          });
        } catch (saveErr) {
          console.warn('Failed to save location data to backend:', saveErr);
        }
      }
    } catch (err) {
      console.error(err);
      // Even if everything fails, fall back to a fixed demo location so the map still works
      const fallbackLat = 28.6139;
      const fallbackLng = 77.2090;
      setUserLocation({ lat: fallbackLat, lng: fallbackLng });
      setUserPollution((prev) => prev ?? 50);
      setUserTemperature((prev) => prev ?? 20);
      setShowAllWards(false);
      setError('Using default demo location because automatic lookup failed.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const displayWards = currentUser?.role === 'citizen' && userLocation && !showAllWards 
    ? filteredWards 
    : wards;

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : displayWards.length
    ? [Number(displayWards[0].lat), Number(displayWards[0].lng)]
    : [28.6139, 77.209]; // generic city center fallback

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-accent/40">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            City Situation Map
          </h2>
          <p className="text-xs text-gray-400">
            {currentUser?.role === 'citizen' && userLocation
              ? `Showing wards within 10km of your location${showAllWards ? ' (showing all)' : ''}`
              : 'Marker intensity reflects system confidence in active risk.'}
          </p>
          {userLocation && (userPollution !== null || userTemperature !== null) && (
            <div className="mt-1 text-[10px] text-gray-300 space-x-3">
              {userPollution !== null && <span>🌫️ AQI: {userPollution}</span>}
              {userTemperature !== null && <span>🌡️ Temp: {userTemperature}°C</span>}
            </div>
          )}
        </div>
        {currentUser?.role === 'citizen' && (
          <div className="flex gap-2">
            {!userLocation ? (
              <button
                onClick={handleFetchLocation}
                disabled={fetchingLocation}
                className="px-2 py-1 rounded bg-accent text-white text-[10px] hover:bg-accentSoft/90 transition disabled:opacity-50"
              >
                {fetchingLocation ? 'Fetching...' : '📍 My Location'}
              </button>
            ) : (
              <button
                onClick={() => setShowAllWards(!showAllWards)}
                className="px-2 py-1 rounded border border-accent/40 text-[10px] hover:border-accentSoft"
              >
                {showAllWards ? 'Show Nearby' : 'Show All'}
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ff4b4b]" />
            High
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f6c453]" />
            Elevated
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#5bc0be]" />
            Watch
          </span>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.6}
          />
          <AutoCenter wards={displayWards} />
          {displayWards.map((ward) => (
            <ColoredMarker
              key={ward.id}
              position={[Number(ward.lat), Number(ward.lng)]}
              color={getConfidenceColor(confidenceByWard[ward.id] || 0)}
              onClick={() => onSelectWard && onSelectWard(ward)}
            >
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">{ward.name}</div>
                    <div className="text-gray-500">
                      Confidence:{' '}
                      <span className="font-medium">
                        {confidenceByWard[ward.id] ?? 0}%
                      </span>
                    </div>
                    {wardAlerts[ward.id]?.alert?.disease && (
                      <div className="mt-1 text-[11px] text-yellow-300">
                        Disease: <span className="font-medium">{wardAlerts[ward.id].alert.disease}</span>
                        {' — '}
                        <span className="font-semibold">{wardAlerts[ward.id].alert.level ?? 'normal'}</span>
                      </div>
                    )}
                    {confidenceByWard[ward.id] >= 65 && (
                      <div className="mt-1 text-[10px] text-danger font-medium">
                        ⚠️ Alert Active
                      </div>
                    )}

                    {/* Show each disease's risk inferred from diseaseData */}
                    {wardAlerts[ward.id] && Object.keys(wardAlerts[ward.id].diseaseData || {}).length > 0 && (
                      <div className="mt-2 text-[10px] text-gray-300">
                        <div className="text-[10px] text-gray-400">Disease risks</div>
                        <ul className="mt-1 space-y-1">
                          {Object.entries(wardAlerts[ward.id].diseaseData).map(([disease, info]) => {
                            const visits = Number(info.clinicVisits || 0);
                            const sales = Number(info.pharmacySales || 0);
                            let risk = 'Low';
                            if (visits > 70 || sales > 80) risk = 'High';
                            else if (visits > 50 || sales > 60) risk = 'Moderate';
                            return (
                              <li key={disease} className="flex items-center justify-between">
                                <span className="capitalize">{disease}</span>
                                <span className={`text-[11px] font-semibold ${risk==='High'? 'text-danger': risk==='Moderate' ? 'text-amber-400' : 'text-emerald-300'}`}>{risk}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      className="mt-2 px-2 py-1 rounded bg-accent text-white text-[11px]"
                      onClick={() => onSelectWard && onSelectWard(ward)}
                    >
                      Focus in Dashboard
                    </button>
                  </div>
                </Popup>
            </ColoredMarker>
          ))}
        </MapContainer>

        {(loading || error || displayWards.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {loading ? (
              <div className="text-xs text-gray-400 bg-background/80 px-3 py-2 rounded-md border border-accent/40">
                Synchronizing with backend…
              </div>
            ) : error ? (
              <div className="text-xs text-red-400 bg-background/80 px-3 py-2 rounded-md border border-danger/60">
                {error}
              </div>
            ) : (
              <div className="text-xs text-gray-400 bg-background/80 px-3 py-2 rounded-md border border-accent/40 text-center max-w-xs">
                No wards registered yet. Use the Admin Panel to onboard wards
                into the command system.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;

