# Studio Space API

A REST API backend for a studio rental and booking platform. Studio owners can list their studios, and users can browse studios and book time slots. The API prevents double-booking by rejecting any booking that overlaps an existing pending or confirmed booking for the same studio and date.

## Tech Stack

- Node.js + Express
- MongoDB (database: `studio_space_db`, collections: `studios`, `bookings`)
- Better Auth JWT verification using `jose` (JWKS)
- CORS, dotenv

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a `.env` file

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_URL=your_better_auth_server_url
```

### 3. Run the server

```bash
node index.js
```

Server runs at: `http://localhost:5000`

> Note: the project uses ES modules, so add `"type": "module"` to your `package.json`.

## Authentication

Protected routes require a JWT issued by Better Auth in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

## API Endpoints

Base URL: `http://localhost:5000`

### Health Check

| Method | URL                      | Auth | Description            |
| ------ | ------------------------ | ---- | ---------------------- |
| GET    | `http://localhost:5000/` | No   | Returns "hello world!" |

### Studios

| Method | URL                                 | Auth | Description                               |
| ------ | ----------------------------------- | ---- | ----------------------------------------- |
| POST   | `http://localhost:5000/studios`     | Yes  | Create a studio                           |
| GET    | `http://localhost:5000/studios`     | No   | Get all studios                           |
| GET    | `http://localhost:5000/studios/me`  | Yes  | Get studios created by the logged-in user |
| GET    | `http://localhost:5000/studios/:id` | No   | Get a studio by ID                        |
| PATCH  | `http://localhost:5000/studios/:id` | Yes  | Update a studio                           |
| DELETE | `http://localhost:5000/studios/:id` | No   | Delete a studio                           |

### Bookings

| Method | URL                                         | Auth | Description                                                |
| ------ | ------------------------------------------- | ---- | ---------------------------------------------------------- |
| POST   | `http://localhost:5000/bookings`            | Yes  | Create a booking (returns `409` if the time slot is taken) |
| GET    | `http://localhost:5000/bookings/me`         | Yes  | Get bookings of the logged-in user                         |
| PATCH  | `http://localhost:5000/bookings/:id/cancel` | Yes  | Cancel a booking                                           |
