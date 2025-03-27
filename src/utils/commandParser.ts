import { ParsedCommand, CommandType, JSONSchemaProperty, MCPFunctionDefinition } from '../types/mcp';

/**
 * Parse a command string into a structured command object
 * @param commandString - The raw command string to parse
 * @returns Parsed command object
 */
export const parseCommand = (commandString: string): ParsedCommand => {
  // Trim any leading/trailing whitespace
  const command = commandString.trim();
  
  // If empty command, return invalid result
  if (!command) {
    return {
      type: 'help',
      valid: false,
      error: 'Command cannot be empty',
    };
  }

  // Special commands handling
  if (command === 'help') {
    return { type: 'help', valid: true };
  }

  if (command === 'clear') {
    return { type: 'clear', valid: true };
  }

  if (command === 'history') {
    return { type: 'history', valid: true };
  }

  // Connect command
  const connectMatch = command.match(/^connect\s+([^\s]+)\s+([^\s]+)$/i);
  if (connectMatch) {
    return {
      type: 'connect',
      parameters: {
        url: connectMatch[1],
        apiKey: connectMatch[2]
      },
      valid: true,
    };
  }

  // functions list
  if (command === 'functions list' || command === 'list functions') {
    return { type: 'functions_list', valid: true };
  }

  // tools list
  if (command === 'tools list' || command === 'list tools') {
    return { type: 'tools_list', valid: true };
  }

  // function get <n>
  const functionGetMatch = command.match(/^function\s+get\s+([a-zA-Z0-9._]+)$/i);
  if (functionGetMatch) {
    return {
      type: 'function_get',
      functionName: functionGetMatch[1],
      valid: true,
    };
  }

  // call <n> <params>
  const callMatch = command.match(/^call\s+([a-zA-Z0-9._]+)\s+(.+)$/i);
  if (callMatch) {
    try {
      const parameters = JSON.parse(callMatch[2]);
      return {
        type: 'call_function',
        functionName: callMatch[1],
        parameters,
        valid: true,
      };
    } catch (error) {
      return {
        type: 'call_function',
        functionName: callMatch[1],
        valid: false,
        error: 'Invalid JSON parameters. Parameters must be a valid JSON object.',
      };
    }
  }

  // tool <n> <params>
  const toolMatch = command.match(/^tool\s+([a-zA-Z0-9._]+)\s+(.+)$/i);
  if (toolMatch) {
    try {
      const parameters = JSON.parse(toolMatch[2]);
      return {
        type: 'call_tool',
        functionName: toolMatch[1],
        parameters,
        valid: true,
      };
    } catch (error) {
      return {
        type: 'call_tool',
        functionName: toolMatch[1],
        valid: false,
        error: 'Invalid JSON parameters. Parameters must be a valid JSON object.',
      };
    }
  }

  // stream <n> <params>
  const streamMatch = command.match(/^stream\s+([a-zA-Z0-9._]+)\s+(.+)$/i);
  if (streamMatch) {
    try {
      const parameters = JSON.parse(streamMatch[2]);
      return {
        type: 'stream_function',
        functionName: streamMatch[1],
        parameters,
        valid: true,
      };
    } catch (error) {
      return {
        type: 'stream_function',
        functionName: streamMatch[1],
        valid: false,
        error: 'Invalid JSON parameters. Parameters must be a valid JSON object.',
      };
    }
  }

  // execute "<text>"
  const executeMatch = command.match(/^execute\s+"(.+)"$/i);
  if (executeMatch) {
    return {
      type: 'execute',
      text: executeMatch[1],
      valid: true,
    };
  }

  // If nothing matched, return an invalid command
  return {
    type: 'help',
    valid: false,
    error: `Unrecognized command: "${command}". Type "help" for a list of commands.`,
  };
};

/**
 * Validate parameters against a function schema
 * @param parameters - The parameters to validate
 * @param schema - The JSON schema to validate against
 * @returns Validation result with errors if any
 */
