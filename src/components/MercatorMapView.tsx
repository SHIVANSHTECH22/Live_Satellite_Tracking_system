import React, { useRef, useEffect } from 'react';
import { SatelliteRealtimeState, SatelliteTLE, GroundStation } from '../types/satellite';

interface MercatorMapViewProps {
  satellites: SatelliteRealtimeState[];
  catalog: SatelliteTLE[];
  selectedSatId: string;
  onSelectSatellite: (id: string) => void;
  groundStation: GroundStation;
}

export const MercatorMapView: React.FC<MercatorMapViewProps> = ({
  satellites,
  catalog,
  selectedSatId,
  onSelectSatellite,
  groundStation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Deep space ocean background (Slate 950)
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Map Coordinates helper: Lat [-90, +90], Lng [-180, +180] -> [0, W], [0, H]
    const mapX = (lng: number) => ((lng + 180) / 360) * width;
    const mapY = (lat: number) => ((90 - lat) / 180) * height;

    // Draw Grid Lines (Latitude & Longitude)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;

    // Latitude lines (Parallels)
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = mapY(lat);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '8px monospace';
      ctx.fillText(`${lat > 0 ? '+' : ''}${lat}°`, 4, y - 2);
    }

    // Equator highlight
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mapY(0));
    ctx.lineTo(width, mapY(0));
    ctx.stroke();

    // Longitude lines (Meridians)
    for (let lng = -150; lng <= 150; lng += 30) {
      const x = mapX(lng);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '8px monospace';
      ctx.fillText(`${lng > 0 ? '+' : ''}${lng}°`, x + 2, height - 4);
    }

    // Draw Simplified Continents Outline
    drawWorldLandmass(ctx, mapX, mapY);

    // Draw Solar Terminator / Night Shading Curve
    drawSolarTerminator(ctx, width, height, mapX, mapY);

    // Draw Selected Satellite Orbit Ground Track & Footprint
    const selectedSat = satellites.find((s) => s.id === selectedSatId);
    if (selectedSat) {
      // Draw footprint circle
      const satX = mapX(selectedSat.longitude);
      const satY = mapY(selectedSat.latitude);
      const footRadiusX = (selectedSat.footprintAngleDeg / 360) * width;
      const footRadiusY = (selectedSat.footprintAngleDeg / 180) * height;

      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.beginPath();
      ctx.ellipse(satX, satY, footRadiusX, footRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw Orbit Track
      if (selectedSat.groundTrack.length > 1) {
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        let prevLng = selectedSat.groundTrack[0].lng;
        ctx.moveTo(mapX(prevLng), mapY(selectedSat.groundTrack[0].lat));

        for (let i = 1; i < selectedSat.groundTrack.length; i++) {
          const curLng = selectedSat.groundTrack[i].lng;
          const curLat = selectedSat.groundTrack[i].lat;
          // Handle map edge wrap
          if (Math.abs(curLng - prevLng) > 180) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(mapX(curLng), mapY(curLat));
          } else {
            ctx.lineTo(mapX(curLng), mapY(curLat));
          }
          prevLng = curLng;
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw Observer Ground Station Marker
    const obsX = mapX(groundStation.longitude);
    const obsY = mapY(groundStation.latitude);

    // Pulse Ring
    const timeNow = Date.now() / 1000;
    const pulse = (timeNow % 2) / 2;
    ctx.strokeStyle = `rgba(234, 88, 12, ${1 - pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(obsX, obsY, 4 + pulse * 16, 0, Math.PI * 2);
    ctx.stroke();

    // Base marker
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(obsX, obsY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(groundStation.code, obsX + 6, obsY - 4);

    // Draw All Satellites
    satellites.forEach((sat) => {
      const tle = catalog.find((c) => c.id === sat.id);
      const isSelected = sat.id === selectedSatId;
      const isSkyroot = tle?.category === 'skyroot';
      const isDebris = tle?.category === 'debris';
      const isStation = tle?.category === 'station';

      const x = mapX(sat.longitude);
      const y = mapY(sat.latitude);

      let color = '#38bdf8';
      if (isSkyroot) color = '#f97316';
      else if (isDebris) color = '#ef4444';
      else if (isStation) color = '#10b981';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 5.5 : isSkyroot ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(sat.name, x + 10, y + 3);
      } else if (isSkyroot) {
        ctx.fillStyle = '#f97316';
        ctx.font = '9px monospace';
        ctx.fillText(sat.name.split(' ')[1] || sat.name, x + 6, y - 2);
      }
    });
  }, [satellites, catalog, selectedSatId, groundStation]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const mapX = (lng: number) => ((lng + 180) / 360) * canvas.width;
    const mapY = (lat: number) => ((90 - lat) / 180) * canvas.height;

    for (const sat of satellites) {
      const sx = mapX(sat.longitude);
      const sy = mapY(sat.latitude);
      if (Math.hypot(sx - clickX, sy - clickY) < 14) {
        onSelectSatellite(sat.id);
        break;
      }
    }
  };

  return (
    <div className="relative w-full h-[480px] rounded-xl border border-white/10 bg-slate-950 overflow-hidden flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <canvas
        ref={canvasRef}
        width={960}
        height={480}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
      />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-2 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316] inline-block"></span>
            Skyroot Vikram
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-400 inline-block"></span>
            ISRO / Earth Obs
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span>
            ISS & Stations
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
            Debris / CARA
          </span>
        </div>
        <div className="text-slate-400 hidden sm:inline">
          Mercator Ground Track • Click any satellite node to track
        </div>
      </div>
    </div>
  );
};

/**
 * Draw simplified geometric world landmasses for instant rendering
 */
function drawWorldLandmass(
  ctx: CanvasRenderingContext2D,
  mapX: (lng: number) => number,
  mapY: (lat: number) => number
) {
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.8;

  // Major Continents Polygon Approximate paths
  const continents: Array<Array<[number, number]>> = [
    // North America
    [
      [-168, 71], [-135, 69], [-95, 70], [-60, 60], [-65, 45], [-75, 35],
      [-80, 25], [-90, 20], [-100, 20], [-105, 23], [-120, 35], [-125, 48],
      [-140, 58], [-168, 65]
    ],
    // South America
    [
      [-80, 10], [-60, 10], [-35, -5], [-40, -20], [-55, -35], [-65, -55],
      [-75, -50], [-72, -35], [-80, -5], [-80, 10]
    ],
    // Eurasia
    [
      [-10, 36], [0, 45], [10, 55], [30, 70], [60, 75], [100, 77],
      [140, 70], [170, 65], [140, 38], [120, 30], [105, 20], [80, 10],
      [75, 25], [60, 25], [45, 15], [35, 30], [25, 38], [0, 38], [-10, 36]
    ],
    // Africa
    [
      [-18, 15], [-5, 36], [10, 37], [32, 31], [42, 12], [50, 10],
      [40, -10], [30, -32], [18, -34], [10, -5], [-15, 5], [-18, 15]
    ],
    // Australia
    [
      [115, -22], [130, -12], [145, -15], [152, -28], [140, -38],
      [115, -35], [113, -25], [115, -22]
    ],
    // Indian Subcontinent Detail
    [
      [68, 24], [72, 30], [78, 35], [88, 28], [92, 22], [88, 21],
      [80, 13], [77, 8], [74, 15], [68, 24]
    ]
  ];

  continents.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lng, lat], idx) => {
      const x = mapX(lng);
      const y = mapY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/**
 * Draw day/night terminator shading curve
 */
function drawSolarTerminator(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mapX: (lng: number) => number,
  mapY: (lat: number) => number
) {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = -23.45 * Math.cos(((360 / 365) * (dayOfYear + 10) * Math.PI) / 180);
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const subSolarLng = (12 - utcHours) * 15;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, height);

  for (let x = 0; x <= width; x += 10) {
    const lng = (x / width) * 360 - 180;
    const hourAngleRad = ((lng - subSolarLng) * Math.PI) / 180;
    const decRad = (declination * Math.PI) / 180;

    // Lat where solar elevation is 0 (terminator)
    const termLatRad = Math.atan(-Math.cos(hourAngleRad) / Math.tan(decRad));
    const termLatDeg = (termLatRad * 180) / Math.PI;

    const y = mapY(termLatDeg);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}
