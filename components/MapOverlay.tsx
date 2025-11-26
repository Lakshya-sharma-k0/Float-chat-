import React, { useEffect, useState, useMemo, useRef } from 'react';
import { X, Globe, Wind, Thermometer, Activity, RotateCcw, Target, ChevronDown, Layers, Radio, ArrowDownCircle, Wifi, BarChart3, ArrowLeft, Download, Navigation, AlertTriangle, Shield, Waves, ArrowUpRight, MapPin, Anchor, Box, Map, CloudRain, Sun, CloudLightning, Cloud, Eye } from 'lucide-react';
import createGlobe from 'cobe';

interface MapOverlayProps {
  onClose: () => void;
  initialMode?: 'exploration' | 'routing';
}

interface FloatNode {
  id: string;
  top: number;
  left: number;
  temp: string;
  depth: string;
  lat: string;
  lng: string;
  region: string;
  status: 'active' | 'transmitting' | 'diving';
}

interface HazardZone {
  id: string;
  name: string;
  top: number;
  left: number;
  radius: number; // in percentage
  intensity: 'moderate' | 'severe' | 'extreme';
  type: 'storm' | 'current' | 'ice';
}

interface Port {
  name: string;
  country: string;
  x: number;
  y: number;
  region: string;
}

interface WeatherData {
  windSpeed: string; // knots
  waveHeight: string; // meters
  precipitation: string; // % chance
  visibility: string; // nm (nautical miles)
  condition: 'Clear' | 'Cloudy' | 'Stormy' | 'Rain';
  pressure: string; // hPa
}

// Simulated Major Maritime Hubs
const PORTS: Port[] = [
  { name: 'New York', country: 'USA', x: 28, y: 32, region: 'North Atlantic' },
  { name: 'London', country: 'UK', x: 46, y: 25, region: 'North Atlantic' },
  { name: 'Reykjavik', country: 'Iceland', x: 40, y: 15, region: 'North Atlantic' },
  { name: 'Tokyo', country: 'Japan', x: 85, y: 35, region: 'Pacific' },
  { name: 'Shanghai', country: 'China', x: 80, y: 38, region: 'Pacific' },
  { name: 'Singapore', country: 'Singapore', x: 72, y: 55, region: 'Indian Ocean' },
  { name: 'Sydney', country: 'Australia', x: 88, y: 75, region: 'Pacific' },
  { name: 'Cape Town', country: 'South Africa', x: 52, y: 75, region: 'South Atlantic' },
  { name: 'Rio de Janeiro', country: 'Brazil', x: 32, y: 65, region: 'South Atlantic' },
  { name: 'Mumbai', country: 'India', x: 62, y: 42, region: 'Indian Ocean' },
  { name: 'Los Angeles', country: 'USA', x: 15, y: 38, region: 'Pacific' },
  { name: 'Honolulu', country: 'USA', x: 5, y: 45, region: 'Pacific' },
];

type RegionType = 'All' | 'North Atlantic' | 'Pacific' | 'Indian Ocean' | 'Southern Ocean';

const REGION_CONFIG: Record<RegionType, { x: number; y: number; scale: number }> = {
  'All': { x: 0, y: 0, scale: 1 },
  'North Atlantic': { x: 15, y: 25, scale: 2.2 },
  'Pacific': { x: -25, y: 5, scale: 2 },
  'Indian Ocean': { x: -10, y: -10, scale: 2.4 },
  'Southern Ocean': { x: 0, y: -35, scale: 2.4 },
};

