import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { getRandomPlaceholder } from '../../utils/commandParser';

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
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [placeholder, setPlaceholder] = useState(getRandomPlaceholder());
  const inputRef = useRef<HTMLInputElement>(null);

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

  /**
   * Handle command execution
   */
  const handleExecute = () => {
    if (!value.trim() || isExecuting || isStreaming) return;
    
    // Execute the command
    onExecute(value);
    
    // Add to history
    setHistory((prev) => [value, ...prev]);
    setHistoryIndex(-1);
  };

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
      
      if (history.length === 0) return;
      
      const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      
      // Move cursor to end of input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.value.length;
          inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 0);
      
      return;
    }
    
    // Down arrow navigates history forwards
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        onChange('');
        return;
      }
      
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      
      // Move cursor to end of input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.value.length;
          inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 0);
      
      return;
    }
    
    // Escape key clears the input
    if (e.key === 'Escape') {
      e.preventDefault();
      onChange('');
      setHistoryIndex(-1);
      return;
    }
    
    // Tab key for auto-complete (not implemented yet)
    if (e.key === 'Tab') {
      e.preventDefault();
      // TODO: Implement auto-complete
      return;
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