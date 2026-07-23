# Sitemap

> Auto-generated from `app/routes.ts`

## Public (unauthenticated)

| Route                   | Page component        | Description                    |
| ----------------------- | --------------------- | ------------------------------ |
| `/login`                | `Login.tsx`           | User login                     |
| `/register`             | `Register.tsx`        | User registration              |
| `/registration-success` | `RegisterSuccess.tsx` | Post-registration confirmation |
| `/forgot-password`      | `ForgotPassword.tsx`  | Request password reset email   |
| `/reset-password`       | `ResetPassword.tsx`   | Reset password with token      |

## Authenticated (`protected.tsx` layout)

### Main layout (`MainLayout.tsx`)

#### Section layout (`SectionLayout.tsx`)

| Route | Page component      | Description   |
| ----- | ------------------- | ------------- |
| `/`   | `IndexRedirect.tsx` | Root redirect |

**User navigation**

| Route                                  | Page component     | Description                 |
| -------------------------------------- | ------------------ | --------------------------- |
| `/dashboard`                           | `Dashboard.tsx`    | User dashboard              |
| `/courses`                             | `Courses.tsx`      | Course catalog              |
| `/courses/:courseId`                   | `CourseDetail.tsx` | Single course detail        |
| `/courses/:courseId/lessons/:lessonId` | `Lesson.tsx`       | Lesson player               |
| `/paths`                               | `Paths.tsx`        | Learning paths listing      |
| `/paths/:pathId`                       | `PathDetail.tsx`   | Single learning path detail |

**Admin navigation** (gated by `admin-protected.tsx`)

| Route                                         | Page / route file          | Description                  |
| --------------------------------------------- | -------------------------- | ---------------------------- |
| `/admin`                                      | `AdminDashboard.tsx`       | Admin dashboard              |
| `/course-builder`                             | `CourseBuilder.tsx`        | Create / edit courses        |
| `/course-builder/:courseId/lessons/:lessonId` | `CourseBuilderLesson.tsx`  | Edit individual lesson       |
| `/course-builder/:courseId/export`            | `CourseExport.ts` (loader) | Export course data (JSON)    |
| `/users`                                      | `AdminUsers.tsx`           | List users                   |
| `/users/new`                                  | `AdminCreateUser.tsx`      | Create user                  |
| `/users/:userId/edit`                         | `AdminUserEdit.tsx`        | Edit user                    |
| `/categories`                                 | `AdminCategories.tsx`      | Manage categories            |
| `/paths-admin`                                | `AdminPaths.tsx`           | Admin learning paths listing |
| `/paths-admin/:pathId`                        | `AdminPathDetail.tsx`      | Edit single learning path    |

**General**

| Route           | Page component     | Description                                                                 |
| --------------- | ------------------ | --------------------------------------------------------------------------- |
| `/achievements` | `Achievements.tsx` | Achievements (under construction, wrapped in `UnderConstructionLayout.tsx`) |
| `/settings`     | `Settings.tsx`     | User settings                                                               |

## Catch-all

| Route | Route file           | Description              |
| ----- | -------------------- | ------------------------ |
| `*`   | `splat-redirect.tsx` | 404 catch-all → redirect |

## Layout hierarchy

```
<Root>
├── (public — no layouts)
│   ├── /login
│   ├── /register
│   ├── /registration-success
│   ├── /forgot-password
│   └── /reset-password
│
└── protected.tsx
    └── MainLayout.tsx
        └── SectionLayout.tsx
            ├── / (IndexRedirect)
            ├── /dashboard
            ├── /courses
            │   ├── /courses/:courseId
            │   └── /courses/:courseId/lessons/:lessonId
            ├── /paths
            │   └── /paths/:pathId
            │
            ├── admin-protected.tsx
            │   ├── /admin
            │   ├── /course-builder
            │   │   ├── /course-builder/:courseId/lessons/:lessonId
            │   │   └── /course-builder/:courseId/export
            │   ├── /users
            │   │   ├── /users/new
            │   │   └── /users/:userId/edit
            │   ├── /categories
            │   └── /paths-admin
            │       └── /paths-admin/:pathId
            │
            ├── UnderConstructionLayout.tsx
            │   └── /achievements
            │
            └── /settings

── * (splat-redirect.tsx)
```
