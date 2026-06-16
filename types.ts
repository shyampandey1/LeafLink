
export enum PlantType {
  Monstera = 'Monstera Deliciosa',
  CherryTomato = 'Cherry Tomato',
  HerbBasil = 'Basil',
  SaffronCrocus = 'Saffron Crocus',
}

export enum PlantLocation {
  Indoor = 'Indoor',
  Outdoor = 'Outdoor',
}

export enum PlantHealth {
  Good = 'Good',
  NeedsCare = 'Needs Care',
  Poor = 'Poor',
}

export interface HistoricalData {
  date: string; // "YYYY-MM-DD"
  health: number; // 0-100
  height: number; // cm
  soilMoisture: number; // %
  humidity: number; // %
  ph: number; // 0-14
  temperature: number; // C
  lightLumens: number; // lumens
}

export interface ESP32Device {
  id: string;
  deviceName: string;
  location: string;
  status: 'online' | 'offline';
  lastSeen: string; // ISO 8601 string
}

export interface Plant {
  id: number;
  name: string;
  type: PlantType;
  location: PlantLocation;
  health: PlantHealth;
  temperature: number;
  soilMoisture: number;
  humidity: number;
  ph: number;
  lightLumens: number;
  height: number; // cm
  lastWatered: string; // ISO 8601 string
  aiOptimized: boolean;
  esp32DeviceId: string;
  historicalData: HistoricalData[];
}

export enum ActivityType {
  Water = 'Water',
  Light = 'Light',
  Cooling = 'Cooling',
  Growth = 'Growth',
  AiRecommendation = 'AI Recommendation',
  System = 'System',
}

export interface Activity {
  id: number;
  plantId: number;
  type: ActivityType;
  description: string;
  timestamp: string; // ISO 8601 string
}

export interface AiRecommendation {
  urgency: 'urgent' | 'normal' | 'optimal';
  suggestion: string;
}

export interface WeatherInfo {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}
