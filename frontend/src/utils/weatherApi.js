/**
 * Utility functions for fetching real-time weather data
 */

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
 * Fetch temperature data only (pollution is entered manually)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<{temperature: number}>}
 */
export const fetchEnvironmentData = async (latitude, longitude) => {
  try {
    const temperature = await fetchTemperatureData(latitude, longitude);
    return { temperature };
  } catch (error) {
    console.error('Error fetching environment data:', error);
    // Return fallback value
    return { temperature: 20 };
  }
};
