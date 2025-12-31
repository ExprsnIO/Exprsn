# Forge Project Management Module

**Status:** Database Complete ✅
**Date:** 2025-12-22
**Forge Service Port:** 3016

---

## Overview

The Forge Project Management module is a comprehensive project and task management system supporting multiple development methodologies including **Agile, Scrum, Kanban, Waterfall, Gantt, Scrumban, SAFe, and Lean**.

This module integrates tightly with the Forge ERP system for **billable/non-billable hours tracking**, time sheet management, and invoicing.

---

## Features

### ✅ Completed

#### 1. Database Schema (17 Tables)

**Core Tables:**
- `task_types` - Classification (Story, Bug, Task, Epic, Idea, Improvement)
- `tasks` - Work items with status, priority, story points, billable tracking
- `sprints` - Scrum iterations with velocity and capacity tracking
- `boards` - Kanban/Scrum/Gantt board configurations
- `board_columns` - Workflow stages with WIP limits
- `board_templates` - Pre-configured templates for different methodologies

**Collaboration:**
- `task_dependencies` - Blocking relationships (blocks, blocked_by, relates_to, duplicates)
- `task_comments` - Discussion threads on tasks
- `task_labels` - Categorization and filtering
- `task_history` - Complete audit trail of all changes

**ERP Integration:**
- `time_entries` - Billable/non-billable hours with approval workflow
- Integration with invoicing system
- Billable rate overrides per task
- Time entry status (draft, submitted, approved, rejected, invoiced)

**Gantt & Timeline:**
- `project_milestones` - Key project milestones with dependencies
- `task_baselines` - Baseline tracking for variance analysis
- `critical_path` - Critical Path Method (CPM) analysis with slack calculations
- Earliest/latest start and finish dates

**Waterfall:**
- `waterfall_phases` - Sequential phases (Requirements, Design, Implementation, Testing, Deployment, Maintenance)
- Phase deliverables and exit criteria
- Sign-off workflow

**Product Management:**
- `products` - Product catalog with versions and roadmaps
- `project_products` - Many-to-many project-product mapping

#### 2. Default Data Seeded

**Task Types (6):**
1. **Story** - User stories (Green, book icon)
2. **Bug** - Defects (Red, bug icon)
3. **Task** - General work items (Blue, check-square icon)
4. **Epic** - Large bodies of work (Purple, layers icon)
5. **Idea** - Feature ideas (Yellow, lightbulb icon)
6. **Improvement** - Enhancements (Cyan, trending-up icon)

**Board Templates (8):**

1. **Basic Kanban** - To Do → In Progress → Done
2. **Advanced Kanban** - Backlog → To Do → In Progress → Code Review → Testing → Done (with WIP limits)
3. **Scrum Board** - Sprint-based with story points and burndown
4. **Waterfall Phases** - Sequential gates with sign-offs
5. **Gantt Timeline** - Timeline view with critical path and dependencies
6. **Scrumban** - Hybrid Scrum + Kanban with optional sprints
7. **SAFe Program Board** - Scaled Agile Framework for enterprises
8. **Lean Development** - Ideas → Validated → Building → Learning → Shipped

---

## Database Schema Details

### Tasks Table Fields

```sql
- id (UUID, PK)
- task_number (unique, e.g., "PROJ-123", "BUG-456")
- project_id (FK to projects)
- task_type_id (FK to task_types)
- parent_task_id (FK to tasks, for subtasks/epics)
- sprint_id (FK to sprints, nullable)
- title, description, acceptance_criteria
- status (backlog, todo, in_progress, in_review, testing, done, closed, cancelled)
- priority (lowest, low, medium, high, highest, critical)
- severity (trivial, minor, major, critical, blocker) -- for bugs
- story_points, estimated_hours, actual_hours, remaining_hours
- due_date, start_date, completed_date
- assignee_id, reporter_id (FK to employees)
- board_column_id (current Kanban column)
- column_position (position within column)
- is_billable, billable_rate
- environment (production, staging, development, testing)
- affected_version, fixed_version
- resolution (fixed, wont_fix, duplicate, cannot_reproduce, works_as_designed, deferred)
- labels (array), watchers (array of UUIDs)
- attachments (JSONB), custom_fields (JSONB), metadata (JSONB)
```

### Time Entries Table Fields

```sql
- id (UUID, PK)
- task_id, project_id, employee_id (FKs)
- date, start_time, end_time
- hours (decimal, required)
- description
- is_billable, billable_rate, billable_amount
- invoice_id (FK to invoices when billed)
- is_invoiced, invoiced_at
- approved_by, approved_at
- status (draft, submitted, approved, rejected, invoiced)
- notes
```

