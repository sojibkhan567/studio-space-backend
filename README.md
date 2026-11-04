# Studio Space API — Test URLs

Base URL: `http://localhost:5000`

## Studio APIs

| Method | API URL |
|---|---|
| GET | `http://localhost:5000/` |
| GET | `http://localhost:5000/studios` |
| GET | `http://localhost:5000/studios/:id` |
| POST | `http://localhost:5000/studios` |
| GET | `http://localhost:5000/studios/me` |
| PATCH | `http://localhost:5000/studios/:id` |
| DELETE | `http://localhost:5000/studios/:id` |

## Booking APIs

| Method | API URL |
|---|---|
| POST | `http://localhost:5000/bookings` |
| GET | `http://localhost:5000/bookings/me` |
| PATCH | `http://localhost:5000/bookings/:id/cancel` |

## Authentication

Protected endpoints require this request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Replace `:id` in the URLs with the actual MongoDB document ID.
