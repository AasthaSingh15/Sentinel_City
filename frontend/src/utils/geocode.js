// Simple geocoding utility using OpenStreetMap Nominatim API.
// No API key required; suitable for demos and low-volume usage.
// Works the same in local and deployed environments.

/**
 * Geocode a free-text place query into latitude/longitude.
 * @param {string} query
 * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
 */
export const geocodePlace = async (query) => {
  if (!query || !query.trim()) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query.trim()
  )}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // User-Agent is recommended by Nominatim usage policy
        'User-Agent': 'Sentinel-City-Demo/1.0'
      }
    });

    if (!res.ok) {
      console.warn('Geocoding API error:', res.status);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const top = data[0];
    const lat = Number(top.lat);
    const lng = Number(top.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      displayName: top.display_name || query.trim()
    };
  } catch (err) {
    console.error('Error calling geocoding API:', err);
    return null;
  }
};

