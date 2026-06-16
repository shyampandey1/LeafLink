
import { GoogleGenAI, Type } from "@google/genai";
import { Plant, AiRecommendation, WeatherInfo } from '../types.ts';

if (!process.env.API_KEY) {
  // This is a placeholder check. In a real environment, the key should be present.
  // We won't throw an error here to allow the UI to function without an API key for demo purposes.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "DUMMY_KEY_FOR_DEMO" });

export const getCareRecommendation = async (plant: Plant): Promise<AiRecommendation> => {
    if (!process.env.API_KEY) {
        // Return a dummy recommendation if API key is not available
        return {
            urgency: 'normal',
            suggestion: 'API key not configured. Please add your Gemini API key to see smart recommendations.'
        };
    }
  
  const prompt = `
    You are a master gardener AI specializing in plant care.
    Analyze the following data for a "${plant.type}" plant located "${plant.location}".
    
    Current Conditions:
    - Health Status: ${plant.health}
    - Temperature: ${plant.temperature}°C
    - Soil Moisture: ${plant.soilMoisture}%
    - Humidity: ${plant.humidity}%
    - pH Level: ${plant.ph}
    - Light Exposure: ${plant.lightLumens} lumens
    - Height: ${plant.height} cm
    - Last Watered: ${new Date(plant.lastWatered).toDateString()}

    Based on this data, provide a care recommendation. The recommendation must include an urgency level and a short, actionable suggestion (max 25 words).
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    urgency: {
                        type: Type.STRING,
                        description: 'The urgency of the recommendation. Must be one of: "urgent", "normal", or "optimal".'
                    },
                    suggestion: {
                        type: Type.STRING,
                        description: 'A short, actionable care tip, maximum 25 words.'
                    }
                }
            },
            temperature: 0.5,
        },
    });
    
    const parsedData: AiRecommendation = JSON.parse(response.text);
    return parsedData;

  } catch (error) {
    console.error("Failed to get care recommendation from Gemini API:", error);
    throw new Error("Could not fetch AI recommendation. Please try again.");
  }
};

export const getWeatherInfo = async (location: { lat: number; lon: number } | string | null): Promise<WeatherInfo> => {
  const fallbackData: WeatherInfo = { city: 'Aujala', temperature: 29, condition: 'Partly Cloudy', humidity: 80, windSpeed: 10 };

  try {
    let lat: number = 30.761838;
    let lon: number = 76.632890;
    let cityName = 'Aujala';

    if (location && typeof location === 'object' && 'lat' in location) {
      lat = location.lat;
      lon = location.lon;
      
      // Reverse geocode to get city name
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'User-Agent': 'LeafLink-Smart-Garden' } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          cityName = geoData.address.village || geoData.address.town || geoData.address.city || geoData.address.suburb || geoData.address.state || 'Local Station';
        }
      } catch (err) {
        console.warn("Reverse geocoding failed, using coordinates as name:", err);
        cityName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } else if (typeof location === 'string') {
      cityName = location.split(',')[0].trim();
      // Geocode city name to get coordinates
      try {
        const searchRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'LeafLink-Smart-Garden' } }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.length > 0) {
            lat = parseFloat(searchData[0].lat);
            lon = parseFloat(searchData[0].lon);
          } else {
            throw new Error("City not found");
          }
        } else {
          throw new Error("Geocoding failed");
        }
      } catch (err) {
        console.warn("Geocoding failed, using fallback coordinates:", err);
        lat = 30.761838;
        lon = 76.632890;
      }
    }

    // Fetch real-time weather from Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
    );

    if (!weatherRes.ok) {
      throw new Error("Failed to fetch weather from Open-Meteo");
    }

    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    const mapWeatherCode = (code: number): string => {
      if (code === 0) return 'Sunny';
      if (code >= 1 && code <= 3) return 'Partly Cloudy';
      if (code === 45 || code === 48) return 'Foggy';
      if (code >= 51 && code <= 67) return 'Rainy';
      if (code >= 71 && code <= 77) return 'Snowy';
      if (code >= 80 && code <= 82) return 'Showers';
      if (code >= 95 && code <= 99) return 'Thunderstorm';
      return 'Clear';
    };

    return {
      city: cityName,
      temperature: Math.round(current.temperature_2m * 10) / 10,
      condition: mapWeatherCode(current.weather_code),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
    };

  } catch (error) {
    console.error("Failed to get weather info from real-time APIs:", error);
    return fallbackData;
  }
};
