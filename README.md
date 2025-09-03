# TuneSwipe 🎵

A sophisticated music discovery platform that combines the intuitive swipe interface of modern dating apps with intelligent Spotify integration to create personalized playlists through search recommendations.

## 🎯 Overview

TuneSwipe is a full-stack web application that revolutionizes music discovery by combining the addictive swipe interface popularized by dating apps with seamless Spotify integration. Users swipe through curated song recommendations, preview tracks, and automatically generate Spotify playlists from their favorites. The app also provides intelligent recommendations and detailed analytics, helping users track and understand the evolution of their musical tastes.

## ✨ Key Features

### Music Discovery & Curation
- **Intelligent Recommendation Engine**: Genre-based song discovery with popularity weighting
- **Audio Preview Integration**: 30-second previews via Deezer API with fallback mechanisms
- **Advanced Filtering**: Multi-genre selection with mood-based categorization
- **Duplicate Prevention**: Smart algorithm prevents showing previously swiped tracks

### User Experience
- **Tinder-Style Interface**: Smooth, responsive swipe animations with touch and click support
- **Real-time Progress Tracking**: Live session analytics with completion percentage
- **Session Management**: Customizable playlist targets (5-50 songs) with pause/resume capability
- **Historical Analytics**: Comprehensive session history with genre distribution visualization

### Spotify Integration
- **OAuth2 Authentication**: Secure token management with automatic refresh
- **Playlist Management**: Seamless playlist creation with metadata and cover art
- **User Profile Access**: Display name and email integration
- **Permission Scoping**: Minimal required permissions for enhanced user trust

### Data & Analytics
- **Session Tracking**: Detailed swipe history with timestamps and order tracking
- **Music Analytics**: Genre preference analysis and listening pattern insights
- **Performance Metrics**: Session completion rates and user engagement statistics

## 🏗️ Architecture

### Full-Stack Application
- **Frontend**: React 18 + Vite (deployed on Vercel)
- **Backend**: Python Flask API (deployed on Render.com)
- **Database**: MySQL hosted on Railway
- **Authentication**: Spotify OAuth2 with automatic token refresh
- **Audio**: Deezer API integration for song previews

### System Architecture
```
React Frontend (Vercel) ←→ Flask API (Render) ←→ MySQL Database (Railway)
        ↓                          ↓
   Spotify OAuth            Spotify Web API
                            Deezer API
```

## 🛠️ Technology Stack

**Frontend Engineering**
- **React 18**: Modern hooks-based architecture with functional components
- **Vite**: Lightning-fast build tool with hot module replacement
- **React Router DOM**: Client-side routing with protected route guards
- **CSS3**: Custom properties, flexbox, and grid layouts with responsive design
- **React Icons**: Font Awesome integration for consistent iconography

**Backend Engineering**
- **Python Flask 2.3.3**: RESTful API with modular blueprint architecture
- **Spotipy 2.23.0**: Comprehensive Spotify Web API client with automatic retries
- **MySQL Connector 8.1.0**: Optimized database connectivity with connection pooling
- **Gunicorn**: Production WSGI server with worker process management
- **Flask-CORS**: Cross-origin resource sharing with environment-specific configurations

**Database Design**
- **MySQL 8.0+**: Relational database with optimized indexing strategies
- **Railway Cloud**: Managed database hosting with automatic backups
- **Connection Pooling**: Efficient resource management for concurrent users
- **Foreign Key Constraints**: Data integrity enforcement with cascade operations

**External API Integration**
- **Spotify Web API**: Authentication, user profiles, and playlist management
- **Deezer API**: Audio preview fallback system for enhanced song discovery

**DevOps & Deployment**
- **Vercel**: Frontend deployment with automatic builds from Git
- **Render.com**: Backend deployment with container orchestration
- **GitHub Actions**: Automated CI/CD pipeline with comprehensive testing
- **Environment Management**: Secure credential handling across development and production

## 🧪 Testing & Quality Assurance

