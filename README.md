# Wordle

## Description

- npn install
- npm run dev:all

# Multiplayer Wordle Game

This project is a multiplayer version of the popular word-guessing game Wordle, built using React and WebSocket for real-time multiplayer functionality.

- Single player mode

  - Start
    ![Single player mode](./image/single.gif)
  - End
    ![Single player mode](./image/single_end.gif)

- Multiplayer mode
  ![Multiplayer mode](./image/multi.gif)

## Table of Contents

- [Wordle](#wordle)
  - [Description](#description)
- [Multiplayer Wordle Game](#multiplayer-wordle-game)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Todo](#todo)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Game](#running-the-game)
  - [How to Play](#how-to-play)
  - [Technologies Used](#technologies-used)
- [Multiplayer Wordle Game - Design Document](#multiplayer-wordle-game---design-document)
  - [Architecture Overview](#architecture-overview)
  - [Key Design Decisions](#key-design-decisions)
  - [Future Considerations](#future-considerations)
  - [Conclusion](#conclusion)
  - [License](#license)

## Features

- Real-time multiplayer gameplay
- Simultaneous word guessing for all players
- Visual keyboard for easy input
- Colored feedback for correct letters and positions
- Server-side word validation

## Todo

- Implement physical keyboard input functionality
- Develop a "Host cheating" feature for Wordle

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

## Installation

To install the Multiplayer Wordle Game, follow these steps:

1. Clone the repository:

   ```
   git clone https://github.com/umzr/Wordle_
   ```

2. Navigate to the project directory:

   ```
   cd wordle
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Running the Game

To run the game, follow these steps:

1. Start the React application:

   ```
   npm run dev:all
   ```

2. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Enter the game room and wait for an opponent to join.
2. Once the game starts, both players will see the same empty word grid.
3. Type your guess using the on-screen keyboard (physical keyboard support coming soon).
4. Press 'Enter' to submit your guess.
5. The game will provide feedback:
   - Green: Correct letter in the correct position
   - Yellow: Correct letter in the wrong position
   - Gray: Letter not in the word
6. The first player to correctly guess the word wins!
7. If neither player guesses the word within 6 attempts, the game ends in a draw.

## Technologies Used

- React
- WebSocket (for real-time communication)
- Express.js (for the server)
- CSS (for styling)

# Multiplayer Wordle Game - Design Document

This document outlines the key design decisions and trade-offs made during the development of the Multiplayer Wordle Game.

## Architecture Overview

The Multiplayer Wordle Game is built using a client-server architecture:

- **Client**: React-based frontend
- **Server**: Node.js with Express and WebSocket for real-time communication

## Key Design Decisions

1. **React Hooks for State Management**

   - Decision: Use React Hooks (useState, useEffect, useCallback) for state management instead of class components or external state management libraries.
   - Rationale: Hooks provide a more concise and readable way to manage component state and side effects. They also make it easier to reuse stateful logic between components.
   - Trade-off: While hooks simplify the code, they may have a steeper learning curve for developers new to React.

2. **WebSocket for Real-time Communication**

   - Decision: Use WebSocket for real-time communication between clients and the server.
   - Rationale: WebSocket provides full-duplex communication, allowing for instant updates and a responsive multiplayer experience.
   - Trade-off: WebSocket requires maintaining a persistent connection, which may consume more server resources compared to HTTP polling.

3. **Centralized Word Validation**

   - Decision: Perform word validation on the server-side.
   - Rationale: This prevents cheating by ensuring all players are using the same word list and prevents exposing the entire word list to the client.
   - Trade-off: This approach increases server load and network traffic, as each guess needs to be validated by the server.

4. **Simultaneous Gameplay**

   - Decision: Allow players to make guesses simultaneously instead of implementing turn-based gameplay.
   - Rationale: This creates a more exciting and fast-paced game experience, where the quickest player to guess correctly wins.
   - Trade-off: This may lead to a less strategic gameplay experience and could potentially overwhelm slower players.

5. **Component-based Architecture**
   - Decision: Break down the UI into reusable components (e.g., Block, Keyboard, GameRoom).
   - Rationale: This improves code organization, reusability, and maintainability.
   - Trade-off: This may lead to a larger number of files and a more complex project structure for a relatively simple game.

## Future Considerations

1. **State Management**: As the game grows in complexity, consider implementing a more robust state management solution like Redux or MobX.

2. **Scalability**: Implement a load balancer and multiple game servers to handle a larger number of concurrent games.

3. **User Authentication**: Add user accounts and authentication to enable features like game history and player statistics.

4. **Accessibility**: Improve keyboard navigation and screen reader support for better accessibility.

5. **Internationalization**: Add support for multiple languages to reach a broader audience.

## Conclusion

The current design of the Multiplayer Wordle Game prioritizes a responsive and engaging user experience while maintaining code simplicity and maintainability. As the project evolves, these design decisions should be revisited and adjusted based on user feedback and changing requirements.

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).
