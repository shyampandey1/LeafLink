
import React, { useState, useEffect } from 'react';
import { Plant, AiRecommendation } from '../types.ts';
import { getCareRecommendation } from '../services/geminiService.ts';
import CustomChart from './CustomChart.tsx';
import RecommendationCard from './RecommendationCard.tsx';
import Spinner from './Spinner.tsx';
import { XIcon, BotIcon } from '../constants.tsx';

interface AnalyticsModalProps {
  plant: Plant;
  onClose: () => void;
  addActivity: (plantId: number, description: string) => void;
}

const aiAnalysisSteps = [
    "Analyzing sensor data...",
    "Cross-referencing historical trends...",
    "Consulting plant-type database...",
    "Generating recommendations...",
];

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ plant, onClose, addActivity }) => {
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);

  const fetchRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    setAnalysisStep(0);

    const intervalId = setInterval(() => {
        setAnalysisStep(prev => (prev + 1) % aiAnalysisSteps.length);
    }, 1500);

    try {
      const result = await getCareRecommendation(plant);
      setRecommendation(result);
      addActivity(plant.id, `AI suggestion: ${result.suggestion}`);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      clearInterval(intervalId);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-brand-dark-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scale-in">
        <div className="sticky top-0 bg-white dark:bg-brand-dark-card p-4 border-b border-gray-200 dark:border-gray-700 z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Analytics for <span className="text-brand-green">{plant.name}</span></h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* AI Recommendations Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><BotIcon className="mr-2"/>AI Smart Care</h3>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                  <Spinner className="text-brand-blue" />
                  <p className="mt-3 text-brand-blue font-medium">{aiAnalysisSteps[analysisStep]}</p>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center p-4 bg-red-50 dark:bg-red-900/50 rounded-lg">{error}</div>
              ) : recommendation ? (
                <RecommendationCard recommendation={recommendation} />
              ) : (
                 <div className="text-center text-gray-500 dark:text-gray-400">Click the button to get a personalized care recommendation.</div>
              )}
               <button 
                  onClick={fetchRecommendation} 
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 bg-brand-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Analyzing...' : recommendation ? 'Get New Recommendation' : 'Get Care Recommendation'}
               </button>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Health & Growth (7-Day)</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <CustomChart 
                  data={plant.historicalData}
                  xAxisKey="date"
                  dualAxis={true}
                  lines={[
                    { key: 'health', color: '#10B981', label: 'Health', unit: '%' },
                    { key: 'height', color: '#3B82F6', label: 'Height', unit: 'cm' },
                  ]}
                />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Environmental Conditions (7-Day)</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                 <CustomChart 
                  data={plant.historicalData}
                  xAxisKey="date"
                  dualAxis={false}
                  lines={[
                    { key: 'soilMoisture', color: '#0EA5E9', label: 'Moisture', unit: '%' },
                    { key: 'temperature', color: '#F97316', label: 'Temp', unit: '°C' },
                    { key: 'lightLumens', color: '#FBBF24', label: 'Light', unit: 'lm' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AnalyticsModal;