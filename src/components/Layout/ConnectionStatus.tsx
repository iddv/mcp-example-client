import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useConnectionStatus } from '../../hooks/useApi';

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #252526;
  border-top: 1px solid #3a3a3a;
  grid-area: status;
`;

const StatusIndicator = styled.div<{ connected: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ connected }) => (connected ? '#28a745' : '#dc3545')};
  margin-right: 0.5rem;
`;

const StatusText = styled.span`
  font-size: 0.8rem;
  color: #e9e9e9;
  margin-right: 1rem;
`;

const ServerInfoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const ServerInfo = styled.span`
  font-size: 0.8rem;
  color: #a0a0a0;
  margin-right: 0.5rem;
`;

const SettingsButton = styled.button`
  background-color: transparent;
  border: 1px solid #3a3a3a;
  color: #e9e9e9;
  border-radius: 3px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  
  &:hover {
    background-color: #3a3a3a;
  }
`;

const SettingsModal = styled.div`
  position: absolute;
  bottom: 40px;
  right: 10px;
  background-color: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 1rem;
  min-width: 300px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  z-index: 10;
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
  color: #e9e9e9;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  background-color: #252526;
  border: 1px solid #3a3a3a;
  color: #e9e9e9;
  border-radius: 3px;
  
  &:focus {
    outline: none;
    border-color: #4a6fff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Button = styled.button<{ primary?: boolean }>`
  background-color: ${({ primary }) => (primary ? '#4a6fff' : 'transparent')};
  border: 1px solid ${({ primary }) => (primary ? '#4a6fff' : '#3a3a3a')};
  color: #e9e9e9;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: ${({ primary }) => (primary ? '#3a5fe6' : '#3a3a3a')};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConnectionError = styled.div`
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;

const ConnectionStatus: React.FC = () => {
  const { 
    isConnected, 
    connectionError, 
    serverUrl, 
    apiKey,
    isLoading,
    testConnection,
    updateConnection
  } = useConnectionStatus();
  
  const [showSettings, setShowSettings] = useState(false);
  const [formServerUrl, setFormServerUrl] = useState(serverUrl);
  const [formApiKey, setFormApiKey] = useState(apiKey);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form values if they change externally
  useEffect(() => {
    setFormServerUrl(serverUrl);
    setFormApiKey(apiKey);
  }, [serverUrl, apiKey]);

  // Check for changes
  useEffect(() => {
    setHasChanges(formServerUrl !== serverUrl || formApiKey !== apiKey);
  }, [formServerUrl, formApiKey, serverUrl, apiKey]);

  const handleToggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateConnection(formServerUrl, formApiKey);
    await testConnection();
    setShowSettings(false);
  };

  const handleTestConnection = async () => {
    updateConnection(formServerUrl, formApiKey);
    await testConnection();
  };

  return (
    <StatusContainer>
      <StatusIndicator connected={isConnected} />
      <StatusText>
        {isConnected 
          ? 'Connected' 
          : isLoading 
            ? 'Connecting...' 
            : 'Disconnected'}
      </StatusText>
      
      <ServerInfoContainer>
        <ServerInfo>{serverUrl}</ServerInfo>
        <SettingsButton onClick={handleToggleSettings}>Settings</SettingsButton>
      </ServerInfoContainer>
      
      {showSettings && (
        <SettingsModal>
          <SettingsForm onSubmit={handleSaveSettings}>
            <FormGroup>
              <Label htmlFor="serverUrl">Server URL</Label>
              <Input
                id="serverUrl"
                type="text"
                value={formServerUrl}
                onChange={(e) => setFormServerUrl(e.target.value)}
                placeholder="http://localhost:8000"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                placeholder="Enter API key"
              />
            </FormGroup>
            
            {connectionError && (
              <ConnectionError>{connectionError}</ConnectionError>
            )}
            
            <ButtonGroup>
              <Button 
                type="button" 
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              
              <Button 
                type="button" 
                onClick={handleTestConnection}
                disabled={isLoading || !hasChanges}
              >
                Test Connection
              </Button>
              
              <Button 
                type="submit" 
                primary 
                disabled={isLoading || !hasChanges}
              >
                Save
              </Button>
            </ButtonGroup>
          </SettingsForm>
        </SettingsModal>
      )}
    </StatusContainer>
  );
};

export default ConnectionStatus; 