# AI Career & Project Intelligence Platform - TODO

## Phase 1: Core MVP

### Database & Backend Setup
- [x] Create database models: Users, Roles, Skills, UserSkills, Projects, CareerPaths, Recommendations
- [x] Create database migrations
- [x] Set up PostgreSQL with pgvector extension
- [x] Create tRPC endpoints for authentication (login, logout, get current user)
- [x] Create tRPC endpoint: GET /users/me
- [x] Create tRPC endpoint: POST /users/skills
- [x] Create tRPC endpoint: GET /career/roles
- [x] Create tRPC endpoint: POST /career/roadmap
- [x] Create tRPC endpoint: GET /projects/recommendations
- [x] Create tRPC endpoint: POST /projects/submit
- [x] Set up Manus OAuth with JWT tokens

### AI Skill Gap Engine
- [x] Create LangChain chain for skill gap analysis
- [x] Implement role requirements database
- [x] Create prompt template for skill gap analysis
- [x] Implement missing_skills, priority_order, suggested_projects output
- [x] Generate personalized learning paths using LLM

### Frontend - Onboarding
- [x] Create onboarding flow layout structure
- [x] Build welcome screen component
- [x] Build name input screen
- [x] Build dream job selection screen (card-based)
- [x] Build current skills input screen (tag input, multi-select)
- [x] Build onboarding confirmation screen
- [x] Implement onboarding state management
- [x] Integrate onboarding with backend API

### Frontend - Dashboard
- [x] Create dashboard layout with header and sections
- [x] Build skill gap visualization component (progress bars)
- [x] Build recommended projects section (3 cards)
- [x] Build quick stats display
- [x] Implement dashboard data fetching from API
- [x] Add navigation to other screens

### Frontend - Projects Feed
- [x] Create projects feed layout with FlatList
- [x] Build project card component
- [x] Implement project filters (difficulty)
- [x] Build project search functionality
- [x] Integrate with /projects API
- [x] Implement project filtering logic

### Frontend - Authentication
- [x] Implement auth state management
- [x] Set up JWT token storage (SecureStore)
- [x] Implement auth context provider
- [x] Add logout functionality

### Frontend - Navigation
- [x] Set up tab bar navigation (Home, Projects)
- [x] Implement screen routing
- [x] Implement deep linking support

### Docker & Deployment
- [ ] Create docker-compose.yml for local development
- [ ] Configure PostgreSQL container with pgvector
- [ ] Configure Node.js service
- [ ] Test full stack locally

---

## Phase 2: Project Analyzer Module

### GitHub Integration Service
- [ ] Create POST /projects/analyze-github endpoint
- [ ] Implement GitHub API integration (no cloning needed)
- [ ] Extract repository metadata: languages, file count, README quality
- [ ] Extract commit activity metrics
- [ ] Return structured ProjectMetadata object

### AI Project Analyzer Chain
- [ ] Create LangChain chain for project analysis
- [ ] Implement problem clarity evaluation
- [ ] Implement technical complexity scoring (1-10)
- [ ] Implement career relevance matching
- [ ] Implement missing improvements suggestions (3-5 items)
- [ ] Implement portfolio grade calculation (A/B/C/D)
- [ ] Create prompt template with OpenAI function calling

### Project Upgrade Engine
- [ ] Create feature recommendation engine
- [ ] Generate 3 feature additions ranked by career impact
- [ ] Estimate implementation time for each feature
- [ ] Identify companies that look for similar projects
- [ ] Create API endpoint for upgrade suggestions

### Frontend - Project Analysis
- [ ] Create /projects/[id]/analyze page
- [ ] Build GitHub URL input form
- [ ] Build analysis results display component
- [ ] Create visual score card component
- [ ] Display improvement suggestions
- [ ] Show feature recommendations with time estimates
- [ ] Implement loading states and error handling

### Testing (Phase 2)
- [ ] Write pytest unit tests for GitHub integration
- [ ] Write pytest unit tests for AI analyzer chain
- [ ] Write Jest tests for frontend analysis components
- [ ] Write integration tests for analyze endpoint

---

## Phase 3: Mentor Marketplace

### Database Models
- [ ] Create MentorProfile model
- [ ] Create MentorAvailability model
- [ ] Create MentorSession model
- [ ] Create Review model
- [ ] Add Stripe payment intent fields

### Mentor Matching AI
- [ ] Create mentor matching algorithm using pgvector
- [ ] Implement cosine similarity search on expertise embeddings
- [ ] Match student project + career goal to mentor expertise
- [ ] Rank mentors by relevance score

### Mentor API Endpoints
- [ ] Create GET /mentors endpoint with filters
- [ ] Implement expertise filter
- [ ] Implement rating filter
- [ ] Implement price_range filter
- [ ] Implement availability filter
- [ ] Create POST /mentors/match endpoint (AI-powered)
- [ ] Create POST /sessions/book endpoint
- [ ] Create POST /sessions/[id]/review endpoint
- [ ] Create GET /sessions endpoint (user's sessions)

### Stripe Integration
- [ ] Set up Stripe API keys
- [ ] Create Stripe webhook handler for payment confirmation
- [ ] Implement payment intent creation for session booking
- [ ] Handle payment success/failure states

### Frontend - Mentor Marketplace
- [ ] Create /mentors page layout
- [ ] Build mentor card component
- [ ] Implement mentor filters UI (expertise, rating, price, availability)
- [ ] Build mentor detail view
- [ ] Create booking flow (calendar + payment)
- [ ] Build session history view
- [ ] Create review submission form
- [ ] Implement mentor search functionality

### Frontend - Payment Integration
- [ ] Integrate Stripe payment UI
- [ ] Handle payment confirmation
- [ ] Display booking confirmation
- [ ] Implement error handling for failed payments

### Testing (Phase 3)
- [ ] Write pytest tests for mentor matching algorithm
- [ ] Write pytest tests for Stripe webhook handler
- [ ] Write Jest tests for mentor components
- [ ] Write integration tests for booking flow

---

## General Tasks

### Code Quality & Testing
- [ ] Set up comprehensive error handling across backend
- [ ] Add input validation for all API endpoints
- [ ] Add comprehensive logging
- [ ] Write unit tests for all critical functions
- [ ] Write integration tests for API flows
- [ ] Set up CI/CD pipeline

### Documentation
- [ ] Document API endpoints with examples
- [ ] Create user guide for onboarding
- [ ] Document AI prompts and chains
- [ ] Create deployment guide

### Performance & Optimization
- [ ] Optimize database queries with indexes
- [ ] Implement caching for role requirements and skills
- [ ] Optimize image loading and caching
- [ ] Profile and optimize slow API endpoints

### Security
- [ ] Implement rate limiting on API endpoints
- [ ] Add CORS configuration
- [ ] Validate and sanitize all inputs
- [ ] Secure sensitive data (API keys, tokens)
- [ ] Implement proper error messages (no info leakage)

---

## Notes
- All code must be production-grade with complete type safety
- No TODOs left in final code
- Complete error handling and input validation required
- All API responses must be properly typed
- Database migrations must be versioned and reversible
