# Sharetribe Transaction Process Visualizer

## Overview

This is a full-stack React application that functions as a visualizer for Sharetribe transaction processes defined in EDN (Extensible Data Notation) format. The application allows users to parse EDN code and generate interactive directed graph visualizations of transaction flows.

## User Preferences

Preferred communication style: Simple, everyday language.
Visual theme: Light theme for better visual appeal (reverted from dark theme)
Graph styling: Actor-based color coding for transitions, smooth curved edges to prevent overlap
File management: Local storage for EDN files with save/load/rename/delete functionality
Features: Manual graph builder page for creating custom visualizations
Open source: GitHub integration, comprehensive README, SEO optimization

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Graph Visualization**: ReactFlow for interactive flow diagrams

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development**: Hot module replacement via Vite integration

## Key Components

### Core Libraries
- **EDN Parser**: Custom parser for Sharetribe transaction process definitions
- **Graph Generator**: Converts parsed EDN data into ReactFlow node/edge format
- **UI Components**: Comprehensive shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation

### Frontend Structure
- `client/src/pages/home.tsx`: Main application page with EDN input, graph visualization, and file management
- `client/src/pages/builder.tsx`: Manual graph builder page for creating custom visualizations
- `client/src/lib/edn-parser.ts`: Custom EDN parsing logic for transaction processes
- `client/src/lib/graph-generator.ts`: Converts EDN data to ReactFlow graph format
- `client/src/components/ui/`: Reusable UI components from shadcn/ui

### Backend Structure
- `server/index.ts`: Main Express server with middleware setup
- `server/routes.ts`: API route definitions
- `server/storage.ts`: Database abstraction layer with in-memory fallback
- `server/vite.ts`: Vite integration for development mode

## Data Flow

1. **User Input**: User enters EDN code in textarea component
2. **Parsing**: EDN parser processes the input and extracts transaction process data
3. **Graph Generation**: Parsed data is converted to ReactFlow nodes and edges
4. **Visualization**: Interactive graph is rendered using ReactFlow
5. **User Interaction**: Users can pan, zoom, and explore the transaction flow

### EDN Data Structure
The application expects EDN files with the following structure:
- `:process/id`: Unique identifier for the transaction process
- `:process/states`: Set of all possible states in the process
- `:process/transitions`: Array of transition definitions with from/to states, actors, and actions

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, ReactDOM, React Router (wouter)
- **State Management**: TanStack Query for server state
- **UI Libraries**: Radix UI primitives, Tailwind CSS, shadcn/ui
- **Graph Visualization**: ReactFlow (loaded via CDN)
- **Form Handling**: React Hook Form, Zod validation

### Backend Dependencies
- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Session Storage**: connect-pg-simple for PostgreSQL sessions
- **Development Tools**: tsx for TypeScript execution, Vite for frontend integration

### Development Dependencies
- **Build Tools**: Vite, esbuild for server bundling
- **TypeScript**: Full TypeScript support across frontend and backend
- **CSS Processing**: PostCSS with Tailwind CSS

## Deployment Strategy

### Development Mode
- Frontend served via Vite dev server with HMR
- Backend runs with tsx for TypeScript execution
- Database can use in-memory storage for quick prototyping

### Production Build
- Frontend built with Vite to static assets
- Backend bundled with esbuild for optimized Node.js execution
- Requires PostgreSQL database with proper environment variables

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for production)
- `NODE_ENV`: Environment setting (development/production)

### Build Commands
- `npm run dev`: Start development server
- `npm run build`: Build both frontend and backend for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

The application is designed to be deployed on platforms like Replit, with specific optimizations for that environment including cartographer integration and runtime error overlays.

## Recent Changes (January 2025)

### Major Features Added
- **Light Theme**: Reverted from dark theme to light theme for better visual appeal
- **Local Storage**: Complete file management system with save/load/rename/delete functionality
- **Manual Graph Builder**: New `/builder` page for creating custom visualizations with drag-and-drop interface
- **Enhanced Graph Styling**: Actor-based color coding and smooth curved edges to prevent overlap
- **Connection Points Hidden**: Removed small dots above/below state boxes for cleaner appearance
- **SEO Optimization**: Comprehensive meta tags, Open Graph, and Twitter Card support

### Technical Improvements
- **Edge Type**: Changed from 'bezier' to 'smoothstep' for better compatibility
- **File Management**: localStorage-based EDN file storage with full CRUD operations
- **Info Modal**: Comprehensive explanation of Sharetribe and tool usage
- **Export Functionality**: Working download feature for graph data
- **README**: Complete documentation for open-source distribution

### UI/UX Enhancements
- **Single Sample Button**: Removed v2 samples, focused on v3 format
- **Full-screen Mode**: Toggle input panel for immersive visualization
- **Details Panel**: Comprehensive state and transition information
- **GitHub Integration**: Footer links and contribution guidelines
- **Professional Styling**: Clean, modern interface with proper spacing