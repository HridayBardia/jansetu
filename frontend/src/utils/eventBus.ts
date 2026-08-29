export const SHARED_CHANNEL_NAME = 'JANSETU_SHARED_BUS';

export interface BusEventMessage {
  type: string;
  payload: any;
  sender?: string;
  timestamp?: string;
}

// Global Singleton BroadcastChannel with fallback
class SafeEventBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: MessageEvent<BusEventMessage>) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(SHARED_CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<BusEventMessage>) => {
          this.listeners.forEach((listener) => {
            try {
              listener(event);
            } catch (err) {
              console.error('[JANSETU BUS] Listener error:', err);
            }
          });
        };
      } catch (e) {
        console.warn('[JANSETU BUS] BroadcastChannel initialization fallback:', e);
      }
    }
  }

  postMessage(message: BusEventMessage) {
    console.log('[JANSETU BUS] Emitting Message:', message);
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {
        console.warn('[JANSETU BUS] Error posting message:', e);
      }
    }

    // Fallback: storage trigger with nonce to ensure all tabs receive the event
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jansetu_bus_trigger', JSON.stringify({
          ...message,
          _nonce: Math.random().toString(36).substring(2, 9),
          _ts: Date.now()
        }));
      } catch (e) {}
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
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

export const eventBus = new SafeEventBus();
