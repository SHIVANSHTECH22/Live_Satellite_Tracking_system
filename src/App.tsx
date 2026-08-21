/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SATELLITE_CATALOG } from './data/satellites';
import { DEFAULT_GROUND_STATIONS } from './data/groundStations';
import { SatelliteTLE, SatelliteRealtimeState, GroundStation } from './types/satellite';
import { propagateSatellite } from './utils/orbitalEngine';
import { audioBeacon } from './utils/audioBeacon';

import { Header } from './components/Header';
import { NearestSatelliteHUD } from './components/NearestSatelliteHUD';
import { Globe3DView } from './components/Globe3DView';
import { MercatorMapView } from './components/MercatorMapView';
import { PolarSkyRadar } from './components/PolarSkyRadar';
import { SatelliteDetailPanel } from './components/SatelliteDetailPanel';
import { PassPredictorTable } from './components/PassPredictorTable';
import { RFDopplerController } from './components/RFDopplerController';
import { ConjunctionAssessment } from './components/ConjunctionAssessment';
import { SpaceLawComplianceModal } from './components/SpaceLawComplianceModal';
import { GroundStationModal } from './components/GroundStationModal';
import { CustomTLEModal } from './components/CustomTLEModal';
import { QuickFilterBar } from './components/QuickFilterBar';

