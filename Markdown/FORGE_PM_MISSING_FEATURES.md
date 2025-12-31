# Forge PM Module - Missing Features Analysis

**Date:** 2025-12-22
**Status:** Gap Analysis

---

## Critical Missing Features

### 1. Resource Management & Capacity Planning

**What's Missing:**
- No resource allocation tracking (who is assigned to what % of time)
- No capacity vs. demand analysis
- No resource conflict detection (over-allocation)
- No skills matrix or competency tracking
- No vacation/PTO calendar integration
- No resource leveling (automatic or manual)

**Impact:** High - Without this, you can't answer "Do we have enough people?" or "Is John over-committed?"

**Tables Needed:**
```sql
-- Resource Allocations
CREATE TABLE resource_allocations (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id), -- nullable, project-level or task-level
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  allocation_percentage INTEGER CHECK (allocation_percentage BETWEEN 0 AND 100),
  hours_per_week DECIMAL(5, 2),
  status ENUM('planned', 'confirmed', 'completed'),
  created_at TIMESTAMP
);

-- Employee Skills
CREATE TABLE employee_skills (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  skill_name VARCHAR(100),
  proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert'),
  years_experience DECIMAL(4, 1),
  created_at TIMESTAMP
);

-- Employee Availability (PTO, holidays, etc.)
CREATE TABLE employee_unavailability (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  unavailability_type ENUM('pto', 'holiday', 'sick', 'training', 'other'),
  hours_unavailable DECIMAL(5, 2),
  notes TEXT
);
```

**Use Cases:**
- "Who is available to work on this project next month?"
- "Is Sarah over-allocated this week?" (capacity > 100%)
- "Do we have a Python expert available for this task?"
- Resource utilization reports

---

### 2. Budget & Financial Tracking

**What's Missing:**
- No granular budget tracking per task/milestone
- No budget alerts when approaching limits
- No burn rate calculation
- No earned value management (EVM)
- No profit margin tracking
- No cost center assignments
- No budget change requests/approvals

**Impact:** High - Financial visibility is critical for profitability

**Tables Needed:**
```sql
-- Budget Items
CREATE TABLE budget_items (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id), -- nullable
  category ENUM('labor', 'materials', 'software', 'hardware', 'travel', 'other'),
  budgeted_amount DECIMAL(15, 2) NOT NULL,
  actual_amount DECIMAL(15, 2) DEFAULT 0,
  committed_amount DECIMAL(15, 2) DEFAULT 0, -- POs issued but not paid
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Budget Alerts
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  threshold_percentage INTEGER CHECK (threshold_percentage BETWEEN 0 AND 100),
  threshold_amount DECIMAL(15, 2),
  alert_type ENUM('warning', 'critical'),
  recipients UUID[], -- employee IDs
  is_active BOOLEAN DEFAULT true
);

-- Earned Value Metrics (snapshot per week/month)
CREATE TABLE earned_value_snapshots (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  snapshot_date DATE NOT NULL,
  planned_value DECIMAL(15, 2), -- PV (BCWS)
  earned_value DECIMAL(15, 2),  -- EV (BCWP)
  actual_cost DECIMAL(15, 2),   -- AC (ACWP)
  schedule_variance DECIMAL(15, 2), -- SV = EV - PV
  cost_variance DECIMAL(15, 2),     -- CV = EV - AC
  schedule_performance_index DECIMAL(5, 3), -- SPI = EV / PV
  cost_performance_index DECIMAL(5, 3),     -- CPI = EV / AC
  estimate_at_completion DECIMAL(15, 2),    -- EAC
  estimate_to_complete DECIMAL(15, 2),      -- ETC
  created_at TIMESTAMP
);
```

**Calculations:**
- **Burn Rate:** (Budget spent to date) / (Days elapsed)
- **Runway:** (Remaining budget) / (Average burn rate)
- **CPI < 1.0** = Over budget
- **SPI < 1.0** = Behind schedule

---

### 3. Risk Management

**What's Missing:**
- Risks stored in JSONB, no structured tracking
- No risk register with proper fields
- No risk assessment matrix (probability × impact)
- No risk mitigation plans
- No risk owners
- No risk status tracking

