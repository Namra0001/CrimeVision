import React from 'react';
import { Shield, BookOpen, Mail, Phone, MessageSquare, Info, MapPin, AlertTriangle, Network, Bot } from 'lucide-react';

export default function HelpSupport() {
  return (
    <div className="h-full w-full overflow-y-auto bg-background p-6 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <BookOpen className="text-blue-500 h-8 w-8" />
            Help & Support Center
          </h1>
          <p className="text-muted-foreground">
            Learn how to use CrimeVision's powerful features and get in touch with our support team if you need assistance.
          </p>
        </div>

        {/* Feature Guide */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Platform Features Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dashboard */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <Shield size={20} />
                </div>
                <h3 className="font-medium text-lg">Main Dashboard</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 flex-1">
                <p>Your centralized command center for viewing top-level state statistics.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>KPI Metrics:</strong> View overall solved cases, pending cases, and high-risk alerts.</li>
                  <li><strong>Global Search:</strong> Use the top search bar to quickly look up FIR numbers (e.g. CR-2026-9090).</li>
                  <li><strong>Time Filters:</strong> Adjust the year dropdown to see historical vs current data.</li>
                </ul>
              </div>
            </div>

            {/* Geospatial Map */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                  <MapPin size={20} />
                </div>
                <h3 className="font-medium text-lg">Geospatial Map</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 flex-1">
                <p>Visualize crime data geographically to pinpoint exact criminal hotspots.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Heatmap View:</strong> See color-coded density of crimes across regions.</li>
                  <li><strong>Cluster View:</strong> Zoom in to see individual pins for specific FIR cases.</li>
                  <li><strong>Advanced Filters:</strong> Filter by date ranges, severity, and crime type.</li>
                </ul>
              </div>
            </div>

            {/* Risk Analysis */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-medium text-lg">Hotspot Detection</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 flex-1">
                <p>AI-driven predictive analysis for emerging high-risk zones.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Risk Scoring:</strong> Every station is assigned a dynamic risk score.</li>
                  <li><strong>AI Recommendations:</strong> Get actionable steps (e.g., "Install CCTVs") based on local case trends.</li>
                  <li><strong>Automated Briefings:</strong> Generates instant situation reports.</li>
                </ul>
              </div>
            </div>

            {/* District Drilldowns */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                  <Network size={20} />
                </div>
                <h3 className="font-medium text-lg">District Drilldowns</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 flex-1">
                <p>Compare performance metrics between different districts and stations.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Clearance Rates:</strong> Track which stations are solving cases the fastest.</li>
                  <li><strong>Resource Allocation:</strong> Identify under-performing districts.</li>
                  <li><strong>Crime Distribution:</strong> See pie charts of crime types per district.</li>
                </ul>
              </div>
            </div>

            {/* Trend Alerts */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <Info size={20} />
                </div>
                <h3 className="font-medium text-lg">Trend Alerts</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 flex-1">
                <p>Stay ahead of crime spikes with automated anomaly detection.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Anomaly Flags:</strong> Get alerted when a specific crime spikes rapidly.</li>
                  <li><strong>Weekly Reports:</strong> Auto-generated summaries of major statewide changes.</li>
                  <li><strong>Pattern Recognition:</strong> Matches current spikes to historical events.</li>
                </ul>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                  <Bot size={20} />
                </div>
                <h3 className="font-medium text-lg">AI Assistant</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 flex-1">
                <p>Chat securely with our locally-contextualized Intelligence Network.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Natural Language:</strong> Ask "What are the cybercrime trends?" in plain English.</li>
                  <li><strong>Dataset Upload:</strong> Feed custom CSV files to teach the AI new patterns.</li>
                  <li><strong>Auto-Translation:</strong> Supports typing in Kannada for automated English translation.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="space-y-6 pt-6">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Contact Support</h2>
          
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6">
              <p className="text-muted-foreground mb-6">
                Experiencing technical difficulties, need an account upgrade, or want to report a critical bug? 
                Connect directly with the system administrators.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4 p-5 rounded-xl bg-secondary/60 border border-border/50">
                  <div className="p-4 bg-blue-500/10 rounded-full text-blue-500 flex-shrink-0">
                    <Phone size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Phone Support</p>
                    <p className="text-sm font-semibold text-foreground">+91 90230-91858</p>
                    <p className="text-xs text-muted-foreground">Mon-Sat   |   3am-6pm</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 rounded-xl bg-secondary/60 border border-border/50">
                  <div className="p-4 bg-green-500/10 rounded-full text-green-500 flex-shrink-0">
                    <Mail size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Email Desk</p>
                    <p className="text-sm font-semibold text-foreground">support@crimevision.ksp.gov</p>
                    <p className="text-xs text-muted-foreground">24/7 Response</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 rounded-xl bg-secondary/60 border border-border/50">
                  <div className="p-4 bg-purple-500/10 rounded-full text-purple-500 flex-shrink-0">
                    <MessageSquare size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">IT Cell HQ</p>
                    <p className="text-sm font-semibold text-foreground">CrimeVision IT Department</p>
                    <p className="text-xs text-muted-foreground">Surat, Gujarat</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-secondary p-4 text-center border-t border-border">
              <p className="text-sm text-muted-foreground">
                For emergency operational overrides, please use the secure internal dispatch line.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
