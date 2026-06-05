CREATE TABLE `careerPaths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetRoleId` int NOT NULL,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`skillGapAnalysis` text,
	`completionPercentage` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careerPaths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`skillId` int NOT NULL,
	`isPrimary` boolean DEFAULT false,
	CONSTRAINT `projectSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`techStack` text,
	`careerRelevance` decimal(5,2),
	`estimatedTime` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('project','skill','role','mentor') NOT NULL,
	`targetId` int NOT NULL,
	`score` decimal(5,2),
	`reason` text,
	`dismissed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roleSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`skillId` int NOT NULL,
	`proficiencyLevel` enum('beginner','intermediate','advanced') NOT NULL,
	`priority` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`seniority` enum('junior','mid','senior','lead') NOT NULL,
	`embedding` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_title_unique` UNIQUE(`title`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`embedding` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `skills_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`profileImageUrl` varchar(500),
	`currentRole` varchar(255),
	`yearsOfExperience` decimal(5,2),
	`location` varchar(255),
	`linkedinUrl` varchar(500),
	`portfolioUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`status` enum('in_progress','submitted','completed','abandoned') NOT NULL,
	`githubUrl` varchar(500),
	`portfolioUrl` varchar(500),
	`description` text,
	`submittedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillId` int NOT NULL,
	`proficiencyLevel` enum('beginner','intermediate','advanced') NOT NULL,
	`yearsOfExperience` decimal(5,2),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSkills_id` PRIMARY KEY(`id`)
);
