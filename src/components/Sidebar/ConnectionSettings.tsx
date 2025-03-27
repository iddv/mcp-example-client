import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useApp } from '../../context/AppContext';

const SettingsContainer = styled.div`
  padding: 1rem;
  background-color: #252526;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: #e9e9e9;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #cccccc;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  background-color: #1e1e1e;
  color: #e9e9e9;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4A6FFF;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Button = styled.button`
  background-color: #4A6FFF;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  
  &:hover:not(:disabled) {
    background-color: #3a5fd9;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResetButton = styled(Button)`
  background-color: #6C757D;
  
  &:hover:not(:disabled) {
    background-color: #5a6268;
  }
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #1e1e1e;
`;

const StatusIndicator = styled.div<{ connected: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => (props.connected ? '#28A745' : '#DC3545')};
  margin-right: 0.5rem;
`;

const StatusText = styled.div<{ connected: boolean }>`
  color: ${(props) => (props.connected ? '#28A745' : '#DC3545')};
  font-size: 0.9rem;
`;

const ErrorText = styled.div`
  color: #DC3545;
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;

const ConnectionSettings: React.FC = () => {
  const { state, updateConnection, testConnection } = useApp();
  
  const [serverUrl, setServerUrl] = useState(state.connection.serverUrl);
  const [apiKey, setApiKey] = useState(state.connection.apiKey);
  const [isTesting, setIsTesting] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  
  // Update the form values when the connection settings change
  useEffect(() => {
    setServerUrl(state.connection.serverUrl);
    setApiKey(state.connection.apiKey);
    setFormChanged(false);
  }, [state.connection.serverUrl, state.connection.apiKey]);
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formChanged) return;
    
    // Update connection settings
    updateConnection(serverUrl, apiKey);
    
    // Test the connection
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
    
    setFormChanged(false);
  };
  
  /**
   * Reset form to default values
   */
  const handleReset = () => {
    setServerUrl('http://localhost:8000');
    setApiKey('test-key');
    setFormChanged(true);
  };
  
  /**
   * Test the connection with current settings
   */
  const handleTestConnection = async () => {
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  return (
    <SettingsContainer>
      <Title>Connection Settings</Title>
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="serverUrl">Server URL</Label>
          <Input
            id="serverUrl"
            type="text"
            value={serverUrl}
            onChange={(e) => {
              setServerUrl(e.target.value);
              setFormChanged(true);
            }}
            placeholder="http://localhost:8000"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="text"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setFormChanged(true);
            }}
            placeholder="test-key"
          />
        </FormGroup>
        
        <ButtonContainer>
          <Button
            type="submit"
            disabled={isTesting || !formChanged}
          >
            {isTesting ? 'Connecting...' : 'Connect'}
          </Button>
          
          <ResetButton
            type="button"
            onClick={handleReset}
            disabled={isTesting}
          >
            Reset
          </ResetButton>
        </ButtonContainer>
      </form>
      
      <StatusContainer>
        <StatusIndicator connected={state.connection.connected} />
        <StatusText connected={state.connection.connected}>
          {state.connection.connected ? 'Connected' : 'Disconnected'}
        </StatusText>
      </StatusContainer>
      
      {state.connection.error && (
        <ErrorText>{state.connection.error}</ErrorText>
      )}
    </SettingsContainer>
  );
};

export default ConnectionSettings; 