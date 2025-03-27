import { v4 as uuidv4 } from 'uuid';
import { 
  ParsedCommand, 
  CommandHistoryItem, 
  CommandType, 
  MCPFunctionResult,
  ProtocolStep
} from '../types/mcp';
import apiClient from '../api/client';
import { getCommandHelp } from './commandParser';
import { parseCommand } from './commandParser';
import { AppState } from '../context/AppContext';

interface CommandResult {
  output?: string;
  error?: string;
  info?: string;
}

/**
 * Execute a command string
 * @param commandString The command string to execute
 * @param state The current application state
 * @param dispatch The dispatch function
 * @returns The result of the command execution
 */
export const executeCommand = async (
  commandString: string,
  state: AppState,
  dispatch: React.Dispatch<any>
): Promise<CommandResult> => {
  // Parse the command
  const parsedCommand = parseCommand(commandString);

  // Handle invalid commands
  if (!parsedCommand.valid) {
    return {
      error: `Invalid command: ${parsedCommand.error}`
    };
  }

  // Handle special commands
  if (parsedCommand.type === 'help') {
    return handleHelpCommand();
  }

  if (parsedCommand.type === 'clear') {
    // Clear terminal history and protocol steps
    dispatch({ type: 'CLEAR_HISTORY' });
    dispatch({ type: 'CLEAR_PROTOCOL_STEPS' });
    return {
      info: 'Terminal cleared'
    };
  }

  if (parsedCommand.type === 'connect') {
    return handleConnectCommand(parsedCommand, dispatch);
  }

  // Validate connection for commands that require it
  if (!state.connection.connected) {
    return {
      error: 'Not connected to server. Use `connect` command first.'
    };
  }

  // Handle function calls
  if (parsedCommand.type === 'call') {
    try {
      const result = await apiClient.callFunction(
        parsedCommand.functionName,
        parsedCommand.parameters
      );

      // Add protocol step
      const protocolStep = {
        id: Date.now().toString(),
        type: 'http' as const,
        method: 'POST',
        endpoint: `/function/${parsedCommand.functionName}`,
        timestamp: new Date().toISOString(),
        data: {
          request: parsedCommand.parameters,
          response: result
        }
      };
      
      dispatch({ type: 'ADD_PROTOCOL_STEP', payload: protocolStep });

      return {
        output: JSON.stringify(result, null, 2)
      };
    } catch (error) {
      console.error('Error calling function:', error);
      return {
        error: error instanceof Error 
          ? error.message 
          : 'An unknown error occurred while calling function'
      };
    }
  }

  // Handle tool calls
  if (parsedCommand.type === 'tool') {
    try {
      const result = await apiClient.callTool(
        parsedCommand.functionName,
        parsedCommand.parameters
      );

      // Add protocol step
      const protocolStep = {
        id: Date.now().toString(),
        type: 'http' as const,
        method: 'POST',
        endpoint: `/tool/${parsedCommand.functionName}`,
        timestamp: new Date().toISOString(),
        data: {
          request: parsedCommand.parameters,
          response: result
        }
      };
      
      dispatch({ type: 'ADD_PROTOCOL_STEP', payload: protocolStep });

      return {
        output: JSON.stringify(result, null, 2)
      };
    } catch (error) {
      console.error('Error calling tool:', error);
      return {
        error: error instanceof Error 
          ? error.message 
          : 'An unknown error occurred while calling tool'
      };
    }
  }

  // Handle list command
  if (parsedCommand.type === 'list') {
    return handleListCommand(parsedCommand);
  }

  // If we get here, the command type is unknown
  return {
    error: `Unknown command type: ${parsedCommand.type}`
  };
};

/**
 * Handle help command
 */
const handleHelpCommand = (): CommandResult => {
  return {
    info: `
Available commands:
  help                                     - Show this help message
  clear                                    - Clear the terminal
  connect <url> <apiKey>                   - Connect to MCP server
  call <functionName> <parameters>         - Call a function
  tool <toolName> <parameters>             - Call a tool
  list functions                           - List available functions
  list tools                               - List available tools
`
  };
};

