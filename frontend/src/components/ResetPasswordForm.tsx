import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordFormProps {
  email: string;
  onSuccess: () => void;
}

export default function ResetPasswordForm({ email, onSuccess }: ResetPasswordFormProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Send OTP automatically when component mounts
  useEffect(() => {
    const sendOtp = async () => {
      setLoading(true);
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) {
          throw resetError;
        }
        setOtpSent(true);
        setSuccess('OTP sent to your email.');
      } catch (e: any) {
        setError(e.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    };
    if (email) sendOtp();
  }, [email]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });
      if (verifyError) {
        throw verifyError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) {
        throw updateError;
      }
      
      setSuccess('Password reset successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-md text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm p-3 rounded-md text-center flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4" /> {success}
        </div>
      )}
      {otpSent && (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Enter OTP</label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Enter OTP"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">New Password</label>
            <div className="relative">
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md py-2.5 flex items-center justify-center transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}
