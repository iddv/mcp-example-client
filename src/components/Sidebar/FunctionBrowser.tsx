import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MCPFunctionDefinition } from '../../types/mcp';
import apiClient from '../../api/client';
import { useApp } from '../../context/AppContext';

const BrowserContainer = styled.div`
  padding: 1rem;
  background-color: #1e1e1e;
  flex: 1;
  overflow-y: auto;
`;

const Title = styled.h2`
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: #e9e9e9;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  background-color: #252526;
  color: #e9e9e9;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4A6FFF;
  }
`;

const FunctionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FunctionItem = styled.div<{ isSelected: boolean }>`
  padding: 0.5rem;
  border-radius: 4px;
  background-color: ${(props) => (props.isSelected ? '#2a3367' : '#252526')};
  cursor: pointer;
  
  &:hover {
    background-color: ${(props) => (props.isSelected ? '#2a3367' : '#333')};
  }
`;

const FunctionName = styled.div`
  font-weight: bold;
  color: #4A6FFF;
`;

const FunctionDescription = styled.div`
  font-size: 0.8rem;
  color: #cccccc;
  margin-top: 0.25rem;
`;

const DetailContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #252526;
  border-radius: 4px;
`;

const DetailTitle = styled.h3`
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: #e9e9e9;
`;

const DetailDescription = styled.div`
  font-size: 0.9rem;
  color: #cccccc;
  margin-bottom: 1rem;
`;

const ParametersTitle = styled.h4`
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
  color: #e9e9e9;
`;

const ParametersList = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
  color: #cccccc;
  padding: 0.5rem;
  background-color: #1e1e1e;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
`;

const TryButton = styled.button`
  background-color: #4A6FFF;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  margin-top: 1rem;
  
  &:hover {
    background-color: #3a5fd9;
  }
`;

const LoadingText = styled.div`
  color: #cccccc;
  font-style: italic;
`;

const ErrorText = styled.div`
  color: #ff6b6b;
  font-style: italic;
`;

interface FunctionBrowserProps {
  onTryFunction?: (command: string) => void;
}

const FunctionBrowser: React.FC<FunctionBrowserProps> = ({
  onTryFunction,
}) => {
  const { state } = useApp();
  const [functions, setFunctions] = useState<MCPFunctionDefinition[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<MCPFunctionDefinition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load functions when connection status changes
  useEffect(() => {
    if (state.connection.connected) {
      loadFunctions();
    } else {
      setFunctions([]);
      setSelectedFunction(null);
    }
  }, [state.connection.connected]);

  /**
   * Load the list of available functions
   */
  const loadFunctions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const functions = await apiClient.listFunctions();
      setFunctions(functions);
      
      if (functions.length > 0) {
        setSelectedFunction(functions[0]);
      }
    } catch (error) {
      console.error('Failed to load functions:', error);
      setError('Failed to load functions');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filter functions based on search term
   */
  const filteredFunctions = functions.filter(
    (func) =>
      func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Generate example parameters based on function schema
   */
  const generateExampleParameters = (func: MCPFunctionDefinition): Record<string, any> => {
    const result: Record<string, any> = {};
    
    if (func.parameters.properties) {
      Object.entries(func.parameters.properties).forEach(([key, prop]) => {
        if (prop.type === 'string') {
          result[key] = 'example';
        } else if (prop.type === 'number' || prop.type === 'integer') {
          result[key] = 0;
        } else if (prop.type === 'boolean') {
          result[key] = false;
        } else if (prop.type === 'array') {
          result[key] = [];
        } else if (prop.type === 'object') {
          result[key] = {};
        }
      });
    }
    
    return result;
  };

  /**
   * Generate a command string for the selected function
   */
  const generateCommandString = (func: MCPFunctionDefinition): string => {
    const exampleParams = generateExampleParameters(func);
    return `call ${func.name} ${JSON.stringify(exampleParams)}`;
  };

  /**
   * Handle try function button click
   */
  const handleTryFunction = () => {
    if (!selectedFunction || !onTryFunction) return;
    
    const commandString = generateCommandString(selectedFunction);
    onTryFunction(commandString);
  };

  // Render loading state
  if (isLoading) {
    return (
      <BrowserContainer>
        <Title>Function Browser</Title>
        <LoadingText>Loading functions...</LoadingText>
      </BrowserContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <BrowserContainer>
        <Title>Function Browser</Title>
        <ErrorText>{error}</ErrorText>
      </BrowserContainer>
    );
  }

  // Render disconnected state
  if (!state.connection.connected) {
    return (
      <BrowserContainer>
        <Title>Function Browser</Title>
        <LoadingText>Connect to a server to browse functions</LoadingText>
      </BrowserContainer>
    );
  }

  return (
    <BrowserContainer>
      <Title>Function Browser</Title>
      
      <SearchInput
        type="text"
        placeholder="Search functions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {filteredFunctions.length === 0 ? (
        <LoadingText>No functions found</LoadingText>
      ) : (
        <>
          <FunctionList>
            {filteredFunctions.map((func) => (
              <FunctionItem
                key={func.name}
                isSelected={selectedFunction?.name === func.name}
                onClick={() => setSelectedFunction(func)}
              >
                <FunctionName>{func.name}</FunctionName>
                <FunctionDescription>{func.description}</FunctionDescription>
              </FunctionItem>
            ))}
          </FunctionList>
          
          {selectedFunction && (
            <DetailContainer>
              <DetailTitle>{selectedFunction.name}</DetailTitle>
              <DetailDescription>{selectedFunction.description}</DetailDescription>
              
              <ParametersTitle>Parameters</ParametersTitle>
              <ParametersList>
                {JSON.stringify(selectedFunction.parameters, null, 2)}
              </ParametersList>
              
              {onTryFunction && (
                <TryButton onClick={handleTryFunction}>
                  Try It
                </TryButton>
              )}
            </DetailContainer>
          )}
        </>
      )}
    </BrowserContainer>
  );
};

export default FunctionBrowser; 