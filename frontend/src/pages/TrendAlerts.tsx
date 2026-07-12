import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Activity, CheckCircle, 
  MapPin, Clock, Loader2, ArrowUpRight, ArrowDownRight, Target, 
  X, ChevronRight, BarChart3, Users, Crosshair, Map, Download, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import { useRefresh } from '../contexts/RefreshContext';

export default function TrendAlerts() {
  const { refreshCount } = useRefresh();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertDetails, setAlertDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedScenario, setSelectedScenario] = useState('scenario_1');

  // Open Modal and Fetch Data
  const openAlertDetails = (alert: any) => {
    setSelectedAlert(alert);
    setDetailsLoading(true);
    setActiveTab('Overview');
    fetch(`http://localhost:8000/api/alerts/${alert.id}/details`)
      .then(res => res.json())
      .then(data => {
        setAlertDetails(data);
        setDetailsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setDetailsLoading(false);
      });
  };

  const closeAlertDetails = () => {
    setSelectedAlert(null);
    setAlertDetails(null);
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/alerts')
      .then(res => res.json())
      .then(data => {
        const localStatuses = JSON.parse(localStorage.getItem('alertStatuses') || '{}');
        const updatedData = data.map((a: any) => {
          if (localStatuses[a.id]) {
            return { ...a, status: localStatuses[a.id] };
          }
          return a;
        });
        setAlerts(updatedData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshCount]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background p-4 gap-6 overflow-y-auto custom-scrollbar text-foreground">
      
      {/* Header Banner */}
      <div className="shrink-0 bg-gradient-to-r from-red-900/40 to-slate-900 border border-red-900/50 p-6 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity size={120} />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <AlertTriangle className="text-red-500 animate-pulse" size={28} />
            AI Anomaly Detection System
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            The system continuously monitors historical data streams to identify statistical outliers, sudden spikes, and emerging patterns before they escalate into major hotspots.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['All', 'Live', 'Resolved', 'Dismissed'].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${filterStatus === f ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-card text-muted-foreground hover:bg-secondary border-border'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {alerts.filter(a => filterStatus === 'All' ? true : filterStatus === 'Live' ? a.status === 'Unresolved' : a.status === filterStatus).map((alert, idx) => {
          
          let colorTheme = "bg-card border-border";
          let iconColor = "text-muted-foreground";
          let badgeColor = "bg-secondary text-muted-foreground border-border";
          let glow = "";
          
          if (alert.severity === 'Critical') {
            colorTheme = "bg-red-950/20 border-red-900/50 hover:border-red-500/50";
            iconColor = "text-red-500";
            badgeColor = "bg-red-500/20 text-red-400 border-red-500/30";
            glow = "shadow-[0_0_15px_rgba(239,68,68,0.15)]";
          } else if (alert.severity === 'High') {
            colorTheme = "bg-orange-950/20 border-orange-900/50 hover:border-orange-500/50";
            iconColor = "text-orange-500";
            badgeColor = "bg-orange-500/20 text-orange-400 border-orange-500/30";
          } else if (alert.severity === 'Medium') {
            colorTheme = "bg-yellow-950/20 border-yellow-900/50 hover:border-yellow-500/50";
            iconColor = "text-yellow-500";
            badgeColor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
          } else if (alert.severity === 'Low') {
            colorTheme = "bg-blue-950/20 border-blue-900/50 hover:border-blue-500/50";
            iconColor = "text-blue-500";
            badgeColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
          }

          return (
            <div 
              key={idx} 
              onClick={() => openAlertDetails(alert)}
              className={`${colorTheme} ${glow} border p-5 rounded-xl transition-all group flex flex-col gap-4 relative overflow-hidden cursor-pointer`}
            >
              
              {/* Status Ribbon */}
              {alert.status === 'Unresolved' && (
                <div className="absolute -right-8 top-4 bg-red-500 text-foreground text-[10px] font-bold uppercase tracking-widest py-1 px-10 rotate-45 shadow-lg">
                  Unresolved
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`mt-1 ${iconColor}`}>
                    {alert.severity === 'Critical' ? <ShieldAlert size={24} className="animate-pulse" /> : 
                     alert.severity === 'Low' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-blue-400 transition-colors">
                      {alert.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${badgeColor}`}>
                        {alert.severity}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] bg-background px-2 py-1 rounded">
                        <MapPin size={12} /> {alert.location}
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock size={12} /> {alert.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="bg-background/50 border border-border/50 p-4 rounded-lg flex-1">
                <p className="text-sm text-foreground leading-relaxed">
                  {alert.description}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">AI Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: alert.confidence }}></div>
                      </div>
                      <span className="text-xs font-mono text-blue-400">{alert.confidence}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">ID: {alert.id}</span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-blue-950/30 border border-blue-900/30 p-4 rounded-lg flex items-start gap-3">
                <Target size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1">Recommended Action</span>
                  <span className="text-sm text-blue-100 font-medium">
                    {alert.recommendation}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end mt-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newAlerts = alerts.map(a => a.id === alert.id ? { ...a, status: 'Dismissed' } : a);
                    setAlerts(newAlerts);
                    const localStatuses = JSON.parse(localStorage.getItem('alertStatuses') || '{}');
                    localStatuses[alert.id] = 'Dismissed';
                    localStorage.setItem('alertStatuses', JSON.stringify(localStatuses));
                  }}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-card hover:bg-secondary rounded-md border border-border transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (alert.status === 'Unresolved') {
                      const newAlerts = alerts.map(a => a.id === alert.id ? { ...a, status: 'Resolved' } : a);
                      setAlerts(newAlerts);
                      const localStatuses = JSON.parse(localStorage.getItem('alertStatuses') || '{}');
                      localStatuses[alert.id] = 'Resolved';
                      localStorage.setItem('alertStatuses', JSON.stringify(localStatuses));
                    }
                  }}
                  className={`px-4 py-2 text-xs font-bold text-foreground rounded-md transition-colors shadow-lg ${alert.status === 'Unresolved' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'border-border hover:bg-slate-600 cursor-not-allowed'}`} disabled={alert.status !== 'Unresolved'}>
                  {alert.status === 'Unresolved' ? 'Dispatch Units' : alert.status}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Advanced Action Drawer (Modal) */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-background p-6 border-b border-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${selectedAlert.severity === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                    <ShieldAlert size={28} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedAlert.title}</h2>
                    <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin size={14}/> {selectedAlert.location}</span>
                      <span className="flex items-center gap-1"><Clock size={14}/> {selectedAlert.timestamp}</span>
                      <span className="font-mono bg-secondary px-2 rounded">ID: {selectedAlert.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="flex items-center gap-2 bg-secondary hover:border-border text-foreground px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-border">
                    <Download size={16} /> Incident Report
                  </button>
                  <button onClick={closeAlertDetails} className="p-2 bg-secondary hover:bg-red-500/20 hover:text-red-400 text-muted-foreground rounded-lg transition-colors border border-border">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex gap-6 px-6 border-b border-border bg-background shrink-0 overflow-x-auto custom-scrollbar">
                  {['Overview', 'Predictive Intelligence', 'Operational Strategy', 'AI Diagnostics'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                  {detailsLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                      <p className="text-sm font-mono text-muted-foreground animate-pulse">Running AI Impact Simulations...</p>
                    </div>
                  ) : alertDetails ? (
                    <AnimatePresence mode="wait">
                      
                      {activeTab === 'Overview' && (
                        <motion.div 
                          key="overview"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                          <div className="flex flex-col gap-6">
                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Alert Escalation Workflow</h3>
                              <div className="relative border-l-2 border-border ml-3 space-y-6">
                                {alertDetails.workflow.map((w: any, i: number) => (
                                  <div key={i} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-950 ${w.status === 'completed' ? 'bg-green-500' : w.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'border-border'}`}></div>
                                    <p className={`text-sm font-bold ${w.status === 'completed' ? 'text-foreground' : w.status === 'in_progress' ? 'text-blue-400' : 'text-muted-foreground'}`}>{w.stage}</p>
                                    <div className="flex justify-between items-center mt-1">
                                      <p className="text-xs text-muted-foreground">{w.desc}</p>
                                      <span className="text-[10px] font-mono text-muted-foreground bg-card px-1.5 py-0.5 rounded">{w.time}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Crosshair size={16} className="text-red-500"/> Predictive Escalation Risk</h3>
                              <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mb-3 inline-block">AI Prediction</span>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-card p-3 rounded-lg border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Crime Inc Prob.</p>
                                  <p className="text-lg font-bold text-red-400">{alertDetails.escalation_risk.crime_increase_prob}</p>
                                </div>
                                <div className="bg-card p-3 rounded-lg border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Escalation ETA</p>
                                  <p className="text-lg font-bold text-orange-400">{alertDetails.escalation_risk.time_until_escalation}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-6">
                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><BrainCircuit size={16} className="text-purple-500"/> Explainable AI Root Cause</h3>
                              <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mb-3 inline-block">AI Diagnosis</span>
                              <div className="space-y-3">
                                {alertDetails.root_causes.map((rc: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                      <CheckCircle size={16} className="text-emerald-500" />
                                      <span className="text-sm text-foreground">{rc.factor}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">{rc.confidence}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Map size={16} className="text-emerald-500"/> Mini Intelligence Map</h3>
                              <div className="w-full h-32 bg-card border border-border rounded-lg flex items-center justify-center relative overflow-hidden">
                                <MapContainer 
                                  center={alertDetails.mini_map.center as [number, number]} 
                                  zoom={14} 
                                  style={{ height: '100%', width: '100%' }} 
                                  zoomControl={false} 
                                  dragging={false} 
                                  scrollWheelZoom={false} 
                                  attributionControl={false}
                                  maxBounds={L.latLngBounds([11.5, 74.0], [18.5, 78.5])}
                                  maxBoundsViscosity={1.0}
                                  minZoom={6}
                                >
                                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-dark" />
                                </MapContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-red-500/20 rounded-full animate-ping z-[400] pointer-events-none"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white z-[400] shadow-lg pointer-events-none"></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-6">
                            <div className="bg-background border border-border rounded-xl p-5 flex-1">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={16} className="text-foreground"/> Similar Historical Cases</h3>
                              <div className="space-y-3">
                                {alertDetails.historical_cases.map((hc: any, i: number) => (
                                  <div key={i} className="text-xs border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-foreground">{hc.crime}</span>
                                      <span className="text-[9px] font-mono text-muted-foreground">{hc.date}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">{hc.action}</span>
                                      <span className="text-green-400 font-bold">{hc.outcome}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'Predictive Intelligence' && (
                        <motion.div key="predictive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-6">
                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Activity size={16} className="text-red-500"/> Threat Level Forecast</span>
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">AI Simulation</span>
                              </h3>
                              <div className="flex items-end justify-between h-32 mb-4 gap-2">
                                {alertDetails.threat_forecast.forecasts.map((f: any, i: number) => (
                                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-card rounded-t-sm border-b border-border relative group-hover:bg-secondary transition-colors flex flex-col justify-end" style={{ height: `${f.probability}%` }}>
                                      <div className={`w-full h-1 ${f.probability > 80 ? 'bg-red-500' : f.probability > 50 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground">{f.probability}%</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground">{f.timeframe}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">Expected Peak: <span className="font-bold text-foreground">{alertDetails.threat_forecast.expected_peak}</span> (Trend: {alertDetails.threat_forecast.trend_direction})</p>
                            </div>

                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Target size={16} className="text-orange-500"/> Criminal Behaviour Prediction</span>
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">AI Prediction</span>
                              </h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-card p-3 rounded-lg border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Repeat Offender Prob.</p>
                                  <p className="font-bold text-foreground">{alertDetails.criminal_behaviour.repeat_offender_prob}</p>
                                </div>
                                <div className="bg-card p-3 rounded-lg border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Likely Crime</p>
                                  <p className="font-bold text-foreground">{alertDetails.criminal_behaviour.likely_crime}</p>
                                </div>
                                <div className="bg-card p-3 rounded-lg border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Target / Escape</p>
                                  <p className="font-bold text-foreground text-xs">{alertDetails.criminal_behaviour.likely_target} <br/><span className="text-muted-foreground font-normal">via {alertDetails.criminal_behaviour.likely_escape_direction}</span></p>
                                </div>
                                <div className="bg-card p-3 rounded-lg border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">AI Confidence</p>
                                  <p className="font-bold text-purple-400 text-lg">{alertDetails.criminal_behaviour.probability_score}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-6">
                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><BrainCircuit size={16} className="text-pink-500"/> Incident Chain Prediction</span>
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">AI Forecast</span>
                              </h3>
                              <div className="relative border-l-2 border-border ml-3 space-y-4">
                                {alertDetails.incident_chain.map((step: any, i: number) => (
                                  <div key={i} className="relative pl-6">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-950 bg-secondary"></div>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm font-bold text-foreground">{step.event}</p>
                                      <span className="text-[10px] font-mono text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/20">{step.prob} Prob.</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Clock size={16} className="text-cyan-500"/> Future Operational Timeline</span>
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Estimated</span>
                              </h3>
                              <div className="space-y-2">
                                {alertDetails.future_timeline.map((milestone: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center bg-card p-2.5 rounded-lg border border-border">
                                    <span className="text-xs text-foreground">{milestone.milestone}</span>
                                    <span className="text-xs font-mono text-cyan-400 font-bold">{milestone.time}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'Operational Strategy' && (
                        <motion.div key="strategy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-6">
                            <div className="bg-background border border-border rounded-xl p-5 flex-1 flex flex-col">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Users size={16} className="text-emerald-500"/> AI Resource Deployment Simulator</span>
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">AI Simulation</span>
                              </h3>
                              
                              <div className="grid grid-cols-2 gap-2 mb-6">
                                {alertDetails.resource_simulator.map((scenario: any) => (
                                  <button 
                                    key={scenario.id} 
                                    onClick={() => setSelectedScenario(scenario.id)}
                                    className={`p-2 text-xs font-bold rounded-lg border text-left transition-all ${selectedScenario === scenario.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-card border-border text-muted-foreground hover:bg-secondary'} ${scenario.ai_recommendation ? 'ring-1 ring-emerald-500/50 relative' : ''}`}
                                  >
                                    {scenario.title}
                                    {scenario.ai_recommendation && <span className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Rec</span>}
                                  </button>
                                ))}
                              </div>

                              {/* Active Scenario Details */}
                              {(() => {
                                const active = alertDetails.resource_simulator.find((s: any) => s.id === selectedScenario);
                                return active ? (
                                  <div className="bg-card border border-border rounded-xl p-4 flex-1">
                                    <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
                                      <h4 className="text-sm font-bold text-foreground">{active.title} <span className="text-[10px] text-muted-foreground ml-2 font-normal uppercase">Simulated Impact</span></h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Crime Reduction</p>
                                        <p className="text-lg font-bold text-emerald-400">{active.crime_reduction}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Response Time</p>
                                        <p className="text-lg font-bold text-blue-400">{active.response_time}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Operational Cost</p>
                                        <p className="text-lg font-bold text-orange-400">{active.operational_cost}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Mission Success</p>
                                        <p className="text-lg font-bold text-purple-400">{active.mission_success}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>

                          <div className="flex flex-col gap-6">
                            <div className="bg-background border border-border rounded-xl p-5">
                              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Target size={16} className="text-pink-500"/> Vulnerable Zone Intelligence</span>
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Estimated Risk</span>
                              </h3>
                              <div className="space-y-3">
                                {alertDetails.vulnerable_zones.map((vz: any, i: number) => (
                                  <div key={i} className="bg-card border border-border p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-bold text-foreground">{vz.name} <span className="text-[10px] text-muted-foreground font-normal bg-secondary px-2 py-0.5 rounded ml-2">{vz.type}</span></span>
                                      <span className={`text-xs font-mono font-bold ${vz.score > 80 ? 'text-red-400' : 'text-orange-400'}`}>{vz.score} Risk</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{vz.reasoning}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-background border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mb-2">Estimated</span>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mission Success</h3>
                                <p className="text-3xl font-bold text-emerald-400">{alertDetails.mission_success.overall_score}%</p>
                                <p className="text-[10px] text-muted-foreground mt-2">{alertDetails.mission_success.expected_arrest_prob} Arrest Prob.</p>
                              </div>
                              <div className="bg-background border border-border rounded-xl p-5">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                                  <span className="flex items-center gap-2">Smart Notifs</span>
                                </h3>
                                <div className="space-y-1">
                                  {alertDetails.smart_notifications.map((sn: any, i: number) => (
                                    <div key={i} className={`text-[10px] flex items-center justify-between ${sn.recommended ? 'text-foreground' : 'text-slate-600'}`}>
                                      <span>{sn.department}</span>
                                      {sn.recommended ? <CheckCircle size={10} className="text-emerald-500"/> : <X size={10} className="text-slate-700"/>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'AI Diagnostics' && (
                        <motion.div key="diagnostics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-background border border-border rounded-xl p-5">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2"><BrainCircuit size={16} className="text-purple-500"/> Explainable AI Confidence breakdown</h3>
                            <div className="flex items-center justify-between mb-8">
                              <span className="text-sm font-bold text-foreground">Overall AI Confidence</span>
                              <span className="text-3xl font-bold text-purple-400">{alertDetails.explainable_ai.overall_confidence}</span>
                            </div>
                            <div className="space-y-4">
                              {alertDetails.explainable_ai.factors.map((f: any, i: number) => (
                                <div key={i}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-muted-foreground">{f.factor}</span>
                                    <span className="text-xs font-mono text-purple-400">{f.contribution}%</span>
                                  </div>
                                  <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-purple-500 h-full" style={{ width: `${f.contribution}%` }}></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-background border border-border rounded-xl p-5">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> AI Learning Dashboard</h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-card p-4 rounded-lg border border-border text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Prediction Acc.</p>
                                <p className="text-2xl font-bold text-emerald-400">{alertDetails.ai_learning.prediction_accuracy}</p>
                              </div>
                              <div className="bg-card p-4 rounded-lg border border-border text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">False Positives</p>
                                <p className="text-2xl font-bold text-orange-400">{alertDetails.ai_learning.false_positive_rate}</p>
                              </div>
                              <div className="bg-card p-4 rounded-lg border border-border text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Resolved (Month)</p>
                                <p className="text-2xl font-bold text-foreground">{alertDetails.ai_learning.resolved_alerts_month}</p>
                              </div>
                              <div className="bg-card p-4 rounded-lg border border-border text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Avg Resolution</p>
                                <p className="text-2xl font-bold text-foreground">{alertDetails.ai_learning.avg_resolution_time}</p>
                              </div>
                            </div>
                            <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                              <p className="text-xs text-muted-foreground italic">"{alertDetails.ai_learning.model_improvement_metrics}"</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  ) : null}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="bg-background p-4 border-t border-border flex justify-end gap-3 shrink-0">
                <button onClick={closeAlertDetails} className="px-6 py-2 rounded-lg bg-card hover:bg-secondary text-foreground text-sm font-bold border border-border transition-colors">
                  Cancel
                </button>
                <button onClick={() => { closeAlertDetails(); alert('Units Dispatched via AI Command Center!'); }} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-foreground text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2">
                  <ShieldAlert size={16} /> Execute Recommended Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
