# AI Career & Project Intelligence Platform - Mobile App Design

## Overview
A comprehensive mobile app for students and professionals to map their career paths, identify skill gaps, discover relevant projects, and connect with mentors. The app uses AI to provide personalized career recommendations and project analysis.

## Screen List

### Phase 1 Core Screens
1. **Onboarding Flow** (Multi-step)
   - Welcome screen
   - Name input
   - Dream job selection
   - Current skills input
   - Completion confirmation

2. **Dashboard** (Home)
   - Skill gap visualization (progress bars)
   - Career roadmap summary
   - Top 3 recommended projects
   - Quick stats (completion %, next milestone)

3. **Projects Feed**
   - Browsable project list with cards
   - Filters: difficulty, tech stack, career relevance
   - Project detail view
   - Submit completed project

### Phase 2 Additional Screens
4. **Project Analysis**
   - GitHub URL input
   - Analysis results display
   - Skill score card
   - Career relevance rating
   - Improvement suggestions

5. **Project Upgrade Engine**
   - Feature recommendations
   - Time estimates
   - Company relevance

### Phase 3 Mentor Marketplace
6. **Mentors Browse**
   - Mentor cards with ratings
   - Filters: expertise, rating, price, availability
   - Mentor detail view

7. **Mentor Booking**
   - Calendar availability
   - Session details
   - Payment confirmation

8. **Session History & Reviews**
   - Past sessions
   - Review submission

## Primary Content and Functionality

### Onboarding Flow
- **Welcome**: Hero text, "Get Started" button
- **Name Input**: Text field, validation
- **Dream Job Selection**: Searchable dropdown or card grid of popular roles
- **Current Skills**: Tag input, multi-select from predefined skills list
- **Confirmation**: Summary of selections, "Start Learning" button

### Dashboard
- **Header**: User greeting, settings icon
- **Skill Gap Section**:
  - Target role display
  - Progress bar for overall skill completion
  - List of top 3 missing skills with priority badges
- **Recommended Projects**:
  - 3 project cards showing: title, difficulty, tech stack, relevance score
  - "View All" link to projects feed
- **Quick Actions**: "Update Skills", "Browse Projects", "Find Mentor"

### Projects Feed
- **Search/Filter Bar**: Difficulty, tech stack, career relevance
- **Project Cards**: Title, description snippet, difficulty badge, tech tags, relevance %
- **Detail View**: Full description, requirements, estimated time, submit button
- **Submit Project**: Form to upload GitHub link, description, screenshots

### Project Analysis (Phase 2)
- **Input Section**: GitHub URL field with "Analyze" button
- **Results Cards**:
  - Problem Clarity score (1-10)
  - Technical Complexity (1-10)
  - Career Relevance (%)
  - Portfolio Grade (A/B/C/D)
- **Improvements List**: 3-5 actionable suggestions
- **Feature Recommendations**: Ranked by career impact with time estimates

### Mentors Browse (Phase 3)
- **Mentor Cards**: Photo, name, expertise tags, hourly rate, rating, availability
- **Filters**: Expertise (dropdown), min rating (slider), price range (slider)
- **Detail View**: Bio, reviews, availability calendar, "Book Session" button

## Key User Flows

### Flow 1: Onboarding
1. User opens app → Welcome screen
2. Taps "Get Started" → Name input
3. Enters name → Dream job selection
4. Selects target role → Current skills input
5. Adds skills → Confirmation screen
6. Confirms → Dashboard

### Flow 2: Skill Gap Analysis
1. User on Dashboard
2. Taps "View Roadmap" → Detailed career path screen
3. Views missing skills ranked by priority
4. Taps skill → Recommended projects for that skill
5. Selects project → Project detail

### Flow 3: Project Submission
1. User completes a project
2. Taps "Submit Project" on Projects feed
3. Enters GitHub URL → App analyzes repo
4. Reviews analysis results
5. Adds description & screenshots
6. Submits → Confirmation

### Flow 4: Mentor Booking (Phase 3)
1. User on Dashboard → "Find Mentor"
2. Browsing mentors with filters
3. Taps mentor card → Detail view
4. Taps "Book Session"
5. Selects time slot from calendar
6. Reviews pricing → Payment
7. Confirmation with session details

## Color Choices

### Brand Colors
- **Primary**: `#0a7ea4` (Professional Blue) - CTAs, highlights, progress bars
- **Secondary**: `#22C55E` (Success Green) - Achievements, completed items
- **Accent**: `#F59E0B` (Amber) - Warnings, priority badges
- **Error**: `#EF4444` (Red) - Errors, blocked items

### Neutral Palette
- **Background**: `#ffffff` (light), `#151718` (dark)
- **Surface**: `#f5f5f5` (light), `#1e2022` (dark) - Cards, containers
- **Foreground**: `#11181C` (light), `#ECEDEE` (dark) - Primary text
- **Muted**: `#687076` (light), `#9BA1A6` (dark) - Secondary text
- **Border**: `#E5E7EB` (light), `#334155` (dark)

### Usage
- **Primary buttons**: `bg-primary text-white`
- **Success badges**: `bg-success text-white`
- **Warning badges**: `bg-warning text-black`
- **Card backgrounds**: `bg-surface border border-border`
- **Text**: `text-foreground` (primary), `text-muted` (secondary)

## Layout Principles

### Mobile Portrait (9:16)
- **Safe area**: Respect notch and home indicator
- **One-handed usage**: Tap targets in lower half of screen for primary actions
- **Spacing**: 16px padding on sides, 12px between elements
- **Typography**: 
  - Headings: 24-32px, bold
  - Body: 16px, regular
  - Secondary: 14px, regular
  - Labels: 12px, medium

### Navigation
- **Tab bar** (bottom): Home, Projects, Mentors (Phase 3), Profile
- **Modal sheets**: For filters, booking, submission forms
- **Stack navigation**: Detail views push on top of feed

### Responsive Considerations
- All screens designed for portrait orientation
- Horizontal scrolling for tech tag lists
- FlatList for long lists (projects, mentors)
- ScrollView for content-heavy screens

## Data Models (Frontend Types)

```typescript
interface User {
  id: string;
  name: string;
  targetRole: Role;
  currentSkills: Skill[];
  completedProjects: Project[];
}

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

interface Role {
  id: string;
  title: string;
  description: string;
  requiredSkills: Skill[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  techStack: string[];
  careerRelevance: number; // 0-100
  estimatedTime: number; // hours
  githubUrl?: string;
}

interface Mentor {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  hourlyRate: number;
  rating: number; // 0-5
  availability: TimeSlot[];
}
```

## Success Metrics
- Onboarding completion rate
- Dashboard engagement (daily active users)
- Project submissions per user
- Mentor booking conversion rate
- User skill progression over time
