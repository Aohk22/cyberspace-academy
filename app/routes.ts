import {
	type RouteConfig,
	index,
	layout,
	route,
} from '@react-router/dev/routes'

export default [
	route('login', './pages/Login.tsx'),
	route('register', './pages/Register.tsx'),
	route('registration-success', './pages/RegisterSuccess.tsx'),
	route('forgot-password', './pages/ForgotPassword.tsx'),
	route('reset-password', './pages/ResetPassword.tsx'),

	layout('./routes/protected.tsx', [
		layout('./layouts/MainLayout.tsx', [
			index('./pages/IndexRedirect.tsx'),
			route('toggle-view', './routes/ToggleView.ts'),

			layout('./layouts/SectionLayout.tsx', [
				// User navigation.
				route('dashboard', './pages/Dashboard.tsx'),

				route('challenges', './pages/Challenges.tsx'),

				route('courses', './pages/Courses.tsx'),
				route('courses/:courseId', './pages/CourseDetail.tsx'),
				route('courses/:courseId/lessons/:lessonId',
					'./pages/Lesson.tsx',
				),

				route('learning-path', './pages/LearningPath.tsx'),
				route('learning-path/:pathId', './pages/LearningPathDetail.tsx'),

				layout('./layouts/UnderConstructionLayout.tsx', [
					route('achievements', './pages/Achievements.tsx'),
				]),


				// Admin navigation.
layout('./routes/admin-protected.tsx', [
		route('admin', './pages/admin/AdminDashboard.tsx'),

		route('course-builder', './pages/CourseBuilder.tsx'),
		route(
			'course-builder/:courseId/lessons/:lessonId',
			'./pages/CourseBuilderLesson.tsx',
		),
		route('course-builder/:courseId/export', './routes/CourseExport.ts'),

		route('users', './pages/admin/AdminUsers.tsx'),
		route('users/new', './pages/admin/AdminCreateUser.tsx'),
		route('users/:userId/edit', './pages/admin/AdminUserEdit.tsx'),

		route('categories', './pages/admin/AdminCategories.tsx'),

		route('paths-admin', './pages/admin/AdminPaths.tsx', [
			route(':pathId', './pages/admin/AdminPathDetail.tsx'),
		]),
	]),


				// General
				route('settings', './pages/Settings.tsx'),
			]),
		]),
	]),
	route('*', './routes/splat-redirect.tsx'),
] satisfies RouteConfig
