import React, { useState } from 'react';
import { Filter, Search, ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface FilterProps {
  districts: { id: number; name: string }[];
  policeStations: { id: number; name: string }[];
  crimeTypes: string[];
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  selectedStation: string;
  setSelectedStation: (v: string) => void;
  selectedCrimeType: string;
  setSelectedCrimeType: (v: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  viewMode: 'cluster' | 'heatmap';
  setViewMode: (v: 'cluster' | 'heatmap') => void;
  recordCount: number;
  overlays: Record<string, boolean>;
  setOverlay: (overlay: string, value: boolean) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
}

export function AdvancedFilterSidebar(props: FilterProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('location');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-full md:w-[340px] flex flex-col gap-4 bg-card/90 backdrop-blur-xl p-5 rounded-2xl border border-border shadow-2xl shrink-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2 text-foreground">
          <SlidersHorizontal size={20} className="text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Intelligence Filters</h2>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-secondary p-1 rounded-lg flex text-sm font-medium border border-border">
        <button 
          className={`flex-1 py-2 rounded-md transition-all duration-200 ${props.viewMode === 'cluster' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => props.setViewMode('cluster')}
        >
          Tactical Map
        </button>
        <button 
          className={`flex-1 py-2 rounded-md transition-all duration-200 ${props.viewMode === 'heatmap' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => props.setViewMode('heatmap')}
        >
          Heatmap
        </button>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        
        {/* Location Filters */}
        <div className="border border-border rounded-lg overflow-hidden bg-secondary/30">
          <button onClick={() => toggleSection('location')} className="w-full flex items-center justify-between p-3 hover:bg-secondary/70 transition-colors">
            <span className="font-semibold text-foreground text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Location & Region
            </span>
            {expandedSection === 'location' ? <ChevronDown size={16} className="text-muted-foreground"/> : <ChevronRight size={16} className="text-muted-foreground"/>}
          </button>
          {expandedSection === 'location' && (
            <div className="p-3 pt-0 border-t border-border space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">District</label>
                <select 
                  className="w-full p-2.5 rounded-md border border-border bg-card text-foreground text-sm focus:ring-1 focus:ring-primary"
                  value={props.selectedDistrict}
                  onChange={(e) => props.setSelectedDistrict(e.target.value)}
                >
                  <option value="">All Districts (Karnataka)</option>
                  {props.districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Police Station</label>
                <select 
                  disabled={!props.selectedDistrict}
                  className="w-full p-2.5 rounded-md border border-border bg-card text-foreground text-sm focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  value={props.selectedStation}
                  onChange={(e) => props.setSelectedStation(e.target.value)}
                >
                  <option value="">{props.selectedDistrict ? "All Police Stations" : "Select District First"}</option>
                  {props.policeStations.map(ps => (
                    <option key={ps.id} value={ps.id}>{ps.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Crime Details Filters */}
        <div className="border border-border rounded-lg overflow-hidden bg-secondary/30">
          <button onClick={() => toggleSection('crime')} className="w-full flex items-center justify-between p-3 hover:bg-secondary/70 transition-colors">
            <span className="font-semibold text-foreground text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Crime Parameters
            </span>
            {expandedSection === 'crime' ? <ChevronDown size={16} className="text-muted-foreground"/> : <ChevronRight size={16} className="text-muted-foreground"/>}
          </button>
          {expandedSection === 'crime' && (
            <div className="p-3 pt-0 border-t border-border space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Crime Type</label>
                <input 
                  type="text"
                  list="crime-types-list"
                  placeholder="e.g. Theft, Murder"
                  className="w-full p-2.5 rounded-md border border-border bg-card text-foreground text-sm focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  value={props.selectedCrimeType}
                  onChange={(e) => props.setSelectedCrimeType(e.target.value)}
                />
                <datalist id="crime-types-list">
                  {props.crimeTypes.map((type, idx) => (
                    <option key={idx} value={type} />
                  ))}
                </datalist>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Severity Level</label>
                <select 
                  className="w-full p-2.5 rounded-md border border-border bg-card text-foreground text-sm focus:ring-1 focus:ring-primary"
                  value={props.selectedSeverity}
                  onChange={(e) => props.setSelectedSeverity(e.target.value)}
                >
                  <option value="">Any Severity</option>
                  <option value="High">High / Heinous</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Case Status</label>
                <select 
                  className="w-full p-2.5 rounded-md border border-border bg-card text-foreground text-sm focus:ring-1 focus:ring-primary"
                  value={props.selectedStatus}
                  onChange={(e) => props.setSelectedStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Solved">Solved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Time Filters */}
        <div className="border border-border rounded-lg overflow-hidden bg-secondary/30">
          <button onClick={() => toggleSection('time')} className="w-full flex items-center justify-between p-3 hover:bg-secondary/70 transition-colors">
            <span className="font-semibold text-foreground text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Temporal Filters
            </span>
            {expandedSection === 'time' ? <ChevronDown size={16} className="text-muted-foreground"/> : <ChevronRight size={16} className="text-muted-foreground"/>}
          </button>
          {expandedSection === 'time' && (
            <div className="p-3 pt-0 border-t border-border space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block uppercase">From Date</label>
                  <input type="date" className="w-full p-2 rounded border border-border bg-card text-foreground text-xs" value={props.fromDate} onChange={(e) => props.setFromDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block uppercase">To Date</label>
                  <input type="date" className="w-full p-2 rounded border border-border bg-card text-foreground text-xs" value={props.toDate} onChange={(e) => props.setToDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* External Overlays */}
        <div className="border border-border rounded-lg overflow-hidden bg-secondary/30">
          <button onClick={() => toggleSection('overlays')} className="w-full flex items-center justify-between p-3 hover:bg-secondary/70 transition-colors">
            <span className="font-semibold text-foreground text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> External Intelligence
            </span>
            {expandedSection === 'overlays' ? <ChevronDown size={16} className="text-muted-foreground"/> : <ChevronRight size={16} className="text-muted-foreground"/>}
          </button>
          {expandedSection === 'overlays' && (
            <div className="p-3 pt-0 border-t border-border space-y-2">
              {[
                { id: 'hospitals', label: 'Hospital Layer' },
                { id: 'roads', label: 'Road Infrastructure' },
                { id: 'events', label: 'Event Layer' },
                { id: 'patrol', label: 'Patrol Coverage' },
                { id: 'radius', label: 'Emergency Response Radius' },
              ].map(overlay => (
                <label key={overlay.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer p-1.5 hover:bg-secondary rounded">
                  <input 
                    type="checkbox" 
                    className="rounded border-border bg-card text-primary focus:ring-primary h-3 w-3"
                    checked={props.overlays[overlay.id] || false}
                    onChange={(e) => props.setOverlay(overlay.id, e.target.checked)}
                  />
                  {overlay.label}
                </label>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg border border-border">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Data Feed Active
          </span>
          <span className="font-mono text-primary">{props.recordCount} Records</span>
        </div>
      </div>
    </div>
  );
}
