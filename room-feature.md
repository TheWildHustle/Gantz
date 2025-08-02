# Gantz Room Feature Documentation

## Overview
The Gantz Room feature transforms the app into a competitive fitness challenge system inspired by the Gantz manga/anime. Users are randomly selected into rooms of 4 participants to compete in timed fitness challenges with progressive difficulty levels.

## Core Concept
- **Room Formation**: Every X minutes, 4 random npubs from the 1301 feed are selected for a "room"
- **Challenge Progression**: 10 levels of increasing difficulty over 24-hour periods
- **Verification**: Results verified through 1301 workout note submissions
- **Elimination**: Users who don't complete challenges are eliminated; successful participants advance

## Phased Implementation

### Phase 1: Basic Room Navigation & User Selection ✅
- Replace "Events" tab with "Room" tab in navigation
- Create RoomTab component that displays 4 randomly selected users
- User selection algorithm pulls from existing 1301 feed data
- Basic UI shows selected participants with avatars/names

### Phase 2: Countdown Timer System
- **Header Timer**: Display "Room: 8:53" next to Room navigation (room formation countdown)
- **In-Room Timer**: Additional countdown timer displayed at top of room page (challenge start countdown)
- Auto-advance through room states when timers reach zero
- Two sequential phases: room formation → challenge preparation

### Phase 3: Challenge System
- Text-based challenges with 10 difficulty levels
- 24-hour completion windows for each challenge
- Progressive difficulty from basic exercises to extreme combinations
- Challenge display component shows current level requirements

### Phase 4: Results & Verification
- User submission system for challenge completion/elimination
- Verification via analysis of user's recent 1301 workout notes
- Automatic advancement/elimination logic
- Nostr event publishing for Gantz participation tracking

### Phase 5: Polish & Enhancement
- Gantz-inspired dark UI with red accents
- Sound effects for timers and notifications
- Improved verification algorithms
- State persistence across sessions

### Phase 6: HiveTalk Integration (Future)
- Voice/video chat during social phases
- Pre-challenge team coordination
- Real-time communication during waiting periods

## Challenge Level Structure

```
Level 1: "20 pushups + 2km walk" (24hr window)
Level 2: "30 pushups + 3km walk" (24hr window)
Level 3: "40 pushups + 2km run" (24hr window)
Level 4: "50 pushups + 3km run" (24hr window)
Level 5: "75 pushups + 5km run" (24hr window)
Level 6: "100 pushups + 5km run + 50 situps" (24hr window)
Level 7: "150 pushups + 7km run + 75 situps" (24hr window)
Level 8: "200 pushups + 10km run + 100 situps" (24hr window)
Level 9: "250 pushups + 12km run + 150 situps + 2km cycling" (24hr window)
Level 10: "300 pushups + 15km run + 200 situps + 10km cycling" (24hr window)
```

## Technical Architecture

### Components
- **RoomTab.jsx**: Main room interface component
- **TimerComponent.jsx**: Reusable countdown timer component
- **ChallengeDisplay.jsx**: Challenge information and requirements display
- **UserGrid.jsx**: 4-participant display grid
- **ResultsSubmission.jsx**: Challenge completion/elimination interface

### Data Flow
1. **User Pool**: Extract active users from 1301 feed data
2. **Room Formation**: Random selection algorithm creates 4-person groups
3. **Challenge Assignment**: Progressive level system assigns appropriate difficulty
4. **Verification**: Analyze 1301 notes for completion evidence
5. **State Management**: Track room status, participants, and progression

### Room States
- **WAITING**: Countdown to next room formation
- **FORMING**: Selecting participants and displaying room
- **SOCIAL**: Pre-challenge preparation period (future: HiveTalk integration)
- **CHALLENGE**: Active 24-hour challenge period
- **VERIFICATION**: Checking submissions and determining advancement
- **RESULTS**: Displaying outcomes and preparing next round

### Timer System
- **Formation Timer**: Displayed in header as "Room: MM:SS"
- **Challenge Timer**: Displayed in room for challenge start countdown
- **Active Challenge Timer**: 24-hour countdown for challenge completion
- **Verification Window**: Time limit for result submissions

### Verification Logic
- Parse user's recent 1301 workout notes (last 24-48 hours)
- Extract exercise types, durations, distances from workout data
- Match against current challenge requirements
- Honor system with peer validation potential
- Flag suspicious or incomplete submissions

### Data Storage
- **Room State**: Current participants, level, timers
- **User Progress**: Challenge history, completion rates, current level
- **Challenge History**: Past rooms, results, advancement records
- **Verification Cache**: Recent 1301 analysis results

## User Experience Flow

1. **Navigation**: User clicks "Room" tab, sees "Room: 8:53" countdown in header
2. **Room Formation**: When timer hits 0, 4 users are selected and displayed
3. **Preparation**: In-room timer counts down to challenge start
4. **Challenge**: Text description appears with 24-hour completion requirement
5. **Submission**: Users mark completion/elimination via interface
6. **Verification**: System checks 1301 notes for evidence
7. **Advancement**: Successful participants move to next level
8. **New Room**: Process repeats with survivors + new participants

## Future Enhancements
- Real-time chat/voice integration via HiveTalk
- Photo/video submission for challenge proof
- Team challenges and collaborative modes
- Leaderboards and achievement systems
- Integration with fitness trackers and wearables
- Spectator mode for eliminated participants
- Tournament brackets and seasonal competitions

## Technical Requirements
- React 18.3+ with hooks for state management
- NDK for Nostr event handling and publishing
- Local storage for room state persistence
- Timer management with cleanup and resumption
- 1301 note parsing and analysis utilities
- Random selection algorithms with fairness controls