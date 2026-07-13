import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Map as MapIcon, TrendingUp, Activity, 
  AlertTriangle, Users, Eye, Crosshair, Loader2, Play, Pause, Bell
} from 'lucide-react';
import { RiskMap } from '../components/RiskMap';
import { RiskSidebar } from '../components/RiskSidebar';
import { RiskAnalyticsPanel } from '../components/RiskAnalyticsPanel';
import { useLanguage } from '../contexts/LanguageContext';
import { useRefresh } from '../contexts/RefreshContext';

const ICONS: Record<string, any> = {
  Map: MapIcon, TrendingUp, AlertTriangle, Activity, Eye, ShieldAlert, Crosshair, Users
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY"];

// Simple CountUp Component
const CountUp = ({ end, duration = 1000, suffix = "" }: { end: string | number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const isNumber = typeof end === 'number' || !isNaN(Number(end));
  const target = isNumber ? Number(end) : 0;
  
  useEffect(() => {
    if (!isNumber) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration, isNumber]);

  return <span>{isNumber ? count : end}{suffix}</span>;
};

export default function RiskAnalysis() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, show: boolean} | null>(null);
  
  const { language } = useLanguage();
  const { refreshCount } = useRefresh();
  
  // Live Notification System (Fetch latest intercept)
  useEffect(() => {
    const fetchLatestIntercept = async () => {
      try {
        const res = await fetch('https://fuzzy-geese-lay.loca.lt' + '/api/alerts/latest-intercept');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setToast({ message: data.description, show: true });
            setTimeout(() => setToast(null), 8000);
          }
        }
      } catch (e) {
        console.error("Failed to fetch latest intercept", e);
      }
    };
    
    fetchLatestIntercept();
    
    // Fallback polling just in case, but rely on refreshCount mostly
    const interval = setInterval(fetchLatestIntercept, 30000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  const [activeLayer, setActiveLayer] = useState<string>('active');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  useEffect(() => {
    fetchData(activeLayer, MONTHS[currentMonthIndex]);
  }, [activeLayer, currentMonthIndex, refreshCount, language]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMonthIndex(prev => {
          if (prev >= 4) { // Animate up to May (index 4) as requested
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000); // 3 seconds per month for smooth transitions
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayToggle = () => {
    if (!isPlaying && currentMonthIndex >= 4) {
      setCurrentMonthIndex(0); // Reset to Jan
    }
    setIsPlaying(!isPlaying);
  };

  const [routeData, setRouteData] = useState<any>(null);

  const handleRouteRequest = async (from: string, to: string) => {
    setLoading(true);
    try {
      const res = await fetch('https://fuzzy-geese-lay.loca.lt' + '/api/risk/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_loc: from,
          to_loc: to,
          api_key: 'SocXpozJmv6vx2feqg40G6P4EOiwcyWu'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRouteData(data);
      } else {
        const errData = await res.json();
        setToast({ message: errData.detail || "Failed to find route", show: true });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setToast({ message: "Network error routing", show: true });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (layer: string, month: string) => {
    setLoading(true);
    if (layer !== 'traffic') {
       setRouteData(null);
    }
    try {
      const [sumRes, hotRes, recRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/risk/summary?layer=${layer}&month=${month}&lang=${language}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/risk/hotspots?layer=${layer}&month=${month}&lang=${language}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/risk/recommendations?layer=${layer}&month=${month}&lang=${language}`)
      ]);
      
      const sumData = sumRes.ok ? await sumRes.json() : null;
      const hotData = hotRes.ok ? await hotRes.json() : [];
      const recData = recRes.ok ? await recRes.json() : [];
      
      // Prevent race conditions where a slow previous request overwrites the current layer
      if (layer === activeLayer) {
        setSummary(sumData);
        setHotspots(Array.isArray(hotData) ? hotData : []);
        setRecommendations(Array.isArray(recData) ? recData : []);
      }
    } catch (err) {
      console.error("Error loading risk analysis data", err);
      if (layer === activeLayer) {
        setHotspots([]);
        setRecommendations([]);
      }
    } finally {
      if (layer === activeLayer) {
        setLoading(false);
      }
    }
  };

  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredHotspots = React.useMemo(() => {
    if (!filterType) return hotspots;
    if (filterType === 'total hotspots' || filterType === 'total zones') return hotspots;
    if (filterType === 'critical areas' || filterType === 'critical crimes') {
      const distinctHotspots: any[] = [];
      const seenCoords = new Set();
      
      const sorted = [...hotspots].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
      
      for (const h of sorted) {
        // Create a distinct key based on coordinates (rounded slightly to catch near-overlaps)
        let coordKey = "0,0";
        if (Array.isArray(h.coordinates) && h.coordinates.length >= 2) {
           coordKey = `${Number(h.coordinates[0]).toFixed(3)},${Number(h.coordinates[1]).toFixed(3)}`;
        }
        
        if (!seenCoords.has(coordKey)) {
          seenCoords.add(coordKey);
          distinctHotspots.push(h);
        }
      }
      
      return distinctHotspots.slice(0, 8);
    }
    if (filterType.includes('avg risk') || filterType.includes('safety')) return hotspots;
    return hotspots;
  }, [hotspots, filterType]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden rounded-xl border border-border">
      
      {/* Top Dynamic Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-card border-b border-border shrink-0 relative z-10">
        {summary?.cards?.map((card: any, i: number) => {
          const Icon = ICONS[card.icon_name] || Activity;
          const isSelected = filterType === card.title.toLowerCase();
          return (
            <div 
              key={i} 
              onClick={() => setFilterType(isSelected ? null : card.title.toLowerCase())}
              className={`bg-card rounded-lg p-4 border flex items-center justify-between shadow-lg relative overflow-hidden group cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-500/10' : 'border-border hover:border-blue-500/50'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-foreground flex items-baseline gap-1">
                  <CountUp end={card.value} />
                  {card.suffix && <span className="text-sm text-muted-foreground">{card.suffix}</span>}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-background/50 border ${isSelected ? 'border-blue-500/50' : 'border-border'} ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <RiskSidebar 
          activeLayer={activeLayer} 
          setActiveLayer={setActiveLayer}
          startSimulation={handlePlayToggle}
          onRouteRequest={handleRouteRequest}
        />

        <div className="flex-1 relative flex flex-col min-w-0">
          {/* Map Container */}
          <div className="absolute inset-0 z-0">
            <RiskMap 
              hotspots={filteredHotspots} 
              layer={activeLayer} 
              routeData={routeData}
              onCompareToggle={() => {
                setActiveLayer(prev => prev === 'active' ? 'future_predictions' : 'active');
              }}
            />
          </div>    


            {/* Timeline Playback Overlay on Map */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-md border border-border p-3 rounded-full shadow-2xl flex items-center gap-4">
              <button 
                onClick={handlePlayToggle} 
                className="h-10 w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-foreground rounded-full transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)]"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
              </button>
              
              <div className="flex items-center gap-2 pr-4">
                {MONTHS.map((m, idx) => (
                  <div key={m} className="flex flex-col items-center gap-1">
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${idx === currentMonthIndex ? 'text-blue-400' : 'text-muted-foreground'}`}>
                      {m}
                    </div>
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentMonthIndex ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : idx < currentMonthIndex ? 'w-4 bg-blue-900' : 'w-4 border-border'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Notification Toast */}
            {toast?.show && (
              <div className="absolute top-4 right-4 bg-card border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] rounded-lg p-3 pr-8 flex items-center gap-3 animate-in slide-in-from-right fade-in z-[2000]">
                <div className="bg-blue-500/20 p-2 rounded-full relative">
                  <span className="absolute inset-0 rounded-full border border-blue-500 animate-ping"></span>
                  <Bell size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{language === 'kn' ? 'ಲೈವ್ ಇಂಟರ್ಸೆಪ್ಟ್' : 'Live Intercept'}</p>
                  <p className="text-xs text-foreground font-medium">{toast.message}</p>
                </div>
              </div>
            )}
            
          </div>

          <RiskAnalyticsPanel 
            recommendations={recommendations} 
            layer={activeLayer} 
            summary={summary}
            currentMonthIndex={currentMonthIndex}
            MONTHS={MONTHS}
          />
        </div>
      </div>
    );
  }
