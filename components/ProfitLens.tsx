"use client";

import { useMemo, useState } from "react";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProfitLens() {
  const [sales, setSales] = useState(1200000);
  const [waste, setWaste] = useState(2.2);
  const [variance, setVariance] = useState(1.4);
  const [discount, setDiscount] = useState(0.7);
  const annualExposure = useMemo(() => sales * 12 * ((waste + variance + discount) / 100), [sales, waste, variance, discount]);

  return <div className="profit-lens" data-reveal>
    <div className="profit-controls">
      <Slider label="Illustrative monthly sales" value={sales} min={300000} max={3500000} step={50000} display={money.format(sales)} onChange={setSales}/>
      <Slider label="Waste assumption" value={waste} min={0} max={8} step={0.1} display={`${waste.toFixed(1)}%`} onChange={setWaste}/>
      <Slider label="Stock variance assumption" value={variance} min={0} max={5} step={0.1} display={`${variance.toFixed(1)}%`} onChange={setVariance}/>
      <Slider label="Untracked discount assumption" value={discount} min={0} max={4} step={0.1} display={`${discount.toFixed(1)}%`} onChange={setDiscount}/>
    </div>
    <div className="profit-result">
      <span>ILLUSTRATIVE ANNUAL EXPOSURE</span>
      <strong>{money.format(annualExposure)}</strong>
      <div className="bars">{[.18,.28,.39,.55,.72,1].map((height, index) => <i key={index} style={{ height: `${height * 100}%` }}/>)}</div>
      <p>Scenario math only. This is not a promised saving, forecast or customer result.</p>
    </div>
  </div>;
}

function Slider({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) {
  return <label><span>{label}<b>{display}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/></label>;
}
