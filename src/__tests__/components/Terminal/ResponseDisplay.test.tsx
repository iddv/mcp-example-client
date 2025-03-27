import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponseDisplay from '../../../components/Terminal/ResponseDisplay';
import { CommandHistoryItem, ParsedCommand } from '../../../types/mcp';

// Mock the navigator.clipboard.writeText function
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ResponseDisplay Component', () => {
  const mockToggleFavorite = jest.fn();
  const timestamp = new Date('2023-01-01T12:00:00Z').toISOString();
  
  // Mock parsed command for all tests
  const mockParsedCommand: ParsedCommand = {
    type: 'call_function',
    functionName: 'testFunction',
    parameters: {},
    valid: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders command and timestamp correctly', () => {
    const historyItem: CommandHistoryItem = {
      id: '1',
      command: 'test command',
      timestamp,
      parsedCommand: mockParsedCommand,
      favorite: false,
      response: { message: 'Test response' },
    };

    render(
      <ResponseDisplay
        historyItem={historyItem}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    expect(screen.getByText('test command')).toBeInTheDocument();
    // Extract just the time part for comparison
    const timeStr = new Date(timestamp).toLocaleTimeString();
    expect(screen.getByText(timeStr)).toBeInTheDocument();
  });

  test('displays message response correctly', () => {
    const historyItem: CommandHistoryItem = {
      id: '1',
      command: 'test command',
      timestamp,
      parsedCommand: mockParsedCommand,
      favorite: false,
      response: { message: 'Test response message' },
    };

    render(
      <ResponseDisplay
        historyItem={historyItem}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    expect(screen.getByText('Test response message')).toBeInTheDocument();
  });

  test('displays error response correctly', () => {
    const historyItem: CommandHistoryItem = {
      id: '1',
      command: 'test command',
      timestamp,
      parsedCommand: mockParsedCommand,
      favorite: false,
      response: { error: 'Test error message' },
    };

    render(
      <ResponseDisplay
        historyItem={historyItem}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('toggle favorite button works', () => {
    const historyItem: CommandHistoryItem = {
      id: '1',
      command: 'test command',
      timestamp,
      parsedCommand: mockParsedCommand,
      favorite: false,
      response: { message: 'Test response' },
    };

    render(
      <ResponseDisplay
        historyItem={historyItem}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    fireEvent.click(screen.getByTitle('Add to favorites'));
    expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
  });

  test('copy button copies response to clipboard', () => {
    const historyItem: CommandHistoryItem = {
      id: '1',
      command: 'test command',
      timestamp,
      parsedCommand: mockParsedCommand,
      favorite: false,
      response: { message: 'Test response' },
    };

    render(
      <ResponseDisplay
        historyItem={historyItem}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    fireEvent.click(screen.getByTitle('Copy response'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(historyItem.response, null, 2));
  });

  test('expand/collapse button toggles content visibility', () => {
    const historyItem: CommandHistoryItem = {
      id: '1',
      command: 'test command',
      timestamp,
      parsedCommand: mockParsedCommand,
      favorite: false,
      response: { message: 'Test response' },
    };

    render(
      <ResponseDisplay
        historyItem={historyItem}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    // Content should be visible initially
    expect(screen.getByText('Test response')).toBeInTheDocument();

    // Click collapse button
    fireEvent.click(screen.getByTitle('Collapse'));

    // Content should not be visible
    expect(screen.queryByText('Test response')).not.toBeInTheDocument();

    // Click expand button
    fireEvent.click(screen.getByTitle('Expand'));

    // Content should be visible again
    expect(screen.getByText('Test response')).toBeInTheDocument();
  });
}); 