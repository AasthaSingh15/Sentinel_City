/**
 * Utility functions for fetching real-time weather and pollution data
 */

/**
 * Fetch air quality index (AQI) / Pollution data
 * Tries AirVisual API first (if key provided), falls back to OpenAQ (free, no key)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<number>} AQI value (0-500 scale, simplified to 0-150 for our use)
 */
export const fetchPollutionData = async (latitude, longitude) => {
  const airVisualKey = import.meta.env.VITE_AIRVISUAL_API_KEY;

  // Try AirVisual API first if key is provided
  if (airVisualKey && airVisualKey !== 'your_airvisual_api_key_here') {
    try {
      const response = await fetch(
        `https://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${airVisualKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.current && data.data.current.pollution) {
          const aqi = data.data.current.pollution.aqius; // US AQI
          // Convert to our 0-150 scale (AirVisual uses 0-500)
          return Math.round((aqi / 500) * 150);
        }
      }
    } catch (error) {
      console.warn('AirVisual API failed, falling back to OpenAQ:', error);
    }
  }

  // Fallback to OpenAQ API (free, no key required)
  try {
    // OpenAQ API v2 - fetch latest measurements near coordinates
    // Using radius parameter to find nearest station (radius in meters)
    const response = await fetch(
      `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}&radius=10000&limit=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const location = data.results[0];
      
      // Find PM2.5 or PM10 measurements
      let pm25 = null;
      let pm10 = null;

      if (location.measurements && Array.isArray(location.measurements)) {
        location.measurements.forEach((measurement) => {
          if (measurement.parameter === 'pm25' && measurement.value !== null) {
            pm25 = measurement.value;
          } else if (measurement.parameter === 'pm10' && measurement.value !== null) {
            pm10 = measurement.value;
          }
        });
      }

      // Calculate AQI from PM2.5 (preferred) or PM10
      // Simplified AQI calculation (0-150 scale for our system)
      if (pm25 !== null && pm25 > 0) {
        // Convert PM2.5 (μg/m³) to AQI (simplified)
        // US EPA AQI scale: 0-50 (Good), 51-100 (Moderate), 101-150 (Unhealthy for Sensitive)
        if (pm25 <= 12) return Math.round((pm25 / 12) * 50);
        if (pm25 <= 35.4) return Math.round(50 + ((pm25 - 12) / 23.4) * 50);
        if (pm25 <= 55.4) return Math.round(100 + ((pm25 - 35.4) / 20) * 50);
        return Math.min(150, Math.round(150 + ((pm25 - 55.4) / 44.6) * 50));
      } else if (pm10 !== null && pm10 > 0) {
        // Convert PM10 (μg/m³) to AQI (simplified)
        if (pm10 <= 54) return Math.round((pm10 / 54) * 50);
        if (pm10 <= 154) return Math.round(50 + ((pm10 - 54) / 100) * 50);
        if (pm10 <= 254) return Math.round(100 + ((pm10 - 154) / 100) * 50);
        return Math.min(150, Math.round(150 + ((pm10 - 254) / 146) * 50));
      }
    }

    // Fallback: If no data found, return moderate value
    console.warn('No pollution data found for location, using fallback');
    return 50;
  } catch (error) {
    console.error('Error fetching pollution data:', error);
    // Fallback value on error
    return 50;
  }
};

/**
 * Fetch temperature data
 * Tries OpenWeatherMap API first (if key provided), falls back to Open-Meteo (free, no key)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<number>} Temperature in Celsius
 */
export const fetchTemperatureData = async (latitude, longitude) => {
  const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  // Try OpenWeatherMap API first if key is provided
  if (openWeatherKey && openWeatherKey !== 'your_openweather_api_key_here') {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherKey}&units=metric`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.main && data.main.temp !== undefined) {
          return Math.round(data.main.temp);
        }
      }
    } catch (error) {
      console.warn('OpenWeatherMap API failed, falling back to Open-Meteo:', error);
    }
  }

  // Fallback to Open-Meteo API (free, no key required)
  try {
    // Open-Meteo API - free weather API, no key required
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`
    );

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.current && data.current.temperature_2m !== undefined) {
      return Math.round(data.current.temperature_2m);
    }

    // Fallback
    console.warn('No temperature data found, using fallback');
    return 20;
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    // Fallback value on error
    return 20;
  }
};

/**
 * Fetch both pollution and temperature data
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<{pollution: number, temperature: number}>}
 */
export const fetchEnvironmentData = async (latitude, longitude) => {
  try {
    // Fetch both in parallel for better performance
    const [pollution, temperature] = await Promise.all([
      fetchPollutionData(latitude, longitude),
      fetchTemperatureData(latitude, longitude),
    ]);

    return { pollution, temperature };
  } catch (error) {
    console.error('Error fetching environment data:', error);
    // Return fallback values
    return { pollution: 50, temperature: 20 };
  }
};
