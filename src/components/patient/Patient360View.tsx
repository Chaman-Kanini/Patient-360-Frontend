import React, { useState, useMemo, useCallback } from 'react';
import {
  Heart, Pill, Activity, Stethoscope, FileText, Users, Building,
  AlertTriangle, ChevronDown, ChevronRight, Search, Filter, Calendar,
  TrendingUp, FlaskConical, Clock, X, MessageCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { ClinicalChatbot } from './ClinicalChatbot';

interface Patient360ViewProps {
  patientData: any;
  batchId?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

const fmtDate = (d: string) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

const parseNumeric = (v: any): number | null => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? null : n;
  }
  return null;
};

const isAbnormal = (lab: any): 'high' | 'low' | null => {
  // Check explicit interpretation/flag field first
  const interp = (lab.interpretation || lab.flag || '').toString().toLowerCase();
  if (interp.includes('critical high') || interp.includes('high') || interp.includes('above')) return 'high';
  if (interp.includes('critical low') || interp.includes('low') || interp.includes('below')) return 'low';
  if (interp.includes('abnormal')) return 'high';
  // Fallback: detect (H)/(L) flags embedded in value string (legacy data)
  const val = (lab.value || '').toString();
  if (/\(H\)/i.test(val)) return 'high';
  if (/\(L\)/i.test(val)) return 'low';
  return null;
};

const CHART_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];

// ─── Tab definitions ────────────────────────────────────────────────────────

