# Edyra Master Product Specification — Implementation Tracking

## Phase 0 — Build Fixes & Critical Issues
- [ ] Fix frontend build error: faculty/profile static generation (add `force-dynamic` export)
- [ ] Fix faculty/layout.tsx to not cause static generation issues
- [ ] Run full frontend build and verify zero errors
- [ ] Verify backend health endpoint works without DB
- [ ] Smoke test all auth endpoints

## Phase 1 — Auth Module Completeness
- [ ] Verify student exam DOB login window + fingerprint binding
- [ ] Verify teacher/admin RBAC enforcement for protected routes
- [ ] Verify session validation endpoints and termination handling
- [ ] Ensure OTP/MFA flow is wired correctly
- [ ] Validate account lockout after 5 failed attempts
- [ ] Verify email verification flow works end-to-end

## Phase 2 — LMS Core (Moodle-style) DB-backed Completion
- [ ] Verify courses dashboard + structure + resources are wired to backend queries
- [ ] Verify assignments end-to-end: create → submit → grade → notification persistence
- [ ] Verify discussion forums + announcements wired to real DB records
- [ ] Verify course progress/completion tracking wired to DB
- [ ] Verify gradebook aggregation from submissions/grades
- [ ] Add any missing API endpoints needed by frontend pages

## Phase 3 — Attendance Management
- [ ] Verify manual attendance: marking + reports backed by DB
- [ ] Verify QR attendance: token generation + validation + audit logs
- [ ] Verify face verification pipeline integration
- [ ] Verify attendance analytics + export from DB

## Phase 4 — Gradebook + Academic Documents
- [ ] Verify grade aggregation from submissions/grades
- [ ] Verify transcripts/mark sheets/certificates generation
- [ ] Add PDF/Excel export endpoints if missing

## Phase 5 — Communications
- [ ] Verify messaging persistence + RBAC scopes
- [ ] Verify notifications read/unread persistence
- [ ] Verify department/institution scoped announcements
- [ ] Verify Socket.IO realtime notifications

## Phase 6 — Analytics + Reporting Engine
- [ ] Verify all analytics endpoints compute from DB queries
- [ ] Verify PDF/Excel/CSV exports are real DB-driven reports
- [ ] Add missing analytics endpoints

## Phase 7 — Security Audit
- [ ] Verify password hashing (bcrypt 12 rounds)
- [ ] Verify JWT token rotation
- [ ] Verify rate limiting on auth endpoints
- [ ] Verify input validation (Joi schemas)
- [ ] Verify audit logging for all critical operations
- [ ] Verify CORS configuration is correct
- [ ] Verify helmet security headers

## Phase 8 — Production Deployment
- [ ] Verify frontend build passes with zero errors
- [ ] Verify backend can deploy on Vercel serverless
- [ ] Verify environment variables configured
- [ ] Verify Docker configuration
- [ ] Run end-to-end flow tests
- [ ] Final deployment verification