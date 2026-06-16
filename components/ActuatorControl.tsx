import React, { useState } from 'react';
import { 
  Droplet, 
  Sun, 
  Wind, 
  Flame, 
  Clock, 
  Zap, 
  ZapOff, 
  Sliders, 
  Tv, 
  CheckCircle2, 
  Cpu,
  AlertCircle
} from 'lucide-react';
import { Plant, ESP32Device, ActivityType } from '../types.ts';

interface ActuatorState {
  pumpIndoor: { active: boolean; flowRate: number; timer: number; duration: number };
  pumpOutdoor: { active: boolean; flowRate: number; timer: number; duration: number };
  growLight: { active: boolean; intensity: number; spectrum: 'veg' | 'bloom' | 'full' };
  coolingFan: { active: boolean; speed: number; threshold: number; auto: boolean };
}

interface ActuatorControlProps {
  plants: Plant[];
  devices: ESP32Device[];
  offlineMode: boolean;
  onActionTriggered: (plantId: number, name: string, type: ActivityType, description: string) => void;
  onUpdatePlantMetric: (plantId: number, field: 'soilMoisture' | 'lightLumens' | 'temperature', value: number) => void;
}

const ActuatorControl: React.FC<ActuatorControlProps> = ({
  plants,
  devices,
  offlineMode,
  onActionTriggered,
  onUpdatePlantMetric
}) => {
  // Local state for interactive actuator control console
  const [actuators, setActuators] = useState<ActuatorState>({
    pumpIndoor: { active: false, flowRate: 2.4, timer: 12, duration: 15 },
    pumpOutdoor: { active: false, flowRate: 4.8, timer: 8, duration: 30 },
    growLight: { active: true, intensity: 75, spectrum: 'full' },
    coolingFan: { active: false, speed: 2, threshold: 28, auto: true },
  });

  const [activeZone, setActiveZone] = useState<'all' | 'indoor' | 'outdoor'>('all');

  const getDeviceStatus = (deviceId: string) => {
    if (offlineMode) return 'offline_mode';
    const dev = devices.find(d => d.id === deviceId);
    return dev ? dev.status : 'offline';
  };

  const togglePumpIndoor = () => {
    const newState = !actuators.pumpIndoor.active;
    setActuators(prev => ({
      ...prev,
      pumpIndoor: { ...prev.pumpIndoor, active: newState }
    }));

    // Trigger action for Indoor plants (Monty [ID:1] and Geno [ID:3])
    const indPlants = plants.filter(p => p.id === 1 || p.id === 3);
    indPlants.forEach(p => {
      if (newState) {
        onActionTriggered(
          p.id,
          'Drip Irrigation',
          ActivityType.Water,
          `High-Flow Pump activated manually. Flowing at ${actuators.pumpIndoor.flowRate} L/min.`
        );
        // Moisture increase mimicking physical water dump
        onUpdatePlantMetric(p.id, 'soilMoisture', Math.min(100, p.soilMoisture + 15));
      } else {
        onActionTriggered(p.id, 'Drip Irrigation', ActivityType.System, 'Indoor Pump shut down.');
      }
    });
  };

  const togglePumpOutdoor = () => {
    const newState = !actuators.pumpOutdoor.active;
    setActuators(prev => ({
      ...prev,
      pumpOutdoor: { ...prev.pumpOutdoor, active: newState }
    }));

    // Trigger action for Outdoor plants (Red Gems [ID:2] and Gold Spice [ID:4])
    const outPlants = plants.filter(p => p.id === 2 || p.id === 4);
    outPlants.forEach(p => {
      if (newState) {
        onActionTriggered(
          p.id,
          'Sprinkler Valve',
          ActivityType.Water,
          `High-Pressure Sprinkler activated. Flowing at ${actuators.pumpOutdoor.flowRate} L/min.`
        );
        onUpdatePlantMetric(p.id, 'soilMoisture', Math.min(100, p.soilMoisture + 20));
      } else {
        onActionTriggered(p.id, 'Sprinkler Valve', ActivityType.System, 'Outdoor Sprinkler valve closed.');
      }
    });
  };

  const handleLightIntensityChange = (val: number) => {
    setActuators(prev => ({
      ...prev,
      growLight: { ...prev.growLight, intensity: val }
    }));

    // Affect Indoor plants light reading in real time!
    const indPlants = plants.filter(p => p.id === 1 || p.id === 3);
    indPlants.forEach(p => {
      const lumenCap = val * 350; // Map slider to lumens
      onUpdatePlantMetric(p.id, 'lightLumens', lumenCap);
    });
  };

  const toggleGrowLight = () => {
    const newState = !actuators.growLight.active;
    setActuators(prev => ({
      ...prev,
      growLight: { ...prev.growLight, active: newState }
    }));

    const indPlants = plants.filter(p => p.id === 1 || p.id === 3);
    indPlants.forEach(p => {
      if (newState) {
        onActionTriggered(
          p.id,
          'Grow Lights',
          ActivityType.Light,
          `Full spectral grid ON at ${actuators.growLight.intensity}% power.`
        );
        onUpdatePlantMetric(p.id, 'lightLumens', actuators.growLight.intensity * 250);
      } else {
        onActionTriggered(p.id, 'Grow Lights', ActivityType.System, 'Spectral Grid disabled.');
        onUpdatePlantMetric(p.id, 'lightLumens', 500); // ambient indoor
      }
    });
  };

  const handleSpectrumChange = (spec: 'veg' | 'bloom' | 'full') => {
    setActuators(prev => ({
      ...prev,
      growLight: { ...prev.growLight, spectrum: spec }
    }));
    const textMap = { veg: 'Blue Veg Spectrum', bloom: 'Red Bloom Spectrum', full: 'Sunlit Full Spectrum' };
    
    const indPlants = plants.filter(p => p.id === 1 || p.id === 3);
    indPlants.forEach(p => {
      onActionTriggered(p.id, 'Grow Lights', ActivityType.Light, `Spectrum configured to: ${textMap[spec]}.`);
    });
  };

  const toggleCoolingFan = () => {
    const newState = !actuators.coolingFan.active;
    setActuators(prev => ({
      ...prev,
      coolingFan: { ...prev.coolingFan, active: newState }
    }));

    const goldSpice = plants.find(p => p.id === 4);
    if (goldSpice) {
      if (newState) {
        onActionTriggered(
          4,
          'Exhaust Fan',
          ActivityType.Cooling,
          `Exhaust Blower set to manual speed: ${actuators.coolingFan.speed}/3.`
        );
        onUpdatePlantMetric(4, 'temperature', Math.max(16, goldSpice.temperature - 6));
      } else {
        onActionTriggered(4, 'Exhaust Fan', ActivityType.System, 'Exhaust blower halted.');
      }
    }
  };

  const changeFanSpeed = (spd: number) => {
    setActuators(prev => ({
      ...prev,
      coolingFan: { ...prev.coolingFan, speed: spd }
    }));
    const goldSpice = plants.find(p => p.id === 4);
    if (goldSpice && actuators.coolingFan.active) {
      onActionTriggered(4, 'Exhaust Fan', ActivityType.Cooling, `Fan speed increased to level ${spd}.`);
      onUpdatePlantMetric(4, 'temperature', Math.max(12, goldSpice.temperature - spd * 2));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-outfit">
            <Sliders className="w-6 h-6 text-brand-green" /> Hardware Control Room
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time actuator overrides and GPIO triggers for connected microcontrollers
          </p>
        </div>

        {/* Global Active Offline Indicator */}
        {offlineMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-semibold animate-pulse">
            <AlertCircle className="w-4 h-4" />
            Local BLE Override Active
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-brand-dark-bg rounded-xl max-w-sm">
        {(['all', 'indoor', 'outdoor'] as const).map(zone => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`flex-1 text-center py-2 px-3 rounded-lg text-sm font-semibold capitalize transition ${
              activeZone === zone
                ? 'bg-white dark:bg-brand-dark-card text-brand-green shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Actuator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ACTUATOR 1: INDOOR PUMP */}
        {(activeZone === 'all' || activeZone === 'indoor') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl transition ${
                  actuators.pumpIndoor.active 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  <Droplet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Indoor Water Pump</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" /> Zone A • ESP32-IN-01
                  </p>
                </div>
              </div>

              {/* HomeKit Style Toggle Button */}
              <button
                onClick={togglePumpIndoor}
                className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-[4px] border ${
                  actuators.pumpIndoor.active ? 'bg-blue-500 border-transparent' : 'bg-gray-200 dark:bg-gray-900 border-gray-300 dark:border-gray-800'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  actuators.pumpIndoor.active ? 'translate-x-[22px]' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Actuator Info Status */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-brand-dark-bg p-2.5 rounded-xl">
                <div className="text-xs text-gray-400 dark:text-gray-500">Flow Rating</div>
                <div className="text-base font-bold text-gray-800 dark:text-white">
                  {actuators.pumpIndoor.active ? `${actuators.pumpIndoor.flowRate} L/m` : '0.0 L/m'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-brand-dark-bg p-2.5 rounded-xl">
                <div className="text-xs text-gray-400 dark:text-gray-500">Device Link</div>
                <div className="text-xs font-semibold flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    getDeviceStatus('ESP32-IN-01') === 'online' ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                  <span className="capitalize text-gray-700 dark:text-gray-300">
                    {getDeviceStatus('ESP32-IN-01') === 'online' ? 'Online' : 'Override Mode'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-scheduling Parameters */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-green" /> Irrigation Duty Cycle</span>
                <span>Water every {actuators.pumpIndoor.timer} hr</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="4"
                value={actuators.pumpIndoor.timer}
                onChange={e => setActuators(p => ({ ...p, pumpIndoor: { ...p.pumpIndoor, timer: Number(e.target.value) } }))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Duration: <strong>{actuators.pumpIndoor.duration}s</strong></span>
                <div className="flex gap-1.5">
                  {[5, 15, 30].map(d => (
                    <button
                      key={d}
                      onClick={() => setActuators(p => ({ ...p, pumpIndoor: { ...p.pumpIndoor, duration: d } }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        actuators.pumpIndoor.duration === d 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTUATOR 2: OUTDOOR SPRINKLER */}
        {(activeZone === 'all' || activeZone === 'outdoor') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl transition ${
                  actuators.pumpOutdoor.active 
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 animate-pulse' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  <Droplet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Outdoor Irrigation Valve</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" /> Zone B • ESP32-OUT-01
                  </p>
                </div>
              </div>

              <button
                onClick={togglePumpOutdoor}
                className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-[4px] border ${
                  actuators.pumpOutdoor.active ? 'bg-teal-500 border-transparent' : 'bg-gray-200 dark:bg-gray-900 border-gray-300 dark:border-gray-800'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  actuators.pumpOutdoor.active ? 'translate-x-[22px]' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-brand-dark-bg p-2.5 rounded-xl">
                <div className="text-xs text-gray-400 dark:text-gray-500">Flow Rating</div>
                <div className="text-base font-bold text-gray-800 dark:text-white">
                  {actuators.pumpOutdoor.active ? `${actuators.pumpOutdoor.flowRate} L/m` : '0.0 L/m'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-brand-dark-bg p-2.5 rounded-xl">
                <div className="text-xs text-gray-400 dark:text-gray-500">Device Link</div>
                <div className="text-xs font-semibold flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    getDeviceStatus('ESP32-OUT-01') === 'online' ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                  <span className="capitalize text-gray-700 dark:text-gray-300">
                    {getDeviceStatus('ESP32-OUT-01') === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-teal-600" /> Valve Schedule</span>
                <span>Mist every {actuators.pumpOutdoor.timer} hr</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="2"
                value={actuators.pumpOutdoor.timer}
                onChange={e => setActuators(p => ({ ...p, pumpOutdoor: { ...p.pumpOutdoor, timer: Number(e.target.value) } }))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Mist Duration: <strong>{actuators.pumpOutdoor.duration}s</strong></span>
                <div className="flex gap-1.5">
                  {[10, 30, 60].map(d => (
                    <button
                      key={d}
                      onClick={() => setActuators(p => ({ ...p, pumpOutdoor: { ...p.pumpOutdoor, duration: d } }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        actuators.pumpOutdoor.duration === d 
                          ? 'bg-teal-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTUATOR 3: GROW LIGHTS */}
        {(activeZone === 'all' || activeZone === 'indoor') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition relative overflow-hidden">
            {/* Soft violet backdrop glow if lights are active */}
            {actuators.growLight.active && (
              <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/5 rounded-full filter blur-xl pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-4 z-10 relative">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl transition ${
                  actuators.growLight.active 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  {actuators.growLight.active ? <Sun className="w-6 h-6 animate-spin-slow" /> : <Sun className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Spectral LED Array</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" /> Growth Bed • ESP32-IN-01
                  </p>
                </div>
              </div>

              <button
                onClick={toggleGrowLight}
                className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-[4px] border ${
                  actuators.growLight.active ? 'bg-purple-500 border-transparent' : 'bg-gray-250 dark:bg-gray-900 border-gray-300 dark:border-gray-800'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  actuators.growLight.active ? 'translate-x-[22px]' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Brightness slider bar */}
            <div className="space-y-3 mb-5 z-10 relative">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-semibold">
                <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-purple-500" /> Beam Energy Intensity</span>
                <span className="text-purple-600 dark:text-purple-400">{actuators.growLight.active ? `${actuators.growLight.intensity}%` : 'Disabled'}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                disabled={!actuators.growLight.active}
                value={actuators.growLight.intensity}
                onChange={e => handleLightIntensityChange(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-40"
              />
            </div>

            {/* Spectrum selection buttons */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 z-10 relative">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Photobiology Output Spectrum</div>
              <div className="grid grid-cols-3 gap-2">
                {(['veg', 'bloom', 'full'] as const).map(spec => (
                  <button
                    key={spec}
                    disabled={!actuators.growLight.active}
                    onClick={() => handleSpectrumChange(spec)}
                    className={`py-1.5 rounded-lg text-xs font-bold capitalize border transition ${
                      actuators.growLight.spectrum === spec && actuators.growLight.active
                        ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900/40 dark:text-purple-300'
                        : 'bg-white border-gray-100 text-gray-600 dark:bg-brand-dark-bg dark:border-gray-800 dark:text-gray-400 hover:bg-gray-50'
                    } disabled:opacity-40`}
                  >
                    {spec === 'veg' ? '🟦 Veg' : spec === 'bloom' ? '🟥 Bloom' : '🔶 Full'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACTUATOR 4: EXHAUST COOLING FAN */}
        {(activeZone === 'all' || activeZone === 'outdoor') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl transition ${
                  actuators.coolingFan.active 
                    ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 animate-pulse' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  <Wind className={`w-6 h-6 ${actuators.coolingFan.active ? 'animate-breeze' : ''}`} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Active Cooling Blower</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" /> Zone C • ESP32-OUT-02
                  </p>
                </div>
              </div>

              <button
                onClick={toggleCoolingFan}
                className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-[4px] border ${
                  actuators.coolingFan.active ? 'bg-sky-500 border-transparent' : 'bg-gray-250 dark:bg-gray-900 border-gray-300 dark:border-gray-800'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  actuators.coolingFan.active ? 'translate-x-[22px]' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Auto Mode Control Link */}
            <div className="flex items-center justify-between text-xs mb-4 p-2 bg-gray-50 dark:bg-brand-dark-bg rounded-xl">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">Thermostatic Auto Trigger</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={actuators.coolingFan.auto}
                  onChange={e => setActuators(p => ({ ...p, coolingFan: { ...p.coolingFan, auto: e.target.checked } }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-205 dark:bg-gray-900 border border-gray-300 dark:border-gray-750 rounded-full flex items-center px-[2px] transition-colors peer-checked:bg-brand-green peer-checked:border-transparent">
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    actuators.coolingFan.auto ? 'translate-x-[16px]' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>

            {/* Speed Levels */}
            <div className="space-y-4 pt-1 mb-1">
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 font-semibold">
                <span>Manual Exhaust Speed</span>
                <span>Level {actuators.coolingFan.speed}/3</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map(lvl => (
                  <button
                    key={lvl}
                    disabled={!actuators.coolingFan.active || actuators.coolingFan.auto}
                    onClick={() => changeFanSpeed(lvl)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center border transition ${
                      actuators.coolingFan.speed === lvl && actuators.coolingFan.active && !actuators.coolingFan.auto
                        ? 'bg-sky-500 border-sky-400 text-white'
                        : 'bg-white border-gray-100 text-gray-700 dark:bg-brand-dark-bg dark:border-gray-800 dark:text-gray-400 hover:bg-gray-50'
                    } disabled:opacity-40`}
                  >
                    Level {lvl === 1 ? '1 Low' : lvl === 2 ? '2 Med' : '3 High'}
                  </button>
                ))}
              </div>

              {/* Autotrigger slider targets */}
              {actuators.coolingFan.auto && (
                <div className="space-y-2 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Critical Temp Setpoint:</span>
                    <span className="font-bold text-red-500 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> &gt; {actuators.coolingFan.threshold}°C</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="35"
                    value={actuators.coolingFan.threshold}
                    onChange={e => setActuators(p => ({ ...p, coolingFan: { ...p.coolingFan, threshold: Number(e.target.value) } }))}
                    className="w-full h-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actuator Status Logs */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Actuator Systems Diagnostics</h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Solenoid Drip Valve Zone A</span>
            <span className="font-mono">{actuators.pumpIndoor.active ? 'DUTY HIGH [PULSE]' : 'HELD LOW [READY]'}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Sprinkler Valve Zone B</span>
            <span className="font-mono">{actuators.pumpOutdoor.active ? 'OPEN [ACTIVE_FLOW]' : 'CLOSED [STANDBY]'}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> MOSFET Spectral Luminescence Driver</span>
            <span className="font-mono">{actuators.growLight.active ? `PWM_MODE [${actuators.growLight.intensity}%]` : 'MOSFET_LOW [OFF]'}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Exhaust Fan Drive MOSFET IP40</span>
            <span className="font-mono">
              {actuators.coolingFan.active 
                ? actuators.coolingFan.auto 
                  ? `THERMO_AUTO [T > ${actuators.coolingFan.threshold}°C]` 
                  : `MANUAL_SPD [LVL ${actuators.coolingFan.speed}]` 
                : 'HALTED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActuatorControl;
