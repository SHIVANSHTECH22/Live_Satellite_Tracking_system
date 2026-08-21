import React from 'react';
import { Crosshair, Navigation, Wifi, Sun, Moon, ArrowUpRight, Gauge, Radio, ShieldAlert } from 'lucide-react';
import { SatelliteRealtimeState, SatelliteTLE, GroundStation } from '../types/satellite';

interface NearestSatelliteHUDProps {
  nearestState: SatelliteRealtimeState | null;
  nearestTle: SatelliteTLE | null;
  allRealtimeStates: SatelliteRealtimeState[];
  catalog: SatelliteTLE[];
  selectedSatId: string;
  onSelectSatellite: (id: string) => void;
  groundStation: GroundStation;
}

export const NearestSatelliteHUD: React.FC<NearestSatelliteHUDProps> = ({
  nearestState,
  nearestTle,
  allRealtimeStates,
  catalog,
  selectedSatId,
  onSelectSatellite,
  groundStation,
}) => {
  if (!nearestState || !nearestTle) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 text-center text-xs text-slate-400 font-mono">
        Propagating orbital parameters...
      </div>
    );
  }

  const isSelected = selectedSatId === nearestState.id;
  const isOverhead = nearestState.elevationDeg > 0;

  // Find top 4 closest satellites to observer
  const sortedCloseSats = [...allRealtimeStates]
    .sort((a, b) => a.slantRangeKm - b.slantRangeKm)
    .slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-slate-900/70 backdrop-blur-xl p-4 shadow-[0_0_25px_rgba(249,115,22,0.06)]">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
          </span>
          <span className="font-mono text-xs font-semibold tracking-wide uppercase text-orange-400">
            Nearest Target In Observer Proximity
          </span>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700/50">
            From {groundStation.name}
          </span>
        </div>

        {/* Action Button: Lock Nearest */}
        <div className="flex items-center gap-2">
          {sortedCloseSats.map((sat) => {
            const satTle = catalog.find((c) => c.id === sat.id);
            return (
              <button
                key={sat.id}
                onClick={() => onSelectSatellite(sat.id)}
                className={`hidden md:inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] transition-all ${
                  sat.id === selectedSatId
                    ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
                title={`Slant Range: ${sat.slantRangeKm.toFixed(0)} km`}
              >
                <span>{satTle?.category === 'skyroot' ? '🚀' : '🛰️'}</span>
                <span className="truncate max-w-[85px]">{sat.name}</span>
                <span className="text-slate-500">({sat.slantRangeKm.toFixed(0)} km)</span>
              </button>
            );
          })}

          <button
            onClick={() => onSelectSatellite(nearestState.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all font-mono ${
              isSelected
                ? 'bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.4)] font-bold'
                : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>{isSelected ? 'Active Locked' : 'Track Nearest'}</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Name & NORAD */}
        <div className="col-span-2 sm:col-span-1 rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Target Asset</div>
          <div className="mt-1 font-semibold text-sm text-white truncate" title={nearestState.name}>
            {nearestState.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span>NORAD #{nearestState.noradId}</span>
            <span>•</span>
            <span className="text-orange-400">{nearestTle.licenseStatus}</span>
          </div>
        </div>

        {/* Slant Range (Distance to Ground Observer) */}
        <div className="rounded-lg bg-slate-950/70 border border-orange-500/20 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-orange-300">
            <span>Slant Range</span>
            <Navigation className="h-3 w-3 text-orange-400" />
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-orange-400 tabular-nums">
            {nearestState.slantRangeKm.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
            <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
            Range Rate: {nearestState.rangeRateKmS > 0 ? '+' : ''}
            {nearestState.rangeRateKmS.toFixed(2)} km/s
          </div>
        </div>

        {/* Elevation & Azimuth Look Angles */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>Look Angles</span>
            <ArrowUpRight className="h-3 w-3 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2 font-mono text-base font-bold text-white tabular-nums">
            <span className={isOverhead ? 'text-emerald-400' : 'text-slate-400'}>
              El: {nearestState.elevationDeg.toFixed(1)}°
            </span>
            <span className="text-slate-400 font-normal text-xs">Az: {nearestState.azimuthDeg.toFixed(0)}°</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px]">
            {isOverhead ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Wifi className="h-2.5 w-2.5" /> Line-of-Sight Acquired
              </span>
            ) : (
              <span className="text-slate-500">Below Local Horizon</span>
            )}
          </div>
        </div>

        {/* Altitude & Speed */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>Orbit & Velocity</span>
            <Gauge className="h-3 w-3 text-slate-400" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-white tabular-nums">
            {nearestState.altitudeKm.toFixed(0)}{' '}
            <span className="text-xs font-normal text-slate-400">km alt</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
            {nearestState.velocityKmS.toFixed(2)} km/s ({nearestState.velocityKmH.toFixed(0)} km/h)
          </div>
        </div>

        {/* RF Doppler & Band */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>RF Downlink</span>
            <Radio className="h-3 w-3 text-slate-400" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-white tabular-nums">
            {nearestTle.freqDownlinkMHz ? `${nearestTle.freqDownlinkMHz.toFixed(2)} MHz` : '437.50 MHz'}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-cyan-400 tabular-nums">
            Doppler: {nearestState.dopplerShiftHz > 0 ? '+' : ''}
            {(nearestState.dopplerShiftHz / 1000).toFixed(2)} kHz
          </div>
        </div>

        {/* Optical & Illumination Condition */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>Illumination</span>
            {nearestState.isSunlit ? (
              <Sun className="h-3 w-3 text-amber-400" />
            ) : (
              <Moon className="h-3 w-3 text-indigo-400" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-xs font-semibold">
            {nearestState.isSunlit ? (
              <span className="text-amber-400">Direct Sunlit</span>
            ) : (
              <span className="text-indigo-300">In Earth Umbra</span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
            Latency: {nearestState.signalLatencyMs.toFixed(2)} ms
          </div>
        </div>
      </div>
    </div>
  );
};
