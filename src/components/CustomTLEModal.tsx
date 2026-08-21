import React, { useState } from 'react';
import { SatelliteTLE } from '../types/satellite';
import { X, Plus, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import * as sgp4 from '../utils/sgp4';

interface CustomTLEModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomSatellite: (sat: SatelliteTLE) => void;
}

export const CustomTLEModal: React.FC<CustomTLEModalProps> = ({
  isOpen,
  onClose,
  onAddCustomSatellite,
}) => {
  const [name, setName] = useState('My Custom CubeSat');
  const [line1, setLine1] = useState('1 99999U 26001A   26233.12000000  .00001000  00000-0  50000-4 0  9999');
  const [line2, setLine2] = useState('2 99999  97.4500 145.2000 0010000 120.0000 240.0000 15.15000000  1001');
  const [freqDownlink, setFreqDownlink] = useState('437.500');
  const [callsign, setCallsign] = useState('VU2CUB');
  const [purpose, setPurpose] = useState('Custom Academic & Telemetry Beacon Experiment');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanL1 = line1.trim();
    const cleanL2 = line2.trim();

    try {
      const satrec = sgp4.twoline2satrec(cleanL1, cleanL2);
      if (!satrec) {
        setError('Invalid TLE format. Please check standard 69-character NORAD line formatting.');
        return;
      }

      // Test propagation
      const testPos = sgp4.propagate(satrec, new Date());
      if (!testPos || !testPos.position) {
        setError('TLE could not be propagated by SGP4 engine. Verify mean motion and inclination.');
        return;
      }

      const noradId = satrec.satnum || 99999;


      const newSat: SatelliteTLE = {
        id: `custom-${Date.now()}`,
        name: name.trim() || 'Custom Satellite',
        noradId,
        intlDesignator: '2026-EXP1',
        line1: cleanL1,
        line2: cleanL2,
        category: 'custom',
        operator: 'User Ground Station',
        country: 'Custom',
        launchDate: new Date().toISOString().split('T')[0],
        purpose: purpose.trim() || 'Custom Orbit Tracker',
        freqDownlinkMHz: parseFloat(freqDownlink) || 437.500,
        rfBand: 'UHF',
        callsign: callsign.trim().toUpperCase() || 'CUSTOM',
        status: 'operational',
        licenseStatus: 'Experimental',
        unRegistrationCode: 'USER-CUSTOM-01',
      };

      onAddCustomSatellite(newSat);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error validating TLE.');
    }
  };

  const handleLoadSample = (sampleType: 'skyroot_test' | 'iss') => {
    if (sampleType === 'skyroot_test') {
      setName('Skyroot Vikram-1 Orbital Test (VK-TEST)');
      setLine1('1 98999U 26084A   26233.10000000  .00002500  00000-0  12000-3 0  9991');
      setLine2('2 98999  97.5000 140.0000 0015000 110.0000 250.0000 15.14000000  1012');
      setFreqDownlink('2245.500');
      setCallsign('VK1-DEMO');
      setPurpose('Skyroot Vikram Multi-Burn In-Orbit Demonstration Payload');
    } else {
      setName('ISS (ZARYA)');
      setLine1('1 25544U 98067A   26233.31502410  .00014285  00000-0  25621-3 0  9998');
      setLine2('2 25544  51.6420 310.4285 0006240 130.4500 230.1200 15.49842104561284');
      setFreqDownlink('145.800');
      setCallsign('NA1SS');
      setPurpose('International Space Station Amateur Radio Cross-Band Repeater');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Import Custom Satellite / TLE</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Input standard NORAD 2-line element set (TLE) from Space-Track or CelesTrak for SGP4 orbital tracking.
            </p>
          </div>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Quick presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Quick Samples:</span>
            <button
              type="button"
              onClick={() => handleLoadSample('skyroot_test')}
              className="px-2.5 py-1 rounded bg-slate-850 border border-slate-750 text-xs font-mono text-orange-300 hover:bg-slate-800 transition-colors"
            >
              Skyroot Vikram Test
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('iss')}
              className="px-2.5 py-1 rounded bg-slate-850 border border-slate-750 text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors"
            >
              ISS (ZARYA)
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400">Satellite Name / Designation</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-orange-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400">TLE Line 1</label>
            <input
              type="text"
              required
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-orange-300 font-mono focus:outline-none focus:border-orange-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400">TLE Line 2</label>
            <input
              type="text"
              required
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-orange-300 font-mono focus:outline-none focus:border-orange-500/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400">Downlink Frequency (MHz)</label>
              <input
                type="number"
                step="0.001"
                value={freqDownlink}
                onChange={(e) => setFreqDownlink(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400">Amateur / Beacon Callsign</label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400">Mission Purpose & Payload Notes</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500/60"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-950/60 border border-red-800 p-3 text-xs text-red-300 flex items-center gap-2 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-850 px-4 py-2 text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-500 text-xs shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-colors"
            >
              Add to Active Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
