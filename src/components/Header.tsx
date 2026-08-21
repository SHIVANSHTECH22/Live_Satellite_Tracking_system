import React from 'react';
import { Volume2, VolumeX, MapPin, Compass, ShieldCheck, Activity, Globe, Radio } from 'lucide-react';
import { GroundStation } from '../types/satellite';

interface HeaderProps {
  currentTab: 'tracker' | 'polar' | 'passes' | 'rf' | 'conjunction' | 'compliance';
  onSelectTab: (tab: 'tracker' | 'polar' | 'passes' | 'rf' | 'conjunction' | 'compliance') => void;
  groundStation: GroundStation;
  onOpenGroundStationModal: () => void;
  onOpenComplianceModal: () => void;
  onOpenTleModal: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  utcTime: Date;
  timeWarp: number;
  onSetTimeWarp: (warp: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  groundStation,
  onOpenGroundStationModal,
  onOpenComplianceModal,
  onOpenTleModal,
  isAudioMuted,
  onToggleAudio,
  utcTime,
  timeWarp,
  onSetTimeWarp,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Zone 1: Brand Title (Strictly one single text line with emblem) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-tr from-orange-500 to-amber-300 rounded-sm rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)] shrink-0">
            <div className="w-3 h-3 bg-slate-950 rounded-full"></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold tracking-widest text-white whitespace-nowrap">
              SKYROOT <span className="font-light text-slate-400">ORBITAL</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[9px] uppercase tracking-widest text-orange-400 bg-orange-950/50 px-1.5 py-0.5 rounded border border-orange-500/30">
              SSA LIVE
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="hidden lg:flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider">
          <button
            onClick={() => onSelectTab('tracker')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all ${
              currentTab === 'tracker'
                ? 'bg-slate-800/90 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Mission Map</span>
          </button>

          <button
            onClick={() => onSelectTab('polar')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all ${
              currentTab === 'polar'
                ? 'bg-slate-800/90 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Sky Radar</span>
          </button>

          <button
            onClick={() => onSelectTab('passes')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all ${
              currentTab === 'passes'
                ? 'bg-slate-800/90 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Pass Predictor</span>
          </button>

          <button
            onClick={() => onSelectTab('rf')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all ${
              currentTab === 'rf'
                ? 'bg-slate-800/90 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>RF Doppler</span>
          </button>

          <button
            onClick={() => onSelectTab('conjunction')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all ${
              currentTab === 'conjunction'
                ? 'bg-slate-800/90 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>CARA Debris</span>
          </button>

          <button
            onClick={onOpenComplianceModal}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 whitespace-nowrap transition-colors"
          >
            <span>IN-SPACe Law</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live UTC Clock Ticker */}
          <div className="hidden xl:flex flex-col items-end pr-2 border-r border-slate-800">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Station Clock</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
              {utcTime.toISOString().substring(11, 19)} UTC
            </span>
          </div>

          {/* Time Warp Controls */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1">
            <span className="text-[10px] font-mono text-slate-400">WARP:</span>
            <button
              onClick={() => onSetTimeWarp(1)}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                timeWarp === 1 ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => onSetTimeWarp(10)}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                timeWarp === 10 ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              10x
            </button>
            <button
              onClick={() => onSetTimeWarp(60)}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                timeWarp === 60 ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              60x
            </button>
          </div>

          {/* Ground Station Selector Button */}
          <button
            onClick={onOpenGroundStationModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-700 hover:bg-slate-850 whitespace-nowrap transition-colors"
            title={`Observer Ground Station: ${groundStation.name}`}
          >
            <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0" />
            <span className="hidden md:inline font-mono text-[11px] truncate max-w-[130px]">
              {groundStation.code}
            </span>
          </button>

          {/* Custom TLE Importer */}
          <button
            onClick={onOpenTleModal}
            className="hidden sm:inline-flex items-center rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:border-slate-700 hover:text-white whitespace-nowrap transition-colors"
          >
            + TLE
          </button>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={onToggleAudio}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
              isAudioMuted
                ? 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200'
                : 'border-orange-500/50 bg-orange-950/40 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
            }`}
            title={isAudioMuted ? 'Unmute Telemetry Audio Beacons' : 'Mute Telemetry Audio'}
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className="mt-2 flex lg:hidden items-center justify-between gap-1 overflow-x-auto border-t border-slate-900 pt-2 pb-0.5 font-mono text-[11px]">
        <button
          onClick={() => onSelectTab('tracker')}
          className={`px-2.5 py-1 whitespace-nowrap rounded-md ${
            currentTab === 'tracker' ? 'bg-slate-800 text-orange-400 border border-orange-500/30' : 'text-slate-400'
          }`}
        >
          Mission Map
        </button>
        <button
          onClick={() => onSelectTab('polar')}
          className={`px-2.5 py-1 whitespace-nowrap rounded-md ${
            currentTab === 'polar' ? 'bg-slate-800 text-orange-400 border border-orange-500/30' : 'text-slate-400'
          }`}
        >
          Sky Radar
        </button>
        <button
          onClick={() => onSelectTab('passes')}
          className={`px-2.5 py-1 whitespace-nowrap rounded-md ${
            currentTab === 'passes' ? 'bg-slate-800 text-orange-400 border border-orange-500/30' : 'text-slate-400'
          }`}
        >
          Passes
        </button>
        <button
          onClick={() => onSelectTab('rf')}
          className={`px-2.5 py-1 whitespace-nowrap rounded-md ${
            currentTab === 'rf' ? 'bg-slate-800 text-orange-400 border border-orange-500/30' : 'text-slate-400'
          }`}
        >
          RF Doppler
        </button>
        <button
          onClick={() => onSelectTab('conjunction')}
          className={`px-2.5 py-1 whitespace-nowrap rounded-md ${
            currentTab === 'conjunction' ? 'bg-slate-800 text-orange-400 border border-orange-500/30' : 'text-slate-400'
          }`}
        >
          CARA SSA
        </button>
        <button
          onClick={onOpenComplianceModal}
          className="px-2.5 py-1 whitespace-nowrap rounded-md text-slate-400"
        >
          Law
        </button>
      </div>
    </header>
  );
};
