import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { useApp } from '../../context/AppContext';
import { parseCommand, getCommandHelp } from '../../utils/commandParser';
import apiClient from '../../api/client';
import CommandInput from './CommandInput';
import ResponseDisplay from './ResponseDisplay';
import StreamDisplay from './StreamDisplay';
import { v4 as uuidv4 } from 'uuid';

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

const TerminalContainer = forwardRef<{ focusInput: () => void }, TerminalContainerProps>(
  ({ initialCommand = '', onCommandExecuted }, ref) => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([
      { id: 0, info: 'MCP Client Terminal. Type "help" for available commands.' }
    ]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const { state, dispatch } = useApp();
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

    return (
      <TerminalWrapper>
        <Terminal ref={terminalRef}>
          <TerminalHistory>
            {history.map(item => (
              <div key={item.id}>
                {item.command && (
                  <CommandPrompt>
                    <Prompt>&gt;</Prompt>
                    {item.command}
                  </CommandPrompt>
                )}
                {item.output && (
                  <CommandOutput>
                    {item.output}
                  </CommandOutput>
                )}
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
      </TerminalWrapper>
    );
  }
);

export default TerminalContainer; 