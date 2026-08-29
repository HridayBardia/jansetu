export const SHARED_CHANNEL_NAME = 'JANSETU_SHARED_BUS';

export interface BusEventMessage {
  type: string;
  payload: any;
  sender?: string;
  timestamp?: string;
  senderTabId?: string;
  id?: string;
}

const BACKEND_BASE_URL = 
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL) || 
  'http://127.0.0.1:8000';

// Global Singleton BroadcastChannel with FastAPI Cross-Profile / Incognito Relay
class SafeEventBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: MessageEvent<BusEventMessage>) => void> = new Set();
  private myTabId: string = '';
  private lastServerTimeMs: number = Date.now() - 5000;
  private processedEventIds: Set<string> = new Set();
  private pollIntervalId: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        let tabId = sessionStorage.getItem('jansetu_tab_session_id');
        if (!tabId) {
          tabId = 'TAB_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          sessionStorage.setItem('jansetu_tab_session_id', tabId);
        }
        this.myTabId = tabId;
      } catch {
        this.myTabId = 'TAB_' + Date.now();
      }

      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(SHARED_CHANNEL_NAME);
          this.channel.onmessage = (event: MessageEvent<BusEventMessage>) => {
            if (event.data?.id) {
              this.processedEventIds.add(event.data.id);
            }
            this.notifyListeners(event);
          };
        } catch (e) {
          console.warn('[JANSETU BUS] BroadcastChannel initialization fallback:', e);
        }
      }

      // Storage event listener for same-profile tabs
      window.addEventListener('storage', (e) => {
        if (e.key === 'jansetu_bus_trigger' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && (!parsed.senderTabId || parsed.senderTabId !== this.myTabId)) {
              if (parsed.id) this.processedEventIds.add(parsed.id);
              this.notifyListeners(new MessageEvent('message', { data: parsed }));
            }
          } catch {}
        }
      });

      // Start background poll to bridge Incognito / multi-browser environments via FastAPI
      this.startBackendPoll();
    }
  }

  private notifyListeners(event: MessageEvent<BusEventMessage>) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[JANSETU BUS] Listener error:', err);
      }
    });
  }

  private startBackendPoll() {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);

    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/v1/events/poll?since=${this.lastServerTimeMs}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.data) {
          const events = data.data.events || [];
          if (data.data.server_time_ms) {
            this.lastServerTimeMs = data.data.server_time_ms;
          }

          events.forEach((ev: any) => {
            if (ev.id && !this.processedEventIds.has(ev.id) && ev.senderTabId !== this.myTabId) {
              this.processedEventIds.add(ev.id);
              // Dispatch to local listeners
              const msgEvent = new MessageEvent('message', {
                data: {
                  type: ev.type,
                  payload: ev.payload,
                  sender: ev.sender,
                  timestamp: ev.timestamp,
                  id: ev.id,
                  senderTabId: ev.senderTabId
                }
              });
              this.notifyListeners(msgEvent);
            }
          });
        }
      } catch {
        // Backend offline or unreachable; silently continue
      }
    };

    // Run first poll immediately, then every 800ms
    poll();
    this.pollIntervalId = setInterval(poll, 800);
  }

  postMessage(message: BusEventMessage) {
    const eventId = message.id || `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullMessage: BusEventMessage = {
      ...message,
      id: eventId,
      senderTabId: this.myTabId,
      timestamp: message.timestamp || new Date().toISOString()
    };

    this.processedEventIds.add(eventId);
    console.log('[JANSETU BUS] Emitting Message:', fullMessage);

    // 1. Broadcast locally for instant 0ms tab synchronization
    if (this.channel) {
      try {
        this.channel.postMessage(fullMessage);
      } catch (e) {
        console.warn('[JANSETU BUS] Error posting to channel:', e);
      }
    }

    // 2. Storage event fallback for same-profile tabs
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jansetu_bus_trigger', JSON.stringify({
          ...fullMessage,
          _nonce: Math.random().toString(36).substring(2, 9),
          _ts: Date.now()
        }));
      } catch (e) {}
    }

    // 3. Relay through FastAPI Backend for Incognito Mode & Cross-Browser Synchronization
    if (typeof window !== 'undefined') {
      fetch(`${BACKEND_BASE_URL}/api/v1/events/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullMessage)
      }).catch((err) => {
        console.debug('[JANSETU BUS] Backend relay skipped:', err);
      });
    }
  }

  addEventListener(type: string, listener: (event: MessageEvent<BusEventMessage>) => void) {
    this.listeners.add(listener);
    if (this.channel) {
      this.channel.addEventListener(type, listener as EventListener);
    }
  }

  removeEventListener(type: string, listener: (event: MessageEvent<BusEventMessage>) => void) {
    this.listeners.delete(listener);
    if (this.channel) {
      this.channel.removeEventListener(type, listener as EventListener);
    }
  }

  close() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

export const eventBus = new SafeEventBus();
