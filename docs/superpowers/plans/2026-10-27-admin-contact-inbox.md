# Admin Contact Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only contact inbox and a race-safe, server-enforced one-message-per-Gmail-address-per-UTC-day limit.

**Architecture:** Keep public messages in the existing `contact_messages` table. In a transaction, reserve a daily key in a new `contact_daily_limits` table and then insert the message; a unique key rejects simultaneous repeats. Render messages through the existing authenticated admin API and modern dashboard tab pattern.

**Tech Stack:** Existing PHP/MySQLi, vanilla JavaScript and CSS, Python unittest/Node test.

**Spec:** `docs/superpowers/specs/2026-10-27-admin-contact-design.md`

## Global Constraints

- No production uploads, database modifications, or credentials changes in this workflow.
- Preserve existing messages and hosted-only files; no wholesale SQL imports.
- Public validation must be on the server; admin reads must check session and role.
- New inbox text must be HTML-escaped and usable in both themes.

## Task 1: Atomic daily limit

**Files:** Modify `contact.php`; add `database/contact_daily_limits.sql`; add `tests/test_contact_daily_limit.py`.

**Interfaces:** `contact.php` accepts form POST `name,email,message`, returns JSON success or HTTP 422 for invalid fields, 429 for today's duplicate, 500 on storage failure. Daily reservation key `(email, submitted_on)` using UTC date; insert and reservation share one transaction. Schema SQL is for manual migration and must not be placed in `public_html`.

- [x] Write failing tests for invalid Gmail, duplicate guard/transaction behavior and schema key.
- [x] Run tests, confirm failure.
- [x] Add validation, daily reservation transaction and SQL schema; missing table returns storage error.
- [x] Run PHP lint and focused tests.

## Task 2: Admin inbox

**Files:** Modify `admin_api.php`, `admin_modern.php`, `admin_modern.js`, `admin_modern.css`; add `tests/test_admin_contact_inbox.js` and Python admin contract test.

**Interfaces:** GET `admin_api.php?action=contact_messages` returns `success:true,data:[{id,name,email,message,created_at}]` ordered newest first, no mutation; authenticated admins only. `#contact` tab under Announcements; list renders escaped name/email/message/date, loading/empty/error states; reload on tab entry.

- [x] Write failing admin API and rendering tests; confirm failure.
- [x] Add admin GET endpoint, tab markup/navigation, list rendering and theme-responsive card styles.
- [x] Run Node and Python tests, PHP lint, `node --check` and diff check.

## Task 3: Deployment handoff

**Files:** No live files changed.

- [x] Inspect final diff and verify only intended project files were edited; unrelated pre-existing untracked files remain untouched.
- [x] Explain manual Hostinger upload files and separate database migration, with backup prerequisite and no production claims.

## Verification limitation

Local PHP syntax checks, 11 Python checks, and 4 Node checks passed. The MySQL integration/concurrent-request test could not run: no accessible local MySQL instance was confirmed. The database primary key plus transaction supplies the concurrency guard; verify it against a staging database before publishing.

## Review Focus

- Invalid `@gmail.com` suffix versus lookalikes or malformed email.
- Two concurrent requests from the same email/day; only one can reserve the unique key.
- Rollback when message insert fails; slot must be available for retry.
- Non-admin and unauthenticated inbox requests are rejected.
- HTML injection in contact message/name is escaped; dark/light styles are readable.