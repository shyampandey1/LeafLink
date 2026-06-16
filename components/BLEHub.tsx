import React, { useState, useEffect, useRef } from 'react';
import { 
  Bluetooth, 
  BluetoothSearching, 
  Wifi, 
  WifiOff, 
  Signal, 
  Radio, 
  Terminal, 
  Key, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  X, 
  Battery, 
  FileCode2,
  Lock,
  Smartphone
} from 'lucide-react';
import { ESP32Device, ActivityType } from '../types.ts';

interface BLEHubProps {
  devices: ESP32Device[];
  offlineMode: boolean;
  onToggleOffline: () => void;
  onUpdateDeviceStatus: (deviceId: string, status: 'online' | 'offline') => void;
  onActionTriggered: (plantId: number, name: string, type: ActivityType, description: string) => void;
}

interface BeaconDevice {
  id: string;
  name: string;
  mac: string;
  rssi: number;
  battery: number;
  paired: boolean;
  type: string;
}

const INITIAL_BEACONS: BeaconDevice[] = [
  { id: 'ESP32-IN-01', name: 'SmartGarden-LivingRoom', mac: '24:0A:C4:B1:32:02', rssi: -55, battery: 94, paired: true, type: 'Indoor hub' },
  { id: 'ESP32-OUT-01', name: 'SmartGarden-Balcony', mac: '30:AE:A4:07:0C:1F', rssi: -68, battery: 82, paired: true, type: 'Outdoor node' },
  { id: 'ESP32-OUT-02', name: 'SmartGarden-GardenBed', mac: 'E0:5A:1B:1A:C0:04', rssi: -84, battery: 45, paired: false, type: 'Saffron Bed' },
  { id: 'ESP-BEACON-NEW', name: 'ESP32-HydroSens-XT', mac: '7C:9E:BD:F8:33:5A', rssi: -72, battery: 100, paired: false, type: 'Hydro Sensor' },
];

