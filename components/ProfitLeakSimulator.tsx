"use client";

import { useMemo, useState } from "react";
import { CircleAlert, IndianRupee, SlidersHorizontal } from "lucide-react";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.max(0, value));
}

export function ProfitLeakSimulator() {
  const [sales, setSales] = useState(800000);
  const [foodCost, setFoodCost] = useState(32);
  const [variance, setVariance] = useState(2.2);
  const [waste, setWaste] = useState(1.2);

  const model = useMemo(() => {
    const costBase = sales * (foodCost / 100);
    const varianceValue = costBase * (variance / 100);
    const wasteValue = costBase * (waste / 100);
    const potentialLeakage = varianceValue + wasteValue;
    return { costBase, varianceValue, wasteValue, potentialLeakage, annualized: potentialLeakage * 12 };
  }, [foodCost, sales, variance, waste]);

  return <div className="leak-simulator">
    <div className="simulator-head"><span className="kicker"><SlidersHorizontal size={14}/> Interactive model</span><h2>What could small operating gaps mean in rupees?</h2><p>Adjust a few assumptions to visualize the scale of food-cost variance and recorded waste. This is an educational model, not a savings promise or diagnosis.</p></div>
    <div className="simulator-layout">
      <div className="simulator-controls">
        <Slider label="Monthly sales" value={sales} min={150000} max={5000000} step={50000} display={money(sales)} onChange={setSales}/>
        <Slider label="Food / consumable cost" value={foodCost} min={15} max={55} step={0.5} display={`${foodCost.toFixed(1)}%`} onChange={setFoodCost}/>
        <Slider label="Potential stock variance" value={variance} min={0} max={8} step={0.1} display={`${variance.toFixed(1)}%`} onChange={setVariance}/>
        <Slider label="Recorded waste" value={waste} min={0} max={6} step={0.1} display={`${waste.toFixed(1)}%`} onChange={setWaste}/>
      </div>
      <div className="simulator-result">
        <small>Illustrative monthly amount to investigate</small>
        <b>{money(model.potentialLeakage)}</b>
        <span>Annualized illustration: {money(model.annualized)}</span>
        <div className="simulator-breakdown">
          <p><span>Estimated consumable cost base</span><strong>{money(model.costBase)}</strong></p>
          <p><span>Variance assumption</span><strong>{money(model.varianceValue)}</strong></p>
          <p><span>Waste assumption</span><strong>{money(model.wasteValue)}</strong></p>
        </div>
        <div className="simulator-warning"><CircleAlert size={16}/><p><b>Not a claim of recoverable profit.</b> Real analysis requires verified purchases, recipes/BOMs, physical stock counts, waste logs, sales mix and operating context.</p></div>
      </div>
    </div>
  </div>;
}

function Slider({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) {
  return <label className="simulator-slider"><span><b>{label}</b><em>{display}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/></label>;
}
