/**
 * Type definitions for the Model Context Protocol (MCP)
 * Based on the protocol schema from the MCP example server
 */

// JSON Schema Types
export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export interface JSONSchemaProperty {
  type?: JSONSchemaType | JSONSchemaType[];
  description?: string;
  format?: string;
  default?: any;
  enum?: any[];
  const?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  properties?: Record<string, JSONSchemaProperty>;
  additionalProperties?: boolean | JSONSchemaProperty;
  items?: JSONSchemaProperty | JSONSchemaProperty[];
  allOf?: JSONSchemaProperty[];
  anyOf?: JSONSchemaProperty[];
  oneOf?: JSONSchemaProperty[];
  not?: JSONSchemaProperty;
}

// Function Definition
export interface MCPFunctionDefinition {
  name: string;
  description: string;
  parameters: JSONSchemaProperty;
}

// Function Call
export interface MCPFunctionCall {
  name: string;
  parameters: Record<string, any>;
}

// Function Result
export interface MCPFunctionResult {
  id?: string;
  status: 'complete' | 'in_progress' | 'error';
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

// Stream Chunk
export interface MCPStreamChunk {
  id: string;
  status: 'in_progress' | 'complete' | 'error';
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// API Responses
export interface ListFunctionsResponse {
  functions: MCPFunctionDefinition[];
}

export interface GetFunctionResponse {
  function: MCPFunctionDefinition;
}

export interface CallFunctionResponse extends MCPFunctionResult {}

export interface CallToolResponse extends MCPFunctionResult {}

export interface ExecuteResponse extends MCPFunctionResult {}

// Request Types
export interface CallFunctionRequest {
  name: string;
  parameters: Record<string, any>;
}

export interface CallToolRequest {
  name: string;
  parameters: Record<string, any>;
}

export interface ExecuteRequest {
  text: string;
  functions?: MCPFunctionDefinition[];
}

// WebSocket Message Types
export type WebSocketMessageType = 'connect' | 'disconnect' | 'message' | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: MCPStreamChunk;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

// Command Types for the Terminal Interface
export type CommandType = 
  | 'functions_list' 
  | 'tools_list'
  | 'function_get' 
  | 'call_function' 
  | 'call_tool' 
  | 'execute' 
  | 'stream_function' 
  | 'stream_tool' 
  | 'help' 
  | 'clear' 
  | 'history'
  | 'connect';

export interface ParsedCommand {
  type: CommandType;
  functionName?: string;
  parameters?: Record<string, any>;
  text?: string;
  valid: boolean;
  error?: string;
}

// Connection Settings
export interface ConnectionSettings {
  serverUrl: string;
  apiKey: string;
  connected: boolean;
  error?: string;
}

// Command History Item
export interface CommandHistoryItem {
  id: string;
  timestamp: string;
  command: string;
  parsedCommand: ParsedCommand;
  response?: any;
  duration?: number;
  favorite: boolean;
}

// Application Settings
export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  showTimestamps: boolean;
  expandResponses: boolean;
  maxHistoryItems: number;
}

// Protocol Visualization Item
export interface ProtocolStep {
  id: string;
  type: 'request' | 'response' | 'websocket' | 'error';
  endpoint: string;
  method?: string;
  data?: any;
  timestamp: string;
  duration?: number;
}

// WebSocket Connection State
export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastMessage?: MCPStreamChunk;
  messages: MCPStreamChunk[];
}

// Favorite Command
export interface FavoriteCommand {
  id: string;
  name: string;
  command: string;
  description?: string;
  createdAt: string;
} 