**Impact:** Medium-High - Formal risk management prevents surprises

**Tables Needed:**
```sql
CREATE TABLE project_risks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  risk_number VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('technical', 'schedule', 'budget', 'resource', 'external', 'quality'),
  probability ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
  impact ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
  risk_score INTEGER, -- Calculated: probability × impact (1-25)
  status ENUM('identified', 'analyzing', 'mitigated', 'accepted', 'closed'),
  owner_id UUID REFERENCES employees(id),
  mitigation_plan TEXT,
  contingency_plan TEXT,
  actual_occurrence DATE,
  identified_date DATE NOT NULL,
  target_closure_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_project_risks_score ON project_risks(risk_score DESC);
CREATE INDEX idx_project_risks_status ON project_risks(status);
```

**Risk Matrix:**
```
Impact →    Low  Med  High
Probability
Very High    5    10   15   20   25
High         4     8   12   16   20
Medium       3     6    9   12   15
Low          2     4    6    8   10
Very Low     1     2    3    4    5
```

---

### 4. Test Case Management & QA

**What's Missing:**
- No test cases linked to requirements/stories
- No test runs or test execution tracking
- No defect density metrics
- No test coverage metrics
- No regression test suites
- No automated test integration

**Impact:** Medium-High - Quality assurance needs structure

**Tables Needed:**
```sql
CREATE TABLE test_cases (
  id UUID PRIMARY KEY,
  test_number VARCHAR(50) UNIQUE,
  task_id UUID REFERENCES tasks(id), -- Story/requirement being tested
  project_id UUID REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  preconditions TEXT,
  test_steps JSONB, -- Array of {step, expected_result}
  test_data TEXT,
  priority ENUM('low', 'medium', 'high', 'critical'),
  test_type ENUM('unit', 'integration', 'functional', 'performance', 'security', 'usability'),
  is_automated BOOLEAN DEFAULT false,
  automation_script_path VARCHAR(500),
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE test_runs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  sprint_id UUID REFERENCES sprints(id),
  name VARCHAR(255),
  test_environment ENUM('development', 'staging', 'production'),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status ENUM('planned', 'in_progress', 'completed'),
  created_by UUID REFERENCES employees(id)
);

CREATE TABLE test_executions (
  id UUID PRIMARY KEY,
  test_run_id UUID REFERENCES test_runs(id),
  test_case_id UUID REFERENCES test_cases(id),
  executed_by UUID REFERENCES employees(id),
  execution_date TIMESTAMP,
  result ENUM('passed', 'failed', 'blocked', 'skipped', 'not_run'),
  actual_result TEXT,
  notes TEXT,
  bug_id UUID REFERENCES tasks(id), -- Link to bug if failed
  execution_time_seconds INTEGER
);
```

**Metrics:**
- Test coverage: (Test cases / Requirements) × 100
- Defect density: (Bugs found / LOC) or (Bugs / Story points)
- Test pass rate: (Passed tests / Total tests) × 100

---

### 5. Release Management

**What's Missing:**
- No release/version tracking
- No release notes generation
- No deployment tracking
- No rollback procedures
- No release approvals
- No environment promotion tracking (dev → staging → prod)

**Impact:** Medium - Important for software products

**Tables Needed:**
```sql
CREATE TABLE releases (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  product_id UUID REFERENCES products(id),
  version_number VARCHAR(50) NOT NULL, -- e.g., "2.5.1"
  release_name VARCHAR(255), -- e.g., "Winter 2026 Release"
  release_type ENUM('major', 'minor', 'patch', 'hotfix'),
  status ENUM('planned', 'in_progress', 'testing', 'approved', 'deployed', 'rolled_back'),
  planned_date DATE,
  actual_date DATE,
  release_manager_id UUID REFERENCES employees(id),
  release_notes TEXT,
  changelog JSONB, -- Array of changes
  deployment_instructions TEXT,
  rollback_plan TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE release_tasks (
  release_id UUID REFERENCES releases(id),
  task_id UUID REFERENCES tasks(id),
  PRIMARY KEY (release_id, task_id)
);

CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  release_id UUID REFERENCES releases(id),
  environment ENUM('development', 'staging', 'uat', 'production'),
  deployment_date TIMESTAMP NOT NULL,
  deployed_by UUID REFERENCES employees(id),
  status ENUM('in_progress', 'success', 'failed', 'rolled_back'),
  deployment_log TEXT,
  rollback_date TIMESTAMP,
  rollback_reason TEXT
);
```

