import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { useApp } from '../../context/AppContext';
import { parseCommand, getCommandHelp } from '../../utils/commandParser';
import apiClient from '../../api/client';
import CommandInput from './CommandInput';
import ResponseDisplay from './ResponseDisplay';
import StreamDisplay from './StreamDisplay';
import { v4 as uuidv4 } from 'uuid';
import { FiStar } from 'react-icons/fi';

const TerminalWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1e1e1e;
  border-right: 1px solid #333;
`;

const Terminal = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  background-color: #1e1e1e;
`;

const TerminalHistory = styled.div`
  padding-bottom: 0.5rem;
`;

const CommandPrompt = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
`;

const Prompt = styled.span`
  color: #4A6FFF;
  margin-right: 0.5rem;
`;

const CommandOutput = styled.div`
  white-space: pre-wrap;
  color: #e9e9e9;
  margin-bottom: 1rem;
  padding-left: 1rem;
`;

const ErrorOutput = styled.div`
  white-space: pre-wrap;
  color: #ff6b6b;
  margin-bottom: 1rem;
  padding-left: 1rem;
`;

const InfoOutput = styled.div`
  white-space: pre-wrap;
  color: #77d970;
  margin-bottom: 1rem;
  padding-left: 1rem;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 0.5rem 1rem;
  background-color: #252526;
  border-top: 1px solid #333;
`;

const InputPrefix = styled.span`
  color: #4A6FFF;
  margin-right: 0.5rem;
  font-family: 'Roboto Mono', monospace;
`;

const Input = styled.input`
  flex: 1;
  background-color: transparent;
  border: none;
  color: #e9e9e9;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
  }
`;

const CommandWithActions = styled.div`
  display: flex;
  align-items: center;
`;

const CommandText = styled.span`
  flex: 1;
`;

const CommandActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: 0.5rem;
`;

const ActionIcon = styled.button`
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #4A6FFF;
  }
`;

interface HistoryItem {
  id: number;
  command?: string;
  output?: string;
  error?: string;
  info?: string;
}

interface TerminalContainerProps {
  initialCommand?: string;
  onCommandExecuted?: () => void;
}

interface AddFavoriteDialogProps {
  command: string;
  onSave: (name: string, description?: string | undefined) => void;
  onCancel: () => void;
}

const AddFavoriteDialog: React.FC<AddFavoriteDialogProps> = ({ command, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Only pass description if it's non-empty
      const trimmedDescription = description.trim();
      onSave(name.trim(), trimmedDescription.length > 0 ? trimmedDescription : undefined);
    }
  };
  
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#252526',
      padding: '1rem',
      borderRadius: '4px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      width: '400px',
      zIndex: 1000
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Save Command as Favorite</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Command:
          </label>
          <div style={{ 
            padding: '0.5rem', 
            background: '#1e1e1e', 
            borderRadius: '4px',
            color: '#4A6FFF',
            fontFamily: 'monospace',
            overflow: 'auto'
          }}>
            {command}
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                background: '#1e1e1e',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#e9e9e9',
                marginTop: '0.25rem'
              }}
              placeholder="Enter a name for this command"
              required
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Description (optional):
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem',
                background: '#1e1e1e',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#e9e9e9',
                height: '80px',
                resize: 'vertical',
                marginTop: '0.25rem'
              }}
              placeholder="Describe what this command does"
            />
          </label>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #3a3a3a',
              borderRadius: '4px',
              color: '#e9e9e9',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              background: '#4A6FFF',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

