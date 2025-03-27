import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSettings } from 'react-icons/fi';
import CommandBuilder from './CommandBuilder';
import { MCPFunctionDefinition } from '../../types/mcp';
import apiClient from '../../api/client';

const ButtonContainer = styled.div`
  display: inline-block;
  margin-left: 0.5rem;
`;

const BuilderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333;
  color: #e9e9e9;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    background-color: #4A6FFF;
    border-color: #4A6FFF;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(74, 111, 255, 0.3);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  background-color: #252526;
  border-radius: 4px;
  z-index: 101;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #e9e9e9;
`;

const ErrorContainer = styled.div`
  color: #ff6b6b;
  padding: 1rem;
  background-color: #2d2d2d;
  border-radius: 4px;
  margin: 1rem;
`;

export interface CommandBuilderButtonProps {
  functionName: string;
  onCommandGenerated: (command: string) => void;
}

const CommandBuilderButton: React.FC<CommandBuilderButtonProps> = ({
  functionName,
  onCommandGenerated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [functionDef, setFunctionDef] = useState<MCPFunctionDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const openBuilder = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch the function definition
      const functionDefinition = await apiClient.getFunction(functionName);
      setFunctionDef(functionDefinition);
    } catch (err: any) {
      setError(err.message || 'Failed to load function definition');
    } finally {
      setIsLoading(false);
    }
  };
  
  const closeBuilder = () => {
    setIsOpen(false);
    setFunctionDef(null);
    setError(null);
  };
  
  const handleCommandGenerated = (parameters: Record<string, any>) => {
    // Generate the command string
    const commandStr = `call ${functionName} ${JSON.stringify(parameters)}`;
    onCommandGenerated(commandStr);
    closeBuilder();
  };
  
  return (
    <>
      <ButtonContainer>
        <BuilderButton onClick={openBuilder} title="Open command builder">
          <FiSettings />
        </BuilderButton>
      </ButtonContainer>
      
      {isOpen && (
        <ModalOverlay onClick={closeBuilder}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            {isLoading && (
              <LoadingContainer>
                Loading function details...
              </LoadingContainer>
            )}
            
            {error && (
              <ErrorContainer>
                <h3>Error</h3>
                <p>{error}</p>
              </ErrorContainer>
            )}
            
            {!isLoading && !error && functionDef && (
              <CommandBuilder
                functionDefinition={functionDef}
                onGenerate={handleCommandGenerated}
                onCancel={closeBuilder}
              />
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default CommandBuilderButton; 