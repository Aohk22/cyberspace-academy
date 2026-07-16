---
phase: 01
slug: role-access-control-implementation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-17
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | vitest                                              |
| **Config file**        | vitest.config.ts                                    |
| **Quick run command**  | `pnpm exec vitest run app/auth/permissions.test.ts` |
| **Full suite command** | `pnpm exec vitest run`                              |
| **Estimated runtime**  | ~30 seconds                                         |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec vitest run app/auth/permissions.test.ts`
- **After every plan wave:** Run `pnpm exec vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref  | Secure Behavior                  | Test Type | Automated Command                         | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | -------------------------------- | --------- | ----------------------------------------- | ----------- | ---------- |
| 01-01-01 | 01   | 1    | —           | T-01-01 / — | can() denies when user null      | unit      | `vitest run app/auth/permissions.test.ts` | ✅ W0       | ⬜ pending |
| 01-02-01 | 01   | 1    | —           | T-01-02 / — | admin ⇒ staff only               | unit      | `vitest run app/auth/permissions.test.ts` | ✅ W0       | ⬜ pending |
| 01-03-01 | 01   | 2    | —           | T-01-03 / — | accessChallenges ⇒ lite/pro only | unit      | `vitest run app/auth/permissions.test.ts` | ✅ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `app/auth/permissions.test.ts` — unit tests for `can(user, action)` covering admin / accessChallenges / viewAsLearner and the null-user case
- [ ] Migrate `app/.server/payment/access.test.ts` — remove `canAccessChallenges` import, point challenge-access assertions at `can()`

_Existing vitest infrastructure covers the rest of phase requirements._

---

## Manual-Only Verifications

| Behavior                                         | Requirement | Why Manual                                                    | Test Instructions                                                        |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Staff `viewAsLearner` preview renders learner UI | —           | Requires session flag set via admin preview toggle in browser | Log in as staff, enable view-as-learner, confirm admin routes are hidden |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
