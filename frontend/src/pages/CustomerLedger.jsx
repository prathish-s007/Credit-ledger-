import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import API from '../services/api';
import {
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  RotateCcw,
  Sliders,
  FileDown,
  Printer,
  Receipt,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const fmtDateShort = (d) => new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Tab button ───────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
        : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
    }`}
  >
    {children}
  </button>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pager = ({ page, totalPages, onPage }) => (
  <div className="flex items-center justify-center gap-3 pt-4">
    <button
      onClick={() => onPage(Math.max(1, page - 1))}
      disabled={page === 1}
      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
    >← Prev</button>
    <span className="text-[11px] text-slate-500">{page} / {totalPages}</span>
    <button
      onClick={() => onPage(Math.min(totalPages, page + 1))}
      disabled={page === totalPages}
      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
    >Next →</button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomerLedger = () => {
  const { user } = useApp();
  const customerId = user?.id || user?._id;

  const [activeTab, setActiveTab]     = useState('ledger'); // 'ledger' | 'purchases' | 'payments'
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting]       = useState(false);

  // Ledger (combined)
  const [ledger, setLedger]           = useState([]);
  const [openingBal, setOpeningBal]   = useState(0);
  const [ledgerMetrics, setLedgerMetrics] = useState({ totalPurchases: 0, totalPayments: 0, outstandingBalance: 0 });

  // Purchases tab
  const [purchases, setPurchases]     = useState([]);
  const [purPage, setPurPage]         = useState(1);
  const [purPages, setPurPages]       = useState(1);
  const [purTotal, setPurTotal]       = useState(0);
  const [purSpent, setPurSpent]       = useState(0);
  const [expandedPurchase, setExpandedPurchase] = useState(null);

  // Payments tab
  const [payments, setPayments]       = useState([]);
  const [payPage, setPayPage]         = useState(1);
  const [payPages, setPayPages]       = useState(1);
  const [payTotal, setPayTotal]       = useState(0);
  const [payPaid, setPayPaid]         = useState(0);

  // ── Fetch ledger (combined view) ────────────────────────────────────────────
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/ledgers/customer/${customerId}`, {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
      });
      setLedger(res.data.ledger || []);
      setOpeningBal(res.data.openingBalance || 0);
      setLedgerMetrics(res.data.metrics || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [customerId, startDate, endDate]);

  // ── Fetch purchases ─────────────────────────────────────────────────────────
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/customer-portal/purchases', {
        params: { page: purPage, limit: 10, startDate: startDate || undefined, endDate: endDate || undefined },
      });
      setPurchases(res.data.data || []);
      setPurPages(res.data.pagination?.totalPages || 1);
      setPurTotal(res.data.pagination?.totalRecords || 0);
      setPurSpent(res.data.totalSpent || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [purPage, startDate, endDate]);

  // ── Fetch payments ──────────────────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/customer-portal/payments', {
        params: { page: payPage, limit: 10, startDate: startDate || undefined, endDate: endDate || undefined },
      });
      setPayments(res.data.data || []);
      setPayPages(res.data.pagination?.totalPages || 1);
      setPayTotal(res.data.pagination?.totalRecords || 0);
      setPayPaid(res.data.totalPaid || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [payPage, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'ledger')    fetchLedger();
    if (activeTab === 'purchases') fetchPurchases();
    if (activeTab === 'payments')  fetchPayments();
  }, [activeTab, fetchLedger, fetchPurchases, fetchPayments]);

  const handleFilter = (e) => {
    e.preventDefault();
    if (activeTab === 'ledger')    fetchLedger();
    if (activeTab === 'purchases') { setPurPage(1); fetchPurchases(); }
    if (activeTab === 'payments')  { setPayPage(1); fetchPayments(); }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  // ── PDF actions ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await API.get(`/ledgers/customer/${customerId}/statement/pdf`, {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href  = window.URL.createObjectURL(blob);
      link.download = `my_statement_${new Date().toISOString().slice(0, 7)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (e) {
      alert('Error generating statement PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const res = await API.get(`/ledgers/customer/${customerId}/statement/pdf`, {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const win  = window.open(url);
      if (win) win.addEventListener('load', () => win.print());
    } catch (e) {
      alert('Error opening print preview.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">My Account</span>
          <h2 className="text-2xl font-extrabold text-white mt-1">Transaction Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">Complete history of purchases, payments, and running balance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {printing ? <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Printer size={13} />}
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {downloading ? <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FileDown size={13} />}
            <span>Download PDF</span>
          </button>
        </div>
      </div>
      {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Purchases', value: fmt(ledgerMetrics.totalPurchases), icon: TrendingUp,   color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
          { label: 'Total Payments',  value: fmt(ledgerMetrics.totalPayments),  icon: IndianRupee, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
          { label: 'Outstanding Balance', value: fmt(ledgerMetrics.outstandingBalance), icon: AlertCircle,
            color: ledgerMetrics.outstandingBalance > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-700/30 border-slate-700 text-slate-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${color}`}><Icon size={18} /></div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
              <h4 className="text-xl font-black text-white mt-0.5">{value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Selector ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Tab active={activeTab === 'ledger'}    onClick={() => setActiveTab('ledger')}>📋 Full Ledger</Tab>
        <Tab active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')}>🛍 Purchase History</Tab>
        <Tab active={activeTab === 'payments'}  onClick={() => setActiveTab('payments')}>💳 Payment History</Tab>
      </div>

      {/* ── Date Filter ────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">From Date</label>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">To Date</label>
            <input
              type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer">
              <Sliders size={13} /><span>Apply Filter</span>
            </button>
            {(startDate || endDate) && (
              <button type="button" onClick={handleReset} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer" title="Reset">
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Content Panel ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-semibold">Loading…</p>
          </div>
        ) : (
          <>
            {/* ── LEDGER TAB ── */}
            {activeTab === 'ledger' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="py-4 px-5">Date</th>
                      <th className="py-4 px-5">Description</th>
                      <th className="py-4 px-5">Reference</th>
                      <th className="py-4 px-5">Debit (+)</th>
                      <th className="py-4 px-5">Credit (−)</th>
                      <th className="py-4 px-5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {(startDate || endDate) && (
                      <tr className="bg-slate-950/30 text-xs text-slate-600 font-semibold">
                        <td className="py-3 px-5" colSpan={3}>Opening Balance (carried forward)</td>
                        <td className="py-3 px-5">—</td>
                        <td className="py-3 px-5">—</td>
                        <td className="py-3 px-5 text-right font-bold text-slate-400">{fmt(openingBal)}</td>
                      </tr>
                    )}
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center">
                          <Receipt size={24} className="mx-auto mb-2 text-slate-700" />
                          <p className="text-xs text-slate-600 font-semibold">No transactions found for the selected period.</p>
                        </td>
                      </tr>
                    ) : ledger.map((entry) => {
                      const isPurchase = entry.type === 'purchase';
                      return (
                        <tr key={entry._id} className="hover:bg-slate-800/20 transition-colors text-xs text-slate-300">
                          <td className="py-4 px-5 text-slate-500">{fmtDate(entry.date)}</td>
                          <td className="py-4 px-5">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase mr-2 ${
                              isPurchase ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>{entry.type}</span>
                            <span className="font-semibold text-slate-200">{entry.description}</span>
                          </td>
                          <td className="py-4 px-5 font-mono text-[11px] text-slate-500">{entry.reference}</td>
                          <td className="py-4 px-5 font-bold text-rose-400">{entry.debit > 0 ? `+${fmt(entry.debit)}` : '—'}</td>
                          <td className="py-4 px-5 font-bold text-emerald-400">{entry.credit > 0 ? `−${fmt(entry.credit)}` : '—'}</td>
                          <td className="py-4 px-5 text-right font-black text-white">{fmt(entry.remainingBalance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── PURCHASES TAB ── */}
            {activeTab === 'purchases' && (
              <div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <span className="text-xs text-slate-500">{purTotal} purchase{purTotal !== 1 ? 's' : ''} · Total spent: <strong className="text-rose-400">{fmt(purSpent)}</strong></span>
                </div>
                {purchases.length === 0 ? (
                  <div className="text-center py-14">
                    <ShoppingBag size={24} className="mx-auto mb-2 text-slate-700" />
                    <p className="text-xs text-slate-600 font-semibold">No purchases found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {purchases.map((p) => (
                      <div key={p._id}>
                        <div
                          className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/20 transition-all cursor-pointer"
                          onClick={() => setExpandedPurchase(expandedPurchase === p._id ? null : p._id)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                            <ShoppingBag size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white">{p.purchaseId}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{fmtDateShort(p.createdAt)} · {p.products?.length || 0} item(s)</p>
                          </div>
                          <span className="text-sm font-black text-rose-400 shrink-0">+{fmt(p.totalAmount)}</span>
                          {expandedPurchase === p._id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                        </div>
                        {expandedPurchase === p._id && p.products?.length > 0 && (
                          <div className="bg-slate-950/40 border-t border-slate-800/50 px-6 py-4 space-y-2">
                            {p.products.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-semibold text-slate-300">{item.name}</span>
                                <span>{item.quantity} × {fmt(item.price)} = <strong className="text-white">{fmt(item.total)}</strong></span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {purPages > 1 && <div className="px-6 pb-5"><Pager page={purPage} totalPages={purPages} onPage={setPurPage} /></div>}
              </div>
            )}

            {/* ── PAYMENTS TAB ── */}
            {activeTab === 'payments' && (
              <div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <span className="text-xs text-slate-500">{payTotal} payment{payTotal !== 1 ? 's' : ''} · Total paid: <strong className="text-emerald-400">{fmt(payPaid)}</strong></span>
                </div>
                {payments.length === 0 ? (
                  <div className="text-center py-14">
                    <IndianRupee size={24} className="mx-auto mb-2 text-slate-700" />
                    <p className="text-xs text-slate-600 font-semibold">No payments recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {payments.map((p) => {
                      const methodColor = p.paymentMethod === 'Cash' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                          p.paymentMethod === 'UPI'  ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                                                        'text-blue-400 bg-blue-500/10 border-blue-500/20';
                      return (
                        <div key={p._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/20 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <IndianRupee size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white">Payment Received</p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${methodColor}`}>
                                {p.paymentMethod}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {fmtDateShort(p.createdAt)}{p.remarks ? ` · ${p.remarks}` : ''}
                            </p>
                          </div>
                          <span className="text-sm font-black text-emerald-400 shrink-0">−{fmt(p.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {payPages > 1 && <div className="px-6 pb-5"><Pager page={payPage} totalPages={payPages} onPage={setPayPage} /></div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerLedger;
