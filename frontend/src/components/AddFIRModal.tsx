import React, { useState, useRef } from 'react';
import { X, FileText, User, ShieldAlert, CheckCircle, Loader2, MapPin, Info, Download, Upload } from 'lucide-react';
import LocationPickerMap from './LocationPickerMap';
import { useRefresh } from '../contexts/RefreshContext';

interface AddFIRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFIRModal({ isOpen, onClose }: AddFIRModalProps) {
  const { triggerRefresh } = useRefresh();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showBriefFactsInfo, setShowBriefFactsInfo] = useState(false);
  const [showAccusedInfo, setShowAccusedInfo] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    crime_no: '',
    police_station: '',
    incident_date: new Date().toISOString().split('T')[0],
    case_category: 'Murder',
    latitude: 12.9716,
    longitude: 77.5946,
    brief_facts: '',
    complainant_name: '',
    complainant_age: '',
    complainant_gender: 'Male',
    victim_name: '',
    victim_age: '',
    victim_gender: 'Female',
    accused_name: '',
    accused_age: '',
    accused_gender: 'Male',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTranslate = async () => {
    if (!formData.brief_facts.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('http://localhost:8000/api/fir/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formData.brief_facts })
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, brief_facts: data.translated_text }));
      }
    } catch (e) {
      console.error("Translation failed", e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude as any),
        longitude: parseFloat(formData.longitude as any),
        complainant_age: formData.complainant_age ? parseInt(formData.complainant_age) : null,
        victim_age: formData.victim_age ? parseInt(formData.victim_age) : null,
        accused_age: formData.accused_age ? parseInt(formData.accused_age) : null,
      };

      const res = await fetch('http://localhost:8000/api/fir/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to add FIR');
      }
      
      setSuccess(true);
      triggerRefresh();
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error submitting FIR');
      // If it's a validation error, take them back to step 1 so they can fix it
      if (err.message?.includes('Crime No')) {
         setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/fir/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Bulk upload failed');
      
      setSuccess(true);
      triggerRefresh();
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
      }, 2000);
      
    } catch (err) {
      console.error(err);
      alert('Error during bulk upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    window.open('http://localhost:8000/api/fir/bulk-template', '_blank');
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-8 w-full max-w-6xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
          <ShieldAlert className="text-primary" />
          Register New FIR
        </h2>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-green-500">FIR Registered Successfully</h3>
            <p className="text-muted-foreground mt-2 text-center">Dashboard and maps have been updated with the new case data.</p>
          </div>
        ) : (
          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>
            
            {/* Steps Header */}
            <div className="flex justify-between mb-8 relative before:absolute before:top-1/2 before:w-full before:h-0.5 before:bg-border before:-z-10">
              {['Case Details', 'Complainant', 'Victim', 'Accused'].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center bg-card px-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step > idx ? 'bg-primary border-primary text-primary-foreground' : step === idx + 1 ? 'bg-background border-primary text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="text-destructive shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-destructive">Submission Error</h4>
                  <p className="text-sm text-destructive/80 mt-1">{errorMsg}</p>
                </div>
                <button type="button" onClick={() => setErrorMsg(null)} className="text-destructive/50 hover:text-destructive transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="space-y-4">
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2"><FileText className="inline mr-2 h-4 w-4"/>Case Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Crime No.</label>
                      <input required name="crime_no" value={formData.crime_no} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" placeholder="e.g. CR-2023-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <input required type="date" name="incident_date" value={formData.incident_date} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select name="case_category" value={formData.case_category} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm">
                        <option value="Murder">Murder</option>
                        <option value="Robbery">Robbery</option>
                        <option value="Cyber Fraud">Cyber Fraud</option>
                        <option value="Vehicle Theft">Vehicle Theft</option>
                        <option value="Chain Snatching">Chain Snatching</option>
                        <option value="Kidnapping">Kidnapping</option>
                        <option value="Domestic Violence">Domestic Violence</option>
                        <option value="Burglary">Burglary</option>
                        <option value="Drug Case">Drug Case</option>
                        <option value="Economic Offence">Economic Offence</option>
                        <option value="Rioting">Rioting</option>
                        <option value="Assault">Assault</option>
                        <option value="Missing Person">Missing Person</option>
                        <option value="Women Harassment">Women Harassment</option>
                        <option value="Child Crime">Child Crime</option>
                        <option value="Theft">Theft</option>
                        <option value="Cyber Crime">Cyber Crime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Police Station</label>
                      <input required list="police-stations" name="police_station" value={formData.police_station} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" placeholder="Search police station..." />
                      <datalist id="police-stations">
                        <option value="Cubbon Park Police Station" />
                        <option value="Ashok Nagar Police Station" />
                        <option value="Madiwala Police Station" />
                        <option value="Whitefield Police Station" />
                        <option value="Electronic City Police Station" />
                        <option value="Hebbal Police Station" />
                        <option value="Jayanagar Police Station" />
                        <option value="Yeshwanthpur Police Station" />
                        <option value="Banashankari Police Station" />
                        <option value="Basavanagudi Police Station" />
                        <option value="Vidhana Soudha Police Station" />
                        <option value="Mysuru South Police Station" />
                        <option value="Mysuru North Police Station" />
                        <option value="Belagavi Rural Police Station" />
                        <option value="Belagavi Market Police Station" />
                        <option value="Hubballi Town Police Station" />
                        <option value="Dharwad Sub Urban Police Station" />
                        <option value="Mangaluru North Police Station" />
                        <option value="Mangaluru South Police Station" />
                        <option value="Udupi Town Police Station" />
                        <option value="Tumakuru Town Police Station" />
                        <option value="Shivamogga Town Police Station" />
                        <option value="Raichur East Police Station" />
                        <option value="Ballari Rural Police Station" />
                        <option value="Bidar Town Police Station" />
                        <option value="Kalaburagi University Police Station" />
                        <option value="Mandya Rural Police Station" />
                      </datalist>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Location Coordinates</label>
                        <button type="button" onClick={() => setShowMap(!showMap)} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-bold bg-primary/10 px-2 py-1 rounded">
                          <MapPin size={12} /> {showMap ? 'Hide Map' : 'USING MAP'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Lat</label>
                          <input required type="number" step="0.0001" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Lng</label>
                          <input required type="number" step="0.0001" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                        </div>
                      </div>
                      {showMap && (
                        <LocationPickerMap 
                          lat={Number(formData.latitude) || 12.9716} 
                          lng={Number(formData.longitude) || 77.5946} 
                          onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                        />
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <label className="block text-sm font-medium">Brief Facts</label>
                        <button type="button" onClick={() => setShowBriefFactsInfo(!showBriefFactsInfo)} className="text-muted-foreground hover:text-primary transition-colors focus:outline-none">
                          <Info size={14} />
                        </button>
                        {isTranslating && (
                          <span className="text-xs text-primary flex items-center gap-1 ml-2 animate-pulse">
                            <Loader2 size={12} className="animate-spin" /> Translating...
                          </span>
                        )}
                      </div>
                      
                      {showBriefFactsInfo && (
                        <div className="bg-primary/10 border border-primary/20 text-xs text-foreground p-3 rounded-md mb-2 animate-in fade-in slide-in-from-top-2">
                          <p className="font-bold mb-1 text-primary">What to include:</p>
                          <ul className="list-disc pl-4 space-y-1 mb-2 text-muted-foreground">
                            <li>Date, time, and specific location of the incident</li>
                            <li>Sequence of events clearly and concisely</li>
                            <li>Details of stolen property, weapons used, or injuries sustained</li>
                            <li><strong className="text-primary/80">Auto-Translation:</strong> You can type in Kannada. It will automatically translate to English when you click away!</li>
                          </ul>
                          <p className="font-bold mb-1 text-primary">Example:</p>
                          <p className="italic text-muted-foreground bg-background/50 p-2 rounded border border-border/50">
                            "On Oct 12, 2023, around 10:30 PM, the complainant was walking near KBC Plaza when two unidentified individuals on a black motorcycle approached. The pillion rider snatched a gold chain (approx. 20g) and fled towards MG Road."
                          </p>
                        </div>
                      )}
                      
                      <textarea required name="brief_facts" value={formData.brief_facts} onChange={handleChange} onBlur={handleTranslate} rows={3} className="w-full bg-secondary border border-border rounded p-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none" placeholder="Describe the incident..."></textarea>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2"><User className="inline mr-2 h-4 w-4"/>Complainant Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input required name="complainant_name" value={formData.complainant_name} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Age</label>
                      <input type="number" name="complainant_age" value={formData.complainant_age} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select name="complainant_gender" value={formData.complainant_gender} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2"><User className="inline mr-2 h-4 w-4 text-orange-500"/>Victim Details</h3>
                  <p className="text-xs text-muted-foreground mb-4">Leave blank if victim is same as complainant or unknown.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input name="victim_name" value={formData.victim_name} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Age</label>
                      <input type="number" name="victim_age" value={formData.victim_age} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select name="victim_gender" value={formData.victim_gender} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                    <h3 className="text-lg font-semibold flex items-center">
                      <User className="inline mr-2 h-4 w-4 text-destructive"/>
                      Accused Details
                    </h3>
                    <button type="button" onClick={() => setShowAccusedInfo(!showAccusedInfo)} className="text-muted-foreground hover:text-primary transition-colors focus:outline-none">
                      <Info size={16} />
                    </button>
                  </div>

                  {showAccusedInfo && (
                    <div className="bg-primary/10 border border-primary/20 text-xs text-foreground p-3 rounded-md mb-4 animate-in fade-in slide-in-from-top-2">
                      <p className="font-bold mb-1 text-primary">What to include:</p>
                      <ul className="list-disc pl-4 space-y-1 mb-2 text-muted-foreground">
                        <li>The full legal name of the accused, if known.</li>
                        <li>Approximate or exact age of the accused.</li>
                        <li>Gender identity of the accused.</li>
                        <li>Leave these fields completely blank if the accused is unidentified or unknown at the time of reporting.</li>
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mb-4">Leave blank if accused is unknown.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input name="accused_name" value={formData.accused_name} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Age</label>
                      <input type="number" name="accused_age" value={formData.accused_age} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select name="accused_gender" value={formData.accused_gender} onChange={handleChange} className="w-full bg-secondary border border-border rounded p-2 text-sm">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
              {/* Left Side: Bulk Upload Features */}
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={handleDownloadTemplate}
                  title="Download Excel Template"
                  className="p-2 border border-border rounded bg-secondary text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <Download size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleBulkUpload} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 border border-border rounded bg-secondary text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Upload size={16} className="text-primary" />}
                  {isUploading ? 'Uploading & Parsing...' : 'Bulk Upload'}
                </button>
              </div>

              {/* Right Side: Navigation Buttons */}
              <div className="flex items-center gap-3">
                {step > 1 ? (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="px-4 py-2 border border-border rounded bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors">Back</button>
                ) : null}
                
                <button 
                  type="submit" 
                  disabled={loading || isUploading}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 flex items-center shadow-lg hover:shadow-primary/20 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                  {step === 4 ? 'Submit FIR' : 'Next'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
