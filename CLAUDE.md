# Gantz - Nostr Fitness Social Network

A React web app that serves as a "Facebook for cardio clubs" built on the Nostr protocol.

## Project Overview

Gantz is an MVP web application that connects fitness enthusiasts through the decentralized Nostr network. It focuses on Kind 1301 workout notes and NIP101e teams/events.

## Tech Stack

- **Frontend**: React 18.3.1 + Vite
- **Styling**: Tailwind CSS
- **Nostr**: NDK (Nostr Development Kit)
- **Authentication**: NIP-07 browser extension
- **Storage**: Local storage for caching

## Features

- **Profile Tab**: User profile with workout stats and history
- **Feed Tab**: All Kind 1301 workout notes from the network
- **Events Tab**: NIP101e events (kind 33405) - read-only
- **Teams Tab**: NIP101e teams (kind 33404) - read-only

## Relay Configuration

Default relays:
- wss://relay.damus.io
- wss://nos.lol
- wss://relay.nostr.band

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with network access (for Safari/mobile testing)
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── EventsTab.jsx   # NIP101e events display
│   ├── FeedTab.jsx     # Kind 1301 workout feed
│   ├── Header.jsx      # Navigation header
│   ├── ProfileTab.jsx  # User profile and stats
│   └── TeamsTab.jsx    # NIP101e teams display
├── contexts/
│   └── NostrContext.jsx # Nostr provider with NDK
├── utils/
│   └── storage.js      # Local storage caching
├── App.jsx             # Main app component
└── main.jsx           # React entry point
```

## Nostr Events

- **Kind 0**: User profiles
- **Kind 1301**: Workout/fitness activity records
- **Kind 33404**: NIP101e teams
- **Kind 33405**: NIP101e events

## Caching Strategy

- Profiles: 30 minutes
- Workout feed: 2 minutes  
- User workouts: 5 minutes

## Development Guidelines

### Code Quality
- Use ESLint configuration for consistent code style
- Prefer functional components with hooks over class components
- Use TypeScript types when available (project has @types packages)
- Follow React best practices: proper key props, avoid direct state mutation
- Use Tailwind CSS utility classes consistently

### Component Patterns
- Keep components small and focused on single responsibility
- Use the existing ui/ component pattern for reusable elements
- Leverage the NostrContext for all Nostr operations
- Use proper error boundaries for Nostr network failures

### State Management
- Use React hooks (useState, useEffect, useContext) for local state
- Leverage NostrContext for global Nostr state
- Cache frequently accessed data using utils/storage.js
- Avoid prop drilling - use context when data needs to go deep

## Debugging & Development

### Common Development Commands
```bash
# Run linting to catch issues
npm run lint

# Development with network access (for testing on mobile/other devices)
npm run dev -- --host

# Check bundle size and dependencies
npm run build && ls -la dist/
```

### Browser Extension Requirements
- Requires NIP-07 compatible Nostr browser extension (Alby, nos2x, etc.)
- Test with multiple extensions as behavior can vary
- Handle extension not available gracefully

### Network Debugging
- Use browser dev tools Network tab to monitor relay connections
- Check WebSocket connections to ensure relays are responding
- Monitor console for NDK connection errors

## Error Handling & Troubleshooting

### Common Issues & Solutions

**Issue: "No Nostr extension found"**
- Solution: Install Alby, nos2x, or another NIP-07 extension
- Fallback: Gracefully handle missing extension in UI

**Issue: Events not loading from relays**
- Check relay connectivity in browser network tab
- Verify relay URLs are accessible (some may be down)
- Try different relays in src/contexts/NostrContext.jsx

**Issue: Workout posts not appearing**
- Verify Kind 1301 event structure matches expected format
- Check NDK filters are properly configured
- Ensure user has published events of the correct kind

**Issue: Profile data missing**
- Kind 0 events may be missing or malformed
- Check if user has set up profile in their Nostr client
- Verify profile caching isn't stale

**Issue: Build failures**
- Run `npm run lint` to catch syntax errors
- Check for missing imports or unused variables
- Verify Tailwind classes are valid

### Performance Issues
- Large event lists: Implement virtualization for feeds
- Slow relay responses: Add loading states and timeouts
- Memory leaks: Properly cleanup NDK subscriptions in useEffect

### Security Considerations
- Never log or expose private keys
- Validate all event data before display
- Sanitize user-generated content
- Use HTTPS for all relay connections

## Learning from Mistakes

### Development Patterns to Avoid
- Don't create duplicate Nostr connections - use NostrContext
- Don't forget to handle loading/error states for async operations
- Don't mutate cached data directly - create new objects
- Don't hardcode relay URLs without fallbacks

### NDK User Object Structure
- **Critical**: NDK uses `user.pubkey` NOT `user.hexpubkey` for the hex public key
- Always check the actual object structure when debugging: `console.log('User object:', user)`
- Use fallback pattern: `user.hexpubkey || user.pubkey || user.pk` for compatibility
- NDK user object structure: `_NDKUser { pubkey: '30ce...', hexpubkey: undefined, ... }`

### Profile Loading Issues & Solutions
- **Problem**: Profile not loading due to wrong property access
- **Solution**: Debug with detailed console logging to identify actual object structure
- **Lesson**: Don't assume property names - always verify with actual data
- **Best Practice**: Use defensive programming with fallbacks for different possible property names

### React Development Issues
- **JSX Style Tag**: `<style jsx>` is Next.js specific, not standard React
- **Use CSS-in-JS**: For animations and dynamic styles in standard React
- **Hot Reload**: Changes should reflect immediately with Vite, but hard refresh if needed

### NDK Event Caching Issues
- **Problem**: Circular reference errors when JSON.stringify() NDK events
- **Root Cause**: NDK events contain relay objects with circular references
- **Solution**: Serialize only the essential event data, not the full NDK object
- **Impact**: Error doesn't break functionality but clutters console

### Testing Strategy
- Test with different Nostr extensions (Alby vs nos2x behavior)
- Test with various relay availability scenarios
- Test with users who have no/few events
- Test offline behavior and error states
- **New**: Always test profile loading with both users who have and don't have kind 0 events

### Code Review Checklist
- [ ] Are errors handled gracefully with user feedback?
- [ ] Are loading states shown for async operations?
- [ ] Is the component accessible (keyboard navigation, screen readers)?
- [ ] Are Nostr events validated before processing?
- [ ] Is the change consistent with existing patterns?
- [ ] **New**: Are NDK object properties accessed correctly (use .pubkey not .hexpubkey)?
- [ ] **New**: Are console logs helpful for debugging without being excessive?

## Architecture Decisions

### Why NDK?
- Mature Nostr library with good React support
- Handles relay management and event caching
- Active development and community

### Why Local Storage for Caching?
- Reduces relay load and improves performance
- Works offline for previously loaded data
- Simple implementation for MVP

### Component Structure Rationale
- Tab-based navigation matches mobile-first design
- Separate contexts for different concerns
- ui/ folder for reusable design system components

## Future Improvements

### Potential Features
- Real-time event updates via subscriptions
- Image support for workout posts
- Private messaging between users
- Push notifications for new events

### Technical Debt
- Add comprehensive TypeScript types
- Implement proper error boundaries
- Add unit tests for critical functions
- Optimize bundle size and lazy loading