const TerminalContainer = forwardRef<{ focusInput: () => void }, TerminalContainerProps>(
  ({ initialCommand = '', onCommandExecuted }, ref) => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([
      { id: 0, info: 'MCP Client Terminal. Type "help" for available commands.' }
    ]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [favoriteDialog, setFavoriteDialog] = useState<{ visible: boolean, command: string }>({
      visible: false,
      command: ''
    });
    const { state, dispatch, addFavorite } = useApp();
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose the focusInput method to parent components
    useImperativeHandle(ref, () => ({
      focusInput: () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }));

    // Set command from props when initialCommand changes
    useEffect(() => {
      if (initialCommand) {
        setCommand(initialCommand);
        
        // Focus the input after setting the command
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, [initialCommand]);

    // Scroll to bottom when history changes
    useEffect(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, [history]);

    // Focus input on mount
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    /**
     * Handle command execution
     */
    const handleCommand = async () => {
      if (!command.trim()) return;
      
      const commandId = uuidv4();
      const currentCommand = command;
      
      // Add command to local terminal history
      setHistory(prev => [
        ...prev,
        { id: Date.now(), command: currentCommand }
      ]);
      
      // Parse the command
      const parsedCommand = parseCommand(currentCommand.trim());
      
      // Add command to global app history
      dispatch({
        type: 'ADD_HISTORY_ITEM',
        payload: {
          id: commandId,
          command: currentCommand,
          timestamp: new Date().toISOString(),
          parsedCommand: parsedCommand,
          favorite: false
        }
      });
      
      // Reset command input and notify parent
      setCommand('');
      if (onCommandExecuted) {
        onCommandExecuted();
      }
      
      try {
        setIsExecuting(true);
        
        // Execute the command
        if (!parsedCommand.valid) {
          setHistory(prev => {
            const updated = [...prev];
            const commandItem = updated.find(item => item.command === currentCommand);
            if (commandItem) {
              commandItem.error = `Invalid command: ${parsedCommand.error}`;
            }
            return updated;
          });
          setIsExecuting(false);
          return;
        }
        
        // Handle different command types
        switch (parsedCommand.type) {
          case 'help':
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.command === currentCommand);
              if (commandItem) {
                commandItem.info = getCommandHelp();
              }
              return updated;
            });
            break;
            
          case 'clear':
            setHistory([]);
            break;
            
          case 'history':
            // Display command history
            const historyCommands = state.history
              .filter(item => item.command)
              .map((item, index) => `${index + 1}: ${item.command}`)
              .join('\n');
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.command === currentCommand);
              if (commandItem) {
                commandItem.output = historyCommands || 'No command history';
              }
              return updated;
            });
            break;
            
          case 'connect':
            // Handle connection to server
            if (parsedCommand.parameters) {
              const { url, apiKey } = parsedCommand.parameters;
              
              dispatch({
                type: 'SET_CONNECTION',
                payload: {
                  serverUrl: url,
                  apiKey: apiKey,
                  connected: false
                }
              });
              
              const connected = await apiClient.testConnection();
              
              dispatch({
                type: 'SET_CONNECTION',
                payload: { connected }
              });
              
              setHistory(prev => {
                const updated = [...prev];
                const commandItem = updated.find(item => item.command === currentCommand);
                if (commandItem) {
                  if (connected) {
                    commandItem.info = `Connected to server at ${url}`;
                  } else {
                    commandItem.error = `Failed to connect to server at ${url}`;
                  }
                }
                return updated;
              });
            }
            break;
            
          // ... handle other command types ...
          
          default:
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.command === currentCommand);
              if (commandItem) {
                commandItem.error = `Unimplemented command type: ${parsedCommand.type}`;
              }
              return updated;
            });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        setHistory(prev => {
          const updated = [...prev];
          const commandItem = updated.find(item => item.command === currentCommand);
          if (commandItem) {
            commandItem.error = `Error executing command: ${errorMessage}`;
          }
          return updated;
        });
      } finally {
        setIsExecuting(false);
      }
    };

    /**
     * Handle input key events for history navigation and command execution
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleCommand();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        
        // Navigate up through command history
        if (history.length > 0) {
          const newIndex = history.length - 1;
          setCommand(history[newIndex].command || '');
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        
        // Navigate down through command history
        if (history.length > 0) {
          const newIndex = history.length - 1;
          setCommand(history[newIndex].command || '');
        }
      }
    };

    // Add this new method to handle adding to favorites
    const handleAddToFavorites = (command: string) => {
      setFavoriteDialog({
        visible: true,
        command
      });
    };
    
    // Add this method for saving a favorite
    const handleSaveFavorite = (name: string, description?: string) => {
      addFavorite(
        favoriteDialog.command, 
        name,
        description !== undefined && description !== '' ? description : undefined
      );

      setFavoriteDialog({
        visible: false,
        command: ''
      });
    };
    
    // Add this method for canceling the add favorite dialog
    const handleCancelFavorite = () => {
      setFavoriteDialog({
        visible: false,
        command: ''
      });
    };

    return (
      <TerminalWrapper>
        <Terminal ref={terminalRef}>
          <TerminalHistory>
            {history.map((item, index) => (
              <div key={item.id}>
                {item.command && (
                  <CommandPrompt>
                    <Prompt>{'>'}</Prompt>
                    <CommandWithActions>
                      <CommandText>{item.command}</CommandText>
                      <CommandActions>
                        <ActionIcon 
                          onClick={() => handleAddToFavorites(item.command)}
                          title="Add to favorites"
                        >
                          <FiStar />
                        </ActionIcon>
                      </CommandActions>
                    </CommandWithActions>
                  </CommandPrompt>
                )}
                {item.output && <CommandOutput>{item.output}</CommandOutput>}
                {item.error && <ErrorOutput>{item.error}</ErrorOutput>}
                {item.info && <InfoOutput>{item.info}</InfoOutput>}
              </div>
            ))}
            {isStreaming && (
              <StreamDisplay 
                wsState={{
                  connected: true,
                  connecting: false,
                  messages: []
                }}
                command={{type: 'stream_function', functionName: 'stream'}}
                onStop={() => setIsStreaming(false)}
              />
            )}
          </TerminalHistory>
        </Terminal>
        
        <CommandInput 
          value={command}
          onChange={setCommand}
          onExecute={handleCommand}
          isExecuting={isExecuting}
          isStreaming={isStreaming}
        />
        
        {favoriteDialog.visible && (
          <AddFavoriteDialog
            command={favoriteDialog.command}
            onSave={handleSaveFavorite}
            onCancel={handleCancelFavorite}
          />
        )}
      </TerminalWrapper>
    );
  }
);

export default TerminalContainer; 