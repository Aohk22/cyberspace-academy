import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from '../app/.server/database/connection'
import {
	users,
	categories,
	courses,
	modules,
	lessons,
	reviews,
	usersToCourses,
	learningPaths,
	pathCourses,
	challengeQuestions,
	challengeOptions,
	challenges,
	tags,
	challengeTags,
	userChallenges,
	pathChallenges,
} from '../app/.server/database/schema'

const CATEGORIES = [
	{ id: 1, name: 'Security' },
	{ id: 2, name: 'Cloud' },
]

const USERS = [
	{
		id: 1,
		name: 'Alice Johnson',
		email: 'alice@example.com',
		password:
			'$2b$10$L0JZezH14E1wHCrJykgFJey03QU2P1ysVfpIRWIbv5gm3Iar7/EL.',
		role: 'learner' as const,
	},
	{
		id: 2,
		name: 'Bob Smith',
		email: 'bob@example.com',
		password: 'hashed_password_2',
		role: 'learner' as const,
	},
	{
		id: 3,
		name: 'Carol White',
		email: 'carol@example.com',
		password: 'hashed_password_3',
		role: 'learner' as const,
	},
	{
		id: 4,
		name: 'Staff Admin',
		email: 'staff@example.com',
		password:
			'$2b$10$L0JZezH14E1wHCrJykgFJey03QU2P1ysVfpIRWIbv5gm3Iar7/EL.',
		role: 'staff' as const,
	},
]

const COURSES = [
	{
		id: 1,
		title: 'Ethical Hacking Fundamentals',
		description:
			'Learn the core concepts of ethical hacking and penetration testing.',
		instructor: 'John Doe',
		thumbnail: 'https://picsum.photos/seed/ethical-hacking/600/400',
		categoryId: 1,
		length: 36000,
	},
	{
		id: 2,
		title: 'Network Defense & Hardening',
		description:
			'Master firewall configuration and network hardening techniques.',
		instructor: 'Jane Smith',
		thumbnail: 'https://picsum.photos/seed/network-defense/600/400',
		categoryId: 1,
		length: 30600,
	},
	{
		id: 3,
		title: 'Cloud Security Architecture',
		description:
			'Secure cloud infrastructure across AWS and Azure environments.',
		instructor: 'Carlos Rivera',
		thumbnail: 'https://picsum.photos/seed/cloud-security/600/400',
		categoryId: 2,
		length: 43200,
	},
]

const MODULES = [
	{ id: 1, title: 'Introduction to Penetration Testing', courseId: 1 },
	{ id: 2, title: 'Network Scanning & Enumeration', courseId: 1 },
	{ id: 3, title: 'Firewall Configuration Basics', courseId: 2 },
	{ id: 4, title: 'Intrusion Detection Systems', courseId: 2 },
	{ id: 5, title: 'AWS Security Fundamentals', courseId: 3 },
	{ id: 6, title: 'Azure Identity & Access Management', courseId: 3 },
]

