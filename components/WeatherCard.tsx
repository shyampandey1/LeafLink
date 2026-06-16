
import React from 'react';
import { WeatherInfo } from '../types.ts';
import Spinner from './Spinner.tsx';
import { SunIcon, CloudIcon, ThermometerIcon, WaterDropIcon, WindIcon } from '../constants.tsx';

interface WeatherCardProps {
    weatherInfo: WeatherInfo | null;
    loading: boolean;
    error: string | null;
}

const WeatherIcon: React.FC<{condition: string}> = ({ condition }) => {
    const lowerCaseCondition = condition.toLowerCase();
    
    if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) {
        return <SunIcon className="w-12 h-12 text-amber-400" />;
    }
    if (lowerCaseCondition.includes('cloud') || lowerCaseCondition.includes('overcast')) {
        return <CloudIcon className="w-12 h-12 text-gray-400" />;
    }
    // A more complete implementation would have icons for rain, snow, etc.
    return <CloudIcon className="w-12 h-12 text-gray-400" />;
};

const WeatherCard: React.FC<WeatherCardProps> = ({ weatherInfo, loading, error }) => {
    return (
        <div className="bg-white dark:bg-brand-dark-card rounded-2xl shadow-lg p-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {weatherInfo && !loading ? `${weatherInfo.city} Weather` : 'Current Weather'}
            </h3>
            {loading && (
                <div className="flex flex-col items-center justify-center h-40">
                    <Spinner className="text-brand-blue" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Fetching live weather...</p>
                </div>
            )}
            {error && !loading && (
                 <div className="text-center py-4">
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            )}
            {weatherInfo && !loading && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-5xl font-bold text-gray-800 dark:text-white">{weatherInfo.temperature}°</span>
                           <span className="font-medium text-gray-600 dark:text-gray-300">{weatherInfo.condition}</span>
                        </div>
                        <WeatherIcon condition={weatherInfo.condition} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-brand-dark-bg rounded-lg">
                            <WaterDropIcon className="w-5 h-5 text-sky-500" />
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
                                <div className="font-bold text-gray-800 dark:text-white">{weatherInfo.humidity}%</div>
                            </div>
                        </div>
                         <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-brand-dark-bg rounded-lg">
                            <WindIcon className="w-5 h-5 text-gray-500" />
                             <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Wind</div>
                                <div className="font-bold text-gray-800 dark:text-white">{weatherInfo.windSpeed} km/h</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherCard;
