import {
	type RouteConfig,
	index,
	layout,
	route,
} from '@react-router/dev/routes'

export default [
	route('login', './pages/Login.tsx'),
	route('register', './pages/Register.tsx'),
	route('regsitraion-success', './pages/RegisterSuccess.tsx'),

	layout('./routes/protected.tsx', [
		layout('./layouts/MainLayout.tsx', [
			layout('./layouts/SectionLayout.tsx', [
				index('./pages/Dashboard.tsx'),

				route('courses', './pages/Courses.tsx'),

				route('paths', './pages/Paths.tsx'),

				route('paths/:pathId', './pages/PathDetail.tsx'),

				layout('./layouts/UnderConstructionLayout.tsx', [
					route('achievements', './pages/Achievements.tsx'),
				]),

				route('profile', './pages/Profile.tsx'),

				route('settings', './pages/Settings.tsx'),

				route('courses/:courseId', './pages/CourseDetail.tsx'),

				route(
					'courses/:courseId/lessons/:lessonId',
					'./pages/Lesson.tsx',
				),

				route('admin', './pages/AdminDashboard.tsx'),

				route('admin/users', './pages/AdminUsers.tsx'),

				route('admin/users/new', './pages/AdminCreateUser.tsx'),

				route('admin/users/:userId/edit', './pages/AdminUserEdit.tsx'),

				route('admin/categories', './pages/AdminCategories.tsx'),

				route('admin/paths', './pages/AdminPaths.tsx'),

				route('admin/paths/:pathId', './pages/AdminPathDetail.tsx'),

				route('course-builder', './pages/CourseBuilder.tsx'),

				route(
					'course-builder/:courseId/lessons/:lessonId',
					'./pages/CourseBuilderLesson.tsx',
				),
			]),
		]),
	]),
	route('*', './routes/splat-redirect.tsx'),
] satisfies RouteConfig