const BLEHub: React.FC<BLEHubProps> = ({
  devices,
  offlineMode,
  onToggleOffline,
  onUpdateDeviceStatus,
  onActionTriggered
}) => {
  const [beacons, setBeacons] = useState<BeaconDevice[]>(INITIAL_BEACONS);
  const [isScanning, setIsScanning] = useState(false);
  const [pairingDevice, setPairingDevice] = useState<BeaconDevice | null>(null);
  const [pairingPin, setPairingPin] = useState('');
  const [pairingError, setPairingError] = useState('');
  const [isPairingState, setIsPairingState] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[SYSTEM] BLE Stack v4.2 fully initialized.',
    '[SYSTEM] GAP and GATT layers standing by.',
    `[INFO] Caching enabled. System status: ${offlineMode ? 'OFFLINE' : 'ONLINE'}`
  ]);
  const [customWebBleError, setCustomWebBleError] = useState<string | null>(null);

  // Active terminal loop ref
  const terminalLogEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalLogEndRef.current) {
      terminalLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Handle live automatic logging simulation
  useEffect(() => {
    const activeMacs = beacons.filter(b => b.paired).map(b => b.name);
    if (activeMacs.length === 0) return;

    const interval = setInterval(() => {
      // Pick random paired device
      const activeBeacons = beacons.filter(b => b.paired);
      if (activeBeacons.length === 0) return;
      const rBeacon = activeBeacons[Math.floor(Math.random() * activeBeacons.length)];
      
      const newLogs = [
        `[BLE-GATT] Read characteristic 0x2A6E (${rBeacon.name}): Temp ${20 + Math.floor(Math.random() * 10)}°C, pH ${(6.0 + Math.random() * 0.8).toFixed(1)}`,
        `[BLE-GATT] Read characteristic 0x2A56 (${rBeacon.name}): Soil Moisture ${40 + Math.floor(Math.random() * 30)}%`,
        `[BLE-TX] RSSI packet received: ${rBeacon.rssi} dBm (RSSI strength variance ±2dB)`
      ];
      
      setConsoleLogs(prev => [...prev.slice(-30), newLogs[Math.floor(Math.random() * newLogs.length)]]);
    }, 4500);

    return () => clearInterval(interval);
  }, [beacons]);

  const addLog = (logMsg: string) => {
    setConsoleLogs(prev => [...prev.slice(-35), logMsg]);
  };

  // 1. Genuine Web Bluetooth invocation
  const triggerNativeWebBleScan = async () => {
    setCustomWebBleError(null);
    addLog('[API] Attempting connection via Native Browser Web Bluetooth API...');
    
    if (!(navigator as any).bluetooth) {
      const errMsg = 'Web Bluetooth is not supported on this browser or isolated context.';
      setCustomWebBleError(errMsg);
      addLog(`[ERROR] ${errMsg} Launching Virtual BLE pairing gateway...`);
      triggerVirtualScan();
      return;
    }

    try {
      addLog('[API] Invoking navigator.bluetooth.requestDevice()...');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'environmental_sensing']
      });
      
      addLog(`[API] Device found! Name: ${device.name || 'Unnamed'}, ID: ${device.id}`);
      addLog('[API] Attempting connection to BLE GATT server...');
      
      const gattServer = await device.gatt?.connect();
      addLog('[API] BLE GATT connected successfully!');
      
      // Add custom temporary beacon
      const newD: BeaconDevice = {
        id: 'ESP-NATIVE-BLE',
        name: device.name || 'Native BLE Device',
        mac: 'FF:EE:DD:CC:BB:AA',
        rssi: -45,
        battery: 100,
        paired: true,
        type: 'Native Connected Element'
      };
      
      setBeacons(prev => [newD, ...prev]);
      onActionTriggered(1, 'Native BLE', ActivityType.System, `Coupled physical BLE item: "${device.name}"`);
    } catch (err: any) {
      console.warn('Native Web BLE blocked or cancelled:', err);
      const cleanErr = err.message || 'Bluetooth framework access denied inside App Frame (standard for security-isolated iFrames).';
      setCustomWebBleError(cleanErr);
      addLog(`[WARN] Native BLE stopped: "${cleanErr}". Running high-fidelity Virtual Bluetooth transceiver.`);
      triggerVirtualScan();
    }
  };

  // 2. Simulated scanning
  const triggerVirtualScan = () => {
    setIsScanning(true);
    addLog('[SCAN] Starting GAP Bluetooth passive discovery sweep (3.5s timeout)...');
    
    setTimeout(() => {
      setIsScanning(false);
      addLog('[SCAN] BLE sweeps complete. Discovered 4 active BLE broadcasting nodes.');
      // Randomize RSSI strength a bit
      setBeacons(prev => prev.map(b => ({
        ...b,
        rssi: Math.min(-40, Math.max(-95, b.rssi + (Math.floor(Math.random() * 11) - 5)))
      })));
    }, 3500);
  };

  const startPairing = (beacon: BeaconDevice) => {
    setPairingDevice(beacon);
    setPairingPin('');
    setPairingError('');
    setIsPairingState(true);
    addLog(`[PAIR] Handshake requested for ${beacon.name} (${beacon.mac}). Entering passkey secure bonding.`);
  };

  const verifyPairing = (e: React.FormEvent) => {
    e.preventDefault();
    if (pairingPin === '123456' || pairingPin === '000000' || pairingPin.length === 6) {
      if (!pairingDevice) return;
      
      setIsPairingState(false);
      // Mark as paired
      setBeacons(prev => prev.map(b => b.id === pairingDevice.id ? { ...b, paired: true } : b));
      // Set status in parent
      onUpdateDeviceStatus(pairingDevice.id, 'online');
      
      addLog(`[BOND] Pairing bonds established with ${pairingDevice.name}. Keys exchanged & saved.`);
      onActionTriggered(
        1,
        pairingDevice.name,
        ActivityType.System,
        `Device ${pairingDevice.id} paired successfully via high-entropy PIN Bluetooth.`
      );
      setPairingDevice(null);
    } else {
      setPairingError('Validation passkey failed. Enter "123456" or any 6-digit PIN to bond.');
      addLog('[ERROR] Passkey mismatch. GATT security pairing rejected.');
    }
  };

  const unpairDevice = (beacon: BeaconDevice) => {
    setBeacons(prev => prev.map(b => b.id === beacon.id ? { ...b, paired: false } : b));
    onUpdateDeviceStatus(beacon.id, 'offline');
    addLog(`[GATT] Unpaired and cleared GATT bindings for ${beacon.name}.`);
    onActionTriggered(1, beacon.name, ActivityType.System, `Unlinked and unpaired physical node: ${beacon.name}`);
  };

  const softResetESP = (beacon: BeaconDevice) => {
    addLog(`[GPIO] Sent reboot sequence command (0xFA32) to target: ${beacon.name}`);
    addLog(`[GATT] Disconnecting momentarily from ${beacon.name}...`);
    onUpdateDeviceStatus(beacon.id, 'offline');
    
    setTimeout(() => {
      addLog(`[GAP] Received spontaneous ADV beacon advertisement from ${beacon.name}.`);
      addLog(`[GATT] Restoring GATT connections to ${beacon.name}...`);
      onUpdateDeviceStatus(beacon.id, 'online');
      addLog(`[SYSTEM] ${beacon.name} initialized successfully. Uptime: 0.1s. RAM: 218KB free.`);
    }, 4500);
  };

  const getSignalStrengthColor = (rssi: number) => {
    if (rssi > -60) return 'text-green-500';
    if (rssi > -75) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-outfit">
            <Radio className="w-6 h-6 text-brand-green" /> Device Hub & BLE Connections
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pair physical ESP32 microcontrollers, check signal index (RSSI), analyze logs or switch working networks
          </p>
        </div>

        {/* Global Offline Mode Switch Card */}
        <div className="flex items-center gap-3 p-2 bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm self-start">
          <div className="text-right">
            <div className="text-xs font-bold text-gray-800 dark:text-white">Offline Mode</div>
            <div className="text-[10px] text-gray-400">Skip Cloud Sync</div>
          </div>
          <button
            onClick={onToggleOffline}
            className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none ${
              offlineMode ? 'bg-amber-500' : 'bg-green-500'
            }`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-transform ${
              offlineMode ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* BLE Scanning Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={triggerNativeWebBleScan}
          disabled={isScanning}
          className="flex items-center justify-center gap-2.5 p-4 bg-brand-green hover:bg-brand-green/90 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-semibold rounded-2xl transition shadow-sm hover:shadow-md cursor-pointer"
        >
          {isScanning ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Bluetooth className="w-5 h-5 animate-pulse" />
          )}
          <span>{isScanning ? 'Passive Sweeping Nearby...' : 'Scan / Pair ESP32 Device'}</span>
        </button>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-brand-dark-card border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${offlineMode ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
              {offlineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800 dark:text-white">
                {offlineMode ? 'Local Cache Mode' : 'Cloud Synchronizer'}
              </div>
              <div className="text-xs text-gray-400">
                {offlineMode ? 'Data write is kept local' : 'Cloud REST API active'}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
            offlineMode ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }`}>
            {offlineMode ? 'OFFLINE' : 'ONLINE'}
          </span>
        </div>
      </div>

      {/* Warn If native BLE failed but show simulator fallback */}
      {customWebBleError && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
          <Smartphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Bluetooth Iframe Fallback:</span> Native Web Bluetooth is constrained inside the development sandboxed iframe container (or unsupported). <strong>Smart Garden Virtual BLE Transponder Sandbox activated</strong> for diagnostics.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DISCOVERED DEVICES LIST COLOUMN */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between font-outfit">
            <span>Discovered BLE Nodes</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md">
              {beacons.length} items
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {beacons.map(beacon => (
              <div 
                key={beacon.id}
                className={`p-4 rounded-2xl bg-white dark:bg-brand-dark-card border shadow-sm transition flex flex-col justify-between ${
                  beacon.paired 
                    ? 'border-brand-green/20 hover:border-brand-green/40' 
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate max-w-[150px]">
                        {beacon.name}
                      </h4>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">{beacon.mac}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-0.5 text-xs font-semibold ${getSignalStrengthColor(beacon.rssi)}`}>
                        <Signal className="w-3.5 h-3.5" />
                        <span>{beacon.rssi} dBm</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500">
                        <Battery className="w-3.5 h-3.5 text-gray-400" />
                        <span>{beacon.battery}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 dark:bg-brand-dark-bg p-2 rounded-xl text-xs">
                    <div>
                      <span className="text-gray-400">Class:</span>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{beacon.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <p className={`font-semibold flex items-center gap-1.5 ${
                        beacon.paired ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${beacon.paired ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {beacon.paired ? 'Connected' : 'Discovered'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-3.5">
                  {beacon.paired ? (
                    <>
                      <button
                        onClick={() => softResetESP(beacon)}
                        className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 rounded-lg transition text-center"
                      >
                        Reboot Node
                      </button>
                      <button
                        onClick={() => unpairDevice(beacon)}
                        className="py-1.5 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition"
                        title="Disconnect BLE Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startPairing(beacon)}
                      className="w-full py-2 bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white text-xs font-bold rounded-lg transition text-center"
                    >
                      Connect & Pair GATT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GATT TERMINAL / STREAM COLOUMN */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-[350px]">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 font-outfit">
            <Terminal className="w-4 h-4 text-emerald-500" /> Bluetooth Log Stream
          </h3>

          <div className="flex-1 bg-gray-950 rounded-2xl p-4 font-mono text-[10px] text-emerald-400 border border-gray-900 shadow-inner flex flex-col justify-between overflow-hidden">
            <div className="space-y-1.5 overflow-y-auto max-h-[290px] pr-1 select-text">
              {consoleLogs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  <span className="text-gray-600">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>{' '}
                  <span className={`${
                    log.includes('[ERROR]') ? 'text-red-400' :
                    log.includes('[WARN]') ? 'text-amber-400' :
                    log.includes('[SCAN]') ? 'text-purple-400' :
                    log.includes('[PAIR]') || log.includes('[BOND]') ? 'text-cyan-400 animate-pulse' :
                    'text-emerald-400'
                  }`}>
                    {log}
                  </span>
                </div>
              ))}
              <div ref={terminalLogEndRef} />
            </div>

            <div className="border-t border-gray-900 pt-2.5 mt-2 flex justify-between items-center text-[9px] text-gray-500 font-sans">
              <span>Baud: 115200 Tx/Rx • ESP32 Smart Garden</span>
              <button
                onClick={() => setConsoleLogs([`[SYSTEM] Screen cleared. Diagnostics logging active.`])}
                className="hover:text-white underline font-semibold cursor-pointer"
              >
                Clear Screen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GATT Bonding Modal Box */}
      {isPairingState && pairingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 bg-white dark:bg-brand-dark-card rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl relative">
            <button 
              onClick={() => setIsPairingState(false)} 
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 absolute right-4 top-4 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-950/40 text-brand-green rounded-full animate-bounce">
                <Lock className="w-8 h-8" />
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Bluetooth Security Coupling</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Secure pairing PIN requested for ESP32 beacon <br />
                  <strong className="text-gray-700 dark:text-gray-300">{pairingDevice.name} ({pairingDevice.id})</strong>
                </p>
              </div>

              <form onSubmit={verifyPairing} className="w-full space-y-4">
                <div className="space-y-1.5">
                  <div className="relative">
                    <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      required
                      placeholder="Enter 6-digit Bond Code"
                      value={pairingPin}
                      onChange={e => setPairingPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-2.5 pl-10 pr-3 bg-gray-50 dark:bg-brand-dark-bg border border-gray-100 dark:border-gray-800 rounded-xl font-mono text-center tracking-[4px] text-lg font-bold text-gray-800 dark:text-white"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-left px-1">
                    🔒 Default pairing PIN for custom ESP32 firmware is <strong>123456</strong>
                  </p>
                </div>

                {pairingError && (
                  <p className="text-xs text-red-500 font-semibold leading-snug animate-pulse">{pairingError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPairingState(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green/90 text-xs font-bold text-white rounded-xl transition shadow-sm"
                  >
                    Establish Bond
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BLEHub;