### Automated Testing Pipeline
- **GitHub Actions CI/CD**: Automated testing on every push and pull request
- **Multi-Environment Testing**: Separate test database with MySQL 8.0 service containers
- **Coverage Reporting**: Codecov integration for comprehensive test coverage analysis
- **Branch Protection**: Automated testing required for main branch merges

### Test Suite Architecture
```python
# Comprehensive test coverage across multiple layers
├── test_db.py          # Database operations and connections
├── test_routes.py      # API endpoint functionality  
├── conftest.py         # Test fixtures and cleanup
└── pytest.ini         # Test configuration
```

### Database Testing
- **Connection Validation**: Automated database connectivity testing
- **CRUD Operations**: Comprehensive testing of create, read, update, delete operations
- **Transaction Integrity**: Rollback testing and foreign key constraint validation
- **Data Cleanup**: Automated test data cleanup with proper cascade handling

### API Testing
- **Route Testing**: Complete endpoint coverage with status code validation
- **JSON Response Validation**: Schema validation and data structure testing
- **Error Handling**: Edge case testing with malformed requests
- **Authentication Flow**: OAuth2 integration testing with mock Spotify responses

## 💾 Database Schema & SQL Architecture

### Entity Relationship Design
The application uses a sophisticated relational database schema with optimized indexing and foreign key relationships:

**Core Tables**
- `Users`: Spotify user profiles with token management
- `SwipeSessions`: Session tracking with preference storage as JSON
- `Songs`: Comprehensive track metadata with deduplication
- `Swipes`: Individual swipe records with timestamp ordering
- `Playlists`: Spotify playlist integration with metadata

### Advanced SQL Features
- **Complex Joins**: Multi-table queries for session analytics and user insights
- **JSON Data Types**: Flexible preference storage with MySQL JSON functions
- **Window Functions**: Advanced analytics with ROW_NUMBER() and ranking
- **Prepared Statements**: Parameterized queries for SQL injection prevention
- **Optimized Indexing**: Strategic index placement for query performance

### Custom SQL Queries
```sql
-- Session progress analytics with aggregation
get_session_progress.sql    
get_session_songs.sql       
get_user_liked_songs.sql    
get_user_sessions.sql       
```

## 🔌 API Endpoints

### Authentication
- `GET /api/spotify/auth_url` - Get Spotify OAuth URL
- `GET /callback` - OAuth callback handler  
- `GET /api/check_auth/<spotify_id>` - Check authentication status

### Session Management
- `POST /api/swipe_sessions` - Create new swipe session
- `GET /api/swipe_sessions` - Get user's sessions
- `GET /api/session_progress/<session_id>` - Get session progress
- `POST /api/complete_session/<session_id>` - Mark session complete
- `GET /api/session_songs/<session_id>` - Get all songs from session

### Music Discovery
- `GET /api/get_song` - Get songs for swiping
  - Query params: `genre`, `limit`, `spotify_id`, `session_id`
- `POST /api/swipe` - Record a swipe (LEFT/RIGHT)

### Playlist Management
- `POST /api/create_playlist` - Create Spotify playlist
- `POST /api/add_tracks_to_playlist/<playlist_id>` - Add tracks to playlist

## 🎮 User Flow



1. **Landing Page**: Introduction and Spotify login
<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 43 22 PM" src="https://github.com/user-attachments/assets/25e469c8-409c-445d-91dd-3bb4d075eda9" />

2. **Authentication**: Secure OAuth2 flow with Spotify
<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 45 51 PM" src="https://github.com/user-attachments/assets/b227948c-ebe2-4274-bc2f-3991f3af2ec5" />

3. **Dashboard**: User profile and navigation hub
<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 39 12 PM" src="https://github.com/user-attachments/assets/0dfcb82c-40ba-46f1-b586-c7b01aec6cce" />

4. **Session Setup**: Choose genres and target playlist size (5-50 songs)
<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 39 30 PM" src="https://github.com/user-attachments/assets/90d0d85d-8484-4582-a249-ff825ba2f6e7" />

