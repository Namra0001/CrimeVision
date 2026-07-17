import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { useRefresh } from '../contexts/RefreshContext';

interface ViewFIRModalProps {
  isOpen: boolean;
  onClose: () => void;
  firData: any;
}

export default function ViewFIRModal({ isOpen, onClose, firData }: ViewFIRModalProps) {
  const { triggerRefresh } = useRefresh();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !firData) return null;

  const handleSolve = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/fir/solve/${encodeURIComponent(firData.crime_no)}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to solve FIR');
      
      setSuccess(true);
      triggerRefresh();
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error(err);
      alert('Error solving FIR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
          <ShieldAlert className="text-primary" />
          {firData.crime_no}
        </h2>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-foreground">Case Solved</h3>
            <p className="text-muted-foreground mt-2">The FIR status has been updated successfully.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Case Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">Case Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Crime No.</label>
                  <input type="text" readOnly value={firData.crime_no || ''} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                  <input type="text" readOnly value={firData.incident_date || ''} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                  <input type="text" readOnly value={firData.case_category || ''} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Police Station</label>
                  <input type="text" readOnly value={firData.police_station || ''} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Brief Facts</label>
                <textarea readOnly value={firData.brief_facts || ''} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground min-h-[100px] cursor-not-allowed" />
              </div>
            </div>

            {/* People Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">People Involved</h3>
              <div className="grid grid-cols-3 gap-6">
                {/* Complainant */}
                <div className="space-y-3 bg-background/50 p-4 rounded-lg border border-border">
                  <h4 className="font-medium text-primary">Complainant</h4>
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <p className="text-sm">{firData.complainant_name || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Age</label>
                      <p className="text-sm">{firData.complainant_age || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Gender</label>
                      <p className="text-sm">{firData.complainant_gender || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Victim */}
                <div className="space-y-3 bg-background/50 p-4 rounded-lg border border-border">
                  <h4 className="font-medium text-destructive">Victim</h4>
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <p className="text-sm">{firData.victim_name || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Age</label>
                      <p className="text-sm">{firData.victim_age || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Gender</label>
                      <p className="text-sm">{firData.victim_gender || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Accused */}
                <div className="space-y-3 bg-background/50 p-4 rounded-lg border border-border">
                  <h4 className="font-medium text-orange-500">Accused</h4>
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <p className="text-sm">{firData.accused_name || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Age</label>
                      <p className="text-sm">{firData.accused_age || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Gender</label>
                      <p className="text-sm">{firData.accused_gender || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSolve}
                disabled={loading || firData.status === 'Closed'}
                className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  firData.status === 'Closed' ? 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {firData.status === 'Closed' ? 'ALREADY SOLVED' : 'CASE SOLVE'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
