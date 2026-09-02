## Purpose

Lets a project head create and review tasks and lets employees and interns work only the tasks assigned to them.

## ADDED Requirements

### Requirement: Project head creates and assigns tasks

A project head SHALL be able to create tasks on projects assigned to them, set description, priority, and deadline, and assign each task to exactly one employee or exactly one intern. They MUST NOT create tasks on projects they are not assigned to.

#### Scenario: Head creates a task for an employee

- **WHEN** the head of project P creates a task on P assigned to an employee
- **THEN** that employee can see the task and another employee cannot

#### Scenario: Head cannot create tasks on another head’s project

- **WHEN** a project head attempts to create a task on a project assigned to a different head
- **THEN** the system refuses the action

### Requirement: Task workflow

Tasks SHALL follow: Pending → In Progress → Submitted → Approved. After rejection the path SHALL be Rejected (with feedback) → Resubmitted → Approved. Employees and interns SHALL be able to update status on their assigned tasks, submit completed work, view feedback, and resubmit after rejection. Only the project head responsible for the project SHALL approve or reject.

#### Scenario: Happy path to approved

- **WHEN** an assignee moves a pending task in progress, submits it, and the project head approves
- **THEN** the task status is Approved

#### Scenario: Rejection includes feedback

- **WHEN** the project head rejects a submitted task
- **THEN** the task is Rejected and stores a feedback/reason the assignee can read

#### Scenario: Resubmit after reject

- **WHEN** the assignee resubmits a rejected task and the head approves
- **THEN** the task status is Approved

#### Scenario: Other head cannot approve

- **WHEN** a project head who does not own the project attempts to approve the task
- **THEN** the system refuses the approval and the status is unchanged

### Requirement: Assignee-only access

Employees and interns MUST only access tasks assigned to them. The system MUST NOT list other people’s tasks on their work screens.

#### Scenario: Intern cannot open another intern’s task

- **WHEN** intern A is assigned task T and intern B is not
- **THEN** intern B cannot view or update T

### Requirement: Empty task lists without dummy data

When a person has no assigned tasks, the system SHALL show an empty-state message such as "No tasks assigned." The system MUST NOT insert fake tasks.

#### Scenario: New employee has no tasks

- **WHEN** an employee with zero assignments opens their task list
- **THEN** the system shows the empty-state message and does not show sample tasks
