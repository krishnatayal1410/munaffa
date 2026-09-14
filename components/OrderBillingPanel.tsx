"use client";

import { CircleAlert, CreditCard, Plus, ReceiptText, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadBillingSnapshot,
  recordOrderPayment,
  saveOrderBill,
  voidOrderBill,
  voidOrderPayment,
  type BillingSnapshot,
  type BillableOrder,
  type OrderBill,
  type PaymentMethod,
} from "@/lib/orderBillingBackend";
import type { WorkspaceContext } from "@/lib/workspaceBackend";

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank: "Bank transfer",
  other: "Other",
};

export function OrderBillingPanel({ workspace, onLedgerChange }: { workspace: WorkspaceContext; onLedgerChange: () => void | Promise<void> }) {
  const [snapshot, setSnapshot] = useState<BillingSnapshot>({ orders: [], bills: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billOrderId, setBillOrderId] = useState("");
  const [taxAmount, setTaxAmount] = useState(0);
  const [serviceAmount, setServiceAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentBillId, setPaymentBillId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentReference, setPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);
  const canVoid = ["owner", "manager"].includes(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshot(await loadBillingSnapshot(workspace));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load order billing.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const billByOrder = useMemo(() => new Map(snapshot.bills.map((bill) => [bill.orderId, bill])), [snapshot.bills]);
  const orderById = useMemo(() => new Map(snapshot.orders.map((order) => [order.id, order])), [snapshot.orders]);
  const paidByBill = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payment of snapshot.payments) {
      if (payment.status !== "captured") continue;
      totals.set(payment.billId, (totals.get(payment.billId) || 0) + payment.amount);
    }
    return totals;
  }, [snapshot.payments]);
  const readyOrders = useMemo(() => snapshot.orders.filter((order) => ["ready", "served", "completed"].includes(order.status)), [snapshot.orders]);
  const selectedOrder = billOrderId ? orderById.get(billOrderId) || null : null;
  const selectedBill = paymentBillId ? snapshot.bills.find((bill) => bill.id === paymentBillId) || null : null;
  const selectedRemaining = selectedBill ? Math.max(0, selectedBill.totalAmount - (paidByBill.get(selectedBill.id) || 0)) : 0;

  function startBill(order: BillableOrder) {
    const existing = billByOrder.get(order.id);
    setBillOrderId(order.id);
    setTaxAmount(existing?.taxAmount || 0);
    setServiceAmount(existing?.serviceChargeAmount || 0);
    setDiscountAmount(existing?.discountAmount || 0);
  }

  async function saveBill() {
    if (!billOrderId) return;
    setSaving(true);
    setError("");
    try {
      await saveOrderBill(workspace, {
        orderId: billOrderId,
        taxAmount,
        serviceChargeAmount: serviceAmount,
        discountAmount,
      });
      setBillOrderId("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this bill.");
    } finally {
      setSaving(false);
    }
  }

  function startPayment(bill: OrderBill) {
    const remaining = Math.max(0, bill.totalAmount - (paidByBill.get(bill.id) || 0));
    setPaymentBillId(bill.id);
    setPaymentAmount(Number(remaining.toFixed(2)));
    setPaymentReference("");
  }

  async function recordPayment() {
    if (!selectedBill || paymentAmount <= 0) return;
    setSaving(true);
    setError("");
    try {
      await recordOrderPayment(workspace, {
        billId: selectedBill.id,
        amount: paymentAmount,
        method: paymentMethod,
        reference: paymentReference,
      });
      setPaymentBillId("");
      setPaymentReference("");
      await refresh();
      await onLedgerChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record this payment.");
    } finally {
      setSaving(false);
    }
  }

  async function voidPayment(paymentId: string) {
    if (!canVoid) return;
    if (typeof window !== "undefined" && !window.confirm("Void this recorded payment and its linked revenue ledger entry?")) return;
    setSaving(true);
    setError("");
    try {
      await voidOrderPayment(workspace, paymentId);
      await refresh();
      await onLedgerChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not void this payment.");
    } finally {
      setSaving(false);
    }
  }

  async function voidBill(billId: string) {
    if (!canVoid) return;
    if (typeof window !== "undefined" && !window.confirm("Void this bill? Captured payments must be voided first.")) return;
    setSaving(true);
    setError("");
    try {
      await voidOrderBill(workspace, billId);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not void this bill.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="order-billing-section">
    <div className="billing-section-head"><div><span className="kicker">Order settlement</span><h3>Bill real orders and record money actually received.</h3><p>Munaffa does not process the payment here. A staff member records a settlement only after cash, card, UPI, bank or another method has actually been received.</p></div><button onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/>Refresh</button></div>

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    <div className="billing-grid">
      <div className="billing-panel"><header><ReceiptText size={18}/><div><small>Billable orders</small><b>Ready, served or completed</b></div></header>{loading ? <div className="billing-empty">Loading orders…</div> : readyOrders.length === 0 ? <div className="billing-empty">No ready/served/completed orders are waiting for billing.</div> : <div className="billable-order-list">{readyOrders.map((order) => { const bill = billByOrder.get(order.id); return <article key={order.id}><div><small>{serviceLabel(order.serviceType)} · {order.status}</small><b>{order.serviceReference || `Order ${order.id.slice(0,8).toUpperCase()}`}</b><span>{money(order.subtotal)} menu subtotal</span></div><button disabled={bill?.status === "paid" || bill?.status === "voided"} onClick={() => startBill(order)}>{bill ? "Review bill" : <><Plus size={12}/>Create bill</>}</button></article>; })}</div>}</div>

      <div className="billing-panel"><header><CreditCard size={18}/><div><small>Recorded bills</small><b>Settlement status</b></div></header>{loading ? <div className="billing-empty">Loading bills…</div> : snapshot.bills.length === 0 ? <div className="billing-empty">No order bills have been created yet.</div> : <div className="bill-list">{snapshot.bills.map((bill) => { const order = orderById.get(bill.orderId); const paid = paidByBill.get(bill.id) || 0; const remaining = Math.max(0, bill.totalAmount - paid); const payments = snapshot.payments.filter((payment) => payment.billId === bill.id); return <article key={bill.id} className={bill.status === "voided" ? "voided" : ""}><div className="bill-main"><div><small>{order?.serviceReference || `Order ${bill.orderId.slice(0,8).toUpperCase()}`}</small><b>{money(bill.totalAmount)}</b><span>{statusLabel(bill.status)} · {money(paid)} received · {money(remaining)} remaining</span></div><div className="bill-actions">{remaining > 0 && bill.status !== "voided" && <button className="primary-action" onClick={() => startPayment(bill)}>Record payment</button>}{canVoid && bill.status !== "voided" && <button disabled={paid > 0} onClick={() => void voidBill(bill.id)}>Void bill</button>}</div></div><div className="bill-breakdown"><span>Subtotal {money(bill.subtotal)}</span><span>Tax {money(bill.taxAmount)}</span><span>Service {money(bill.serviceChargeAmount)}</span><span>Discount −{money(bill.discountAmount)}</span></div>{payments.length > 0 && <div className="bill-payments">{payments.map((payment) => <div key={payment.id} className={payment.status === "voided" ? "voided" : ""}><span><b>{paymentLabels[payment.method]}</b><small>{payment.reference || new Date(payment.createdAt).toLocaleString("en-IN")}</small></span><strong>{money(payment.amount)}</strong>{canVoid && payment.status === "captured" ? <button disabled={saving} onClick={() => void voidPayment(payment.id)}><RotateCcw size={11}/>Void</button> : <em>{payment.status}</em>}</div>)}</div>}</article>; })}</div>}</div>
    </div>

    {billOrderId && selectedOrder && <section className="production-task-form billing-form"><header><div><small>Bill for</small><h3>{selectedOrder.serviceReference || `Order ${selectedOrder.id.slice(0,8).toUpperCase()}`}</h3></div><strong>{money(selectedOrder.subtotal)} subtotal</strong></header><div className="inventory-create-grid"><label>Tax amount (INR)<input type="number" min="0" step="0.01" value={taxAmount} onChange={(event) => setTaxAmount(Math.max(0, Number(event.target.value)))}/></label><label>Service charge (INR)<input type="number" min="0" step="0.01" value={serviceAmount} onChange={(event) => setServiceAmount(Math.max(0, Number(event.target.value)))}/></label><label>Discount (INR)<input type="number" min="0" step="0.01" value={discountAmount} onChange={(event) => setDiscountAmount(Math.max(0, Number(event.target.value)))}/></label></div><div className="billing-preview"><span>Recorded bill total</span><b>{money(Math.max(0, selectedOrder.subtotal + taxAmount + serviceAmount - discountAmount))}</b></div><div className="production-form-actions"><button onClick={() => setBillOrderId("")}>Cancel</button><button className="primary-action" disabled={saving || discountAmount > selectedOrder.subtotal + taxAmount + serviceAmount} onClick={() => void saveBill()}>{saving ? "Saving…" : "Save bill"}</button></div><div className="privacy-hint"><CircleAlert size={14}/><span>Tax and service-charge amounts are entered explicitly. Munaffa is not inferring a tax regime or claiming tax-compliance calculation on your behalf.</span></div></section>}

    {selectedBill && <section className="production-task-form billing-form"><header><div><small>Record settlement</small><h3>{orderById.get(selectedBill.orderId)?.serviceReference || `Order ${selectedBill.orderId.slice(0,8).toUpperCase()}`}</h3></div><strong>{money(selectedRemaining)} remaining</strong></header><div className="inventory-create-grid"><label>Amount received<input type="number" min="0.01" max={selectedRemaining} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(Math.max(0, Number(event.target.value)))}/></label><label>Method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>{Object.entries(paymentLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Reference<input value={paymentReference} maxLength={200} onChange={(event) => setPaymentReference(event.target.value)} placeholder="UPI ref / card slip / optional note"/></label></div><div className="production-form-actions"><button onClick={() => setPaymentBillId("")}>Cancel</button><button className="primary-action" disabled={saving || paymentAmount <= 0 || paymentAmount > selectedRemaining} onClick={() => void recordPayment()}>{saving ? "Recording…" : "Record payment received"}</button></div><div className="privacy-hint"><CircleAlert size={14}/><span>This action records a settlement already received. It does not initiate, authorize or capture money from a payment provider.</span></div></section>}
  </section>;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
}

function statusLabel(status: string) {
  return ({ open: "Open", partially_paid: "Partially paid", paid: "Paid", voided: "Voided" } as Record<string,string>)[status] || status;
}

function serviceLabel(value: string) {
  return ({ dine_in: "Dine in", room_service: "Room service", counter: "Counter", takeaway: "Takeaway", delivery: "Delivery", other: "Other" } as Record<string,string>)[value] || "Order";
}
