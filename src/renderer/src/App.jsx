import { useState } from 'react'
import { Clock, History, User, Calendar, LogOut, Sparkles } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TimerProvider, useTimer } from './contexts/TimerContext'
import AuthWrapper from './components/auth/AuthWrapper'
import Dashboard from './components/Dashboard'
import PastSessions from './components/PastSessions'

function AppContent() {
  const { currentUser, userProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  const { sessions, loading } = useTimer() // Initialize timer context

  // Load user sessions from Firebase

  // const handleSessionSubmit = async (session: TimeSession) => {
  //   if (!currentUser) return;

  //   try {
  //     const sessionId = await FirebaseService.saveSession(
  //       currentUser.uid,
  //       session
  //     );
  //     const sessionWithId = { ...session, id: sessionId };
  //     setSessions((prev) => [sessionWithId, ...prev]);
  //   } catch (error) {
  //     console.error("Error saving session:", error);
  //     throw error;
  //   }
  // };

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Show auth screens if user is not authenticated
  if (!currentUser) {
    return <AuthWrapper />
  }

  // Show loading while fetching user data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Clock },
    { id: 'history', label: 'History', icon: History }
  ]

  // Get current date and time info
  const now = new Date()
  const userName = userProfile?.fullName || currentUser.displayName || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <header className="sticky top-[40px] z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-200/60 shadow-sm mb-[40px]">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Date */}
            <div className="flex items-center gap-3">
              {/* App Icon */}
              <div className="w-7 h-7 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>

              {/* App Info */}
              <div className="leading-tight">
                <h1 className="text-sm font-semibold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  TimeTracker
                </h1>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {now.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Greeting & Actions */}
            <div className="flex items-center gap-3">
              {/* Greeting */}
              <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="truncate">Welcome, {userName.split(' ')[0]}!</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-6">
        {activeTab === 'dashboard' ? <Dashboard /> : <PastSessions sessions={sessions} />}
      </div>

      {/* Enhanced Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 shadow-inner border border-gray-200/50 gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 scale-105'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white/70'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-all duration-200 ${
                      isActive ? 'text-white scale-110' : 'text-gray-500'
                    }`}
                  />
                  <span className={isActive ? 'font-bold' : 'font-medium'}>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <TimerProvider>
          <Header />
          <AppContent />
      </TimerProvider>
    </AuthProvider>
  )
}

export default App

function Header() {
  return (
    <header id="header">
      <button id="close" onClick={() => window.electron.sendFrameAction('CLOSE')} className="group">
        <img
          src="https://cdn-icons-png.flaticon.com/128/9068/9068699.png"
          alt="close"
          className="h-4 opacity-0 group-hover:opacity-100"
        />
      </button>
      <button
        id="minimize"
        className="group"
        onClick={() => window.electron.sendFrameAction('MINIMIZE')}
      >
        <img
          src="https://cdn-icons-png.flaticon.com/128/10629/10629637.png"
          alt="close"
          className="h-4 opacity-0 group-hover:opacity-100"
        />
      </button>
      <button
        id="maximize"
        className="group"
        onClick={() => window.electron.sendFrameAction('MAXIMIZE')}
      >
        <img
          src="https://cdn-icons-png.flaticon.com/128/5423/5423925.png"
          alt="maximize"
          className="h-4 opacity-0 group-hover:opacity-100"
        />
      </button>
    </header>
  )
}
