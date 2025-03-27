import { useState, useCallback } from 'react';
import apiClient from '../api/client';
import { useApp } from '../context/AppContext';
import { 
  MCPFunctionDefinition, 
  CallFunctionRequest, 
  CallFunctionResponse,
  CallToolRequest,
  CallToolResponse,
  ExecuteRequest,
  ExecuteResponse
} from '../types/mcp';

/**
 * Base hook for API calls with loading and error state
 */
const useApiBase = <T,>(apiCall: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  return {
    data,
    isLoading,
    error,
    execute
  };
};

/**
 * Hook to list all available functions
 */
export const useListFunctions = () => {
  const { dispatch } = useApp();
  
  const apiCall = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      dispatch({ 
        type: 'ADD_PROTOCOL_STEP', 
        payload: {
          id: `functions_list_${startTime}`,
          type: 'request',
          endpoint: '/api/functions',
          method: 'GET',
          timestamp: new Date().toISOString()
        }
      });
      
      const functions = await apiClient.listFunctions();
      
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `functions_list_response_${startTime}`,
          type: 'response',
          endpoint: '/api/functions',
          data: { functions },
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      return functions;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `functions_list_error_${startTime}`,
          type: 'error',
          endpoint: '/api/functions',
          data: { error },
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      throw error;
    }
  }, [dispatch]);

  return useApiBase(apiCall);
};

/**
 * Hook to get a specific function definition
 */
export const useGetFunction = (functionName: string) => {
  const { dispatch } = useApp();
  
  const apiCall = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `function_get_${functionName}_${startTime}`,
          type: 'request',
          endpoint: `/api/functions/${functionName}`,
          method: 'GET',
          timestamp: new Date().toISOString()
        }
      });
      
      const functionDef = await apiClient.getFunction(functionName);
      
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `function_get_${functionName}_response_${startTime}`,
          type: 'response',
          endpoint: `/api/functions/${functionName}`,
          data: { function: functionDef },
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      return functionDef;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `function_get_${functionName}_error_${startTime}`,
          type: 'error',
          endpoint: `/api/functions/${functionName}`,
          data: { error },
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      throw error;
    }
  }, [functionName, dispatch]);

  return useApiBase(apiCall);
};

/**
 * Hook to call a function
 */
export const useCallFunction = () => {
  const { dispatch } = useApp();
  
  const execute = useCallback(async (request: CallFunctionRequest) => {
    const startTime = Date.now();
    let isLoading = true;
    let error = null;
    
    try {
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `call_function_${request.name}_${startTime}`,
          type: 'request',
          endpoint: '/api/functions/call',
          method: 'POST',
          data: request,
          timestamp: new Date().toISOString()
        }
      });
      
      const response = await apiClient.callFunction(request);
      
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `call_function_${request.name}_response_${startTime}`,
          type: 'response',
          endpoint: '/api/functions/call',
          data: response,
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      isLoading = false;
      return response;
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `call_function_${request.name}_error_${startTime}`,
          type: 'error',
          endpoint: '/api/functions/call',
          data: { error: errorMessage },
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      isLoading = false;
      error = errorMessage;
      throw err;
    }
  }, [dispatch]);

  return {
    callFunction: execute
  };
};

/**
 * Hook to call a tool
 */
export const useCallTool = () => {
  const { dispatch } = useApp();
  
  const execute = useCallback(async (request: CallToolRequest) => {
    const startTime = Date.now();
    
    try {
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `call_tool_${request.name}_${startTime}`,
          type: 'request',
          endpoint: '/api/tools/call',
          method: 'POST',
          data: request,
          timestamp: new Date().toISOString()
        }
      });
      
      const response = await apiClient.callTool(request);
      
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `call_tool_${request.name}_response_${startTime}`,
          type: 'response',
          endpoint: '/api/tools/call',
          data: response,
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `call_tool_${request.name}_error_${startTime}`,
          type: 'error',
          endpoint: '/api/tools/call',
          data: { error },
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      throw error;
    }
  }, [dispatch]);

  return {
    callTool: execute
  };
};

/**
 * Hook to execute text commands
 */
export const useExecute = () => {
  const { dispatch } = useApp();
  
  const execute = useCallback(async (request: ExecuteRequest) => {
    const startTime = Date.now();
    
    try {
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `execute_${startTime}`,
          type: 'request',
          endpoint: '/api/execute',
          method: 'POST',
          data: request,
          timestamp: new Date().toISOString()
        }
      });
      
      const response = await apiClient.execute(request);
      
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `execute_response_${startTime}`,
          type: 'response',
          endpoint: '/api/execute',
          data: response,
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      dispatch({
        type: 'ADD_PROTOCOL_STEP',
        payload: {
          id: `execute_error_${startTime}`,
          type: 'error',
          endpoint: '/api/execute',
          data: { error },
          timestamp: new Date().toISOString(),
          duration
        }
      });
      
      throw error;
    }
  }, [dispatch]);

  return {
    execute
  };
};

/**
 * Hook to test connection status
 */
export const useConnectionStatus = () => {
  const { state, testConnection, updateConnection } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    const result = await testConnection();
    setIsLoading(false);
    return result;
  }, [testConnection]);

  return {
    isConnected: state.connection.connected,
    connectionError: state.connection.error,
    serverUrl: state.connection.serverUrl,
    apiKey: state.connection.apiKey,
    isLoading,
    testConnection: checkConnection,
    updateConnection
  };
};

export default {
  useListFunctions,
  useGetFunction,
  useCallFunction,
  useCallTool,
  useExecute,
  useConnectionStatus
}; 