---

### 6. Portfolio Management

**What's Missing:**
- No program/portfolio level (managing multiple related projects)
- No cross-project dependencies
- No portfolio-level resource allocation
- No portfolio dashboards
- No strategic alignment tracking

**Impact:** Medium - Important for large organizations

**Tables Needed:**
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES employees(id),
  budget DECIMAL(15, 2),
  start_date DATE,
  end_date DATE,
  strategic_objective TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE portfolio_projects (
  portfolio_id UUID REFERENCES portfolios(id),
  project_id UUID REFERENCES projects(id),
  priority INTEGER,
  strategic_weight INTEGER CHECK (strategic_weight BETWEEN 1 AND 10),
  PRIMARY KEY (portfolio_id, project_id)
);

CREATE TABLE cross_project_dependencies (
  id UUID PRIMARY KEY,
  from_project_id UUID REFERENCES projects(id),
  to_project_id UUID REFERENCES projects(id),
  dependency_type ENUM('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'),
  description TEXT,
  created_at TIMESTAMP
);
```

---

### 7. Recurring Tasks & Automation

**What's Missing:**
- No recurring task templates (daily standup, weekly review, etc.)
- No scheduled task creation
- No task auto-assignment rules
- No workflow automation triggers

**Impact:** Low-Medium - Nice to have for efficiency

**Tables Needed:**
```sql
CREATE TABLE recurring_task_templates (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  task_type_id UUID REFERENCES task_types(id),
  title_template VARCHAR(255), -- e.g., "Weekly Review - {date}"
  description_template TEXT,
  recurrence_pattern VARCHAR(100), -- RRULE format (RFC 5545)
  recurrence_interval INTEGER,
  recurrence_unit ENUM('daily', 'weekly', 'monthly', 'yearly'),
  assignee_rule ENUM('round_robin', 'fixed', 'project_manager', 'random'),
  fixed_assignee_id UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  next_creation_date DATE,
  last_created_date DATE,
  created_at TIMESTAMP
);

