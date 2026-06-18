# TMA Tour Management Frontend

Angular 21+ frontend application for TMA Tour Management order management system, integrated with Spring Boot backend.

## Prerequisites

- Node.js 18+ and npm
- Angular CLI 21+
- Spring Boot backend running on `http://localhost:8080`

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Access application at `http://localhost:4200`

## Features

- **Order Management**: Complete CRUD operations for orders
- **4-Step Order Creation**: Modal-based order creation workflow
- **Real-time Integration**: Connected to Spring Boot backend API
- **Responsive Design**: Modern UI with navigation and filtering
- **Status Tracking**: Order status management and updates

## Project Structure

```
Gourmet-Bookings-Frontend/
├── src/
│   ├── app/
│   │   ├── views/
│   │   │   ├── orders/
│   │   │   └── login/
│   │   ├── services/           # API service layer
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── main.ts
│   └── styles.css
├── public/
│   ├── nav-icons/
│   └── ui-icons/
├── package.json
├── angular.json
├── proxy.conf.json
└── README.md
```

## Integration with Backend

The frontend is fully integrated with the Spring Boot backend:

### API Service
- `ApiService` provides comprehensive TypeScript interfaces
- All backend endpoints are mapped
- Proper error handling and loading states

### Proxy Configuration
- Development proxy routes `/api/*` to backend
- CORS configured for seamless communication
- Production-ready configuration

### Data Flow
1. Frontend components call API service methods
2. API service makes HTTP requests to backend
3. Backend processes requests and returns data
4. Frontend updates UI with real-time data

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests

## Technologies Used

- **Angular 21+** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **RxJS** - Reactive programming
- **Angular CLI** - Build tooling
- **CSS3** - Styling and layout

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

- Uses proxy configuration for seamless backend integration
- Implements proper error handling and user feedback
- Responsive design for mobile and desktop
- Component-based architecture for maintainability