/**
 * Handle connect command
 */
const handleConnectCommand = async (
  command: any,
  dispatch: React.Dispatch<any>
): Promise<CommandResult> => {
  const { url, apiKey } = command.parameters;

  try {
    // Configure the API client
    apiClient.configure(url, apiKey);

    // Test the connection
    await apiClient.testConnection();

    // Update connection state
    dispatch({
      type: 'SET_CONNECTION',
      payload: {
        serverUrl: url,
        apiKey,
        connected: true
      }
    });

    return {
      info: `Connected to ${url}`
    };
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

    return {
      error: error instanceof Error 
        ? error.message 
        : 'Failed to connect to server'
    };
  }
};

/**
 * Handle list command
 */
const handleListCommand = async (command: any): Promise<CommandResult> => {
  try {
    if (command.listType === 'functions') {
      const functions = await apiClient.listFunctions();
      return {
        output: functions.map(f => f.name).join('\n')
      };
    } else if (command.listType === 'tools') {
      const tools = await apiClient.listTools();
      return {
        output: tools.map(t => t.name).join('\n')
      };
    } else {
      return {
        error: `Unknown list type: ${command.listType}`
      };
    }
  } catch (error) {
    console.error('Error listing items:', error);
    return {
      error: error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while listing items'
    };
  }
};

/**
 * Execute a parsed command and return the result
 * @param command - The parsed command to execute
 * @returns Promise resolving to the command result and protocol step
 */
