## Purpose

Shows each role a dashboard of live counts from WorkTrack tables, or empty-state copy when a metric has no rows.

## ADDED Requirements

### Requirement: Five role dashboards from real data

The system SHALL provide a distinct dashboard for admin, manager, project head, employee, and intern. Every number and list SHALL come from the database. When a section has no rows, the system SHALL show an empty-state message (for example "No users found.", "No projects available.", "No tasks assigned.", "No attendance records available.", "No learning logs submitted."). The system MUST NOT hard-code statistics, invent analytics, or seed dashboard rows.

#### Scenario: Empty admin dashboard

- **WHEN** an admin opens the dashboard and no presence, projects, or tasks exist
- **THEN** those sections show empty-state copy (user counts may include only real accounts such as the bootstrap admin) and do not show placeholder charts with fake percentages

#### Scenario: Admin numbers match tables

- **WHEN** two employees exist and one has a Present row today
- **THEN** admin today’s presence reflects that one Present row and does not add extra sample attendees

### Requirement: Admin dashboard contents

The admin dashboard SHALL display, from live queries: total users; users by role; today’s presence (present, late, absent, attendance percentage); total/active/completed/overdue projects; tasks by status (pending, in progress, submitted, approved, rejected); employee engagement as counts of real end-of-day summaries (and related real presence/task activity), not a made-up composite score; intern learning-log statistics from real logs.

#### Scenario: Absent is computed

- **WHEN** it is a configured working day and an active employee has no presence row
- **THEN** that employee is counted Absent and no Absent row is inserted

### Requirement: Manager dashboard contents

The manager dashboard SHALL display that manager’s projects, derived progress, deadlines, budgets, and task statistics for those projects only.

#### Scenario: Manager does not see another manager’s projects

- **WHEN** manager A opens the dashboard
- **THEN** project and task numbers exclude manager B’s projects

### Requirement: Project head dashboard contents

The project head dashboard SHALL display assigned projects and progress, assigned tasks, pending reviews, approved and rejected tasks, employee versus intern task progress, and intern learning logs for relevant interns.

#### Scenario: Pending reviews are submitted or resubmitted

- **WHEN** two tasks on the head’s projects are submitted or resubmitted
- **THEN** pending reviews is 2 and does not include tasks still pending with the assignee

### Requirement: Employee and intern dashboards

The employee dashboard SHALL display today’s presence status, assigned tasks, deadlines, task progress, feedback, and end-of-day summary status. The intern dashboard SHALL display today’s presence status, assigned tasks, deadlines, task progress, feedback, and daily learning-log status.

#### Scenario: Employee with no tasks and no scan

- **WHEN** an employee has no tasks and has not scanned today
- **THEN** the dashboard shows no-tasks and not-recorded empty states, not sample assignments

### Requirement: Derived project completion and overdue

Completed and overdue project counts SHALL be derived: a project is completed when it has at least one task and every task is approved; a project is overdue when its deadline is before the current working date and it is not completed. Active projects are those not completed. The system MUST NOT require a separately seeded “completed” flag for dashboards.

#### Scenario: Overdue with open tasks

- **WHEN** a project deadline is yesterday and a task is still in progress
- **THEN** the project counts as overdue and not completed
