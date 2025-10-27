# Film Recommendations AI 

## Project Overview

**Film Recommendations** is a movie recommendation application that uses artificial intelligence and data from The Movie Database (TMDB) to help users discover new films. The project was developed as a final exam project, showcasing how AI can enhance movie recommendations by combining a trained model's suggestions with real movie data from TMDB. 

**Key Features:**

- **AI-Powered Recommendations:** Users can enter a description of a movie or their preferences (for example, *"Movies directed by Christopher Nolan"*). The application’s AI model (integrated via an OpenAI API or similar service) analyzes the prompt and returns a list of recommended movies that match the description or theme. This provides more personalized and context-aware recommendations beyond simple genre matching.

- **Movie Details and TMDB Integration:** For each recommended title, the app fetches detailed information from TMDB. Users can click on a recommended movie to view details such as the synopsis, release year, cast and crew (directors, actors), trailers, and even streaming provider information (where available). High-quality poster images are displayed via TMDB’s image API.

- **User Accounts:** The application supports user registration and login. Logged-in users can mark movies as liked/disliked. This feature is backed by a database, allowing the app to store user preferences. For example, you can get improved recommendations based on liked and disliked movies in future iterations.

- **Responsive and Themed UI:** The front-end is built with a responsive design in mind, using Tailwind CSS for styling. It includes a light/dark mode toggle for user convenience. The interface is user-friendly, with suggestion chips (predefined example queries) to inspire user prompts and modal dialogs for login/register forms for create account.

This project demonstrates how combining an AI language model with a rich movie database can create a powerful recommendation engine that provides not just movie suggestions, but also context and information to help users decide what to watch.

## Setup Instructions

Follow these steps to set up the development environment and run the application locally:

1. **Clone the Repository:**  
   ```bash
   git clone https://github.com/martinolsson89/film-recommendations-ai-martin.git
   cd film-recommendations
   ```

2. **Install Backend Dependencies:**
   Ensure you have the **.NET SDK (9.0 or later)** installed. The backend is an ASP.NET Core Web API targeting .NET 9.
   - Open the solution file `Film Recommendations.sln` in Visual Studio **or** navigate to the backend project directory and restore packages via command line:
     ```bash
     dotnet restore
     ```
   - The API persists data in **MongoDB** (no Entity Framework). Confirm you have access to a MongoDB instance you can connect to (local Docker container, MongoDB Atlas cluster, etc.).

3. **Install Frontend Dependencies:**
   The actively developed frontend lives in **`filmrecommendations-react-frontend/`** and is built with **React 19**, **TypeScript**, **Vite**, **Redux Toolkit**, **React Router**, and **Tailwind CSS**.
   - Ensure you have **Node.js 18+** and npm installed.
   - Install the dependencies:
     ```bash
     cd filmrecommendations-react-frontend
     npm install
     ```
   - Helpful npm scripts:
     - `npm run dev` – start the Vite development server on `http://localhost:5173`.
     - `npm run build` – generate a production build (runs TypeScript build + Vite).
     - `npm run lint` – run ESLint (please execute before committing).
     - `npm run preview` – preview the production build.