CREATE TABLE task_auto_assignment_rules (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  rule_name VARCHAR(255),
  task_type_id UUID REFERENCES task_types(id),
  priority_filter VARCHAR(50),
  label_filter VARCHAR(100),
  assignment_strategy ENUM('round_robin', 'least_loaded', 'skill_match', 'random'),
  assignee_pool UUID[], -- Employee IDs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

---

### 8. Time Tracking Enhancements

**What's Missing:**
- No timer functionality (start/stop)
- No time tracking integrations (Toggl, Harvest, etc.)
- No idle time detection
- No mobile time tracking
- No timesheet locking (prevent edits after approval)

**Impact:** Medium - Important for accurate billing

**Tables Needed:**
```sql
CREATE TABLE time_tracking_sessions (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  task_id UUID REFERENCES tasks(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  is_active BOOLEAN DEFAULT true, -- Timer running?
  device_type VARCHAR(50), -- web, mobile, desktop
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE timesheet_periods (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('open', 'submitted', 'approved', 'locked'),
  total_hours DECIMAL(10, 2),
  submitted_at TIMESTAMP,
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  locked_at TIMESTAMP
);

-- Prevent edits to locked timesheets
ALTER TABLE time_entries ADD COLUMN timesheet_period_id UUID REFERENCES timesheet_periods(id);
```

---

### 9. Custom Fields Framework

**What's Missing:**
- Custom fields stored in JSONB but no schema definition
- No UI for defining custom fields
- No validation for custom fields
- No reporting on custom fields

**Impact:** Medium - Flexibility for different industries

**Tables Needed:**
```sql
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY,
  entity_type ENUM('project', 'task', 'sprint', 'time_entry'),
  field_name VARCHAR(100) NOT NULL,
  display_label VARCHAR(255),
  field_type ENUM('text', 'number', 'date', 'select', 'multi_select', 'boolean', 'url', 'email'),
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  validation_rules JSONB, -- {min, max, regex, options, etc.}
  options JSONB, -- For select/multi_select
  help_text TEXT,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE INDEX idx_custom_fields_entity ON custom_field_definitions(entity_type);
```

**Usage:**
```json
// In tasks.custom_fields JSONB:
{
  "customer_urgency": "high",
  "compliance_required": true,
  "regulatory_body": "FDA",
  "external_ticket_id": "JIRA-12345"
}
```

---

### 10. Document Version Control

**What's Missing:**
- Attachments stored as JSONB metadata only
- No file version history
- No file check-in/check-out
- No file approval workflow
- No file size limits or virus scanning

**Impact:** Low-Medium - Important for document-heavy projects

**Tables Needed:**
```sql
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500), -- S3 key or filesystem path
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  version INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES employees(id),
  uploaded_at TIMESTAMP,
  description TEXT,
  checksum_md5 VARCHAR(32), -- For integrity verification
  virus_scan_status ENUM('pending', 'clean', 'infected', 'error'),
  virus_scan_date TIMESTAMP
);

CREATE TABLE attachment_versions (
  id UUID PRIMARY KEY,
  attachment_id UUID REFERENCES task_attachments(id),
  version INTEGER,
  file_path VARCHAR(500),
  uploaded_by UUID REFERENCES employees(id),
  uploaded_at TIMESTAMP,
  change_notes TEXT
);
```

---

### 11. Notifications & Subscriptions

**What's Missing:**
- No task subscription system (watch for changes)
- No notification preferences (email, in-app, SMS)
- No digest emails (daily summary)
- No @mentions in comments
- No notification rules (notify me when status = X)

**Impact:** Medium - Important for collaboration

**Tables Needed:**
```sql
CREATE TABLE task_subscriptions (
  task_id UUID REFERENCES tasks(id),
  employee_id UUID REFERENCES employees(id),
  subscription_type ENUM('explicit', 'assigned', 'mentioned', 'created', 'watching_project'),
  notification_preferences JSONB, -- {email: true, in_app: true, sms: false}
  created_at TIMESTAMP,
  PRIMARY KEY (task_id, employee_id)
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  event_type VARCHAR(100), -- e.g., "task_assigned", "comment_added"
  notify_email BOOLEAN DEFAULT true,
  notify_in_app BOOLEAN DEFAULT true,
  notify_sms BOOLEAN DEFAULT false,
  notify_push BOOLEAN DEFAULT false,
  digest_frequency ENUM('realtime', 'hourly', 'daily', 'weekly', 'never'),
  quiet_hours_start TIME,
  quiet_hours_end TIME
);
```

---

### 12. Templates (Project & Task)

**What's Missing:**
- No project templates (clone entire project structure)
- No task templates (pre-filled tasks)
- No checklist templates

**Impact:** Low-Medium - Saves time for repetitive projects

**Tables Needed:**
```sql
CREATE TABLE project_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  default_methodology ENUM('agile', 'scrum', 'kanban', 'waterfall', 'custom'),
  default_board_template_id UUID REFERENCES board_templates(id),
  template_data JSONB, -- Full project structure
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP
);

CREATE TABLE task_templates (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id), -- NULL if global template
  name VARCHAR(255) NOT NULL,
  description TEXT,
  task_type_id UUID REFERENCES task_types(id),
  estimated_hours DECIMAL(10, 2),
  story_points INTEGER,
  template_data JSONB, -- Pre-filled fields
  checklist_items JSONB, -- Array of checklist items
  created_at TIMESTAMP
);
```

---

### 13. SLA Tracking (Service Level Agreements)

**What's Missing:**
- No SLA definitions
- No SLA breach alerts
- No first response time tracking
- No resolution time tracking

**Impact:** Low-Medium - Critical for support/helpdesk projects

**Tables Needed:**
```sql
CREATE TABLE sla_policies (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255),
  priority ENUM('low', 'medium', 'high', 'critical'),
  first_response_hours DECIMAL(8, 2), -- e.g., 4 hours for critical
  resolution_hours DECIMAL(8, 2),     -- e.g., 24 hours for critical
  business_hours_only BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE TABLE sla_violations (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  sla_policy_id UUID REFERENCES sla_policies(id),
  violation_type ENUM('first_response', 'resolution'),
  target_time TIMESTAMP,
  actual_time TIMESTAMP,
  breach_duration_hours DECIMAL(8, 2),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES employees(id),
  created_at TIMESTAMP
);
```

---

### 14. Client Portal / External Stakeholder Access

**What's Missing:**
- No read-only views for clients
- No client feedback mechanism
- No client approval workflow
- No client notifications

**Impact:** Medium - Important for agency/consulting work

**Tables Needed:**
```sql
CREATE TABLE client_portal_access (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  email VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  company VARCHAR(255),
  permissions JSONB, -- {view_tasks: true, view_time: false, view_budget: false}
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE client_feedback (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  client_access_id UUID REFERENCES client_portal_access(id),
  feedback_type ENUM('approval', 'revision', 'question', 'comment'),
  feedback_text TEXT,
  attachments JSONB,
  created_at TIMESTAMP
);
```

---

### 15. Integration with Git/Code Repositories

**What's Missing:**
- No link between commits and tasks
- No branch-per-task workflow
- No pull request tracking
- No deployment tracking from commits

**Impact:** Medium - Important for software teams

**Tables Needed:**
```sql
CREATE TABLE code_repositories (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  repo_type ENUM('github', 'gitlab', 'bitbucket', 'azure_devops'),
  repo_url VARCHAR(500),
  access_token_encrypted TEXT, -- Encrypted API token
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE TABLE code_commits (
  id UUID PRIMARY KEY,
  repository_id UUID REFERENCES code_repositories(id),
  task_id UUID REFERENCES tasks(id), -- Extracted from commit message
  commit_sha VARCHAR(40) UNIQUE,
  commit_message TEXT,
  author_email VARCHAR(255),
  author_name VARCHAR(255),
  committed_at TIMESTAMP,
  branch VARCHAR(255),
  files_changed INTEGER,
  lines_added INTEGER,
  lines_removed INTEGER,
  created_at TIMESTAMP
);

CREATE TABLE pull_requests (
  id UUID PRIMARY KEY,
  repository_id UUID REFERENCES code_repositories(id),
  task_id UUID REFERENCES tasks(id),
  pr_number INTEGER,
  title VARCHAR(500),
  status ENUM('open', 'merged', 'closed'),
  source_branch VARCHAR(255),
  target_branch VARCHAR(255),
  created_by VARCHAR(255),
  merged_by VARCHAR(255),
  created_at TIMESTAMP,
  merged_at TIMESTAMP
);
```

---

### 16. Offline Support & Sync

**What's Missing:**
- No offline data storage
- No conflict resolution for concurrent edits
- No sync queue

**Impact:** Low - Nice for mobile/remote work

**Requires:** Client-side database (IndexedDB, SQLite) + sync protocol

---

### 17. Audit & Compliance

**What's Missing:**
- `task_history` exists but no retention policy
- No immutable audit logs
- No GDPR/data deletion workflow
- No compliance reporting (SOC 2, ISO 27001)

**Impact:** High - Critical for regulated industries

**Tables Needed:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  event_timestamp TIMESTAMP NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path VARCHAR(500),
  changes_json JSONB, -- Before/after state
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(event_timestamp DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Make audit log append-only (no DELETE, no UPDATE)
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
```

---

### 18. Forecasting & Predictive Analytics

**What's Missing:**
- No velocity-based completion forecasting
- No Monte Carlo simulations
- No "what-if" scenario planning
- No burnup charts (only burndown mentioned)

**Impact:** Low-Medium - Helps with planning

**Calculations Needed:**
```javascript
// Forecast completion date based on velocity
const avgVelocity = sum(last3Sprints.completedPoints) / 3;
const remainingPoints = totalPoints - completedPoints;
const sprintsRemaining = Math.ceil(remainingPoints / avgVelocity);
const forecastDate = addWeeks(today, sprintsRemaining * 2);

// Confidence intervals (3 scenarios)
const bestCase = forecastDate - (0.2 * sprintsRemaining); // -20%
const worstCase = forecastDate + (0.3 * sprintsRemaining); // +30%
```

---

### 19. Mobile-Specific Features

**What's Missing:**
- No mobile app schema considerations
- No push notification tokens
- No mobile device management
- No offline task creation

**Impact:** Low - Depends on mobile app plans

**Tables Needed:**
```sql
CREATE TABLE mobile_devices (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  device_type ENUM('ios', 'android'),
  device_token VARCHAR(500), -- For push notifications
  device_name VARCHAR(255),
  app_version VARCHAR(50),
  os_version VARCHAR(50),
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

---

### 20. Webhooks & External Integrations

**What's Missing:**
- No webhook system for external integrations
- No API keys management
- No rate limiting (for APIs we haven't built)
- No integration marketplace

**Impact:** Medium - Important for extensibility

**Tables Needed:**
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255),
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255), -- For HMAC signature
  events TEXT[], -- ['task.created', 'task.updated', 'sprint.completed']
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID REFERENCES webhooks(id),
  event_type VARCHAR(100),
  payload JSONB,
  response_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  status ENUM('pending', 'success', 'failed')
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  key_name VARCHAR(255),
  key_hash VARCHAR(255) UNIQUE, -- Never store plain key!
  permissions JSONB, -- Scoped permissions
  rate_limit_per_hour INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## Missing Constraints & Validation

### 1. Business Logic Constraints

**Missing:**
```sql
-- Prevent moving tasks backwards in Waterfall
-- (Should only go Requirements → Design → Implementation → Testing → Deployment)

-- Prevent changing sprint after tasks are completed
ALTER TABLE tasks ADD CONSTRAINT check_sprint_change_on_done
  CHECK (status != 'done' OR sprint_id IS NOT NULL);

-- Prevent deleting tasks with logged time
CREATE OR REPLACE FUNCTION prevent_delete_with_time_entries()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM time_entries WHERE task_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete task with time entries';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_time_entries_before_delete
  BEFORE DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_with_time_entries();

-- Ensure WIP limits are enforced
-- (Application logic needed - can't do purely in DB)
```

### 2. Data Integrity

**Missing:**
```sql
-- Prevent orphaned tasks (parent_task_id references non-existent task)
-- Already handled by FK, but need circular dependency check

CREATE OR REPLACE FUNCTION check_circular_task_dependency()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent task from being its own parent (directly or indirectly)
  IF NEW.parent_task_id IS NOT NULL THEN
    -- Check if creating a cycle using recursive CTE
    WITH RECURSIVE task_hierarchy AS (
      SELECT id, parent_task_id, 1 as depth
      FROM tasks
      WHERE id = NEW.parent_task_id

      UNION ALL

      SELECT t.id, t.parent_task_id, th.depth + 1
      FROM tasks t
      JOIN task_hierarchy th ON t.id = th.parent_task_id
      WHERE th.depth < 10 -- Prevent infinite recursion
    )
    SELECT INTO found_cycle
    FROM task_hierarchy
    WHERE id = NEW.id;

    IF FOUND THEN
      RAISE EXCEPTION 'Circular task dependency detected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Missing Indexes for Performance

**Composite indexes for common queries:**
```sql
-- Find tasks by project and status
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

-- Find overdue tasks
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status NOT IN ('done', 'closed');

-- Find tasks by assignee and status
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);

-- Time entries by employee and date range
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, date);

