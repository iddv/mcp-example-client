import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { getRandomPlaceholder } from '../../utils/commandParser';
import { useApp } from '../../context/AppContext';
import { 
  useKeyboardShortcuts, 
  terminalShortcuts, 
  KeyboardShortcut 
} from '../../utils/keyboardShortcuts';
import { CommandBuilderButton } from '../CommandBuilder';

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #252526;
  border-top: 1px solid #333;
`;

const Prompt = styled.span`
  color: #4A6FFF;
  font-weight: bold;
  margin-right: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  background-color: #1e1e1e;
  color: #e9e9e9;
  border: 1px solid #3a3a3a;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4A6FFF;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ExecuteButton = styled.button`
  background-color: #4A6FFF;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-left: 0.5rem;
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

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (command: string) => void;
  isExecuting: boolean;
  isStreaming: boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({
  value,
  onChange,
  onExecute,
  isExecuting,
  isStreaming,
}) => {
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempCommand, setTempCommand] = useState('');
  const [placeholder, setPlaceholder] = useState(getRandomPlaceholder());
  const [functionName, setFunctionName] = useState<string | null>(null);
  const { state } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get command history from app context
  const commandHistory = state.history
    .filter(item => item.command) // Only include items with a command
    .map(item => item.command as string); // Extract command string

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Update the placeholder periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(getRandomPlaceholder());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Parse the command to detect if it's a function call
  useEffect(() => {
    const trimmedValue = value.trim();
    
    // Check if command starts with 'call '
    if (trimmedValue.startsWith('call ')) {
      // Extract function name - looking for pattern: call functionName {params}
      const match = trimmedValue.match(/^call\s+([a-zA-Z0-9._]+)(\s+.*)?$/);
      if (match) {
        setFunctionName(match[1]);
        return;
      }
    }
    
    // Not a valid function call command
    setFunctionName(null);
  }, [value]);

  /**
   * Handle command execution
   */
  const handleExecute = () => {
    if (!value.trim() || isExecuting || isStreaming) return;
    
    // Execute the command - parent component will add to history
    onExecute(value);
    
    // Reset history navigation
    setHistoryIndex(-1);
  };

  /**
   * Navigate to previous command in history
   */
  const handlePreviousCommand = () => {
    if (commandHistory.length === 0) return;
    
    // If this is the first press, store the current command
    if (historyIndex === -1) {
      setTempCommand(value);
    }
    
    const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
    setHistoryIndex(newIndex);
    onChange(commandHistory[newIndex]);
    
    // Move cursor to end of input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.value.length;
        inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 0);
  };

  /**
   * Navigate to next command in history
   */
  const handleNextCommand = () => {
    if (historyIndex <= 0) {
      setHistoryIndex(-1);
      onChange(tempCommand); // Restore the command that was being typed
      return;
    }
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    onChange(commandHistory[newIndex]);
    
    // Move cursor to end of input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.value.length;
        inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 0);
  };

  /**
   * Clear the input
   */
  const handleClearInput = () => {
    onChange('');
    setHistoryIndex(-1);
    setTempCommand('');
  };

  // Create custom keyboard shortcuts specific to this component
  const customShortcuts: KeyboardShortcut[] = [
    {
      keys: ['Ctrl', 'Enter'],
      description: 'Execute command',
      action: () => handleExecute(),
      scope: 'terminal',
    },
    {
      keys: ['ArrowUp'],
      description: 'Previous command',
      action: () => handlePreviousCommand(),
      scope: 'terminal',
    },
    {
      keys: ['ArrowDown'],
      description: 'Next command',
      action: () => handleNextCommand(),
      scope: 'terminal',
    },
    {
      keys: ['Escape'],
      description: 'Clear input',
      action: () => handleClearInput(),
      scope: 'terminal',
    },
    {
      keys: ['Ctrl', 'l'],
      description: 'Clear terminal',
      action: () => {
        // Will be implemented in TerminalContainer
        console.log('Clear terminal shortcut');
      },
      scope: 'terminal',
    },
  ];

  // Register keyboard shortcuts
  useKeyboardShortcuts(customShortcuts, 'terminal');

  /**
   * Handle key presses
   * @param e - Keyboard event
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter key executes the command
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
      return;
    }
    
    // Up arrow navigates history backwards
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handlePreviousCommand();
      return;
    }
    
    // Down arrow navigates history forwards
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleNextCommand();
      return;
    }
    
    // Escape key clears the input
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClearInput();
      return;
    }
    
    // Tab key for auto-complete (not implemented yet)
    if (e.key === 'Tab') {
      e.preventDefault();
      // TODO: Implement auto-complete
      return;
    }
  };

  /**
   * Handle command from builder
   */
  const handleCommandFromBuilder = (command: string) => {
    onChange(command);
    
    // Focus back on the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <InputContainer>
      <Prompt>&gt;</Prompt>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isExecuting || isStreaming}
        spellCheck={false}
        autoComplete="off"
      />
      
      {/* Show the command builder button when a function name is detected */}
      {functionName && !isExecuting && !isStreaming && (
        <CommandBuilderButton 
          functionName={functionName}
          onCommandGenerated={handleCommandFromBuilder}
        />
      )}
      
      <ExecuteButton
        onClick={handleExecute}
        disabled={!value.trim() || isExecuting || isStreaming}
      >
        {isExecuting ? 'Executing...' : isStreaming ? 'Streaming...' : 'Execute'}
      </ExecuteButton>
    </InputContainer>
  );
};

export default CommandInput; 