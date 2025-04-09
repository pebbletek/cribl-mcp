# Cribl MCP Server

A Model Context Protocol (MCP) server to bridge AI interactions with a Cribl API.

## Setup

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Create a `.env` file from `.env.example` and fill in your Cribl Base URL and Auth Token.
4.  Run the server:
    *   Development: `npm run dev`
    *   Production: `npm run build && npm run start`

## Usage

Connect an MCP client (like the MCP Inspector or a compatible AI chat interface) to the server's standard I/O.

Available tools will be listed by the client upon connection.
