import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { WebSocketConnectionState, ParsedCommand } from '../../types/mcp';

const StreamWrapper = styled.div`
  margin-bottom: 1rem;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
`;

const StreamHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const StreamTitle = styled.div`
  display: flex;
  align-items: center;
`;

const StreamingIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4A6FFF;
  margin-right: 0.5rem;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
`;

const StopButton = styled.button`
  background-color: #DC3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  
  &:hover {
    background-color: #c82333;
  }
`;

const StreamContent = styled.div`
  background-color: #252526;
  border-radius: 4px;
  padding: 0.75rem;
  color: #e9e9e9;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ConnectingMessage = styled.div`
  color: #aaa;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
`;

const StreamChunk = styled.div<{ isComplete: boolean; isError: boolean }>`
  padding: 0.25rem 0;
  color: ${(props) => {
    if (props.isError) return '#ff6b6b';
    if (props.isComplete) return '#28A745';
    return '#e9e9e9';
  }};
`;

interface StreamDisplayProps {
  wsState: WebSocketConnectionState;
  command: any;
  onStop: () => void;
}

const StreamDisplay: React.FC<StreamDisplayProps> = ({
  wsState,
  command,
  onStop,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [wsState.messages]);

  // Format the command title
  const formatCommandTitle = () => {
    if (!command) return 'Streaming...';
    
    const name = command.functionName || 'unknown';
    const type = command.type === 'stream_function' ? 'function' : 'tool';
    
    return `Streaming ${type}: ${name}`;
  };

  // Render the content based on connection state
  const renderContent = () => {
    if (wsState.error) {
      return <ErrorMessage>Error: {wsState.error}</ErrorMessage>;
    }
    
    if (wsState.connecting) {
      return <ConnectingMessage>Connecting to stream...</ConnectingMessage>;
    }
    
    if (!wsState.connected) {
      return <ConnectingMessage>Waiting for connection...</ConnectingMessage>;
    }
    
    if (wsState.messages.length === 0) {
      return <ConnectingMessage>Waiting for data...</ConnectingMessage>;
    }
    
    return (
      <>
        {wsState.messages.map((message, index) => (
          <StreamChunk
            key={message.id || index}
            isComplete={message.status === 'complete'}
            isError={message.status === 'error'}
          >
            {message.status === 'error' && (
              <div>Error: {message.error?.message || 'Unknown error'}</div>
            )}
            {message.result !== undefined && (
              <pre>{JSON.stringify(message.result, null, 2)}</pre>
            )}
          </StreamChunk>
        ))}
      </>
    );
  };

  return (
    <StreamWrapper>
      <StreamHeader>
        <StreamTitle>
          <StreamingIndicator />
          {formatCommandTitle()}
        </StreamTitle>
        
        <StopButton onClick={onStop} title="Stop streaming">
          Stop
        </StopButton>
      </StreamHeader>
      
      <StreamContent ref={contentRef}>
        {renderContent()}
      </StreamContent>
    </StreamWrapper>
  );
};

export default StreamDisplay; 