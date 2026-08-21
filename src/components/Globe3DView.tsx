import React, { useRef, useEffect, useState } from 'react';
import { SatelliteRealtimeState, SatelliteTLE, GroundStation } from '../types/satellite';
import { RotateCw, ZoomIn, ZoomOut, Compass, Eye } from 'lucide-react';

interface Globe3DViewProps {
  satellites: SatelliteRealtimeState[];
  catalog: SatelliteTLE[];
  selectedSatId: string;
  onSelectSatellite: (id: string) => void;
  groundStation: GroundStation;
}

export const Globe3DView: React.FC<Globe3DViewProps> = ({
  satellites,
  catalog,
  selectedSatId,
  onSelectSatellite,
  groundStation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<{ lat: number; lng: number }>({
    lat: groundStation.latitude,
    lng: -groundStation.longitude,
  });
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; lat: number; lng: number }>({ x: 0, y: 0, lat: 0, lng: 0 });
  const [autoRotate, setAutoRotate] = useState(false);

  // Sync rotation when observer station changes
  useEffect(() => {
    setRotation({
      lat: groundStation.latitude,
      lng: -groundStation.longitude,
    });
  }, [groundStation.latitude, groundStation.longitude]);

  // Center onto selected satellite when clicked
  const handleCenterOnSelected = () => {
    const selected = satellites.find((s) => s.id === selectedSatId);
    if (selected) {
      setRotation({
        lat: selected.latitude,
        lng: -selected.longitude,
      });
    }
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const radius = Math.min(width, height) * 0.38 * zoom;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw background space / stars
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Earth Globe Background / Atmospheric Limb Glow
      const gradAtmosphere = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.96,
        centerX,
        centerY,
        radius * 1.18
      );
      gradAtmosphere.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
      gradAtmosphere.addColorStop(0.4, 'rgba(56, 189, 248, 0.1)');
      gradAtmosphere.addColorStop(0.8, 'rgba(30, 58, 138, 0.04)');
      gradAtmosphere.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradAtmosphere;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // Earth Sphere Base (Ocean dark slate)
      ctx.fillStyle = '#0a1128';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Function to project spherical Lat/Lng to 2D screen coordinate
      const project = (latDeg: number, lngDeg: number, altOffset: number = 0) => {
        const phi = (latDeg * Math.PI) / 180;
        const lambda = (lngDeg * Math.PI) / 180;
        const rotPhi = (rotation.lat * Math.PI) / 180;
        const rotLambda = (rotation.lng * Math.PI) / 180;

        // Spherical rotation
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const deltaLambda = lambda + rotLambda;

        const x = cosPhi * Math.sin(deltaLambda);
        const y = Math.cos(rotPhi) * sinPhi - Math.sin(rotPhi) * cosPhi * Math.cos(deltaLambda);
        const z = Math.sin(rotPhi) * sinPhi + Math.cos(rotPhi) * cosPhi * Math.cos(deltaLambda);

        const r = radius * (1 + altOffset);
        return {
          x: centerX + x * r,
          y: centerY - y * r,
          visible: z > 0, // front hemisphere
          z,
        };
      };

      // Draw latitude/longitude grid (Graticule)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.75;

      // Parallels (Latitude lines)
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 5) {
          const pt = project(lat, lng);
          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Meridians (Longitude lines)
      for (let lng = -180; lng < 180; lng += 45) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 5) {
          const pt = project(lat, lng);
          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Equator Highlight
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let eqStarted = false;
      for (let lng = -180; lng <= 180; lng += 4) {
        const pt = project(0, lng);
        if (pt.visible) {
          if (!eqStarted) {
            ctx.moveTo(pt.x, pt.y);
            eqStarted = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else {
          eqStarted = false;
        }
      }
      ctx.stroke();

      // Draw Selected Satellite Orbit Track & Footprint
      const selectedSat = satellites.find((s) => s.id === selectedSatId);
      if (selectedSat && selectedSat.groundTrack.length > 0) {
        // Draw Orbit Ground Track
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.7)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        let trackStarted = false;
        for (const ptGeo of selectedSat.groundTrack) {
          const pt = project(ptGeo.lat, ptGeo.lng, selectedSat.altitudeKm / 6378);
          if (pt.visible) {
            if (!trackStarted) {
              ctx.moveTo(pt.x, pt.y);
              trackStarted = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            trackStarted = false;
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Sensor/Radio Footprint on Earth surface
        const footPt = project(selectedSat.latitude, selectedSat.longitude);
        if (footPt.visible) {
          const footRadiusPx = (selectedSat.footprintRadiusKm / 6378) * radius * Math.max(0.2, footPt.z);
          ctx.beginPath();
          ctx.arc(footPt.x, footPt.y, footRadiusPx, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw Observer Ground Station (Pulse Radar)
      const obsPt = project(groundStation.latitude, groundStation.longitude);
      if (obsPt.visible) {
        // Pulse ring
        const timeNow = Date.now() / 1000;
        const pulse = (timeNow % 2) / 2;
        ctx.strokeStyle = `rgba(234, 88, 12, ${1 - pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(obsPt.x, obsPt.y, 4 + pulse * 18, 0, Math.PI * 2);
        ctx.stroke();

        // Pin marker
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(obsPt.x, obsPt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.fillText(groundStation.code, obsPt.x + 8, obsPt.y - 4);
      }

      // Draw All Satellites
      satellites.forEach((sat) => {
        const tle = catalog.find((c) => c.id === sat.id);
        const altOffset = sat.altitudeKm / 6378; // Altitude scale
        const pt = project(sat.latitude, sat.longitude, altOffset);

        if (!pt.visible) return;

        const isCurrentSelected = sat.id === selectedSatId;
        const isSkyroot = tle?.category === 'skyroot';
        const isDebris = tle?.category === 'debris';
        const isStation = tle?.category === 'station';

        // Choose color
        let color = '#38bdf8'; // Blue standard
        if (isSkyroot) color = '#f97316'; // Skyroot Orange
        else if (isDebris) color = '#ef4444'; // Red debris
        else if (isStation) color = '#10b981'; // Green station

        // Sub-satellite projection line to ground
        const groundPt = project(sat.latitude, sat.longitude);
        if (groundPt.visible) {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(groundPt.x, groundPt.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();

          ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.beginPath();
          ctx.arc(groundPt.x, groundPt.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Satellite Icon / Dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isCurrentSelected ? 5.5 : isSkyroot ? 4.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        if (isCurrentSelected) {
          // Selected reticle
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(sat.name, pt.x + 12, pt.y + 3);
        } else if (isSkyroot) {
          ctx.fillStyle = '#f97316';
          ctx.font = '9px monospace';
          ctx.fillText(sat.name.split(' ')[1] || sat.name, pt.x + 7, pt.y - 3);
        }
      });
    };

    render();

    if (autoRotate) {
      const interval = setInterval(() => {
        setRotation((prev) => ({
          ...prev,
          lng: (prev.lng + 0.2) % 360,
        }));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [satellites, catalog, selectedSatId, rotation, zoom, autoRotate, groundStation]);

  // Mouse drag to rotate globe
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      lat: rotation.lat,
      lng: rotation.lng,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const sensitivity = 0.35 / zoom;

    setRotation({
      lat: Math.max(-85, Math.min(85, dragStartRef.current.lat + dy * sensitivity)),
      lng: (dragStartRef.current.lng + dx * sensitivity) % 360,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) * 0.38 * zoom;
    const centerX = width / 2;
    const centerY = height / 2;

    const project = (latDeg: number, lngDeg: number, altOffset: number = 0) => {
      const phi = (latDeg * Math.PI) / 180;
      const lambda = (lngDeg * Math.PI) / 180;
      const rotPhi = (rotation.lat * Math.PI) / 180;
      const rotLambda = (rotation.lng * Math.PI) / 180;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const deltaLambda = lambda + rotLambda;
      const x = cosPhi * Math.sin(deltaLambda);
      const y = Math.cos(rotPhi) * sinPhi - Math.sin(rotPhi) * cosPhi * Math.cos(deltaLambda);
      const z = Math.sin(rotPhi) * sinPhi + Math.cos(rotPhi) * cosPhi * Math.cos(deltaLambda);
      const r = radius * (1 + altOffset);
      return { x: centerX + x * r, y: centerY - y * r, visible: z > 0 };
    };

    // Check hit test
    for (const sat of satellites) {
      const altOffset = sat.altitudeKm / 6378;
      const pt = project(sat.latitude, sat.longitude, altOffset);
      if (pt.visible) {
        const dist = Math.hypot(pt.x - clickX, pt.y - clickY);
        if (dist < 14) {
          onSelectSatellite(sat.id);
          break;
        }
      }
    }
  };

  return (
    <div className="relative w-full h-[480px] rounded-xl border border-white/10 bg-slate-950 overflow-hidden flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={480}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating View Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setAutoRotate((r) => !r)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors backdrop-blur ${
            autoRotate
              ? 'bg-orange-600/30 border-orange-500 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
              : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Auto Orbit Rotation"
        >
          <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={handleCenterOnSelected}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          title="Center on Selected Satellite"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom Globe Legend */}
      <div className="absolute bottom-2 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316] inline-block"></span>
            Skyroot
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-400 inline-block"></span>
            ISRO / Civil
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span>
            Station
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
            CARA Debris
          </span>
        </div>
        <div className="text-slate-400 hidden sm:inline">
          Drag to Rotate Globe • Click satellite to track
        </div>
      </div>
    </div>
  );
};
