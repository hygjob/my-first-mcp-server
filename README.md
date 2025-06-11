# My First MCP Server

A Model Context Protocol (MCP) server implementation with TypeScript.


#### write
2025.6.11

## Prerequisites

- Node.js (v22 or higher recommended)
- npm

## Installation

```bash
npm install
```

## Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server with hot reload using tsx |
| `npm run dev2` | Alternative dev server using ts-node/esm |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run the built project |
| `npm run inspect` | Inspect MCP server configuration |
| `npm test` | Run tests |

## Project Structure

```
my-first-mcp-server/
├── src/
│   └── index.ts    # Main server implementation
├── dist/           # Compiled JavaScript output
├── package.json
└── README.md
```

## Features

### Tools
- **add**: Add two numbers
- **multiply**: Multiply two numbers
- **greetmsg**: Generate greeting message
- **get-weather**: Get weather information for a city
- **debug-example**: Debugging tool with logging

### Resources
- Server information
- Dynamic greeting messages

## Dependencies

### Main Dependencies
- @modelcontextprotocol/sdk: ^1.12.1
- express: ^5.1.0
- zod: ^3.25.58

### Development Dependencies
- TypeScript ecosystem tools
- Jest for testing
- Node.js type definitions

## License

ISC
