import React, { useMemo } from 'react';
import { SatelliteTLE, ConjunctionRisk } from '../types/satellite';
import { computeConjunctionRisks } from '../utils/orbitalEngine';
import { ShieldAlert, AlertTriangle, CheckCircle, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

interface ConjunctionAssessmentProps {
  catalog: SatelliteTLE[];
  utcTime: Date;
  onSelectSatellite: (id: string) => void;
  onOpenComplianceModal: () => void;
}

export const ConjunctionAssessment: React.FC<ConjunctionAssessmentProps> = ({
  catalog,
  utcTime,
  onSelectSatellite,
  onOpenComplianceModal,
}) => {
  const risks: ConjunctionRisk[] = useMemo(() => {
    return computeConjunctionRisks(catalog, utcTime);
  }, [catalog, utcTime]);

  const criticalCount = risks.filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-400" />
              <span>Conjunction Assessment Risk Analysis (CARA / SSA)</span>
            </h2>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">
              IADC & ISO 24113 Standard
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated orbital close-approach detection and collision probability analysis against cataloged orbital debris
          </p>
        </div>

        <button
          onClick={onOpenComplianceModal}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-750 transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>IADC Space Debris Rules</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
          <div className="text-[10px] font-mono uppercase text-slate-400">Monitored Orbital Assets</div>
          <div className="mt-1 font-mono text-xl font-bold text-white">
            {catalog.filter((c) => c.category !== 'debris').length}{' '}
            <span className="text-xs font-normal text-slate-400">active satellites</span>
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-500">
            Against {catalog.filter((c) => c.category === 'debris').length} tracked debris fields
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
          <div className="text-[10px] font-mono uppercase text-slate-400">Close Approaches Detected</div>
          <div className="mt-1 font-mono text-xl font-bold text-orange-400">
            {risks.length}{' '}
            <span className="text-xs font-normal text-slate-400">events (&lt; 450 km)</span>
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-500">
            Screened over next orbital revolution (90 min)
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
          <div className="text-[10px] font-mono uppercase text-slate-400">Collision Avoidance Maneuvers</div>
          <div className={`mt-1 font-mono text-xl font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {criticalCount > 0 ? `${criticalCount} ACTION REQUIRED` : 'NOMINAL CLEARANCE'}
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-500">
            COLA burn trigger threshold: Pc &gt; 10⁻⁴
          </div>
        </div>
      </div>

      {/* Risks Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">Primary Asset</th>
              <th className="px-3.5 py-2.5">Secondary Debris Object</th>
              <th className="px-3.5 py-2.5">TCA Epoch (UTC)</th>
              <th className="px-3.5 py-2.5 text-right">Miss Distance</th>
              <th className="px-3.5 py-2.5 text-right">Radial Diff</th>
              <th className="px-3.5 py-2.5 text-center">Collision Prob (Pc)</th>
              <th className="px-3.5 py-2.5 text-center">Risk Level</th>
              <th className="px-3.5 py-2.5">Recommended SSA Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-slate-300">
            {risks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  <CheckCircle className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
                  No high-risk conjunctions detected in current orbital propagation envelope.
                </td>
              </tr>
            ) : (
              risks.map((risk) => {
                const isCritical = risk.riskLevel === 'CRITICAL';
                const isHigh = risk.riskLevel === 'HIGH';
                const isMedium = risk.riskLevel === 'MEDIUM';

                return (
                  <tr
                    key={risk.id}
                    className={`hover:bg-slate-900 transition-colors ${
                      isCritical ? 'bg-red-950/25' : isHigh ? 'bg-orange-950/20' : ''
                    }`}
                  >
                    <td className="px-3.5 py-2.5 font-semibold text-white whitespace-nowrap">
                      <button
                        onClick={() => onSelectSatellite(risk.primarySat.id)}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span className="text-orange-400">{risk.primarySat.name}</span>
                      </button>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="text-red-400 font-medium">{risk.secondaryObject.name}</span>
                      <span className="ml-1 text-[10px] text-slate-400">
                        (NORAD #{risk.secondaryObject.noradId})
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-400">
                      {risk.tcaEpoch.toISOString().substring(11, 19)} UTC
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-right font-bold text-white">
                      {risk.missDistanceKm.toFixed(1)} km
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-right text-slate-400">
                      &plusmn;{risk.radialDistanceKm.toFixed(1)} km
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-center">
                      <span className="font-mono text-[11px] text-slate-300">
                        {risk.collisionProbability.toExponential(1)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCritical
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : isHigh
                            ? 'bg-orange-950 text-orange-300 border border-orange-700'
                            : isMedium
                            ? 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {risk.riskLevel}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-[11px]">
                      {risk.recommendedManeuver ? (
                        <span className="text-orange-300 flex items-center gap-1 font-medium">
                          <Zap className="h-3 w-3 text-orange-400 shrink-0" />
                          {risk.recommendedManeuver}
                        </span>
                      ) : (
                        <span className="text-slate-400">Monitor Next Pass</span>
                      )}
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