-- Billable time not yet invoiced
CREATE INDEX idx_time_entries_unbilled ON time_entries(is_billable, is_invoiced)
  WHERE is_billable = true AND is_invoiced = false;

-- Critical path tasks
CREATE INDEX idx_critical_path_is_critical ON critical_path(project_id, is_critical)
  WHERE is_critical = true;
```

---

## Missing Views for Common Queries

```sql
-- Task summary by project
CREATE OR REPLACE VIEW v_project_task_summary AS
SELECT
  p.id as project_id,
  p.name as project_name,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.due_date < NOW() AND t.status NOT IN ('done', 'closed') THEN 1 END) as overdue_tasks,
  SUM(t.story_points) as total_story_points,
  SUM(CASE WHEN t.status = 'done' THEN t.story_points ELSE 0 END) as completed_story_points,
  SUM(t.estimated_hours) as total_estimated_hours,
  SUM(t.actual_hours) as total_actual_hours
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name;

-- Employee workload
CREATE OR REPLACE VIEW v_employee_workload AS
SELECT
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  COUNT(t.id) as assigned_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as active_tasks,
  SUM(t.remaining_hours) as remaining_hours,
  SUM(CASE WHEN t.due_date < NOW() + INTERVAL '7 days' THEN t.remaining_hours ELSE 0 END) as hours_due_this_week
