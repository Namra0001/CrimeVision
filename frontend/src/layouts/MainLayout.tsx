import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  AlertTriangle, 
  Network, 
  Users, 
  ShieldAlert,
  Menu,
  Bell,
  Search,
  Moon,
  Sun,
  Bot,
  HelpCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ResetPasswordForm from '../components/ResetPasswordForm';
import AddFIRModal from '../components/AddFIRModal';
import ViewFIRModal from '../components/ViewFIRModal';
import { ManageUsersModal } from '../components/ManageUsersModal';
import { getUnverifiedUsers } from '../lib/adminApi';
import { X, User as UserIcon, Mail, Shield, Loader2, CheckCircle, Plus, FileText, ChevronDown, Check, UserCheck, Users as UsersIcon, Edit2 } from 'lucide-react';
const navItems = [
  { path: '/dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
  { path: '/heatmap', label: 'Geospatial Map', icon: Map },
  { path: '/risk-analysis', label: 'Hotspot Detection', icon: ShieldAlert },
  { path: '/district-drilldown', label: 'District Drilldowns', icon: Network },
  { path: '/alerts', label: 'Trend Alerts', icon: AlertTriangle },
  { path: '/chat', label: 'AI Assistant', icon: Bot },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [isAddFIROpen, setIsAddFIROpen] = useState(false);
  const [isViewFIROpen, setIsViewFIROpen] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [selectedFIRData, setSelectedFIRData] = useState<any>(null);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const getInitials = () => {
    if (!user?.full_name) return 'IO';
    const parts = user.full_name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarForRole = (roleStr?: string) => {
    const role = (roleStr || user?.role || '').toLowerCase();
    if (role.includes('constable')) return '/avatars/constable.jpg';
    if (role.includes('dgp') || role.includes('director general')) return '/avatars/dgp.jpg';
    if (role.includes('sp') || role.includes('superintendent')) return '/avatars/sp.jpg';
    if (role.includes('analyst')) return '/avatars/analyst.jpg';
    return '/avatars/inspector.jpg'; // default
  };

  const getAvailableAvatars = () => {
    const role = (user?.role || '').toLowerCase();
    let prefix = 'inspector';
    if (role.includes('constable')) prefix = 'constable';
    if (role.includes('dgp') || role.includes('director general')) prefix = 'dgp';
    if (role.includes('sp') || role.includes('superintendent')) prefix = 'sp';
    if (role.includes('analyst')) prefix = 'analyst';
    
    return [
      `/avatars/${prefix}.jpg`,
      `/avatars/${prefix}_2.jpg`,
      `/avatars/${prefix}_3.jpg`,
      `/avatars/${prefix}_4.jpg`,
      `/avatars/${prefix}_5.jpg`,
    ];
  };

  const updateAvatar = async (url: string) => {
    setIsUpdatingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://crimevision-aq07.onrender.com/api/auth/update-avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: url })
      });
      if (res.ok) {
        // Force reload to get updated user profile
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to update avatar", e);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({ firs: [], criminals: [], stations: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  useEffect(() => {
    if (user?.email === 'admin@ksp.gov.in') {
      const token = localStorage.getItem('token');
      if (token) {
        getUnverifiedUsers(token)
          .then(data => setPendingUsersCount(data.length))
          .catch(err => console.error("Error fetching pending users", err));
      }
    }
  }, [user, isManageUsersOpen]);

  const handleFIRClick = async (crimeNo: string) => {
    try {
      const res = await fetch(`https://crimevision-aq07.onrender.com/api/fir/details/${encodeURIComponent(crimeNo)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFIRData(data);
        setIsViewFIROpen(true);
        setShowSearchResults(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetch('https://crimevision-aq07.onrender.com' + '/api/map/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Error fetching notifications", err));
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ firs: [], criminals: [], stations: [] });
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      fetch(`https://crimevision-aq07.onrender.com/api/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setIsSearching(false);
        })
        .catch(err => {
          console.error("Search error", err);
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center px-4 border-b border-border overflow-hidden bg-white dark:bg-blue-950">
          <img src="/logo.png?v=4" alt="Logo" className="h-[48px] w-[48px] object-contain shrink-0 scale-[1.6] origin-center" />
          {sidebarOpen && (
            <div className="ml-2 flex flex-col justify-center overflow-hidden whitespace-nowrap">
              <span className="font-bold text-[19px] tracking-tight text-foreground leading-tight">CrimeVision</span>
              <span className="text-[11px] text-muted-foreground tracking-wide leading-tight mt-0.5">Karnataka State Police</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white font-medium shadow-md' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        
        <div className="px-3 pb-4">
          <Link
            to="/help-support"
            className="flex items-center px-4 py-3 rounded-xl border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-amber-500/90 hover:text-amber-400 shadow-sm"
            title="Help & Support"
          >
            <HelpCircle className="h-5 w-5 shrink-0 text-amber-500/90" />
            {sidebarOpen && <span className="ml-3 font-medium whitespace-nowrap text-sm">Help & Support</span>}
          </Link>
        </div>

        <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
          {sidebarOpen && (
            <div className="flex flex-col gap-1 text-[10px]">
              <span>© 2026 Karnataka State Police</span>
              <span>CrimeVision v1.1</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary"
              aria-label="Toggle Sidebar"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <span className={`absolute transition-all duration-300 transform ${sidebarOpen ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
                  <Menu className="h-6 w-6" />
                </span>
                <span className={`absolute transition-all duration-300 transform ${sidebarOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
                  <X className="h-6 w-6" />
                </span>
              </div>
            </button>
            <div className="relative hidden md:block group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
              </div>
              <input 
                type="text" 
                placeholder="Search FIRs, Crime, Stations..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="pl-10 pr-4 py-2 bg-secondary/40 backdrop-blur-md border border-border/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 w-[400px] focus:w-[500px] transition-all duration-300 text-foreground placeholder:text-muted-foreground shadow-sm hover:bg-secondary/60"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
                    {isSearching ? (
                      <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                    ) : (
                      <>
                        {searchResults.firs?.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-2">FIRs</h4>
                            {searchResults.firs.map((item: any) => (
                              <div key={`fir-${item.id}`} onMouseDown={(e) => { e.preventDefault(); handleFIRClick(item.title); }} className="flex items-start gap-2 p-2 hover:bg-secondary rounded cursor-pointer transition-colors">
                                <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {searchResults.criminals?.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-2">Criminals</h4>
                            {searchResults.criminals.map((item: any) => (
                              <div key={`crim-${item.id}`} className="flex items-start gap-2 p-2 hover:bg-secondary rounded cursor-pointer transition-colors">
                                <UserIcon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {searchResults.stations?.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-2">Stations</h4>
                            {searchResults.stations.map((item: any) => (
                              <div key={`stat-${item.id}`} className="flex items-start gap-2 p-2 hover:bg-secondary rounded cursor-pointer transition-colors">
                                <Shield className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {!searchResults.firs?.length && !searchResults.criminals?.length && !searchResults.stations?.length && (
                          <p className="text-xs text-muted-foreground text-center py-4">No results found for "{searchQuery}"</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user?.email === 'admin@ksp.gov.in' && (
              <button 
                onClick={() => setIsManageUsersOpen(true)}
                className="hidden lg:flex relative items-center gap-1 px-4 py-1.5 bg-transparent hover:bg-emerald-600/10 text-emerald-500 border-2 border-emerald-600/50 hover:border-emerald-500 rounded-md text-sm font-bold transition-colors tracking-wide"
              >
                <UsersIcon className="h-4 w-4" />
                MANAGE USERS
                {pendingUsersCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-card">
                    {pendingUsersCount}
                  </span>
                )}
              </button>
            )}
            <button 
              onClick={() => setIsAddFIROpen(true)}
              className="hidden lg:flex items-center gap-1 px-4 py-1.5 bg-transparent hover:bg-blue-600/10 text-blue-500 border-2 border-blue-600/50 hover:border-blue-500 rounded-md text-sm font-bold transition-colors tracking-wide"
            >
              <Plus className="h-4 w-4" />
              ADD FIR
            </button>
            <button 
              onMouseEnter={() => setHasViewedNotifications(true)}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Bell className="h-5 w-5 group-hover:animate-bounce" />
              {notifications.length > 0 && !hasViewedNotifications && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full border border-card">
                  {notifications.length}
                </span>
              )}
              
              {/* Notification Popup on hover */}
              <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50 text-left">
                <div className="p-3 border-b border-border bg-secondary/30">
                  <h4 className="text-sm font-bold text-foreground">Command Center Alerts</h4>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {notifications.length > 0 ? notifications.map((n, i) => (
                    <div key={i} className="mb-2 last:mb-0 p-2 rounded bg-secondary/50 border border-border/50">
                      <h5 className="text-xs font-bold text-destructive mb-1">{n.title}</h5>
                      <p className="text-[11px] text-muted-foreground leading-tight">{n.message}</p>
                    </div>
                  )) : <p className="text-xs text-muted-foreground text-center py-4">No new alerts</p>}
                </div>
              </div>
            </button>
            <div className="relative group">
              <button 
                className="flex items-center gap-2 p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
                aria-label="Language"
              >
                <img 
                  src={language === 'en' ? "https://flagcdn.com/us.svg" : "https://flagcdn.com/in.svg"} 
                  alt={language === 'en' ? "US Flag" : "India Flag"}
                  className="h-3.5 w-auto rounded-sm object-cover"
                />
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
              
              <div className="absolute top-full right-0 mt-1 w-44 bg-card border border-border rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50 text-left overflow-hidden">
                <button 
                  onClick={() => { if(language !== 'en') toggleLanguage(); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-3 text-foreground">
                    <img src="https://flagcdn.com/us.svg" alt="US Flag" className="h-3.5 w-auto rounded-sm object-cover" />
                    <span>US English</span>
                  </div>
                  {language === 'en' && <Check className="h-4 w-4 text-foreground" />}
                </button>
                <button 
                  onClick={() => { if(language !== 'kn') toggleLanguage(); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-3 text-foreground">
                    <img src="https://flagcdn.com/in.svg" alt="India Flag" className="h-3.5 w-auto rounded-sm object-cover" />
                    <span>IN Kannada</span>
                  </div>
                  {language === 'kn' && <Check className="h-4 w-4 text-foreground" />}
                </button>
              </div>
            </div>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 text-left hover:bg-secondary/50 p-1.5 rounded-lg transition-colors"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold leading-none text-foreground">{user?.full_name || 'SP Admin'}</span>
                <span className="text-[10px] text-muted-foreground mt-1">{user?.role || 'Super Admin'}</span>
              </div>
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center border border-border overflow-hidden">
                  <img src={user?.avatar_url || getAvatarForRole()} alt="Avatar" className="h-full w-full object-cover bg-white" />
                </div>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-card rounded-full"></div>
              </div>
            </button>
          </div>
        </header>
        
        <AddFIRModal isOpen={isAddFIROpen} onClose={() => setIsAddFIROpen(false)} />
        <ViewFIRModal isOpen={isViewFIROpen} onClose={() => setIsViewFIROpen(false)} firData={selectedFIRData} />
        {isManageUsersOpen && (
          <ManageUsersModal onClose={() => setIsManageUsersOpen(false)} />
        )}
        
        {/* Profile Dialog */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col items-center mb-6 mt-2">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center border-4 border-primary/20 overflow-hidden mb-4 transition-transform group-hover:scale-105">
                    <img src={user?.avatar_url || getAvatarForRole()} alt="Avatar" className="h-full w-full object-cover bg-white" />
                  </div>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowAvatarPicker(true);
                    }} 
                    className="absolute bottom-4 right-0 h-8 w-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white border-2 border-card shadow-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Change Avatar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-foreground">{user?.full_name || 'Officer'}</h2>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg border border-border/50">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user?.email || 'Not specified'}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg border border-border/50">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span className="capitalize">{user?.role || 'Unknown Position'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowResetPassword(true);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-md transition-colors border border-border"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Avatar Picker Dialog */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => {
                  setShowAvatarPicker(false);
                  setIsProfileOpen(true);
                }}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isUpdatingAvatar}
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Choose Your Avatar</h3>
                <p className="text-sm text-muted-foreground mt-1">Select an avatar that matches your {user?.role} role</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-6">
                {getAvailableAvatars().map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => updateAvatar(url)}
                    disabled={isUpdatingAvatar}
                    className={`relative rounded-full overflow-hidden aspect-square border-4 transition-all ${user?.avatar_url === url || (!user?.avatar_url && idx === 0) ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : 'border-transparent hover:border-border hover:scale-105'} ${isUpdatingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <img src={url} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                    {(user?.avatar_url === url || (!user?.avatar_url && idx === 0)) && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {isUpdatingAvatar && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating your avatar...
                </div>
              )}
            </div>
          </div>
        )}

              {showResetPassword && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
                    <button
                      onClick={() => setShowResetPassword(false)}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h3 className="text-lg font-bold text-foreground mb-4 text-center">Reset Password</h3>
                    {user?.email ? (
                      <ResetPasswordForm email={user.email} onSuccess={() => setShowResetPassword(false)} />
                    ) : (
                      <p className="text-center text-muted-foreground">Loading user data...</p>
                    )}
                  </div>
                </div>
              )}


        {/* Logout Confirmation Dialog */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Confirm Logout</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Are you sure you want to log out of your CrimeVision account?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-md transition-colors border border-border"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                >
                  Confirm Logout
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