### Sprints Table Fields

```sql
- id (UUID, PK)
- project_id (FK to projects)
- name, goal
- start_date, end_date
- status (planned, active, completed, cancelled)
- capacity_hours, capacity_points
- completed_points, completed_hours
- velocity (calculated)
- team_members (array of employee UUIDs)
- retrospective_notes
```

### Board Columns Table Fields

```sql
- id (UUID, PK)
- board_id (FK to boards)
- name, description
- column_type (backlog, todo, in_progress, review, testing, done, custom)
- color (hex code)
- position (sort order)
- wip_limit (Work In Progress limit, nullable)
- is_start_column, is_end_column (boolean flags)
```

### Critical Path Table Fields

```sql
- id (UUID, PK)
- project_id, task_id (FKs)
- position (order in critical path)
- earliest_start, earliest_finish
- latest_start, latest_finish
- slack_days (float/slack time in days)
- is_critical (boolean, true if slack = 0)
- calculated_at (timestamp)
```

---

## Supported Methodologies

### 1. Agile / Scrum

**Features:**
- Sprint planning with capacity (hours and story points)
- Story points estimation (Fibonacci: 1, 2, 3, 5, 8, 13, 21)
- Velocity tracking across sprints
- Burndown charts (requires frontend)
- Sprint backlog management
- Sprint retrospectives with notes

**Workflow:**
Sprint Backlog → To Do → In Progress → Review → Done

### 2. Kanban

**Features:**
- Visual board with customizable columns
- Work In Progress (WIP) limits per column
- Drag-and-drop task movement
- Swimlanes by priority, assignee, or custom
- Cycle time tracking

**Workflow (Basic):**
To Do → In Progress → Done

**Workflow (Advanced):**
Backlog → To Do → In Progress → Code Review → Testing → Done

### 3. Scrumban

**Features:**
- Combines Scrum and Kanban
- Optional sprints (can work without sprint boundaries)
- WIP limits like Kanban
- Story points like Scrum
- Pull-based workflow

**Workflow:**
Backlog → Ready → In Progress → Review → Done

### 4. Waterfall

**Features:**
- Sequential phases with dependencies
- Phase deliverables and exit criteria
- Sign-off requirements (phase cannot proceed without approval)
- Phase sign-off tracking (signed_off_by, signed_off_at)
- Completion percentage per phase

**Phases:**
Requirements → Design → Implementation → Testing → Deployment → Maintenance

### 5. Gantt Charts / Timeline

**Features:**
- Timeline visualization with task start/end dates
- Task dependencies (finish-to-start, start-to-start, etc.)
- Critical Path Method (CPM) analysis
- Slack/float calculation for non-critical tasks
- Milestone tracking
- Baseline comparison (planned vs. actual)
- Variance analysis

**Critical Path Analysis:**
- Automatically calculates earliest/latest start/finish
- Identifies critical path tasks (slack = 0)
- Highlights tasks at risk of delaying project

### 6. SAFe (Scaled Agile Framework)

**Features:**
- Program Increment (PI) planning
- Dependency management across teams
- Team synchronization
- Analysis → Development → Validation → Released workflow

**Workflow:**
Backlog → Analysis → Development → Validation → Released

### 7. Lean Development

**Features:**
- Minimize waste
- Build-Measure-Learn cycle
- Continuous improvement
- Cycle time tracking
- WIP limits for efficiency

**Workflow:**
Ideas → Validated → Building → Learning → Shipped

---

## ERP Integration

### Billable Hours Tracking

**Use Cases:**
- Client project billing (time & materials)
- Fixed-price projects with internal cost tracking
- Non-billable internal projects
- Retainer-based billing

**Workflow:**
1. Employee logs time on a task
2. Time entry created with hours, description, billable status
3. Time entry can override default billable rate
4. Manager approves/rejects time entry
5. Approved time entries can be invoiced
6. Invoice reference stored in time_entry.invoice_id

**Time Entry Status Flow:**
```
draft → submitted → approved → invoiced
                  ↓
                rejected
```

**Billable Amount Calculation:**
```sql
billable_amount = hours * COALESCE(
  time_entries.billable_rate,  -- Task-specific override
  tasks.billable_rate,          -- Task default
  employee.default_rate,        -- Employee default
  project.default_rate          -- Project default
)
```

### Reports for ERP

**Available Data:**
- Total billable hours per project
- Total billable hours per client
- Total billable hours per employee
- Unbilled time entries (approved but not invoiced)
- Actual vs. estimated hours variance
- Project profitability (billed amount vs. actual cost)

