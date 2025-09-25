# Thailand Cannabis GACP Certification Platform

## Project Overview
- Digital platform for farmers to apply for GACP certification
- Features: Application, E-Learning, Assessment, Document Management, Notifications, Online Payment

## Architecture
- **Frontend:** React/Next.js, TypeScript, Tailwind CSS, HeadlessUI
- **Backend:** Node.js (Express/Fastify), TypeScript, Prisma, PostgreSQL
- **Auth:** NextAuth.js/JWT
- **CI/CD:** GitHub Actions, Vercel/Railway

## Structure
- `src/` - Frontend app
- `backend/` - API & business logic (Node.js/Express)
- `prisma/` or `supabase/` - Database schema
- `.github/workflows/` - CI/CD

## Getting Started
1. Clone repo
2. Setup .env from .env.example
3. Run `npm install`
4. Start frontend: `npm run dev`
5. Start backend: `cd backend && npm install && npm run dev`

## Deployment
- Frontend: Vercel
- Backend: Railway

## TODO
- เพิ่ม unit/integration tests
- เพิ่ม notification channel (SMS/Email)
- เพิ่ม e-learning module
- เพิ่ม mock test, data, และ integration test
- เพิ่ม blockchain verification (option) ❌ **(งดตามคำขอ)**