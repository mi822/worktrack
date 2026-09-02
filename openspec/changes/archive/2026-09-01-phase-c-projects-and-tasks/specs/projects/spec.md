## Purpose

Lets a manager create and own projects, assign one project head, and see progress derived from that project’s real tasks.

## ADDED Requirements

### Requirement: Manager manages owned projects

A manager SHALL be able to create, edit, and view projects they own, including description, start date, deadline, and budget, and SHALL assign exactly one project head. A manager MUST only manage projects they are authorized to manage (projects they created/own). Non-managers MUST NOT create organization-wide projects through the manager interface.

#### Scenario: Manager creates a project and assigns a head

- **WHEN** a manager creates a project with description, start date, deadline, budget, and a project-head account
- **THEN** that project is stored as theirs and the assigned head can see it as assigned

#### Scenario: Manager cannot edit another manager’s project

- **WHEN** manager B requests update of a project owned by manager A
- **THEN** the system refuses the change

#### Scenario: Empty project list

- **WHEN** a manager has no projects
- **THEN** the system shows an empty-state message such as "No projects available." and does not invent projects

### Requirement: One project head per project

Each project SHALL have at most one project head. The assigned project head SHALL see that project as assigned. Project heads MUST NOT see or manage projects not assigned to them.

#### Scenario: Head sees only assigned projects

- **WHEN** a project head is assigned to project P and not to project Q
- **THEN** they can view P and cannot manage Q

### Requirement: Project progress is derived

The system SHALL derive project progress from that project’s tasks (for example approved tasks versus total tasks). The system MUST NOT display hardcoded progress percentages. When a project has no tasks, progress SHALL show an empty or zero-from-zero empty state, not a fake 50%.

#### Scenario: No tasks yet

- **WHEN** a manager views a project that has no tasks
- **THEN** the system does not show invented task counts or sample progress