---

## API Endpoints (To Be Built)

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/tasks` - Get all tasks for project
- `GET /api/projects/:id/sprints` - Get all sprints for project
- `GET /api/projects/:id/boards` - Get all boards for project
- `GET /api/projects/:id/critical-path` - Get critical path analysis

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign task to employee
- `POST /api/tasks/:id/move` - Move task to different column
- `GET /api/tasks/:id/comments` - Get task comments
- `POST /api/tasks/:id/comments` - Add comment
- `GET /api/tasks/:id/history` - Get task history
- `GET /api/tasks/:id/time-entries` - Get time entries for task
- `POST /api/tasks/:id/time-entries` - Log time on task

### Sprints
- `GET /api/sprints` - List sprints
- `GET /api/sprints/:id` - Get sprint details
- `POST /api/sprints` - Create new sprint
- `PUT /api/sprints/:id` - Update sprint
- `DELETE /api/sprints/:id` - Delete sprint
- `POST /api/sprints/:id/start` - Start sprint
- `POST /api/sprints/:id/complete` - Complete sprint
- `GET /api/sprints/:id/burndown` - Get burndown chart data
- `GET /api/sprints/:id/velocity` - Get velocity metrics

### Boards
- `GET /api/boards` - List boards
- `GET /api/boards/:id` - Get board details with columns and tasks
- `POST /api/boards` - Create new board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/from-template/:templateId` - Create board from template
- `PUT /api/boards/:id/columns/:columnId/move` - Reorder columns

### Time Entries
- `GET /api/time-entries` - List time entries (with filters)
- `GET /api/time-entries/:id` - Get time entry details
- `POST /api/time-entries` - Create time entry
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Delete time entry
- `POST /api/time-entries/:id/submit` - Submit for approval
- `POST /api/time-entries/:id/approve` - Approve time entry
- `POST /api/time-entries/:id/reject` - Reject time entry
- `GET /api/time-entries/unbilled` - Get unbilled time entries
- `POST /api/time-entries/bulk-invoice` - Create invoice from time entries

### Board Templates
- `GET /api/board-templates` - List available templates
- `GET /api/board-templates/:id` - Get template details

### Waterfall
- `GET /api/projects/:id/phases` - Get waterfall phases
- `POST /api/projects/:id/phases` - Create new phase
- `PUT /api/phases/:id` - Update phase
- `POST /api/phases/:id/signoff` - Sign off on phase

### Milestones
- `GET /api/projects/:id/milestones` - Get project milestones
- `POST /api/milestones` - Create milestone
- `PUT /api/milestones/:id` - Update milestone
- `POST /api/milestones/:id/complete` - Mark milestone as achieved

---

## UI Views (To Be Built)

### 1. Kanban Board View
- Drag-and-drop cards between columns
- WIP limit indicators
- Swimlanes (by priority, assignee, type)
- Card quick edit
- Card details modal

### 2. Scrum Board View
- Sprint selector
- Story points display on cards
- Burndown chart widget
- Sprint progress bar
- Velocity chart

### 3. Gantt Chart View
- Timeline with task bars
- Dependency lines between tasks
- Critical path highlighting (red)
- Milestone diamonds
- Baseline comparison (ghost bars)
- Today line indicator

### 4. Waterfall View
- Phase timeline with progress bars
- Phase deliverables checklist
- Exit criteria status
- Sign-off status and approver
- Phase dependencies

### 5. Task Detail View
- Full task information
- Comments thread
- Time entries log
- History/audit trail
- Attachments
- Dependencies graph

### 6. Time Tracking View
- Weekly timesheet grid
- Submit for approval button
- Approval status indicators
- Billable/non-billable toggle
- Quick time entry

### 7. Project Dashboard
- Project health (on_track, at_risk, off_track)
- Budget vs. actual cost
- Total hours logged
- Completed tasks percentage
- Critical path status
- Upcoming milestones

---

## Technical Implementation

### Database Migrations

**Location:** `src/exprsn-forge/migrations/009-create-project-management-module.js`

**Tables Created:** 17 tables with proper indexes and foreign key constraints

**Run Migration:**
```bash
cd src/exprsn-forge
npx sequelize-cli db:migrate --name 009-create-project-management-module.js
```

### Seeders

**Location:** `src/exprsn-forge/seeders/010-seed-project-management-defaults.js`

**Data Seeded:**
- 6 task types
- 8 board templates

**Run Seeder:**
```bash
cd src/exprsn-forge
npx sequelize-cli db:seed --seed 010-seed-project-management-defaults.js
```

