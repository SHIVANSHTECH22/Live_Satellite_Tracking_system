import React, { useRef, useEffect } from 'react';
import { SatelliteRealtimeState, SatelliteTLE, GroundStation } from '../types/satellite';
import { Compass, Eye, ShieldAlert, Radio } from 'lucide-react';

interface PolarSkyRadarProps {
  satellites: SatelliteRealtimeState[];
  catalog: SatelliteTLE[];
  selectedSatId: string;
  onSelectSatellite: (id: string) => void;
  groundStation: GroundStation;
}

export const PolarSkyRadar: React.FC<PolarSkyRadarProps> = ({
  satellites,
  catalog,
  selectedSatId,
  onSelectSatellite,
  groundStation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Satellites currently above horizon (Elevation > 0°)
  const visibleSats = satellites.filter((s) => s.elevationDeg >= 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) - 28;

    ctx.clearRect(0, 0, width, height);

    // Background Sky Disc (Deep Slate/Navy)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    // Polar Radar Rings (0° Horizon, 30°, 60°, 90° Zenith)
    const rings = [
      { el: 0, label: '0° Horizon', r: maxRadius },
      { el: 30, label: '30°', r: maxRadius * ((90 - 30) / 90) },
      { el: 60, label: '60°', r: maxRadius * ((90 - 60) / 90) },
      { el: 90, label: '90° Zenith', r: 0 },
    ];

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    rings.forEach((ring) => {
      if (ring.r > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(ring.label, centerX + 4, centerY - ring.r + 12);
      }
    });

    // Compass Crosshairs & Radial Spokes (N, NE, E, SE, S, SW, W, NW)
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const cardinalLabels: Record<number, string> = {
      0: 'N (000°)',
      45: 'NE (045°)',
      90: 'E (090°)',
      135: 'SE (135°)',
      180: 'S (180°)',
      225: 'SW (225°)',
      270: 'W (270°)',
      315: 'NW (315°)',
    };

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.8;
    angles.forEach((deg) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      const x1 = centerX + Math.cos(rad) * 10;
      const y1 = centerY + Math.sin(rad) * 10;
      const x2 = centerX + Math.cos(rad) * maxRadius;
      const y2 = centerY + Math.sin(rad) * maxRadius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Cardinal Labels on edge
      const labelX = centerX + Math.cos(rad) * (maxRadius + 16);
      const labelY = centerY + Math.sin(rad) * (maxRadius + 16);
      ctx.fillStyle = deg === 0 ? '#f97316' : '#64748b';
      ctx.font = deg % 90 === 0 ? 'bold 9px monospace' : '8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cardinalLabels[deg] || `${deg}°`, labelX, labelY);
    });

    // Convert (Azimuth, Elevation) to Polar XY
    const polarToXY = (azDeg: number, elDeg: number) => {
      // Clamped elevation (0 to 90)
      const clampedEl = Math.max(0, Math.min(90, elDeg));
      const r = maxRadius * ((90 - clampedEl) / 90);
      const rad = ((azDeg - 90) * Math.PI) / 180;
      return {
        x: centerX + Math.cos(rad) * r,
        y: centerY + Math.sin(rad) * r,
      };
    };

    // Draw Radar Sweep Animation Effect
    const timeSec = Date.now() / 1000;
    const sweepAngle = (timeSec * 0.8) % (Math.PI * 2);
    const gradSweep = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradSweep.addColorStop(0, 'rgba(249, 115, 22, 0.12)');
    gradSweep.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = gradSweep;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRadius, sweepAngle - 0.4, sweepAngle);
    ctx.closePath();
    ctx.fill();

    // Center Zenith Mark
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Visible Satellites
    visibleSats.forEach((sat) => {
      const tle = catalog.find((c) => c.id === sat.id);
      const isSelected = sat.id === selectedSatId;
      const isSkyroot = tle?.category === 'skyroot';
      const isDebris = tle?.category === 'debris';
      const isStation = tle?.category === 'station';

      const { x, y } = polarToXY(sat.azimuthDeg, sat.elevationDeg);

      let color = '#38bdf8';
      if (isSkyroot) color = '#f97316';
      else if (isDebris) color = '#ef4444';
      else if (isStation) color = '#10b981';

      // Pulse ring for overhead satellites
      if (sat.elevationDeg > 20) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 9 + ((timeSec * 3) % 6), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Satellite dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 6 : isSkyroot ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${sat.name} (El ${sat.elevationDeg.toFixed(0)}°)`, x + 12, y);
      } else {
        ctx.fillStyle = isSkyroot ? '#f97316' : '#cbd5e1';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(sat.name.split(' ')[0] || sat.name, x + 8, y);
      }
    });
  }, [satellites, catalog, selectedSatId, visibleSats, groundStation]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 28;

    const polarToXY = (azDeg: number, elDeg: number) => {
      const clampedEl = Math.max(0, Math.min(90, elDeg));
      const r = maxRadius * ((90 - clampedEl) / 90);
      const rad = ((azDeg - 90) * Math.PI) / 180;
      return { x: centerX + Math.cos(rad) * r, y: centerY + Math.sin(rad) * r };
    };

    for (const sat of visibleSats) {
      const pt = polarToXY(sat.azimuthDeg, sat.elevationDeg);
      if (Math.hypot(pt.x - clickX, pt.y - clickY) < 16) {
        onSelectSatellite(sat.id);
        break;
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Polar Canvas View */}
      <div className="relative flex-1 h-[480px] rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-2 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <canvas
          ref={canvasRef}
          width={560}
          height={480}
          onClick={handleCanvasClick}
          className="max-w-full max-h-full cursor-pointer"
        />

        {/* Top-Left Radar Status */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-300">
          <div className="text-orange-400 font-bold flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>SKY RADAR [0° - 90° ZENITH]</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Station: {groundStation.code} ({groundStation.latitude.toFixed(2)}°, {groundStation.longitude.toFixed(2)}°)
          </div>
        </div>

        {/* Top-Right Count */}
        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-right font-mono text-[11px]">
          <div className="text-slate-400">Overhead Targets</div>
          <div className="text-base font-bold text-orange-400 tabular-nums">
            {visibleSats.length}{' '}
            <span className="text-xs text-slate-400 font-normal">in local sky</span>
          </div>
        </div>
      </div>

      {/* Visible Overhead Satellite Roster */}
      <div className="w-full lg:w-80 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="font-mono text-xs font-semibold uppercase text-slate-200">
              Active Overhead Contacts
            </span>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              {visibleSats.length} ACQUIRED
            </span>
          </div>

          {visibleSats.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">
              <Compass className="h-8 w-8 mx-auto text-slate-600 mb-2 opacity-50" />
              No satellites currently above local 0° horizon.
              <div className="mt-1 text-[11px] text-slate-500">
                Check Pass Predictor tab for upcoming rise times.
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {visibleSats.map((sat) => {
                const tle = catalog.find((c) => c.id === sat.id);
                const isSelected = sat.id === selectedSatId;
                const isSkyroot = tle?.category === 'skyroot';

                return (
                  <button
                    key={sat.id}
                    onClick={() => onSelectSatellite(sat.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-950/30 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                        : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate max-w-[170px]">
                        {sat.name}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          isSkyroot ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        El {sat.elevationDeg.toFixed(1)}°
                      </span>
                    </div>

                    <div className="mt-1.5 grid grid-cols-2 gap-1 font-mono text-[10px] text-slate-400 tabular-nums">
                      <div>Azimuth: {sat.azimuthDeg.toFixed(0)}°</div>
                      <div>Slant: {sat.slantRangeKm.toFixed(0)} km</div>
                      <div>Alt: {sat.altitudeKm.toFixed(0)} km</div>
                      <div className="text-cyan-400">
                        Dop: {sat.dopplerShiftHz > 0 ? '+' : ''}
                        {(sat.dopplerShiftHz / 1000).toFixed(1)} kHz
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500">
          Tracking with 30-sec SGP4 propagation step rate.
        </div>
      </div>
    </div>
  );
};