export const MapOverlay: React.FC<MapOverlayProps> = ({ onClose, initialMode = 'exploration' }) => {
  const [mode, setMode] = useState<'exploration' | 'routing'>(initialMode);
  const [viewType, setViewType] = useState<'2D' | '3D'>('2D');
  const [activeNodes, setActiveNodes] = useState(3824);
  const [floats, setFloats] = useState<FloatNode[]>([]);
  const [mapView, setMapView] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionType>('All');
  const [historyFloat, setHistoryFloat] = useState<FloatNode | null>(null);
  const [regionalWeather, setRegionalWeather] = useState<WeatherData | null>(null);
  
  // Routing State
  const [routePoints, setRoutePoints] = useState<{start: {x: number, y: number, label?: string} | null, end: {x: number, y: number, label?: string} | null}>({ start: null, end: null });
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const [selectedPortStart, setSelectedPortStart] = useState<string>('');
  const [selectedPortEnd, setSelectedPortEnd] = useState<string>('');

  // Globe Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Hazards with names
  useEffect(() => {
    const hazardNames = ['Cyclone Iota', 'Typhoon Mawar', 'Atlantic Swell', 'Gulf Current', 'Vortex Beta', 'Polar Front'];
    const newHazards: HazardZone[] = Array.from({ length: 6 }).map((_, i) => ({
      id: `H-${i}`,
      name: hazardNames[i],
      top: Math.random() * 60 + 20,
      left: Math.random() * 80 + 10,
      radius: Math.random() * 10 + 5,
      intensity: Math.random() > 0.6 ? 'severe' : 'moderate',
      type: Math.random() > 0.5 ? 'storm' : 'current'
    }));
    setHazards(newHazards);
  }, []);

  // Generate floats and start simulation loop
  useEffect(() => {
    const statuses: ('active' | 'transmitting' | 'diving')[] = ['active', 'transmitting', 'diving'];
    
    const generateRegionFloats = (regionName: string, count: number, bounds: {tMin: number, tMax: number, lMin: number, lMax: number}) => {
      return Array.from({ length: count }).map((_, i) => {
        const top = Math.random() * (bounds.tMax - bounds.tMin) + bounds.tMin;
        const left = Math.random() * (bounds.lMax - bounds.lMin) + bounds.lMin;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          id: `ARGO-${regionName.substring(0,1).toUpperCase()}${Math.floor(Math.random()*1000)}`,
          top,
          left,
          temp: (Math.random() * 25 + 2).toFixed(1),
          depth: (Math.random() * 2000 + 50).toFixed(0),
          lat: ((top - 50) * -3.6).toFixed(2), 
          lng: ((left - 50) * 7.2).toFixed(2),
          region: regionName,
          status: status
        } as FloatNode;
      });
    };

    const atlantic = generateRegionFloats('North Atlantic', 25, { tMin: 15, tMax: 45, lMin: 25, lMax: 50 });
    const pacific = generateRegionFloats('Pacific', 35, { tMin: 20, tMax: 80, lMin: 60, lMax: 90 });
    const indian = generateRegionFloats('Indian Ocean', 20, { tMin: 50, tMax: 75, lMin: 50, lMax: 70 });
    const southern = generateRegionFloats('Southern Ocean', 15, { tMin: 80, tMax: 95, lMin: 20, lMax: 80 });

    setFloats([...atlantic, ...pacific, ...indian, ...southern]);

    // Data Simulation Interval
    const interval = setInterval(() => {
      // Update global active count for liveness
      setActiveNodes(prev => prev + (Math.random() > 0.5 ? 1 : -1));

      // Update individual float telemetry
      setFloats(currentFloats => currentFloats.map(f => {
          // Only update ~20% of floats per tick to preserve performance and visual stability
          if (Math.random() > 0.2) return f;

          // Simulate minor sensor drift
          const currentTemp = parseFloat(f.temp);
          const tempChange = (Math.random() - 0.5) * 0.3; // +/- 0.15 deg variation
          
          const currentDepth = parseFloat(f.depth);
          const depthChange = (Math.random() - 0.5) * 5; // +/- 2.5m variation

          // Rare chance to change operational status
          let newStatus = f.status;
          if (Math.random() < 0.02) { // 2% chance
             newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          }

          return {
              ...f,
              temp: Math.max(0, currentTemp + tempChange).toFixed(1),
              depth: Math.max(0, currentDepth + depthChange).toFixed(0),
              status: newStatus
          };
      }));

    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate Weather Data based on Region
  useEffect(() => {
    const generateRegionalWeather = (region: RegionType): WeatherData => {
        const baseWind = region === 'Southern Ocean' ? 35 : (region === 'North Atlantic' ? 25 : 15);
        const baseWave = region === 'Southern Ocean' ? 4.5 : (region === 'North Atlantic' ? 2.8 : 1.2);
        
        // Random variation
        const wind = (baseWind + (Math.random() * 10 - 5)).toFixed(0);
        const wave = (baseWave + (Math.random() * 1.5 - 0.5)).toFixed(1);
        
        let condition: WeatherData['condition'] = 'Clear';
        let precip = '0';
        let visibility = '10+';
        let pressure = '1015';

        if (region === 'Southern Ocean' || region === 'North Atlantic') {
             const rand = Math.random();
             if (rand > 0.6) { condition = 'Stormy'; precip = '85'; visibility = '2'; pressure = '985'; }
             else if (rand > 0.3) { condition = 'Rain'; precip = '60'; visibility = '5'; pressure = '1002'; }
             else { condition = 'Cloudy'; precip = '20'; visibility = '8'; pressure = '1010'; }
        } else {
             const rand = Math.random();
             if (rand > 0.8) { condition = 'Rain'; precip = '40'; visibility = '6'; pressure = '1008'; }
             else if (rand > 0.5) { condition = 'Cloudy'; precip = '10'; visibility = '9'; pressure = '1012'; }
        }

        return {
            windSpeed: wind,
            waveHeight: wave,
            precipitation: precip,
            visibility,
            condition,
            pressure
        };
    };

    setRegionalWeather(generateRegionalWeather(selectedRegion));

    // Refresh weather every 10s
    const weatherInterval = setInterval(() => {
        setRegionalWeather(generateRegionalWeather(selectedRegion));
    }, 10000);

    return () => clearInterval(weatherInterval);
  }, [selectedRegion]);

  // Globe 3D Initialization
  useEffect(() => {
    let phi = 0;

    if (viewType === '3D' && canvasRef.current && floats.length > 0) {
        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: canvasRef.current.clientWidth * 2,
            height: canvasRef.current.clientHeight * 2,
            phi: 0,
            theta: 0,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.05, 0.05, 0.08],
            markerColor: [0.1, 0.8, 1],
            glowColor: [0.2, 0.2, 0.6],
            opacity: 0.8,
            markers: floats.map(f => ({ location: [parseFloat(f.lat), parseFloat(f.lng)], size: 0.04 })),
            onRender: (state) => {
                // Auto rotate slowly
                state.phi = phi;
                phi += 0.002;
            },
        });

        return () => {
            globe.destroy();
        };
    }
  }, [viewType, floats]);

  const regionStats = useMemo(() => {
    const stats: Record<string, { count: number; avgTemp: string }> = {};
    const regions = Object.keys(REGION_CONFIG) as RegionType[];

    regions.forEach(region => {
      const regionFloats = region === 'All' 
        ? floats 
        : floats.filter(f => f.region === region);
      
      const count = regionFloats.length;
      const totalTemp = regionFloats.reduce((sum, f) => sum + parseFloat(f.temp), 0);
      const avgTemp = count > 0 ? (totalTemp / count).toFixed(1) : '0.0';

      stats[region] = { count, avgTemp };
    });

    return stats;
  }, [floats]);

  const handleRegionChange = (region: RegionType) => {
    setSelectedRegion(region);
    setSelectedId(null);
    setHistoryFloat(null);
    const view = REGION_CONFIG[region];
    setMapView(view);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (viewType === '3D') return; 
    if (mode === 'exploration') {
        resetView(e);
    } else {
        // Custom Point Logic
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        if (!routePoints.start) {
            setRoutePoints({ ...routePoints, start: { x, y, label: 'Custom Origin' } });
            setSelectedPortStart('Custom');
        } else if (!routePoints.end) {
            setRoutePoints({ ...routePoints, end: { x, y, label: 'Custom Dest' } });
            setSelectedPortEnd('Custom');
        }
    }
  };

  const handlePortSelect = (type: 'start' | 'end', portName: string) => {
    const port = PORTS.find(p => p.name === portName);
    if (type === 'start') {
        setSelectedPortStart(portName);
        if (port) setRoutePoints(prev => ({ ...prev, start: { x: port.x, y: port.y, label: port.name } }));
        else if (portName === '') setRoutePoints(prev => ({ ...prev, start: null }));
    } else {
        setSelectedPortEnd(portName);
        if (port) setRoutePoints(prev => ({ ...prev, end: { x: port.x, y: port.y, label: port.name } }));
        else if (portName === '') setRoutePoints(prev => ({ ...prev, end: null }));
    }
  };

  const handleFloatClick = (e: React.MouseEvent, float: FloatNode) => {
    if (mode === 'routing' || viewType === '3D') return;
    e.stopPropagation();
    setSelectedId(float.id);
    setHistoryFloat(null); 
    setMapView({
      x: 50 - float.left,
      y: 50 - float.top,
      scale: 3 
    });
  };

  const handleViewHistory = (e: React.MouseEvent, float: FloatNode) => {
    e.stopPropagation();
    setHistoryFloat(float);
  };

  const resetView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mode === 'exploration') {
        handleRegionChange('All');
    } else {
        setRoutePoints({ start: null, end: null });
        setSelectedPortStart('');
        setSelectedPortEnd('');
    }
  };

  const visibleFloats = useMemo(() => {
    if (selectedRegion === 'All') return floats;
    return floats.filter(f => f.region === selectedRegion);
  }, [floats, selectedRegion]);

  const routeAnalysis = useMemo(() => {
    if (!routePoints.start || !routePoints.end) return null;
    
    const dx = routePoints.end.x - routePoints.start.x;
    const dy = routePoints.end.y - routePoints.start.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    const activeHazards: string[] = [];
    let dangerLevel = 0;

    hazards.forEach(h => {
        // Check distance from hazard center to route segment
        // Simplified: check distinct points along the line
        const steps = 10;
        let hit = false;
        for(let i=0; i<=steps; i++) {
            const px = routePoints.start!.x + (dx * (i/steps));
            const py = routePoints.start!.y + (dy * (i/steps));
            const distToHazard = Math.sqrt(Math.pow(px - h.left, 2) + Math.pow(py - h.top, 2));
            if (distToHazard < h.radius) {
                hit = true;
                break;
            }
        }
        
        if (hit) {
            dangerLevel += h.intensity === 'severe' ? 2 : 1;
            activeHazards.push(`${h.name} (${h.type.toUpperCase()})`);
        }
    });

    return {
        distance: (dist * 60).toFixed(0),
        safetyScore: Math.max(0, 100 - (dangerLevel * 30)),
        waveHeight: (dangerLevel * 2.5 + 1.2).toFixed(1),
        windSpeed: (dangerLevel * 20 + 15).toFixed(0),
        precipitation: dangerLevel > 0 ? (dangerLevel * 30 + 10).toFixed(0) : '5',
        visibility: dangerLevel > 0 ? '2' : '10+',
        status: dangerLevel > 1 ? 'DANGER' : (dangerLevel > 0 ? 'CAUTION' : 'SAFE'),
        hazards: activeHazards
    };
  }, [routePoints, hazards]);

  const getStatusStyles = (status: string, isSelected: boolean) => {
    switch (status) {
      case 'transmitting':
        return {
          ping: 'bg-cyan-400',
          markerBase: isSelected 
            ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.8)] scale-110' 
            : 'bg-[#0A0A0F] text-cyan-400 border border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]',
          badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        };
      case 'diving':
        return {
          ping: 'bg-amber-500',
          markerBase: isSelected 
            ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.8)] scale-110' 
            : 'bg-[#0A0A0F] text-amber-400 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      case 'active':
      default:
        return {
          ping: 'bg-emerald-500',
          markerBase: isSelected 
            ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-110' 
            : 'bg-emerald-500 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-[fadeIn_0.3s_ease-out]">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl h-[85vh] bg-[#0A0A0F] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 z-20 relative">
          <div className="flex items-center gap-3">
            {viewType === '3D' ? <Box className="w-6 h-6 text-cyan-400 animate-pulse" /> : <Globe className={`w-6 h-6 ${mode === 'routing' ? 'text-red-400' : 'text-cyan-400'} animate-pulse`} />}
            <div>
              <h2 className="text-xl font-display font-bold tracking-wide text-white">
                {viewType === '3D' ? 'GLOBAL DATA SPHERE' : (mode === 'routing' ? 'WEATHER ROUTING ADVISORY' : 'ARGO GLOBAL VIEW')}
              </h2>
              <p className="text-xs text-gray-400 font-mono tracking-wider flex items-center gap-2">
                {mode === 'routing' ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> 
                        SATELLITE RISK DETECTION
                    </>
                ) : (
                    <>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> 
                        LIVE SATELLITE FEED
                    </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                   <button 
                      onClick={() => { setViewType('2D'); if(mode==='routing') setMode('routing'); }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${viewType === '2D' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                   >
                      <Map className="w-3 h-3" />
                      2D MAP
                   </button>
                   <button 
                      onClick={() => { setViewType('3D'); setMode('exploration'); }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${viewType === '3D' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                   >
                      <Box className="w-3 h-3" />
                      3D GLOBE
                   </button>
              </div>

              {viewType === '2D' && (
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => { setMode('exploration'); setMapView({x:0,y:0,scale:1}); }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mode === 'exploration' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        EXPLORE
                    </button>
                    <button 
                        onClick={() => { setMode('routing'); setMapView({x:0,y:0,scale:1}); }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mode === 'routing' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        ROUTE
                    </button>
                </div>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
          
          {/* Sidebar Stats */}
          <div className="w-full lg:w-96 border-r border-white/10 bg-[#050505]/80 p-6 flex flex-col gap-6 overflow-y-auto z-20 backdrop-blur-sm">
            
            {mode === 'exploration' || viewType === '3D' ? (
                <>
                    <div className="p-4 rounded-xl bg-cyan-900/10 border border-cyan-500/20">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-cyan-400 font-bold text-sm uppercase">{viewType === '3D' ? 'GLOBAL' : selectedRegion} SECTOR</span>
                            <Layers className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-xs text-gray-400">
                            {viewType === '3D' 
                            ? "3D Visualization of global float distribution and density."
                            : selectedRegion === 'All' 
                                ? "Monitoring global float distribution." 
                                : `Focused telemetry for ${selectedRegion} region.`}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            Network Status
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-center w-6 h-6">
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/50">
                                        <Wifi className="w-1.5 h-1.5" />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-300 flex-1">Transmitting</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-center w-6 h-6">
                                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                </div>
                                <span className="text-xs text-gray-300 flex-1">Active / Surface</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-center w-6 h-6">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/50">
                                        <ArrowDownCircle className="w-2 h-2" />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-300 flex-1">Diving / Profiling</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <Thermometer className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider">Avg Surface Temp</span>
                            </div>
                            <div className="text-3xl font-display font-bold text-white">
                            {regionStats[selectedRegion]?.avgTemp}°C
                            </div>
                        </div>

                        {/* Live Weather Card */}
                        {regionalWeather && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    {regionalWeather.condition === 'Stormy' && <CloudLightning className="w-16 h-16 text-yellow-400" />}
                                    {regionalWeather.condition === 'Rain' && <CloudRain className="w-16 h-16 text-blue-400" />}
                                    {regionalWeather.condition === 'Cloudy' && <Cloud className="w-16 h-16 text-gray-400" />}
                                    {regionalWeather.condition === 'Clear' && <Sun className="w-16 h-16 text-orange-400" />}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 mb-3">
                                    {regionalWeather.condition === 'Stormy' ? <CloudLightning className="w-4 h-4 text-yellow-400" /> : 
                                     regionalWeather.condition === 'Rain' ? <CloudRain className="w-4 h-4 text-blue-400" /> :
                                     <Sun className="w-4 h-4 text-orange-400" />}
                                    <span className="text-xs uppercase tracking-wider">Regional Weather</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 relative z-10">
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Wind</div>
                                        <div className="text-lg font-bold text-white">{regionalWeather.windSpeed} kn</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Waves</div>
                                        <div className="text-lg font-bold text-white">{regionalWeather.waveHeight} m</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Precip</div>
                                        <div className="text-lg font-bold text-white">{regionalWeather.precipitation}%</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Pressure</div>
                                        <div className="text-lg font-bold text-white">{regionalWeather.pressure} hPa</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* ROUTING SIDEBAR */
                <div className="flex flex-col h-full">
                    <div className="p-4 rounded-xl bg-red-900/10 border border-red-500/20 mb-6">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-red-400 font-bold text-sm uppercase">VOYAGE PLANNER</span>
                            <Navigation className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="text-xs text-gray-400">
                            Select origin and destination ports to analyze climatic risks.
                        </div>
                    </div>

                    {/* Port Selection Form */}
                    <div className="space-y-4 mb-6">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Origin Port / City</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                    value={selectedPortStart}
                                    onChange={(e) => handlePortSelect('start', e.target.value)}
                                >
                                    <option value="">Select Port...</option>
                                    {PORTS.map(p => (
                                        <option key={p.name} value={p.name}>{p.name}, {p.country}</option>
                                    ))}
                                    <option value="Custom">Custom Map Point</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Destination Port / City</label>
                            <div className="relative">
                                <Anchor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                    value={selectedPortEnd}
                                    onChange={(e) => handlePortSelect('end', e.target.value)}
                                >
                                    <option value="">Select Port...</option>
                                    {PORTS.map(p => (
                                        <option key={p.name} value={p.name}>{p.name}, {p.country}</option>
                                    ))}
                                    <option value="Custom">Custom Map Point</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {routeAnalysis ? (
                         <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] flex-1 overflow-y-auto">
                             {/* Verdict Card */}
                             <div className={`p-5 rounded-xl border ${
                                 routeAnalysis.status === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                 routeAnalysis.status === 'CAUTION' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                 'bg-red-500/10 border-red-500/30'
                             }`}>
                                 <div className="flex items-center gap-3 mb-3">
                                     {routeAnalysis.status === 'SAFE' ? <Shield className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />}
                                     <div>
                                         <span className="text-[10px] uppercase font-bold text-gray-400 block">Route Status</span>
                                         <span className={`text-xl font-display font-bold ${
                                             routeAnalysis.status === 'SAFE' ? 'text-emerald-400' :
                                             routeAnalysis.status === 'CAUTION' ? 'text-yellow-400' :
                                             'text-red-400'
                                         }`}>{routeAnalysis.status}</span>
                                     </div>
                                 </div>
                                 <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full transition-all duration-1000 ${
                                             routeAnalysis.status === 'SAFE' ? 'bg-emerald-500' :
                                             routeAnalysis.status === 'CAUTION' ? 'bg-yellow-500' :
                                             'bg-red-500'
                                        }`}
                                        style={{ width: `${routeAnalysis.safetyScore}%` }}
                                     ></div>
                                 </div>
                             </div>

                             {/* Metrics */}
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                     <div className="flex items-center gap-2 text-gray-400 mb-1 text-[10px] uppercase">
                                         <Waves className="w-3 h-3" />
                                         Wave Height
                                     </div>
                                     <div className="text-xl font-bold text-white">{routeAnalysis.waveHeight}m</div>
                                 </div>
                                 <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                     <div className="flex items-center gap-2 text-gray-400 mb-1 text-[10px] uppercase">
                                         <Wind className="w-3 h-3" />
                                         Wind Speed
                                     </div>
                                     <div className="text-xl font-bold text-white">{routeAnalysis.windSpeed}kn</div>
                                 </div>
                                 <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                     <div className="flex items-center gap-2 text-gray-400 mb-1 text-[10px] uppercase">
                                         <CloudRain className="w-3 h-3" />
                                         Precipitation
                                     </div>
                                     <div className="text-xl font-bold text-white">{routeAnalysis.precipitation}%</div>
                                 </div>
                                 <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                     <div className="flex items-center gap-2 text-gray-400 mb-1 text-[10px] uppercase">
                                         <Eye className="w-3 h-3" />
                                         Visibility
                                     </div>
                                     <div className="text-xl font-bold text-white">{routeAnalysis.visibility}nm</div>
                                 </div>
                             </div>

                             {/* Hazards List */}
                             <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                 <div className="text-gray-400 text-[10px] uppercase mb-2 font-bold">Risk Factors Detected</div>
                                 {routeAnalysis.hazards.length > 0 ? (
                                     <ul className="space-y-2">
                                         {routeAnalysis.hazards.map((h, i) => (
                                             <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                                                 <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                 <span>Route intersects {h}</span>
                                             </li>
                                         ))}
                                     </ul>
                                 ) : (
                                     <div className="flex items-center gap-2 text-emerald-400 text-xs">
                                         <Shield className="w-3 h-3" />
                                         <span>No significant weather hazards detected on this trajectory.</span>
                                     </div>
                                 )}
                             </div>
                         </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 border border-dashed border-white/10 rounded-xl text-gray-600 text-xs text-center p-4">
                            <span>Select ports or click map to define route.</span>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Main Visualization Area */}
          <div 
            className="flex-1 relative bg-[#020204] overflow-hidden cursor-crosshair group"
            onClick={handleMapClick}
          >
             {/* 3D Globe Canvas */}
             <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', opacity: viewType === '3D' ? 1 : 0 }}
                className={`absolute inset-0 z-0 transition-opacity duration-700 ${viewType === '3D' ? 'pointer-events-auto' : 'pointer-events-none'}`}
             />

             {/* 2D Map Container - Only visible in 2D mode */}
             <div 
               className={`absolute inset-0 w-full h-full transition-all duration-700 ${viewType === '2D' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
             >
                 {/* Region Selector Tabs (Only in Exploration) */}
                 {mode === 'exploration' && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-[#0A0A0F]/80 backdrop-blur-md border border-white/10 rounded-full p-1 flex gap-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        {(Object.keys(REGION_CONFIG) as RegionType[]).map((region) => (
                        <button
                            key={region}
                            onClick={() => handleRegionChange(region)}
                            className={`group relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                            selectedRegion === region 
                                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {region}
                            {/* Tooltip */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-36 bg-[#0A0A0F]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0">
                            <div className="text-[10px] uppercase text-cyan-500/80 font-bold mb-2 tracking-wider text-center border-b border-white/5 pb-1">Region Intel</div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Active:</span>
                                <span className="text-white font-mono font-bold">{regionStats[region]?.count || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Avg Temp:</span>
                                <span className="text-emerald-400 font-mono font-bold">{regionStats[region]?.avgTemp || '0.0'}°C</span>
                                </div>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-[#0A0A0F]/95"></div>
                            </div>
                        </button>
                        ))}
                    </div>
                 )}

                {/* Dynamic Map Layer (2D) */}
                <div 
                  className="absolute inset-0 w-full h-full transition-transform duration-1000 cubic-bezier(0.25, 0.8, 0.25, 1)"
                  style={{ 
                    transform: `translate(${mapView.x}%, ${mapView.y}%) scale(${mapView.scale})`,
                    transformOrigin: '50% 50%'
                  }}
                >
                    <div className="absolute inset-0" style={{ 
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', 
                      backgroundSize: '40px 40px' 
                    }}></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                      <Globe className="w-[80%] h-[80%]" />
                    </div>

                    {/* --- EXPLORATION MODE LAYERS --- */}
                    {mode === 'exploration' && visibleFloats.map((float) => {
                      const isSelected = selectedId === float.id;
                      const isHovered = hoveredId === float.id;
                      const styles = getStatusStyles(float.status, isSelected);
                      
                      return (
                        <div 
                          key={float.id}
                          className="absolute flex items-center justify-center group/marker"
                          style={{
                            top: `${float.top}%`,
                            left: `${float.left}%`,
                            zIndex: isSelected || isHovered ? 50 : 10,
                            transform: `translate(-50%, -50%) scale(${1 / mapView.scale})`
                          }}
                          onMouseEnter={() => setHoveredId(float.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={(e) => handleFloatClick(e, float)}
                        >
                           {float.status === 'transmitting' && (
                                <div className={`absolute rounded-full opacity-30 animate-ping ${styles.ping} ${isSelected ? 'w-8 h-8' : 'w-6 h-6'}`}></div>
                           )}
                           {float.status === 'active' && (
                                <div className={`absolute rounded-full opacity-20 animate-pulse ${styles.ping} ${isSelected ? 'w-6 h-6' : 'w-4 h-4'}`}></div>
                           )}

                           <div className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${styles.markerBase} ${isSelected ? 'w-6 h-6' : 'w-4 h-4'}`}>
                              {float.status === 'transmitting' && <Wifi className={isSelected ? "w-3.5 h-3.5" : "w-2.5 h-2.5"} />}
                              {float.status === 'diving' && <ArrowDownCircle className={isSelected ? "w-4 h-4" : "w-3 h-3"} />}
                              {float.status === 'active' && isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                           </div>

                           {(isHovered || isSelected) && (
                             <div 
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-52 bg-[#0A0A0F]/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-3 shadow-2xl text-left animate-[fadeIn_0.2s_ease-out] pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                             >
                               <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-1">
                                 <span className="text-cyan-400 font-bold text-xs tracking-wider">{float.id}</span>
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded full uppercase border ${styles.badge}`}>{float.status}</span>
                               </div>
                               <div className="space-y-1 text-xs text-gray-300 font-mono mb-3">
                                 <div className="flex justify-between">
                                   <span>TEMP:</span>
                                   <span className="text-white">{float.temp}°C</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>DEPTH:</span>
                                   <span className="text-white">{float.depth}m</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>LOC:</span>
                                   <span className="text-white">{float.lat}, {float.lng}</span>
                                 </div>
                               </div>
                               {isSelected && (
                                   <button 
                                     onClick={(e) => handleViewHistory(e, float)}
                                     className="w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold py-1.5 rounded border border-cyan-500/20 transition-colors"
                                   >
                                       <BarChart3 className="w-3 h-3" />
                                       ANALYZE TELEMETRY
                                   </button>
                               )}
                               <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0A0A0F]/90"></div>
                             </div>
                           )}
                        </div>
                      );
                    })}

                    {/* --- ROUTING MODE LAYERS --- */}
                    {mode === 'routing' && (
                        <>
                            {/* Hazards */}
                            {hazards.map(h => (
                                <div 
                                    key={h.id}
                                    className="absolute rounded-full flex items-center justify-center group"
                                    style={{
                                        top: `${h.top}%`,
                                        left: `${h.left}%`,
                                        width: `${h.radius * 2}%`,
                                        height: `${h.radius * 2}%`,
                                        transform: 'translate(-50%, -50%)',
                                        background: `radial-gradient(circle, ${h.intensity === 'severe' ? 'rgba(239,68,68,0.4)' : 'rgba(234,179,8,0.3)'} 0%, transparent 70%)`
                                    }}
                                >
                                    <div className={`w-2/3 h-2/3 rounded-full border ${h.intensity === 'severe' ? 'border-red-500/30' : 'border-yellow-500/30'} opacity-50 animate-pulse`}></div>
                                    {/* Hazard Label on Hover */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold text-white/70 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-black/50 px-1 rounded">
                                        {h.name}
                                    </div>
                                </div>
                            ))}

                            {/* Waypoints & Path */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                {routePoints.start && routePoints.end && (
                                    <line 
                                        x1={`${routePoints.start.x}%`} y1={`${routePoints.start.y}%`}
                                        x2={`${routePoints.end.x}%`} y2={`${routePoints.end.y}%`}
                                        stroke={routeAnalysis?.status === 'DANGER' ? '#ef4444' : (routeAnalysis?.status === 'CAUTION' ? '#eab308' : '#10b981')}
                                        strokeWidth="2"
                                        strokeDasharray="5,5"
                                        className="drop-shadow-lg"
                                    />
                                )}
                            </svg>

                            {routePoints.start && (
                                 <div className="absolute flex flex-col items-center" style={{ top: `${routePoints.start.y}%`, left: `${routePoints.start.x}%`, transform: 'translate(-50%, -50%)' }}>
                                     <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                     <span className="mt-1 text-[8px] font-bold text-emerald-400 bg-black/50 px-1 rounded whitespace-nowrap">{routePoints.start.label || 'START'}</span>
                                 </div>
                            )}
                            {routePoints.end && (
                                 <div className="absolute flex flex-col items-center" style={{ top: `${routePoints.end.y}%`, left: `${routePoints.end.x}%`, transform: 'translate(-50%, -50%)' }}>
                                     <div className="w-3 h-3 bg-white rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                     <span className="mt-1 text-[8px] font-bold text-white bg-black/50 px-1 rounded whitespace-nowrap">{routePoints.end.label || 'END'}</span>
                                 </div>
                            )}
                        </>
                    )}
                </div>
                
                {/* Controls Overlay */}
                <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-30">
                  {(mapView.scale > 1 || routePoints.start) && (
                    <button 
                      onClick={(e) => resetView(e)}
                      className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full hover:bg-white/10 transition-all shadow-lg group"
                    >
                      <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                      <span className="text-xs font-bold">RESET {mode === 'routing' ? 'ROUTE' : 'VIEW'}</span>
                    </button>
                  )}
                </div>
             </div>

            {/* History / Analysis Overlay (Keep existing) */}
            {historyFloat && (
                <div 
                    className="absolute inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center animate-[fadeIn_0.3s_ease-out]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-full max-w-4xl p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <button 
                                        onClick={() => setHistoryFloat(null)}
                                        className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-2xl font-display font-bold text-white tracking-wider">FLOAT ANALYSIS: {historyFloat.id}</h2>
                                </div>
                                <p className="text-sm text-gray-500 pl-9">Last Transmission: {new Date().toISOString().split('T')[0]} • Cycle 142</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors">
                                <Download className="w-4 h-4" />
                                <span className="text-xs font-bold">DOWNLOAD DATASET</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        <Thermometer className="w-4 h-4 text-rose-400" />
                                        TEMPERATURE PROFILE
                                    </h3>
                                    <span className="text-xs text-gray-500 font-mono">°C / DEPTH (m)</span>
                                </div>
                                <div className="flex-1 relative border-l border-b border-white/20 m-2">
                                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                                        <path 
                                            d="M0,20 Q50,25 100,80 T280,250" 
                                            fill="none" 
                                            stroke="#fb7185" 
                                            strokeWidth="2" 
                                            className="drop-shadow-[0_0_4px_rgba(251,113,133,0.5)]"
                                        />
                                        <circle cx="0" cy="20" r="3" fill="#fb7185" />
                                        <circle cx="100" cy="80" r="3" fill="#fb7185" />
                                        <circle cx="280" cy="250" r="3" fill="#fb7185" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                        <div className="w-full h-px bg-white/5"></div>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <div className="w-full h-px bg-white/5"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2 px-2">
                                    <span>0m</span>
                                    <span>500m</span>
                                    <span>1000m</span>
                                    <span>2000m</span>
                                </div>
                            </div>

                             <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-cyan-400" />
                                        SALINITY TREND
                                    </h3>
                                    <span className="text-xs text-gray-500 font-mono">PSU / TIME</span>
                                </div>
                                <div className="flex-1 relative border-l border-b border-white/20 m-2">
                                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                                        <polyline 
                                            points="0,150 40,140 80,160 120,130 160,145 200,120 240,130 280,110" 
                                            fill="none" 
                                            stroke="#22d3ee" 
                                            strokeWidth="2" 
                                            strokeLinejoin="round"
                                            className="drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                        <div className="w-full h-px bg-white/5"></div>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <div className="w-full h-px bg-white/5"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2 px-2">
                                    <span>JAN</span>
                                    <span>MAR</span>
                                    <span>JUN</span>
                                    <span>SEP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};