### Querying the Data

**Check all PM tables:**
```bash
psql -d exprsn_forge -c "\dt" | grep -E "(task|sprint|board|product|milestone|phase|time_)"
```

**Query task types:**
```sql
SELECT * FROM task_types ORDER BY sort_order;
```

**Query board templates:**
```sql
SELECT name, methodology, board_type FROM board_templates WHERE is_system = true;
```

**Query tasks with details:**
```sql
SELECT
  t.task_number,
  t.title,
  t.status,
  t.priority,
  tt.name as task_type,
  t.story_points,
  t.estimated_hours,
  t.actual_hours
FROM tasks t
JOIN task_types tt ON t.task_type_id = tt.id
WHERE t.project_id = '{project_uuid}'
ORDER BY t.created_at DESC;
```

**Query critical path:**
```sql
SELECT
  t.task_number,
  t.title,
  cp.slack_days,
  cp.is_critical
FROM critical_path cp
JOIN tasks t ON cp.task_id = t.id
WHERE cp.project_id = '{project_uuid}'
  AND cp.is_critical = true
ORDER BY cp.position;
```

**Query billable time summary:**
```sql
SELECT
  p.name as project_name,
  e.first_name || ' ' || e.last_name as employee_name,
  SUM(te.hours) as total_hours,
  SUM(CASE WHEN te.is_billable THEN te.hours ELSE 0 END) as billable_hours,
  SUM(te.billable_amount) as total_billed
FROM time_entries te
JOIN projects p ON te.project_id = p.id
JOIN employees e ON te.employee_id = e.id
WHERE te.status = 'approved'
  AND te.is_invoiced = false
GROUP BY p.id, p.name, e.id, e.first_name, e.last_name
ORDER BY total_billed DESC;
```

---

## Next Steps

### Phase 1: API Development
- [ ] Build Sequelize models for all 17 tables
- [ ] Create service layer for business logic
- [ ] Build REST API endpoints
- [ ] Add authentication middleware
- [ ] Add authorization (role-based access)
- [ ] Write API documentation
- [ ] Write unit tests for services

### Phase 2: Business Logic
- [ ] Implement critical path calculation algorithm
- [ ] Implement burndown chart calculations
- [ ] Implement velocity tracking
- [ ] Implement time entry approval workflow
- [ ] Implement billable amount calculations
- [ ] Implement task auto-assignment rules
- [ ] Implement notification triggers

### Phase 3: UI Development
- [ ] Build Kanban board component
- [ ] Build Scrum board component
- [ ] Build Gantt chart component (use library like dhtmlxGantt or FullCalendar)
- [ ] Build Waterfall phase view
- [ ] Build task detail modal
- [ ] Build time tracking interface
- [ ] Build project dashboard

### Phase 4: Integration
- [ ] Integrate with Forge invoicing system
- [ ] Integrate with Forge employee management
- [ ] Integrate with Forge customer/client management
- [ ] Integrate with Herald for notifications
- [ ] Integrate with Workflow for automation triggers
- [ ] Integrate with Timeline for activity feed

### Phase 5: Advanced Features
- [ ] Gantt chart drag-to-reschedule
- [ ] Real-time collaboration (Socket.IO)
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Custom workflows
- [ ] Advanced reporting and analytics
- [ ] Export to Excel/CSV/PDF
- [ ] Mobile-responsive views

---

## Use Cases

### Scenario 1: Software Development Team (Scrum)

1. Create project "Mobile App v2.0"
2. Create board from "Scrum Board" template
3. Create sprint "Sprint 23" (2 weeks, starting Monday)
4. Create tasks as "Story" type with story points
5. Assign tasks to sprint backlog
6. Start sprint
7. Move tasks across columns as work progresses
8. Log time entries (billable to client)
9. Complete sprint and run retrospective
10. View velocity and burndown charts

### Scenario 2: Agency Project (Kanban + Billable)

1. Create project "Website Redesign for ACME Corp"
2. Create board from "Advanced Kanban" template
3. Create tasks for deliverables
4. Set tasks as billable with client rate
5. Assign tasks to team members
6. Log time on tasks throughout the week
7. Submit time entries for approval
8. Manager reviews and approves
9. Create invoice from approved time entries
10. Mark time entries as invoiced

### Scenario 3: Construction Project (Waterfall + Gantt)

1. Create project "Office Building Construction"
2. Create waterfall phases (Requirements, Design, Implementation, etc.)
3. Set phase dependencies and deliverables
4. Create tasks within each phase
5. Set task dependencies (finish-to-start)
6. View Gantt chart to see timeline
7. Identify critical path tasks
8. Complete phase deliverables
9. Request phase sign-off from stakeholder
10. Proceed to next phase after approval

