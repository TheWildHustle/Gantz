import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';

const TeamsTab = () => {
  const { fetchEvents } = useNostr();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define styles to match the HTML design
  const h2Style = {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#ffffff'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  };

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center'
  };

  const h3Style = {
    fontSize: '20px',
    marginBottom: '10px'
  };

  const pStyle = {
    color: '#cccccc',
    lineHeight: '1.6'
  };

  const btnStyle = {
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '500',
    marginTop: '15px'
  };

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        
        // Fetch NIP101e teams (kind 33404)
        const teamFilter = {
          kinds: [33404],
          limit: 20,
        };

        const teamData = await fetchEvents(teamFilter, { closeOnEose: true });
        
        // Sort by creation time (newest first)
        const sortedTeams = teamData.sort((a, b) => b.created_at - a.created_at);
        
        setTeams(sortedTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [fetchEvents]);

  if (loading) {
    return (
      <div>
        <h2 style={h2Style}>Teams</h2>
        <div style={cardStyle}>
          <h3 style={h3Style}>Loading teams...</h3>
          <p style={pStyle}>Please wait while we fetch the latest teams.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={h2Style}>Teams</h2>
      
      {teams.length > 0 ? (
        <div style={gridStyle}>
          {teams.map(team => (
            <TeamCard key={team.id} team={team} cardStyle={cardStyle} h3Style={h3Style} pStyle={pStyle} btnStyle={btnStyle} />
          ))}
        </div>
      ) : (
        <div style={cardStyle}>
          <h3 style={h3Style}>No Teams Found</h3>
          <p style={pStyle}>No teams are currently available. Check back later!</p>
        </div>
      )}
    </div>
  );
};

const TeamCard = ({ team, cardStyle, h3Style, pStyle, btnStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTagValue = (tagName) => {
    const tag = team.tags.find(t => t[0] === tagName);
    return tag ? tag[1] : null;
  };

  const teamName = getTagValue('name') || 'Unnamed Team';

  const currentStyle = isHovered ? {
    ...cardStyle,
    borderColor: '#ff6b6b',
    transform: 'translateY(-2px)'
  } : cardStyle;

  return (
    <div 
      style={currentStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 style={h3Style}>{teamName}</h3>
      <button 
        style={btnStyle}
        onMouseOver={(e) => e.target.style.background = '#ff5252'}
        onMouseOut={(e) => e.target.style.background = '#ff6b6b'}
      >
        View Team
      </button>
    </div>
  );
};

export default TeamsTab;