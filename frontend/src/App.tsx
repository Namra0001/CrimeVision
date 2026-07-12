import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Heatmap from './pages/Heatmap';
import RiskAnalysis from './pages/RiskAnalysis';
import DistrictDrilldown from './pages/DistrictDrilldown';
import TrendAlerts from './pages/TrendAlerts';
import Chat from './pages/Chat';
import HelpSupport from './pages/HelpSupport';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Screensaver } from './components/Screensaver';
import { ErrorBoundary } from './components/ErrorBoundary';

// Placeholders for other routes until we build them
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <h2 className="text-2xl text-muted-foreground">{title} Module (Coming Soon)</h2>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="crimevision-theme">
      <AuthProvider>
        <LanguageProvider>
        <RefreshProvider>
          <Screensaver />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* All protected routes go inside this wrapper */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<ErrorBoundary><MainLayout /></ErrorBoundary>}>
                <Route index element={<Navigate to="/chat" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="heatmap" element={<Heatmap />} />
                <Route path="risk-analysis" element={<RiskAnalysis />} />
                <Route path="district-drilldown" element={<DistrictDrilldown />} />
                <Route path="alerts" element={<TrendAlerts />} />
                <Route path="chat" element={<Chat />} />
                <Route path="help-support" element={<HelpSupport />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </RefreshProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App;