### Scenario 4: Product Roadmap (Lean + Products)

1. Create product "Exprsn Mobile App"
2. Set product roadmap with milestones
3. Create project "Q1 2026 Features"
4. Link project to product
5. Create board from "Lean Development" template
6. Add feature ideas to "Ideas" column
7. Validate ideas with user research
8. Move validated ideas to "Building"
9. Track learning metrics
10. Ship features to production

---

## Performance Considerations

### Database Indexes

All foreign keys have indexes:
- `tasks.project_id`, `tasks.task_type_id`, `tasks.sprint_id`, `tasks.assignee_id`, etc.
- `time_entries.task_id`, `time_entries.project_id`, `time_entries.employee_id`
- `task_dependencies.task_id`, `task_dependencies.depends_on_task_id`

Common query patterns indexed:
- `tasks(board_column_id, column_position)` - For Kanban board rendering
- `time_entries(date)` - For timesheet views
- `time_entries(is_billable)` - For billing reports
- `critical_path(project_id, position)` - For Gantt timeline
- `project_milestones(due_date)` - For upcoming milestones

### Caching Strategies

**Redis caching recommended for:**
- Board configuration (columns, settings)
- Task lists by project/sprint
- Critical path calculations (expensive, cache for 1 hour)
- Burndown chart data
- Velocity calculations

**Cache invalidation:**
- Invalidate task cache when task is created/updated/deleted
- Invalidate board cache when columns are reordered
- Invalidate critical path cache when task dates or dependencies change

---

## Security & Permissions

### Role-Based Access Control

**Project Roles:**
- **Project Manager** - Full access to project, can create/edit/delete all tasks
- **Team Member** - Can view project, create tasks, edit assigned tasks, log time
- **Stakeholder** - Read-only access to project status
- **Client** - Limited view (no internal comments, no cost data)

**Task Permissions:**
- Only assignee or project manager can edit task
- Anyone on project can view task
- Internal comments hidden from clients
- Time entries only editable by owner or manager

**Time Entry Approval:**
- Employee submits their own time
- Manager (project manager or department manager) approves/rejects
- Once invoiced, time entries cannot be edited

---

## Integration Points

### Forge CRM
- Link tasks to CRM `opportunities`
- Link projects to CRM `customers`
- Show project status in customer record

### Forge ERP
- Billable hours feed into invoicing
- Project costs tracked for profitability analysis
- Employee utilization reports

### Herald (Notifications)
- Task assigned notification
- Sprint started/completed notifications
- Phase sign-off required notification
- Time entry submitted notification (to manager)
- Task comment mention notification

### Workflow (Automation)
- Trigger workflow on task status change
- Trigger workflow on sprint complete
- Trigger workflow on milestone achieved
- Auto-assign tasks based on rules

### Timeline (Social Feed)
- Post task completion to timeline
- Post milestone achievement to timeline
- Share project progress updates

---

## Configuration

### Project Settings

```json
{
  "default_methodology": "scrum",
  "default_task_type": "task",
  "require_time_approval": true,
  "billable_by_default": true,
  "default_billable_rate": 150.00,
  "story_points_enabled": true,
  "time_tracking_enabled": true,
  "gantt_enabled": true,
  "notifications_enabled": true
}
```

### Board Settings

```json
{
  "wip_enabled": true,
  "wip_limits": {
    "in_progress": 5,
    "review": 3
  },
  "swimlanes": ["priority", "assignee"],
  "card_fields": ["story_points", "assignee", "due_date"],
  "auto_archive_done": true,
  "archive_after_days": 30
}
```

---

## Success Metrics

**Developer Productivity:**
- Tasks completed per sprint
- Velocity trend over time
- Cycle time (time from start to done)
- Lead time (time from creation to done)

**Project Health:**
- On-time delivery rate
- Budget variance (planned vs. actual)
- Scope creep (original tasks vs. added tasks)
- Critical path tasks at risk

**Team Efficiency:**
- WIP adherence rate
- Time to first assignment
- Rework rate (tasks moving backwards)
- Blockerresolution time

**Financial:**
- Billable utilization percentage
- Billing realization (billed hours / worked hours)
- Project profitability
- Revenue per project

---

**Module Status:** ✅ Database Complete, API & UI Pending
**Next Task:** Build Sequelize models and API endpoints
**Documentation:** See `/CLAUDE.md` for Exprsn platform architecture

