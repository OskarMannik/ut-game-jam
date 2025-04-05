export class NetworkManager {
  constructor(url, game) {
    this.url = url;
    this.ws = null;
    this.clientId = null; // Will be assigned by the server on connection
    this.game = game; // Reference to the main game instance to dispatch events/updates
  }

  connect() {
    console.log(`Attempting to connect to WebSocket server at ${this.url}...`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connection established.');
      // Server should send back a client ID upon connection
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // console.log('Received message:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message or handle incoming data:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      this.ws = null;
      this.clientId = null;
      // Optionally notify the game or attempt to reconnect
      if (this.game && typeof this.game.handleDisconnect === 'function') {
         this.game.handleDisconnect();
      }
    };
  }

  handleMessage(message) {
    if (!message.type) {
      console.warn('Received message without type:', message);
      return;
    }

    // Basic message routing
    switch (message.type) {
      case 'assignId':
        this.clientId = message.payload.id;
        console.log(`Assigned Client ID: ${this.clientId}`);
        if (this.game && typeof this.game.setClientId === 'function') {
            this.game.setClientId(this.clientId);
        }
        break;
      case 'worldState': // Initial state or full update
        if (this.game && typeof this.game.handleWorldState === 'function') {
          this.game.handleWorldState(message.payload.players);
        }
        break;
      case 'playerJoined':
        if (this.clientId && message.payload.id !== this.clientId && this.game && typeof this.game.handlePlayerJoined === 'function') {
           this.game.handlePlayerJoined(message.payload);
        }
        break;
      case 'playerLeft':
         if (this.clientId && message.payload.id !== this.clientId && this.game && typeof this.game.handlePlayerLeft === 'function') {
           this.game.handlePlayerLeft(message.payload.id);
        }
        break;
      case 'playerUpdate':
         if (this.clientId && message.payload.id !== this.clientId && this.game && typeof this.game.handlePlayerUpdate === 'function') {
            this.game.handlePlayerUpdate(message.payload.id, message.payload.state);
         }
        break;
      default:
        console.log(`Unhandled message type: ${message.type}`);
    }
  }

  send(type, payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // console.warn('WebSocket not open. Cannot send message.');
      return;
    }

    try {
      const message = JSON.stringify({ type, payload });
      this.ws.send(message);
    } catch (error) {
      console.error('Failed to stringify or send message:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      console.log('Disconnecting WebSocket...');
      this.ws.close();
    }
  }
} 