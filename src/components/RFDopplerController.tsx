import React, { useState } from 'react';
import { SatelliteRealtimeState, SatelliteTLE, GroundStation } from '../types/satellite';
import { Radio, Wifi, Zap, Activity, Volume2, ShieldCheck, Terminal, Compass } from 'lucide-react';
import { audioBeacon } from '../utils/audioBeacon';

interface RFDopplerControllerProps {
  state: SatelliteRealtimeState | null;
  tle: SatelliteTLE | null;
  groundStation: GroundStation;
}

export const RFDopplerController: React.FC<RFDopplerControllerProps> = ({
  state,
  tle,
  groundStation,
}) => {
  const [customFreqMHz, setCustomFreqMHz] = useState<number>(
    tle?.freqDownlinkMHz || 437.525
  );
  const [txPowerWatts, setTxPowerWatts] = useState<number>(5);
  const [antennaGainDbi, setAntennaGainDbi] = useState<number>(14);

  if (!state || !tle) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-xs text-zinc-300 font-mono">
        Select a satellite to analyze RF Doppler telemetry and antenna rotor commands.
      </div>
    );
  }

  // Calculate Doppler for active custom frequency
  const speedOfLight = 299792.458;
  const dopplerShiftHz = -customFreqMHz * 1e6 * (state.rangeRateKmS / speedOfLight);
  const shiftedFreqHz = customFreqMHz * 1e6 + dopplerShiftHz;
  const shiftedFreqMHz = shiftedFreqHz / 1e6;

  // Path Loss & Link Budget
  const fsplDb = 20 * Math.log10(Math.max(1, state.slantRangeKm)) + 20 * Math.log10(customFreqMHz) + 32.44;
  const eirpDbw = 10 * Math.log10(txPowerWatts) + antennaGainDbi - 30;
  const receivedSignalDbw = eirpDbw - fsplDb + 2.0; // Assume 2 dBi satellite antenna gain

  // Antenna Rotor Command Formats (Easycomm / Yaesu GS-232 standard)
  const azCommand = Math.round(state.azimuthDeg).toString().padStart(3, '0');
  const elCommand = Math.max(0, Math.round(state.elevationDeg)).toString().padStart(3, '0');
  const easycommString = `AZ${azCommand} EL${elCommand}`;
  const gs232String = `W${azCommand} ${elCommand}`;

  const handleTestAudioPing = () => {
    audioBeacon.playPing(1000 + Math.round(dopplerShiftHz / 10), 0.2, 0.05);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-orange-400" />
            <span>RF Doppler & Antenna Slew Subsystem</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ITU frequency non-interference tracking & ground rotor commands for {tle.name}
          </p>
        </div>

        <button
          onClick={handleTestAudioPing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-750 transition-colors"
        >
          <Volume2 className="h-3.5 w-3.5 text-orange-400" />
          <span>Test Doppler Audio Pitch</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Doppler Shift Calculator */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-orange-400" />
              <span>Downlink Doppler Tuning</span>
            </div>

            {/* Nominal Frequency Input */}
            <div className="mt-3">
              <label className="block text-[11px] font-mono text-slate-400">Nominal Center Frequency (MHz)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={customFreqMHz}
                  onChange={(e) => setCustomFreqMHz(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm text-slate-100 focus:outline-none focus:border-orange-500/60"
                />
                <button
                  onClick={() => setCustomFreqMHz(tle.freqDownlinkMHz || 437.525)}
                  className="rounded-md border border-slate-700 bg-slate-850 px-2 py-1.5 text-[11px] font-mono text-slate-300 hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Preset Bands */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setCustomFreqMHz(145.800)}
                className="px-2 py-1 rounded bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white"
              >
                VHF (145.8 MHz)
              </button>
              <button
                onClick={() => setCustomFreqMHz(437.525)}
                className="px-2 py-1 rounded bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white"
              >
                UHF (437.525 MHz)
              </button>
              <button
                onClick={() => setCustomFreqMHz(2245.500)}
                className="px-2 py-1 rounded bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white"
              >
                S-Band (2.24 GHz)
              </button>
              <button
                onClick={() => setCustomFreqMHz(8450.000)}
                className="px-2 py-1 rounded bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white"
              >
                X-Band (8.45 GHz)
              </button>
            </div>

            {/* Calculated Values */}
            <div className="mt-4 space-y-2 rounded-lg bg-slate-900/80 p-3 font-mono text-xs border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Radial Velocity:</span>
                <span className="text-white font-semibold">
                  {state.rangeRateKmS > 0 ? '+' : ''}{state.rangeRateKmS.toFixed(3)} km/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Doppler Offset:</span>
                <span className="text-orange-400 font-bold">
                  {dopplerShiftHz > 0 ? '+' : ''}{dopplerShiftHz.toFixed(1)} Hz ({(dopplerShiftHz / 1000).toFixed(3)} kHz)
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">Doppler Corrected:</span>
                <span className="text-emerald-400 font-bold">
                  {shiftedFreqMHz.toFixed(6)} MHz
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] font-mono text-slate-500">
            Formula: Δf = -f₀ • (v_range / c)
          </div>
        </div>

        {/* Middle Column: Link Budget & Path Loss */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-orange-400" />
              <span>Link Budget & Path Loss</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400">TX Power (Watts)</label>
                <input
                  type="number"
                  value={txPowerWatts}
                  onChange={(e) => setTxPowerWatts(Math.max(0.1, Number(e.target.value)))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400">Ground Gain (dBi)</label>
                <input
                  type="number"
                  value={antennaGainDbi}
                  onChange={(e) => setAntennaGainDbi(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-lg bg-slate-900/80 p-3 font-mono text-xs border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Free Space Loss:</span>
                <span className="text-white font-semibold">{fsplDb.toFixed(1)} dB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TX EIRP:</span>
                <span className="text-white font-semibold">{eirpDbw.toFixed(1)} dBW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated RX Power:</span>
                <span className="text-orange-400 font-bold">{receivedSignalDbw.toFixed(1)} dBW</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">1-Way Latency:</span>
                <span className="text-white font-semibold">{state.signalLatencyMs.toFixed(2)} ms</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] font-mono text-slate-500">
            Compliant with ITU Article 5 & Space Research Service (SRS).
          </div>
        </div>

        {/* Right Column: Ground Station Antenna Rotor Controller */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-orange-400" />
              <span>Antenna Rotor Driver Interface</span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between rounded-md bg-slate-900 p-2.5 font-mono text-xs border border-slate-800">
                <span className="text-slate-400">Target Azimuth:</span>
                <span className="text-orange-400 font-bold text-sm">{state.azimuthDeg.toFixed(1)}° True</span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-slate-900 p-2.5 font-mono text-xs border border-slate-800">
                <span className="text-slate-400">Target Elevation:</span>
                <span className={`font-bold text-sm ${state.elevationDeg > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {state.elevationDeg.toFixed(1)}° {state.elevationDeg > 0 ? '(Active Track)' : '(Parked)'}
                </span>
              </div>
            </div>

            {/* Protocol Strings */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Serial Protocol Outflow:</div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-3 py-1.5 font-mono text-xs text-emerald-400 border border-slate-800">
                <span>Easycomm II:</span>
                <span className="font-bold">{easycommString}</span>
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-3 py-1.5 font-mono text-xs text-cyan-400 border border-slate-800">
                <span>Yaesu GS-232:</span>
                <span className="font-bold">{gs232String}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] font-mono text-slate-500">
            Connected to {groundStation.code} rotor servo controller.
          </div>
        </div>
      </div>
    </div>
  );
};