const LESSONS = [
	{
		id: 1,
		title: 'What is Ethical Hacking?',
		length: 750,
		contentMd: `# What is Ethical Hacking?

Ethical hacking is the authorized practice of testing systems, networks, and applications to discover weaknesses before attackers do.

## What you should understand

- Why authorization matters
- The difference between ethical hackers and malicious attackers
- The role of reporting and remediation

## Core idea

A security assessment only creates value when the findings are documented clearly and handed back to the team that owns the system.`,
		moduleId: 1,
	},
	{
		id: 2,
		title: 'Setting Up Your Lab Environment',
		length: 1080,
		contentMd: `# Setting Up Your Lab Environment

A safe lab lets you practice without risking production systems.

## Recommended setup

- A virtualization tool
- An attacker machine
- A target machine
- A note-taking workflow for commands and findings

## Before you begin

Make sure snapshots are enabled so you can reset your environment after each exercise.`,
		moduleId: 1,
	},
	{
		id: 3,
		title: 'Legal & Ethical Considerations',
		length: 615,
		contentMd: `# Legal and Ethical Considerations

Always get explicit permission before testing any environment.

## Rules to keep in mind

- Stay within scope
- Respect data privacy
- Avoid destructive testing unless it is approved
- Report findings responsibly

> A good security practitioner protects trust as much as infrastructure.`,
		moduleId: 1,
	},
	{
		id: 4,
		title: 'Using Nmap for Network Discovery',
		length: 1200,
		contentMd: `# Using Nmap for Network Discovery

Nmap helps identify reachable hosts and exposed services.

## Common workflow

1. Identify live hosts
2. Scan open ports
3. Collect service banners
4. Document the results

## Example focus areas

- TCP ports
- UDP ports
- Host discovery methods
- Timing and rate considerations`,
		moduleId: 2,
	},
	{
		id: 5,
		title: 'Service & Version Detection',
		length: 945,
		contentMd: `# Service and Version Detection

Knowing that a port is open is only the start. Version detection helps map a service to potential risk.

## Why it matters

- It helps verify what is actually running
- It provides context for vulnerability research
- It improves the quality of your report

## Output to capture

- Port number
- Service name
- Version string
- Confidence or uncertainty notes`,
		moduleId: 2,
	},
	{
		id: 6,
		title: 'Understanding Firewall Rules',
		length: 840,
		contentMd: `# Understanding Firewall Rules

Firewall rules define what traffic is allowed, denied, or logged.

## Key concepts

- Source and destination
- Protocol and port
- Direction of traffic
- Default deny vs default allow

A readable rule set is easier to maintain and far safer to audit.`,
		moduleId: 3,
	},
	{
		id: 7,
		title: 'Configuring iptables',
		length: 1350,
		contentMd: `# Configuring iptables

iptables is a rule-based packet filtering framework commonly used on Linux systems.

## Typical tasks

- List current rules
- Add allow rules
- Block unwanted traffic
- Save and verify the final policy

\`\`\`bash
iptables -L -n -v
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
\`\`\``,
		moduleId: 3,
	},
	{
		id: 8,
		title: 'Intro to Snort',
		length: 960,
		contentMd: `# Intro to Snort

Snort is an intrusion detection and prevention platform used to inspect traffic for suspicious patterns.

## What to learn first

- Traffic inspection basics
- Rule matching flow
- Alerting and logging
- Tuning for noise reduction`,
		moduleId: 4,
	},
	{
		id: 9,
		title: 'Writing Custom IDS Rules',
		length: 1160,
		contentMd: `# Writing Custom IDS Rules

Custom rules help detect patterns that matter to your own environment.

## Good rule-writing habits

- Start simple
- Test against known traffic
- Avoid noisy signatures
- Add comments for future maintainers`,
		moduleId: 4,
	},
	{
		id: 10,
		title: 'IAM Roles & Policies',
		length: 1020,
		contentMd: `# IAM Roles and Policies

Identity and access management is the control plane for cloud permissions.

## Design principles

- Least privilege
- Clear role boundaries
- Short-lived credentials where possible
- Review and removal of unused access`,
		moduleId: 5,
	},
	{
		id: 11,
		title: 'S3 Bucket Security',
		length: 825,
		contentMd: `# S3 Bucket Security

Storage security depends on both bucket configuration and identity policy design.

## Review checklist

- Public access settings
- Bucket policy scope
- Encryption at rest
- Logging and monitoring`,
		moduleId: 5,
	},
	{
		id: 12,
		title: 'Azure Active Directory Basics',
		length: 900,
		contentMd: `# Azure Active Directory Basics

Identity is central to access control in modern cloud platforms.

## Focus points

- Users and groups
- Application identities
- Role assignments
- Directory security posture`,
		moduleId: 6,
	},
	{
		id: 13,
		title: 'Conditional Access Policies',
		length: 1270,
		contentMd: `# Conditional Access Policies

Conditional access applies rules to authentication decisions based on user, device, app, or location context.

## Effective policy design

- Start in report-only mode
- Group similar scenarios together
- Minimize user friction
- Measure the impact before enforcing broadly`,
		moduleId: 6,
	},
]

