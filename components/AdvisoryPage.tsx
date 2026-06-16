import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Activity, 
  Heart,
  Droplet,
  Thermometer,
  Compass,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { Plant, PlantHealth, AiRecommendation } from '../types.ts';
import { getCareRecommendation } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';

interface AdvisoryPageProps {
  plants: Plant[];
  onTriggerAction: (plantId: number, description: string) => void;
}

const AdvisoryPage: React.FC<AdvisoryPageProps> = ({ plants, onTriggerAction }) => {
  const [selectedPlantIdx, setSelectedPlantIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Simple static reference guidelines
  const generalGuidelines = [
    { title: "Optimal Hydration", text: "Ensure indoor Monsteras are kept at 50-70% soil moisture, allowing top-soil to dry slightly before watering.", type: "water" },
    { title: "UV Sunlight Limits", text: "Cherry Tomatoes require outdoor direct sunlight of 40,000 to 50,000 lumens. Relocate if shade blocking occurs.", type: "light" },
    { title: "Saffron Cold Protection", text: "Saffron Crocus beds perform best under cooled temperatures (~15-22°C). Activate active exhaust fans under excessive heat.", type: "cool" }
  ];

  const currentPlant = plants[selectedPlantIdx] || plants[0];

  const fetchAiAdvisory = async () => {
    if (!currentPlant) return;
    setLoading(true);
    setErrorMsg(null);
    setRecommendation(null);

    try {
      const res = await getCareRecommendation(currentPlant);
      setRecommendation(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to query Gemini AI engine directly. Falling back to local botanical rules.");
      
      // Smart offline fallback logic
      setTimeout(() => {
        let fallback: AiRecommendation = { urgency: 'normal', suggestion: 'Maintain present parameters.' };
        if (currentPlant.health === PlantHealth.NeedsCare) {
          fallback = {
            urgency: 'urgent',
            suggestion: `Increase water volume. Current soil moisture (${currentPlant.soilMoisture}%) is dangerously close to drought bounds of 40% for the plant.`
          };
        } else if (currentPlant.health === PlantHealth.Poor) {
          fallback = {
            urgency: 'urgent',
            suggestion: `Excessive heat warning! Current bed temperature (${currentPlant.temperature}°C) is stressing the corms. Toggle cooling fan exhaust zones immediately.`
          };
        } else {
          fallback = {
            urgency: 'optimal',
            suggestion: `All telemetry markers are pristine. Keep keeping soil moisture above 60% and maintain stable UV exposure.`
          };
        }
        setRecommendation(fallback);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  const executeAdvisoryTip = () => {
    if (!recommendation || !currentPlant) return;
    onTriggerAction(currentPlant.id, recommendation.suggestion);
    alert(`Applied AI optimization preset to "${currentPlant.name}": ${recommendation.suggestion}`);
  };

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400';
      case 'normal': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
      default: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-outfit">
          <BrainCircuit className="w-6 h-6 text-brand-green" /> Botanical Care Advisory
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Query high-level Gemini models for smart care tips, bio-analysis, and real-time environment actions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plant Selector Side Block */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Select Plant Profile</h3>
          <div className="space-y-2">
            {plants.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPlantIdx(idx);
                  setRecommendation(null);
                  setErrorMsg(null);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  selectedPlantIdx === idx
                    ? 'bg-brand-green/5 border-brand-green text-gray-900 dark:text-white ring-1 ring-brand-green/30'
                    : 'bg-white border-gray-100 text-gray-500 dark:bg-brand-dark-card dark:border-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    p.health === PlantHealth.Good ? 'bg-green-100 text-green-600' :
                    p.health === PlantHealth.NeedsCare ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{p.name}</h4>
                    <span className="text-[10px] text-gray-400">{p.type}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.health === PlantHealth.Good ? 'bg-green-100 text-green-800' :
                  p.health === PlantHealth.NeedsCare ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {p.health}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Advisory Analysis Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs text-gray-400 font-semibold font-mono uppercase bg-gray-100 dark:bg-brand-dark-bg px-2 py-1 rounded">
                  Analytical Subject
                </span>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1 font-outfit">{currentPlant.name}</h3>
                <p className="text-xs text-gray-400">{currentPlant.type} located in {currentPlant.location} Bed</p>
              </div>

              <button
                onClick={fetchAiAdvisory}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md cursor-pointer transition"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{loading ? 'Consulting Gemini...' : 'Query Gemini Care Agent'}</span>
              </button>
            </div>

            {/* Current Plant Telemetry Board */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 dark:bg-brand-dark-bg p-3 rounded-2xl flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <div>
                  <span className="text-[10px] text-gray-400 block leading-tight">Ambient</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-white">{currentPlant.temperature}°C</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-brand-dark-bg p-3 rounded-2xl flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="text-[10px] text-gray-400 block leading-tight">Moisture</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-white">{currentPlant.soilMoisture}%</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-brand-dark-bg p-3 rounded-2xl flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-[10px] text-gray-400 block leading-tight">Solids pH</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-white">{currentPlant.ph.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Response Section */}
            {loading && (
              <div className="flex flex-col items-center justify-center p-8 bg-purple-50/50 dark:bg-purple-950/10 border border-dashed border-purple-200 dark:border-purple-900 rounded-2xl min-h-[160px]">
                <Spinner className="text-purple-500" />
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-3">Synthesizing plant health vectors in GenAI core...</p>
                <p className="text-[10px] text-gray-400 mt-1">Fetching latest recommendations for {currentPlant.type}</p>
              </div>
            )}

            {!loading && !recommendation && (
              <div className="flex flex-col items-center text-center p-8 bg-gray-50 dark:bg-brand-dark-bg rounded-2xl border border-gray-100 dark:border-gray-800">
                <HelpCircle className="w-8 h-8 text-gray-400 mb-2" />
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">No active care prescription</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Connect and select a plant profile, then click the Query button to pull dynamic botanical analytics from Google Gemini API.
                </p>
              </div>
            )}

            {!loading && recommendation && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/40 dark:from-purple-950/15 dark:to-brand-dark-bg border border-purple-100 dark:border-purple-950 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> AI Care Diagnostics
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${getUrgencyBadgeColor(recommendation.urgency)}`}>
                    Urgency: {recommendation.urgency}
                  </span>
                </div>

                <p className="text-sm text-gray-800 dark:text-gray-200 italic leading-relaxed py-2 font-medium">
                  "{recommendation.suggestion}"
                </p>

                <div className="border-t border-purple-100 dark:border-purple-900/40 pt-4 mt-3 flex justify-between items-center">
                  <div className="text-[11px] text-gray-400">
                    Calculated by model: <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">gemini-2.5-flash</span>
                  </div>
                  <button
                    onClick={executeAdvisoryTip}
                    className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline hover:gap-1.5 transition"
                  >
                    Apply Preset Limits <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 py-2.5 px-3 leading-tight mt-3 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/20 font-semibold">
                ⚠️ {errorMsg}
              </p>
            )}
          </div>

          {/* Guidelines Cards Block */}
          <div className="bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-1.5 font-outfit">
              <Lightbulb className="w-4 h-4 text-emerald-500" /> Key Species Safeguards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {generalGuidelines.map((g, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-brand-dark-bg text-xs">
                  <span className="font-bold text-gray-850 dark:text-white flex items-center gap-1 mb-1 shadow-2xs">
                    {g.title}
                  </span>
                  <p className="text-gray-500 leading-relaxed capitalize">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPage;
