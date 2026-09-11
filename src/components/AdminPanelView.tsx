import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Building2,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Cpu,
  Terminal,
  Activity,
  Play,
  Loader2,
} from 'lucide-react';
import { User, TuitionProfile, AdmissionRequest, PaymentTransaction, MarketplaceItem, AiDiagnosticStatus } from '../types';
import { playChime } from '../utils/audio';
import { safeFetchJson } from '../utils/api';

interface AdminPanelViewProps {
  currentUser: User;
  onRefreshAll: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ currentUser, onRefreshAll }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-status' | 'admissions' | 'tuitions' | 'marketplace' | 'transactions'>('overview');
  const [admissions, setAdmissions] = useState<AdmissionRequest[]>([]);
  const [tuitions, setTuitions] = useState<TuitionProfile[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);
  const [aiStatus, setAiStatus] = useState<AiDiagnosticStatus | null>(null);
  const [aiProbeResult, setAiProbeResult] = useState<any>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [testQuestionRunning, setTestQuestionRunning] = useState<string | null>(null);
  const [testQuestionAnswer, setTestQuestionAnswer] = useState<{ q: string; a: string; sources?: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [mRes, aRes, tRes, txRes, mkRes, aiRes] = await Promise.all([
        safeFetchJson<any>('/api/admin/metrics'),
        safeFetchJson<any>('/api/tuition/admissions/list'),
        safeFetchJson<any>('/api/tuition/all'),
        safeFetchJson<any>('/api/payments/transactions'),
        safeFetchJson<any>('/api/marketplace/items'),
        safeFetchJson<any>('/api/admin/ai-status'),
      ]);

      if (mRes?.success) setMetrics(mRes.metrics);
      if (aRes?.success) setAdmissions(aRes.admissions);
      if (tRes?.success) setTuitions(tRes.tuitions);
      if (txRes?.success) setTransactions(txRes.payments);
      if (mkRes?.success) setMarketplace(mkRes.items);
      if (aiRes?.success) setAiStatus(aiRes.status);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAiProbe = async () => {
    setIsProbing(true);
    setAiProbeResult(null);
    try {
      const res = await fetch('/api/admin/ai-test', { method: 'POST' });
      const data = await res.json();
      setAiProbeResult(data);
      if (data.result?.diagnostics) {
        setAiStatus(data.result.diagnostics);
      }
      playChime('click');
    } catch (err: any) {
      setAiProbeResult({ success: false, error: err.message || String(err) });
    } finally {
      setIsProbing(false);
    }
  };

  const handleRunQuestionTest = async (q: string) => {
    setTestQuestionRunning(q);
    setTestQuestionAnswer(null);
    try {
      const res = await fetch('/api/ai/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, classLevel: 8 }),
      });
      const data = await res.json();
      if (data.success) {
        setTestQuestionAnswer({ q, a: data.answer, sources: data.sources });
      } else {
        setTestQuestionAnswer({ q, a: `Error: ${data.message || 'Failed to generate answer'}` });
      }
      // Refresh AI status to get latest counts
      const statusRes = await safeFetchJson<any>('/api/admin/ai-status');
      if (statusRes?.success) setAiStatus(statusRes.status);
    } catch (err: any) {
      setTestQuestionAnswer({ q, a: `Network Exception: ${err.message || String(err)}` });
    } finally {
      setTestQuestionRunning(null);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateAdmission = async (id: string, status: 'Accepted' | 'Rejected' | 'Enrolled') => {
    try {
      await fetch(`/api/tuition/admissions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      playChime('click');
      fetchAdminData();
      onRefreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefundTransaction = async (id: string) => {
    const reason = prompt('Enter reason for issuing refund:');
    if (!reason) return;

    try {
      await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id, reason }),
      });
      playChime('badge');
      fetchAdminData();
      onRefreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMarketplace = async (id: string) => {
    if (!confirm('Remove this marketplace listing as admin?')) return;
    try {
      await fetch(`/api/marketplace/items/${id}`, { method: 'DELETE' });
      playChime('click');
      fetchAdminData();
      onRefreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#4A4A3A] tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#5A634E]" />
            <span>LearnX Central Platform Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8B8374]">
            Real-time control over users, admissions, 15% platform commission pool, and marketplace.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-full bg-[#F5F2ED] hover:bg-[#EBE7DF] border border-[#E5E0D8] text-[#4A4A3A] text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#5A634E]" />
          <span>Sync Real Data</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#8B8374]">
              <span>Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-[#5A634E]" />
            </div>
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#4A4A3A]">
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#5A634E] font-semibold truncate">
              ₹{metrics.totalCommissions.toLocaleString('en-IN')} (15% Pool)
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#8B8374]">
              <span>Admissions</span>
              <TrendingUp className="w-4 h-4 text-[#5A634E]" />
            </div>
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#4A4A3A]">
              {metrics.totalAdmissions} Total
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#5A634E] font-semibold truncate">
              {metrics.enrolledAdmissions} Paid & Enrolled
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#8B8374]">
              <span>Tutors & Centres</span>
              <Building2 className="w-4 h-4 text-[#5A634E]" />
            </div>
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#4A4A3A]">
              {metrics.totalCentres + metrics.totalTutors} Active
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#7A7468] font-semibold truncate">
              {metrics.totalCentres} Hubs • {metrics.totalTutors} Tutors
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#8B8374]">
              <span>Active Students</span>
              <Users className="w-4 h-4 text-[#5A634E]" />
            </div>
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#4A4A3A]">
              {metrics.totalStudents}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#7A7468] font-semibold truncate">
              {metrics.marketplaceListings} Listings
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'overview', label: 'Admissions Oversight' },
          { id: 'ai-status', label: 'AI System & Diagnostics' },
          { id: 'tuitions', label: 'Tutors & Centres' },
          { id: 'transactions', label: 'UPI Payments & Refunds' },
          { id: 'marketplace', label: 'Marketplace Moderation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition border flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-[#5A634E] text-white border-[#5A634E] shadow-xs'
                : 'bg-white text-[#7A7468] border-[#E5E0D8] hover:bg-[#F5F2ED]'
            }`}
          >
            {tab.id === 'ai-status' && <Cpu className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Admissions Oversight */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#4A4A3A]">All Platform Admission Applications</h3>
          <div className="space-y-2">
            {admissions.map((adm) => (
              <div
                key={adm.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#5A634E]">{adm.id}</span>
                    <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F2ED] text-[#7A7468] border border-[#E5E0D8]">
                      {adm.status}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-[#4A4A3A] mt-1">
                    {adm.studentName} → {adm.tuitionName}
                  </h4>
                  <div className="text-[11px] text-[#8B8374]">
                    Phone: {adm.studentPhone} • Fee: ₹{adm.feeAmount} • 15% Comm: ₹{adm.commissionAmount}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateAdmission(adm.id, 'Accepted')}
                    className="px-3 py-1 rounded-full bg-[#EDF0E9] hover:bg-[#D8DFD2] text-[#5A634E] text-xs font-semibold"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateAdmission(adm.id, 'Rejected')}
                    className="px-3 py-1 rounded-full bg-[#FADBD8] hover:bg-[#F5B7B1] text-[#922B21] text-xs font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateAdmission(adm.id, 'Enrolled')}
                    className="px-3 py-1 rounded-full bg-[#5A634E] hover:bg-[#484F3E] text-white text-xs font-semibold shadow-xs"
                  >
                    Mark Enrolled
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: AI System & Diagnostics */}
      {activeTab === 'ai-status' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#4A4A3A]">
                  AI Tutor Engine & Model Health
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    aiStatus?.status === 'connected'
                      ? 'bg-[#D5F5E3] text-[#1D8348] border-[#ABEBC6]'
                      : aiStatus?.status === 'degraded'
                      ? 'bg-[#FEF9E7] text-[#B7950B] border-[#F9E79F]'
                      : 'bg-[#FADBD8] text-[#922B21] border-[#F5B7B1]'
                  }`}
                >
                  {aiStatus?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-[#8B8374] mt-0.5">
                Active Model: <span className="font-mono text-[#5A634E] font-semibold">{aiStatus?.activeModel || 'gemini-2.5-flash'}</span> • Fallbacks: {aiStatus?.fallbackModels?.join(', ') || 'gemini-1.5-flash'}
              </p>
            </div>

            <button
              onClick={handleRunAiProbe}
              disabled={isProbing}
              className="px-4 py-2 rounded-full bg-[#5A634E] hover:bg-[#484F3E] text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs disabled:opacity-50"
            >
              {isProbing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              <span>{isProbing ? 'Probing Engine...' : 'Run Live Diagnostic Probe'}</span>
            </button>
          </div>

          {/* AI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5E0D8] space-y-0.5 shadow-xs">
              <span className="text-[11px] text-[#8B8374]">Total Requests</span>
              <div className="text-lg sm:text-xl font-serif font-bold text-[#4A4A3A]">{aiStatus?.totalRequests ?? 0}</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5E0D8] space-y-0.5 shadow-xs">
              <span className="text-[11px] text-[#8B8374]">Successful</span>
              <div className="text-lg sm:text-xl font-serif font-bold text-[#1D8348]">{aiStatus?.successfulRequests ?? 0}</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5E0D8] space-y-0.5 shadow-xs">
              <span className="text-[11px] text-[#8B8374]">Failed / Fallback</span>
              <div className="text-lg sm:text-xl font-serif font-bold text-[#922B21]">{aiStatus?.failedRequests ?? 0}</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5E0D8] space-y-0.5 shadow-xs">
              <span className="text-[11px] text-[#8B8374]">Round-trip Latency</span>
              <div className="text-lg sm:text-xl font-serif font-bold text-[#5A634E]">{aiStatus?.latencyMs ? `${aiStatus.latencyMs}ms` : '<350ms'}</div>
            </div>
          </div>

          {/* Probe Result Box */}
          {aiProbeResult && (
            <div className="p-4 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4A4A3A]">Probe Execution Output</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${aiProbeResult.success ? 'bg-[#D5F5E3] text-[#1D8348]' : 'bg-[#FADBD8] text-[#922B21]'}`}>
                  {aiProbeResult.success ? 'Passed' : 'Failed'}
                </span>
              </div>
              <pre className="text-[11px] font-mono p-3 bg-white rounded-xl border border-[#E5E0D8] overflow-x-auto text-[#4A4A3A] max-h-48">
                {JSON.stringify(aiProbeResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Live Doubt Engine Test */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] space-y-3 shadow-xs">
            <h4 className="text-xs sm:text-sm font-serif font-bold text-[#4A4A3A]">Interactive Test Queries</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Explain Archimedes principle with everyday examples for Class 9',
                'State Ohm law formula and explain SI unit of resistance',
                'What is double circulation in human heart and why is it necessary?',
                'Define refractive index of medium with respect to vacuum',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleRunQuestionTest(q)}
                  disabled={Boolean(testQuestionRunning)}
                  className="p-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#F5F2ED] border border-[#E5E0D8] text-left text-xs text-[#4A4A3A] transition flex items-center justify-between gap-2 disabled:opacity-50"
                >
                  <span className="truncate">{q}</span>
                  {testQuestionRunning === q ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5A634E] flex-shrink-0" />
                  ) : (
                    <Play className="w-3 h-3 text-[#5A634E] flex-shrink-0 fill-[#5A634E]" />
                  )}
                </button>
              ))}
            </div>

            {testQuestionAnswer && (
              <div className="p-3.5 rounded-xl bg-[#EDF0E9] border border-[#D8DFD2] space-y-1.5 text-xs">
                <div className="font-bold text-[#4A4A3A]">Q: {testQuestionAnswer.q}</div>
                <div className="text-[#5A634E] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{testQuestionAnswer.a}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Tuitions */}
      {activeTab === 'tuitions' && (
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#4A4A3A]">Registered Tutors & Coaching Centres</h3>
          <div className="space-y-2">
            {tuitions.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-serif font-bold text-[#4A4A3A]">{t.name}</span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F2ED] text-[#7A7468] uppercase border border-[#E5E0D8]">
                      {t.type}
                    </span>
                    {t.verified && (
                      <span className="text-[10px] text-[#5A634E] font-semibold bg-[#EDF0E9] border border-[#D8DFD2] px-2.5 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#8B8374] mt-0.5">
                    {t.location} • ₹{t.fees}/mo • {t.availableSeats} of {t.totalSeats} seats available
                  </div>
                </div>
                <div className="text-xs font-bold text-[#5A634E]">★ {t.rating}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#4A4A3A]">All Platform Transactions & Refund Control</h3>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#4A4A3A]">{tx.id}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        tx.status === 'Paid'
                          ? 'bg-[#EDF0E9] text-[#5A634E] border border-[#D8DFD2]'
                          : tx.status === 'Refunded'
                          ? 'bg-[#F5EEF8] text-[#7D3C98]'
                          : 'bg-[#FADBD8] text-[#922B21]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-xs font-serif font-bold text-[#4A4A3A] mt-1">{tx.description}</div>
                  <div className="text-[11px] text-[#8B8374]">
                    Paid by: {tx.userName} ({tx.vpa}) • Total: ₹{tx.amount} (Net: ₹{tx.netAmount}, 15% Comm: ₹{tx.commissionAmount})
                  </div>
                </div>

                {tx.status === 'Paid' && (
                  <button
                    onClick={() => handleRefundTransaction(tx.id)}
                    className="px-3.5 py-1.5 rounded-full bg-[#F5EEF8] hover:bg-[#EBDEF0] text-[#7D3C98] text-xs font-semibold transition"
                  >
                    Issue Refund
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#4A4A3A]">Marketplace Content Moderation</h3>
          <div className="space-y-2">
            {marketplace.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="text-xs sm:text-sm font-serif font-bold text-[#4A4A3A]">{m.title}</div>
                  <div className="text-[11px] text-[#8B8374]">
                    Category: {m.category} • Seller: {m.sellerName} • Price: {m.isExchange ? 'Exchange' : `₹${m.price}`}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMarketplace(m.id)}
                  className="px-3.5 py-1.5 rounded-full bg-[#FADBD8] hover:bg-[#F5B7B1] text-[#922B21] text-xs font-semibold"
                >
                  Remove Listing
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
