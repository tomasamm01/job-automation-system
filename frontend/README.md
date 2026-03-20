# Job Automation System - Frontend

Professional SaaS dashboard for the Job Automation System. Built with React, TypeScript, and modern tooling.

## Tech Stack

- **React 19** + **TypeScript** - UI framework
- **Vite** - Build tool with HMR
- **TanStack Query** - Server state management with caching
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/
│   ├── applications/    # Application tracking components
│   ├── jobs/            # Job listing components
│   ├── layout/          # Layout components (Sidebar, Header)
│   └── ui/              # Reusable UI components
├── hooks/               # React Query hooks
├── lib/                 # Utilities
├── pages/               # Page components
├── services/            # API layer
└── types/               # TypeScript types
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Key Features

### Job Dashboard
- Jobs sorted by **relevance score** (descending)
- Visual score indicators with color coding
- Filters: keyword, location, work mode, minimum score
- Loading, empty, and error states

### Job Detail
- Full job information with score breakdown
- One-click apply functionality
- Company information panel
- Link to original posting

### Application Tracker
- Track applications by status
- Status transitions: Applied → Interview → Offered
- Timeline view with key dates

### Analytics
- Response rate, interview rate, offer rate
- Application funnel visualization
- Performance insights

## API Integration

The frontend expects the backend to run on `http://localhost:5000`. The Vite dev server proxies `/api` requests automatically.

### Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `GET /api/jobs` | List jobs with filters |
| `GET /api/jobs/:id` | Job details |
| `GET /api/applications` | List applications |
| `POST /api/applications` | Create application |
| `PATCH /api/applications/:id/status` | Update status |
| `GET /api/metrics/dashboard` | Dashboard metrics |

## Design Decisions

1. **Score-first UI** - Relevance score is the primary visual element
2. **Decision-focused** - Interface designed for quick job evaluation
3. **Minimal state** - Server state via React Query, minimal client state
4. **Component reuse** - Shared UI components across pages
