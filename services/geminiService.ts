
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

export const getWeatherInfo = async (location: { lat: number; lon: number } | null): Promise<WeatherInfo> => {
  const fallbackData: WeatherInfo = { city: 'Mohali', temperature: 30.6, condition: 'Sunny', humidity: 48, windSpeed: 22.5 };
  
  if (!process.env.API_KEY) {
      console.warn("API_KEY not set. Returning dummy weather data.");
      return fallbackData;
  }
  
  const locationQuery = location
    ? `for the location with latitude ${location.lat} and longitude ${location.lon}`
    : 'in Mohali, India';
  
  const prompt = `
    What is the current weather ${locationQuery}? 
    Provide the city name, temperature in Celsius, the weather condition (e.g., "Sunny", "Cloudy", "Rain", "Clear"), humidity as a percentage, and wind speed in km/h.
    Format the response as a valid JSON object with five keys: "city" (string), "temperature" (number), "condition" (string), "humidity" (number), and "windSpeed" (number).
    Do not include any other text, comments, or markdown formatting like \`\`\`json around the JSON object. Just the raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData: WeatherInfo = JSON.parse(jsonStr);
    
    if (typeof parsedData.city !== 'string' ||
        typeof parsedData.temperature !== 'number' ||
        typeof parsedData.condition !== 'string' ||
        typeof parsedData.humidity !== 'number' ||
        typeof parsedData.windSpeed !== 'number') {
        throw new Error('Invalid weather data structure from API.');
    }
    
    return parsedData;

  } catch (error) {
    console.error("Failed to get weather info from Gemini API:", error);
    // Provide fallback data on failure to not break the UI
    return fallbackData;
  }
};
