import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ListFunctionsResponse,
  GetFunctionResponse,
  CallFunctionRequest,
  CallFunctionResponse,
  CallToolRequest,
  CallToolResponse,
  ExecuteRequest,
  ExecuteResponse,
  MCPFunctionDefinition,
} from '../types/mcp';

/**
 * MCP API Client for interacting with the MCP server
 */
export class MCPApiClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  /**
   * Create a new MCP API client
   * @param baseUrl - The base URL of the MCP server
   * @param apiKey - The API key for authentication
   */
  constructor(baseUrl: string = 'http://localhost:8000', apiKey: string = 'test-key') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for API key
    this.client.interceptors.request.use(
      (config) => {
        config.headers['X-API-Key'] = this.apiKey;
        console.log('Sending request with API key:', this.apiKey);
        console.log('Request headers:', config.headers);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Update the API configuration
   * @param baseUrl - New base URL
   * @param apiKey - New API key
   */
  public updateConfig(baseUrl?: string, apiKey?: string): void {
    if (baseUrl) {
      this.baseUrl = baseUrl;
      this.client.defaults.baseURL = baseUrl;
    }
    
    if (apiKey) {
      this.apiKey = apiKey;
    }
    
    console.log('API client configuration updated:', {
      baseUrl: this.baseUrl,
      apiKey: this.apiKey
    });
  }

  /**
   * Get the current connection settings
   */
  public getConnectionSettings() {
    return {
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
    };
  }

  /**
   * Test the connection to the server
   * @returns Promise that resolves to true if connection is successful
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.listFunctions();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all available functions on the server
   * @returns Promise that resolves to the list of functions
   */
  public async listFunctions(): Promise<MCPFunctionDefinition[]> {
    const response = await this.client.get<ListFunctionsResponse>('/api/functions');
    return response.data.functions;
  }

  /**
   * Get details about a specific function
   * @param name - The name of the function
   * @returns Promise that resolves to the function definition
   */
  public async getFunction(name: string): Promise<MCPFunctionDefinition> {
    const response = await this.client.get<GetFunctionResponse>(`/api/functions/${name}`);
    return response.data.function;
  }

  /**
   * Call a function on the server
   * @param request - The function call request
   * @returns Promise that resolves to the function result
   */
  public async callFunction(request: CallFunctionRequest): Promise<CallFunctionResponse> {
    const response = await this.client.post<CallFunctionResponse>('/api/functions/call', request);
    return response.data;
  }

  /**
   * Call a tool on the server
   * @param request - The tool call request
   * @returns Promise that resolves to the tool result
   */
  public async callTool(request: CallToolRequest): Promise<CallToolResponse> {
    const response = await this.client.post<CallToolResponse>('/api/tools/call', request);
    return response.data;
  }

  /**
   * Execute a text command on the server
   * @param request - The execute request
   * @returns Promise that resolves to the execution result
   */
  public async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    const response = await this.client.post<ExecuteResponse>('/api/execute', request);
    return response.data;
  }

  /**
   * Get the WebSocket URL for function streaming
   * @returns WebSocket URL for function streaming
   */
  public getFunctionStreamUrl(): string {
    return `${this.baseUrl.replace('http', 'ws')}/api/functions/stream`;
  }

  /**
   * Get the WebSocket URL for tool streaming
   * @returns WebSocket URL for tool streaming
   */
  public getToolStreamUrl(): string {
    return `${this.baseUrl.replace('http', 'ws')}/api/tools/stream`;
  }
}

// Create a singleton instance of the API client
export const apiClient = new MCPApiClient();

export default apiClient; 