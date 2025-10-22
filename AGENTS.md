# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Film Recommendations is an AI-powered movie recommendation application with dual frontend architecture:
- **Legacy Frontend**: Vanilla JavaScript with Vite (currently in production)
- **React Frontend**: React 19 + TypeScript (under development on `frontend-refactor` branch)
- **Backend**: .NET 9 ASP.NET Core Web API with MongoDB

## Key Development Commands

### Backend (.NET API)
```bash
dotnet build                                          # Build solution
dotnet run --project FilmRecomendations.WebApi      # Run API server (https://localhost:7103)
```

### React Frontend (filmrecommendations-react-frontend/)
```bash
npm run dev        # Development server (http://localhost:5173)
npm run build      # Production build
npm run lint       # ESLint checking - run before commits
npm run preview    # Preview production build
```

### Legacy Frontend (FilmRecommendations.Frontend/)
```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview build
```

## Architecture Overview

### Backend Structure
- **4-Layer Architecture**: WebApi → Services → Models → Db
- **FilmRecomendations.WebApi**: Controllers and API endpoints
- **FilmRecomendations.Services**: Business logic, AI service (GROK/OpenAI), TMDB integration
- **FilmRecomendations.Models**: DTOs and data models
- **FilmRecomendations.Db**: MongoDB repositories and database context

### React Frontend Structure (Current Development Focus)
```
src/
├── app/store.ts           # Redux store (empty, needs implementation)
├── components/            # Reusable UI components
├── features/              # Feature-based organization
│   ├── movies/           # Movie-related functionality
│   └── user/             # User authentication/profile
├── hooks/                # Custom React hooks
├── pages/                # Route components
└── types/                # TypeScript type definitions
```

### Key APIs and Endpoints
- `/Auth/*` - JWT authentication with rate limiting
- `/FilmRecommendations/*` - AI-powered movie suggestions with TMDB data
- `/Movies/*` - User watchlists and movie management

## Required Configuration
The application requires these environment variables/config values:
- `GROK_API_KEY` or `OPENAI_API_KEY` (AI recommendations)
- `TMDb:ApiKey` (movie database API)
- `JWT:Key`, `JWT:Issuer`, `JWT:Audience` (authentication)
- `MongoDB:ConnectionString`, `MongoDB:DatabaseName` (database)

Configuration should be added to `FilmRecomendations.WebApi/appsettings.Development.json` (gitignored).

## Current Development Status
- **Backend**: Fully functional, recently migrated from SQL Server to MongoDB
- **Legacy Frontend**: Complete and operational
- **React Frontend**: Under active development
  - Basic structure and routing established
  - Redux store configured but empty - needs slice implementations
  - Components created but not fully connected to API
  - Authentication flow needs implementation

## Tech Stack
- **Backend**: .NET 9, ASP.NET Core, MongoDB, JWT auth, Swagger
- **React Frontend**: React 19, TypeScript, Redux Toolkit, React Router 7, Tailwind CSS, Vite
- **External APIs**: GROK/OpenAI (AI), TMDB (movie data)

## Development Notes
- Always run `npm run lint` in React frontend before committing
- The main branch is `main`, current work is on `frontend-refactor`  
- Backend API documentation available at `https://localhost:7103/swagger` when running
- MongoDB replaced Entity Framework - old EF references may still exist in comments/docs