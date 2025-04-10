# Cribl MCP Server

A Model Context Protocol (MCP) server to bridge AI interactions with a Cribl API.

## Setup

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Create a `.env` file from `.env.example`.
4.  Fill in your Cribl Base URL (`CRIBL_BASE_URL`).
5.  Configure Authentication in `.env`:
    *   Set `CRIBL_AUTH_TYPE` to `cloud` or `local`.
    *   If `cloud`: Provide `CRIBL_CLIENT_ID` and `CRIBL_CLIENT_SECRET` from your Cribl.Cloud API Credentials.
    *   If `local`: Provide `CRIBL_USERNAME` and `CRIBL_PASSWORD` for a local user on your customer-managed instance.
6.  Run the server:
    *   Development: `npm run dev`
    *   Production: `npm run build && npm run start`

## Usage

Connect an MCP client (like the MCP Inspector or a compatible AI chat interface) to the server's standard I/O (using `npm run start` or `node dist/server.js` as the command).

Available tools will be listed by the client upon connection.

## Authentication Details

The server automatically handles acquiring and refreshing API tokens based on the `CRIBL_AUTH_TYPE` set in your `.env` file.

*   **Cloud:** Uses Client ID/Secret to obtain a 24-hour bearer token from Cribl's OAuth endpoint and refreshes it automatically before expiry.
*   **Local:** Uses Username/Password to log in via the `/api/v1/auth/login` endpoint and attempts to refresh the token periodically (currently hourly).
