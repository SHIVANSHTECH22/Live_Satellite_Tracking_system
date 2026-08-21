import React from 'react';
import { Search, Globe, Map, Filter, ArrowDownUp, Crosshair } from 'lucide-react';
import { SatelliteTLE } from '../types/satellite';

interface QuickFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  mapProjection: '3d' | '2d';
  onProjectionChange: (proj: '3d' | '2d') => void;
  sortByDistance: boolean;
  onToggleSortByDistance: () => void;
  catalog: SatelliteTLE[];
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  mapProjection,
  onProjectionChange,
  sortByDistance,
  onToggleSortByDistance,
  catalog,
}) => {
  const categories = [
    { id: 'all', label: 'All Assets', count: catalog.length },
    { id: 'skyroot', label: '🚀 Skyroot Fleet', count: catalog.filter((c) => c.category === 'skyroot').length },
    { id: 'isro', label: '🛰️ ISRO / India', count: catalog.filter((c) => c.category === 'isro').length },
    { id: 'station', label: '🧑‍🚀 Space Stations', count: catalog.filter((c) => c.category === 'station').length },
    { id: 'earth_obs', label: '🌍 Earth Obs', count: catalog.filter((c) => c.category === 'earth_obs').length },
    { id: 'communications', label: '📡 Comms', count: catalog.filter((c) => c.category === 'communications').length },
    { id: 'debris', label: '⚠️ CARA Debris', count: catalog.filter((c) => c.category === 'debris').length },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all font-mono ${
                isActive
                  ? 'bg-orange-600 text-white font-semibold shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                  : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                  isActive ? 'bg-orange-700/80 text-orange-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Tools: Search, Distance Sort, Projection Switch */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search satellite or NORAD..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 w-44 sm:w-52 font-mono focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition-all"
          />
        </div>

        {/* Sort by Nearest distance */}
        <button
          onClick={onToggleSortByDistance}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-all ${
            sortByDistance
              ? 'border-orange-500/50 bg-orange-950/40 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.15)]'
              : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:text-slate-200'
          }`}
          title="Sort by nearest Euclidean distance to ground station"
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sort: Nearest</span>
        </button>

        {/* 3D vs 2D Map Switch */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/80 p-0.5 font-mono">
          <button
            onClick={() => onProjectionChange('3d')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
              mapProjection === '3d' ? 'bg-orange-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>3D</span>
          </button>
          <button
            onClick={() => onProjectionChange('2d')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
              mapProjection === '2d' ? 'bg-orange-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            <span>2D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
