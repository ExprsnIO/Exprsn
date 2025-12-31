# Forge PM - Critical Features Added

**Date:** 2025-12-22
**Status:** ✅ Complete
**Migrations:** `010-create-resource-management.js`, `011-create-budget-tracking.js`

---

## Overview

Successfully added the **two most critical missing features** to the Forge Project Management module:
1. **Resource Management & Capacity Planning**
2. **Budget Tracking & Earned Value Management (EVM)**

These features close the biggest gaps in the PM system and enable enterprise-level project management.

---

## 1. Resource Management Module

### Tables Created (5)

#### `employee_skills`
**Purpose:** Skills matrix with proficiency tracking

**Key Fields:**
- `skill_name` - e.g., "JavaScript", "Project Management", "Python"
- `skill_category` - technical, soft_skill, domain_knowledge, tool, language, certification
- `proficiency_level` - beginner, intermediate, advanced, expert
- `years_experience` - e.g., 3.5 years
- `last_used_date` - When was this skill last used?
- `is_primary_skill` - Core competency for this employee?
- `certification` - e.g., "AWS Certified Solutions Architect"
- `certification_expiry` - Track cert renewals

**Use Cases:**
- "Who has Python expertise?"
- "Find all employees with AWS certifications"
- "Build a skills inventory report"

#### `employee_unavailability`
**Purpose:** Track PTO, holidays, sick leave, training

**Key Fields:**
- `start_date`, `end_date`
- `unavailability_type` - pto, vacation, sick_leave, holiday, training, conference, jury_duty, other
- `hours_unavailable` - Total hours unavailable
- `is_paid` - Paid vs. unpaid leave
- `status` - requested, approved, denied, cancelled
- `approved_by` - Manager who approved

**Use Cases:**
- "Who is available next week?"
- "How many PTO days has John taken this year?"
- "Show all upcoming holidays"

#### `resource_allocations`
**Purpose:** Track who is assigned where and when

**Key Fields:**
- `employee_id`, `project_id`, `task_id` (task-level or project-level allocation)
- `role_on_project` - e.g., "Lead Developer", "QA Engineer"
- `start_date`, `end_date`
- `allocation_percentage` - 0-200% (can detect over-allocation)
- `hours_per_week` - Alternative to percentage
- `total_hours_allocated`, `actual_hours_worked`
- `status` - planned, confirmed, active, completed, cancelled
- `is_billable`, `billable_rate`

**Use Cases:**
- "Allocate Sarah to Project X at 50% for 3 months"
- "Who is over-allocated this week?" (allocation > 100%)
- "Show all allocations for Project Y"
- "Calculate project staffing costs"

#### `resource_capacity`
**Purpose:** Weekly capacity tracking

**Key Fields:**
- `week_start_date` - Monday of the week
- `available_hours` - Total hours available (typically 40)
- `allocated_hours` - Sum of allocations for this week
- `unavailable_hours` - PTO, holidays, etc.
- `actual_hours` - Actual hours worked (from time entries)
- `utilization_percentage` - (allocated_hours / available_hours) * 100
- `is_over_allocated` - True if allocated > available

**Use Cases:**
- "Show weekly capacity for entire team"
- "Is John over-allocated this week?"
- "Calculate team utilization percentage"
- "Forecast resource availability"

#### `skill_requirements`
**Purpose:** Required skills for projects/tasks

**Key Fields:**
- `project_id` or `task_id` (one required)
- `skill_name` - e.g., "React", "SQL", "Agile Coaching"
- `required_proficiency` - beginner, intermediate, advanced, expert
- `is_mandatory` - Must-have vs. nice-to-have
- `estimated_hours` - How many hours of this skill needed?

**Use Cases:**
- "This task requires expert Python skills for 40 hours"
- "Find employees who match this project's skill requirements"
- "Gap analysis: Do we have the skills needed?"

### Views Created (3)

#### `v_employee_utilization`
Shows weekly utilization by employee with status classification

**Columns:**
- employee_id, employee_name, department_id
- week_start_date
- available_hours, allocated_hours, unavailable_hours, actual_hours
- utilization_percentage
- is_over_allocated
- utilization_status - over_allocated (>100%), optimal (80-100%), moderate (50-80%), under_utilized (<50%)

**Query Example:**
```sql
SELECT * FROM v_employee_utilization
WHERE week_start_date = '2026-01-05'
ORDER BY utilization_percentage DESC;
```

#### `v_project_resource_summary`
Resource allocation summary by project

