## Purpose

Lets an intern store one learning log per working date and lets the relevant project head read those real logs.

## ADDED Requirements

### Requirement: Intern submits a daily learning log

An intern SHALL be able to submit a log for the current working date containing what they learned, activities performed, challenges encountered, skills/knowledge gained, and areas requiring improvement. The system SHALL store the log associated with that intern and working date. The database MUST enforce at most one log per intern per working date.

#### Scenario: First log of the day is stored

- **WHEN** an intern submits all required fields for a working date with no existing log
- **THEN** the row is stored and associated with that intern and date

#### Scenario: Duplicate log is refused

- **WHEN** the intern submits another log for the same working date
- **THEN** the system does not create a second row (it MAY update the existing row; it MUST NOT duplicate)

### Requirement: Project head reads relevant intern logs

A project head SHALL be able to view learning logs for interns relevant to them (interns who have tasks on projects assigned to that head). They MUST NOT view logs for unrelated interns.

#### Scenario: Head sees assigned intern’s log

- **WHEN** intern I has a task on the head’s project and has submitted a log
- **THEN** that head can read I’s log

#### Scenario: Head cannot see unrelated intern

- **WHEN** intern J has no tasks on the head’s projects
- **THEN** that head cannot read J’s logs

### Requirement: Empty logs without dummy data

When no logs exist, the system SHALL show an empty-state message such as "No learning logs submitted." The system MUST NOT insert fake logs.

#### Scenario: Empty intern log list

- **WHEN** a project head has relevant interns but none have submitted logs
- **THEN** the system shows the empty-state message and does not invent log text
