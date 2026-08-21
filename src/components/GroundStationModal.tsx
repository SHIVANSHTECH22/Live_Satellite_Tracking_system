import React, { useState } from 'react';
import { GroundStation } from '../types/satellite';
import { DEFAULT_GROUND_STATIONS } from '../data/groundStations';
import { X, MapPin, Navigation, Check, Globe } from 'lucide-react';

interface GroundStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation: GroundStation;
  onSelectStation: (station: GroundStation) => void;
}

export const GroundStationModal: React.FC<GroundStationModalProps> = ({
  isOpen,
  onClose,
  currentStation,
  onSelectStation,
}) => {
  const [customLat, setCustomLat] = useState<string>(currentStation.latitude.toString());
  const [customLng, setCustomLng] = useState<string>(currentStation.longitude.toString());
  const [customAlt, setCustomAlt] = useState<string>(currentStation.altitudeMeters.toString());
  const [customName, setCustomName] = useState<string>('Custom Station');
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseBrowserLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const autoStation: GroundStation = {
          id: 'user-auto-gps',
          name: 'My Exact GPS Ground Station',
          code: 'MY-GPS',
          country: 'Local Observer',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitudeMeters: Math.round(pos.coords.altitude || 50),
          isUserLocation: true,
        };
        onSelectStation(autoStation);
        onClose();
      },
      (err) => {
        setGeoLocating(false);
        setGeoError(`Location access denied (${err.message}). Please select a station manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    const alt = parseFloat(customAlt) || 0;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setGeoError('Latitude must be between -90 and +90 degrees.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setGeoError('Longitude must be between -180 and +180 degrees.');
      return;
    }

    const newCustomStation: GroundStation = {
      id: `custom-${Date.now()}`,
      name: customName || 'Custom Ground Observer',
      code: customName.substring(0, 4).toUpperCase() || 'CUST',
      country: 'User Defined',
      latitude: lat,
      longitude: lng,
      altitudeMeters: alt,
    };

    onSelectStation(newCustomStation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Observer Ground Station Selection</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              All "Nearest Satellite", look angles (Az/El), and pass predictions are computed relative to this ground coordinate.
            </p>
          </div>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Quick Auto-GPS Button */}
          <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-orange-400" />
                  <span>Auto-Detect Current GPS Coordinates</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pinpoint the satellites passing directly over your real physical location.
                </p>
              </div>

              <button
                onClick={handleUseBrowserLocation}
                disabled={geoLocating}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500 text-xs disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)]"
              >
                <Navigation className={`h-3.5 w-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
                <span>{geoLocating ? 'Acquiring GPS...' : 'Use My GPS Location'}</span>
              </button>
            </div>

            {geoError && (
              <div className="mt-2 text-xs text-red-400 font-mono">
                {geoError}
              </div>
            )}
          </div>

          {/* Predefined Global & Skyroot Stations */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Select Aerospace Ground Station Preset:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_GROUND_STATIONS.map((st) => {
                const isSelected = currentStation.code === st.code;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSelectStation(st);
                      onClose();
                    }}
                    className={`flex items-start justify-between p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-950/30 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <span>{st.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{st.country}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-1">
                        Lat: {st.latitude.toFixed(2)}° • Lng: {st.longitude.toFixed(2)}° • Alt: {st.altitudeMeters}m
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                      {st.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Coordinates Form */}
          <form onSubmit={handleApplyCustom} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-orange-400" />
              <span>Or Enter Custom Coordinates:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400">Station Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500/60"
                  placeholder="My Backyard Yagi"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400">Latitude (-90 to +90)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500/60"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400">Longitude (-180 to +180)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500/60"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400">Altitude (m ASL)</label>
                <input
                  type="number"
                  value={customAlt}
                  onChange={(e) => setCustomAlt(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500/60"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-1.5 text-xs font-mono text-slate-100 hover:bg-slate-700 transition-colors"
              >
                Set Custom Coordinates
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
