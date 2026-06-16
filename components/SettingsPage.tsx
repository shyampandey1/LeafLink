import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Cpu, 
  Wifi, 
  RefreshCw, 
  Database, 
  Moon, 
  Sun, 
  Info, 
  FolderDown, 
  Wrench, 
  CheckCircle,
  FileCode2,
  Trash2,
  ShieldCheck,
  Code
} from 'lucide-react';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onResetDatabase: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  theme,
  toggleTheme,
  onResetDatabase
}) => {
  // Wifi setup inputs
  const [ssid, setSsid] = useState('Home_Mesh_2G');
  const [password, setPassword] = useState('MySmartGardenSecret');
  const [wifiStatus, setWifiStatus] = useState<'idle' | 'linking' | 'linked'>('idle');
  const [wifiLog, setWifiLog] = useState<string[]>([]);

  // Firmware options
  const [selectedFirmware, setSelectedFirmware] = useState('v1.4.3-stable');
  const [firmwareLog, setFirmwareLog] = useState<string[]>([]);
  const [flashProgress, setFlashProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // File drop selectors
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deploying WiFi credentials to ESP32
  const handleDeployWifi = (e: React.FormEvent) => {
    e.preventDefault();
    setWifiStatus('linking');
    setWifiLog(['[UART] Opening serial link at 115200 baud...']);

    let stepIdx = 0;
    const steps = [
      `[UART] Transmitting WiFi credentials frame to target...`,
      `[ESP32] SSID payload parsed successfully: "${ssid}"`,
      `[ESP32] Instantiating WiFi station link (WiFi.begin())...`,
      `[ESP32] Connected! Received DHCP Assigned IP: 192.168.1.185`,
      `[UART] WiFi config successfully committed to ESP32 flash memory!`
    ];

    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setWifiLog(prev => [...prev, steps[stepIdx]]);
        stepIdx++;
      } else {
        clearInterval(interval);
        setWifiStatus('linked');
      }
    }, 700);
  };

  // Drag & Drop event wrappers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.bin')) {
        setDroppedFile(file);
        setFirmwareLog(prev => [...prev, `[FILE] Loaded local firmware binary asset: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`]);
      } else {
        alert("Incorrect architecture. Please upload only (.bin) ESP32 boot firmware files.");
      }
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.bin')) {
        setDroppedFile(file);
        setFirmwareLog(prev => [...prev, `[FILE] Loaded local firmware binary asset: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`]);
      } else {
        alert("Incorrect architecture. Please upload only (.bin) ESP32 boot firmware files.");
      }
    }
  };

  // Simulated firmware flash loader
  const handleOverTheAirFlash = () => {
    setIsFlashing(true);
    setFlashProgress(0);
    setFirmwareLog(['[OTA] Starting OTA partition erase blocks...']);

    const progressSteps = [
      { prg: 10, log: '[OTA] Sector partition erased. Partition: app0 (1.8MB)' },
      { prg: 25, log: '[OTA] Streaming hex chunk headers... (AES-256 decrypted on fly)' },
      { prg: 50, log: '[OTA] Flashing chunk block array 0x0A00 to 0x0FFF... [50%]' },
      { prg: 75, log: '[OTA] Flashing chunk block array 0x1F00 to 0x27FF... [75%]' },
      { prg: 90, log: '[OTA] Bootloader integrity validation checksum (SHA-256) matching.' },
      { prg: 100, log: '[SYSTEM] Flashed successfully! Software reboot triggered.' }
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      setFlashProgress(p => {
        const nextPrg = p + 4;
        
        // Feed in logs at correct points
        if (currentIdx < progressSteps.length && nextPrg >= progressSteps[currentIdx].prg) {
          setFirmwareLog(prev => [...prev, progressSteps[currentIdx].log]);
          currentIdx++;
        }

        if (nextPrg >= 100) {
          clearInterval(interval);
          setIsFlashing(false);
          setDroppedFile(null);
          return 100;
        }
        return nextPrg;
      });
    }, 150);
  };

  const handleClearMemory = () => {
    if (window.confirm("Restore factory defaults? This clears all simulated logs, custom device pairing configurations, and returns plant parameters to system seed MOCK data.")) {
      onResetDatabase();
      alert("System restored successfully.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-outfit">
          <Settings className="w-6 h-6 text-brand-green" /> Device Systems Deck
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Modify backend WiFi targets, flash firmware modules, wipe local databases, and coordinate color palettes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCK 1: WIFI OTA DEPLOYMENT */}
        <div className="p-5 rounded-3xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">ESP32 WiFi Node Credentials</h3>
              <p className="text-[11px] text-gray-400">Deploy wireless SSID and password triggers to paired nodes</p>
            </div>
          </div>

          <form onSubmit={handleDeployWifi} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">Router SSID Network</label>
                <input
                  type="text"
                  required
                  value={ssid}
                  onChange={e => setSsid(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-gray-50 dark:bg-brand-dark-bg border border-gray-100 dark:border-gray-800 rounded-xl text-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">WiFi WPA/WPA2 Key</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-gray-50 dark:bg-brand-dark-bg border border-gray-100 dark:border-gray-800 rounded-xl text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={wifiStatus === 'linking'}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {wifiStatus === 'linking' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              <span>{wifiStatus === 'linking' ? 'Deploying Access-Point...' : 'Deploy WiFi Coordinates'}</span>
            </button>
          </form>

          {/* UART linking console logger output */}
          {wifiLog.length > 0 && (
            <div className="p-3 bg-gray-950 rounded-2xl border border-gray-900 shadow-inner font-mono text-[9px] text-amber-500 max-h-[140px] overflow-y-auto space-y-1">
              {wifiLog.map((log, i) => (
                <div key={i} className="leading-relaxed">{log}</div>
              ))}
              {wifiStatus === 'linked' && (
                <div className="text-green-500 font-bold flex items-center gap-1.5 mt-1 animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5" /> WIFI_COORDINATES_SUCCESS_OK
                </div>
              )}
            </div>
          )}
        </div>

        {/* BLOCK 2: FIRMWARE FLASH LOADER */}
        <div className="p-5 rounded-3xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">OTA Firmware Overhaul Center</h3>
              <p className="text-[11px] text-gray-400">Flash direct ESP32 core image boots from local compiled bytes</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold">Targets Release Image</span>
              <select
                disabled={isFlashing}
                value={selectedFirmware}
                onChange={e => setSelectedFirmware(e.target.value)}
                className="py-1.5 px-2 bg-gray-50 dark:bg-brand-dark-bg border border-gray-100 dark:border-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-white"
              >
                <option value="v1.4.3-stable">v1.4.3-stable [SEC_PATCH]</option>
                <option value="v1.5.0-beta">v1.5.0-beta [GROWTH_FIX]</option>
                <option value="v1.3.1-legacy">v1.3.1-legacy [C_STABLE]</option>
              </select>
            </div>

            {/* Drag & Drop File Flasher container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
                dragActive 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/15' 
                  : droppedFile 
                    ? 'border-green-500 bg-green-50/20 dark:bg-green-950/5' 
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".bin"
                onChange={handleManualFileSelect}
                className="hidden"
                disabled={isFlashing}
              />
              
              <div className="flex flex-col items-center space-y-1.5 text-xs">
                <FolderDown className={`w-7 h-7 ${droppedFile ? 'text-green-500' : 'text-gray-400'}`} />
                {droppedFile ? (
                  <div>
                    <p className="font-bold text-green-600 dark:text-green-400">Loaded: {droppedFile.name}</p>
                    <p className="text-[10px] text-gray-400">Ready to flash partition block.</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-gray-600 dark:text-gray-300">Drag & Drop ESP32 binary or click</p>
                    <p className="text-[10px] text-gray-400">Accepts compiled (.bin) bootloader files</p>
                  </div>
                )}
              </div>
            </div>

            {/* Initiate OTA Flashing */}
            <button
              onClick={handleOverTheAirFlash}
              disabled={isFlashing || (!droppedFile && !selectedFirmware)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-855 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isFlashing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{isFlashing ? 'Flashing firmware chunks...' : 'Launch Flash System Configuration'}</span>
            </button>
          </div>

          {/* Flash progression micro-meter */}
          {flashProgress > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-purple-600">
                <span>Flashing Sequence Progressive Meter</span>
                <span>{flashProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-brand-dark-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-100"
                  style={{ width: `${flashProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Firmware log output */}
          {firmwareLog.length > 0 && (
            <div className="p-3 bg-gray-950 rounded-2xl border border-gray-900 shadow-inner font-mono text-[9px] text-purple-400 max-h-[140px] overflow-y-auto space-y-1">
              {firmwareLog.map((log, i) => (
                <div key={i} className="leading-relaxed">{log}</div>
              ))}
              {flashProgress === 100 && (
                <div className="text-green-500 font-bold flex items-center gap-1.5 mt-1 animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5" /> BOOT_SEQUENCE_SUCCESS_REBOOT_COMPLETED
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BLOCK 3: UTILITY MAINTENANCE AND VISUAL OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Memory deck */}
        <div className="p-5 rounded-3xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="p-2 bg-red-100 dark:bg-red-950/30 text-red-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Hard reset & Memory Cache</h3>
              <p className="text-[11px] text-gray-400">Restore factory values, wipe SQLite/local states</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Performing a reset restores the simulation baseline, clearing all user Bluetooth connections, SSID variables, custom watering events, and OTA configurations.
          </p>

          <button
            onClick={handleClearMemory}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Reset Local State Cache
          </button>
        </div>

        {/* Visual deck */}
        <div className="p-5 rounded-3xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">General Appearance Settings</h3>
              <p className="text-[11px] text-gray-400">Adjust the application visual rendering theme</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Client Theme Environment</span>
            
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-brand-dark-bg text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 text-emerald-500" /> Toggle Dark Mode
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500" /> Toggle Light Mode
                </>
              )}
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-[10px] text-gray-400 flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span>Firmware OTA validation engine active. Security boot configuration managed in sandbox partition.</span>
          </div>
        </div>
      </div>

      {/* METADATA SYSTEM CARD */}
      <div className="p-5 rounded-3xl bg-gray-50 dark:bg-brand-dark-bg border border-gray-200 dark:border-gray-900/40 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-gray-850 dark:text-white">Smart Garden Native Deck Console v2.4.2-Release</h4>
          <p className="text-gray-500 leading-relaxed text-[11px]">
            Designed for local-first connection protocols, combining offline capabilities, native BLE GATT wrappers, custom actuator triggers, ESP32 boot firmware flashing over-the-air, and artificial environmental recommendations through live Google Gemini pipelines.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
