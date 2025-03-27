import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { useApp } from '../../context/AppContext';
import { parseCommand } from '../../utils/commandParser';
import apiClient from '../../api/client';

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
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [tempCommand, setTempCommand] = useState<string>('');
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
      
      const newId = history.length;
      const currentCommand = command;
      
      // Add command to history
      setHistory(prev => [
        ...prev,
        { id: newId, command: currentCommand }
      ]);
      
      // Reset command input and notify parent
      setCommand('');
      if (onCommandExecuted) {
        onCommandExecuted();
      }
      
      try {
        // Parse and execute the command
        const parsedCommand = parseCommand(currentCommand.trim());
        
        if (!parsedCommand.valid) {
          setHistory(prev => {
            const updated = [...prev];
            const commandItem = updated.find(item => item.id === newId);
            if (commandItem) {
              commandItem.error = `Invalid command: ${parsedCommand.error}`;
            }
            return updated;
          });
          return;
        }
        
        // Handle help command
        if (parsedCommand.type === 'help') {
          setHistory(prev => {
            const updated = [...prev];
            const commandItem = updated.find(item => item.id === newId);
            if (commandItem) {
              commandItem.info = `
Available commands:
  help                                     - Show this help message
  clear                                    - Clear the terminal
  connect <url> <apiKey>                   - Connect to MCP server
  call <functionName> <parameters>         - Call a function
  tool <toolName> <parameters>             - Call a tool
  list functions                           - List available functions
  list tools                               - List available tools
`;
            }
            return updated;
          });
          return;
        }
        
        // Handle clear command
        if (parsedCommand.type === 'clear') {
          setHistory([{ 
            id: 0, 
            info: 'Terminal cleared. Type "help" for available commands.' 
          }]);
          dispatch({ type: 'CLEAR_PROTOCOL_STEPS' });
          return;
        }
        
        // Handle connect command
        if (parsedCommand.type === 'connect') {
          const params = parsedCommand.parameters || {};
          const url = params.url || '';
          const apiKey = params.apiKey || '';
          
          try {
            // Configure the API client
            apiClient.updateConfig(url, apiKey);
            
            // Test the connection
            const success = await apiClient.testConnection();
            
            if (!success) {
              throw new Error('Connection test failed');
            }
            
            // Update connection state
            dispatch({
              type: 'SET_CONNECTION',
              payload: {
                serverUrl: url,
                apiKey,
                connected: true
              }
            });
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.info = `Connected to ${url}`;
              }
              return updated;
            });
          } catch (error) {
            console.error('Connection error:', error);
            
            // Update connection state to disconnected
            dispatch({
              type: 'SET_CONNECTION',
              payload: {
                serverUrl: url,
                apiKey,
                connected: false
              }
            });
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.error = error instanceof Error 
                  ? error.message 
                  : 'Failed to connect to server';
              }
              return updated;
            });
          }
          
          return;
        }
        
        // Validate connection for commands that require it
        if (!state.connection.connected) {
          setHistory(prev => {
            const updated = [...prev];
            const commandItem = updated.find(item => item.id === newId);
            if (commandItem) {
              commandItem.error = 'Not connected to server. Use `connect` command first.';
            }
            return updated;
          });
          return;
        }
        
        // Handle function calls
        if (parsedCommand.type === 'call_function') {
          try {
            const result = await apiClient.callFunction({
              name: parsedCommand.functionName || '',
              parameters: parsedCommand.parameters || {}
            });
            
            // Add protocol step
            const protocolStep = {
              id: Date.now().toString(),
              type: 'request' as const,
              method: 'POST',
              endpoint: `/api/functions/call`,
              timestamp: new Date().toISOString(),
              data: {
                request: {
                  name: parsedCommand.functionName,
                  parameters: parsedCommand.parameters
                },
                response: result
              }
            };
            
            dispatch({ type: 'ADD_PROTOCOL_STEP', payload: protocolStep });
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.output = JSON.stringify(result, null, 2);
              }
              return updated;
            });
          } catch (error) {
            console.error('Error calling function:', error);
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.error = error instanceof Error 
                  ? error.message 
                  : 'An unknown error occurred while calling function';
              }
              return updated;
            });
          }
          
          return;
        }
        
        // Handle tool calls
        if (parsedCommand.type === 'call_tool') {
          try {
            const result = await apiClient.callTool({
              name: parsedCommand.functionName || '',
              parameters: parsedCommand.parameters || {}
            });
            
            // Add protocol step
            const protocolStep = {
              id: Date.now().toString(),
              type: 'request' as const,
              method: 'POST',
              endpoint: `/api/tools/call`,
              timestamp: new Date().toISOString(),
              data: {
                request: {
                  name: parsedCommand.functionName,
                  parameters: parsedCommand.parameters
                },
                response: result
              }
            };
            
            dispatch({ type: 'ADD_PROTOCOL_STEP', payload: protocolStep });
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.output = JSON.stringify(result, null, 2);
              }
              return updated;
            });
          } catch (error) {
            console.error('Error calling tool:', error);
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.error = error instanceof Error 
                  ? error.message 
                  : 'An unknown error occurred while calling tool';
              }
              return updated;
            });
          }
          
          return;
        }
        
        // Handle list command
        if (parsedCommand.type === 'functions_list') {
          try {
            const functions = await apiClient.listFunctions();
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.output = functions.map(f => f.name).join('\n');
              }
              return updated;
            });
          } catch (error) {
            console.error('Error listing functions:', error);
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.error = error instanceof Error 
                  ? error.message 
                  : 'An unknown error occurred while listing functions';
              }
              return updated;
            });
          }
          
          return;
        }
        
        // Handle tools list command
        if (parsedCommand.type === 'tools_list') {
          try {
            // Currently not implemented in API client
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.info = 'Tool listing is not currently implemented';
              }
              return updated;
            });
          } catch (error) {
            console.error('Error listing tools:', error);
            
            setHistory(prev => {
              const updated = [...prev];
              const commandItem = updated.find(item => item.id === newId);
              if (commandItem) {
                commandItem.error = error instanceof Error 
                  ? error.message 
                  : 'An unknown error occurred while listing tools';
              }
              return updated;
            });
          }
          
          return;
        }
        
        // If we get here, the command type is unknown
        setHistory(prev => {
          const updated = [...prev];
          const commandItem = updated.find(item => item.id === newId);
          if (commandItem) {
            commandItem.error = `Unknown command type: ${parsedCommand.type}`;
          }
          return updated;
        });
      } catch (error) {
        setHistory(prev => {
          const updated = [...prev];
          const commandItem = updated.find(item => item.id === newId);
          if (commandItem) {
            commandItem.error = error instanceof Error 
              ? error.message 
              : 'An unknown error occurred';
          }
          return updated;
        });
      }
      
      // Reset history index
      setHistoryIndex(-1);
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
        if (historyIndex === -1 && command) {
          setTempCommand(command);
        }
        
        const commandHistory = history
          .filter(item => item.command)
          .map(item => item.command as string);
        
        if (commandHistory.length > 0) {
          const newIndex = historyIndex < commandHistory.length - 1 
            ? historyIndex + 1 
            : historyIndex;
          
          setHistoryIndex(newIndex);
          setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        
        // Navigate down through command history
        const commandHistory = history
          .filter(item => item.command)
          .map(item => item.command as string);
        
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setCommand(tempCommand);
          setTempCommand('');
        }
      }
    };

    return (
      <TerminalWrapper>
        <Terminal ref={terminalRef}>
          <TerminalHistory>
            {history.map((item) => (
              <div key={item.id}>
                {item.command && (
                  <CommandPrompt>
                    <Prompt>&gt;</Prompt>
                    {item.command}
                  </CommandPrompt>
                )}
                {item.output && <CommandOutput>{item.output}</CommandOutput>}
                {item.error && <ErrorOutput>{item.error}</ErrorOutput>}
                {item.info && <InfoOutput>{item.info}</InfoOutput>}
              </div>
            ))}
          </TerminalHistory>
        </Terminal>
        <InputContainer>
          <InputPrefix>&gt;</InputPrefix>
          <Input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            autoFocus
          />
        </InputContainer>
      </TerminalWrapper>
    );
  }
);

export default TerminalContainer; 