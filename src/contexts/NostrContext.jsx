import React, { useState, useEffect, useCallback } from 'react';
import NDK, { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
import { NostrContext } from './context';

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

export const NostrProvider = ({ children }) => {
  const [ndk, setNdk] = useState(null);
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize NDK
  useEffect(() => {
    const initNdk = () => {
      const ndkInstance = new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
        enableOutboxModel: false,
      });
      
      setNdk(ndkInstance);
      
      // Connect to relays
      ndkInstance.connect().then(() => {
        console.log('Connected to Nostr relays');
        setConnected(true);
      }).catch(err => {
        console.error('Failed to connect to relays:', err);
      });
    };

    initNdk();
  }, []);

  // Login with browser extension (NIP-07)
  const loginWithExtension = async () => {
    if (!window.nostr) {
      throw new Error('No Nostr extension found. Please install Alby, nos2x, or another Nostr extension.');
    }

    setLoading(true);
    try {
      const pubkey = await window.nostr.getPublicKey();
      
      if (ndk) {
        const ndkUser = new NDKUser({ hexpubkey: pubkey });
        ndk.signer = {
          user: () => Promise.resolve(ndkUser),
          sign: (event) => window.nostr.signEvent(event),
          getPublicKey: () => Promise.resolve(pubkey),
        };
        
        setUser(ndkUser);
        
        // Store login state
        localStorage.setItem('gantz_pubkey', pubkey);
        localStorage.setItem('gantz_login_method', 'extension');
        
        return ndkUser;
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    if (ndk) {
      ndk.signer = undefined;
    }
    localStorage.removeItem('gantz_pubkey');
    localStorage.removeItem('gantz_login_method');
  }, [ndk]);

  // Restore session on reload
  useEffect(() => {
    const restoreSession = async () => {
      const storedPubkey = localStorage.getItem('gantz_pubkey');
      const loginMethod = localStorage.getItem('gantz_login_method');
      
      if (storedPubkey && loginMethod === 'extension' && window.nostr && ndk) {
        try {
          const currentPubkey = await window.nostr.getPublicKey();
          if (currentPubkey === storedPubkey) {
            const ndkUser = new NDKUser({ hexpubkey: storedPubkey });
            ndk.signer = {
              user: () => Promise.resolve(ndkUser),
              sign: (event) => window.nostr.signEvent(event),
              getPublicKey: () => Promise.resolve(storedPubkey),
            };
            setUser(ndkUser);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          logout();
        }
      }
    };

    if (ndk && connected) {
      restoreSession();
    }
  }, [ndk, connected, logout]);

  // Publish event
  const publishEvent = async (eventData) => {
    if (!user || !ndk) {
      throw new Error('Not logged in');
    }

    const event = new NDKEvent(ndk, eventData);
    await event.publish();
    return event;
  };

  // Fetch events
  const fetchEvents = async (filter, opts = {}) => {
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    const events = await ndk.fetchEvents(filter, opts);
    return Array.from(events);
  };

  const value = {
    ndk,
    user,
    connected,
    loading,
    loginWithExtension,
    logout,
    publishEvent,
    fetchEvents,
    isLoggedIn: !!user,
  };

  return (
    <NostrContext.Provider value={value}>
      {children}
    </NostrContext.Provider>
  );
};