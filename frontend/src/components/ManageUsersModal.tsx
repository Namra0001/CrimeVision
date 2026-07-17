import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVerifiedUsers, getUnverifiedUsers, removeUserByAdmin, verifyUserByAdmin, rejectUserByAdmin, type UnverifiedUser } from '../lib/adminApi';
import { Users, UserCheck } from 'lucide-react';

interface ManageUsersModalProps {
  onClose: () => void;
}

export const ManageUsersModal = ({ onClose }: ManageUsersModalProps) => {
  const { token } = useAuth();
  const [verifiedUsers, setVerifiedUsers] = useState<UnverifiedUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verified' | 'pending'>('verified');
  
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [vUsers, pUsers] = await Promise.all([
        getVerifiedUsers(token!),
        getUnverifiedUsers(token!)
      ]);
      setVerifiedUsers(vUsers);
      setPendingUsers(pUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemove = async (userId: number) => {
    try {
      await removeUserByAdmin(userId, token!);
      setVerifiedUsers(verifiedUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Failed to remove user: " + err.message);
    }
  };

  const handleVerify = async (userId: number) => {
    try {
      await verifyUserByAdmin(userId, token!);
      const user = pendingUsers.find(u => u.id === userId);
      if (user) {
        setPendingUsers(pendingUsers.filter(u => u.id !== userId));
        setVerifiedUsers([...verifiedUsers, user]);
      }
    } catch (err: any) {
      alert("Failed to verify user: " + err.message);
    }
  };

  const handleReject = async (userId: number) => {
    try {
      await rejectUserByAdmin(userId, token!);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Failed to reject user: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg mr-3">
              <Users className="w-5 h-5" />
            </span>
            Manage Users
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

        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('verified')}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'verified' 
                ? 'bg-slate-800/50 text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <Users className="h-4 w-4" />
            Verified Users ({verifiedUsers.length})
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'pending' 
                ? 'bg-slate-800/50 text-blue-400 border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Pending Verification 
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{pendingUsers.length}</span>
            )}
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          ) : activeTab === 'verified' ? (
            verifiedUsers.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                No verified users found.
              </div>
            ) : (
              <div className="space-y-4">
                {verifiedUsers.map(user => (
                  <div key={user.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">{user.full_name}</div>
                      <div className="text-sm text-slate-400">{user.email} &bull; <span className="uppercase text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{user.role}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRemove(user.id)}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-red-900/50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            pendingUsers.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                No pending users found.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">{user.full_name}</div>
                      <div className="text-sm text-slate-400">{user.email} &bull; <span className="uppercase text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{user.role}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleReject(user.id)}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-red-900/50"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleVerify(user.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 text-sm flex items-center gap-2"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
