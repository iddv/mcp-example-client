import React, { useState } from 'react';
import styled from 'styled-components';
import { CommandHistoryItem } from '../../types/mcp';

const ResponseWrapper = styled.div`
  margin-bottom: 1rem;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
`;

const CommandLine = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Prompt = styled.span`
  color: #4A6FFF;
  font-weight: bold;
  margin-right: 0.5rem;
`;

const Command = styled.span`
  color: #e9e9e9;
`;

const Timestamp = styled.span`
  color: #888;
  font-size: 0.8rem;
  margin-left: 0.5rem;
`;

const ResponseContent = styled.div<{ hasError: boolean }>`
  background-color: ${(props) => (props.hasError ? '#3a1c1c' : '#252526')};
  border-radius: 4px;
  padding: 0.75rem;
  color: ${(props) => (props.hasError ? '#ff9c9c' : '#e9e9e9')};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Controls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ControlButton = styled.button`
  background-color: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem;
  border-radius: 4px;

  &:hover {
    background-color: #333;
    color: #e9e9e9;
  }
`;

const FavoriteButton = styled(ControlButton)<{ isFavorite: boolean }>`
  color: ${(props) => (props.isFavorite ? '#FFC107' : '#aaa')};
`;

const MessageText = styled.div`
  color: #aaa;
  font-style: italic;
`;

const ErrorText = styled.div`
  color: #ff6b6b;
`;

interface ResponseDisplayProps {
  historyItem: CommandHistoryItem;
  onToggleFavorite: () => void;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  historyItem,
  onToggleFavorite,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { command, response, timestamp, favorite } = historyItem;
  
  // Format timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString();
  
  // Determine if there's an error
  const hasError = response && response.error;
  
  // Format the response content
  const formatResponseContent = () => {
    if (!response) return <MessageText>No response</MessageText>;
    
    if (response.streaming) {
      return <MessageText>{response.message}</MessageText>;
    }
    
    if (response.message) {
      return <MessageText>{response.message}</MessageText>;
    }
    
    if (hasError) {
      return <ErrorText>{response.error}</ErrorText>;
    }
    
    if (response.functions) {
      // Format functions list
      return (
        <div>
          <div>Available functions:</div>
          {response.functions.map((func: any) => (
            <div key={func.name} style={{ marginTop: '0.5rem' }}>
              - <strong>{func.name}</strong>: {func.description}
            </div>
          ))}
        </div>
      );
    }
    
    if (response.function) {
      // Format function details
      const func = response.function;
      return (
        <div>
          <div>
            <strong>Name:</strong> {func.name}
          </div>
          <div>
            <strong>Description:</strong> {func.description}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <strong>Parameters:</strong>
          </div>
          <div style={{ marginLeft: '1rem' }}>
            {JSON.stringify(func.parameters, null, 2)}
          </div>
        </div>
      );
    }
    
    // Format other responses as JSON
    return <pre>{JSON.stringify(response, null, 2)}</pre>;
  };

  return (
    <ResponseWrapper>
      <CommandLine>
        <Prompt>&gt;</Prompt>
        <Command>{command}</Command>
        <Timestamp>{formattedTime}</Timestamp>
      </CommandLine>
      
      {isExpanded && (
        <ResponseContent hasError={hasError}>
          {formatResponseContent()}
        </ResponseContent>
      )}
      
      <Controls>
        <FavoriteButton
          isFavorite={favorite}
          onClick={onToggleFavorite}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorite ? '★' : '☆'}
        </FavoriteButton>
        
        <ControlButton
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▲' : '▼'}
        </ControlButton>
        
        <ControlButton
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(response, null, 2));
          }}
          title="Copy response"
        >
          Copy
        </ControlButton>
      </Controls>
    </ResponseWrapper>
  );
};

export default ResponseDisplay; 