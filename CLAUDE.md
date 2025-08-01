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