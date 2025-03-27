import React from 'react';
import styled from 'styled-components';
import { ProtocolStep } from '../../types/mcp';

// Styled Components
const DetailsContainer = styled.div`
  background-color: #2d2d2d;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 0.5rem;
  border-left: 3px solid transparent;
  border-left-color: ${props => props.color || '#4A6FFF'};
`;

const DetailSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  color: #aaa;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const EndpointInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MethodBadge = styled.span<{ method?: string }>`
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  width: fit-content;
  background-color: ${props => {
    if (props.method === 'GET') return '#28A74522';
    if (props.method === 'POST') return '#FFC10722';
    if (props.method === 'PUT') return '#4A6FFF22';
    if (props.method === 'DELETE') return '#DC354522';
    return '#6C757D22';
  }};
  color: ${props => {
    if (props.method === 'GET') return '#28A745';
    if (props.method === 'POST') return '#FFC107';
    if (props.method === 'PUT') return '#4A6FFF';
    if (props.method === 'DELETE') return '#DC3545';
    return '#6C757D';
  }};
`;

const EndpointUrl = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
  color: #e9e9e9;
`;

const StatusInfo = styled.div<{ status?: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusCircle = styled.div<{ status?: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'success':
        return '#28A745';
      case 'warning':
        return '#FFC107';
      case 'error':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  }};
`;

const StatusText = styled.div<{ status?: string }>`
  font-size: 0.8rem;
  color: ${props => {
    switch (props.status) {
      case 'success':
        return '#28A745';
      case 'warning':
        return '#FFC107';
      case 'error':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  }};
`;

const TimingInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  font-size: 0.8rem;
`;

const TimingItem = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #252526;
  padding: 0.5rem;
  border-radius: 3px;
`;

const TimingLabel = styled.div`
  color: #aaa;
  font-size: 0.7rem;
  margin-bottom: 0.25rem;
`;

const TimingValue = styled.div`
  color: #e9e9e9;
  font-weight: bold;
`;

// Function to determine if the protocol step has an error
const hasError = (step: ProtocolStep): boolean => {
  if (step.type === 'error') return true;
  if (step.data?.error) return true;
  if (step.data?.response?.error) return true;
  return false;
};

// Function to determine step status
const getStepStatus = (step: ProtocolStep): 'success' | 'warning' | 'error' | 'info' => {
  if (hasError(step)) return 'error';
  if (step.duration && step.duration > 1000) return 'warning';
  if (step.type === 'response' || step.type === 'websocket') return 'success';
  return 'info';
};

// Function to get color based on step type and status
const getStepColor = (step: ProtocolStep): string => {
  const status = getStepStatus(step);
  
  switch (status) {
    case 'success':
      return '#28A745';
    case 'warning':
      return '#FFC107';
    case 'error':
      return '#DC3545';
    default:
      return step.type === 'request' ? '#4A6FFF' : '#6C757D';
  }
};

// Function to format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Function to format duration
const formatDuration = (duration?: number): string => {
  if (!duration) return 'N/A';
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
};

interface ProtocolStepDetailsProps {
  step: ProtocolStep;
}

const ProtocolStepDetails: React.FC<ProtocolStepDetailsProps> = ({ step }) => {
  const stepColor = getStepColor(step);
  const stepStatus = getStepStatus(step);
  
  // Extract request timestamp if available (for calculating total time)
  let requestTimestamp = step.timestamp;
  if (step.type === 'response' && step.data?.request?.timestamp) {
    requestTimestamp = step.data.request.timestamp;
  }
  
  // Calculate total time if both request and response timestamps are available
  const totalTime = step.type === 'response' && requestTimestamp
    ? new Date(step.timestamp).getTime() - new Date(requestTimestamp).getTime()
    : undefined;
  
  return (
    <DetailsContainer color={stepColor}>
      <DetailSection>
        <SectionTitle>Endpoint</SectionTitle>
        <EndpointInfo>
          <MethodBadge method={step.method}>{step.method || '-'}</MethodBadge>
          <EndpointUrl>{step.endpoint}</EndpointUrl>
        </EndpointInfo>
      </DetailSection>
      
      <DetailSection>
        <SectionTitle>Status</SectionTitle>
        <StatusInfo status={stepStatus}>
          <StatusCircle status={stepStatus} />
          <StatusText status={stepStatus}>
            {stepStatus === 'success' ? 'Successful' : 
              stepStatus === 'warning' ? 'Slow Response' :
              stepStatus === 'error' ? 'Error' : 'Pending'}
          </StatusText>
        </StatusInfo>
      </DetailSection>
      
      <DetailSection>
        <SectionTitle>Timing</SectionTitle>
        <TimingInfo>
          <TimingItem>
            <TimingLabel>Timestamp</TimingLabel>
            <TimingValue>{formatTimestamp(step.timestamp)}</TimingValue>
          </TimingItem>
          
          <TimingItem>
            <TimingLabel>Duration</TimingLabel>
            <TimingValue>{formatDuration(step.duration)}</TimingValue>
          </TimingItem>
          
          {step.type === 'response' && totalTime && (
            <TimingItem>
              <TimingLabel>Total Time</TimingLabel>
              <TimingValue>{formatDuration(totalTime)}</TimingValue>
            </TimingItem>
          )}
        </TimingInfo>
      </DetailSection>
    </DetailsContainer>
  );
};

export default ProtocolStepDetails; 