type TabId = 'overview' | 'labs' | 'diagnoses' | 'care-team' | 'history' | 'plans';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'labs', label: 'Labs', icon: FlaskConical },
  { id: 'diagnoses', label: 'Diagnoses', icon: Heart },
  { id: 'care-team', label: 'Care Team', icon: Users },
  { id: 'history', label: 'History', icon: Activity },
  { id: 'plans', label: 'Plans', icon: FileText },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export const Patient360View: React.FC<Patient360ViewProps> = ({ patientData, batchId }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAbnormalOnly, setFilterAbnormalOnly] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('');
  const [expandedTimeline, setExpandedTimeline] = useState<Set<number>>(new Set());
  const [expandedDiagnoses, setExpandedDiagnoses] = useState<Set<number>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [pdfViewerState, setPdfViewerState] = useState<{
    open: boolean;
    documentName: string;
    page: number;
    searchText: string;
    blobUrl: string;
    loading: boolean;
  }>({ open: false, documentName: '', page: 1, searchText: '', blobUrl: '', loading: false });

  if (!patientData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No patient data available</p>
      </div>
    );
  }

  // ─── Data extraction ────────────────────────────────────────────────────

  const encounters = patientData.encounter_timeline_detailed || [];
  const diagnoses = patientData.diagnoses || patientData.conditions || [];
  const diagnosisFlows = patientData.diagnosis_flows || [];
  const labs = patientData.laboratory_results || [];
  const medications = patientData.medications || [];
  const allergies = patientData.allergies || [];
  const careTeam = patientData.care_team || [];
  const facilities = patientData.facilities || [];
  const plans = patientData.plans_and_followups || [];
  const socialHistory = patientData.social_history || {};
  const functionalStatus = patientData.functional_status || {};
  const medicalHistory = patientData.medical_history || {};
  const conflicts = patientData.conflicts || [];
  const patientSummary = patientData.patient_summary || '';

  // ─── Clinical timeline from LLM output ─────────────────────────────────
  const clinicalTimeline = patientData.clinical_timeline || [];

  const timelineItems = useMemo(() => {
    if (!Array.isArray(clinicalTimeline) || clinicalTimeline.length === 0) return [];

    // Client-side fallback: group individual lab entries on the same date into one
    const labsByDate: Record<string, any[]> = {};
    const nonLabItems: any[] = [];
    clinicalTimeline.forEach((item: any) => {
      if (item.event_type === 'lab' && !item.sub_items) {
        const dateKey = item.date || 'unknown';
        if (!labsByDate[dateKey]) labsByDate[dateKey] = [];
        labsByDate[dateKey].push(item);
      } else {
        nonLabItems.push(item);
      }
    });

    const groupedLabs = Object.entries(labsByDate).map(([date, labs]) => {
      if (labs.length === 1) return labs[0]; // single lab, no grouping needed
      return {
        date,
        event_type: 'lab',
        title: `Lab Results (${labs.length} tests)`,
        details: labs.map((l: any) => l.title || l.details || '').filter(Boolean).slice(0, 3).join(', ') || 'Multiple lab tests performed',
        sub_items: labs.map((l: any) => ({
          test: l.title || l.details || '',
          value: '', unit: '', interpretation: '',
          ...l,
        })),
        provider: labs[0]?.provider,
        facility: labs[0]?.facility,
        _source: labs.flatMap((l: any) => l._source || []),
      };
    });

    const merged = [...nonLabItems, ...groupedLabs];
    // Display newest first
    return merged.sort((a: any, b: any) => {
      try { return new Date(b.date).getTime() - new Date(a.date).getTime(); }
      catch { return 0; }
    });
  }, [clinicalTimeline]);

  // ─── Abnormal labs extraction ───────────────────────────────────────────

  const allLabResults = useMemo(() => {
    const results: any[] = [];
    // From standalone labs
    labs.forEach((lab: any) => {
      if (lab.test || lab.name) results.push(lab);
      if (lab.results && Array.isArray(lab.results)) {
        lab.results.forEach((r: any) => results.push({ ...r, panel: lab.panel || lab.name, date: lab.date || lab.collection_date }));
      }
    });
    // From encounters
    encounters.forEach((enc: any) => {
      (enc.laboratory_results || []).forEach((lab: any) => {
        results.push({ ...lab, date: lab.date || enc.date });
      });
    });
    return results;
  }, [labs, encounters]);

  const abnormalLabs = useMemo(() =>
    allLabResults.filter(l => isAbnormal(l) !== null),
    [allLabResults]
  );

  // ─── Lab trend data (group by test name) ────────────────────────────────

  const labTrends = useMemo(() => {
    const grouped: Record<string, { date: string; value: number; unit?: string; ref?: string }[]> = {};
    allLabResults.forEach(lab => {
      const name = lab.test || lab.name;
      const val = parseNumeric(lab.value);
      if (name && val !== null && lab.date) {
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push({
          date: lab.date,
          value: val,
          unit: lab.unit,
          ref: lab.reference_range,
        });
      }
    });
    // Only keep tests with 2+ data points
    const trends: Record<string, any[]> = {};
    Object.entries(grouped).forEach(([name, pts]) => {
      if (pts.length >= 2) {
        trends[name] = pts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    });
    return trends;
  }, [allLabResults]);

  // ─── Available years for filter ─────────────────────────────────────────

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    timelineItems.forEach(item => {
      try { years.add(new Date(item.date).getFullYear().toString()); } catch {}
    });
    return Array.from(years).sort().reverse();
  }, [timelineItems]);

  // ─── Filtered timeline ─────────────────────────────────────────────────

  const filteredTimeline = useMemo(() => {
    let items = timelineItems;
    if (filterYear) {
      items = items.filter(i => {
        try { return new Date(i.date).getFullYear().toString() === filterYear; } catch { return false; }
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.details || '').toLowerCase().includes(q) ||
        (i.event_type || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [timelineItems, filterYear, searchQuery]);

  // ─── Filtered labs ──────────────────────────────────────────────────────

  const filteredLabs = useMemo(() => {
    let results = filterAbnormalOnly ? abnormalLabs : allLabResults;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(l =>
        (l.test || l.name || '').toLowerCase().includes(q) ||
        (l.panel || '').toLowerCase().includes(q)
      );
    }
    if (filterYear) {
      results = results.filter(l => {
        try { return new Date(l.date).getFullYear().toString() === filterYear; } catch { return false; }
      });
    }
    return results;
  }, [allLabResults, abnormalLabs, filterAbnormalOnly, searchQuery, filterYear]);

  // ─── Toggle helpers ─────────────────────────────────────────────────────

  const toggleTimeline = useCallback((idx: number) => {
    setExpandedTimeline(prev => {
      const s = new Set(prev);
      s.has(idx) ? s.delete(idx) : s.add(idx);
      return s;
    });
  }, []);

  const toggleDiagnosis = useCallback((idx: number) => {
    setExpandedDiagnoses(prev => {
      const s = new Set(prev);
      s.has(idx) ? s.delete(idx) : s.add(idx);
      return s;
    });
  }, []);

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  }, []);


  // ─── Render: Summary Banner ─────────────────────────────────────────────

  // ─── Source document count ─────────────────────────────────────────────
  const sourceDocCount = patientData._source_document_count || patientData._source_documents?.length || 0;
  const sourceDocNames: string[] = patientData._source_document_names || [];

  const renderSummaryBanner = () => {
    return (
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-xl shadow-lg mb-6 overflow-hidden">
        {/* Patient Summary Section */}
        {patientSummary && (
          <div className="px-6 pt-5 pb-4">
            <button
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Clinical Summary</h3>
                  <span className="text-xs text-slate-400">
                    {sourceDocCount > 0 ? `Aggregated from ${sourceDocCount} source document${sourceDocCount !== 1 ? 's' : ''}` : 'AI-generated summary'}
                  </span>
                </div>
              </div>
              {summaryExpanded
                ? <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                : <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
              }
            </button>
            {summaryExpanded && (
              <div className="mt-3 pl-[52px] space-y-1.5">
                {patientSummary.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => {
                  const trimmed = line.trim();
                  const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
                  const text = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      {isBullet && <span className="text-blue-400 mt-0.5 flex-shrink-0 text-sm font-bold">•</span>}
                      <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {patientSummary && <div className="border-t border-white/10 mx-6" />}

        {/* Quick Stats - Full Width */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">Quick Stats</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{timelineItems.length}</div>
              <div className="text-xs text-slate-400">Timeline Events</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{abnormalLabs.length}</div>
              <div className="text-xs text-slate-400">Abnormal Labs</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{(Array.isArray(medications) ? medications : []).length}</div>
              <div className="text-xs text-slate-400">Medications</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{(Array.isArray(diagnoses) ? diagnoses : []).length}</div>
              <div className="text-xs text-slate-400">Diagnoses</div>
            </div>
          </div>
          {sourceDocNames.length > 0 && (
            <div className="mt-3 bg-white/5 rounded-lg px-3 py-2">
              <div className="text-xs text-slate-400 mb-1">Source Documents ({sourceDocCount})</div>
              {sourceDocNames.map((name: string, i: number) => (
                <div key={i} className="text-xs text-slate-300 truncate">- {name}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render: Conflict Badge ─────────────────────────────────────────────

  const renderConflictBadge = () => {
    if (conflicts.length === 0) return null;
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="font-semibold text-amber-800">
            {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
          </span>
        </div>
        <button
          onClick={() => toggleSection('conflicts-inline')}
          className="text-sm text-amber-700 hover:text-amber-900 underline"
        >
          {collapsedSections.has('conflicts-inline') ? 'Hide' : 'Show'} Details
        </button>
      </div>
    );
  };

  const renderConflictDetails = () => {
    if (conflicts.length === 0 || !collapsedSections.has('conflicts-inline')) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 space-y-3">
        {conflicts.map((c: any, i: number) => (
          <div key={i} className="bg-white border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold">CONFLICT</span>
              <span className="font-medium text-gray-900">{c.entity_name || c.field || 'Unknown'}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{c.conflict_description || c.description || ''}</p>
            {c.variants && (
              <div className="space-y-1">
                {c.variants.map((v: any, vi: number) => (
                  <div key={vi} className="ml-4 pl-3 border-l-2 border-amber-300 text-sm">
                    <span className="font-medium">{v.value || JSON.stringify(v)}</span>
                    {v._source && <span className="text-xs text-gray-500 ml-2">({v._source})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ─── Render: Search & Filter Bar ────────────────────────────────────────

  const renderSearchFilter = () => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search labs, diagnoses, encounters..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
      >
        <Filter className="h-4 w-4" />
        Filters
      </button>
      {showFilters && (
        <>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {activeTab === 'labs' && (
            <button
              onClick={() => setFilterAbnormalOnly(!filterAbnormalOnly)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${filterAbnormalOnly ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Activity className="h-4 w-4" />
              Abnormal Only
            </button>
          )}
        </>
      )}
    </div>
  );

  // ─── Render: Tab Navigation ─────────────────────────────────────────────

  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ─── Render: Collapsible Section Wrapper ────────────────────────────────

  const CollapsibleSection: React.FC<{
    id: string; title: string; icon: React.ElementType; color: string;
    count?: number; children: React.ReactNode; defaultOpen?: boolean;
  }> = ({ id, title, icon: Icon, color, count, children, defaultOpen = true }) => {
    const isOpen = defaultOpen ? !collapsedSections.has(id) : collapsedSections.has(id);
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-gray-900">{title}</span>
            {count !== undefined && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{count}</span>
            )}
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>
        {isOpen && <div className="px-5 pb-4 border-t border-gray-100">{children}</div>}
      </div>
    );
  };

  // ─── Render: Generic key-value for objects ──────────────────────────────

  const renderKV = (obj: any) => {
    if (!obj || typeof obj !== 'object') return null;
    const entries = Object.entries(obj).filter(([k]) => !k.startsWith('_') && k !== 'sourceDocuments');
    if (entries.length === 0) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        {entries.map(([k, v]) => (
          <div key={k} className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{fmt(k)}</div>
            <div className="text-sm text-gray-900">
              {Array.isArray(v) ? v.map((item, i) => (
                <div key={i} className="pl-2 border-l-2 border-blue-200 mb-1">
                  {typeof item === 'object' ? Object.entries(item).map(([ik, iv]) => (
                    <div key={ik} className="text-xs"><span className="font-medium text-gray-600">{fmt(ik)}:</span> {String(iv)}</div>
                  )) : String(item)}
                </div>
              )) : typeof v === 'object' && v !== null ? Object.entries(v).map(([ik, iv]) => (
                <div key={ik} className="text-xs"><span className="font-medium text-gray-600">{fmt(ik)}:</span> {String(iv)}</div>
              )) : String(v ?? 'N/A')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Render: Array items ────────────────────────────────────────────────

  const renderArrayItems = (items: any[]) => (
    <div className="space-y-2 mt-3">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-50 border-l-4 border-blue-400 rounded-lg p-3">
          {typeof item === 'object' && item !== null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(item).filter(([k]) => !k.startsWith('_') && k !== 'sourceDocuments').map(([k, v]) => (
                <div key={k}>
                  <span className="text-xs font-semibold text-gray-500 uppercase">{fmt(k)}</span>
                  <div className="text-sm text-gray-900">{Array.isArray(v) ? v.join(', ') : String(v ?? 'N/A')}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-gray-900">{String(item)}</div>}
        </div>
      ))}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: Overview (Epic/Cerner-style: Timeline left, Detail right)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderOverviewTab = () => (
    <div className="flex gap-6 mt-6">
      {/* LEFT: Clinical Timeline */}
      <div className="w-1/2 min-w-0">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Clinical Timeline
        </h3>

        {filteredTimeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>No timeline events found</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-3">
              {filteredTimeline.map((item: any, idx: number) => {
                const isExpanded = expandedTimeline.has(idx);
                const isSelected = selectedTimelineItem === idx;
                const typeColors: Record<string, string> = {
                  encounter: 'bg-blue-500',
                  lab: 'bg-green-500',
                  procedure: 'bg-purple-500',
                  diagnosis: 'bg-red-500',
                  medication: 'bg-teal-500',
                  vitals: 'bg-orange-500',
                  imaging: 'bg-pink-500',
                  referral: 'bg-indigo-500',
                  treatment: 'bg-emerald-500',
                  plan: 'bg-cyan-500',
                };
                return (
                  <div key={idx} className="relative pl-10">
                    <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white shadow ${typeColors[item.event_type] || 'bg-gray-400'}`} />
                    <div
                      className={`rounded-lg border transition-all cursor-pointer ${
                        isSelected ? 'border-blue-400 shadow-md bg-blue-50/50' : 'border-gray-200 bg-white hover:shadow-sm hover:border-gray-300'
                      }`}
                    >
                      <button
                        onClick={() => {
                          toggleTimeline(idx);
                          setSelectedTimelineItem(isSelected ? null : idx);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between text-left"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-500">{fmtDate(item.date)}</div>
                          <div className="font-medium text-gray-900 truncate">{item.title}</div>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            typeColors[item.event_type] ? 'bg-opacity-10 text-gray-600' : 'bg-gray-100 text-gray-600'
                          }`} style={{ backgroundColor: `${typeColors[item.event_type]?.replace('bg-', '')}10` }}>
                            {(item.event_type || 'event').replace(/_/g, ' ')}
                          </span>
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-3 border-t border-gray-100 space-y-2 pt-3">
                          {item.details && (
                            <p className="text-sm text-gray-700">{item.details}</p>
                          )}
                          {/* Sub-items for grouped lab results */}
                          {Array.isArray(item.sub_items) && item.sub_items.length > 0 && (
                            <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-1.5 text-left font-semibold text-gray-500 uppercase">Test</th>
                                    <th className="px-3 py-1.5 text-left font-semibold text-gray-500 uppercase">Value</th>
                                    <th className="px-3 py-1.5 text-left font-semibold text-gray-500 uppercase">Unit</th>
                                    <th className="px-3 py-1.5 text-left font-semibold text-gray-500 uppercase">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {item.sub_items.map((sub: any, si: number) => {
                                    const interp = (sub.interpretation || '').toLowerCase();
                                    const isHigh = interp.includes('high') || interp.includes('abnormal');
                                    const isLow = interp.includes('low');
                                    return (
                                      <tr key={si} className={`${isHigh ? 'bg-red-50/50' : isLow ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-3 py-1.5 font-medium text-gray-900">{sub.test || sub.name}</td>
                                        <td className={`px-3 py-1.5 font-semibold ${isHigh ? 'text-red-600' : isLow ? 'text-blue-600' : 'text-gray-900'}`}>{sub.value}</td>
                                        <td className="px-3 py-1.5 text-gray-500">{sub.unit || ''}</td>
                                        <td className="px-3 py-1.5">
                                          {sub.interpretation && (
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                              isHigh ? 'bg-red-100 text-red-700' : isLow ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                              {sub.interpretation}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                            {item.provider && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" /> {item.provider}
                              </span>
                            )}
                            {item.facility && (
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" /> {item.facility}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Detail Panel (Abnormal Labs + Quick Sections) */}
      <div className="w-1/2 min-w-0 space-y-4">
        {/* Abnormal Labs Panel */}
        {abnormalLabs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-gray-900">Abnormal Labs</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{abnormalLabs.length}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {abnormalLabs.map((lab, i) => {
                const abn = isAbnormal(lab);
                return (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 cursor-default">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${abn === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <span className="text-sm font-medium text-gray-900 truncate">{lab.test || lab.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-sm font-bold ${abn === 'high' ? 'text-red-600' : 'text-blue-600'}`}>
                        {lab.value} {lab.unit || ''}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        abn === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {abn === 'high' ? 'H' : 'L'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Medications Quick View */}
        {Array.isArray(medications) && medications.length > 0 && (
          <CollapsibleSection id="meds-quick" title="Active Medications" icon={Pill} color="bg-green-50 text-green-600" count={medications.length}>
            <div className="space-y-2 mt-2">
              {medications.map((med: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Pill className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{med.name || med.medication || (typeof med === 'string' ? med : JSON.stringify(med))}</span>
                    {med.dosage && <span className="text-gray-500 ml-1">{med.dosage}</span>}
                    {med.frequency && <span className="text-gray-500 ml-1">({med.frequency})</span>}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Allergies Quick View */}
        {Array.isArray(allergies) && allergies.length > 0 && (
          <CollapsibleSection id="allergies-quick" title="Allergies" icon={AlertTriangle} color="bg-orange-50 text-orange-600" count={allergies.length}>
            <div className="space-y-2 mt-2">
              {allergies.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{a.allergen || a.name || (typeof a === 'string' ? a : JSON.stringify(a))}</span>
                    {a.reaction && <span className="text-red-600 ml-1">({a.reaction})</span>}
                    {a.severity && <span className="text-gray-500 ml-1">Severity: {a.severity}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: Labs (with trend charts)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderLabsTab = () => (
    <div className="space-y-6">
      {/* Lab Trend Charts */}
      {Object.keys(labTrends).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Lab Trends Over Time</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(labTrends).map(([name, points], idx) => (
              <div key={name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm">{name}</h4>
                  <span className="text-xs text-gray-500">{points[0]?.unit || ''}</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={points.map(p => ({ ...p, dateLabel: fmtDate(p.date) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value: any) => [`${value} ${points[0]?.unit || ''}`, name]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-gray-900">All Lab Results</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{filteredLabs.length}</span>
          </div>
        </div>
        {filteredLabs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No lab results found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Test</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLabs.map((lab, i) => {
                  const abn = isAbnormal(lab);
                  return (
                    <tr key={i} className={`hover:bg-gray-50 ${abn ? (abn === 'high' ? 'bg-red-50/50' : 'bg-blue-50/50') : ''}`}>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{lab.test || lab.name}</td>
                      <td className={`px-4 py-2.5 text-sm font-semibold ${abn === 'high' ? 'text-red-600' : abn === 'low' ? 'text-blue-600' : 'text-gray-900'}`}>
                        {lab.value} {lab.unit || ''}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500">{lab.reference_range || 'N/A'}</td>
                      <td className="px-4 py-2.5">
                        {abn ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            abn === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {abn === 'high' ? 'HIGH' : 'LOW'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Normal</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500">{lab.date ? fmtDate(lab.date) : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: Diagnoses (Accordion drill-down)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDiagnosesTab = () => {
    // Merge standalone diagnoses + diagnosis flows
    const allDiagnoses: any[] = [];

    if (Array.isArray(diagnoses)) {
      diagnoses.forEach((d: any) => {
        const name = typeof d === 'string' ? d : d.name || d.diagnosis || d.condition || '';
        const flow = diagnosisFlows.find((f: any) => f.diagnosis?.toLowerCase() === name.toLowerCase());
        allDiagnoses.push({ name, raw: d, flow });
      });
    }

    // Add flows not already in diagnoses
    diagnosisFlows.forEach((f: any) => {
      if (!allDiagnoses.find(d => d.name.toLowerCase() === f.diagnosis?.toLowerCase())) {
        allDiagnoses.push({ name: f.diagnosis, raw: f, flow: f });
      }
    });

    if (allDiagnoses.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg">No diagnosis data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {allDiagnoses.map((diag, idx) => {
          const isOpen = expandedDiagnoses.has(idx);
          const trace = diag.flow?.clinical_trace;

          return (
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleDiagnosis(idx)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {diag.name}
                      {(diag.raw?.status || diag.flow?.status) && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          (diag.raw?.status || diag.flow?.status) === 'active' ? 'bg-red-100 text-red-700' :
                          (diag.raw?.status || diag.flow?.status) === 'chronic' ? 'bg-amber-100 text-amber-700' :
                          (diag.raw?.status || diag.flow?.status) === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {diag.raw?.status || diag.flow?.status}
                        </span>
                      )}
                    </div>
                    {(diag.raw?.date || diag.flow?.date) && (
                      <div className="text-xs text-gray-500 mt-0.5">{fmtDate(diag.raw?.date || diag.flow?.date)}</div>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
                  {/* Encounter context */}
                  {(trace?.encounter_date || trace?.encounter_facility) && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div className="text-sm">
                        {trace.encounter_date && <span><strong>Encounter:</strong> {fmtDate(trace.encounter_date)}</span>}
                        {trace.encounter_facility && <span className="ml-2 text-gray-500">at {trace.encounter_facility}</span>}
                      </div>
                    </div>
                  )}

                  {/* Clinical Reasoning */}
                  {trace?.clinical_reasoning && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <Stethoscope className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-700 uppercase mb-1">Clinical Reasoning</h4>
                          <p className="text-sm text-gray-700">{trace.clinical_reasoning}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Presenting symptoms */}
                  {trace?.presenting_symptoms?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-orange-600 uppercase mb-2">Presenting Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {trace.presenting_symptoms.map((s: string, si: number) => (
                          <span key={si} className="px-2 py-1 bg-orange-50 border border-orange-200 rounded text-sm">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objective findings (Supporting Evidence) */}
                  {trace?.objective_findings?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-green-600 uppercase mb-2">Supporting Evidence</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {trace.objective_findings.map((f: any, fi: number) => (
                          <div key={fi} className="bg-gray-50 p-3 rounded border border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500 uppercase">{f.type}</span>
                              <div className="flex items-center gap-1">
                                {f.evidence_strength && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                    f.evidence_strength === 'definitive' ? 'bg-green-100 text-green-700' :
                                    f.evidence_strength === 'supportive' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>{f.evidence_strength}</span>
                                )}
                                {f.interpretation && (
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                    f.interpretation.includes('H') ? 'bg-red-100 text-red-700' :
                                    f.interpretation.includes('L') ? 'bg-blue-100 text-blue-700' :
                                    f.interpretation === 'Normal' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>{f.interpretation}</span>
                                )}
                              </div>
                            </div>
                            <div className="font-medium text-gray-900 text-sm">{f.name}</div>
                            <div className="text-sm">{f.value} {f.unit || ''}</div>
                            {f.reference_range && <div className="text-xs text-gray-500 mt-1">Ref: {f.reference_range}</div>}
                            {f.date && <div className="text-xs text-gray-400 mt-1">{fmtDate(f.date)}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final diagnosis statement */}
                  {trace?.final_diagnosis_statement && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <Stethoscope className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-red-600 uppercase mb-1">Final Diagnosis Statement</h4>
                          <p className="text-sm text-gray-700">{trace.final_diagnosis_statement}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raw data fallback if no flow */}
                  {!diag.flow && typeof diag.raw === 'object' && renderKV(diag.raw)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: Care Team
  // ═══════════════════════════════════════════════════════════════════════════

  const renderCareTeamTab = () => (
    <div className="space-y-4">
      {/* Care Team Members */}
      {Array.isArray(careTeam) && careTeam.length > 0 ? (
        <CollapsibleSection id="care-team-members" title="Care Team Members" icon={Users} color="bg-violet-50 text-violet-600" count={careTeam.length}>
          {renderArrayItems(careTeam)}
        </CollapsibleSection>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p>No care team data available</p>
        </div>
      )}

      {/* Facilities */}
      {Array.isArray(facilities) && facilities.length > 0 && (
        <CollapsibleSection id="facilities" title="Facilities" icon={Building} color="bg-amber-50 text-amber-600" count={facilities.length}>
          {renderArrayItems(facilities)}
        </CollapsibleSection>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: History (Social History, Functional Status, Medical History)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderHistoryTab = () => {
    const hasSocial = socialHistory && typeof socialHistory === 'object' && Object.keys(socialHistory).length > 0;
    const hasFunctional = functionalStatus && typeof functionalStatus === 'object' && Object.keys(functionalStatus).length > 0;
    const hasMedical = medicalHistory && typeof medicalHistory === 'object' && Object.keys(medicalHistory).length > 0;

    if (!hasSocial && !hasFunctional && !hasMedical) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg">No history data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Social History */}
        {hasSocial && (
          <CollapsibleSection id="social-history" title="Social History" icon={Users} color="bg-cyan-50 text-cyan-600">
            {Array.isArray(socialHistory) ? renderArrayItems(socialHistory) : renderKV(socialHistory)}
          </CollapsibleSection>
        )}

        {/* Functional Status */}
        {hasFunctional && (
          <CollapsibleSection id="functional-status" title="Functional Status" icon={Activity} color="bg-lime-50 text-lime-600">
            {Array.isArray(functionalStatus) ? renderArrayItems(functionalStatus) : renderKV(functionalStatus)}
          </CollapsibleSection>
        )}

        {/* Medical History */}
        {hasMedical && (
          <CollapsibleSection id="medical-history" title="Medical History" icon={FileText} color="bg-purple-50 text-purple-600">
            {Array.isArray(medicalHistory) ? renderArrayItems(medicalHistory) : renderKV(medicalHistory)}
          </CollapsibleSection>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: Plans
  // ═══════════════════════════════════════════════════════════════════════════

  const renderPlansTab = () => {
    if (!Array.isArray(plans) || plans.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg">No plans or follow-ups documented</p>
        </div>
      );
    }

    return (
      <CollapsibleSection id="plans-section" title="Plans & Follow-ups" icon={FileText} color="bg-emerald-50 text-emerald-600" count={plans.length}>
        {renderArrayItems(plans)}
      </CollapsibleSection>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════════════════════════════

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'labs': return renderLabsTab();
      case 'diagnoses': return renderDiagnosesTab();
      case 'care-team': return renderCareTeamTab();
      case 'history': return renderHistoryTab();
      case 'plans': return renderPlansTab();
      default: return renderOverviewTab();
    }
  };

  const closePdfViewer = () => {
    if (pdfViewerState.blobUrl) {
      URL.revokeObjectURL(pdfViewerState.blobUrl);
    }
    setPdfViewerState({ open: false, documentName: '', page: 1, searchText: '', blobUrl: '', loading: false });
  };

  return (
    <div className="space-y-0 relative">
      {renderSummaryBanner()}
      {renderConflictBadge()}
      {renderConflictDetails()}
      {renderTabs()}
      {renderSearchFilter()}
      {renderActiveTab()}

      {/* Floating Chat Icon */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="AI Clinical Assistant"
      >
        {showChat ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[520px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <ClinicalChatbot batchId={batchId} />
        </div>
      )}

      {/* PDF Viewer Modal - uses blob URL to avoid Edge blocking */}
      {pdfViewerState.open && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-gray-100 border-b flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">{pdfViewerState.documentName}</span>
                <span className="ml-2 text-sm text-gray-500">Page {pdfViewerState.page}</span>
                {pdfViewerState.searchText && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    Highlight: "{pdfViewerState.searchText}"
                  </span>
                )}
              </div>
              <button
                onClick={closePdfViewer}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 relative">
              {pdfViewerState.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-3 text-sm text-gray-500">Loading PDF...</p>
                  </div>
                </div>
              ) : pdfViewerState.blobUrl ? (
                <iframe
                  src={`${pdfViewerState.blobUrl}#page=${pdfViewerState.page}`}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-red-500">Failed to load PDF. Please try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
