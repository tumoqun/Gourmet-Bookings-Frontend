# Frontend-Backend Integration Guide

## Overview
This document outlines the integration between the Angular frontend and Spring Boot backend for the Gourmet Bookings system.

## Architecture
- **Frontend**: Angular 21+ running on `http://localhost:4200`
- **Backend**: Spring Boot 3.2.5 running on `http://localhost:8080`
- **Database**: MySQL 8+ with `gourmet_bookings` schema

## Integration Components

### 1. Backend CORS Configuration
- Added `CorsConfig.java` to allow frontend requests
- Supports origins: `http://localhost:4200`, `http://localhost:8081`
- Allows all HTTP methods and headers

### 2. Frontend API Service
- Created `ApiService` with comprehensive TypeScript interfaces
- Implements all backend endpoints for Orders and Services
- Handles HTTP requests with proper error handling

### 3. Proxy Configuration
- Added `proxy.conf.json` for development
- Routes `/api/*` requests to backend at `http://localhost:8080`
- Configured in `angular.json` serve options

### 4. Updated Components
- Created `OrdersViewIntegrated` component
- Replaces mock data with real API calls
- Implements full CRUD operations for orders

## Development Setup

### Prerequisites
1. MySQL database with `gourmet_bookings` schema
2. Java 17+ and Maven for backend
3. Node.js and npm for frontend

### Running the Application

1. **Start Backend**:
   ```bash
   cd Gourmet-Bookings-Backend
   mvn spring-boot:run
   ```

2. **Start Frontend**:
   ```bash
   cd Gourmet-Bookings-Frontend
   npm install
   npm start
   ```

3. **Access Application**:
   - Frontend: `http://localhost:4200`
   - Backend API: `http://localhost:8080/api`

## API Endpoints Used

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order
- `POST /api/orders/{id}/submit` - Submit order
- `POST /api/orders/{id}/cancel` - Cancel order

### Services
- `GET /api/services` - List all services
- `GET /api/services/area/{id}` - Services by area
- `GET /api/services/type/{id}` - Services by type

## Data Flow

1. **Order Creation**:
   - Frontend collects data through 4-step modal
   - Creates `OrderCreateRequest` object
   - POSTs to `/api/orders`
   - Backend processes and saves to database

2. **Order Display**:
   - Frontend GETs from `/api/orders`
   - Maps backend data to display format
   - Updates UI with real-time data

3. **Order Management**:
   - Submit/Cancel actions call respective endpoints
   - Frontend refreshes order list after actions

## Error Handling

- Frontend displays error messages for failed requests
- Console logging for debugging
- Loading states during API calls

## Next Steps

1. **Complete Integration**:
   - Replace original `orders.ts` with `orders-integrated.ts`
   - Test all order management functions
   - Implement remaining features (assignments, catalog, etc.)

2. **Enhanced Features**:
   - Real-time updates with WebSockets
   - Advanced filtering and search
   - File uploads for documents

3. **Production Deployment**:
   - Configure production API URLs
   - Set up proper CORS for production domains
   - Implement authentication/authorization

## Troubleshooting

### CORS Issues
- Ensure backend CORS allows frontend origin
- Check proxy configuration in angular.json

### Connection Issues
- Verify backend is running on port 8080
- Check proxy.conf.json configuration
- Ensure MySQL database is accessible

### Build Issues
- Run `npm install` after adding new dependencies
- Check TypeScript compilation errors
- Verify Angular CLI version compatibility
