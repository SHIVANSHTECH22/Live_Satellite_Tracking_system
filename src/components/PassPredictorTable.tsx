import React, { useState, useMemo } from 'react';
import { SatelliteTLE, GroundStation, PassPrediction } from '../types/satellite';
import { predictPasses } from '../utils/orbitalEngine';
import { Calendar, Clock, Eye, Download, Sun, Moon, Radio, Compass, Filter } from 'lucide-react';

interface PassPredictorTableProps {
  catalog: SatelliteTLE[];
  selectedSatId: string;
  onSelectSatellite: (id: string) => void;
  groundStation: GroundStation;
  utcTime: Date;
}

export const PassPredictorTable: React.FC<PassPredictorTableProps> = ({
  catalog,
  selectedSatId,
  onSelectSatellite,
  groundStation,
  utcTime,
}) => {
  const [forecastHours, setForecastHours] = useState<number>(48);
  const [filterMode, setFilterMode] = useState<'selected' | 'skyroot' | 'all'>('selected');
  const [minElevation, setMinElevation] = useState<number>(10);

  // Compute passes based on selection
  const passes: PassPrediction[] = useMemo(() => {
    let targetSats: SatelliteTLE[] = [];
    if (filterMode === 'selected') {
      const current = catalog.find((c) => c.id === selectedSatId);
      if (current) targetSats = [current];
    } else if (filterMode === 'skyroot') {
      targetSats = catalog.filter((c) => c.category === 'skyroot');
    } else {
      targetSats = catalog;
    }

    const allPasses: PassPrediction[] = [];
    for (const sat of targetSats) {
      const res = predictPasses(sat, groundStation, utcTime, forecastHours, minElevation);
      allPasses.push(...res);
    }

    return allPasses.sort((a, b) => a.aosTime.getTime() - b.aosTime.getTime());
  }, [catalog, selectedSatId, groundStation, utcTime, forecastHours, filterMode, minElevation]);

  const handleExportCsv = () => {
    const headers = ['Satellite', 'AOS (UTC)', 'TCA (UTC)', 'LOS (UTC)', 'Duration (s)', 'Max Elevation (°)', 'AOS Azimuth (°)', 'LOS Azimuth (°)', 'Min Range (km)', 'Visibility'];
    const rows = passes.map((p) => [
      `"${p.satelliteName}"`,
      p.aosTime.toISOString(),
      p.tcaTime.toISOString(),
      p.losTime.toISOString(),
      p.durationSec,
      p.maxElevationDeg,
      p.aosAzimuthDeg,
      p.losAzimuthDeg,
      p.tcaRangeKm,
      `"${p.visibility}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Skyroot_Passes_${groundStation.code}_${forecastHours}h.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedTle = catalog.find((c) => c.id === selectedSatId);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-400" />
            <span>Ground Station Pass Forecast</span>
          </h2>
          <p className="text-xs text-slate-400">
            Targeting look-angle rise & culmination schedules for {groundStation.name} ({groundStation.code})
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Mode */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilterMode('selected')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'selected' ? 'bg-orange-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Selected Satellite
            </button>
            <button
              onClick={() => setFilterMode('skyroot')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'skyroot' ? 'bg-orange-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Skyroot Fleet
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'all' ? 'bg-orange-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Catalog
            </button>
          </div>

          {/* Forecast Range */}
          <select
            value={forecastHours}
            onChange={(e) => setForecastHours(Number(e.target.value))}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500/60"
          >
            <option value={24}>Next 24 Hours</option>
            <option value={48}>Next 48 Hours</option>
            <option value={72}>Next 72 Hours</option>
          </select>

          {/* Min Elevation Filter */}
          <select
            value={minElevation}
            onChange={(e) => setMinElevation(Number(e.target.value))}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500/60"
          >
            <option value={5}>Min El: &ge;5° (All)</option>
            <option value={15}>Min El: &ge;15° (Good)</option>
            <option value={30}>Min El: &ge;30° (High)</option>
            <option value={45}>Min El: &ge;45° (Overhead)</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-750 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Passes Count Summary */}
      <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>
          Found <strong className="text-orange-400 font-semibold">{passes.length}</strong> upcoming passes meeting criteria (Elevation &ge; {minElevation}°)
        </span>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Times displayed in UTC & Local Ground Station standard
        </span>
      </div>

      {/* Passes Table */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">Satellite</th>
              <th className="px-3.5 py-2.5">AOS (Rise UTC)</th>
              <th className="px-3.5 py-2.5">TCA (Peak UTC)</th>
              <th className="px-3.5 py-2.5">LOS (Set UTC)</th>
              <th className="px-3.5 py-2.5 text-center">Duration</th>
              <th className="px-3.5 py-2.5 text-center">Max Elev</th>
              <th className="px-3.5 py-2.5">Azimuth (AOS &rarr; LOS)</th>
              <th className="px-3.5 py-2.5">Min Range</th>
              <th className="px-3.5 py-2.5">Visibility / Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-slate-300">
            {passes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No passes found matching the specified parameters. Try reducing the minimum elevation cutoff or extending the forecast window.
                </td>
              </tr>
            ) : (
              passes.map((p, idx) => {
                const isSelected = p.satelliteId === selectedSatId;
                const isSkyroot = p.satelliteName.toLowerCase().includes('skyroot') || p.satelliteName.toLowerCase().includes('vikram');
                const isSunlit = p.visibility.includes('Visible');

                const formatTime = (d: Date) => {
                  return d.toISOString().replace('T', ' ').substring(5, 19) + ' UTC';
                };

                return (
                  <tr
                    key={`${p.satelliteId}-${p.aosTime.getTime()}-${idx}`}
                    className={`hover:bg-slate-900 transition-colors ${
                      isSelected ? 'bg-orange-950/30 text-orange-200 font-medium' : ''
                    }`}
                  >
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => onSelectSatellite(p.satelliteId)}
                        className="text-left hover:underline flex items-center gap-1.5"
                      >
                        <span className={isSkyroot ? 'text-orange-400 font-bold' : 'text-slate-200'}>
                          {p.satelliteName}
                        </span>
                      </button>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-400">
                      {formatTime(p.aosTime)}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-white font-semibold">
                      {formatTime(p.tcaTime)}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-400">
                      {formatTime(p.losTime)}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-center text-slate-200">
                      {Math.floor(p.durationSec / 60)}m {p.durationSec % 60}s
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          p.maxElevationDeg >= 45
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : p.maxElevationDeg >= 20
                            ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.maxElevationDeg}°
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-400">
                      {p.aosAzimuthDeg}° &rarr; {p.losAzimuthDeg}°
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-400">
                      {p.tcaRangeKm.toLocaleString()} km
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          isSunlit
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isSunlit ? <Sun className="h-3 w-3 text-amber-400" /> : <Radio className="h-3 w-3 text-slate-400" />}
                        {p.visibility}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
