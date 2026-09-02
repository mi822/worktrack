## 1. Projects

- [x] 1.1 Add `projects` (manager_id, project_head_id, description, start_date, deadline, budget) with RLS (owner manager write; assigned head read) and verify a second manager cannot update the first manager’s project
- [x] 1.2 Build manager project create/edit/list with empty state “No projects available.”, assign exactly one project head, and verify creating a project with a head makes it visible only to that manager and that head

## 2. Tasks and workflow

- [x] 2.1 Add `tasks`, `task_submissions`, and `task_feedback` with status enum including resubmitted, one assignee, and RLS (assignee own tasks; head of the project reviews), and verify intern B cannot select intern A’s task
- [x] 2.2 Build project-head task create/assign (employee or intern, description, priority, deadline) on assigned projects only, and verify a head cannot create a task on another head’s project
- [x] 2.3 Implement assignee status updates and submit, head approve/reject with required feedback on reject, resubmit, and verify the happy path and reject-resubmit-approve path plus a foreign head being refused
- [x] 2.4 Show “No tasks assigned.” when the signed-in employee/intern has none, and verify no sample tasks appear

## 3. Phase C walkthrough

- [x] 3.1 Walk manager creates project → assigns head → head assigns task → employee submits → head approves, and verify it matches `projects` and `tasks`
