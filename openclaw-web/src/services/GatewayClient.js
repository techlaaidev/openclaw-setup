/**
 * Gateway Client Service
 * WebSocket client for communicating with OpenClaw gateway
 */

import WebSocket from 'ws';
import EventEmitter from 'events';

export class GatewayClient extends EventEmitter {
  constructor(port = 18789, host = 'localhost') {
    super();
    this.port = port;
    this.host = host;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.messageQueue = [];
  }

  /**
   * Connect to gateway
   */
  connect() {
    return new Promise((resolve, reject) => {
      const url = `ws://${this.host}:${this.port}`;

      try {
        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log(`[Gateway] Connected to ${url}`);

          // Send queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.ws.send(JSON.stringify(msg));
          }

          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.emit('message', message);

            // Emit specific event types
            if (message.type) {
              this.emit(message.type, message.data);
            }
          } catch (error) {
            console.error('[Gateway] Failed to parse message:', error);
          }
        });

        this.ws.on('error', (error) => {
          console.error('[Gateway] WebSocket error:', error);
          this.emit('error', error);
        });

        this.ws.on('close', () => {
          this.connected = false;
          console.log('[Gateway] Connection closed');
          this.emit('disconnected');

          // Auto-reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[Gateway] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay);
          }
        });

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from gateway
   */
  disconnect() {
    if (this.ws) {
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Send message to gateway
   */
  send(type, data) {
    const message = { type, data, timestamp: Date.now() };

    if (!this.connected || !this.ws) {
      // Queue message for later
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[Gateway] Failed to send message:', error);
      this.messageQueue.push(message);
      return false;
    }
  }

  /**
   * Send chat message
   */
  sendChatMessage(channelId, content) {
    return this.send('chat.message', {
      channelId,
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Get channel list
   */
  getChannels() {
    return this.send('channels.list', {});
  }

  /**
   * Get provider list
   */
  getProviders() {
    return this.send('providers.list', {});
  }

  /**
   * Reload skills
   */
  reloadSkills() {
    return this.send('skills.reload', {});
  }

  /**
   * Get gateway status
   */
  getStatus() {
    return this.send('status.get', {});
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Wait for specific message type
   */
  waitForMessage(type, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(type, handler);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);

      const handler = (data) => {
        clearTimeout(timer);
        this.off(type, handler);
        resolve(data);
      };

      this.once(type, handler);
    });
  }
}

// Singleton instance
let instance = null;

export function getGatewayClient(port = 18789, host = 'localhost') {
  if (!instance) {
    instance = new GatewayClient(port, host);
  }
  return instance;
}

export default GatewayClient;
