import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUnverifiedUsers, verifyUserByAdmin, UnverifiedUser } from '../lib/adminApi';

interface VerifyUsersModalProps {
  onClose: () => void;
}

export const VerifyUsersModal = ({ onClose }: VerifyUsersModalProps) => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUnverifiedUsers(token!);
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async (userId: number) => {
    try {
      await verifyUserByAdmin(userId, token!);
      // Remove verified user from list
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Failed to verify user: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg mr-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Verify Pending Users
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-8 text-slate-400">
              No pending users found.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{user.full_name}</div>
                    <div className="text-sm text-slate-400">{user.email} &bull; <span className="uppercase text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{user.role}</span></div>
                  </div>
                  <button 
                    onClick={() => handleVerify(user.id)}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-green-900/20 text-sm flex items-center gap-2"
                  >
                    Verify User
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
