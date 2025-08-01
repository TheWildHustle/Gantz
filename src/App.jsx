import { useState } from 'react';
import { NostrProvider } from './contexts/NostrContext';
import { useNostr } from './contexts/useNostr';
import Header from './components/Header';
import ProfileTab from './components/ProfileTab';
import FeedTab from './components/FeedTab';
import EventsTab from './components/EventsTab';
import TeamsTab from './components/TeamsTab';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const { isLoggedIn } = useNostr();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'feed':
        return <FeedTab />;
      case 'events':
        return <EventsTab />;
      case 'teams':
        return <TeamsTab />;
      default:
        return <FeedTab />;
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#000000',
      color: '#ffffff',
      margin: 0,
      padding: 0,
      minHeight: '100vh'
    }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {renderActiveTab()}
      </main>
    </div>
  );
};

const LoginScreen = () => {
  const { loginWithExtension, loading } = useNostr();

  const handleLogin = async () => {
    try {
      await loginWithExtension();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-2xl ring-4 ring-red-500/20">
            G
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent mb-2">
            GANTZ
          </h1>
          <p className="text-gray-400 text-xl font-light">
            Fitness Social Network
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900/50 via-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm shadow-2xl">
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Connect your Nostr account to join the fitness community
          </p>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-xl text-lg disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-red-500/25 transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>⚡</span>
                <span>Connect Nostr</span>
              </div>
            )}
          </button>
          
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="font-medium text-gray-300">Need a Nostr extension?</span><br />
              Install Alby, nos2x, or another Nostr browser extension to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <NostrProvider>
      <AppContent />
    </NostrProvider>
  );
}

export default App;