export default function App() {
  // App Navigation & View State
  const [currentTab, setCurrentTab] = useState<'tracker' | 'polar' | 'passes' | 'rf' | 'conjunction' | 'compliance'>('tracker');
  const [mapProjection, setMapProjection] = useState<'3d' | '2d'>('3d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortByDistance, setSortByDistance] = useState<boolean>(true);

  // Satellite Catalog & Ground Station
  const [catalog, setCatalog] = useState<SatelliteTLE[]>(SATELLITE_CATALOG);
  const [groundStation, setGroundStation] = useState<GroundStation>(DEFAULT_GROUND_STATIONS[0]);
  const [selectedSatId, setSelectedSatId] = useState<string>('skyroot-vk1-pathfinder');

  // Modals
  const [isGroundStationModalOpen, setIsGroundStationModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isTleModalOpen, setIsTleModalOpen] = useState(false);

  // Audio Beacon State
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  // Time Engine (Supports 1x real-time, 10x, 60x warp)
  const [timeWarp, setTimeWarp] = useState<number>(1);
  const [simulatedTime, setSimulatedTime] = useState<Date>(new Date());

  // Auto-attempt browser GPS on first mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGroundStation((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitudeMeters: Math.round(pos.coords.altitude || 540),
            name: 'Local GPS Ground Station',
            code: 'LOCAL-GPS',
          }));
        },
        () => {
          // Graceful fallback to Skyroot HQ
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Time & Orbital Propagation Loop (Tick every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTime((prev) => new Date(prev.getTime() + 1000 * timeWarp));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeWarp]);

  // Real-time propagation calculations for all satellites in catalog
  const realtimeStates: SatelliteRealtimeState[] = useMemo(() => {
    const states: SatelliteRealtimeState[] = [];
    for (const sat of catalog) {
      const state = propagateSatellite(sat, simulatedTime, groundStation);
      if (state) {
        states.push(state);
      }
    }
    return states;
  }, [catalog, simulatedTime, groundStation]);

  // Find Nearest Satellite in 3D Euclidean Slant Range to Ground Station
  const nearestSatelliteData = useMemo(() => {
    if (realtimeStates.length === 0) return { state: null, tle: null };
    const sorted = [...realtimeStates].sort((a, b) => a.slantRangeKm - b.slantRangeKm);
    const nearest = sorted[0];
    const tle = catalog.find((c) => c.id === nearest.id) || null;
    return { state: nearest, tle };
  }, [realtimeStates, catalog]);

  // Filtered & Sorted Realtime States for list and display
  const filteredRealtimeStates = useMemo(() => {
    let result = realtimeStates.filter((sat) => {
      const tle = catalog.find((c) => c.id === sat.id);
      if (!tle) return false;

      // Category filter
      if (selectedCategory !== 'all' && tle.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = sat.name.toLowerCase().includes(q);
        const matchesNorad = sat.noradId.toString().includes(q);
        const matchesOperator = tle.operator.toLowerCase().includes(q);
        if (!matchesName && !matchesNorad && !matchesOperator) return false;
      }

      return true;
    });

    if (sortByDistance) {
      result.sort((a, b) => a.slantRangeKm - b.slantRangeKm);
    }

    return result;
  }, [realtimeStates, catalog, selectedCategory, searchQuery, sortByDistance]);

  // Active selected satellite state and TLE
  const selectedState = useMemo(() => {
    return realtimeStates.find((s) => s.id === selectedSatId) || realtimeStates[0] || null;
  }, [realtimeStates, selectedSatId]);

  const selectedTle = useMemo(() => {
    return catalog.find((c) => c.id === selectedSatId) || catalog[0] || null;
  }, [catalog, selectedSatId]);

  const handleSelectSatellite = useCallback((id: string) => {
    setSelectedSatId(id);
    audioBeacon.playPing(940, 0.08, 0.03);
  }, []);

  const handleToggleAudio = () => {
    const isNowMuted = audioBeacon.toggleMute();
    setIsAudioMuted(isNowMuted);
  };

  const handleAddCustomSatellite = (newSat: SatelliteTLE) => {
    setCatalog((prev) => [newSat, ...prev]);
    setSelectedSatId(newSat.id);
    setSelectedCategory('all');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      {/* Top Bar Navigation (Strict 3-zone contract) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        groundStation={groundStation}
        onOpenGroundStationModal={() => setIsGroundStationModalOpen(true)}
        onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
        onOpenTleModal={() => setIsTleModalOpen(true)}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        utcTime={simulatedTime}
        timeWarp={timeWarp}
        onSetTimeWarp={setTimeWarp}
      />

      {/* Main Command Center Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 space-y-4">
        {/* Nearest Satellite Hero HUD */}
        <NearestSatelliteHUD
          nearestState={nearestSatelliteData.state}
          nearestTle={nearestSatelliteData.tle}
          allRealtimeStates={realtimeStates}
          catalog={catalog}
          selectedSatId={selectedSatId}
          onSelectSatellite={handleSelectSatellite}
          groundStation={groundStation}
        />

        {/* Dynamic Tab Views */}
        {currentTab === 'tracker' && (
          <div className="space-y-4">
            {/* Quick Filter & Projection Bar */}
            <QuickFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              mapProjection={mapProjection}
              onProjectionChange={setMapProjection}
              sortByDistance={sortByDistance}
              onToggleSortByDistance={() => setSortByDistance((s) => !s)}
              catalog={catalog}
            />

            {/* Map Visualizer (3D Globe or 2D Mercator) */}
            {mapProjection === '3d' ? (
              <Globe3DView
                satellites={filteredRealtimeStates}
                catalog={catalog}
                selectedSatId={selectedSatId}
                onSelectSatellite={handleSelectSatellite}
                groundStation={groundStation}
              />
            ) : (
              <MercatorMapView
                satellites={filteredRealtimeStates}
                catalog={catalog}
                selectedSatId={selectedSatId}
                onSelectSatellite={handleSelectSatellite}
                groundStation={groundStation}
              />
            )}

            {/* Selected Satellite Telemetry & Keplerian Inspector */}
            <SatelliteDetailPanel
              state={selectedState}
              tle={selectedTle}
              groundStation={groundStation}
              onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'polar' && (
          <div className="space-y-4">
            <PolarSkyRadar
              satellites={realtimeStates}
              catalog={catalog}
              selectedSatId={selectedSatId}
              onSelectSatellite={handleSelectSatellite}
              groundStation={groundStation}
            />
            <SatelliteDetailPanel
              state={selectedState}
              tle={selectedTle}
              groundStation={groundStation}
              onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'passes' && (
          <PassPredictorTable
            catalog={catalog}
            selectedSatId={selectedSatId}
            onSelectSatellite={handleSelectSatellite}
            groundStation={groundStation}
            utcTime={simulatedTime}
          />
        )}

        {currentTab === 'rf' && (
          <div className="space-y-4">
            <RFDopplerController
              state={selectedState}
              tle={selectedTle}
              groundStation={groundStation}
            />
            <SatelliteDetailPanel
              state={selectedState}
              tle={selectedTle}
              groundStation={groundStation}
              onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'conjunction' && (
          <div className="space-y-4">
            <ConjunctionAssessment
              catalog={catalog}
              utcTime={simulatedTime}
              onSelectSatellite={handleSelectSatellite}
              onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
            />
            <SatelliteDetailPanel
              state={selectedState}
              tle={selectedTle}
              groundStation={groundStation}
              onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 backdrop-blur py-4 px-4 text-center text-xs font-mono text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="text-left">
            <span className="font-semibold text-slate-300">SKYROOT ORBITTRAK SSA SYSTEM</span>
            <span className="text-slate-500"> • SGP4 / SDP4 PROPAGATION ENGINE</span>
            <div className="text-[10px] text-slate-400 mt-0.5">
              IN-SPACe Authorized • UN COPUOS Registration Compliant • ITU-R Frequency Coordinated
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsComplianceModalOpen(true)}
              className="text-orange-400 hover:underline text-xs transition-colors"
            >
              Legal Treaties & Space Policy
            </button>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400 tabular-nums">
              UTC: {simulatedTime.toISOString().substring(0, 19).replace('T', ' ')}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GroundStationModal
        isOpen={isGroundStationModalOpen}
        onClose={() => setIsGroundStationModalOpen(false)}
        currentStation={groundStation}
        onSelectStation={setGroundStation}
      />

      <SpaceLawComplianceModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
      />

      <CustomTLEModal
        isOpen={isTleModalOpen}
        onClose={() => setIsTleModalOpen(false)}
        onAddCustomSatellite={handleAddCustomSatellite}
      />
    </div>
  );
}