export const validateParameters = (
  parameters: Record<string, any>, 
  schema: JSONSchemaProperty
): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];
  
  // Check required properties
  if (schema.required) {
    for (const requiredProp of schema.required) {
      if (!(requiredProp in parameters)) {
        errors.push(`Missing required parameter: ${requiredProp}`);
      }
    }
  }
  
  // Check property types and constraints
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName in parameters) {
        const value = parameters[propName];
        
        // Type validation
        if (propSchema.type) {
          const types = Array.isArray(propSchema.type) ? propSchema.type : [propSchema.type];
          let typeValid = false;
          
          for (const type of types) {
            switch (type) {
              case 'string':
                typeValid = typeof value === 'string';
                break;
              case 'number':
              case 'integer':
                typeValid = typeof value === 'number';
                if (type === 'integer' && typeValid) {
                  typeValid = Number.isInteger(value);
                }
                break;
              case 'boolean':
                typeValid = typeof value === 'boolean';
                break;
              case 'object':
                typeValid = typeof value === 'object' && value !== null && !Array.isArray(value);
                break;
              case 'array':
                typeValid = Array.isArray(value);
                break;
              case 'null':
                typeValid = value === null;
                break;
            }
            
            if (typeValid) break;
          }
          
          if (!typeValid) {
            errors.push(`Invalid type for parameter ${propName}. Expected ${types.join(' or ')}.`);
          }
        }
        
        // String constraints
        if (propSchema.type === 'string' && typeof value === 'string') {
          if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
            errors.push(`Parameter ${propName} is too short. Minimum length: ${propSchema.minLength}.`);
          }
          
          if (propSchema.maxLength !== undefined && value.length > propSchema.maxLength) {
            errors.push(`Parameter ${propName} is too long. Maximum length: ${propSchema.maxLength}.`);
          }
          
          if (propSchema.pattern && !new RegExp(propSchema.pattern).test(value)) {
            errors.push(`Parameter ${propName} does not match required pattern.`);
          }
        }
        
        // Number constraints
        if ((propSchema.type === 'number' || propSchema.type === 'integer') && typeof value === 'number') {
          if (propSchema.minimum !== undefined && value < propSchema.minimum) {
            errors.push(`Parameter ${propName} is too small. Minimum value: ${propSchema.minimum}.`);
          }
          
          if (propSchema.maximum !== undefined && value > propSchema.maximum) {
            errors.push(`Parameter ${propName} is too large. Maximum value: ${propSchema.maximum}.`);
          }
        }
        
        // Array constraints
        if (propSchema.type === 'array' && Array.isArray(value)) {
          if (propSchema.minItems !== undefined && value.length < propSchema.minItems) {
            errors.push(`Array ${propName} has too few items. Minimum: ${propSchema.minItems}.`);
          }
          
          if (propSchema.maxItems !== undefined && value.length > propSchema.maxItems) {
            errors.push(`Array ${propName} has too many items. Maximum: ${propSchema.maxItems}.`);
          }
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Validate a command against a function definition
 * @param command - The parsed command
 * @param functionDef - The function definition to validate against
 * @returns Updated command with validation results
 */
export const validateCommand = (
  command: ParsedCommand,
  functionDef: MCPFunctionDefinition
): ParsedCommand => {
  // Only validate commands with parameters
  if (!command.parameters) {
    return command;
  }
  
  const validation = validateParameters(command.parameters, functionDef.parameters);
  
  if (!validation.valid) {
    return {
      ...command,
      valid: false,
      error: `Parameter validation failed: ${validation.errors?.join('; ')}`
    };
  }
  
  return command;
};

/**
 * Generate command help text
 * @returns Help text for available commands
 */
export const getCommandHelp = (): string => {
  return `
Available commands:

connect <url> <apiKey>            - Connect to an MCP server
list functions                     - List all available functions
list tools                         - List all available tools
call <n> <params>                  - Call a function with parameters
tool <n> <params>                  - Call a tool with parameters
stream <n> <params>                - Stream results from a function
function get <n>                   - Get detailed information about a function
execute "<text>"                   - Execute direct text processing

Special commands:
help                               - Show this help message
clear                              - Clear the terminal
history                            - Show command history

Examples:
connect http://localhost:8000 api-key-1234
list functions
call calculator.add {"a": 5, "b": 3}
tool text.uppercase {"text": "hello world"}
`.trim();
};

/**
 * Get example commands
 * @returns Array of example commands
 */
export const getExampleCommands = (): string[] => [
  'connect http://localhost:8000 api-key-1234',
  'list functions',
  'list tools',
  'call calculator.add {"a": 5, "b": 3}',
  'tool text.uppercase {"text": "hello world"}',
  'stream long_running {"duration": 5}',
  'function get calculator.add',
  'execute "Calculate 5 + 3"',
];

/**
 * Generate a placeholder for the command input
 * @returns Random example command as placeholder
 */
export const getRandomPlaceholder = (): string => {
  const examples = getExampleCommands();
  return examples[Math.floor(Math.random() * examples.length)];
}; 