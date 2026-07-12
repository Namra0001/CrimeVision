import React from 'react';
import { Popup } from 'react-leaflet';
import { FileText, MapPin, ShieldAlert, Crosshair, Map, Video, Users, FileWarning, Activity } from 'lucide-react';

interface CrimeData {
  case_no: string;
  fir_no: string;
  crime_type: string;
  crime_head: string;
  crime_sub_head: string;
  severity: string;
  status: string;
  victim: string;
  accused_count: number;
  officer: string;
  police_station: string;
  district: string;
  date: string;
  time: string;
  lat: number;
  lng: number;
  risk_score: number;
  prediction?: string;
  suggested_action?: string;
}

export function AdvancedMarkerPopup({ loc, onRouteClick }: { loc: CrimeData, onRouteClick?: () => void }) {
  const isHighSeverity = loc.severity.toLowerCase().includes('high') || loc.severity.toLowerCase().includes('heinous');
  
  return (
    <Popup className="advanced-popup">
      <div className="w-[350px] bg-card text-foreground font-sans p-1 -m-3 rounded-lg overflow-hidden border border-border shadow-2xl">
        
        {/* Header */}
        <div className={`p-4 border-b border-border flex justify-between items-start ${isHighSeverity ? 'bg-red-900/20' : 'bg-secondary/50'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={16} className={isHighSeverity ? 'text-red-400' : 'text-orange-400'} />
              <h3 className="font-bold text-lg text-foreground m-0 leading-tight">{loc.crime_type}</h3>
            </div>
            <p className="text-xs text-muted-foreground m-0">{loc.crime_head}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${
              isHighSeverity ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {loc.severity}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
              Risk: {loc.risk_score}/100
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          
          <div className="col-span-2 flex items-center justify-between bg-secondary/40 p-2 rounded-md border border-border/50">
             <div className="flex flex-col">
               <span className="text-xs text-muted-foreground font-medium">FIR Number</span>
               <span className="font-mono font-medium text-blue-500 text-xs">{loc.fir_no}</span>
             </div>
             <div className="flex flex-col text-right">
               <span className="text-xs text-muted-foreground font-medium">Status</span>
               <span className={`font-semibold text-xs ${loc.status.toLowerCase().includes('solved') ? 'text-green-400' : 'text-yellow-400'}`}>
                 {loc.status}
               </span>
             </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1"><MapPin size={10}/> Location</span>
            <span className="text-foreground truncate">{loc.police_station}</span>
            <span className="text-xs text-muted-foreground">{loc.district}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1"><FileWarning size={10}/> Date & Time</span>
            <span className="text-foreground">{loc.date}</span>
            <span className="text-xs text-muted-foreground">{loc.time}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1"><Users size={10}/> Parties</span>
            <span className="text-foreground text-xs">Victim: {loc.victim}</span>
            <span className="text-xs text-muted-foreground">Accused: {loc.accused_count}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1"><Crosshair size={10}/> Officer</span>
            <span className="text-foreground text-xs truncate">{loc.officer}</span>
          </div>

          {(loc.prediction || loc.suggested_action) && (
            <div className="col-span-2 mt-1 pt-2 border-t border-border/50 flex flex-col gap-2">
              {loc.prediction && (
                <div className="flex items-start gap-2 bg-blue-900/10 p-2 rounded border border-blue-500/20">
                  <Activity size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold block">AI PREDICTION</span>
                    <span className="text-xs text-foreground">{loc.prediction}</span>
                  </div>
                </div>
              )}
              {loc.suggested_action && (
                <div className="flex items-start gap-2 bg-green-900/10 p-2 rounded border border-green-500/20">
                  <ShieldAlert size={14} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-green-400 font-bold block">SUGGESTED ACTION</span>
                    <span className="text-xs text-foreground">{loc.suggested_action}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="col-span-2 grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-border/50">
             <div className="flex flex-col text-xs">
                <span className="text-[9px] text-muted-foreground">Nearest CCTV</span>
                <span className="text-foreground">Within 150m</span>
             </div>
             <div className="flex flex-col text-xs text-right">
                <span className="text-[9px] text-muted-foreground">Nearest Hospital</span>
                <span className="text-foreground">1.2 km away</span>
             </div>
             <div className="flex flex-col text-xs">
                <span className="text-[9px] text-muted-foreground">Nearest Patrol</span>
                <span className="text-green-400 font-bold">Unit Alpha (Active)</span>
             </div>
             <div className="flex flex-col text-xs text-right">
                <span className="text-[9px] text-muted-foreground">Repeat Offenders</span>
                <span className="text-red-400 font-bold">3 Nearby</span>
             </div>
          </div>

        </div>

        {/* Quick Actions Footer */}
        <div className="p-3 bg-secondary/80 border-t border-border grid grid-cols-4 gap-2">
          <button className="flex flex-col items-center justify-center gap-1 p-2 bg-card hover:bg-blue-600/10 hover:text-blue-500 transition-colors rounded-md border border-border text-muted-foreground group">
            <FileText size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] uppercase font-bold">Case</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRouteClick && onRouteClick(); }} 
            className="flex flex-col items-center justify-center gap-1 p-2 bg-card hover:bg-green-600/10 hover:text-green-500 transition-colors rounded-md border border-border text-muted-foreground group"
          >
            <Map size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] uppercase font-bold">Route</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 p-2 bg-card hover:bg-purple-600/10 hover:text-purple-500 transition-colors rounded-md border border-border text-muted-foreground group">
            <Video size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] uppercase font-bold">CCTV</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 p-2 bg-blue-600 hover:bg-blue-500 transition-colors rounded-md border border-blue-500 text-foreground shadow-lg shadow-blue-900/20">
            <span className="text-xs font-bold leading-tight text-center">Report</span>
          </button>
        </div>

      </div>
    </Popup>
  );
}
