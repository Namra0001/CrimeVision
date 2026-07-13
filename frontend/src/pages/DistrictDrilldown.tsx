import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Search, ChevronRight, Activity, Users, Shield, Clock,
  CheckCircle, Loader2, BarChart3, Target, ChevronDown, ChevronUp, Brain, HeartPulse, ShieldAlert, Crosshair, TrendingDown, AlertTriangle, Car, FileWarning, TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const AnimatedNumber = ({ value }: { value: number | string | undefined }) => {
  if (value === undefined || value === null) return <span>0</span>;
  
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) : value;
  const isPercentage = typeof value === 'string' && value.includes('%');
  const hasDecimals = numericValue % 1 !== 0 || (typeof value === 'string' && value.includes('.'));
  
  const count = useMotionValue(0);
  
  const display = useTransform(count, (latest) => {
    if (isNaN(numericValue)) return value;
    let formatted = hasDecimals ? latest.toFixed(1) : Math.round(latest).toLocaleString();
    return isPercentage ? formatted + '%' : formatted;
  });

  React.useEffect(() => {
    if (!isNaN(numericValue)) {
      const controls = animate(count, numericValue, { duration: 1.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [numericValue]);

  if (isNaN(numericValue)) return <>{value}</>;
  return <motion.span>{display as any}</motion.span>;
};
import { useRefresh } from '../contexts/RefreshContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function DistrictDrilldown() {
  const { refreshCount } = useRefresh();
  const { language } = useLanguage();
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  
  const [stats, setStats] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(1); // 1 = Health Score open by default

  useEffect(() => {
    fetch('https://fuzzy-geese-lay.loca.lt' + '/api/district/hierarchy')
      .then(res => res.json())
      .then(data => {
        setHierarchy(data);
        if (data.length > 0) {
          setSelectedDistrict(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    
    setStatsLoading(true);
    let url = `https://fuzzy-geese-lay.loca.lt/api/district/stats?district_id=${selectedDistrict.id}`;
    if (selectedStation) {
      url += `&station_id=${selectedStation.id}`;
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setStatsLoading(false);
      });
      
    setInsightsLoading(true);
    let insightUrl = `https://fuzzy-geese-lay.loca.lt/api/district/advanced-insights?district_id=${selectedDistrict.id}&lang=${language}`;
    if (selectedStation) {
      insightUrl += `&station_id=${selectedStation.id}`;
    }
    fetch(insightUrl)
      .then(res => res.json())
      .then(data => {
        setInsights(data);
        setInsightsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setInsightsLoading(false);
      });
      
    if (selectedStation) {
      fetch(`https://fuzzy-geese-lay.loca.lt/api/district/personnel?station_id=${selectedStation.id}`)
        .then(res => res.json())
        .then(data => setPersonnel(data));
    } else {
      setPersonnel([]);
    }
  }, [selectedDistrict, selectedStation, refreshCount, language]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 bg-background font-sans text-foreground p-2 overflow-hidden">
      
      {/* Sidebar: Hierarchy Browser */}
      <div className="w-80 flex flex-col bg-card border border-border rounded-xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-border bg-card/50">
          <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
            <Building2 size={16} className="text-blue-500" /> Command Hierarchy
          </h2>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search zones..." 
              className="w-full bg-background border border-border rounded-md py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {hierarchy.map((district) => (
            <div key={district.id} className="space-y-1">
              <button 
                onClick={() => { setSelectedDistrict(district); setSelectedStation(null); }}
                className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${selectedDistrict?.id === district.id && !selectedStation ? 'bg-blue-600 border border-blue-500 shadow-lg shadow-blue-900/20' : 'hover:bg-secondary text-muted-foreground'}`}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={selectedDistrict?.id === district.id && !selectedStation ? 'text-blue-200' : 'text-muted-foreground'} />
                  <span className={`text-xs font-bold ${selectedDistrict?.id === district.id && !selectedStation ? 'text-foreground' : ''}`}>{district.name}</span>
                </div>
                {selectedDistrict?.id === district.id ? <ChevronRight size={14} /> : <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{district.stations.length}</span>}
              </button>
              
              {/* Stations (only show if district is selected) */}
              {selectedDistrict?.id === district.id && (
                <div className="pl-6 space-y-1 my-1">
                  {district.stations.map((station: any) => (
                    <button 
                      key={station.id}
                      onClick={() => setSelectedStation(station)}
                      className={`w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left ${selectedStation?.id === station.id ? 'bg-secondary border border-border text-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                    >
                      <Shield size={12} className={selectedStation?.id === station.id ? 'text-emerald-500' : 'text-slate-600'} />
                      <span className="text-[11px] font-medium truncate">{station.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Drilldown Analytics */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        
        {/* Header Breadcrumbs */}
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Karnataka State</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className={selectedStation ? "text-muted-foreground" : "text-blue-400 font-bold"}>
              {selectedDistrict?.name} District
            </span>
            {selectedStation && (
              <>
                <ChevronRight size={14} className="text-slate-600" />
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <Shield size={14}/> {selectedStation.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
              <Activity size={12} className="text-green-500 animate-pulse" /> Live Sync
            </span>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : stats ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Cases', val: stats.kpis.total, icon: Target, color: 'text-blue-500' },
                { label: 'Solved', val: stats.kpis.solved, icon: CheckCircle, color: 'text-green-500' },
                { label: 'Pending', val: stats.kpis.pending, icon: Clock, color: 'text-orange-500' },
                { label: 'Clearance Rate', val: stats.kpis.clearance_rate, icon: Activity, color: 'text-purple-500' }
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div key={idx} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary group-hover:bg-blue-500 transition-colors" />
                    <div className="pl-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{kpi.label}</p>
                      <p className="text-3xl font-bold text-foreground"><AnimatedNumber value={kpi.val} /></p>
                    </div>
                    <div className="bg-background p-3 rounded-lg border border-border">
                      <Icon size={20} className={kpi.color} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[300px]">
              
              {/* Trends Chart */}
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col h-full">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-blue-400" /> Top Crime Categories
                </h3>
                <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.trends} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12}>
                        {stats.trends.map((_: any, i: number) => (
                          <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Personnel or District Info */}
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Users size={14} className={selectedStation ? "text-emerald-400" : "text-purple-400"} /> 
                  {selectedStation ? 'Station Personnel' : 'District Overview'}
                </h3>
                
                {selectedStation ? (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {personnel.length > 0 ? personnel.map((p, i) => (
                      <div key={i} className="bg-background border border-border p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground text-xs">
                            {p.name.split(' ')[1]?.[0] || p.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.role}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${p.status === 'On Duty' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : p.status === 'Patrolling' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-secondary text-muted-foreground'}`}>
                            {p.status}
                          </span>
                          {p.cases > 0 && <span className="text-[10px] text-muted-foreground">{p.cases} Active Cases</span>}
                        </div>
                      </div>
                    )) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">No personnel data available</div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-background/50 rounded-lg border border-border border-dashed">
                    <Building2 size={40} className="text-slate-700 mb-4" />
                    <h4 className="text-sm font-bold text-foreground mb-2">Select a Police Station</h4>
                    <p className="text-xs text-muted-foreground max-w-[250px]">
                      Select a specific police station from the sidebar to view active personnel, investigating officers, and local deployment metrics.
                    </p>
                  </div>
                )}
              </div>

            </div>
            
            {/* Enterprise Advanced Insights Drawer */}
            <div className="bg-card border border-border p-4 rounded-xl flex flex-col mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                <Brain size={16} className="text-purple-500 animate-pulse" /> 
                Enterprise Artificial Intelligence System
              </h3>
              
              {insightsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div>
              ) : insights ? (
                <div className="space-y-3">
                  
                  {/* FEATURE 1: DISTRICT HEALTH SCORE */}
                  <div className="border border-border rounded-lg overflow-hidden bg-background/50">
                    <button 
                      onClick={() => setExpandedFeature(expandedFeature === 1 ? null : 1)}
                      className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <HeartPulse size={16} className={insights.health_score.category === 'Excellent' || insights.health_score.category === 'Good' ? 'text-green-500' : insights.health_score.category === 'Average' ? 'text-yellow-500' : 'text-red-500'} />
                        <span className="text-sm font-bold text-foreground">District Health Score: {insights.health_score.score}/100</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${insights.health_score.category === 'Excellent' || insights.health_score.category === 'Good' ? 'bg-green-500/20 text-green-400' : insights.health_score.category === 'Average' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          {insights.health_score.category}
                        </span>
                      </div>
                      {expandedFeature === 1 ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </button>
                    {expandedFeature === 1 && (
                      <div className="p-4 border-t border-border bg-card grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-3">Overall operational health based on clearance rates, patrol coverage, and pending workload.</p>
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={14} className="text-green-500" />
                            <span className="text-xs font-bold text-green-400">{insights.health_score.trend} improvement from last month</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Driving Factors</h4>
                          {insights.health_score.reasons.map((r: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {r.type === 'positive' ? <CheckCircle size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                              <span className="text-foreground">{r.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FEATURE 2: AI DISTRICT SUMMARY */}
                  <div className="border border-border rounded-lg overflow-hidden bg-background/50">
                    <button 
                      onClick={() => setExpandedFeature(expandedFeature === 2 ? null : 2)}
                      className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Activity size={16} className="text-blue-500" />
                        <span className="text-sm font-bold text-foreground">{language === 'kn' ? 'AI ಜಿಲ್ಲಾ ಸಾರಾಂಶ' : 'AI District Summary'}</span>
                      </div>
                      {expandedFeature === 2 ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </button>
                    {expandedFeature === 2 && (
                      <div className="p-4 border-t border-border bg-card">
                        <p className="text-xs text-foreground leading-relaxed font-medium bg-blue-900/10 p-4 rounded-lg border-l-2 border-blue-500">
                          {insights.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* FEATURE 3: RESOURCE GAP ANALYSIS */}
                  <div className="border border-border rounded-lg overflow-hidden bg-background/50">
                    <button 
                      onClick={() => setExpandedFeature(expandedFeature === 3 ? null : 3)}
                      className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Target size={16} className="text-orange-500" />
                        <span className="text-sm font-bold text-foreground">Resource Gap Analysis</span>
                        {insights.resource_gaps.officers.gap > 0 && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">Shortage Detected</span>
                        )}
                      </div>
                      {expandedFeature === 3 ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </button>
                    {expandedFeature === 3 && (
                      <div className="p-4 border-t border-border bg-card grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Officers */}
                        <div className="bg-background p-3 rounded-lg border border-border">
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={12}/> Police Officers</h4>
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Required: <span className="text-foreground font-bold">{insights.resource_gaps.officers.required}</span></p>
                              <p className="text-[10px] text-muted-foreground">Available: <span className="text-foreground font-bold">{insights.resource_gaps.officers.available}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-red-400">GAP: {insights.resource_gaps.officers.gap}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 p-2 bg-card rounded border border-border"><span className="text-orange-400 font-bold">AI Rec:</span> {insights.resource_gaps.officers.recommendation}</p>
                        </div>
                        {/* Vehicles */}
                        <div className="bg-background p-3 rounded-lg border border-border">
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={12}/> Patrol Vehicles</h4>
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Required: <span className="text-foreground font-bold">{insights.resource_gaps.vehicles.required}</span></p>
                              <p className="text-[10px] text-muted-foreground">Available: <span className="text-foreground font-bold">{insights.resource_gaps.vehicles.available}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-yellow-400">GAP: {insights.resource_gaps.vehicles.gap}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 p-2 bg-card rounded border border-border"><span className="text-yellow-400 font-bold">AI Rec:</span> {insights.resource_gaps.vehicles.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FEATURE 4: INVESTIGATION BOTTLENECK DETECTION */}
                  <div className="border border-border rounded-lg overflow-hidden bg-background/50">
                    <button 
                      onClick={() => setExpandedFeature(expandedFeature === 4 ? null : 4)}
                      className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileWarning size={16} className="text-red-500" />
                        <span className="text-sm font-bold text-foreground">Investigation Bottlenecks</span>
                        {insights.bottlenecks.length > 0 && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">{insights.bottlenecks.length} Critical</span>
                        )}
                      </div>
                      {expandedFeature === 4 ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </button>
                    {expandedFeature === 4 && (
                      <div className="p-4 border-t border-border bg-card space-y-2">
                        {insights.bottlenecks.length > 0 ? insights.bottlenecks.map((b: any, i: number) => (
                          <div key={i} className="bg-background p-3 rounded-lg border border-red-900/30 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">{b.priority} DELAY</p>
                              <p className="text-xs font-bold text-foreground">{b.case_no} <span className="text-muted-foreground font-normal">| {b.station}</span></p>
                              <p className="text-[10px] text-muted-foreground mt-1">Pending for {b.delay_days} days. Reason: {b.reason}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] uppercase text-muted-foreground mb-1">Recommendation</p>
                              <p className="text-[10px] font-bold text-blue-400">{b.recommendation}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-xs text-muted-foreground text-center py-4">No critical bottlenecks detected.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* FEATURE 5: PREDICTIVE RESOURCE PLANNING */}
                  <div className="border border-border rounded-lg overflow-hidden bg-background/50">
                    <button 
                      onClick={() => setExpandedFeature(expandedFeature === 5 ? null : 5)}
                      className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp size={16} className="text-cyan-500" />
                        <span className="text-sm font-bold text-foreground">Predictive Resource Planning</span>
                      </div>
                      {expandedFeature === 5 ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </button>
                    {expandedFeature === 5 && (
                      <div className="p-4 border-t border-border bg-card">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs text-muted-foreground">Forecast for <span className="text-foreground font-bold">{insights.predictive.period}</span> based on historical crime patterns.</p>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">Confidence: {insights.predictive.confidence}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-background border border-border p-3 rounded-lg text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Crime Forecast</p>
                            <p className="text-lg font-bold text-red-400">{insights.predictive.expected_crime_change}</p>
                          </div>
                          <div className="bg-background border border-border p-3 rounded-lg text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">New Officers</p>
                            <p className="text-lg font-bold text-blue-400">+{insights.predictive.additional_officers_needed}</p>
                          </div>
                          <div className="bg-background border border-border p-3 rounded-lg text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">New Vehicles</p>
                            <p className="text-lg font-bold text-yellow-400">+{insights.predictive.additional_vehicles_needed}</p>
                          </div>
                          <div className="bg-background border border-border p-3 rounded-lg text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Est. Reduction</p>
                            <p className="text-lg font-bold text-green-400">-{insights.predictive.expected_reduction}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>

          </>
        ) : null}
      </div>
    </div>
  );
}
