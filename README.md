# LLM-TRPG Backend Service

This is the backend service for the LLM Interactive Tabletop Role-Playing Game (TRPG) project, developed with Node.js and the Express.js framework. It is responsible for handling all game logic, user data management, and interacting with the Large Language Model (Gemini API).

## Phase 1 Implemented Features

The goal of this phase was to establish a stable and smooth single-player core game loop. The following features have been completed:

-   **User Authentication**: Provides user registration, login, and identity verification functions.
-   **Game Management**: Supports creating new games, fetching a list of historical games, and loading a specific game's progress.
-   **Core Dialogue System**: Integrates with the Google Gemini API to receive player dialogue input and generate game narrative responses.
-   **Dialogue History**: All conversations between players and the AI GM are saved to the database, ensuring that game progress can be resumed at any time.
-   **Manual Dice Rolling Mechanism**: Provides a dedicated API endpoint to handle various dice roll formats (e.g., `d20`, `2d6`, `1d10+1`).
-   **Multi-language Support**: Can store and manage user language preferences.

## API Endpoints

Below are the main API endpoints that have been established:

-   `POST /api/register`: Register a new user.
-   `POST /api/login`: User login.
-   `GET /api/game`: Get all games for the current user.
-   `GET /api/gemini`: Create a new game.
-   `GET /api/game/:id`: Load details and dialogue history for a specific game.
-   `POST /api/gemini/:id`: Send a new message in a specific game.
-   `POST /api/roll`: Perform a dice roll based on a formula.
-   `GET /api/user`: Get user settings (e.g., language).
-   `PUT /api/user`: Update user settings (e.g., language).

## Tech Stack

-   **Framework**: Node.js, Express.js
-   **Database**: MongoDB with Mongoose
-   **Authentication**: Passport.js with JWT
-   **LLM**: Google Gemini API
-   **Environment Variable Management**: dotenv

## Installation and Startup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Set Environment Variables**
    Create a `.env` file in the project root directory and fill in the necessary environment variables:
    ```
    MONGO_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_gemini_api_key
    JWT_SECRET=your_jwt_secret
    ```

3.  **Start the Server**
    ```bash
    npm start
    ```
    The server will run on `http://localhost:3000` by default.
