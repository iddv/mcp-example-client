import { v4 as uuidv4 } from 'uuid';
import { 
  ParsedCommand, 
  CommandHistoryItem, 
  CommandType, 
  MCPFunctionResult,
  ProtocolStep,
  MCPFunctionDefinition,
  CallFunctionRequest,
  ExecuteRequest
} from '../types/mcp';
import apiClient from '../api/client';
import { getCommandHelp, parseCommand, validateCommand } from './commandParser';

interface CommandResult {
  output?: string;
  error?: string;
  info?: string;
}

/**
 * Execute a parsed command
 * @param command - The parsed command to execute
 * @param functionSchema - Optional function schema for validation
 * @returns The execution result, history item and protocol step
 */
export const executeCommand = async (
  command: ParsedCommand,
  functionSchema?: MCPFunctionDefinition
): Promise<{
  result: any;
  historyItem: CommandHistoryItem;
  protocolStep?: ProtocolStep;
}> => {
  // Start timing the request
  const startTime = Date.now();
  let result: any = null;
  let error: string | undefined = undefined;
  let protocolStep: ProtocolStep | undefined = undefined;
  
  // Validate command against schema if provided
  if (functionSchema && command.parameters) {
    command = validateCommand(command, functionSchema);
    if (!command.valid) {
      return {
        result: { error: command.error },
        historyItem: createHistoryItem(command, { error: command.error }, Date.now() - startTime)
      };
    }
  }

  try {
    switch (command.type) {
      case 'help':
        result = { message: getCommandHelp() };
        break;
        
      case 'clear':
        result = { message: 'Terminal cleared' };
        break;
        
      case 'history':
        result = { message: 'Command history' };
        break;
        
      case 'connect':
        if (command.parameters) {
          const connected = await apiClient.testConnection();
          if (connected) {
            result = { message: `Connected to ${command.parameters.url}` };
          } else {
            error = `Failed to connect to ${command.parameters.url}`;
          }
        } else {
          error = 'Missing connection parameters';
        }
        break;
        
      case 'functions_list':
        try {
          const functions = await apiClient.listFunctions();
          result = { functions };
          
          protocolStep = {
            id: uuidv4(),
            type: 'request',
            method: 'GET',
            endpoint: '/api/functions',
            timestamp: new Date().toISOString(),
            data: { response: functions },
            duration: Date.now() - startTime
          };
        } catch (err) {
          error = err instanceof Error ? err.message : 'Failed to list functions';
        }
        break;
        
      case 'tools_list':
        try {
          // Currently not implemented in API client
          result = { message: 'Tool listing is not currently implemented' };
        } catch (err) {
          error = err instanceof Error ? err.message : 'Failed to list tools';
        }
        break;
        
      case 'function_get':
        try {
          if (!command.functionName) {
            error = 'Missing function name';
            break;
          }
          
          const functionDef = await apiClient.getFunction(command.functionName);
          result = { function: functionDef };
          
          protocolStep = {
            id: uuidv4(),
            type: 'request',
            method: 'GET',
            endpoint: `/api/functions/${command.functionName}`,
            timestamp: new Date().toISOString(),
            data: { response: functionDef },
            duration: Date.now() - startTime
          };
        } catch (err) {
          error = err instanceof Error ? err.message : `Failed to get function: ${command.functionName}`;
        }
        break;
        
      case 'call_function':
        try {
          if (!command.functionName) {
            error = 'Missing function name';
            break;
          }
          
          const callRequest: CallFunctionRequest = {
            name: command.functionName,
            parameters: command.parameters || {}
          };
          
          const callResult = await apiClient.callFunction(callRequest);
          result = callResult;
          
          protocolStep = {
            id: uuidv4(),
            type: 'request',
            method: 'POST',
            endpoint: `/api/functions/call`,
            timestamp: new Date().toISOString(),
            data: { 
              request: callRequest, 
              response: callResult 
            },
            duration: Date.now() - startTime
          };
        } catch (err) {
          error = err instanceof Error ? err.message : `Failed to call function: ${command.functionName}`;
        }
        break;
        
      case 'call_tool':
        try {
          if (!command.functionName) {
            error = 'Missing tool name';
            break;
          }
          
          const toolRequest: CallFunctionRequest = {
            name: command.functionName,
            parameters: command.parameters || {}
          };
          
          const toolResult = await apiClient.callTool(toolRequest);
          result = toolResult;
          
          protocolStep = {
            id: uuidv4(),
            type: 'request',
            method: 'POST',
            endpoint: `/api/tools/call`,
            timestamp: new Date().toISOString(),
            data: { 
              request: toolRequest, 
              response: toolResult 
            },
            duration: Date.now() - startTime
          };
        } catch (err) {
          error = err instanceof Error ? err.message : `Failed to call tool: ${command.functionName}`;
        }
        break;
        
      case 'execute':
        try {
          if (!command.text) {
            error = 'Missing text to execute';
            break;
          }
          
          const executeRequest: ExecuteRequest = {
            text: command.text
          };
          
          const executeResult = await apiClient.execute(executeRequest);
          result = executeResult;
          
          protocolStep = {
            id: uuidv4(),
            type: 'request',
            method: 'POST',
            endpoint: '/api/execute',
            timestamp: new Date().toISOString(),
            data: { 
              request: executeRequest, 
              response: executeResult 
            },
            duration: Date.now() - startTime
          };
        } catch (err) {
          error = err instanceof Error ? err.message : 'Failed to execute text';
        }
        break;
        
      case 'stream_function':
        // Streaming is handled separately via WebSocket
        result = { 
          message: `Starting stream for function: ${command.functionName}`,
          streaming: true
        };
        break;
        
      default:
        error = `Unsupported command type: ${command.type}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'An unknown error occurred';
  }
  
  // Calculate request duration
  const duration = Date.now() - startTime;
  
  // If there was an error, set it on the result
  if (error) {
    result = { error };
  }
  
  // Create history item
  const historyItem = createHistoryItem(command, result, duration);
  
  return {
    result,
    historyItem,
    protocolStep
  };
};

/**
 * Create a history item from a command and result
 */
const createHistoryItem = (
  command: ParsedCommand,
  result: any,
  duration?: number
): CommandHistoryItem => {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    command: formatCommandString(command),
    parsedCommand: command,
    response: result,
    duration,
    favorite: false
  };
};

/**
 * Format a parsed command back to a string representation
 */
const formatCommandString = (command: ParsedCommand): string => {
  switch (command.type) {
    case 'help':
    case 'clear':
    case 'history':
    case 'functions_list':
    case 'tools_list':
      return command.type.replace('_', ' ');
      
    case 'connect':
      if (command.parameters) {
        return `connect ${command.parameters.url} ${command.parameters.apiKey}`;
      }
      return 'connect';
      
    case 'function_get':
      return `function get ${command.functionName || ''}`;
      
    case 'call_function':
      return `call ${command.functionName || ''} ${formatParams(command.parameters)}`;
      
    case 'call_tool':
      return `tool ${command.functionName || ''} ${formatParams(command.parameters)}`;
      
    case 'stream_function':
      return `stream ${command.functionName || ''} ${formatParams(command.parameters)}`;
      
    case 'execute':
      return `execute "${command.text || ''}"`;
      
    default:
      return 'unknown command';
  }
};

/**
 * Format parameters as a JSON string
 */
const formatParams = (params: any): string => {
  if (!params) return '{}';
  try {
    return JSON.stringify(params);
  } catch (e) {
    return '{}';
  }
}; 