5. **Swiping Interface**: 
   - Swipe right (❤️) to like songs
   - Swipe left (✖️) to skip
   - Listen to 30-second previews
   - Track progress in real-time
<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 41 42 PM" src="https://github.com/user-attachments/assets/2cd70580-66fa-4d51-ac15-a73afbdcfd2e" />

6. **Playlist Creation**: Automatic Spotify playlist generation
<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 42 03 PM" src="https://github.com/user-attachments/assets/62a42883-bca3-4651-962c-eeb62b978991" />

7. **History**: View past sessions with detailed analytics
<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 39 49 PM" src="https://github.com/user-attachments/assets/305561cb-b129-45af-b60c-0013d68b004a" />

<img width="1470" height="829" alt="Screenshot 2025-08-18 at 3 40 00 PM" src="https://github.com/user-attachments/assets/3465ade2-c343-4e20-a3c6-fea77ced1045" />

## 📁 Project Structure

```
tuneswipe/
├── client/                 # Frontend React Application
│   ├── .env                # Environment variables
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/          # Main page components
│   │   │   ├── Homepage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UserForm.jsx
│   │   │   ├── SwipeSession.jsx
│   │   │   ├── PlaylistCreation.jsx
│   │   │   └── History.jsx
│   │   ├── styles/         # CSS stylesheets
│   │   ├── assets/         # Static assets
│   │   ├── config.js       # App configuration
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                 # Backend Flask API
│   ├── app.py              # Main Flask application
│   ├── database.py         # Database setup and models
│   ├── constants.py        # Constants
│   ├── sql                 # SQL files
│   ├── .env                # Environment variables
│   └── tests/              # Test suite
├── requirements.txt    # Python dependencies
├── render.yaml         # Render.com deployment config
└── README.md
```

## 🔒 Security Features

- **OAuth2 Flow**: Secure Spotify authentication with PKCE
- **Token Management**: Automatic access token refresh
- **CORS Protection**: Configured for specific origins only
- **Input Validation**: Sanitized database inputs with parameterized queries
- **Session Security**: Secure session management with expiration
- **Error Handling**: Comprehensive error management without sensitive data exposure

## 📈 Performance Optimizations

- **Database**: Connection pooling and optimized queries
- **Caching**: Song data cached in database to reduce API calls  
- **Pagination**: Efficient song loading with batch processing
- **Async Processing**: Non-blocking API calls
- **CDN**: Static assets served via CDN for faster loading
- **Gunicorn**: Production-optimized WSGI server with worker processes

## 🚀 Production Deployment

### Backend Deployment (Render.com)
- Automatic deployment from Git repository
- Uses `render.yaml` configuration
- Gunicorn with 1 worker and 4 threads
- Environment variables managed in Render dashboard

### Frontend Deployment (Vercel)
- Automatic deployment from Git repository
- Build command: `npm run build`
- Environment variables configured in Vercel dashboard

### Database (Railway)
- Managed MySQL 8.0+ instance
- Automatic backups and monitoring
- Connection pooling enabled

## 🎯 Technical Highlights

This project demonstrates proficiency in:
- **Full-Stack Development**: End-to-end application architecture and implementation
- **Modern React Patterns**: Hooks, context, and component composition
- **RESTful API Design**: Comprehensive endpoint architecture with proper HTTP methods
- **Database Design**: Normalized schema with optimized relationships and indexing
- **OAuth2 Implementation**: Secure third-party authentication and token management
- **DevOps Practices**: Automated testing, deployment, and monitoring
- **Performance Engineering**: Query optimization, caching, and scalability considerations
- **Testing Methodologies**: Comprehensive test coverage with automated CI/CD

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Live Application**: https://tune-swipe.vercel.app
- **API Base URL**: https://tune-swipe.onrender.com
- **Spotify Developer**: https://developer.spotify.com
- **Deezer API**: https://developers.deezer.com
