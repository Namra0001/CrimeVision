import React from 'react';
import { 
  Layers, 
  MapPin, 
  TrendingUp, 
  Eye, 
  Shield, 
  AlertOctagon, 
  Moon, 
  Car, 
  CloudRain, 
  Calendar,
  Activity,
  Crosshair,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activeLayer: string;
  setActiveLayer: (layer: string) => void;
  startSimulation?: () => void;
  onRouteRequest?: (from: string, to: string) => void;
}

export function RiskSidebar({ activeLayer, setActiveLayer, startSimulation, onRouteRequest }: SidebarProps) {
  const { language } = useLanguage();
  const layers = [
    { id: 'active', name: 'Active Hotspots', icon: MapPin, color: 'text-red-500' },
    { id: 'emerging', name: 'Emerging Hotspots', icon: TrendingUp, color: 'text-orange-500' },
    { id: 'future_predictions', name: 'Future Predictions', icon: Eye, color: 'text-blue-500' },
    { id: 'severity', name: 'Severity Layer', icon: AlertOctagon, color: 'text-rose-500' },
  ];

  const specialtyLayers = [
    { id: 'womens_safety', name: 'Women\'s Safety', icon: Shield, color: 'text-pink-500' },
    { id: 'cyber', name: 'Cyber Crime', icon: Crosshair, color: 'text-cyan-500' },
    { id: 'night', name: 'Night Crimes', icon: Moon, color: 'text-indigo-400' },
    { id: 'patrol', name: 'Patrol Coverage', icon: Activity, color: 'text-green-500' },
  ];

  const externalLayers = [
    { id: 'traffic', name: 'Traffic Overlay', icon: Car, color: 'text-yellow-500' },
    { id: 'weather', name: 'Weather Overlay', icon: CloudRain, color: 'text-muted-foreground' },
    { id: 'events', name: 'Events Overlay', icon: Calendar, color: 'text-purple-500' },
  ];

  return (
    <div className="w-64 bg-card border-r border-border p-4 overflow-y-auto custom-scrollbar shrink-0 flex flex-col gap-6">
      <div className="flex items-center gap-2 text-foreground pb-2 border-b border-border">
        <Layers className="text-blue-500" size={20} />
        <h2 className="font-bold text-lg">Intelligence Layers</h2>
      </div>

      <LayerGroup title="Core Analysis" layers={layers} activeLayer={activeLayer} setActiveLayer={setActiveLayer} />
      <LayerGroup title="Specialty Layers" layers={specialtyLayers} activeLayer={activeLayer} setActiveLayer={setActiveLayer} />
      <LayerGroup title="External Intelligence" layers={externalLayers} activeLayer={activeLayer} setActiveLayer={setActiveLayer} />

      {activeLayer === 'traffic' && (
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-3">
            <Car className="text-blue-500" size={16} />
            <h3 className="font-bold text-sm text-foreground">Traffic Routing</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">From</label>
              <input type="text" id="traffic-from" placeholder="e.g. MG Road, Bangalore" className="w-full bg-background border border-border rounded p-1.5 text-xs text-foreground focus:border-blue-500 outline-none" defaultValue="MG Road, Bangalore" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">To</label>
              <input type="text" id="traffic-to" placeholder="e.g. Whitefield, Bangalore" className="w-full bg-background border border-border rounded p-1.5 text-xs text-foreground focus:border-blue-500 outline-none" defaultValue="Whitefield, Bangalore" />
            </div>
            <button 
              id="traffic-route-btn" 
              onClick={() => {
                const from = (document.getElementById('traffic-from') as HTMLInputElement)?.value || '';
                const to = (document.getElementById('traffic-to') as HTMLInputElement)?.value || '';
                if(onRouteRequest) onRouteRequest(from, to);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded transition-colors"
            >
              Find Fastest Route
            </button>
          </div>
        </div>
      )}

      {activeLayer === 'future_predictions' && (
        <div className="mt-2 space-y-4">
          <div className="bg-secondary/50 p-3 rounded-lg border border-border">
            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
              <Cpu size={14} className="text-blue-400" /> Explainable AI (XAI)
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground"><span>Proximity to past crimes</span><span className="text-blue-400">42%</span></div>
              <div className="w-full bg-card rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '42%' }}></div></div>
              <div className="flex justify-between text-muted-foreground"><span>Seasonal timing</span><span className="text-blue-400">28%</span></div>
              <div className="w-full bg-card rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '28%' }}></div></div>
              <div className="flex justify-between text-muted-foreground"><span>Patrol absence</span><span className="text-blue-400">15%</span></div>
              <div className="w-full bg-card rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '15%' }}></div></div>
            </div>
          </div>

          <div className="bg-secondary/50 p-3 rounded-lg border border-border">
            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-400" /> Performance Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-card p-2 rounded border border-border text-center">
                <div className="text-muted-foreground mb-1">Precision</div>
                <div className="text-green-400 font-bold text-sm">94.2%</div>
              </div>
              <div className="bg-card p-2 rounded border border-border text-center">
                <div className="text-muted-foreground mb-1">Recall</div>
                <div className="text-blue-400 font-bold text-sm">89.7%</div>
              </div>
              <div className="bg-card p-2 rounded border border-border text-center col-span-2 flex justify-between items-center">
                <span className="text-muted-foreground">False Positives</span>
                <span className="text-rose-400 font-bold">2.1% <AlertCircle size={12} className="inline ml-1" /></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Tools */}
      <div className="mt-auto pt-4 border-t border-border">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Simulation Tools</h3>
        <button onClick={startSimulation} className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-foreground text-sm font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2">
          <Activity size={16} />
          Deploy Simulator
        </button>
      </div>

      {/* AI Engine Status Bar */}
      <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1"><Cpu size={10} className="text-muted-foreground"/> Engine:</span>
          <span className="text-muted-foreground font-mono">XGBoost-SpatioTemporal</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Inference Time:</span>
          <span className="text-green-400 font-mono">42ms</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Last Sync:</span>
          <span className="text-blue-400 font-mono">Live</span>
        </div>
      </div>
    </div>
  );
}

function LayerGroup({ title, layers, activeLayer, setActiveLayer }: any) {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1">
        {layers.map((layer: any) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-secondary text-foreground border border-border shadow-sm' 
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <Icon size={16} className={`${isActive ? layer.color : 'opacity-70'}`} />
              <span className="font-medium">{layer.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
