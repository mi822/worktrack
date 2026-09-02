## Purpose

Lets an admin store organization working days and hours so presence status can be computed from real configuration instead of hardcoded times.

## ADDED Requirements

### Requirement: Admin configures the work schedule

An admin SHALL be able to set working days, working start time, working end time, late threshold, and an optional break period. The system SHALL persist these values in the database. Non-admin roles MUST NOT change the schedule.

#### Scenario: Admin saves hours

- **WHEN** an admin saves start 09:00, end 18:00, late threshold 15 minutes after start, and weekdays Monday–Friday
- **THEN** those values are stored and shown again after reload

#### Scenario: Non-admin cannot change hours

- **WHEN** a manager attempts to update the work schedule
- **THEN** the system refuses the change and the previous schedule remains

#### Scenario: Invalid range is refused

- **WHEN** an admin submits an end time that is not after the start time, or a negative late threshold
- **THEN** the system refuses the save and keeps the previous valid schedule if one exists

### Requirement: Unset schedule is an empty state

Until an admin has saved a complete schedule, the system MUST NOT invent default working hours in the user interface. Presence recording that needs the schedule SHALL be refused with a configuration empty state rather than using hardcoded times.

#### Scenario: Hours not configured

- **WHEN** no work schedule has been saved and a user opens presence or hours display
- **THEN** the system shows that working hours are not configured and does not display sample times such as 08:30–17:00 unless an admin actually saved them

### Requirement: Schedule is readable for presence

Authenticated users who must scan SHALL be able to read the saved schedule values needed to interpret their own presence status. The system MUST NOT expose admin-only configuration screens to those roles.

#### Scenario: Employee can read configured hours for status

- **WHEN** an admin has saved a schedule and an employee’s presence is recorded
- **THEN** Present versus Late is determined from that saved schedule, not from browser-local guesses alone
