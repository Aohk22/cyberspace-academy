import {
	type RouteConfig,
	index,
	layout,
	route,
} from '@react-router/dev/routes'

export default [
	route('ai-chat', './routes/ai-chat.ts'),

	route('login', './pages/Login.tsx'),
	route('register', './pages/Register.tsx'),
	route('regsitraion-success', './pages/RegisterSuccess.tsx'),

	layout('./routes/protected.tsx', [
		layout('./layouts/MainLayout.tsx', [
			layout('./layouts/SectionLayout.tsx', [

				index('./pages/Dashboard.tsx'),

				route('courses', './pages/Courses.tsx'),

				layout('./layouts/UnderConstructionLayout.tsx', [
					route('achievements', './pages/Achievements.tsx'),
				]),

				route('profile', './pages/Profile.tsx'),

				route('settings', './pages/Settings.tsx'),

				route('courses/:courseId', './pages/CourseDetail.tsx'),

				route('courses/:courseId/lessons/:lessonId', './pages/Lesson.tsx'),

				route('course-builder', './pages/CourseBuilder.tsx'),

			]),
		]),
	]),
	route('*', './routes/splat-redirect.tsx'),
] satisfies RouteConfig
