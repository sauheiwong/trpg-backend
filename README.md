# Project Proposal: An LLM-Powered Interactive Tabletop RPG Platform

Student Name: Sau Hei Wong Date: September 17, 2025

1. Abstract

- This project aims to design, develop, and deploy an immersive Tabletop Role-Playing Game (TRPG) platform powered by a Large Language Model (LLM). The application will function as an "AI Game Master" (AI GM), interacting with players through natural language to dynamically generate compelling narratives, scenes, and challenges. Traditional TRPGs often present a high barrier to entry due to the need for a human GM and schedule coordination. This project addresses this pain point by creating an accessible, highly personalized, and endlessly replayable single-player adventure experience, making the joy of TRPGs more readily available.

2. Project Goals & Motivation

Tabletop RPGs, such as Call of Cthulhu and Dungeons & Dragons, offer unparalleled freedom in collaborative storytelling but can be challenging to organize. The primary motivation for this project is to leverage modern AI technology to lower the barrier to entry for TRPGs.
The key objectives include:

- Apply Full-Stack Skills: To implement the full-stack development knowledge acquired during the bootcamp, covering frontend, backend, database design, and real-time communication technologies.

- Integrate Cutting-Edge AI: To explore and apply a large language model (the Gemini API) in a creative, generative capacity, building an application with truly dynamic narrative capabilities.

- Solve a Real-World Problem: To provide an innovative solution for the TRPG community, enabling solo play and simplifying the organization of multiplayer games.

- Deliver a Complete Product: To deliver a fully functional and polished software application, showcasing skills across the entire software development lifecycle, from design to deployment.

3. Target Audience

- TRPG Newcomers: Individuals interested in learning and experiencing TRPGs in a low-pressure environment.

- Experienced TRPG Players: Veterans looking for a solo-play option or a way to continue adventuring between their regular group sessions.

- Game Masters (GMs): GMs who can use the platform for story inspiration or to playtest new adventure modules.

- Creative Writers & Storytellers: Users seeking an interactive narrative tool to spark creativity and explore story ideas.

4. Core Features

This application will focus on delivering a complete and polished single-player experience, with core features including:
Dynamic Story Generation: The AI GM will create unique storylines in real-time based on player input, character backgrounds, and established game rules.

- Natural Language Interaction: Players will communicate their actions and intentions to the AI GM using conversational language.
  Character Creation & Management: Players can create and manage their character sheets, including attributes, skills, inventory, and status, which will directly influence game outcomes.

- Integrated Dice Mechanics: The AI will understand when dice rolls are necessary and generate logical, dramatic, and context-aware outcomes based on the results (including successes, failures, and criticals).

- AI-Powered Image Generation: To enhance immersion, the system will generate visuals for key scenes, characters, or locations, either automatically or triggered by the player.

5. Project Scope & Future Outlook

The scope of this capstone project is to deliver a polished and feature-complete single-player TRPG platform, encompassing all the core features listed above.

- Future Outlook (Out of Scope for this Project): The application's architecture will be designed with future scalability in mind. After the successful delivery of the single-player mode, the primary path for expansion will be the implementation of a real-time multiplayer mode. This would leverage the planned WebSocket technology to allow multiple players to join the same game session. This feature is a future goal for the project and will not be part of the capstone deliverable.

6. Technology Stack

- Backend: Node.js, Express.js

- Database: MongoDB

- Web Frontend: Vue.js

- Mobile App: React Native

- Real-time Communication: WebSockets (via Socket.IO) - Architecture for future multiplayer expansion

- Story Generation AI: Google Gemini API

- Image Generation AI: Google Imagen API
