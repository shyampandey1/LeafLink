import React, { useState, useCallback, useEffect } from 'react';
import { 
  Sprout, 
  Sliders, 
  Bluetooth, 
  BrainCircuit, 
  Settings as SettingsIcon,
  Wifi, 
  WifiOff, 
  Heart, 
  Smartphone, 
  AlertTriangle,
  RotateCw,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  Network as NetworkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Plant, Activity, ESP32Device, PlantLocation, ActivityType, PlantHealth } from './types.ts';
import { MOCK_PLANTS, MOCK_ACTIVITIES, MOCK_DEVICES } from './constants.tsx';
import { getWeatherInfo } from './services/geminiService.ts';

// Firebase Services Integration
import { 
  db, 
  auth, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './services/firebaseService.ts';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';

import PlantCard from './components/PlantCard.tsx';
import AnalyticsModal from './components/AnalyticsModal.tsx';
import ActivityFeed from './components/ActivityFeed.tsx';
import WeatherCard from './components/WeatherCard.tsx';
import ActuatorControl from './components/ActuatorControl.tsx';
import BLEHub from './components/BLEHub.tsx';
import AdvisoryPage from './components/AdvisoryPage.tsx';
import SettingsPage from './components/SettingsPage.tsx';
import AppGuide from './components/AppGuide.tsx';

const App: React.FC = () => {
  // Navigation State: 'garden' | 'actuators' | 'ble' | 'advisory' | 'settings' | 'guide'
  const [currentTab, setCurrentTab] = useState<'garden' | 'actuators' | 'ble' | 'advisory' | 'settings' | 'guide'>('garden');
  
  // Authenticated State Profile
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  // Theme State with persistent local storage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const cached = localStorage.getItem('smart_garden_theme');
    return (cached === 'dark' || cached === 'light') ? cached : 'light';
  });

  // Persistent States backed by localStorage
  const [plants, setPlants] = useState<Plant[]>(() => {
    const cached = localStorage.getItem('smart_garden_plants');
    return cached ? JSON.parse(cached) : MOCK_PLANTS;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const cached = localStorage.getItem('smart_garden_activities');
    return cached ? JSON.parse(cached) : MOCK_ACTIVITIES;
  });

  const [devices, setDevices] = useState<ESP32Device[]>(() => {
    const cached = localStorage.getItem('smart_garden_devices');
    return cached ? JSON.parse(cached) : MOCK_DEVICES;
  });

  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    const cached = localStorage.getItem('smart_garden_offline_mode');
    return cached ? JSON.parse(cached) === 'true' : false;
  });

  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  
  // Weather states
  const [weatherInfo, setWeatherInfo] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Synchronize layout changes to localStorage
  useEffect(() => {
    localStorage.setItem('smart_garden_plants', JSON.stringify(plants));
  }, [plants]);

  useEffect(() => {
    localStorage.setItem('smart_garden_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('smart_garden_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('smart_garden_offline_mode', offlineMode ? 'true' : 'false');
  }, [offlineMode]);

  // Synchronize Theme class lists
  useEffect(() => {
    localStorage.setItem('smart_garden_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Seeding routine for new operators
  const seedUserAccount = async (userId: string, email: string) => {
    setIsSyncing(true);
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        userId,
        email,
        theme,
        offlineMode,
        createdAt: new Date().toISOString()
      });

      // Seeding Initial Subcollections
      for (const plant of plants) {
        await setDoc(doc(db, 'users', userId, 'plants', String(plant.id)), plant);
      }
      for (const device of devices) {
        await setDoc(doc(db, 'users', userId, 'devices', device.id), device);
      }
      for (const activity of activities) {
        await setDoc(doc(db, 'users', userId, 'activities', String(activity.id)), activity);
      }
    } catch (e) {
      console.error("Error seeding account data:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen to Firestore auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setUserLoading(false);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await seedUserAccount(currentUser.uid, currentUser.email || 'operator@leaflink.io');
          } else {
            const userData = userSnap.data();
            if (userData.theme) setTheme(userData.theme);
            if (userData.offlineMode !== undefined) setOfflineMode(userData.offlineMode);
          }
        } catch (error) {
          console.error("Firestore user setting acquisition failed:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore synchronizer snapshot streams
  useEffect(() => {
    if (!user || offlineMode) return;

    setIsSyncing(true);
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'plants'), (snapshot) => {
      const live: Plant[] = [];
      snapshot.forEach(doc => {
        live.push(doc.data() as Plant);
      });
      if (live.length > 0) {
        live.sort((a, b) => a.id - b.id);
        setPlants(live);
      }
      setIsSyncing(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/plants`);
    });

    return () => unsub();
  }, [user, offlineMode]);

  useEffect(() => {
    if (!user || offlineMode) return;

    const unsub = onSnapshot(collection(db, 'users', user.uid, 'devices'), (snapshot) => {
      const live: ESP32Device[] = [];
      snapshot.forEach(doc => {
        live.push(doc.data() as ESP32Device);
      });
      if (live.length > 0) {
        live.sort((a, b) => a.id.localeCompare(b.id));
        setDevices(live);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/devices`);
    });

    return () => unsub();
  }, [user, offlineMode]);

  useEffect(() => {
    if (!user || offlineMode) return;

    const unsub = onSnapshot(collection(db, 'users', user.uid, 'activities'), (snapshot) => {
      const live: Activity[] = [];
      snapshot.forEach(doc => {
        live.push(doc.data() as Activity);
      });
      if (live.length > 0) {
        live.sort((a, b) => b.id - a.id);
        setActivities(live);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/activities`);
    });

    return () => unsub();
  }, [user, offlineMode]);

  // Unified write helpers with Firestore/LocalStorage fallback strategies
  const updatePlantInDb = useCallback(async (updatedPlant: Plant) => {
    if (user && !offlineMode) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'plants', String(updatedPlant.id)), updatedPlant);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/plants/${updatedPlant.id}`);
      }
    } else {
      setPlants(prev => prev.map(p => p.id === updatedPlant.id ? updatedPlant : p));
    }
  }, [user, offlineMode]);

  const updateDeviceInDb = useCallback(async (updatedDevice: ESP32Device) => {
    if (user && !offlineMode) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'devices', updatedDevice.id), updatedDevice);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/devices/${updatedDevice.id}`);
      }
    } else {
      setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
    }
  }, [user, offlineMode]);

  const addActivityInDb = useCallback(async (plantId: number, description: string, type: ActivityType = ActivityType.System) => {
    const newActivity: Activity = {
      id: Date.now(),
      plantId,
      type,
      description,
      timestamp: new Date().toISOString()
    };

    if (user && !offlineMode) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'activities', String(newActivity.id)), newActivity);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/activities/${newActivity.id}`);
      }
    } else {
      setActivities(prev => [newActivity, ...prev]);
    }
  }, [user, offlineMode]);

  // Fetch weather parameters
  const fetchWeather = useCallback(async (location: { lat: number; lon: number } | null) => {
    if (offlineMode) {
      setWeatherInfo({ city: 'Ludhiana (Local Cache)', temperature: 27, condition: 'Partly Cloudy', humidity: 75, windSpeed: 8 });
      setWeatherLoading(false);
      return;
    }

    setWeatherLoading(true);
    try {
      const data = await getWeatherInfo(location);
      setWeatherInfo(data);
      setWeatherError(null);
    } catch (error) {
      setWeatherError("Failed to fetch custom weather data.");
      console.error(error);
    } finally {
      setWeatherLoading(false);
    }
  }, [offlineMode]);

  useEffect(() => {
    const getGeoposition = async () => {
      if (offlineMode) {
        fetchWeather(null);
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          async (geoError) => {
            console.warn("Geolocation blocked/failed:", geoError.message);
            
            // Fallback to IP-based geolocation
            try {
              const res = await fetch('https://ipapi.co/json/');
              if (res.ok) {
                const data = await res.json();
                if (data.latitude && data.longitude) {
                  fetchWeather({
                    lat: data.latitude,
                    lon: data.longitude,
                  });
                  return;
                }
              }
            } catch (ipError) {
              console.error("IP geolocation failed:", ipError);
            }
            
            // Hard fallback to Ludhiana, India coordinates if IP lookup also fails
            fetchWeather({ lat: 30.9120, lon: 75.8538 });
          }
        );
      } else {
        fetchWeather(null);
      }
    };

    getGeoposition();
  }, [offlineMode, fetchWeather]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (user && !offlineMode) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { theme: nextTheme });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleToggleOfflineInApp = async () => {
    const nextMode = !offlineMode;
    setOfflineMode(nextMode);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { offlineMode: nextMode });
      } catch (error) {
        console.error(error);
      }
    }

    if (!nextMode) {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        addActivityInDb(1, "Cloud Link restored. Synchronized 12 queued local events to persistence layer.", ActivityType.System);
      }, 1500);
    } else {
      addActivityInDb(1, "Smart Garden switched to Offline Local Cache mode.", ActivityType.System);
    }
  };

  const handleUpdatePlantMetric = useCallback((plantId: number, field: 'soilMoisture' | 'lightLumens' | 'temperature', value: number) => {
    const target = plants.find(p => p.id === plantId);
    if (target) {
      let health = target.health;
      
      // Dynamic re-calculations of plant health
      if (field === 'soilMoisture') {
        if (value > 55 && value < 85) health = PlantHealth.Good;
        else if (value > 40 && value <= 55) health = PlantHealth.NeedsCare;
        else health = PlantHealth.Poor;
      } else if (field === 'temperature') {
        if (value > 15 && value < 29) health = PlantHealth.Good;
        else if (value > 29 && value < 34) health = PlantHealth.NeedsCare;
        else health = PlantHealth.Poor;
      }

      const updatedPatch: Plant = {
        ...target,
        [field]: value,
        health,
        historicalData: target.historicalData.map((h, i) => i === target.historicalData.length - 1 ? {
          ...h,
          [field]: value,
          health: health === PlantHealth.Good ? 92 : health === PlantHealth.NeedsCare ? 60 : 35
        } : h)
      };
      updatePlantInDb(updatedPatch);
    }
  }, [plants, updatePlantInDb]);

  const handleWater = (id: number) => {
    const target = plants.find(p => p.id === id);
    if (target) {
      const updated = { 
        ...target, 
        soilMoisture: Math.min(100, target.soilMoisture + 20), 
        health: PlantHealth.Good, 
        lastWatered: new Date().toISOString() 
      };
      updatePlantInDb(updated);
      addActivityInDb(id, 'Manually watered via client controller.', ActivityType.Water);
    }
  };

  const handleLight = (id: number) => {
    const target = plants.find(p => p.id === id);
    if (target) {
      const updated = { ...target, lightLumens: Math.min(50000, target.lightLumens + 5000) };
      updatePlantInDb(updated);
      addActivityInDb(id, 'GPIO grow LED grid activated.', ActivityType.Light);
    }
  };

  const handleCool = (id: number) => {
    const target = plants.find(p => p.id === id);
    if (target) {
      const updated = { ...target, temperature: Math.max(10, target.temperature - 5) };
      updatePlantInDb(updated);
      addActivityInDb(id, 'Blower fan exhaust triggered.', ActivityType.Cooling);
    }
  };

  const handleToggleAi = (id: number) => {
    const target = plants.find(p => p.id === id);
    if (target) {
      const updated = { ...target, aiOptimized: !target.aiOptimized };
      updatePlantInDb(updated);
      addActivityInDb(id, `Automated AI Optimizer is ${target.aiOptimized ? 'DEACTIVATED' : 'BOUNDED'}.`);
    }
  };

  const handleDeviceBleStatus = (deviceId: string, status: 'online' | 'offline') => {
    const target = devices.find(d => d.id === deviceId);
    if (target) {
      updateDeviceInDb({ ...target, status, lastSeen: new Date().toISOString() });
    }
  };

  const handleResetSystemDB = async () => {
    if (user && !offlineMode) {
      setIsSyncing(true);
      try {
        for (const p of MOCK_PLANTS) {
          await setDoc(doc(db, 'users', user.uid, 'plants', String(p.id)), p);
        }
        for (const d of MOCK_DEVICES) {
          await setDoc(doc(db, 'users', user.uid, 'devices', d.id), d);
        }
        for (const a of MOCK_ACTIVITIES) {
          await setDoc(doc(db, 'users', user.uid, 'activities', String(a.id)), a);
        }
      } catch (error) {
        console.error("Error resetting Firestore DB: ", error);
      } finally {
        setIsSyncing(false);
      }
    } else {
      localStorage.removeItem('smart_garden_plants');
      localStorage.removeItem('smart_garden_activities');
      localStorage.removeItem('smart_garden_devices');
      localStorage.removeItem('smart_garden_offline_mode');
      
      setPlants(MOCK_PLANTS);
      setActivities(MOCK_ACTIVITIES);
      setDevices(MOCK_DEVICES);
      setOfflineMode(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsSyncing(true);
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in profile: ", result.user.email);
    } catch (e) {
      console.error("Auth popup login aborted or blocked:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsSyncing(true);
      await signOut(auth);
      setPlants(MOCK_PLANTS);
      setActivities(MOCK_ACTIVITIES);
      setDevices(MOCK_DEVICES);
    } catch (e) {
      console.error("Signout fail", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const indoorPlants = plants.filter(p => p.location === PlantLocation.Indoor);
  const outdoorPlants = plants.filter(p => p.location === PlantLocation.Outdoor);

  // Dynamic system-wide botanical composite index
  const averageHealthScore = Math.round(
    plants.reduce((acc, p) => acc + (p.health === PlantHealth.Good ? 100 : p.health === PlantHealth.NeedsCare ? 60 : 30), 0) / plants.length
  );

  const activeConnectedDevicesCount = offlineMode ? 0 : devices.filter(d => d.status === 'online').length;

  // Active view switcher router
  const renderViewContent = () => {
    switch (currentTab) {
      case 'garden':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              {/* Grand System Vital Board */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-950/20 dark:to-teal-950/20 text-white shadow-md flex items-center justify-between border border-emerald-400/20">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest font-bold opacity-80">Botanical Health Index</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold font-outfit">{averageHealthScore}%</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-white/20 rounded-full">Solid Stable</span>
                  </div>
                  <p className="text-xs opacity-90 pt-1">
                    Indoor zones are pristine. Saffron outdoor crops require temperature cooling monitoring.
                  </p>
                </div>
                <div className="p-4.5 bg-white/10 rounded-2xl border border-white/10 shrink-0">
                  <Sprout className="w-8 h-8 text-emerald-200 animate-pulse" />
                </div>
              </div>

              {/* INDOOR SECTION */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-850 dark:text-white flex items-center gap-1.5 font-outfit">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Indoor Biological Grid
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {indoorPlants.map(plant => (
                    <PlantCard
                      key={plant.id}
                      plant={plant}
                      onWater={handleWater}
                      onLight={handleLight}
                      onCool={handleCool}
                      onToggleAi={handleToggleAi}
                      onOpenAnalytics={setSelectedPlant}
                    />
                  ))}
                </div>
              </section>

              {/* OUTDOOR SECTION */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-850 dark:text-white flex items-center gap-1.5 font-outfit">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Outdoor Soil Bed
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {outdoorPlants.map(plant => (
                    <PlantCard
                      key={plant.id}
                      plant={plant}
                      onWater={handleWater}
                      onLight={handleLight}
                      onCool={handleCool}
                      onToggleAi={handleToggleAi}
                      onOpenAnalytics={setSelectedPlant}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* SIDE PANELS FOR WEATHER AND RECENT LOGS */}
            <div className="lg:col-span-1 space-y-6">
              <WeatherCard weatherInfo={weatherInfo} loading={weatherLoading} error={weatherError} />
              
              <div className="bg-white dark:bg-brand-dark-card rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                <ActivityFeed activities={activities} plants={plants} />
              </div>
            </div>
          </div>
        );

      case 'actuators':
        return (
          <ActuatorControl 
            plants={plants} 
            devices={devices} 
            offlineMode={offlineMode}
            onActionTriggered={(pid, label, type, desc) => {
              addActivityInDb(pid, desc, type);
            }}
            onUpdatePlantMetric={handleUpdatePlantMetric}
          />
        );

      case 'ble':
        return (
          <BLEHub 
            devices={devices}
            offlineMode={offlineMode}
            onToggleOffline={handleToggleOfflineInApp}
            onUpdateDeviceStatus={handleDeviceBleStatus}
            onActionTriggered={(pid, name, type, desc) => {
              addActivityInDb(pid, desc, type);
            }}
          />
        );

      case 'advisory':
        return (
          <AdvisoryPage 
            plants={plants}
            onTriggerAction={(pid, desc) => {
              addActivityInDb(pid, `Prescription applied: ${desc}`, ActivityType.AiRecommendation);
              setPlants(prev => prev.map(p => p.id === pid ? { ...p, health: PlantHealth.Good, aiOptimized: true } : p));
            }}
          />
        );

      case 'settings':
        return (
          <SettingsPage 
            theme={theme}
            toggleTheme={toggleTheme}
            onResetDatabase={handleResetSystemDB}
          />
        );

      case 'guide':
        return (
          <div className="max-w-3xl mx-auto">
            <AppGuide />
          </div>
        );
      
      default:
        return null;
    }
  };

  const navDeck = [
    { id: 'garden', label: 'Garden', icon: <Sprout className="w-5 h-5" /> },
    { id: 'actuators', label: 'Control Room', icon: <Sliders className="w-5 h-5" /> },
    { id: 'ble', label: 'BLE Devices', icon: <Bluetooth className="w-5 h-5" /> },
    { id: 'advisory', label: 'AI Advisory', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'guide', label: 'User Guide', icon: <BookOpen className="w-5 h-5" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-brand-dark-bg text-gray-800 dark:text-gray-200 transition-colors duration-300 pb-20 lg:pb-0 lg:pl-64">
      
      {/* 1. SIDE NAVIGATION BAR (Visible on Large Desktop Screens only) */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-brand-dark-card border-r border-gray-100 dark:border-gray-800 hidden lg:flex flex-col z-40">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
          <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
            <Sprout className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white font-outfit tracking-tight">LeafLink ESP32</h1>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Smart Garden Controller</span>
          </div>
        </div>

        {/* Profile Header Widget */}
        <div className="p-4 mx-4 mt-4 bg-gray-50 dark:bg-brand-dark-bg rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-900">
          <div className="w-10 h-10 rounded-full bg-brand-green/20 text-brand-green font-bold text-sm flex items-center justify-center">
            S
          </div>
          <div className="truncate">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold leading-none">Smart Operator</span>
            <span className="text-sm font-extrabold text-gray-800 dark:text-white truncate">Shyam</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navDeck.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-sm font-bold tracking-tight transition cursor-pointer ${
                currentTab === item.id 
                  ? 'bg-brand-green/10 text-brand-green shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-brand-dark-bg/50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar footer telemetry widget info */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-brand-dark-bg/20 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${offlineMode ? 'bg-amber-400' : 'bg-green-500'}`} />
              Hardware Loop
            </span>
            <span>{offlineMode ? 'Local Cache' : 'Cloud Connected'}</span>
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
            <span>GPIO Active Nodes</span>
            <span>{activeConnectedDevicesCount} Online</span>
          </div>
        </div>
      </aside>

      {/* 2. TOP BANNER IN OFFLINE MODE / SYNC STATS */}
      {isSyncing && (
        <div className="bg-emerald-500 text-white py-2 text-center text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 animate-bounce z-50 relative">
          <RotateCw className="w-4 h-4 animate-spin" />
          <span>SYNCHRONIZING ESP32 STATE REGISTERS TO CLOUD ENDPOINTS (AWS/GOOGLE REST)...</span>
        </div>
      )}

      {offlineMode && !isSyncing && (
        <div className="bg-amber-500 text-white py-1.5 px-4 text-center text-xs font-extrabold flex items-center justify-center gap-2 shadow-inner z-30 sticky top-0">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>LOCAL STANDALONE ACTIVE: Bluetooth GATT controls operational without Wi-Fi synchronization.</span>
        </div>
      )}

      {/* 3. HEAD MOBILE NAVBAR (Sticky on phone frame outputs) */}
      <header className="bg-white/95 dark:bg-brand-dark-card/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 block lg:hidden sticky top-0 z-30 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="w-6 h-6 text-brand-green" />
            <h1 className="text-base font-extrabold text-gray-900 dark:text-white font-outfit">LeafLink ESP32</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${offlineMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {offlineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{currentTab}</span>
          </div>
        </div>
      </header>

      {/* 4. PRIMARY MAIN CANVAS SPACE */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {renderViewContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. BOTTOM TAB MENU BAR (Visible on Mobile/Tablet screens only) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-brand-dark-card/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-3 lg:hidden z-40 shadow-xl pb-safe">
        {navDeck.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition relative cursor-pointer ${
              currentTab === item.id 
                ? 'text-brand-green' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-extrabold mt-1 tracking-tight truncate max-w-[58px]">
              {item.id === 'ble' ? 'BLE Devices' : item.id === 'actuators' ? 'Control Room' : item.label}
            </span>
            {currentTab === item.id && (
              <motion.div 
                layoutId="bottomTabDot"
                className="absolute -top-1 w-1.5 h-1.5 bg-brand-green rounded-full shadow-md"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* 6. ANALYTICS DIAGNOSTIC MODAL */}
      {selectedPlant && (
        <AnalyticsModal 
            plant={selectedPlant} 
            onClose={() => setSelectedPlant(null)}
            addActivity={(plantId, description) => addActivityInDb(plantId, description, ActivityType.AiRecommendation)}
        />
      )}
    </div>
  );
};

export default App;
