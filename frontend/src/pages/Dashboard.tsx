import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ShieldAlert, CheckCircle, Clock, AlertOctagon, MapPin, Loader2, 
  Activity, Users, TrendingUp, AlertTriangle, Eye, Server, Crosshair, Map, Filter, X, Building2, ChevronDown
} from 'lucide-react';

import { useRefresh } from '../contexts/RefreshContext';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = [
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', 
  '#06b6d4', '#eab308', '#d946ef', '#0ea5e9', '#65a30d',
  '#2dd4bf', '#a855f7', '#fb923c', '#c026d3', '#16a34a'
];

export default function Dashboard() {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [filterOptions, setFilterOptions] = useState<{districts: string[], years: (number|string)[]}>({ districts: [], years: [] });
  const { refreshCount } = useRefresh();
  const [showHighRiskAreas, setShowHighRiskAreas] = useState(false);
  const [activeInfra, setActiveInfra] = useState<'districts' | 'stations' | 'officers' | null>(null);

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('https://fuzzy-geese-lay.loca.lt' + '/api/dashboard/filters')
      .then(res => res.json())
      .then(data => {
        setFilterOptions({ districts: data.districts, years: ['All', ...data.years] });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`https://fuzzy-geese-lay.loca.lt/api/dashboard/stats?year=${selectedYear}&district=${selectedDistrict}&lang=${language}&_t=${refreshCount}`)
      .then(res => res.json())
      .then(apiData => {
        setData(apiData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedYear, selectedDistrict, refreshCount, language]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="text-muted-foreground font-mono text-sm animate-pulse">INITIALIZING COMMAND CENTER...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-500 p-4">Error loading data.</div>;

  return (
    <div className="relative bg-background text-foreground min-h-full pb-10 overflow-hidden">
      { (isYearDropdownOpen || isDistrictDropdownOpen) && (
        <div className="fixed inset-0 z-10" onClick={() => { setIsYearDropdownOpen(false); setIsDistrictDropdownOpen(false); }} />
      )}

      <div className="relative z-10 space-y-4">
      
      {/* Global Filters */}
      <div className="bg-slate-100 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 p-3 rounded-2xl flex flex-wrap items-center gap-6 shadow-xl relative z-[60] group">
        <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
             <Filter size={18} className="text-blue-400" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wide uppercase">Filters</span>
        </div>
        
        {/* Custom Year Dropdown */}
        <div className="relative z-20">
          <div 
            className="flex items-center gap-3 bg-white dark:bg-slate-900/50 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-500/50 transition-colors cursor-pointer"
            onClick={() => { setIsYearDropdownOpen(!isYearDropdownOpen); setIsDistrictDropdownOpen(false); }}
          >
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer">Year</label>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 pr-1">{selectedYear}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isYearDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[120px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {filterOptions.years.map(y => (
                  <div 
                    key={y} 
                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${selectedYear === y ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    onClick={() => { setSelectedYear(y); setIsYearDropdownOpen(false); }}
                  >
                    {y}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom District Dropdown */}
        <div className="relative z-20">
          <div 
            className="flex items-center gap-3 bg-white dark:bg-slate-900/50 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-500/50 transition-colors cursor-pointer"
            onClick={() => { setIsDistrictDropdownOpen(!isDistrictDropdownOpen); setIsYearDropdownOpen(false); }}
          >
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer">District</label>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 pr-1">{selectedDistrict}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isDistrictDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isDistrictDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                <div 
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${selectedDistrict === 'All' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  onClick={() => { setSelectedDistrict('All'); setIsDistrictDropdownOpen(false); }}
                >
                  All Districts
                </div>
                {filterOptions.districts.map(d => (
                  <div 
                    key={d} 
                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${selectedDistrict === d ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    onClick={() => { setSelectedDistrict(d); setIsDistrictDropdownOpen(false); }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        
        {(selectedYear !== 'All' || selectedDistrict !== 'All') && (
          <button 
            onClick={() => { setSelectedYear('All'); setSelectedDistrict('All'); }}
            className="flex items-center gap-2 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all ml-auto relative z-10"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>


      {/* Main KPI Grid (7 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Cases', obj: data.kpis.total_active, icon: ShieldAlert, iconClass: 'text-blue-500', bgClass: 'bg-blue-500/20' },
          { label: 'Solved Cases', obj: data.kpis.solved, icon: CheckCircle, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-500/20' },
          { label: 'Pending Cases', obj: data.kpis.pending, icon: Clock, iconClass: 'text-orange-500', bgClass: 'bg-orange-500/20' },
          { label: 'Cyber Crimes', obj: data.kpis.cyber_crimes, icon: Activity, iconClass: 'text-indigo-500', bgClass: 'bg-indigo-500/20' },
          { label: 'Safety Score', obj: data.kpis.womens_safety, icon: HeartPulseIcon, iconClass: 'text-teal-500', bgClass: 'bg-teal-500/20', suffix: '%' },
          { label: 'High Risk Area', val: data.kpis.worst_district, icon: MapPin, iconClass: 'text-purple-500', bgClass: 'bg-purple-500/20', isText: true, link: true },
          { label: 'Safest Area', val: data.kpis.best_district, icon: MapPin, iconClass: 'text-green-500', bgClass: 'bg-green-500/20', isText: true, link: true },
          { label: 'High Risk Areas', val: data.kpis.high_risk_areas_count, icon: ShieldAlert, iconClass: 'text-red-500', bgClass: 'bg-red-500/20', isHighRiskToggle: true },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          const displayValue = kpi.obj ? kpi.obj.value : kpi.val;
          
          return (
            <div key={idx} className="bg-slate-100 dark:bg-[#111827] border border-border/50 p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <span className={`font-bold mt-1 ${kpi.isText ? 'text-xl text-slate-900 dark:text-white truncate' : 'text-3xl text-slate-900 dark:text-white'}`}>
                    {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue || 0}{kpi.suffix || ''}
                  </span>
                  
                  {kpi.link && displayValue && (
                    <Link to={`/heatmap?districtName=${encodeURIComponent(displayValue)}`} className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 font-bold inline-block">
                      View Details &rarr;
                    </Link>
                  )}
                  
                  {kpi.isHighRiskToggle && (
                    <button 
                      onClick={() => setShowHighRiskAreas(!showHighRiskAreas)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 font-bold inline-block text-left"
                    >
                      {showHighRiskAreas ? 'Hide areas \u2191' : 'View areas \u2192'}
                    </button>
                  )}
                  
                  {kpi.obj && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className={`text-[10px] font-bold ${kpi.obj.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {kpi.obj.direction === 'up' ? '↑' : '↓'} {kpi.obj.trend}%
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">from last year</span>
                    </div>
                  )}
                </div>
                <div className={`h-[56px] w-[56px] rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${kpi.bgClass}`}>
                  <Icon size={24} className={kpi.iconClass} />
                </div>
              </div>

              {/* Expandable High Risk Area List */}
              {kpi.isHighRiskToggle && showHighRiskAreas && data.rankings?.high_risk_stations && (
                <div className="mt-3 pt-3 border-t border-border/50 max-h-40 overflow-y-auto custom-scrollbar relative z-20">
                  <ul className="flex flex-col gap-2">
                    {data.rankings.high_risk_stations.map((station: any, i: number) => (
                      <li key={i} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground truncate pr-2" title={station.name}>{station.name}</span>
                        <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">{station.crimes}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Middle Section: Charts & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Trend Analysis */}
        <div className="bg-card border border-border rounded-lg p-4 lg:col-span-2 flex flex-col h-full min-h-[260px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500" /> Live Crime Trend (12 Months)
            </h3>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.trendData}>
                <defs>
                  <linearGradient id="colorCrimes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="crimes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCrimes)" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-Time Incident Feed */}
        <div className="bg-card border border-border rounded-lg h-full min-h-[260px] relative">
          <div className="absolute inset-4 flex flex-col">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 shrink-0">
              <Activity size={14} className="text-red-500" /> Real-Time Incident Feed
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
              {data.live_feed.map((incident: any, idx: number) => (
                <div key={idx} className="bg-secondary/50 border border-border/50 p-2 rounded-md flex justify-between items-center group cursor-pointer hover:bg-secondary transition-colors">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground group-hover:text-blue-400 transition-colors truncate">{incident.type}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{incident.station}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono text-muted-foreground">{incident.fir}</p>
                    <p className="text-[10px] text-muted-foreground">{incident.time.split(' ')[1]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: AI Insights, Rankings & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* AI Recommendations Panel */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col max-h-[360px]">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Crosshair size={14} className="text-purple-500" /> {language === 'kn' ? 'ಇಂದಿನ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಮಾಹಿತಿ' : "Today's AI Intelligence"}
          </h3>
          <p className="text-xs text-foreground leading-relaxed mb-4 p-3 bg-secondary/50 rounded-md border-l-2 border-purple-500">
            {data.ai_insights.intelligence_summary}
          </p>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {data.ai_insights.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="bg-secondary/30 border border-border/50 p-3 rounded-lg relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${rec.priority === 'Critical' ? 'bg-red-500' : rec.priority === 'High' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                <div className="flex justify-between items-start mb-1 pl-2">
                  <h4 className="text-xs font-bold text-foreground">{rec.title}</h4>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-2">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-500 rounded-sm inline-block"></span> CRIME CATEGORY DISTRIBUTION
            </h3>
          </div>
          <div className="flex-1 flex items-center min-h-[260px]">
            {/* Left: Chart */}
            <div className="relative w-1/2 h-full min-h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.categoryData}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={95}
                    paddingAngle={1}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.charts.categoryData.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-muted-foreground font-medium mb-0.5">Total</span>
                <span className="text-2xl font-bold text-white leading-none">
                  {data.charts.categoryData.reduce((acc: number, curr: any) => acc + curr.value, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Right: Legend */}
            <div className="w-1/2 pl-2 flex flex-col gap-2.5 pr-1 h-full max-h-[240px] overflow-y-auto custom-scrollbar">
              {data.charts.categoryData.map((e: any, i: number) => {
                const total = data.charts.categoryData.reduce((acc: number, curr: any) => acc + curr.value, 0);
                const pct = total > 0 ? ((e.value / total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate">{e.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {e.value} <span className="opacity-70">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* District Performance Rankings */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-500" /> District Performance
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-bold text-red-400 uppercase mb-2">High Risk Zones</h4>
              <div className="space-y-1.5">
                {data.rankings.worst_stations.slice(0,3).map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-red-500/5 rounded">
                    <span className="text-foreground truncate pr-2">{s.name}</span>
                    <span className="font-mono text-red-400 font-bold">{s.crimes}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t border-border">
              <h4 className="text-[10px] font-bold text-green-400 uppercase mb-2">Optimal Zones</h4>
              <div className="space-y-1.5">
                {data.rankings.best_stations.slice(0,3).map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-green-500/5 rounded">
                    <span className="text-foreground truncate pr-2">{s.name}</span>
                    <span className="font-mono text-green-400 font-bold">{s.crimes}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Infrastructure Summary Footer */}
      {data.infrastructure && (
        <div className="relative mt-4">
          {/* Details Popover */}
          {activeInfra && data.infrastructure_details && (
            <div className="absolute bottom-[calc(100%+16px)] left-0 w-full bg-[#111827] border border-border/60 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  {activeInfra === 'districts' && <><Map size={16} className="text-blue-400" /> All Districts</>}
                  {activeInfra === 'stations' && <><Building2 size={16} className="text-blue-400" /> All Police Stations</>}
                  {activeInfra === 'officers' && <><Users size={16} className="text-blue-400" /> All Officers</>}
                </h3>
                <button onClick={() => setActiveInfra(null)} className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                  ✕
                </button>
              </div>
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-2">
                {activeInfra === 'districts' && data.infrastructure_details.districts.map((d: any, i: number) => (
                  <div key={i} className="bg-secondary/40 p-2.5 rounded-lg flex items-center gap-2 border border-white/5 hover:border-blue-500/30 transition-colors">
                    <span className="text-xs text-white font-medium">{d.name}</span>
                  </div>
                ))}
                {activeInfra === 'stations' && data.infrastructure_details.stations.map((s: any, i: number) => (
                  <div key={i} className="bg-secondary/40 p-2.5 rounded-lg flex flex-col border border-white/5 hover:border-blue-500/30 transition-colors">
                    <span className="text-xs text-white font-semibold mb-1 truncate">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{s.district}</span>
                  </div>
                ))}
                {activeInfra === 'officers' && data.infrastructure_details.officers.map((o: any, i: number) => (
                  <div key={i} className="bg-secondary/40 p-2.5 rounded-lg flex flex-col border border-white/5 hover:border-blue-500/30 transition-colors">
                    <span className="text-xs text-white font-semibold mb-1 truncate">{o.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{o.station}</span>
                    <span className="text-[9px] text-muted-foreground/70 truncate">{o.district}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-100 dark:bg-[#111827]/80 border border-border/40 rounded-xl flex items-center justify-around shadow-lg relative z-40">
            <div 
              className={`flex items-center gap-4 flex-1 justify-center border-r border-border/40 p-4 cursor-pointer transition-colors ${activeInfra === 'districts' ? 'bg-white/10 rounded-l-xl' : 'hover:bg-white/5 rounded-l-xl'}`}
              onClick={() => setActiveInfra(activeInfra === 'districts' ? null : 'districts')}
            >
              <Map size={32} className="text-blue-500/80 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Total Districts</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">{data.infrastructure.total_districts.toLocaleString()}</span>
              </div>
            </div>
            <div 
              className={`flex items-center gap-4 flex-1 justify-center border-r border-border/40 p-4 cursor-pointer transition-colors ${activeInfra === 'stations' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              onClick={() => setActiveInfra(activeInfra === 'stations' ? null : 'stations')}
            >
              <Building2 size={32} className="text-blue-500/80 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Total Police Stations</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">{data.infrastructure.total_stations.toLocaleString()}</span>
              </div>
            </div>
            <div 
              className={`flex items-center gap-4 flex-1 justify-center p-4 cursor-pointer transition-colors ${activeInfra === 'officers' ? 'bg-white/10 rounded-r-xl' : 'hover:bg-white/5 rounded-r-xl'}`}
              onClick={() => setActiveInfra(activeInfra === 'officers' ? null : 'officers')}
            >
              <Users size={32} className="text-blue-500/80 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Total Officers</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">{data.infrastructure.total_officers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

// Icon fallbacks
const HeartPulseIcon = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 7v4"/><path d="M12 15h.01"/>
  </svg>
)

const FileTextIcon = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)
