# employee-daily-summaries Specification

## Purpose

Lets an employee store one end-of-day summary per working date so engagement later counts real writes instead of placeholder text.

## Requirements

### Requirement: Employee submits an end-of-day summary

An employee SHALL be able to submit a summary for the current working date containing work completed, challenges encountered, general progress, and planned work for the next day. The system SHALL store the summary associated with that employee and working date. The database MUST enforce at most one summary per employee per working date.

#### Scenario: First summary of the day is stored

- **WHEN** an employee submits all four fields for a working date with no existing summary
- **THEN** the row is stored and associated with that employee and date

#### Scenario: Duplicate summary is refused

- **WHEN** the employee submits another summary for the same working date
- **THEN** the system does not create a second row (it MAY update the existing row if the product allows edit; it MUST NOT duplicate)

### Requirement: Empty summaries without dummy data

When no summary exists, the system SHALL show an empty-state such as not submitted. The system MUST NOT insert fake summaries.

#### Scenario: No summary yet

- **WHEN** an employee opens the summary screen and has not submitted today
- **THEN** the system does not show sample work-completed text
