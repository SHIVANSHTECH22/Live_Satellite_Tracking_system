import React from 'react';
import { SPACE_COMPLIANCE_REGULATIONS } from '../data/compliance';
import { X, ShieldCheck, BookOpen, ExternalLink, Scale, CheckCircle2 } from 'lucide-react';

interface SpaceLawComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpaceLawComplianceModal: React.FC<SpaceLawComplianceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">
                Space Law, Regulatory & IN-SPACe Compliance Architecture
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              International Treaties (UN COPUOS), Indian Space Policy 2023, ITU Spectrum Coordination, and Space Debris Mitigation Guidelines
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Regulations Grid */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {SPACE_COMPLIANCE_REGULATIONS.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    {item.category}
                  </span>
                  <h3 className="mt-1 text-sm font-bold text-white">{item.title}</h3>
                </div>

                <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.complianceStatus}
                </span>
              </div>

              <div className="mt-2.5 text-xs text-slate-300 space-y-2">
                <p>
                  <strong className="text-slate-200">Regulatory Authority:</strong> {item.authority}
                </p>
                <p>
                  <strong className="text-slate-200">Summary & Mandate:</strong> {item.summary}
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  <strong className="text-slate-300">Legal Instrument:</strong> {item.legalBasis}
                </p>
                <div className="rounded-md bg-slate-950 p-2.5 border border-slate-800 font-mono text-[11px] text-orange-300/90">
                  <strong>Skyroot Orbital Impact:</strong> {item.operationalImpact}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <div>
            Verified against UN Treaties (A/AC.105), ITU-R NFAP 2024 & IN-SPACe Authorization Directives.
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500 text-xs shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
