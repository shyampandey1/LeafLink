
import React from 'react';
import { Plant, PlantHealth, PlantType } from '../types.ts';
import { WaterDropIcon, SunIcon, SnowflakeIcon, ActivityIcon } from '../constants.tsx';

interface PlantCardProps {
  plant: Plant;
  onWater: (id: number) => void;
  onLight: (id: number) => void;
  onCool: (id: number) => void;
  onToggleAi: (id: number) => void;
  onOpenAnalytics: (plant: Plant) => void;
}

const HealthIndicator: React.FC<{ health: PlantHealth }> = ({ health }) => {
  const config = {
    [PlantHealth.Good]: {
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      textColor: 'text-green-800 dark:text-green-200',
      icon: '😊',
    },
    [PlantHealth.NeedsCare]: {
      bgColor: 'bg-amber-100 dark:bg-amber-900/50',
      textColor: 'text-amber-800 dark:text-amber-200',
      icon: '😐',
    },
    [PlantHealth.Poor]: {
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      textColor: 'text-red-800 dark:text-red-200',
      icon: '☹️',
    },
  };
  const { bgColor, textColor, icon } = config[health];
  return (
    <div className={`flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${bgColor} ${textColor}`}>
      <span className="text-lg">{icon}</span>
      <span>{health}</span>
    </div>
  );
};

const SensorDataItem: React.FC<{ label: string; value: string | number; unit: string }> = ({ label, value, unit }) => (
  <div className="text-center bg-gray-100 dark:bg-brand-dark-bg p-2 rounded-lg">
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    <div className="text-lg font-bold text-gray-800 dark:text-white">{value}<span className="text-sm font-normal">{unit}</span></div>
  </div>
);

const PlantCard: React.FC<PlantCardProps> = ({ plant, onWater, onLight, onCool, onToggleAi, onOpenAnalytics }) => {
  const isSaffron = plant.type === PlantType.SaffronCrocus;

  return (
    <div className="bg-white dark:bg-brand-dark-card rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plant.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{plant.type}</p>
          </div>
          <HealthIndicator health={plant.health} />
        </div>
      </div>

      <div className="px-5 pb-5 grid grid-cols-3 gap-2">
        <SensorDataItem label="Temp" value={plant.temperature} unit="°C" />
        <SensorDataItem label="Moisture" value={plant.soilMoisture} unit="%" />
        <SensorDataItem label="Humidity" value={plant.humidity} unit="%" />
        <SensorDataItem label="pH" value={plant.ph.toFixed(1)} unit="" />
        <SensorDataItem label="Light" value={(plant.lightLumens / 1000).toFixed(1)} unit="k lm" />
        <SensorDataItem label="Height" value={plant.height} unit="cm" />
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-brand-dark-bg p-2 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Optimized</span>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={plant.aiOptimized} onChange={() => onToggleAi(plant.id)} className="sr-only peer" />
            <div className="relative w-11 h-6 bg-gray-205 dark:bg-gray-900 border border-gray-300 dark:border-gray-750 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:start-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-gray-650 peer-checked:bg-brand-green peer-checked:border-transparent"></div>
          </label>
        </div>
      </div>
      
      <div className={`mt-auto bg-gray-50 dark:bg-brand-dark-bg p-3 grid ${isSaffron ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
         <button
            onClick={() => onWater(plant.id)}
            disabled={plant.aiOptimized}
            className="flex-1 flex items-center justify-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <WaterDropIcon className="w-4 h-4" /> Water
          </button>
           <button
            onClick={() => onLight(plant.id)}
            disabled={plant.aiOptimized}
            className="flex-1 flex items-center justify-center gap-2 text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <SunIcon className="w-4 h-4" /> Light
          </button>
        {isSaffron && (
            <button
                onClick={() => onCool(plant.id)}
                disabled={plant.aiOptimized}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                <SnowflakeIcon className="w-4 h-4" /> Cool
            </button>
        )}
      </div>

      <button
        onClick={() => onOpenAnalytics(plant)}
        className="w-full mt-auto bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 transition"
      >
        <ActivityIcon className="w-4 h-4" /> View Analytics
      </button>
    </div>
  );
};

export default PlantCard;