FROM employees e
LEFT JOIN tasks t ON e.id = t.assignee_id AND t.status NOT IN ('done', 'closed', 'cancelled')
GROUP BY e.id, e.first_name, e.last_name;

-- Unbilled revenue by project
CREATE OR REPLACE VIEW v_unbilled_revenue AS
SELECT
  p.id as project_id,
  p.name as project_name,
  p.customer_id,
  SUM(te.billable_amount) as total_unbilled,
  COUNT(te.id) as unbilled_entries,
  MIN(te.date) as oldest_entry_date,
  MAX(te.date) as newest_entry_date
FROM projects p
JOIN time_entries te ON p.id = te.project_id
WHERE te.is_billable = true
  AND te.is_invoiced = false
  AND te.status = 'approved'
GROUP BY p.id, p.name, p.customer_id;
```

---

## Summary: Priority Matrix

| Feature Category | Business Impact | Implementation Effort | Priority |
|------------------|----------------|----------------------|----------|
| Resource Management | HIGH | HIGH | 🔴 Critical |
| Budget Tracking (EVM) | HIGH | MEDIUM | 🔴 Critical |
| Risk Management | MEDIUM-HIGH | LOW | 🟡 High |
| Test Case Management | MEDIUM-HIGH | MEDIUM | 🟡 High |
| Audit & Compliance | HIGH (if regulated) | LOW | 🟡 High |
| Client Portal | MEDIUM | MEDIUM | 🟡 High |
| Custom Fields UI | MEDIUM | MEDIUM | 🟢 Medium |
| Time Tracking Enhancements | MEDIUM | LOW | 🟢 Medium |
| Release Management | MEDIUM | MEDIUM | 🟢 Medium |
| Git Integration | MEDIUM | MEDIUM | 🟢 Medium |
| SLA Tracking | MEDIUM (support) | LOW | 🟢 Medium |
| Notifications System | MEDIUM | MEDIUM | 🟢 Medium |
| Portfolio Management | MEDIUM (large orgs) | HIGH | ⚪ Low |
| Templates | LOW-MEDIUM | LOW | ⚪ Low |
| Webhooks | MEDIUM | LOW | ⚪ Low |
| Forecasting/Analytics | LOW-MEDIUM | MEDIUM | ⚪ Low |
| Offline Support | LOW | HIGH | ⚪ Low |
| Recurring Tasks | LOW | LOW | ⚪ Low |

---

## Recommendations

### Phase 1 (MVP Complete) - Next 2 Weeks
1. ✅ Build API endpoints for existing schema
2. ✅ Build basic Kanban/Scrum UI
3. ✅ Implement time tracking approval workflow
4. 🔴 **Add Resource Allocation tracking**
5. 🔴 **Add Budget tracking with alerts**

### Phase 2 (Production Ready) - Weeks 3-6
6. 🟡 Risk management module
7. 🟡 Test case management
8. 🟡 Audit logging improvements
9. 🟡 Client portal (read-only views)
10. 🟢 Time tracking enhancements (timer, mobile)

### Phase 3 (Enterprise Features) - Months 2-3
11. 🟢 Release management
12. 🟢 Git integration
13. 🟢 Custom fields UI
14. 🟢 Notification system with preferences
15. 🟡 SLA tracking

### Phase 4 (Advanced) - Ongoing
16. Portfolio management
17. Forecasting & predictive analytics
18. Webhooks & integration marketplace
19. Mobile app with offline support
20. Advanced reporting & BI integration

---

**Bottom Line:** The core PM schema is solid, but you're missing **resource management** (biggest gap) and **granular budget tracking** (second biggest). These are table-stakes for enterprise PM tools. Everything else is nice-to-have or industry-specific.
