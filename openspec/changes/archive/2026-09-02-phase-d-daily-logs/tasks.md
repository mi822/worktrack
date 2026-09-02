## 1. Employee summaries

- [x] 1.1 Add `employee_daily_summaries` with the four fields and unique `(user_id, work_date)`, RLS so only the employee writes their row, and verify a second insert for the same day does not create two rows
- [x] 1.2 Build the employee summary form and empty “not submitted” state, and verify submitting today stores a real row with no sample text when empty

## 2. Intern learning logs

- [x] 2.1 Add `intern_learning_logs` with the five fields and unique `(user_id, work_date)`, RLS for intern write-own and project-head read of relevant interns, and verify a head cannot read an intern with no tasks on their projects
- [x] 2.2 Build intern submit UI and project-head log view with “No learning logs submitted.” when empty, and verify a real intern log appears for the relevant head only

## 3. Phase D walkthrough

- [x] 3.1 Walk employee submits EOD and intern submits a log the head can open, and verify it matches both specs
