## Purpose

Identifies every WorkTrack user, assigns exactly one role, and sends them to the home that role is allowed to use.

## ADDED Requirements

### Requirement: Authenticated sign-in

The system SHALL require a person to sign in with email and password before any WorkTrack page other than the sign-in page is usable. Unauthenticated requests to protected pages SHALL be sent to sign-in.

#### Scenario: Successful sign-in

- **WHEN** a person with an active account submits a valid email and password
- **THEN** the system signs them in and shows the home page for their role

#### Scenario: Invalid credentials

- **WHEN** a person submits an unknown email or a wrong password
- **THEN** the system refuses access and shows an error without revealing whether the email exists

#### Scenario: Unauthenticated access

- **WHEN** a person who is not signed in opens a protected page
- **THEN** the system redirects them to sign-in

### Requirement: Exclusive role per account

Each account SHALL have exactly one role from: intern, employee, project_head, manager, admin. The system MUST NOT allow an account to hold two roles at once.

#### Scenario: Role is visible after sign-in

- **WHEN** a signed-in intern opens the application
- **THEN** the system treats them as intern only and does not show manager, project-head, or admin controls

### Requirement: Admin manages accounts

An admin SHALL be able to create, update, and deactivate user accounts, assign a role at create or update time, and set or reset passwords. Non-admin roles MUST NOT create, update, deactivate, change roles, or change passwords of accounts. A user MUST NOT change their own role. There SHALL be no public self-registration. Only an admin SHALL create manager, project_head, employee, and intern accounts.

#### Scenario: Admin creates an intern

- **WHEN** an admin creates an account with email, initial password, name, and role intern
- **THEN** that person can sign in and is treated as intern

#### Scenario: Admin deactivates an account

- **WHEN** an admin deactivates an account
- **THEN** that person can no longer sign in or use an existing session

#### Scenario: Admin resets a password

- **WHEN** an admin sets a new password for an account
- **THEN** that person can sign in with the new password and cannot sign in with the previous password

#### Scenario: Non-admin cannot manage accounts

- **WHEN** a manager, project head, employee, or intern attempts to create or change an account
- **THEN** the system refuses the action

#### Scenario: Admin cannot change own role

- **WHEN** an admin attempts to change the role on their own account
- **THEN** the system refuses the change and the account remains admin

#### Scenario: Public sign-up is refused

- **WHEN** an unauthenticated person attempts to register an account through the application or public auth sign-up
- **THEN** the system refuses to create the account

### Requirement: Role-based home and isolation

After sign-in the system SHALL open a role-specific home: intern, employee, project head, manager, and admin each have a distinct home. Homes MAY be empty shells in this phase. Non-admin roles MUST NOT open admin user-management screens or admin APIs.

#### Scenario: Manager lands on manager home

- **WHEN** a manager signs in
- **THEN** the system shows manager home and does not show the admin user-management screens as their default home

#### Scenario: Intern cannot open user management

- **WHEN** a signed-in intern requests the admin user-management page or admin user APIs
- **THEN** the system refuses access and does not list or change accounts

### Requirement: Empty user list without dummy data

The system SHALL display accounts that exist in the database and MUST NOT insert demo users, fake names, or placeholder counts. When a user list has no matching rows, the system SHALL show an empty-state message such as "No users found."

#### Scenario: No users match a role filter

- **WHEN** an admin views the user list filtered to managers and no manager accounts exist
- **THEN** the system shows an empty-state message and does not invent manager rows

#### Scenario: User list shows real accounts only

- **WHEN** an admin has created one employee account and opens the user list
- **THEN** the system shows that employee (and any other real accounts such as the signed-in admin) and does not add sample projects, tasks, or extra people
