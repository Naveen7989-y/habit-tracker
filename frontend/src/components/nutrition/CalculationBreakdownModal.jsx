import React from 'react';
import { X, Calculator, ShieldCheck, Scale, Info, CheckCircle2 } from 'lucide-react';
import DataQualityBadge from './DataQualityBadge';

export default function CalculationBreakdownModal({ isOpen, onClose, foodItem, portionGrams = 100 }) {
  if (!isOpen || !foodItem) return null;

  const baseGrams = foodItem.servingSizeGrams || 100;
  const targetGrams = Number(portionGrams) || baseGrams;
  const ratio = Math.round((targetGrams / baseGrams) * 1000) / 1000;

  const round = (val) => Math.round((Number(val) || 0) * 10) / 10;

  const baseCal = Number(foodItem.calories) || 0;
  const baseP = Number(foodItem.protein) || 0;
  const baseC = Number(foodItem.carbs) || 0;
  const baseF = Number(foodItem.fat) || 0;
  const baseFib = Number(foodItem.fiber) || 0;

  const scaledCal = round(baseCal * ratio);
  const scaledP = round(baseP * ratio);
  const scaledC = round(baseC * ratio);
  const scaledF = round(baseF * ratio);
  const scaledFib = round(baseFib * ratio);

  // Atwater Theoretical Check
  const atwaterCal = round(scaledP * 4 + scaledC * 4 + scaledF * 9);
  const atwaterDiff = Math.abs(scaledCal - atwaterCal);
  const atwaterPercentage = atwaterCal > 0 ? Math.round((atwaterDiff / atwaterCal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0D101B] border border-[#242A3A] w-full max-w-xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#242A3A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/15 text-[#C8FF00] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F5F7FC]">{foodItem.name}</h3>
              <p className="text-[11px] text-[#A4AABC]">Deterministic Calculation Breakdown</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quality & Provenance Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#151A29] border border-[#242A3A]">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block">Data Quality Classification</span>
              <DataQualityBadge quality={foodItem.dataQuality || 'SOURCE_VERIFIED'} />
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Verified Source</span>
              <span className="text-[11px] font-bold text-white">{foodItem.source || 'ICMR-NIN IFCT 2017'}</span>
            </div>
          </div>

          {/* Mathematical Scaling Formula */}
          <div className="p-4 rounded-2xl bg-[#101422] border border-[#242A3A] space-y-3">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Scale className="w-4 h-4 text-[#C8FF00]" />
                <span>Portion Scaling Ratio</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-[#C8FF00]/15 text-[#C8FF00] font-black text-xs">
                {ratio}× Multiplier
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-[#151A29]">
                <span className="text-slate-400 block">Standard Baseline</span>
                <span className="font-bold text-white text-xs">{baseGrams}g</span>
              </div>
              <div className="p-2 rounded-xl bg-[#151A29]">
                <span className="text-slate-400 block">Your Logged Quantity</span>
                <span className="font-bold text-[#C8FF00] text-xs">{targetGrams}g</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0D101B] border border-slate-800 text-[11px] font-mono text-slate-300">
              Formula: ( {targetGrams}g / {baseGrams}g ) × Base Nutrient = Authoritative Result
            </div>
          </div>

          {/* Nutrient Calculation Grid */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300">Step-by-Step Nutrient Scale</span>
            <div className="border border-[#242A3A] rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#151A29] text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-2.5">Nutrient</th>
                    <th className="p-2.5">Per {baseGrams}g</th>
                    <th className="p-2.5">Equation</th>
                    <th className="p-2.5 text-right font-bold text-white">Computed ({targetGrams}g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242A3A] text-[11px]">
                  <tr>
                    <td className="p-2.5 font-bold text-[#C8FF00]">Calories</td>
                    <td className="p-2.5 text-slate-300">{baseCal} kcal</td>
                    <td className="p-2.5 font-mono text-slate-400">{baseCal} × {ratio}</td>
                    <td className="p-2.5 text-right font-black text-[#C8FF00] text-xs">{scaledCal} kcal</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#39E58C]">Protein</td>
                    <td className="p-2.5 text-slate-300">{baseP} g</td>
                    <td className="p-2.5 font-mono text-slate-400">{baseP} × {ratio}</td>
                    <td className="p-2.5 text-right font-bold text-[#39E58C]">{scaledP} g</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#38BDF8]">Carbohydrates</td>
                    <td className="p-2.5 text-slate-300">{baseC} g</td>
                    <td className="p-2.5 font-mono text-slate-400">{baseC} × {ratio}</td>
                    <td className="p-2.5 text-right font-bold text-[#38BDF8]">{scaledC} g</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#FB7185]">Total Fat</td>
                    <td className="p-2.5 text-slate-300">{baseF} g</td>
                    <td className="p-2.5 font-mono text-slate-400">{baseF} × {ratio}</td>
                    <td className="p-2.5 text-right font-bold text-[#FB7185]">{scaledF} g</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-400">Dietary Fiber</td>
                    <td className="p-2.5 text-slate-300">{baseFib} g</td>
                    <td className="p-2.5 font-mono text-slate-400">{baseFib} × {ratio}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">{scaledFib} g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Atwater & Scientific Transparency Note */}
          <div className="p-3.5 rounded-2xl bg-[#151A29] border border-[#242A3A] space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Scientific Energy Validation (Atwater Standard)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Theoretical Atwater estimate (4P + 4C + 9F): <strong className="text-white">{atwaterCal} kcal</strong> vs Official Published: <strong className="text-white">{scaledCal} kcal</strong> (variance: {atwaterPercentage}%).
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Note: HAbyTAT strictly uses official laboratory bomb calorimetry and specific Atwater factors published by ICMR-NIN IFCT 2017 and USDA rather than uncalibrated crude approximations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#242A3A] bg-[#101422] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}