**Columns:**
- project_id, project_name
- total_resources - Count of distinct employees
- total_hours_allocated, total_hours_worked
- hours_consumed_percentage
- active_allocations
- billable_hours_worked

**Query Example:**
```sql
SELECT * FROM v_project_resource_summary
WHERE project_name = 'Website Redesign';
```

#### `v_skills_inventory`
Organization-wide skills inventory

**Columns:**
- skill_name, skill_category
- employee_count - How many people have this skill?
- expert_count, advanced_count, intermediate_count, beginner_count
- primary_skill_count - For how many is this a core competency?
- avg_years_experience

**Query Example:**
```sql
SELECT * FROM v_skills_inventory
WHERE skill_category = 'technical'
ORDER BY employee_count DESC
LIMIT 20;
```

### Key Features

✅ **Resource Allocation Tracking**
- Track who is assigned to what project/task
- Specify allocation percentage (can allocate 50% of someone's time)
- Detect over-allocation (when total allocation > 100%)

✅ **Skills Matrix**
- Catalog all employee skills
- Track proficiency levels (beginner → expert)
- Track certifications and expiry dates
- Match skills to project requirements

✅ **Availability Tracking**
- Track PTO, holidays, sick leave, training
- Approval workflow for time off requests
- Calculate net available hours

✅ **Capacity Planning**
- Weekly capacity snapshots
- Utilization percentage calculations
- Over-allocation detection
- Forecast future availability

---

## 2. Budget Tracking & EVM Module

### Tables Created (4)

#### `budget_items`
**Purpose:** Granular budget tracking per project/task/category

**Key Fields:**
- `project_id`, `task_id`, `milestone_id` (flexible assignment)
- `category` - labor, materials, software, hardware, consulting, travel, training, licenses, infrastructure, marketing, contingency, other
- `subcategory` - e.g., "Cloud Hosting", "Development Tools"
- `description`
- `budgeted_amount` - Original budget
- `revised_budget` - Updated budget after change requests
- `actual_amount` - Actual costs incurred (from invoices, time entries)
- `committed_amount` - POs issued but not yet paid
- `variance` - budgeted - actual (positive = under budget)
- `variance_percentage` - (variance / budgeted) * 100
- `currency`, `fiscal_year`, `fiscal_quarter`
- `status` - planned, approved, active, completed, on_hold, cancelled
- `is_capital_expense` - CapEx vs. OpEx classification
- `cost_center`, `gl_account` - Accounting integration

**Use Cases:**
- "Budget $50,000 for labor on this project"
- "Track actual costs against budget by category"
- "Show variance for all active projects"
- "Generate financial reports by fiscal quarter"

#### `budget_alerts`
**Purpose:** Threshold-based budget notifications

**Key Fields:**
- `project_id`
- `alert_name` - e.g., "80% Budget Warning"
- `threshold_type` - percentage, amount, burn_rate
- `threshold_percentage` - e.g., 80 = alert when 80% consumed
- `threshold_amount` - Alert when spending exceeds this
- `threshold_burn_rate` - Alert when burn rate too high
- `alert_type` - info, warning, critical
- `category_filter` - Alert only for specific category (e.g., "labor")
- `recipients` - Array of employee IDs to notify
- `notification_method` - ["email", "in_app", "sms"]
- `is_active`, `last_triggered_at`, `trigger_count`

**Use Cases:**
- "Alert PM when 80% of labor budget consumed"
- "Send critical alert when spending exceeds $100K"
- "Notify stakeholders when burn rate > $5K/day"

#### `budget_change_requests`
**Purpose:** Budget increase/decrease approval workflow

**Key Fields:**
- `budget_item_id`, `project_id`
- `change_type` - increase, decrease, reallocate, new_item
- `current_amount`, `requested_amount`, `change_amount`
- `justification` - Why is this change needed?
- `impact_analysis` - Impact on timeline, scope, quality
- `requested_by`, `status` - pending, approved, rejected, cancelled
- `approved_by`, `approved_at`, `rejection_reason`

**Use Cases:**
- "Request $10K budget increase for additional consulting"
- "Reallocate $5K from travel to software licenses"
- "Track all budget change requests for audit"

#### `earned_value_snapshots`
**Purpose:** Earned Value Management (EVM) metrics tracking

**Key Fields:**
```
Core Metrics:
- budget_at_completion (BAC) - Total approved budget
- planned_value (PV / BCWS) - Budgeted Cost of Work Scheduled
- earned_value (EV / BCWP) - Budgeted Cost of Work Performed
- actual_cost (AC / ACWP) - Actual Cost of Work Performed

Variance Metrics:
- schedule_variance (SV) = EV - PV (positive = ahead of schedule)
- cost_variance (CV) = EV - AC (positive = under budget)

Performance Indexes:
- schedule_performance_index (SPI) = EV / PV (>1.0 = ahead)
- cost_performance_index (CPI) = EV / AC (>1.0 = under budget)

Forecasts:
- estimate_at_completion (EAC) - Forecasted final cost
- estimate_to_complete (ETC) = EAC - AC (cost remaining)
- variance_at_completion (VAC) = BAC - EAC (projected over/under)
- to_complete_performance_index (TCPI) - CPI needed to meet budget

Status:
- percent_complete = (EV / BAC) * 100
- percent_spent = (AC / BAC) * 100
- completion_status - on_track, at_risk, off_track, critical
```

**Use Cases:**
- "Is the project on schedule and on budget?"
- "Forecast final project cost based on current performance"
- "Track EVM metrics weekly for all projects"
- "Generate EVM dashboard for executives"

### Views Created (4)

#### `v_project_budget_summary`
Budget consumption summary by project

**Columns:**
- project_id, project_name, project_status
- total_budget, revised_total_budget
- total_actual, total_committed, total_encumbered
- remaining_budget
- budget_consumed_percentage
- is_over_budget

**Query Example:**
```sql
SELECT
  project_name,
  total_budget,
  total_actual,
  remaining_budget,
  budget_consumed_percentage,
  is_over_budget
FROM v_project_budget_summary
WHERE is_over_budget = true;
```

#### `v_budget_by_category`
Spending breakdown by category

**Columns:**
- project_id, project_name, category
- item_count
- budgeted, actual, variance
- avg_variance_percentage

**Query Example:**
```sql
SELECT * FROM v_budget_by_category
WHERE project_name = 'Mobile App v2.0'
ORDER BY category;
```

#### `v_latest_evm_metrics`
Current EVM metrics for all projects

**Columns:**
- project_id, project_name, snapshot_date
- bac, pv, ev, ac
- sv, cv, spi, cpi
- eac, etc, vac
- percent_complete, percent_spent
- completion_status, project_health

**Query Example:**
```sql
SELECT
  project_name,
  spi,
  cpi,
  percent_complete,
  eac,
  project_health
FROM v_latest_evm_metrics
WHERE project_health IN ('at_risk', 'critical');
```

#### `v_project_burn_rate`
Daily burn rate and runway analysis

**Columns:**
- project_id, project_name
- start_date, end_date
- days_elapsed, total_project_days
- total_spent, total_budget
- daily_burn_rate
- days_of_runway_remaining

**Query Example:**
```sql
SELECT
  project_name,
  daily_burn_rate,
  days_of_runway_remaining
FROM v_project_burn_rate
WHERE days_of_runway_remaining < 30;
```

### Key Features

✅ **Granular Budget Tracking**
- Track budget by project, task, milestone, or category
- Monitor budgeted vs. actual vs. committed costs
- Calculate variance and variance percentage

✅ **Budget Alerts**
- Set threshold-based notifications
- Alert when 80% of budget consumed
- Alert when burn rate exceeds target
- Multi-channel notifications (email, in-app, SMS)

✅ **Budget Change Management**
- Formal approval workflow for budget changes
- Track justification and impact analysis
- Audit trail of all budget modifications

✅ **Earned Value Management (EVM)**
- Full PMI-standard EVM calculations
- Track 12 key EVM metrics
- Weekly/monthly snapshots
- Forecast final cost (EAC)
- Project health status

---

## Combined Impact

### Questions You Can Now Answer

**Resource Management:**
1. ✅ "Do we have enough people to take on this new project?"
2. ✅ "Who is over-allocated this week?"
3. ✅ "Find me a Python expert with at least 5 years experience"
4. ✅ "What's our team utilization percentage?"
5. ✅ "Who is available for a 3-month engagement starting next month?"
6. ✅ "Do we have the skills required for this project?"

**Budget Tracking:**
7. ✅ "Are we over budget on Project X?"
8. ✅ "What's our daily burn rate?"
9. ✅ "How many days of runway do we have left?"
10. ✅ "Is the project on schedule and on budget?" (EVM)
11. ✅ "Forecast the final cost of this project"
12. ✅ "Show me all projects that are critical (SPI < 0.9 or CPI < 0.9)"

### Integration with Existing PM Module

**Time Entries → Budget Tracking:**
```sql
-- Update actual costs from approved time entries
UPDATE budget_items bi
SET actual_amount = (
  SELECT SUM(te.billable_amount)
  FROM time_entries te
  WHERE te.project_id = bi.project_id
    AND te.is_billable = true
    AND te.status = 'approved'
)
WHERE bi.category = 'labor';
```

**Resource Allocations → Time Entries:**
```sql
-- Find tasks where actual hours exceed allocated hours
SELECT
  t.task_number,
  t.title,
  ra.total_hours_allocated,
  SUM(te.hours) as actual_hours,
  SUM(te.hours) - ra.total_hours_allocated as variance
FROM tasks t
JOIN resource_allocations ra ON t.id = ra.task_id
JOIN time_entries te ON t.id = te.task_id
GROUP BY t.id, t.task_number, t.title, ra.total_hours_allocated
HAVING SUM(te.hours) > ra.total_hours_allocated;
```

**Skills → Task Assignment:**
```sql
-- Find employees who match task skill requirements
SELECT
  e.first_name || ' ' || e.last_name as employee_name,
  es.skill_name,
  es.proficiency_level,
  sr.required_proficiency
FROM skill_requirements sr
JOIN employee_skills es ON sr.skill_name = es.skill_name
  AND es.proficiency_level >= sr.required_proficiency
JOIN employees e ON es.employee_id = e.id
WHERE sr.task_id = '{task_uuid}'
  AND sr.is_mandatory = true;
```

---

## Database Statistics

### Total Tables Added: 9

**Resource Management (5):**
- employee_skills
- employee_unavailability
- resource_allocations
- resource_capacity
- skill_requirements

**Budget Tracking (4):**
- budget_items
- budget_alerts
- budget_change_requests
- earned_value_snapshots

### Total Views Added: 7

**Resource Management (3):**
- v_employee_utilization
- v_project_resource_summary
- v_skills_inventory

**Budget Tracking (4):**
- v_project_budget_summary
- v_budget_by_category
- v_latest_evm_metrics
- v_project_burn_rate

### Total PM Module Tables: 26

- Original PM module: 17 tables
- Resource Management: +5 tables
- Budget Tracking: +4 tables
- **Grand Total: 26 tables**

---

## Migration Files

### `010-create-resource-management.js`
**Location:** `src/exprsn-forge/migrations/`
**Size:** ~550 lines
**Tables:** 5 tables, 3 views
**Status:** ✅ Migrated

### `011-create-budget-tracking.js`
**Location:** `src/exprsn-forge/migrations/`
**Size:** ~650 lines
**Tables:** 4 tables, 4 views
**Status:** ✅ Migrated

---

## Example Queries

### 1. Find Over-Allocated Employees This Week

```sql
SELECT
  employee_name,
  week_start_date,
  available_hours,
  allocated_hours,
  utilization_percentage,
  allocated_hours - available_hours as over_allocation_hours
FROM v_employee_utilization
WHERE is_over_allocated = true
  AND week_start_date = DATE_TRUNC('week', NOW());
```

### 2. Skills Gap Analysis for a Project

```sql
-- Required skills not found in organization
SELECT
  sr.skill_name,
  sr.required_proficiency,
  COALESCE(si.employee_count, 0) as employees_with_skill,
  COALESCE(si.expert_count + si.advanced_count, 0) as qualified_employees
FROM skill_requirements sr
LEFT JOIN v_skills_inventory si ON sr.skill_name = si.skill_name
WHERE sr.project_id = '{project_uuid}'
  AND sr.is_mandatory = true
  AND (si.employee_count IS NULL OR si.expert_count + si.advanced_count = 0);
```

### 3. Projects at Risk (Budget or Schedule)

```sql
SELECT
  project_name,
  spi,
  cpi,
  percent_complete,
  eac,
  vac,
  project_health
FROM v_latest_evm_metrics
WHERE spi < 1.0 OR cpi < 1.0
ORDER BY project_health DESC, spi ASC;
```

### 4. Burn Rate Alert (Running Out of Money)

```sql
SELECT
  project_name,
  total_budget,
  total_spent,
  daily_burn_rate,
  days_of_runway_remaining,
  CASE
    WHEN days_of_runway_remaining < 14 THEN 'CRITICAL'
    WHEN days_of_runway_remaining < 30 THEN 'WARNING'
    ELSE 'OK'
  END as urgency
FROM v_project_burn_rate
WHERE days_of_runway_remaining IS NOT NULL
ORDER BY days_of_runway_remaining ASC;
```

### 5. Resource Utilization Report

```sql
SELECT
  d.name as department,
  COUNT(DISTINCT eu.employee_id) as total_employees,
  ROUND(AVG(eu.utilization_percentage), 2) as avg_utilization,
  COUNT(CASE WHEN eu.utilization_status = 'over_allocated' THEN 1 END) as over_allocated_count,
  COUNT(CASE WHEN eu.utilization_status = 'optimal' THEN 1 END) as optimal_count,
  COUNT(CASE WHEN eu.utilization_status = 'under_utilized' THEN 1 END) as under_utilized_count
FROM v_employee_utilization eu
JOIN employees e ON eu.employee_id = e.id
JOIN departments d ON e.department_id = d.id
WHERE eu.week_start_date = DATE_TRUNC('week', NOW())
GROUP BY d.id, d.name
ORDER BY avg_utilization DESC;
```

### 6. Budget Variance by Category

```sql
SELECT
  category,
  SUM(budgeted) as total_budgeted,
  SUM(actual) as total_actual,
  SUM(variance) as total_variance,
  ROUND(AVG(avg_variance_percentage), 2) as avg_variance_pct,
  COUNT(*) as item_count
FROM v_budget_by_category
WHERE project_id = '{project_uuid}'
GROUP BY category
ORDER BY total_variance ASC;
```

---

## Next Steps

### Phase 1: API Endpoints (Week 1-2)
- [ ] Build Sequelize models for all 9 new tables
- [ ] Create service layer for resource management
- [ ] Create service layer for budget tracking
- [ ] Build REST API endpoints:
  - `GET/POST /api/resource-allocations`
  - `GET/POST /api/employee-skills`
  - `GET/POST /api/budget-items`
  - `GET /api/evm/:projectId` - EVM dashboard data
  - `GET /api/utilization/weekly` - Weekly utilization report

### Phase 2: UI Components (Week 3-4)
- [ ] Resource capacity planning Gantt chart
- [ ] Skills matrix table with filters
- [ ] Budget dashboard with variance charts
- [ ] EVM dashboard with SPI/CPI gauges
- [ ] Burn rate chart with runway projection
- [ ] Over-allocation alerts widget

### Phase 3: Automation (Week 5-6)
- [ ] Auto-calculate resource_capacity from allocations
- [ ] Auto-update actual_hours_worked from time entries
- [ ] Auto-update budget actual_amount from time entries and invoices
- [ ] Auto-trigger budget alerts when thresholds exceeded
- [ ] Auto-calculate EVM metrics weekly
- [ ] Notifications for over-allocation

### Phase 4: Advanced Features (Month 2)
- [ ] Resource forecasting (predictive allocation)
- [ ] Budget forecasting (Monte Carlo simulations)
- [ ] Skills gap analysis with hiring recommendations
- [ ] What-if scenario planning
- [ ] Resource leveling algorithms
- [ ] Portfolio-level resource optimization

---

## Success Metrics

### Resource Management
- **Utilization Target:** 75-85% (optimal range)
- **Over-Allocation Incidents:** < 5% of employee-weeks
- **Skills Coverage:** > 90% of required skills available in-house
- **Allocation Accuracy:** Actual hours within 20% of allocated hours

### Budget Tracking
- **CPI Target:** > 0.95 (cost performance)
- **SPI Target:** > 0.90 (schedule performance)
- **Budget Variance:** Within ±10% for 80% of projects
- **Forecast Accuracy:** EAC within 15% of final actual cost

---

## Migration Commands

### Run Migrations
```bash
cd /Users/rickholland/Downloads/Exprsn/src/exprsn-forge

# Run all migrations
npx sequelize-cli db:migrate

# Or run specific migrations
npx sequelize-cli db:migrate --name 010-create-resource-management.js
npx sequelize-cli db:migrate --name 011-create-budget-tracking.js
```

### Verify Tables
```bash
psql -d exprsn_forge -c "\dt" | grep -E "(employee_skills|resource_|budget_|earned_value)"
```

### Verify Views
```bash
psql -d exprsn_forge -c "\dv" | grep -E "(utilization|resource_summary|skills_inventory|budget_summary|evm_metrics|burn_rate)"
```

---

**Status:** ✅ **COMPLETE - Critical Gaps Closed!**

The Forge PM module now has **enterprise-grade resource management** and **financial tracking**. These were the #1 and #2 highest priority missing features. The module is ready for API and UI development.

**Documentation:**
- Main PM Module: `/FORGE_PROJECT_MANAGEMENT_MODULE.md`
- Missing Features Analysis: `/FORGE_PM_MISSING_FEATURES.md`
- This Summary: `/FORGE_PM_CRITICAL_FEATURES_ADDED.md`
