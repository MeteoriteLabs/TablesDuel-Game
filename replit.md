# Overview

Tables Duel is a multiplayer mathematics learning game focused on times tables practice. The application provides both single-player and multiplayer modes where players answer multiplication questions with varying difficulty levels and game modes. Built with a modern full-stack architecture using React, Express, WebSockets for real-time communication, and PostgreSQL for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based UI
- **State Management**: Zustand for global game state management, providing a simple and lightweight alternative to Redux
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket client for multiplayer functionality
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for HTTP server and API endpoints
- **Real-time Communication**: WebSocket server using 'ws' library for multiplayer game coordination
- **Game Logic**: Custom GameManager class handling room creation, question generation, and game state
- **Storage Abstraction**: Interface-based storage system with in-memory implementation (MemStorage)
- **Development**: TSX for TypeScript execution in development mode

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless database for production
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Shared schema definitions between client and server using Zod for validation
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store
- **User Management**: Basic user system with username/password authentication
- **Game Authorization**: Room-based access control for multiplayer games

## External Dependencies
- **UI Framework**: Comprehensive Radix UI component primitives for accessible components
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Form Handling**: React Hook Form with Zod resolvers for validation
- **Animation**: Framer Motion for smooth UI transitions and feedback
- **Data Fetching**: TanStack Query for server state management and caching
- **Utilities**: Class Variance Authority for component variant management, date-fns for date operations
- **Development Tools**: Replit-specific plugins for development environment integration