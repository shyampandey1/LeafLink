
import React from 'react';
import { Plant, ESP32Device, Activity, PlantType, PlantLocation, PlantHealth, HistoricalData, ActivityType } from './types.ts';

// Helper to generate historical data
const generateHistoricalData = (days: number, baseValues: Partial<HistoricalData>): HistoricalData[] => {
  const data: HistoricalData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      health: baseValues.health !== undefined ? Math.max(0, Math.min(100, baseValues.health + (Math.random() - 0.5) * 10)) : 85,
      height: baseValues.height !== undefined ? Math.max(0, baseValues.height - i * 0.1 + Math.random() * 0.5) : 20,
      soilMoisture: baseValues.soilMoisture !== undefined ? Math.max(0, Math.min(100, baseValues.soilMoisture + (Math.random() - 0.5) * 15)) : 50,
      humidity: baseValues.humidity !== undefined ? Math.max(0, Math.min(100, baseValues.humidity + (Math.random() - 0.5) * 10)) : 60,
      ph: baseValues.ph !== undefined ? Math.max(5, Math.min(8, baseValues.ph + (Math.random() - 0.5) * 0.5)) : 6.5,
      temperature: baseValues.temperature !== undefined ? Math.max(10, Math.min(35, baseValues.temperature + (Math.random() - 0.5) * 3)) : 22,
      lightLumens: baseValues.lightLumens !== undefined ? Math.max(1000, Math.min(50000, baseValues.lightLumens + (Math.random() - 0.5) * 5000)) : 15000,
    });
  }
  return data;
};

export const MOCK_DEVICES: ESP32Device[] = [
  { id: 'ESP32-IN-01', deviceName: 'Living Room Sensor', location: 'Indoor', status: 'online', lastSeen: new Date().toISOString() },
  { id: 'ESP32-OUT-01', deviceName: 'Balcony Sensor', location: 'Outdoor', status: 'online', lastSeen: new Date().toISOString() },
  { id: 'ESP32-OUT-02', deviceName: 'Garden Bed Sensor', location: 'Outdoor', status: 'offline', lastSeen: new Date(Date.now() - 86400000).toISOString() },
];

export const MOCK_PLANTS: Plant[] = [
  {
    id: 1,
    name: 'Monty',
    type: PlantType.Monstera,
    location: PlantLocation.Indoor,
    health: PlantHealth.Good,
    temperature: 24,
    soilMoisture: 65,
    humidity: 70,
    ph: 6.2,
    lightLumens: 12000,
    height: 45,
    lastWatered: new Date(Date.now() - 2 * 86400000).toISOString(),
    aiOptimized: false,
    esp32DeviceId: 'ESP32-IN-01',
    historicalData: generateHistoricalData(7, { health: 92, height: 44, soilMoisture: 60, humidity: 72, ph: 6.3, temperature: 23, lightLumens: 11000 }),
  },
  {
    id: 2,
    name: 'Red Gems',
    type: PlantType.CherryTomato,
    location: PlantLocation.Outdoor,
    health: PlantHealth.NeedsCare,
    temperature: 28,
    soilMoisture: 35,
    humidity: 55,
    ph: 5.8,
    lightLumens: 45000,
    height: 60,
    lastWatered: new Date(Date.now() - 3 * 86400000).toISOString(),
    aiOptimized: true,
    esp32DeviceId: 'ESP32-OUT-01',
    historicalData: generateHistoricalData(7, { health: 65, height: 58, soilMoisture: 40, humidity: 58, ph: 5.9, temperature: 27, lightLumens: 48000 }),
  },
  {
    id: 3,
    name: 'Geno',
    type: PlantType.HerbBasil,
    location: PlantLocation.Indoor,
    health: PlantHealth.Good,
    temperature: 22,
    soilMoisture: 70,
    humidity: 60,
    ph: 6.8,
    lightLumens: 18000,
    height: 25,
    lastWatered: new Date(Date.now() - 1 * 86400000).toISOString(),
    aiOptimized: false,
    esp32DeviceId: 'ESP32-IN-01',
    historicalData: generateHistoricalData(7, { health: 88, height: 24, soilMoisture: 75, humidity: 62, ph: 6.7, temperature: 22, lightLumens: 17000 }),
  },
  {
    id: 4,
    name: 'Gold Spice',
    type: PlantType.SaffronCrocus,
    location: PlantLocation.Outdoor,
    health: PlantHealth.Poor,
    temperature: 32,
    soilMoisture: 45,
    humidity: 40,
    ph: 6.5,
    lightLumens: 35000,
    height: 15,
    lastWatered: new Date(Date.now() - 1 * 86400000).toISOString(),
    aiOptimized: false,
    esp32DeviceId: 'ESP32-OUT-02',
    historicalData: generateHistoricalData(7, { health: 45, height: 14.5, soilMoisture: 50, humidity: 45, ph: 6.6, temperature: 30, lightLumens: 38000 }),
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
    { id: 1, plantId: 1, type: ActivityType.Water, description: 'Manually watered.', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 2, plantId: 2, type: ActivityType.AiRecommendation, description: 'AI suggests increasing watering frequency.', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, plantId: 3, type: ActivityType.Light, description: 'Adjusted light position.', timestamp: new Date().toISOString() },
    { id: 4, plantId: 2, type: ActivityType.System, description: 'AI Optimization enabled.', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 5, plantId: 4, type: ActivityType.System, description: 'Device went offline.', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() }
];

// SVG Icons
export const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
);

export const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export const WaterDropIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C5 11.1 4 13 4 15a7 7 0 0 0 7 7z" /></svg>
);

export const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
);

export const ThermometerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /></svg>
);

export const SnowflakeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="12" y2="12" /><line x1="12" x2="12" y1="2" y2="22" /><path d="m20 16-4-4 4-4" /><path d="m4 8 4 4-4 4" /><path d="m16 4-4 4-4-4" /><path d="m8 20 4-4 4 4" /></svg>
);

export const ActivityIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);

export const BotIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
);

export const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
);

export const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

export const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
);

export const GearIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 7 1.4-1.4"/><path d="m5.6 18.4 1.4-1.4"/><path d="M22 12h-2"/><path d="M4 12H2"/><path d="m17 17-1.4 1.4"/><path d="m6.4 5.6-1.4 1.4"/></svg>
);

export const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);

export const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

export const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);

export const CloudIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
);

export const WindIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 0-3.5-3.5" /><path d="M12 12H2" /><path d="M14 17H7" /><path d="M22 17H17" /></svg>
);