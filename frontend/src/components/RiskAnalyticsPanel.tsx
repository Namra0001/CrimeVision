import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  PieChart as PieChartIcon, 
  BarChart2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

interface Props {
  recommendations: any[];
  layer: string;
  summary?: any;
  currentMonthIndex?: number;
  MONTHS?: string[];
}

export function RiskAnalyticsPanel({ recommendations, layer, summary, currentMonthIndex = 0, MONTHS = [] }: Props) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analytics'>('recommendations');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetch(`https://fuzzy-geese-lay.loca.lt/api/risk/analytics?layer=${layer}&lang=${language}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setAnalytics(data && data.trend_data ? data : null))
        .catch(err => {
          console.error(err);
          setAnalytics(null);
        });
    }
  }, [activeTab, layer]);

  return (
    <div className="w-80 bg-card border-l border-border p-4 flex flex-col h-full shrink-0">
      
      {/* Timeline Intel Panel (Moved here from map to reduce clutter) */}
      <div className="bg-card rounded-lg p-3 border border-border shadow-sm relative overflow-hidden mb-4 shrink-0">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            {language === 'kn' ? 'ಮಾಹಿತಿ' : 'Intel'}: {MONTHS[currentMonthIndex]}
          </h4>
          {currentMonthIndex > 0 && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
              {language === 'kn' ? 'ಏನು ಬದಲಾಗಿದೆ?' : 'What Changed?'} 
            </span>
          )}
        </div>
        <p className="text-[11px] text-foreground leading-relaxed font-medium">
          {summary?.monthly_insight || "Analyzing real-time database inputs..."}
        </p>
        {currentMonthIndex > 0 && (
           <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground flex justify-between">
             <span>Δ Density: <span className="text-rose-400">+12%</span></span>
             <span>Δ Coverage: <span className="text-green-400">+4%</span></span>
           </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex bg-secondary p-1 rounded-lg mb-4 shrink-0">
        <button 
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'recommendations' ? 'bg-blue-600 text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('recommendations')}
        >
          {language === 'kn' ? 'AI ಶಿಫಾರಸುಗಳು' : 'AI Recommendations'}
        </button>
        <button 
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('analytics')}
        >
          {language === 'kn' ? 'ಲೈವ್ ಅನಾಲಿಟಿಕ್ಸ್' : 'Live Analytics'}
        </button>
      </div>

      {activeTab === 'recommendations' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {recommendations.map(rec => (
            <div key={rec.id} className="bg-secondary/50 p-3 rounded-xl border border-border/50 hover:border-blue-500/50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {rec.priority}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {language === 'kn' ? (
                    rec.type === 'Deployment' ? 'ನಿಯೋಜನೆ' :
                    rec.type === 'Infrastructure' ? 'ಮೂಲಸೌಕರ್ಯ' :
                    rec.type === 'Task Force' ? 'ಕಾರ್ಯಪಡೆ' :
                    rec.type === 'Awareness' ? 'ಜಾಗೃತಿ' :
                    rec.type === 'Routing' ? 'ಮಾರ್ಗ' :
                    rec.type === 'Proactive' ? 'ಪೂರ್ವಭಾವಿ' :
                    rec.type === 'Surveillance' ? 'ಕಣ್ಗಾವಲು' :
                    rec.type === 'Patrol' ? 'ಗಸ್ತು' : rec.type
                  ) : rec.type}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground mb-1.5 group-hover:text-blue-400 transition-colors">{rec.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.description}</p>
              
              <div className="pt-2 border-t border-border/50 flex items-start gap-2">
                <Activity size={14} className="text-green-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-foreground font-medium leading-tight">
                  <span className="text-muted-foreground">{language === 'kn' ? 'ನಿರೀಕ್ಷಿತ ಪರಿಣಾಮ:' : 'Expected Impact:'}</span> {rec.impact}
                </p>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <ShieldAlert className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No recommendations generated.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-6">
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart2 size={14} /> Trend Analysis
            </h4>
            <div className="bg-secondary/30 rounded-lg border border-border/50 p-2 flex justify-center">
                <LineChart width={270} height={150} data={analytics.trend_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={25} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="crimes" stroke="#3b82f6" strokeWidth={3} dot={{ r: 2, fill: '#3b82f6' }} activeDot={{ r: 4 }} />
                </LineChart>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <PieChartIcon size={14} /> Category Breakdown
            </h4>
            <div className="bg-secondary/30 rounded-lg border border-border/50 p-2 flex flex-col items-center">
                <PieChart width={270} height={180}>
                  <Pie
                    data={analytics.categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {analytics.categories.map((entry: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
