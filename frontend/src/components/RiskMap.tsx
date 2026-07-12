import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, CircleMarker, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldAlert, TrendingUp, Activity, Users, MapPin, Eye, Zap, Crosshair, AlertTriangle, Maximize, RefreshCw, Download, Layers } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLanguage } from '../contexts/LanguageContext';

interface RiskMapProps {
  hotspots: any[];
  layer: string;
  onCompareToggle?: () => void;
  routeData?: any;
}

// Custom Icons
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color}; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border: 2px solid white;
        box-shadow: 0 0 10px ${color};
        color: white;
      ">
        ${iconHtml}
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const ICONS = {
  pink_dot: createCustomIcon('#ec4899', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path></svg>'),
  laptop: createCustomIcon('#06b6d4', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>'),
  phone: createCustomIcon('#06b6d4', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'),
  card: createCustomIcon('#06b6d4', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>'),
  moon: createCustomIcon('#6366f1', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'),
  shield: createCustomIcon('#3b82f6', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'),
  car: createCustomIcon('#10b981', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="10" width="20" height="10" rx="2" ry="2"></rect><path d="M4 10l2-6h12l2 6"></path></svg>'),
  calendar: createCustomIcon('#a855f7', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'),
  red_square: L.divIcon({
    html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border: 1px solid #7f1d1d; box-shadow: 0 0 8px #ef4444;"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  }),
};

function MapUpdater({ hotspots }: { hotspots: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (hotspots.length > 0) {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      hotspots.forEach(hs => {
        const checkPoint = (lat: number, lng: number) => {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        };
        
        if (hs.geometry_type === 'polygon' || hs.geometry_type === 'polyline') {
          hs.coordinates.forEach((p: any) => checkPoint(p[0], p[1]));
        } else {
          checkPoint(hs.coordinates[0], hs.coordinates[1]);
        }
      });
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      map.flyTo([centerLat, centerLng], 12, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [hotspots, map]);

  return null;
}

export function RiskMap({ hotspots, layer, onCompareToggle, routeData }: RiskMapProps) {
  const { language } = useLanguage();
  const karnatakaBounds = L.latLngBounds([11.5, 74.0], [18.5, 78.5]);
  const mapCenter: [number, number] = [15.3173, 75.7139];

  const handleExport = () => {
    alert("Exporting Intelligence Report (PDF)...");
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const renderTooltip = (hs: any) => {
    const risk = hs.risk_score || 50;
    const dashArray = 2 * Math.PI * 18;
    const dashOffset = dashArray * ((100 - risk) / 100);

    return (
      <Tooltip className="risk-tooltip" direction="top" sticky offset={[0, -10]}>
        <div className="w-72 bg-card border border-border shadow-2xl rounded-lg overflow-hidden backdrop-blur-md pointer-events-auto">
          <div className="p-3 bg-secondary/80 border-b border-border flex items-center justify-between">
            <h4 className="font-bold text-foreground text-sm truncate flex items-center gap-1.5 flex-1 pr-2">
              {hs.name}
            </h4>
            {hs.risk_score && (
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="#1e293b" strokeWidth="3" />
                  <circle 
                    cx="20" cy="20" r="18" fill="none" 
                    stroke={risk > 80 ? '#ef4444' : risk > 50 ? '#f97316' : '#22c55e'} 
                    strokeWidth="3" 
                    strokeDasharray={dashArray} 
                    strokeDashoffset={dashOffset} 
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-foreground">{risk}%</span>
              </div>
            )}
          </div>
          <div className="p-3 space-y-2">
            {Object.entries(hs.details).map(([k, v]: [string, any], i) => (
              <div key={i} className="flex justify-between items-start text-xs border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{k}</span>
                <span className={`font-bold text-right max-w-[60%] ${k.includes('Growth') ? 'text-orange-500' : k.includes('Recommendation') ? 'text-blue-400' : 'text-foreground'}`}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          {hs.details['AI Recommendation'] && (
            <div className="p-2 bg-background flex gap-2">
              <button className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-foreground text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors">
                <ShieldAlert size={12}/> Deploy
              </button>
              <button className="flex-1 py-1.5 bg-secondary hover:border-border text-foreground text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors">
                <Eye size={12}/> View Cases
              </button>
            </div>
          )}
        </div>
      </Tooltip>
    );
  };

  const renderLegend = () => {
    let legendItems: { label: string, color?: string, icon?: React.ReactNode, dashed?: boolean, border?: string }[] = [];
    let title = "Map Legend";
    let desc = "";

    switch(layer) {
      case 'active':
        title = language === 'kn' ? "ಸಕ್ರಿಯ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು" : "Active Hotspots";
        desc = language === 'kn' ? "ಪ್ರಸ್ತುತ ಸಕ್ರಿಯವಾಗಿರುವ ಹೆಚ್ಚಿನ ಅಪಾಯದ ಅಪರಾಧ ವಲಯಗಳು." : "Currently active high-risk crime zones.";
        legendItems = [{ label: language === 'kn' ? "ಹೆಚ್ಚಿನ ಅಪಾಯದ ಪಾಲಿಗಾನ್" : "High Risk Polygon", color: "#ef4444" }];
        break;
      case 'emerging':
        title = "Emerging Zones";
        desc = "Areas with rapidly increasing crime rates.";
        legendItems = [{ label: "Rapid Growth (Pulsing)", color: "#f97316" }];
        break;
      case 'future_predictions':
        title = "Future Predictions";
        desc = "AI forecasted crime hotspots for tomorrow.";
        legendItems = [{ label: "Predicted Zone", color: "#3b82f6", dashed: true }];
        break;
      case 'severity':
        title = "Severity Layer";
        desc = "Zones classified by severity of offenses.";
        legendItems = [
          { label: "Critical", color: "#ef4444" },
          { label: "High", color: "#f97316" },
          { label: "Medium", color: "#eab308" },
          { label: "Low", color: "#22c55e" },
        ];
        break;
      case 'womens_safety':
        title = "Women's Safety";
        desc = "Incidents and vulnerabilities affecting women.";
        legendItems = [
          { label: "Reported Incident", color: "#ec4899" },
          { label: "Unsafe Street (Poor Lighting)", color: "#ef4444", dashed: false }
        ];
        break;
      case 'cyber':
        title = "Cyber Crime";
        desc = "Digital fraud and cyber attack clusters.";
        legendItems = [
          { label: "Phishing / Scam Node", color: "#06b6d4" },
        ];
        break;
      case 'night':
        title = "Night Crimes";
        desc = "Crimes occurring between 6 PM and 6 AM.";
        legendItems = [{ label: "Night Incident", color: "#6366f1" }];
        break;
      case 'patrol':
        title = "Patrol Coverage";
        desc = "Live police unit deployments and routes.";
        legendItems = [
          { label: "Police Station", color: "#3b82f6" },
          { label: "Patrol Route", color: "#22c55e", dashed: true },
          { label: "Active Vehicle", color: "#10b981" },
        ];
        break;
      case 'traffic':
        title = "Traffic Overlay";
        desc = "Live traffic congestion affecting response times.";
        legendItems = [{ label: "Severe Congestion", color: "#ef4444" }];
        break;
      case 'weather':
        title = "Weather Overlay";
        desc = "Extreme weather cells (e.g. heavy rain/fog).";
        legendItems = [{ label: "Rain/Storm Cell", color: "#94a3b8" }];
        break;
      case 'events':
        title = "Events Overlay";
        desc = "Major public events requiring crowd control.";
        legendItems = [{ label: "Public Event", color: "#a855f7" }]; // purple
        break;
    }

    return (
      <div className="absolute top-4 left-4 z-[400] w-64 bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl pointer-events-none">
        <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
        <p className="text-[10px] text-muted-foreground mb-3 leading-tight">{desc}</p>
        <div className="space-y-2">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {item.dashed ? (
                <div className="w-5 h-0 border-t-2 border-dashed border-opacity-80" style={{ borderColor: item.color }}></div>
              ) : item.icon ? (
                <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
              ) : (
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color, border: item.border ? `1px solid ${item.border}` : 'none' }}></div>
              )}
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-background z-0 group" id="risk-map-container">
      <style>{`
        .leaflet-container { background: #0f172a !important; }
        .leaflet-layer, .leaflet-control-zoom-in, .leaflet-control-zoom-out, .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .risk-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-tooltip-tip { display: none; }
        path.leaflet-interactive { transition: fill 0.8s ease, stroke 0.8s ease, fill-opacity 0.8s ease, stroke-dashoffset 2s linear; }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .emerging-pulse {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes severity-pulse {
          0% { fill-opacity: 0.4; }
          50% { fill-opacity: 0.8; }
          100% { fill-opacity: 0.4; }
        }
        .severity-critical {
          animation: severity-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      
      {/* Map Utilities (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {onCompareToggle && (
           <button onClick={onCompareToggle} className="bg-card/90 hover:bg-blue-600 border border-border text-foreground p-2.5 rounded-lg shadow-lg backdrop-blur-md transition-colors flex items-center gap-2 group/btn" title="Compare Mode">
             <Layers size={18} />
             <span className="text-xs font-bold w-0 overflow-hidden group-hover/btn:w-auto transition-all">COMPARE</span>
           </button>
        )}
        <button onClick={handleFullscreen} className="bg-card/90 hover:bg-secondary border border-border text-foreground p-2.5 rounded-lg shadow-lg backdrop-blur-md transition-colors" title="Fullscreen">
          <Maximize size={18} />
        </button>
        <button onClick={() => window.dispatchEvent(new Event('resize'))} className="bg-card/90 hover:bg-secondary border border-border text-foreground p-2.5 rounded-lg shadow-lg backdrop-blur-md transition-colors" title="Reset View">
          <RefreshCw size={18} />
        </button>
        <button onClick={handleExport} className="bg-card/90 hover:bg-secondary border border-border text-foreground p-2.5 rounded-lg shadow-lg backdrop-blur-md transition-colors" title="Export Report">
          <Download size={18} />
        </button>
      </div>

      <MapContainer 
        center={mapCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false} 
        attributionControl={false}
        maxBounds={karnatakaBounds}
        maxBoundsViscosity={1.0}
        minZoom={6}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />
        <MapUpdater hotspots={hotspots} />
        
        {/* Sector Grid Overlay to simulate boundaries */}
        <Polygon 
          positions={[[15.2, 75.6], [15.4, 75.6], [15.4, 75.8], [15.2, 75.8]]} 
          pathOptions={{ color: '#334155', weight: 1, fillOpacity: 0, dashArray: '5, 5' }} 
        />
        <Polygon 
          positions={[[15.4, 75.6], [15.6, 75.6], [15.6, 75.8], [15.4, 75.8]]} 
          pathOptions={{ color: '#334155', weight: 1, fillOpacity: 0, dashArray: '5, 5' }} 
        />
        <Polygon 
          positions={[[15.2, 75.8], [15.4, 75.8], [15.4, 76.0], [15.2, 76.0]]} 
          pathOptions={{ color: '#334155', weight: 1, fillOpacity: 0, dashArray: '5, 5' }} 
        />

        {renderLegend()}

        {hotspots.map((hs) => {
          if (hs.geometry_type === 'polygon') {
            return (
              <Polygon 
                key={hs.id} 
                positions={hs.coordinates}
                className={hs.color === 'red' && layer === 'severity' ? 'severity-critical' : ''}
                pathOptions={{
                  color: hs.color,
                  fillColor: hs.fill_color,
                  fillOpacity: layer === 'future_predictions' ? 0.2 : 0.4,
                  weight: layer === 'future_predictions' ? 2 : 1,
                  dashArray: layer === 'future_predictions' ? '10, 10' : ''
                }}
              >
                {renderTooltip(hs)}
              </Polygon>
            );
          }
          
          if (hs.geometry_type === 'circle') {
            return (
              <Circle 
                key={hs.id} 
                center={hs.coordinates} 
                radius={hs.radius}
                className={layer === 'emerging' ? 'emerging-pulse' : ''}
                pathOptions={{
                  color: hs.color,
                  fillColor: hs.fill_color,
                  fillOpacity: layer === 'weather' ? 0.1 : layer === 'traffic' ? 0.5 : 0.3,
                  weight: layer === 'weather' ? 0 : 2,
                  className: layer === 'traffic' ? 'severity-critical' : ''
                }}
              >
                {renderTooltip(hs)}
              </Circle>
            );
          }
          
          if (hs.geometry_type === 'marker') {
            const icon = ICONS[hs.icon as keyof typeof ICONS] || ICONS.pink_dot;
            return (
              <Marker key={hs.id} position={hs.coordinates} icon={icon}>
                {renderTooltip(hs)}
              </Marker>
            );
          }
          
          if (hs.geometry_type === 'polyline') {
            return (
              <Polyline 
                key={hs.id} 
                positions={hs.coordinates}
                pathOptions={{
                  color: hs.color,
                  weight: hs.color === 'red' ? 4 : 3,
                  opacity: 0.8,
                  dashArray: hs.color === 'green' ? '5, 10' : ''
                }}
              >
                {renderTooltip(hs)}
              </Polyline>
            );
          }
          
          return null;
        })}
        
        {routeData && routeData.coordinates && (
          <>
            <Polyline 
              positions={routeData.coordinates}
              pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
            >
              <Tooltip permanent>
                <div className="font-sans text-xs">
                  <div>Route Found</div>
                  <div className="text-muted-foreground">Time: {Math.round(routeData.summary.travelTimeInSeconds / 60)} mins</div>
                  {routeData.summary.trafficDelayInSeconds > 0 && (
                    <div className="text-red-500">Traffic Delay: +{Math.round(routeData.summary.trafficDelayInSeconds / 60)} mins</div>
                  )}
                </div>
              </Tooltip>
            </Polyline>
            
            {/* Simulated Traffic Congestion (Red Dotted Line) */}
            {routeData.summary.trafficDelayInSeconds > 0 && routeData.coordinates.length > 5 && (
              <Polyline 
                positions={routeData.coordinates.slice(
                  Math.floor(routeData.coordinates.length * 0.4),
                  Math.floor(routeData.coordinates.length * 0.6)
                )}
                pathOptions={{ color: '#ef4444', weight: 6, opacity: 1, dashArray: '6, 8' }}
              />
            )}
            
            {/* Alternative Route (Clear/Low Traffic) */}
            {routeData.alternative && (
              <Polyline 
                positions={routeData.alternative.coordinates}
                pathOptions={{ color: '#10b981', weight: 4, opacity: 0.7, dashArray: '5, 10' }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-xs">
                    <div className="text-green-500 font-bold mb-1">Alternative Route (Low Traffic)</div>
                    <div className="text-muted-foreground">Time: {Math.round(routeData.alternative.summary.travelTimeInSeconds / 60)} mins</div>
                  </div>
                </Tooltip>
              </Polyline>
            )}

            {/* Animated Traffic Hotspots */}
            {routeData.trafficHotspots && routeData.trafficHotspots.map((point: any, idx: number) => (
              <CircleMarker
                key={`traffic-hotspot-${idx}`}
                center={point}
                radius={12}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.5,
                  weight: 2,
                  className: 'severity-critical'
                }}
              >
                <Tooltip>Severe Traffic Congestion</Tooltip>
              </CircleMarker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}
