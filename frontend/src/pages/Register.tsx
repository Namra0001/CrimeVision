import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Loader2, Lock, User as UserIcon, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState('');
  const [position, setPosition] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const roleMap: Record<string, string> = {
        'Constable': 'constable',
        'Inspector': 'inspector',
        'Superintendent of Police (SP)': 'sp',
        'Crime Analyst': 'crime_analyst',
        'Director General of Police (DGP)': 'dgp'
      };
      const role = roleMap[position] || 'constable';

      const response = await fetch('https://fuzzy-geese-lay.loca.lt' + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to register');
      }

      setOtpSent(true);
      setSuccess('OTP sent to your email. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('https://fuzzy-geese-lay.loca.lt' + '/api/auth/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to verify OTP');
      }

      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      
      {/* Left side - Animated Logo */}
      <div className="hidden lg:flex flex-[1.2] items-center justify-end relative z-10 pr-8 xl:pr-16">
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
        </div>
        
        <img 
          src="/logo.png?v=4" 
          alt="CrimeVision Logo" 
          className="w-full max-w-[1200px] h-auto drop-shadow-[0_35px_35px_rgba(59,130,246,0.5)] relative z-20"
          style={{ animation: 'float 6s ease-in-out infinite' }}
        />
        <style>{`
          @keyframes float {
            0% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.4)); }
            50% { transform: translateY(-25px) scale(1.05); filter: drop-shadow(0 0 50px rgba(59, 130, 246, 0.8)); }
            100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.4)); }
          }
        `}</style>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-start relative z-10 pl-8 xl:pl-12 py-6">
        <div className="w-full max-w-lg">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-10 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png?v=4" alt="CrimeVision" className="h-24 w-auto mb-4 object-contain drop-shadow-md" />
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground text-sm text-center mt-2">
              Register for CrimeVision Platform
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-md mb-6 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm p-3 rounded-md mb-6 text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" /> {success}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">User Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter Username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Official Email</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="officer@ksp.gov.in"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Position</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    list="positions"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Select or type position"
                    required
                  />
                  <datalist id="positions">
                    <option value="Constable" />
                    <option value="Inspector" />
                    <option value="Superintendent of Police (SP)" />
                    <option value="Crime Analyst" />
                    <option value="Director General of Police (DGP)" />
                  </datalist>
                </div>
              </div>


              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md pl-10 pr-10 py-2.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md py-2.5 flex items-center justify-center transition-all mt-6 disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Enter OTP</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all tracking-widest text-center"
                    placeholder="Enter OTP here"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md py-2.5 flex items-center justify-center transition-all mt-6 disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Register'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <span className="text-sm text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-sm text-primary hover:underline font-medium">
              Log in
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