const USERS_TO_COURSES = [
	{ userId: 1, courseId: 1 },
	{ userId: 1, courseId: 2 },
	{ userId: 1, courseId: 3 },
	{ userId: 2, courseId: 1 },
	{ userId: 2, courseId: 3 },
	{ userId: 3, courseId: 2 },
]

const REVIEWS = [
	{
		userIndex: 0,
		courseIndex: 0,
		rating: 5,
		content:
			'Excellent introduction to ethical hacking. The lab setup guide was very practical.',
	},
	{
		userIndex: 1,
		courseIndex: 0,
		rating: 4,
		content:
			'Great course, but some sections could use more real-world examples.',
	},
	{
		userIndex: 0,
		courseIndex: 1,
		rating: 4,
		content:
			'Network defense concepts are well explained. The iptables section was super useful.',
	},
	{
		userIndex: 2,
		courseIndex: 1,
		rating: 2,
		content:
			'A bit too advanced for beginners. The firewall rules section was confusing.',
	},
	{
		userIndex: 0,
		courseIndex: 2,
		rating: 3,
		content:
			'Decent overview of cloud security. I wish it covered more AWS-specific topics.',
	},
	{
		userIndex: 1,
		courseIndex: 2,
		rating: 5,
		content:
			'Cloud security architecture was eye-opening. Highly recommended for anyone moving to the cloud.',
	},
]

const LEARNING_PATHS = [
	{
		title: 'Security Foundations',
		description:
			'Master the fundamentals of ethical hacking and network defense.',
		thumbnail: 'https://picsum.photos/seed/security-foundations/600/400',
		tags: ['ethical-hacking', 'network-defense', 'beginners'],
		timeToComplete: 72000,
	},
	{
		title: 'Cloud Practitioner',
		description:
			'Build a strong foundation in cloud security architecture.',
		thumbnail: 'https://picsum.photos/seed/cloud-practitioner/600/400',
		tags: ['cloud', 'aws', 'azure', 'security'],
		timeToComplete: 43200,
	},
]

const PATH_COURSES = [
	{ pathIndex: 0, courseId: 1, position: 0 },
	{ pathIndex: 0, courseId: 2, position: 1 },
	{ pathIndex: 1, courseId: 3, position: 0 },
]

const PATH_CHALLENGES = [
	{ pathIndex: 0, challengeIndex: 0, position: 0 },
	{ pathIndex: 0, challengeIndex: 4, position: 1 },
	{ pathIndex: 1, challengeIndex: 2, position: 0 },
]

