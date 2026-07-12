import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search } from 'lucide-react';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({ 
  lat, 
  lng, 
  onChange 
}: { 
  lat: number, 
  lng: number, 
  onChange: (lat: number, lng: number) => void 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        onChange(newLat, newLng);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error(err);
      alert("Error searching location.");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full h-[300px] mt-2 mb-4 animate-in fade-in zoom-in duration-200">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search location (e.g. KBC Plaza, Bangalore Urban)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-8 pr-3 py-1.5 bg-secondary border border-border rounded text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <button 
          type="button" 
          onClick={handleSearch}
          disabled={searching}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition-colors"
        >
          {searching ? '...' : 'Search'}
        </button>
      </div>
      
      <div className="flex-1 rounded-lg overflow-hidden border border-border relative z-0 shadow-inner">
        <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-dark" />
          <MapUpdater center={[lat, lng]} />
          <MapEvents onLocationSelect={onChange} />
          <Marker position={[lat, lng]} icon={customIcon} draggable={true} eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onChange(position.lat, position.lng);
            }
          }} />
        </MapContainer>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Click on the map or drag the pin to set the location precisely.</p>
    </div>
  );
}
