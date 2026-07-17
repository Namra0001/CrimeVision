import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Circle, Polygon, Polyline, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

import { ShieldAlert, Users, CheckCircle, Activity, MapPin, Bell, RefreshCw } from 'lucide-react';
import { SummaryCard } from '../components/SummaryCard';
import { AdvancedFilterSidebar } from '../components/AdvancedFilterSidebar';
import { AdvancedMarkerPopup } from '../components/AdvancedMarkerPopup';
import { useRefresh } from '../contexts/RefreshContext';

// Remove default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Custom Icons Generator based on Crime Type and Status
const getCustomIcon = (crimeType: string, status: string, severity: string) => {
  let color = 'bg-blue-500'; // Default Blue (Property)
  let shadowColor = 'shadow-blue-500/50';
  let animation = '';
  let iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

  const type = crimeType.toLowerCase();
  
  if (type.includes('murder') || type.includes('terror') || type.includes('gang')) {
    color = 'bg-red-600';
    shadowColor = 'shadow-red-600/50';
    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m20 14-8 8-4-4 8-8"/><path d="M4 14 10 8"/><path d="m2 22 2-2"/></svg>'; // Knife equivalent
  } else if (type.includes('robbery') || type.includes('kidnap') || type.includes('fraud')) {
    color = 'bg-orange-500';
    shadowColor = 'shadow-orange-500/50';
    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>'; // Money/Card
  } else if (type.includes('domestic') || type.includes('harassment') || type.includes('women')) {
    color = 'bg-yellow-500';
    shadowColor = 'shadow-yellow-500/50';
    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M12 11v11"/><path d="M9 16h6"/></svg>'; // Woman
  } else if (type.includes('cyber')) {
    color = 'bg-purple-500';
    shadowColor = 'shadow-purple-500/50';
    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="8" x="5" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="18" y2="18"/><line x1="10" x2="10.01" y1="18" y2="18"/></svg>'; // Server/Computer
  } else if (type.includes('vehicle')) {
    color = 'bg-blue-600';
    shadowColor = 'shadow-blue-600/50';
    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0m-6 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0"/></svg>';
  } else if (type.includes('burglar')) {
    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  }

  // Status Overrides
  if (status.toLowerCase().includes('solved')) {
    color = 'bg-green-500';
    shadowColor = 'shadow-green-500/50';
  } else if (status.toLowerCase().includes('closed')) {
    color = 'bg-slate-500';
    shadowColor = 'shadow-slate-500/50';
  }

  // Animations
  if (status.toLowerCase().includes('pending') && severity.toLowerCase().includes('high')) {
    animation = 'animate-pulse ring-4 ring-red-500/50'; // Blinking red ring
  } else if (status.toLowerCase().includes('solved')) {
    animation = 'opacity-80 transition-opacity duration-1000'; // Fade
  } else {
    animation = 'shadow-lg'; // Normal glow
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative flex items-center justify-center w-8 h-8 rounded-full ${color} ${shadowColor} ${animation} border-2 border-white text-foreground z-50">
             ${iconHtml}
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const getHighRiskIcon = (countText: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative flex items-center justify-center min-w-[32px] h-8 px-2 rounded-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.7)] animate-pulse border-2 border-white text-white font-bold text-sm z-50 whitespace-nowrap">
             ${countText}
           </div>`,
    iconSize: [40, 32], // Approximate size
    iconAnchor: [20, 16],
    popupAnchor: [0, -16]
  });
};

const HeatmapLayer = ({ points }: { points: any[] }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heatPoints = points.map(p => [p.lat, p.lng, p.intensity]);
    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);
  return null;
};

// Auto-zoomer
const FitBounds = ({ locations, district, station }: { locations: any[], district: string, station: string }) => {
  const map = useMap();
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      try {
        const bounds = L.latLngBounds(locations.map(p => [p.lat, p.lng]));
        if (bounds.isValid()) {
          // If station is selected, zoom tighter
          const zoomLevel = station ? 14 : (district ? 10 : 7);
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: zoomLevel, duration: 1.5 });
        }
      } catch (e) {
        console.error("Error setting bounds:", e);
      }
    } else {
      // Default to Karnataka if no data
      map.flyTo([15.3173, 75.7139], 7);
    }
  }, [locations, district, station, map]);

  return null;
};

export default function Heatmap() {
  const [searchParams] = useSearchParams();
  const initialDistrictName = searchParams.get('districtName');
  
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [policeStations, setPoliceStations] = useState<{ id: number; name: string }[]>([]);
  const [crimeTypes, setCrimeTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [summary, setSummary] = useState<any>(null);
  
  const { refreshCount } = useRefresh();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedCrimeType, setSelectedCrimeType] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [highRiskOnly, setHighRiskOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cluster' | 'heatmap'>('cluster');
  const [overlays, setOverlays] = useState<Record<string, boolean>>({});
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [hoveredCrime, setHoveredCrime] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<any>(null);

  const setOverlay = (id: string, value: boolean) => {
    setOverlays(prev => ({ ...prev, [id]: value }));
  };

  // Strict Karnataka Bounds
  const karnatakaBounds = L.latLngBounds([11.5, 74.0], [18.5, 78.5]);
  const defaultCenter: [number, number] = [15.3173, 75.7139]; 
  const defaultZoom = 7;

  useEffect(() => {
    fetch('http://localhost:8000' + '/api/map/district')
      .then(res => res.json())
      .then(data => {
        setDistricts(data);
        if (initialDistrictName) {
          const found = data.find((d: any) => d.name.toLowerCase() === initialDistrictName.toLowerCase());
          if (found) {
            setSelectedDistrict(found.id.toString());
          }
        }
      })
      .catch(err => console.error("Error fetching districts", err));
      
    fetch('http://localhost:8000' + '/api/map/crime-types')
      .then(res => res.json())
      .then(data => setCrimeTypes(data))
      .catch(err => console.error("Error fetching crime types", err));
    fetch('http://localhost:8000' + '/api/map/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Error fetching notifications", err));
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      fetch(`http://localhost:8000/api/map/police-stations?district_id=${selectedDistrict}`)
        .then(res => res.json())
        .then(data => setPoliceStations(data))
        .catch(err => console.error("Error fetching police stations", err));
    } else {
      setPoliceStations([]);
      setSelectedStation('');
    }
  }, [selectedDistrict]);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, [selectedDistrict, selectedStation, selectedCrimeType, selectedSeverity, selectedStatus, highRiskOnly, viewMode, fromDate, toDate, refreshCount]);

  const fetchData = () => {
    let url = new URL(`http://localhost:8000/api/map/${viewMode === 'cluster' ? 'crime-location' : 'heatmap'}`);
    if (selectedDistrict) url.searchParams.append('district_id', selectedDistrict);
    
    if (viewMode === 'cluster') {
      if (selectedStation) url.searchParams.append('station_id', selectedStation);
      if (selectedCrimeType) url.searchParams.append('crime_type', selectedCrimeType);
      if (selectedSeverity) url.searchParams.append('severity', selectedSeverity);
      if (selectedStatus) url.searchParams.append('status', selectedStatus);
      if (highRiskOnly) url.searchParams.append('high_risk_only', 'true');
    }
    
    if (fromDate) url.searchParams.append('from_date', fromDate);
    if (toDate) url.searchParams.append('to_date', toDate);
    url.searchParams.append('_t', refreshCount.toString());

    fetch(url.toString())
      .then(res => res.json())
      .then(data => {
        if (viewMode === 'cluster') setLocations(data);
        else setHeatmapPoints(data);
        setHoveredCrime(null);
        setActiveRoute(null);
      })
      .catch(err => console.error(`Error fetching ${viewMode} data`, err));
  };

  const fetchSummary = () => {
    let url = new URL('http://localhost:8000' + '/api/map/summary');
    if (selectedDistrict) url.searchParams.append('district_id', selectedDistrict);
    if (selectedStation) url.searchParams.append('station_id', selectedStation);
    if (selectedCrimeType) url.searchParams.append('crime_type', selectedCrimeType);
    if (selectedSeverity) url.searchParams.append('severity', selectedSeverity);
    if (selectedStatus) url.searchParams.append('status', selectedStatus);
    if (highRiskOnly) url.searchParams.append('high_risk_only', 'true');
    if (fromDate) url.searchParams.append('from_date', fromDate);
    if (toDate) url.searchParams.append('to_date', toDate);
    url.searchParams.append('_t', refreshCount.toString());
    
    fetch(url.toString())
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Error fetching summary data", err));
  };

  return (
    <div className="flex h-full flex-col bg-background font-sans text-foreground overflow-hidden rounded-xl border border-border">
      
      {/* Dark Map Styles */}
      <style>{`
        .leaflet-container {
          background: var(--background) !important;
        }
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .marker-cluster div {
          background-color: rgba(30, 41, 59, 0.9) !important;
          color: white !important;
          border: 2px solid rgba(59, 130, 246, 0.5);
          font-weight: bold;
        }
        .marker-cluster-small { background-color: rgba(59, 130, 246, 0.6) !important; }
        .marker-cluster-medium { background-color: rgba(249, 115, 22, 0.6) !important; }
        .marker-cluster-large { background-color: rgba(239, 68, 68, 0.6) !important; }
        .advanced-popup .leaflet-popup-content-wrapper {
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          padding: 0;
        }
        .advanced-popup .leaflet-popup-tip {
          background: #0f172a;
          border: 1px solid #334155;
        }
        .advanced-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
      `}</style>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4 relative z-0">
        
        {/* Sidebar */}
        <AdvancedFilterSidebar 
          districts={districts}
          policeStations={policeStations}
          crimeTypes={crimeTypes}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          selectedCrimeType={selectedCrimeType}
          setSelectedCrimeType={setSelectedCrimeType}
          selectedSeverity={selectedSeverity}
          setSelectedSeverity={setSelectedSeverity}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          viewMode={viewMode}
          setViewMode={setViewMode}
          recordCount={viewMode === 'cluster' ? locations.length : heatmapPoints.length}
          overlays={overlays}
          setOverlay={setOverlay}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
        />

        {/* Map & Summary Cards Container */}
        <div className="flex-1 flex flex-col gap-4 relative">
          
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Crimes" value={summary?.total_crimes || 0} icon={ShieldAlert} colorClass="from-blue-500/20 to-blue-900/20 text-blue-400" onClick={() => { setSelectedStatus(''); setHighRiskOnly(false); setViewMode('cluster'); }} />
            <SummaryCard title="Pending Cases" value={summary?.pending_cases || 0} icon={Activity} colorClass="from-orange-500/20 to-orange-900/20 text-orange-400" onClick={() => { setSelectedStatus('Pending'); setHighRiskOnly(false); setViewMode('cluster'); }} />
            <SummaryCard title="Solved Cases" value={summary?.solved_cases || 0} icon={CheckCircle} colorClass="from-green-500/20 to-green-900/20 text-green-400" onClick={() => { setSelectedStatus('Closed'); setHighRiskOnly(false); setViewMode('cluster'); }} />
            <SummaryCard title="High Risk Areas" value={summary?.high_risk_areas || 0} icon={MapPin} colorClass="from-red-500/20 to-red-900/20 text-red-400" onClick={() => { setHighRiskOnly(true); setSelectedStatus(''); setViewMode('cluster'); }} />
          </div>

          {/* Map Area */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-2xl relative z-0">
            <MapContainer 
              center={defaultCenter} 
              zoom={defaultZoom} 
              style={{ height: '100%', width: '100%' }} 
              zoomControl={true} 
              attributionControl={false}
              maxBounds={karnatakaBounds}
              maxBoundsViscosity={1.0}
              minZoom={6}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {viewMode === 'cluster' && !highRiskOnly && (
                <>
                  <MarkerClusterGroup 
                    chunkedLoading 
                    maxClusterRadius={40} 
                    spiderfyOnMaxZoom={true} 
                    showCoverageOnHover={false}
                  >
                    {locations.map((loc, idx) => (
                      <Marker 
                        key={idx} 
                        position={[loc.lat, loc.lng]} 
                        icon={getCustomIcon(loc.crime_type, loc.status, loc.severity)}
                        eventHandlers={{
                          mouseover: () => setHoveredCrime(loc),
                          mouseout: () => setHoveredCrime(null)
                        }}
                      >
                        <AdvancedMarkerPopup loc={loc} onRouteClick={() => {
                          // Simulate PS coordinates slightly offset to show a route
                          const psLat = loc.lat + (Math.random() * 0.002 - 0.001);
                          const psLng = loc.lng + (Math.random() * 0.002 - 0.001);
                          setActiveRoute([[psLat, psLng], [loc.lat, loc.lng]]);
                        }} />
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                  <FitBounds locations={locations} district={selectedDistrict} station={selectedStation} />
                </>
              )}

              {viewMode === 'cluster' && highRiskOnly && (
                <>
                  {locations.map((loc, idx) => {
                    const countStr = loc.fir_no ? loc.fir_no.replace('Total Cases: ', '').trim() : '';
                    return (
                      <Marker 
                        key={idx} 
                        position={[loc.lat, loc.lng]} 
                        icon={getHighRiskIcon(countStr)}
                        eventHandlers={{
                          mouseover: () => setHoveredCrime(loc),
                          mouseout: () => setHoveredCrime(null)
                        }}
                      >
                        <AdvancedMarkerPopup loc={loc} onRouteClick={() => {
                          const psLat = loc.lat + (Math.random() * 0.002 - 0.001);
                          const psLng = loc.lng + (Math.random() * 0.002 - 0.001);
                          setActiveRoute([[psLat, psLng], [loc.lat, loc.lng]]);
                        }} />
                      </Marker>
                    );
                  })}
                  <FitBounds locations={locations} district={selectedDistrict} station={selectedStation} />
                </>
              )}

              {viewMode === 'heatmap' && (
                <>
                  <HeatmapLayer points={heatmapPoints} />
                  <FitBounds locations={heatmapPoints} district={selectedDistrict} station={selectedStation} />
                </>
              )}

              {/* Hover Interactions: 500m radius circle */}
              {hoveredCrime && (
                <Circle 
                  center={[hoveredCrime.lat, hoveredCrime.lng]} 
                  radius={500} 
                  pathOptions={{ color: 'cyan', fillColor: 'cyan', fillOpacity: 0.1, weight: 1, dashArray: '4' }} 
                />
              )}

              {/* Active Route (Patrol Route) */}
              {activeRoute && (
                <Polyline 
                  positions={activeRoute} 
                  pathOptions={{ color: 'red', weight: 4, dashArray: '5, 10', className: 'animate-pulse' }} 
                />
              )}

              {/* External Overlays */}
              {overlays['hospitals'] && (
                <>
                  <Circle center={[15.35, 75.7]} radius={5000} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }} />
                </>
              )}
            </MapContainer>
            
            {/* Overlay Map UI Elements */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
              <button 
                onClick={() => {
                  setSelectedDistrict('');
                  setSelectedStation('');
                  setSelectedCrimeType('');
                  setSelectedSeverity('');
                  setSelectedStatus('');
                }}
                className="relative bg-card/90 backdrop-blur border border-border text-foreground p-3 rounded-lg shadow-lg hover:bg-secondary hover:text-blue-400 transition-colors group"
                title="Reset all filters"
              >
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              </button>
              
              <button className="relative bg-card/90 backdrop-blur border border-border text-foreground p-3 rounded-lg shadow-lg hover:bg-secondary transition-colors group">
                <Bell size={20} className="text-yellow-400 group-hover:animate-bounce" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {notifications.length}
                  </span>
                )}
                
                {/* Notification Popup on hover */}
                <div className="absolute top-full right-0 mt-2 w-64 bg-secondary border border-border rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
                  <div className="p-3 border-b border-border bg-card/50">
                    <h4 className="text-sm font-bold text-foreground">Alerts</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                    {notifications.length > 0 ? notifications.map((n, i) => (
                      <div key={i} className="mb-2 last:mb-0 p-2 rounded border-border/30 border border-slate-600/50">
                        <h5 className="text-xs font-bold text-red-400 mb-1">{n.title}</h5>
                        <p className="text-[10px] text-foreground leading-tight">{n.message}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground text-center py-4">No new alerts</p>}
                  </div>
                </div>
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
