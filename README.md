# Film Recommendations

## Project Overview

**Film Recommendations** is a movie recommendation application that uses artificial intelligence and data from The Movie Database (TMDB) to help users discover new films. The project was developed as a final exam project, showcasing how AI can enhance movie recommendations by combining a trained model's suggestions with real movie data from TMDB. 

**Key Features:**

- **AI-Powered Recommendations:** Users can enter a description of a movie or their preferences (for example, *"Movies directed by Christopher Nolan"*). The application’s AI model (integrated via an OpenAI API or similar service) analyzes the prompt and returns a list of recommended movies that match the description or theme. This provides more personalized and context-aware recommendations beyond simple genre matching.

- **Movie Details and TMDB Integration:** For each recommended title, the app fetches detailed information from TMDB. Users can click on a recommended movie to view details such as the synopsis, release year, cast and crew (directors, actors), trailers, and even streaming provider information (where available). High-quality poster images are displayed via TMDB’s image API.

- **Actor Biography Summaries:** When viewing an actor’s details, the app uses the AI service to generate a concise biography summary (150-200 words) of the actor’s career highlights. This gives users a quick overview of an actor’s background and achievements in a succinct format.

- **User Accounts and Watchlist:** The application supports user registration and login. Logged-in users can maintain a personal watchlist or mark movies as liked/disliked. This feature is backed by a database, allowing the app to store user preferences. For example, you can save movies you plan to watch later or get improved recommendations based on liked movies in future iterations.

- **Responsive and Themed UI:** The front-end is built with a responsive design in mind, using Tailwind CSS for styling. It includes a light/dark mode toggle for user convenience. The interface is user-friendly, with suggestion chips (predefined example queries) to inspire user prompts and modal dialogs for login/register forms for create account.

This project demonstrates how combining an AI language model with a rich movie database can create a powerful recommendation engine that provides not just movie suggestions, but also context and information to help users decide what to watch.

## Setup Instructions

Follow these steps to set up the development environment and run the application locally:

1. **Clone the Repository:**  
   ```bash
   git clone https://github.com/gabrielvik/Film-Recommendations.git
   cd film-recommendations
   ```

2. **Install Backend Dependencies:**  
   Ensure you have the **.NET SDK (7.0 or later)** installed. The backend is an ASP.NET Core Web API targeting .NET 9.0 (if .NET 9 is not available, .NET 8 should work with minor adjustments).  
   - Open the solution file `Film Recommendations.sln` in Visual Studio **or** navigate to the backend project directory and restore packages via command line:  
     ```bash
     dotnet restore
     ```  
   - The project uses Entity Framework Core with SQL Server. Make sure you have SQL Server or **LocalDB** running, or update the connection string (see **Configuration** below) to point to your database server. 

3. **Install Frontend Dependencies:**  
   The front-end is a modern JavaScript application (built with Vite and Tailwind CSS). Ensure you have **Node.js** (v16+ recommended) and npm installed. Then install the front-end dependencies:  
   ```bash
   cd FilmRecommendations.Frontend
   npm install
   ```  
   This will pull in required packages (like Vite, Tailwind, etc.) as specified in `package.json`.

4. **Configuration (API Keys and Connection Strings):**  
   The application requires API keys for TMDB and the AI service, as well as a database connection string for user accounts. These should be provided as configuration values:  
   - **TMDB API Key:** Sign up for a free account at TMDB and obtain an API key from your account settings.  
   - **OpenAI API Key (or AI service key):** If using OpenAI’s API, get an API key from the [OpenAI platform](https://platform.openai.com/). (The project is configured to use an AI service; by default it expects a key for an AI model. You can use an OpenAI API key here.)  
   - **Database Connection:** Prepare a connection string for a SQL database. For example, if using LocalDB on Windows, your connection string might look like:  
     \`"FilmConnectionString": "Server=(localdb)\\MSSQLLocalDB;Database=FilmRecommendations;Trusted_Connection=True;"\`.  
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
       "ConnectionStrings": {
         "FilmConnectionString": "Server=(localdb)\\MSSQLLocalDB;Database=FilmRecommendations;Trusted_Connection=True;"
       }
     }
     ```
   - **Or,** use environment variables or .NET Secret Manager to store these values. The application reads configuration values and sets environment variables at startup. For instance, you can set environment variables `TMDb:ApiKey`, `OpenAI:ApiKey`, `GROK_API_KEY`, etc.  

5. **Run the Backend (Web API):**  
   Once configuration is in place, start the ASP.NET Core Web API. You can do this in Visual Studio by running the FilmRecomendations.WebApi project, or via command line:  
   ```bash
   dotnet run --project FilmRecomendations.WebApi
   ```  
   This will launch the server, typically listening on `https://localhost:7103`. Verify by visiting `https://localhost:7103/swagger`.

6. **Run the Frontend (Development Server):**  
   In a separate terminal, start the front-end development server:  
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

- **Backend:** C#, .NET 6+ (ASP.NET Core Web API), Entity Framework Core, SQL Server, ASP.NET Identity, JWT, Swashbuckle (Swagger).
- **Frontend:** JavaScript (ES6 modules), Vite, Tailwind CSS, Fetch API, responsive design, dark/light mode.
- **APIs & Services:** TMDB API (movie data and images), OpenAI API (GPT for recommendations and summaries).
- **Database:** SQL Server (LocalDB/Express) with EF Core migrations.
- **Authentication:** JSON Web Tokens (JWT) for secure API access.

## Documentation and Deployment Links

- **TMDB API Docs:** https://developer.themoviedb.org/docs  
- **OpenAI API Docs:** https://platform.openai.com/docs/introduction  
- **Swagger UI:** Visit `https://localhost:7103/swagger` when running the backend.

*Happy movie hunting!* 🎥🍿  
