import React, { useState } from 'react';
import { SatelliteRealtimeState, SatelliteTLE, GroundStation } from '../types/satellite';
import { Radio, ShieldCheck, Copy, Check, Volume2, Globe, FileText, ArrowRight, Zap, Orbit, Compass, Clock } from 'lucide-react';
import { audioBeacon } from '../utils/audioBeacon';

interface SatelliteDetailPanelProps {
  state: SatelliteRealtimeState | null;
  tle: SatelliteTLE | null;
  groundStation: GroundStation;
  onOpenComplianceModal: () => void;
}

export const SatelliteDetailPanel: React.FC<SatelliteDetailPanelProps> = ({
  state,
  tle,
  groundStation,
  onOpenComplianceModal,
}) => {
  const [copiedTle, setCopiedTle] = useState(false);
  const [isPlayingMorse, setIsPlayingMorse] = useState(false);

  if (!state || !tle) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 text-center text-xs text-slate-400 font-mono">
        Select a satellite on the map or radar to inspect real-time aerospace telemetry.
      </div>
    );
  }

  const handleCopyTle = () => {
    const raw = `${tle.name}\n${tle.line1}\n${tle.line2}`;
    navigator.clipboard.writeText(raw);
    setCopiedTle(true);
    setTimeout(() => setCopiedTle(false), 2000);
  };

  const handlePlayMorse = () => {
    setIsPlayingMorse(true);
    audioBeacon.playMorseBeacon(tle.callsign || 'SKYROOT');
    setTimeout(() => setIsPlayingMorse(false), 3000);
  };

  const isSkyroot = tle.category === 'skyroot';

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)]">
              {tle.category.toUpperCase()}
            </span>
            <span className="font-mono text-xs text-slate-400">NORAD #{tle.noradId}</span>
            <span className="font-mono text-xs text-slate-400">COSPAR: {tle.intlDesignator}</span>
          </div>
          <h2 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-wide">{tle.name}</h2>
          <p className="mt-0.5 text-xs text-slate-400 max-w-2xl">{tle.purpose}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {tle.callsign && (
            <button
              onClick={handlePlayMorse}
              disabled={isPlayingMorse}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-750 disabled:opacity-50 transition-colors"
              title={`Play Telemetry Morse Callsign: ${tle.callsign}`}
            >
              <Volume2 className={`h-3.5 w-3.5 ${isPlayingMorse ? 'animate-bounce text-orange-400' : 'text-slate-400'}`} />
              <span>{isPlayingMorse ? 'Beeping...' : `Beacon (${tle.callsign})`}</span>
            </button>
          )}

          <button
            onClick={handleCopyTle}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-750 transition-colors"
            title="Copy 2-Line Element Set to Clipboard"
          >
            {copiedTle ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copiedTle ? 'Copied' : 'Copy TLE'}</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Sections */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Section 1: Real-time Ephemeris Coordinates */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
            <Globe className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Sub-Satellite Coordinates</span>
          </div>
          <div className="mt-2.5 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Latitude:</span>
              <span className="text-white font-medium tabular-nums">
                {Math.abs(state.latitude).toFixed(4)}° {state.latitude >= 0 ? 'N' : 'S'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Longitude:</span>
              <span className="text-white font-medium tabular-nums">
                {Math.abs(state.longitude).toFixed(4)}° {state.longitude >= 0 ? 'E' : 'W'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altitude:</span>
              <span className="text-orange-400 font-medium tabular-nums">{state.altitudeKm.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Velocity:</span>
              <span className="text-white font-medium tabular-nums">
                {state.velocityKmS.toFixed(3)} km/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Footprint Dia:</span>
              <span className="text-slate-300 font-medium tabular-nums">
                {(state.footprintRadiusKm * 2).toFixed(0)} km
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Topocentric Observer Look Angles */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
            <Compass className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Ground Observer Angles</span>
          </div>
          <div className="mt-2.5 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Station:</span>
              <span className="text-orange-400 font-medium truncate max-w-[120px]">{groundStation.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Azimuth:</span>
              <span className="text-white font-medium tabular-nums">{state.azimuthDeg.toFixed(1)}° True</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elevation:</span>
              <span className={`font-medium tabular-nums ${state.elevationDeg > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {state.elevationDeg.toFixed(2)}° ({state.elevationDeg > 0 ? 'Above Horizon' : 'LOS Occulted'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Slant Range:</span>
              <span className="text-orange-400 font-medium tabular-nums">
                {state.slantRangeKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Range Rate:</span>
              <span className="text-white font-medium tabular-nums">
                {state.rangeRateKmS > 0 ? '+' : ''}{state.rangeRateKmS.toFixed(2)} km/s
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Keplerian Orbital Elements */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
            <Orbit className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Keplerian Elements</span>
          </div>
          <div className="mt-2.5 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Inclination:</span>
              <span className="text-white font-medium tabular-nums">{state.inclinationDeg.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Apogee / Perigee:</span>
              <span className="text-white font-medium tabular-nums">
                {state.apogeeKm.toFixed(0)} / {state.perigeeKm.toFixed(0)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Orbital Period:</span>
              <span className="text-white font-medium tabular-nums">{state.orbitalPeriodMin.toFixed(2)} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Eccentricity:</span>
              <span className="text-white font-medium tabular-nums">{state.eccentricity.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Epoch Age:</span>
              <span className="text-slate-300 font-medium tabular-nums">{state.epochAgeDays.toFixed(2)} days</span>
            </div>
          </div>
        </div>

        {/* Section 4: RF Link Budget & Space Law Status */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
            <Radio className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider">RF & Legal Status</span>
          </div>
          <div className="mt-2.5 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">RF Band:</span>
              <span className="text-white font-medium">{tle.rfBand || 'UHF/S-Band'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Doppler Offset:</span>
              <span className="text-cyan-400 font-medium tabular-nums">
                {state.dopplerShiftHz > 0 ? '+' : ''}{(state.dopplerShiftHz / 1000).toFixed(2)} kHz
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Path Loss (FSPL):</span>
              <span className="text-white font-medium tabular-nums">{state.freeSpacePathLossDb.toFixed(1)} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Authorization:</span>
              <span className="text-emerald-400 font-medium truncate max-w-[120px]">
                {tle.licenseStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">UN Reg ID:</span>
              <button
                onClick={onOpenComplianceModal}
                className="text-orange-400 hover:underline flex items-center gap-0.5 transition-colors"
              >
                <span>{tle.unRegistrationCode || 'COPUOS-REG'}</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Raw TLE Box */}
      <div className="mt-4 rounded-lg bg-slate-950 border border-slate-800/80 p-3 font-mono text-[11px] text-slate-400 overflow-x-auto">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
          NORAD Two-Line Element (TLE) Ephemeris Block:
        </div>
        <div className="text-slate-200">{tle.name}</div>
        <div className="text-orange-300/90 whitespace-pre">{tle.line1}</div>
        <div className="text-orange-300/90 whitespace-pre">{tle.line2}</div>
      </div>
    </div>
  );
};
