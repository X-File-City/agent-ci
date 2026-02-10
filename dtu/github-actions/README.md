# Digital Twin Universe (DTU) - GitHub Actions

This is a TypeScript package that provides tools and mocks to simulate GitHub Actions workflows locally.

## Purpose

The DTU allows developers to run and test the `oa-1-bridge` and `oa-1-runner` integration without deploying to GitHub. It mirrors GitHub's REST API and handles webhook simulation.

## Setup

1.  **Install Dependencies**:
    ```bash
    cd dtu/github-actions
    pnpm install
    ```
2.  **Environment Variables**:
    Create a `.env` file in this directory or set them in your shell:
    - `BRIDGE_URL`: The URL of your local bridge (e.g., `http://localhost:8910`).
    - `GITHUB_WEBHOOK_SECRET`: The secret used to sign webhooks.
    - `DTU_URL`: The URL where this mock server will run (default: `http://localhost:3333`).

## Usage

1.  **Start the Mock Server**:
    ```bash
    pnpm run server:dev
    ```
2.  **Run Simulation**:
    ```bash
    pnpm run simulate:dev <event_name>
    ```
    (e.g., `pnpm run simulate:dev push`)

## Structure

-   `src/`:
    -   `config.ts`: Zod-based configuration.
    -   `server.ts`: Mock GitHub API server.
    -   `simulate.ts`: Webhook simulation script.
-   `events/`: Mock GitHub JSON payloads.
