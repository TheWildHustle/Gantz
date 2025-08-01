import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';

const EventsTab = () => {
  const { fetchEvents } = useNostr();
  const [events, setEvents] = useState([]);
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
    transition: 'all 0.3s'
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
    const loadEvents = async () => {
      try {
        setLoading(true);
        
        // Fetch NIP101e team events and challenges (kinds 31012, 31013)
        const eventFilter = {
          kinds: [31012, 31013],
          limit: 20,
        };

        const eventData = await fetchEvents(eventFilter, { closeOnEose: true });
        
        // Sort by creation time (newest first)
        const sortedEvents = eventData.sort((a, b) => b.created_at - a.created_at);
        
        setEvents(sortedEvents);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <div>
        <h2 style={h2Style}>Active Events & Challenges</h2>
        <div style={cardStyle}>
          <h3 style={h3Style}>Loading events...</h3>
          <p style={pStyle}>Please wait while we fetch the latest challenges.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={h2Style}>Active Events & Challenges</h2>
      
      {events.length > 0 ? (
        <div style={gridStyle}>
          {events.map(event => (
            <EventCard key={event.id} event={event} cardStyle={cardStyle} h3Style={h3Style} pStyle={pStyle} btnStyle={btnStyle} />
          ))}
        </div>
      ) : (
        <div style={cardStyle}>
          <h3 style={h3Style}>No Events Found</h3>
          <p style={pStyle}>No events or challenges are currently available. Check back later!</p>
        </div>
      )}
    </div>
  );
};

const EventCard = ({ event, cardStyle, h3Style, pStyle, btnStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTagValue = (tagName) => {
    const tag = event.tags.find(t => t[0] === tagName);
    return tag ? tag[1] : null;
  };

  const title = getTagValue('title') || 'Untitled Event';
  const description = getTagValue('description') || event.content;
  const startDate = getTagValue('start_date');
  const status = getTagValue('status') || 'active';
  const prizePool = getTagValue('prize_pool');
  const participants = getTagValue('participants');

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4ade80';
      case 'upcoming':
        return '#fbbf24';
      case 'completed':
        return '#9ca3af';
      default:
        return '#4ade80';
    }
  };

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
      <h3 style={h3Style}>{title}</h3>
      <p style={{color: getStatusColor(status), fontSize: '14px', marginBottom: '10px'}}>
        {status?.toUpperCase() || 'ACTIVE'}
      </p>
      <p style={pStyle}>{description}</p>
      
      {startDate && (
        <p style={{...pStyle, marginTop: '10px'}}>
          📅 Starts: {formatDate(startDate)}
        </p>
      )}
      
      {prizePool && (
        <p style={{...pStyle, marginTop: '10px'}}>
          🏆 Prize Pool: {prizePool} sats
        </p>
      )}
      
      {participants && (
        <p style={{...pStyle, marginTop: '10px'}}>
          {participants} participants
        </p>
      )}
      
      <button 
        style={btnStyle}
        onMouseOver={(e) => e.target.style.background = '#ff5252'}
        onMouseOut={(e) => e.target.style.background = '#ff6b6b'}
      >
        Join Event
      </button>
    </div>
  );
};

export default EventsTab;