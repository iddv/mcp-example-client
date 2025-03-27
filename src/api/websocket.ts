import { MCPStreamChunk, WebSocketConnectionState, WebSocketMessage } from '../types/mcp';
import apiClient from './client';

/**
 * WebSocketClient for streaming connections to the MCP server
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private apiKey: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private messageListeners: ((message: MCPStreamChunk) => void)[] = [];
  private connectionListeners: ((state: WebSocketConnectionState) => void)[] = [];
  private connectionState: WebSocketConnectionState = {
    connected: false,
    connecting: false,
    messages: []
  };

  /**
   * Create a new WebSocket client
   * @param url - WebSocket URL
   * @param apiKey - API key for authentication
   */
  constructor(url?: string, apiKey?: string) {
    // Get connection settings from API client if not provided
    const settings = apiClient.getConnectionSettings();
    this.url = url || '';
    this.apiKey = apiKey || settings.apiKey;
  }

  /**
   * Update the WebSocket configuration
   * @param url - New WebSocket URL
   * @param apiKey - New API key
   */
  public updateConfig(url?: string, apiKey?: string): void {
    if (url) {
      this.url = url;
    }
    
    if (apiKey) {
      this.apiKey = apiKey;
    }

    // Reconnect if already connected
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Check if the WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.isConnected() || this.connectionState.connecting) {
      return;
    }

    this.updateConnectionState({
      connecting: true,
      error: undefined
    });

    try {
      // Add API key as query parameter
      const wsUrl = new URL(this.url);
      wsUrl.searchParams.append('api_key', this.apiKey);
      
      this.socket = new WebSocket(wsUrl.toString());
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateConnectionState({
        connecting: false,
        error: errorMessage
      });
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
    this.updateConnectionState({
      connected: false,
      connecting: false
    });
  }

  /**
   * Send a message to the WebSocket server
   * @param data - Data to send
   */
  public send(data: any): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket is not connected');
    }
    
    this.socket!.send(JSON.stringify(data));
  }

  /**
   * Add a message listener
   * @param listener - Function to call when a message is received
   */
  public addMessageListener(listener: (message: MCPStreamChunk) => void): void {
    this.messageListeners.push(listener);
  }

  /**
   * Remove a message listener
   * @param listener - Listener to remove
   */
  public removeMessageListener(listener: (message: MCPStreamChunk) => void): void {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  /**
   * Add a connection state listener
   * @param listener - Function to call when connection state changes
   */
  public addConnectionListener(listener: (state: WebSocketConnectionState) => void): void {
    this.connectionListeners.push(listener);
    // Call immediately with current state
    listener(this.connectionState);
  }

  /**
   * Remove a connection state listener
   * @param listener - Listener to remove
   */
  public removeConnectionListener(listener: (state: WebSocketConnectionState) => void): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.updateConnectionState({
      connected: true,
      connecting: false,
      error: undefined
    });
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as MCPStreamChunk;
      
      // Update connection state with new message
      const messages = [...this.connectionState.messages, data];
      this.updateConnectionState({
        lastMessage: data,
        messages
      });
      
      // Notify listeners
      this.messageListeners.forEach(listener => listener(data));
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.socket = null;
    
    this.updateConnectionState({
      connected: false,
      connecting: false
    });
    
    // Attempt to reconnect if not closed cleanly
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      this.reconnectTimeout = window.setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    const errorMessage = 'WebSocket error occurred';
    
    this.updateConnectionState({
      error: errorMessage
    });
    
    console.error('WebSocket error:', event);
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(update: Partial<WebSocketConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...update
    };
    
    // Notify listeners
    this.connectionListeners.forEach(listener => listener(this.connectionState));
  }
}

// Create clients for function and tool streaming
export const functionStreamClient = new WebSocketClient(apiClient.getFunctionStreamUrl());
export const toolStreamClient = new WebSocketClient(apiClient.getToolStreamUrl());

export default {
  functionStreamClient,
  toolStreamClient
}; 