4. **Configuration (API Keys and Environment Variables):**
   The application requires API keys for TMDB and the AI service, plus MongoDB connection information. These should be provided as configuration values:
   - **TMDB API Key:** Sign up for a free account at TMDB and obtain an API key from your account settings.
   - **OpenAI API Key (or AI service key):** If using OpenAI’s API, get an API key from the [OpenAI platform](https://platform.openai.com/). (The project is configured to use an AI service; by default it expects a key for an AI model. You can use an OpenAI API key here.)
   - **MongoDB Connection:** Provide a MongoDB connection string and database name that the API can use. For local development you can use a MongoDB Atlas URI or a local instance such as:
     ```
     "MongoDB": {
       "ConnectionString": "mongodb://localhost:27017",
       "DatabaseName": "FilmRecommendations"
     }
     ```
   - **JWT Secret:** The app uses JSON Web Tokens for authentication. You should set a JWT signing key and issuer/audience. For example, in configuration:
     ```json
     "Jwt": {
       "Issuer": "ExamFilmRecApp",
       "Audience": "ExamFilmRecAppUsers",
       "Key": "YOUR_SUPER_SECRET_KEY_HERE"
     }
     ```

   **How to supply these values:** You have a few options:
   - Create a file `FilmRecomendations.WebApi/appsettings.Development.json` (gitignored) with the required keys and settings. For example:
     ```json
     {
       "OpenAI": { "ApiKey": "YOUR_OPENAI_KEY" },
       "TMDb": { "ApiKey": "YOUR_TMDB_KEY", "BaseUrl": "https://api.themoviedb.org/3/" },
       "GROK": { "ApiKey": "YOUR_AI_KEY" },
       "Jwt": {
         "Issuer": "ExamFilmRecApp",
         "Audience": "ExamFilmRecAppUsers",
         "Key": "YOUR_SUPER_SECRET_KEY"
       },
       "MongoDB": {
         "ConnectionString": "mongodb://localhost:27017",
         "DatabaseName": "FilmRecommendations"
       }
     }
     ```
   - **Or,** use environment variables or .NET Secret Manager to store these values. The API reads configuration values and maps them to environment variables at startup. Set variables such as `TMDb:ApiKey`, `OpenAI:ApiKey`, `GROK:ApiKey`, `MongoDB:ConnectionString`, `MongoDB:DatabaseName`, `Jwt:Key`, `Jwt:Issuer`, and `Jwt:Audience` (respecting the colon-separated syntax supported by ASP.NET Core on your platform).

5. **Run the Backend (Web API):**  
   Once configuration is in place, start the ASP.NET Core Web API. You can do this in Visual Studio by running the FilmRecomendations.WebApi project, or via command line:  
   ```bash
   dotnet run --project FilmRecomendations.WebApi
   ```  
   This will launch the server, typically listening on `https://localhost:7103`. Verify by visiting `https://localhost:7103/swagger`.

6. **Run the Frontend (Development Server):**
   In a separate terminal, start the React frontend dev server from `filmrecommendations-react-frontend/`:
   ```bash
   npm run dev
   ```
   This starts Vite’s dev server (default `http://localhost:5173`). Ensure the backend is running so API calls succeed.

7. **Build (optional):**  
   To build the front-end for production:  
   ```bash
   npm run build
   ```  
   This outputs optimized static files to `dist/`, ready for deployment.

Now you have both servers running: the Web API (backend) and the Vite dev server (frontend). You can interact with the application via your browser.

## Usage Examples

- **Getting Movie Recommendations:**  
  On the main page (`http://localhost:5173`), enter a prompt like **“A classic science fiction movie with space exploration”**. Press **Send** to get AI-powered recommendations.

- **Viewing Recommendation Results:**  
  Recommended movies appear as cards with poster images and titles. If no recommendations are found, a message prompts you to try again.

- **Movie Details:**  
  Click a movie card to view:
  - **Overview**: Title, release year, synopsis.
  - **Directors and Cast:** List of directors and main actors (click actor name for bio).
  - **Trailers:** YouTube links for available trailers.
  - **Streaming Providers:** Available streaming platforms via TMDB.
  - **AI-Summarized Actor Bios:** Short career summaries for actors.

- **User Accounts and Watchlist:**  
  Use **Log in** / **Register** to register or log in. After authentication, add movies to your watchlist or like/dislike them. View saved movies in your profile page.

- **Persistence & History:**  
  The app uses browser storage to remember your last search and results, even after refresh.

## Technologies Used

- **Backend:** C#, .NET 9 (ASP.NET Core Web API), MongoDB Driver, ASP.NET Identity password hashing, JWT authentication, Swashbuckle (Swagger).
- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit, React Router, Tailwind CSS.
- **APIs & Services:** TMDB API (movie data and images), OpenAI/Grok API (AI-generated recommendations and summaries).
- **Database:** MongoDB (configured via `MongoDB:ConnectionString` and `MongoDB:DatabaseName`).
- **Authentication:** JSON Web Tokens (JWT) for secure API access.

## Documentation and Deployment Links

- **TMDB API Docs:** https://developer.themoviedb.org/docs  
- **OpenAI API Docs:** https://platform.openai.com/docs/introduction  
- **Swagger UI:** Visit `https://localhost:7103/swagger` when running the backend.

*Happy movie hunting!* 🎥🍿  