async function seed() {
	console.log('🌱 Seeding database...')

	await db.execute(sql`
		SET search_path TO cyberspace;

		CREATE OR REPLACE FUNCTION fill_user_lessons()
		RETURNS TRIGGER AS $$
		BEGIN
			INSERT INTO users_to_lessons (user_id, lesson_id, completed)
			SELECT NEW.user_id, l.id, false
			FROM lessons l
			INNER JOIN modules m ON l.module_id = m.id
			WHERE m.course_id = NEW.course_id
			ON CONFLICT DO NOTHING;
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;

		CREATE OR REPLACE TRIGGER on_course_enrollment
		AFTER INSERT ON cyberspace.users_to_courses
		FOR EACH ROW EXECUTE FUNCTION fill_user_lessons();
	`)

	console.log('✅ Trigger ready')

	const insertedCategories = await db
		.insert(categories)
		.values(CATEGORIES.map(({ id: _, ...c }) => c))
		.returning()

	console.log(`✅ Inserted ${insertedCategories.length} categories`)

	const categoryIdMap = Object.fromEntries(
		CATEGORIES.map((c, i) => [c.id, insertedCategories[i].id]),
	)

	const insertedUsers = await db
		.insert(users)
		.values(USERS.map(({ id: _, ...u }) => u))
		.returning()

	console.log(`✅ Inserted ${insertedUsers.length} users`)

	const userIdMap = Object.fromEntries(
		USERS.map((u, i) => [u.id, insertedUsers[i].id]),
	)

	const insertedCourses = await db
		.insert(courses)
		.values(
			COURSES.map(({ id: _, ...c }) => ({
				...c,
				categoryId: categoryIdMap[c.categoryId],
			})),
		)
		.returning()

	console.log(`✅ Inserted ${insertedCourses.length} courses`)

	const courseIdMap = Object.fromEntries(
		COURSES.map((c, i) => [c.id, insertedCourses[i].id]),
	)

	const insertedModules = await db
		.insert(modules)
		.values(
			MODULES.map(({ id: _, ...m }) => ({
				...m,
				courseId: courseIdMap[m.courseId],
			})),
		)
		.returning()

	console.log(`✅ Inserted ${insertedModules.length} modules`)

	const moduleIdMap = Object.fromEntries(
		MODULES.map((m, i) => [m.id, insertedModules[i].id]),
	)

	const insertedLessons = await db
		.insert(lessons)
		.values(
			LESSONS.map(({ id: _, ...l }) => ({
				...l,
				moduleId: moduleIdMap[l.moduleId],
			})),
		)
		.returning()

	console.log(`✅ Inserted ${insertedLessons.length} lessons`)

	await db.insert(usersToCourses).values(
		USERS_TO_COURSES.map((utc) => ({
			userId: userIdMap[utc.userId],
			courseId: courseIdMap[utc.courseId],
		})),
	)

	console.log(
		'✅ Inserted user-course enrollments (trigger auto-populated users_to_lessons)',
	)

	await db.insert(reviews).values(
		REVIEWS.map((r) => ({
			userId: userIdMap[r.userIndex + 1],
			courseId: courseIdMap[r.courseIndex + 1],
			rating: r.rating,
			content: r.content,
		})),
	)

	console.log(`✅ Inserted ${REVIEWS.length} reviews`)

	const insertedPaths = await db
		.insert(learningPaths)
		.values(LEARNING_PATHS)
		.returning()

	console.log(`✅ Inserted ${insertedPaths.length} learning paths`)

	await db.insert(pathCourses).values(
		PATH_COURSES.map((pc) => ({
			pathId: insertedPaths[pc.pathIndex].id,
			courseId: courseIdMap[pc.courseId],
			position: pc.position,
		})),
	)

	console.log('✅ Inserted path-course associations')

	// Challenge questions — added to lesson 1 (What is Ethical Hacking?) and lesson 6 (Understanding Firewall Rules)
	const CHALLENGE_QUESTIONS = [
		{
			lessonIndex: 0, // "What is Ethical Hacking?"
			type: 'multiple_choice' as const,
			questionText:
				'What distinguishes an ethical hacker from a malicious attacker?',
			correctAnswer: null,
			orderIndex: 0,
			options: [
				{
					optionText: 'Ethical hackers have better technical skills',
					isCorrect: false,
				},
				{
					optionText: 'Ethical hackers have explicit authorization',
					isCorrect: true,
				},
				{
					optionText: 'Ethical hackers use different tools',
					isCorrect: false,
				},
				{ optionText: 'Ethical hackers work faster', isCorrect: false },
			],
		},
		{
			lessonIndex: 0,
			type: 'flag' as const,
			questionText:
				'What is the term for the practice of testing systems with authorization to find weaknesses?',
			correctAnswer: 'ethical hacking',
			orderIndex: 1,
			options: [],
		},
		{
			lessonIndex: 1, // "Setting Up Your Lab Environment"
			type: 'flag' as const,
			questionText:
				'You are setting up your lab environment and find a sticky note on the monitor with the text "ZmxhZ3thbHc0eXNfZzR0aDNyXzFuZjBfd2gzbl9zM3R0MW5nX3VwfQ==". Decode this message to find the flag and enter it below.',
			correctAnswer: 'flag{alw4ys_g4th3r_1nf0_wh3n_s3tt1ng_up}',
			orderIndex: 0,
			options: [],
		},
		{
			lessonIndex: 5, // "Understanding Firewall Rules" (0-indexed after seed: lesson id 6 but index 5)
			type: 'flag' as const,
			questionText:
				'What is the security principle that says traffic should be denied unless explicitly allowed?',
			correctAnswer: 'default deny',
			orderIndex: 0,
			options: [],
		},
	]

	for (const cq of CHALLENGE_QUESTIONS) {
		const lessonId = insertedLessons[cq.lessonIndex].id

		const [createdQuestion] = await db
			.insert(challengeQuestions)
			.values({
				lessonId,
				questionText: cq.questionText,
				type: cq.type,
				correctAnswer: cq.correctAnswer,
				orderIndex: cq.orderIndex,
			})
			.returning({ id: challengeQuestions.id })

		if (cq.options.length > 0) {
			await db.insert(challengeOptions).values(
				cq.options.map((opt, i) => ({
					questionId: createdQuestion.id,
					optionText: opt.optionText,
					isCorrect: opt.isCorrect,
					orderIndex: i,
				})),
			)
		}
	}

	console.log('✅ Inserted challenge questions')

	// Standalone challenges (CTF-style)
	const CHALLENGES = [
		{
			name: 'SQL Injection Basics',
			description:
				'Find the flag by exploiting a SQL injection vulnerability in the login form. The database contains a secret table with the flag.',
			flag: 'flag{un1on_s3l3ct_1s_p0w3rful}',
			difficulty: 'easy',
			category: 'web',
			points: 100,
			tagNames: ['sql-injection', 'web-exploitation'],
		},
		{
			name: 'Packet Snoop',
			description:
				'A suspicious pcap file was captured on the network. Find the flag hidden in the network traffic.',
			flag: 'flag{p4ck3t_4n4lys1s_1s_k3y}',
			difficulty: 'easy',
			category: 'network',
			points: 100,
			tagNames: ['pcap', 'traffic-analysis'],
		},
		{
			name: 'Caesar\'s Secret',
			description:
				'We intercepted an encrypted message: "fdjlv{ohwv_ghfubsw_whd}". It looks like a classical cipher. Can you decode it?',
			flag: 'flag{lets_decrypt_tea}',
			difficulty: 'easy',
			category: 'crypto',
			points: 100,
			tagNames: ['caesar-cipher', 'classical'],
		},
		{
			name: 'Hidden in Plain Sight',
			description:
				'We found an image with some suspicious bytes at the end. Check the file and extract the secret message.',
			flag: 'flag{st3g0_is_fun}',
			difficulty: 'medium',
			category: 'forensics',
			points: 200,
			tagNames: ['steganography', 'file-analysis'],
		},
		{
			name: 'Buffer Overflow 101',
			description:
				'A simple program has a buffer overflow vulnerability. Overflow the buffer to call the `win` function and get the flag.',
			flag: 'flag{0v3rfl0w_th3_buff3r}',
			difficulty: 'medium',
			category: 'binary',
			points: 250,
			tagNames: ['buffer-overflow', 'pwntools'],
		},
		{
			name: 'Social Media Secrets',
			description:
				'Our target posted a photo on social media. Use OSINT techniques to find the flag hidden in their digital footprint.',
			flag: 'flag{0s1nt_1s_publ1c_1nf0}',
			difficulty: 'easy',
			category: 'osint',
			points: 100,
			tagNames: ['social-media', 'digital-footprint'],
		},
		{
			name: 'XSS Injection',
			description:
				'A comment form on the website is vulnerable to XSS. Bypass the sanitization to steal the admin cookie and get the flag.',
			flag: 'flag{cr0ss_s1t3_scr1pt1ng}',
			difficulty: 'medium',
			category: 'web',
			points: 200,
			tagNames: ['xss', 'web-exploitation'],
		},
		{
			name: 'ARP Poisoning',
			description:
				'An attacker on the local network is performing ARP spoofing. Analyze the traffic and find the intercepted flag.',
			flag: 'flag{4rp_sp00f_4tt4ck}',
			difficulty: 'medium',
			category: 'network',
			points: 200,
			tagNames: ['arp', 'mitm'],
		},
		{
			name: 'RSA Decryption',
			description:
				'We have an RSA encrypted message with n=77, e=7, ciphertext=15. Factor n and decrypt the message.',
			flag: 'flag{rs4_1s_n0t_s3cur3}',
			difficulty: 'hard',
			category: 'crypto',
			points: 350,
			tagNames: ['rsa', 'asymmetric'],
		},
		{
			name: 'Memory Dump Analysis',
			description:
				'A memory dump from a compromised machine was captured. Find the flag that was in the process memory.',
			flag: 'flag{m3m0ry_f0r3ns1cs}',
			difficulty: 'hard',
			category: 'forensics',
			points: 300,
			tagNames: ['memory-analysis', 'volatility'],
		},
		{
			name: 'Return-Oriented Programming',
			description:
				'ASLR and NX are enabled. Use ROP to bypass these protections and get a shell. The flag is in /root/flag.txt.',
			flag: 'flag{r0p_ch41n_m4st3r}',
			difficulty: 'insane',
			category: 'binary',
			points: 500,
			tagNames: ['rop', 'aslr-bypass'],
		},
		{
			name: 'GeoINT Challenge',
			description:
				'A photo was taken from a rooftop. Identify the city and landmark using visual clues to get the flag.',
			flag: 'flag{g30_sp4t14l_1nt3l}',
			difficulty: 'medium',
			category: 'osint',
			points: 200,
			tagNames: ['geolocation', 'visual-osint'],
		},
	]

	// Insert tags
	const allTagNames = [...new Set(CHALLENGES.flatMap((c) => c.tagNames))]
	const insertedTags = await db
		.insert(tags)
		.values(allTagNames.map((name) => ({ name })))
		.onConflictDoNothing()
		.returning()

	console.log(`✅ Inserted ${insertedTags.length} tags`)

	const tagMap = Object.fromEntries(
		insertedTags.map((t) => [t.name, t.id]),
	)

	// Insert challenges
	const insertedChallenges = await db
		.insert(challenges)
		.values(
			CHALLENGES.map(({ tagNames: _, ...c }) => c),
		)
		.returning()

	console.log(`✅ Inserted ${insertedChallenges.length} challenges`)

	// Insert challenge-tag associations
	const challengeTagValues = insertedChallenges.flatMap((ch, i) =>
		CHALLENGES[i].tagNames
			.filter((tn) => tagMap[tn])
			.map((tn) => ({
				challengeId: ch.id,
				tagId: tagMap[tn],
			})),
	)

	if (challengeTagValues.length > 0) {
		await db.insert(challengeTags).values(challengeTagValues)
	}

	console.log('✅ Inserted challenge-tag associations')

	await db.insert(pathChallenges).values(
		PATH_CHALLENGES.map((pch) => ({
			pathId: insertedPaths[pch.pathIndex].id,
			challengeId: insertedChallenges[pch.challengeIndex].id,
			position: pch.position,
		})),
	)

	console.log('✅ Inserted path-challenge associations')

	// Seed some user_challenges for solve counts
	const CHALLENGE_SOLVES = [
		{ userIndex: 0, challengeIndex: 0 }, // alice solved "SQL Injection Basics"
		{ userIndex: 0, challengeIndex: 2 }, // alice solved "Caesar's Secret"
		{ userIndex: 0, challengeIndex: 5 }, // alice solved "Social Media Secrets"
		{ userIndex: 1, challengeIndex: 0 }, // bob solved "SQL Injection Basics"
		{ userIndex: 2, challengeIndex: 0 }, // carol solved "SQL Injection Basics"
		{ userIndex: 2, challengeIndex: 2 }, // carol solved "Caesar's Secret"
	]

	for (const solve of CHALLENGE_SOLVES) {
		await db
			.insert(userChallenges)
			.values({
				userId: userIdMap[solve.userIndex + 1],
				challengeId: insertedChallenges[solve.challengeIndex].id,
			})
			.onConflictDoNothing()
	}

	console.log('✅ Inserted challenge solves')

	// Award achievement points to users who solved challenges
	await db.execute(sql`
		UPDATE users u
		SET achievement_points = (
			SELECT COALESCE(SUM(c.points), 0)
			FROM user_challenges uc
			INNER JOIN challenges c ON c.id = uc.challenge_id
			WHERE uc.user_id = u.id
		)
	`)

	console.log('✅ Updated achievement points')

	console.log('🎉 Seeding complete!')
}

seed()
	.catch((e) => {
		console.error('❌ Seed failed:', e)
		process.exit(1)
	})
	.finally(() => process.exit(0))
