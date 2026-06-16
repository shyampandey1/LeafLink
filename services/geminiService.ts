
import { GoogleGenAI, Type } from "@google/genai";
import { Plant, AiRecommendation, WeatherInfo } from '../types.ts';

const isApiKeyPlaceholder = (key: string | undefined): boolean => {
  if (!key) return true;
  const k = key.trim().toUpperCase();
  return k === "" || k === "PLACEHOLDER_API_KEY" || k === "PLACEHOLDER" || k === "DUMMY_KEY_FOR_DEMO";
};

const getLocalSimulatedRecommendation = (plant: Plant): AiRecommendation => {
  const type = plant.type;
  const health = plant.health;
  const temp = plant.temperature;
  const moisture = plant.soilMoisture;
  const ph = plant.ph;
  const light = plant.lightLumens;

  let urgency: 'urgent' | 'normal' | 'optimal' = 'normal';
  let suggestion = `Maintain current conditions for ${plant.name} (${type}). Keep tracking environmental metrics regularly.`;

  if (health === 'Poor' || health === 'Needs Care') {
    urgency = health === 'Poor' ? 'urgent' : 'normal';
    if (moisture > 90) {
      suggestion = `Overwatering detected (${moisture}%). Hold irrigation immediately to avoid root rot and let the soil dry out.`;
    } else if (moisture < 45) {
      suggestion = `Soil is dry (${moisture}%). Apply water to raise moisture level back to the optimal 60-85% range.`;
    } else if (temp > 30) {
      suggestion = `Ambient temperature is elevated (${temp}°C). Provide temporary shade or activate active cooling blower.`;
    } else if (temp < 15) {
      suggestion = `Cold conditions detected (${temp}°C). Protect plant from draft or adjust indoor heater configuration.`;
    } else if (ph < 5.8) {
      suggestion = `Soil pH is acidic (${ph}). Add a small amount of garden lime to raise pH toward neutral.`;
    } else if (ph > 7.4) {
      suggestion = `Soil pH is alkaline (${ph}). Integrate organic compost or iron sulfate to lower the pH range.`;
    } else if (light < 10000) {
      suggestion = `Low light level (${(light/1000).toFixed(1)}k lm). Relocate plant or activate the custom grow LED grid.`;
    } else if (light > 30000) {
      suggestion = `Direct sunlight is too high (${(light/1000).toFixed(1)}k lm). Provide diffused shading screens.`;
    } else {
      suggestion = `Conditions are borderline. Monitor soil moisture daily and ensure balanced mineral dosing.`;
    }
  } else {
    urgency = 'optimal';
    if (moisture > 85) {
      suggestion = `Moisture is high (${moisture}%). Hold watering.`;
    } else if (moisture < 50) {
      suggestion = `Moisture is moderate (${moisture}%). Plan a light watering session.`;
    } else {
      suggestion = `Your ${type} is thriving with perfect parameters. Current care schedules are working optimally.`;
    }
  }

  return { urgency, suggestion };
};

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: isApiKeyPlaceholder(apiKey) ? "DUMMY_KEY_FOR_DEMO" : apiKey });

export const getCareRecommendation = async (plant: Plant): Promise<AiRecommendation> => {
  if (isApiKeyPlaceholder(apiKey)) {
    console.warn("Gemini API key is not configured or is placeholder. Using local simulation engine.");
    // Add brief artificial delay to simulate AI processing for realistic UX
    await new Promise(resolve => setTimeout(resolve, 800));
    return getLocalSimulatedRecommendation(plant);
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
    console.warn("Failed to get care recommendation from Gemini API, falling back to local simulation:", error);
    // Add brief artificial delay to simulate processing before returning fallback
    await new Promise(resolve => setTimeout(resolve, 500));
    return getLocalSimulatedRecommendation(plant);
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
