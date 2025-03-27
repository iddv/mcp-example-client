import { useState, useEffect, useCallback } from 'react';
import { WebSocketClient } from '../api/websocket';
import { MCPStreamChunk, WebSocketConnectionState } from '../types/mcp';

/**
 * Custom hook for using WebSocket connections
 * @param client - WebSocketClient instance
 * @returns WebSocket state and methods
 */
export const useWebSocket = (client: WebSocketClient) => {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    messages: []
  });
  
  const [lastMessage, setLastMessage] = useState<MCPStreamChunk | undefined>(undefined);

  // Handle incoming messages
  const handleMessage = useCallback((message: MCPStreamChunk) => {
    setLastMessage(message);
  }, []);

  // Handle connection state changes
  const handleConnectionState = useCallback((state: WebSocketConnectionState) => {
    setConnectionState(state);
  }, []);

  // Connect to the WebSocket
  const connect = useCallback(() => {
    client.connect();
  }, [client]);

  // Disconnect from the WebSocket
  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  // Send data to the WebSocket
  const send = useCallback((data: any) => {
    client.send(data);
  }, [client]);

  // Set up listeners
  useEffect(() => {
    client.addMessageListener(handleMessage);
    client.addConnectionListener(handleConnectionState);

    return () => {
      client.removeMessageListener(handleMessage);
      client.removeConnectionListener(handleConnectionState);
    };
  }, [client, handleMessage, handleConnectionState]);

  return {
    isConnected: connectionState.connected,
    isConnecting: connectionState.connecting,
    error: connectionState.error,
    messages: connectionState.messages,
    lastMessage,
    connect,
    disconnect,
    send
  };
};

export default useWebSocket; 