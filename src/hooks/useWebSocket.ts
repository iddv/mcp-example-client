import { useState, useEffect, useRef, useCallback } from 'react';
import { MCPStreamChunk, WebSocketConnectionState } from '../types/mcp';

/**
 * Custom hook for WebSocket connections
 * @param url - The WebSocket URL to connect to
 * @param autoConnect - Whether to automatically connect on mount
 * @param authToken - Optional auth token for WebSocket authentication
 * @returns WebSocket connection state and control functions
 */
export const useWebSocket = (
  url: string,
  autoConnect: boolean = true,
  authToken?: string
): [WebSocketConnectionState, (data: any) => void, () => void, () => void] => {
  const [state, setState] = useState<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    messages: [],
  });
  
  const socket = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  /**
   * Connect to the WebSocket server
   */
  const connect = useCallback(() => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({ ...prev, connecting: true }));

    try {
      const fullUrl = authToken ? `${url}?token=${authToken}` : url;
      socket.current = new WebSocket(fullUrl);

      // Connection opened
      socket.current.addEventListener('open', () => {
        setState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          error: undefined,
        }));
        reconnectAttemptsRef.current = 0;
      });

      // Listen for messages
      socket.current.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data) as MCPStreamChunk;
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, message],
            lastMessage: message,
          }));
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      });

      // Connection closed
      socket.current.addEventListener('close', (event) => {
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: event.wasClean ? undefined : 'Connection closed unexpectedly',
        }));
        
        // Try to reconnect if not a clean close
        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            30000, // 30 seconds max
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
          );
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        }
      });

      // Connection error
      socket.current.addEventListener('error', (error) => {
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: 'WebSocket connection error',
        }));
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        error: 'Failed to create WebSocket connection',
      }));
    }
  }, [url, authToken]);

  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
    
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
    }));
  }, []);

  /**
   * Send data through the WebSocket connection
   * @param data - The data to send
   */
  const sendMessage = useCallback((data: any) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(data));
    } else {
      setState((prev) => ({
        ...prev,
        error: 'Cannot send message: WebSocket is not connected',
      }));
    }
  }, []);

  /**
   * Clear all messages in the state
   */
  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      lastMessage: undefined,
    }));
  }, []);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  // Reconnect if URL or authToken changes
  useEffect(() => {
    if (state.connected) {
      disconnect();
      connect();
    }
  }, [url, authToken, connect, disconnect, state.connected]);

  return [state, sendMessage, connect, clearMessages];
};

export default useWebSocket; 