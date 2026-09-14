"use client";

import { useMemo, useState } from "react";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProfitSimulator() {
  const [sales, setSales] = useState(900000);
  const [waste, setWaste] = useState(2.5);
  const [variance, setVariance] = useState(1.6);
  const [discount, setDiscount] = useState(0.8);
  const exposure = useMemo(() => sales * 12 * ((waste + variance + discount) / 100), [sales, waste, variance, discount]);

  return <div className="simulator-shell" data-reveal>
    <div className="simulator-controls">
      <label><span>Illustrative monthly sales <b>{inr.format(sales)}</b></span><input type="range" min="300000" max="3000000" step="50000" value={sales} onChange={(event) => setSales(Number(event.target.value))}/></label>
      <label><span>Food waste assumption <b>{waste.toFixed(1)}%</b></span><input type="range" min="0" max="8" step="0.1" value={waste} onChange={(event) => setWaste(Number(event.target.value))}/></label>
      <label><span>Stock variance assumption <b>{variance.toFixed(1)}%</b></span><input type="range" min="0" max="5" step="0.1" value={variance} onChange={(event) => setVariance(Number(event.target.value))}/></label>
      <label><span>Untracked discount assumption <b>{discount.toFixed(1)}%</b></span><input type="range" min="0" max="4" step="0.1" value={discount} onChange={(event) => setDiscount(Number(event.target.value))}/></label>
    </div>
    <div className="simulator-result">
      <small>Illustrative annual operational exposure</small>
      <strong>{inr.format(exposure)}</strong>
      <div className="simulator-graph"><i/><i/><i/><i/><i/><i/></div>
      <p>This is scenario math only. It is not a promised saving, forecast or customer result.</p>
    </div>
  </div>;
}
