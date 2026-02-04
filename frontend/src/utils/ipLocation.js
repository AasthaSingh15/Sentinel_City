// IP-based location lookup using a public keyless API.
// This works both on localhost and in production, without any API keys.
// It returns an approximate city-level location which is good enough
// to center the map and prefill coordinates when browser geolocation is blocked.

/**
 * Fetch approximate location based on the user's IP address.
 * @returns {Promise<{ lat: number, lng: number, city?: string, country?: string } | null>}
 */
export const fetchIpLocation = async () => {
  try {
    // ipapi.co provides a simple JSON endpoint with latitude/longitude
    const res = await fetch('https://ipapi.co/json/', {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      console.warn('IP location API error:', res.status);
      return null;
    }

    const data = await res.json();
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      city: data.city,
      country: data.country_name
    };
  } catch (err) {
    console.error('Error calling IP location API:', err);
    return null;
  }
};

