# RentNest 🏠

A full-featured rental property management platform backend built with **Express.js**, **TypeScript**, and **Prisma ORM**. RentNest connects tenants looking for rental properties with landlords who list them, with an admin layer for platform moderation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Authentication & Authorization](#authentication--authorization)

---

## Features

### Public
- Browse all available rental properties
- Search and filter by location, price range, property type
- View detailed property listings and categories

### Tenant
- Register and log in
- Submit rental requests for properties
- Make payments via **Stripe** after a request is approved
- View payment history and status
- View rental request history (pending / approved / rejected)
- Leave reviews after a completed rental
- Manage profile

### Landlord
- Register and log in
- Create, edit, and remove property listings
- Set property availability status
- Approve or reject tenant rental requests
- View rental history and tenant reviews

### Admin
- View and manage all users (ban / unban)
- View all listings and rental requests
- Manage property categories

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| Validation | Zod |
| Payments | Stripe, SSLCommerz |
| Dev Runner | `tsx watch` |

---

## User Roles

| Role | Description | Key Permissions |
|---|---|---|
| **Tenant** | Users looking for rental properties | Browse listings, submit rental requests, leave reviews, manage profile |
| **Landlord** | Property owners who list rentals | Create/manage listings, approve/reject requests, view tenant history |
| **Admin** | Platform moderators | Manage all users, oversee all listings & requests, manage categories |

---

## Database Schema

Core models managed via Prisma:

- **User** — stores account info, `role` (`TENANT` / `LANDLORD` / `ADMIN`), and `status` (`ACTIVE` / `BANNED`)
- **Category** — property type categories (apartment, house, studio, etc.)
- **Property** — rental listings linked to a landlord and an optional category
- **RentalRequest** — a tenant's request to rent a property, with a `status` lifecycle (`PENDING` → `APPROVED` / `REJECTED` / `CANCELLED`)
- **Payment** — transaction record linked 1:1 to an approved rental request, tracking `provider` (Stripe) and `status`
- **Review** — tenant feedback on a property, one per tenant per property

Run `npx prisma studio` to inspect data visually, or see `prisma/schema.prisma` for the full model definitions.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (tenant/landlord) |
| POST | `/api/auth/login` | Login user, return JWT |
| GET | `/api/auth/me` | Get current authenticated user |
| PATCH | `/api/auth/me` | Update own profile |

### Properties (Public)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/properties` | Get all properties with filters (location, price, type) |
| GET | `/api/properties/:id` | Get property details |
| GET | `/api/categories` | Get all property categories |

### Landlord Management
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/landlord/properties` | Create new property listing |
| PUT | `/api/landlord/properties/:id` | Update property listing |
| DELETE | `/api/landlord/properties/:id` | Remove property listing |
| GET | `/api/landlord/requests` | Get all rental requests for landlord's properties |
| PATCH | `/api/landlord/requests/:id` | Approve or reject a rental request |

### Rental Requests
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rentals` | Submit a rental request (tenant) |
| GET | `/api/rentals` | Get user's rental requests |
| GET | `/api/rentals/:id` | Get rental request details |

### Payments (Stripe / SSLCommerz)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create` | Create a payment intent/session for an approved rental |
| POST | `/api/payments/confirm` | Confirm/verify payment (webhook or callback) |
| GET | `/api/payments` | Get user's payment history |
| GET | `/api/payments/:id` | Get payment details |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reviews` | Create review (after completed rental) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | Get all users |
| PATCH | `/api/admin/users/:id` | Update user status (ban/unban) |
| GET | `/api/admin/properties` | Get all properties |
| GET | `/api/admin/rentals` | Get all rental requests |

 
---

## Authentication & Authorization

- Auth uses **JWT** issued on login, sent via `Authorization: Bearer <token>` header or `accessToken` cookie.
- The `auth()` middleware verifies the token, re-fetches the **current** user record from the database (never trusts stale JWT claims for authorization), and rejects banned accounts.
- Role-based access is enforced by passing allowed roles into the middleware:

```typescript
router.post("/properties", auth(Role.LANDLORD), landlordController.createProperties);
router.get("/users", auth(Role.ADMIN), adminController.getAllUsers);
```

- Users can only update their own profile via `/api/auth/:id`; admin-level user management (ban/unban, role changes) is restricted to dedicated `/api/admin` routes.

---