export const executeCommand = async (
  command: ParsedCommand
): Promise<{
  result: any;
  historyItem: CommandHistoryItem;
  protocolStep?: ProtocolStep;
}> => {
  // If the command is not valid, return the error
  if (!command.valid) {
    return {
      result: { error: command.error },
      historyItem: createHistoryItem(command, { error: command.error }),
    };
  }

  const startTime = Date.now();
  let result: any;
  let protocolStep: ProtocolStep | undefined;

  try {
    switch (command.type) {
      case 'help':
        result = { message: getCommandHelp() };
        break;

      case 'clear':
        result = { message: 'Terminal cleared' };
        break;

      case 'history':
        // This is handled by the terminal component
        result = { message: 'Displaying command history' };
        break;

      case 'functions_list':
        const { requestTime: listRequestTime, response: functions } = await withTiming(() => 
          apiClient.listFunctions()
        );
        
        result = { functions };
        
        protocolStep = {
          id: uuidv4(),
          type: 'request',
          endpoint: '/api/functions',
          method: 'GET',
          timestamp: new Date().toISOString(),
          duration: listRequestTime,
          data: { response: functions }
        };
        break;

      case 'function_get':
        if (!command.functionName) {
          throw new Error('Function name is required');
        }
        
        const { requestTime: getRequestTime, response: functionDetails } = await withTiming(() => 
          apiClient.getFunction(command.functionName!)
        );
        
        result = { function: functionDetails };
        
        protocolStep = {
          id: uuidv4(),
          type: 'request',
          endpoint: `/api/functions/${command.functionName}`,
          method: 'GET',
          timestamp: new Date().toISOString(),
          duration: getRequestTime,
          data: { response: functionDetails }
        };
        break;

      case 'call_function':
        if (!command.functionName || !command.parameters) {
          throw new Error('Function name and parameters are required');
        }
        
        const { requestTime: callRequestTime, response: callResult } = await withTiming(() => 
          apiClient.callFunction({
            name: command.functionName!,
            parameters: command.parameters!,
          })
        );
        
        result = callResult;
        
        protocolStep = {
          id: uuidv4(),
          type: 'request',
          endpoint: '/api/functions/call',
          method: 'POST',
          timestamp: new Date().toISOString(),
          duration: callRequestTime,
          data: { 
            request: {
              name: command.functionName,
              parameters: command.parameters,
            },
            response: callResult
          }
        };
        break;

      case 'call_tool':
        if (!command.functionName || !command.parameters) {
          throw new Error('Tool name and parameters are required');
        }
        
        const { requestTime: toolRequestTime, response: toolResult } = await withTiming(() => 
          apiClient.callTool({
            name: command.functionName!,
            parameters: command.parameters!,
          })
        );
        
        result = toolResult;
        
        protocolStep = {
          id: uuidv4(),
          type: 'request',
          endpoint: '/api/tools/call',
          method: 'POST',
          timestamp: new Date().toISOString(),
          duration: toolRequestTime,
          data: { 
            request: {
              name: command.functionName,
              parameters: command.parameters,
            },
            response: toolResult
          }
        };
        break;

      case 'execute':
        if (!command.text) {
          throw new Error('Text is required');
        }
        
        const { requestTime: executeRequestTime, response: executeResult } = await withTiming(() => 
          apiClient.execute({
            text: command.text!,
          })
        );
        
        result = executeResult;
        
        protocolStep = {
          id: uuidv4(),
          type: 'request',
          endpoint: '/api/execute',
          method: 'POST',
          timestamp: new Date().toISOString(),
          duration: executeRequestTime,
          data: { 
            request: {
              text: command.text,
            },
            response: executeResult
          }
        };
        break;

      case 'stream_function':
        // Streaming is handled differently through WebSockets
        result = { 
          message: `Streaming from ${command.functionName}`,
          streaming: true,
          name: command.functionName,
          parameters: command.parameters
        };
        break;

      case 'stream_tool':
        // Streaming is handled differently through WebSockets
        result = { 
          message: `Streaming from tool ${command.functionName}`,
          streaming: true,
          name: command.functionName,
          parameters: command.parameters
        };
        break;

      default:
        result = { error: 'Unknown command type' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result = { error: errorMessage };
    
    if (protocolStep) {
      protocolStep.type = 'error';
      protocolStep.data = { ...protocolStep.data, error: errorMessage };
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  const historyItem = createHistoryItem(command, result, duration);

  return { result, historyItem, protocolStep };
};

/**
 * Create a history item from a command and result
 * @param command - The parsed command
 * @param result - The command result
 * @param duration - The duration of the command execution in milliseconds
 * @returns Command history item
 */
const createHistoryItem = (
  command: ParsedCommand,
  result: any,
  duration?: number
): CommandHistoryItem => {
  const timestamp = new Date().toISOString();
  
  // Create a string representation of the command
  let commandString = '';
  
  switch (command.type) {
    case 'functions_list':
      commandString = 'functions list';
      break;
    case 'function_get':
      commandString = `function get ${command.functionName}`;
      break;
    case 'call_function':
      commandString = `call ${command.functionName} ${JSON.stringify(command.parameters)}`;
      break;
    case 'call_tool':
      commandString = `tool ${command.functionName} ${JSON.stringify(command.parameters)}`;
      break;
    case 'execute':
      commandString = `execute "${command.text}"`;
      break;
    case 'stream_function':
      commandString = `stream ${command.functionName} ${JSON.stringify(command.parameters)}`;
      break;
    case 'stream_tool':
      commandString = `stream tool ${command.functionName} ${JSON.stringify(command.parameters)}`;
      break;
    default:
      commandString = command.type;
  }

  return {
    id: uuidv4(),
    timestamp,
    command: commandString,
    parsedCommand: command,
    response: result,
    duration,
    favorite: false,
  };
};

/**
 * Execute a function with timing information
 * @param fn - The async function to execute
 * @returns Promise resolving to the response and request time
 */
const withTiming = async <T>(fn: () => Promise<T>): Promise<{ response: T; requestTime: number }> => {
  const startTime = Date.now();
  const response = await fn();
  const endTime = Date.now();
  return { response, requestTime: endTime - startTime };
}; 