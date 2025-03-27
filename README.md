# MCP Example Client

A modern terminal-style UI client for interacting with MCP (Model Control Protocol) servers, built with React, TypeScript, and Vite.

## Features

- Interactive terminal interface with command history
- Real-time streaming responses
- Multi-tab interface for parallel testing
- Favorites system for saving common commands
- Protocol visualization with timing indicators
- Command builder UI for complex parameters
- Import/export functionality for saving and sharing sessions
- Keyboard shortcuts for common operations
- Monaco editor integration for command input

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-example-client.git
cd mcp-example-client

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

This will start the development server at http://localhost:5173

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Configuration

By default, the client connects to an MCP server at `http://localhost:8000` with a test API key. You can change these settings in the client UI.

## Project Structure

```
src/
├── api/            # API client and WebSocket implementations
├── assets/         # Static assets
├── components/     # React components
│   ├── CommandBuilder/  # Command builder UI components
│   ├── Layout/     # Main layout components
│   ├── Protocol/   # Protocol visualization components
│   ├── Sidebar/    # Sidebar components
│   ├── Tabs/       # Tab management components
│   └── Terminal/   # Terminal interface components
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Implementation Status

See [llm/progress.md](llm/progress.md) for detailed implementation progress.

## License

[MIT](LICENSE)
