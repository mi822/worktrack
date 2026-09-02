# qr-presence Specification

## Purpose

Records each non-admin user’s presence once per working day by scanning the organization’s active QR code and storing a real database row.

## Requirements

### Requirement: Admin manages the organization QR code

An admin SHALL be able to generate the organization QR code, activate it, deactivate it, and set a validity period when required. The system SHALL allow at most one active organization QR at a time. Non-admin roles MUST NOT generate, activate, or deactivate QR codes.

#### Scenario: Admin generates and activates a QR

- **WHEN** an admin generates a QR and activates it
- **THEN** that QR is the only active code and can be used for scans while it remains active and within its validity period

#### Scenario: Deactivated or expired QR is rejected

- **WHEN** a user scans a QR that is deactivated or past its validity period
- **THEN** the system does not create a presence row and reports that the code is not valid

#### Scenario: Non-admin cannot manage QR

- **WHEN** a project head attempts to deactivate the organization QR
- **THEN** the system refuses the action

### Requirement: One scan per user per working day

Managers, project heads, employees, and interns SHALL record presence by signing in, opening the scanner, and scanning the active organization QR. The backend MUST validate the scan and insert at most one presence record per user per working date. The database MUST enforce uniqueness on `(user, working date)`. A second successful scan MUST NOT create another row; the system SHALL tell the user that presence is already recorded for that day. The system MUST NOT offer a manual “Mark as Present” control, continuous scanning, periodic rechecking, or multiple presence rows per day.

#### Scenario: First scan records presence

- **WHEN** an employee with no presence row for the current working date scans the active QR
- **THEN** the system stores user, working date, scan time, status, and the QR used

#### Scenario: Second scan is refused

- **WHEN** that employee scans again on the same working date
- **THEN** the system does not insert another presence row and displays that presence has already been recorded for today

#### Scenario: Concurrent duplicate requests

- **WHEN** two scan requests for the same user and working date arrive at once
- **THEN** at most one presence row exists afterward

#### Scenario: Admin does not scan

- **WHEN** an admin is signed in
- **THEN** the system does not require them to scan and does not treat missing admin presence as absence

### Requirement: Present or Late from the schedule

On a successful scan, the system SHALL set status to Present when the scan time is on or before the configured late threshold, and Late when it is after that threshold. If the work schedule is not configured, the system MUST NOT record presence with a guessed status.

#### Scenario: Scan before late threshold is Present

- **WHEN** the late threshold is 15 minutes after 08:00 and an intern scans at 08:10
- **THEN** the presence status is Present

#### Scenario: Scan after late threshold is Late

- **WHEN** the late threshold is 15 minutes after 08:00 and a manager scans at 08:20
- **THEN** the presence status is Late

### Requirement: Admin can view real presence records

An admin SHALL be able to view presence records created by QR scans. The list MUST show only rows that exist in the database. When there are no rows, the system SHALL show an empty-state message such as "No attendance records available." The system MUST NOT insert fake attendance.

#### Scenario: Empty presence list

- **WHEN** an admin opens presence records and no scans have occurred
- **THEN** the system shows an empty-state message and does not display invented names or percentages

#### Scenario: List shows a real scan

- **WHEN** one employee has scanned today
- **THEN** the admin list includes that employee’s record with the stored time and status
