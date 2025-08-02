import { useNostr } from '../contexts/useNostr';
import TimerComponent from './TimerComponent';

const Header = ({ activeTab, setActiveTab }) => {
  const { logout } = useNostr();

  const headerStyle = {
    background: '#111111',
    borderBottom: '2px solid #333333',
    padding: '20px'
  };

  const headerContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: '800',
    color: '#ff6b6b',
    textDecoration: 'none'
  };

  const navStyle = {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  };

  const getNavLinkStyle = (isActive) => ({
    color: isActive ? '#ff6b6b' : '#cccccc',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '8px 16px',
    border: `2px solid ${isActive ? '#ff6b6b' : 'transparent'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    background: isActive ? 'rgba(255, 107, 107, 0.1)' : 'none',
    fontSize: '16px',
    transition: 'all 0.3s'
  });

  const connectBtnStyle = {
    background: '#ff6b6b',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px'
  };

  return (
    <header style={headerStyle}>
      <div style={headerContentStyle}>
        <a href="#" style={logoStyle}>GANTZ</a>
        <nav style={navStyle}>
          <button 
            style={getNavLinkStyle(activeTab === 'feed')} 
            onClick={() => setActiveTab('feed')}
            onMouseOver={(e) => {
              if (activeTab !== 'feed') {
                e.target.style.color = '#ffffff';
                e.target.style.borderColor = '#444444';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'feed') {
                e.target.style.color = '#cccccc';
                e.target.style.borderColor = 'transparent';
              }
            }}
          >
            Feed
          </button>
          <button 
            style={getNavLinkStyle(activeTab === 'profile')} 
            onClick={() => setActiveTab('profile')}
            onMouseOver={(e) => {
              if (activeTab !== 'profile') {
                e.target.style.color = '#ffffff';
                e.target.style.borderColor = '#444444';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'profile') {
                e.target.style.color = '#cccccc';
                e.target.style.borderColor = 'transparent';
              }
            }}
          >
            Profile
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              style={getNavLinkStyle(activeTab === 'room')} 
              onClick={() => setActiveTab('room')}
              onMouseOver={(e) => {
                if (activeTab !== 'room') {
                  e.target.style.color = '#ffffff';
                  e.target.style.borderColor = '#444444';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== 'room') {
                  e.target.style.color = '#cccccc';
                  e.target.style.borderColor = 'transparent';
                }
              }}
            >
              Room
            </button>
            <TimerComponent
              initialSeconds={300} // 5 minutes for demo
              format="M:SS"
              prefix="Room: "
              style={{
                fontSize: '14px',
                color: '#ff6b6b',
                fontWeight: '600'
              }}
              onComplete={() => {
                console.log('Room formation timer completed!');
                // This will trigger room formation in the future
              }}
            />
          </div>
          <button 
            style={getNavLinkStyle(activeTab === 'teams')} 
            onClick={() => setActiveTab('teams')}
            onMouseOver={(e) => {
              if (activeTab !== 'teams') {
                e.target.style.color = '#ffffff';
                e.target.style.borderColor = '#444444';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'teams') {
                e.target.style.color = '#cccccc';
                e.target.style.borderColor = 'transparent';
              }
            }}
          >
            Teams
          </button>
          <button 
            style={connectBtnStyle}
            onClick={logout}
            onMouseOver={(e) => e.target.style.background = '#ff5252'}
            onMouseOut={(e) => e.target.style.background = '#ff6b6b'}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;