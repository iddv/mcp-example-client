import React, { useState } from 'react';
import styled from 'styled-components';
import { ProtocolStep } from '../../types/mcp';
import { useApp } from '../../context/AppContext';

const VisualizerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  color: #f0f0f0;
  border-left: 1px solid #333;
  width: 300px;
  overflow: hidden;
`;

const VisualizerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #252526;
  border-bottom: 1px solid #333;
`;

const VisualizerTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #e9e9e9;
`;

const VisualizerControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ControlButton = styled.button`
  background-color: transparent;
  border: none;
  color: #cccccc;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;

  &:hover {
    background-color: #3a3a3a;
  }
`;

const TimelineContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  position: relative;
`;

const Timeline = styled.div`
  position: relative;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 2px solid #333;
`;

const TimelineItem = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  
  &:before {
    content: '';
    position: absolute;
    left: -1.125rem;
    top: 0.25rem;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background-color: #4A6FFF;
  }
`;

const TimelineItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const EndpointLabel = styled.div<{ method?: string }>`
  font-weight: bold;
  color: ${props => {
    if (props.method === 'GET') return '#28A745';
    if (props.method === 'POST') return '#FFC107';
    return '#4A6FFF';
  }};
  font-size: 0.9rem;
`;

const TimestampLabel = styled.div`
  font-size: 0.8rem;
  color: #888;
`;

const TimelineItemContent = styled.div<{ isExpanded: boolean }>`
  background-color: #252526;
  border-radius: 4px;
  padding: ${props => props.isExpanded ? '0.75rem' : '0'};
  overflow: hidden;
  max-height: ${props => props.isExpanded ? '500px' : '0'};
  transition: max-height 0.3s ease, padding 0.3s ease;
`;

const TypeBadge = styled.span<{ type: string }>`
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-right: 0.5rem;
  background-color: ${props => {
    switch (props.type) {
      case 'request':
        return '#2a3367';
      case 'response':
        return '#2d5836';
      case 'websocket':
        return '#614a00';
      case 'error':
        return '#5e2626';
      default:
        return '#333';
    }
  }};
  color: white;
`;

const DurationBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  background-color: #333;
  color: #aaa;
`;

const JsonViewer = styled.pre`
  margin: 0;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #e9e9e9;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 1rem;
`;

const ToggleExpandButton = styled.button`
  background-color: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  
  &:hover {
    color: #e9e9e9;
  }
`;

const CollapseButton = styled.button<{ isCollapsed: boolean }>`
  position: absolute;
  top: 0.5rem;
  left: ${props => props.isCollapsed ? 'auto' : '0.5rem'};
  right: ${props => props.isCollapsed ? '0.5rem' : 'auto'};
  background-color: transparent;
  border: none;
  color: #aaa;
  font-size: 1rem;
  cursor: pointer;
  z-index: 10;
  padding: 0.25rem;
  
  &:hover {
    color: #e9e9e9;
  }
`;

const CollapsedVisualizer = styled.div`
  width: 30px;
  background-color: #1e1e1e;
  border-left: 1px solid #333;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2rem;
`;

const ExpandButton = styled.button`
  background-color: transparent;
  border: none;
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 0.5rem;
  padding: 0.25rem;
  
  &:hover {
    color: #e9e9e9;
  }
`;

const ProtocolVisualizer: React.FC = () => {
  const { state, dispatch } = useApp();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * Toggle the expanded state of a timeline item
   * @param id - The ID of the item to toggle
   */
  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  /**
   * Format a timestamp for display
   * @param timestamp - The ISO timestamp string
   * @returns Formatted time string
   */
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  /**
   * Format a duration for display
   * @param duration - The duration in milliseconds
   * @returns Formatted duration string
   */
  const formatDuration = (duration?: number): string => {
    if (!duration) return '';
    
    if (duration < 1000) {
      return `${duration}ms`;
    }
    
    return `${(duration / 1000).toFixed(2)}s`;
  };

  /**
   * Format the HTTP method for display
   * @param method - The HTTP method
   * @returns Formatted method string
   */
  const formatMethod = (method?: string): string => {
    return method ? method : '';
  };

  /**
   * Handle clearing the protocol steps
   */
  const handleClearProtocol = () => {
    dispatch({ type: 'CLEAR_PROTOCOL_STEPS' });
  };

  // If visualizer is collapsed, show a minimal version
  if (isCollapsed) {
    return (
      <CollapsedVisualizer>
        <ExpandButton
          onClick={() => setIsCollapsed(false)}
          title="Expand protocol visualizer"
        >
          &#8249;
        </ExpandButton>
      </CollapsedVisualizer>
    );
  }

  return (
    <VisualizerContainer>
      <VisualizerHeader>
        <VisualizerTitle>Protocol Visualizer</VisualizerTitle>
        <VisualizerControls>
          <ControlButton onClick={handleClearProtocol} title="Clear protocol steps">
            Clear
          </ControlButton>
          <CollapseButton 
            isCollapsed={isCollapsed}
            onClick={() => setIsCollapsed(true)}
            title="Collapse visualizer"
          >
            &#8250;
          </CollapseButton>
        </VisualizerControls>
      </VisualizerHeader>

      <TimelineContainer>
        {state.protocol.length === 0 ? (
          <EmptyState>
            <div>No protocol steps yet</div>
            <div>Execute a command to see the protocol flow</div>
          </EmptyState>
        ) : (
          <Timeline>
            {state.protocol.map(step => (
              <TimelineItem key={step.id}>
                <TimelineItemHeader>
                  <div>
                    <TypeBadge type={step.type}>{step.type}</TypeBadge>
                    <EndpointLabel method={step.method}>
                      {formatMethod(step.method)} {step.endpoint}
                    </EndpointLabel>
                  </div>
                  <div>
                    {step.duration && (
                      <DurationBadge>{formatDuration(step.duration)}</DurationBadge>
                    )}
                    <ToggleExpandButton 
                      onClick={() => toggleItemExpanded(step.id)}
                      title={expandedItems[step.id] ? 'Collapse' : 'Expand'}
                    >
                      {expandedItems[step.id] ? '▲' : '▼'}
                    </ToggleExpandButton>
                  </div>
                </TimelineItemHeader>
                <TimestampLabel>{formatTimestamp(step.timestamp)}</TimestampLabel>
                <TimelineItemContent isExpanded={!!expandedItems[step.id]}>
                  {step.data && (
                    <JsonViewer>{JSON.stringify(step.data, null, 2)}</JsonViewer>
                  )}
                </TimelineItemContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </TimelineContainer>
    </VisualizerContainer>
  );
};

export default ProtocolVisualizer; 