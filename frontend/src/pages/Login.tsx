import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, Loader2, Lock, User as UserIcon, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('https://crimevision-aq07.onrender.com' + '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        let errDetail = 'Email or Password has been wrong';
        try {
          const errData = await response.json();
          if (errData.detail) errDetail = errData.detail;
        } catch (e) {}
        throw new Error(errDetail);
      }

      const data = await response.json();
      await login(data.access_token);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Network error: Unable to connect to server. Please try again later.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background decoration */}
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

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-start relative z-10 pl-8 xl:pl-12 py-6">
        <div className="w-full max-w-lg">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-10 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png?v=4" alt="CrimeVision" className="h-24 w-auto mb-4 object-contain drop-shadow-md" />
            <h1 className="text-2xl font-bold text-foreground">CrimeVision</h1>
            <p className="text-muted-foreground text-sm text-center mt-2">
              AI-Powered Crime Intelligence & Decision Support Platform
            </p>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Karnataka State Police</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-md mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
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
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login'}
            </button>
            
            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-sm text-primary hover:underline font-medium">
                Register here
              </Link>
            </div>
          </form>

          <div className="mt-8 text-center text-xs text-muted-foreground border-t border-border pt-6">
            Unauthorized access to this system is strictly prohibited and subject to legal action under the IT Act, 2000.
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
