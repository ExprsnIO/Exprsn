# Product Backlog Database

**Database:** `exprsn_product_backlog`
**Created:** 2025-12-22
**Stories:** 28 user stories for Q1 2026

## Quick Stats

- **Total Stories:** 28
- **Categories:** 5 (Stability, Forge, Creator Economy, Platform Enhancements, Strategic)
- **Tags:** 10 (security, testing, infrastructure, database, mobile, api, monetization, ux, performance, monitoring)
- **Acceptance Criteria:** 177 testable criteria
- **Dependencies:** 13 story dependencies
- **Service Assignments:** 30 service impact mappings
- **Total Effort:** 158 weeks across all stories

## Priority Breakdown

- **P0 (Critical):** 3 stories
- **P1 (High):** 10 stories
- **P2 (Medium):** 13 stories
- **P3 (Low):** 2 stories

## Top 10 Stories by RICE Score

1. **1.7** - CA Certificate Expiration Monitoring (RICE: 13.5, P0, 2 weeks)
2. **4.6** - Two-Factor Authentication for All Users (RICE: 13.5, P1, 2 weeks)
3. **1.2** - Centralized Error Tracking with Sentry (RICE: 9.0, P1, 2 weeks)
4. **1.5** - Database Connection Pooling Optimization (RICE: 7.0, P1, 2 weeks)
5. **4.5** - User Blocking and Reporting (RICE: 7.0, P1, 3 weeks)
6. **1.8** - Database Backup Verification (RICE: 6.4, P1, 3 weeks)
7. **1.3** - Health Check Dependencies Validation (RICE: 6.0, P0, 3 weeks)
8. **4.1** - Progressive Web App (PWA) Support (RICE: 6.0, P1, 3 weeks)
9. **4.4** - Notification Preferences Management (RICE: 6.0, P2, 3 weeks)
10. **3.2** - One-Time Tipping/Support (RICE: 4.67, P2, 3 weeks)

## Database Schema

### Core Tables

- **story_categories** - 5 categories for organizing stories
- **stories** - 28 user stories with RICE scoring
- **story_acceptance_criteria** - 177 testable acceptance criteria
- **story_dependencies** - Prerequisite relationships between stories
- **story_tags** - 10 tags for categorization
- **story_tag_assignments** - Many-to-many story-tag relationships
- **sprints** - Sprint planning and tracking
- **story_comments** - Activity log for stories
- **story_affected_services** - Which Exprsn services each story impacts

### Views

- **v_stories_with_rice** - Stories with calculated RICE scores and metadata
- **v_sprint_summary** - Sprint progress and completion metrics

### Triggers

- **update_rice_score()** - Auto-calculates RICE score on insert/update
- **update_updated_at()** - Auto-updates timestamps

## Useful Queries

### Get all P0/P1 stories sorted by RICE score
```sql
SELECT story_number, title, priority, rice_score, effort_weeks
FROM v_stories_with_rice
WHERE priority IN ('P0', 'P1')
ORDER BY rice_score DESC;
```

### Get all stories for Q1 2026
```sql
SELECT story_number, title, category_name, priority, status
FROM v_stories_with_rice
WHERE target_quarter = '2026-Q1'
ORDER BY rice_score DESC;
```

### Get stories with acceptance criteria
```sql
SELECT
  s.story_number,
  s.title,
  s.rice_score,
  sac.description as acceptance_criterion
FROM stories s
JOIN story_acceptance_criteria sac ON s.id = sac.story_id
WHERE s.priority = 'P0'
ORDER BY s.rice_score DESC, sac.sort_order;
```

### Get stories by affected service
```sql
SELECT
  s.story_number,
  s.title,
  s.priority,
  array_agg(sas.service_name) as affected_services
FROM stories s
JOIN story_affected_services sas ON s.id = sas.story_id
GROUP BY s.id, s.story_number, s.title, s.priority
ORDER BY s.story_number;
```

### Get stories with dependencies
```sql
SELECT
  s1.story_number as story,
  s1.title,
  sd.dependency_type,
  s2.story_number as depends_on,
  s2.title as depends_on_title
FROM story_dependencies sd
JOIN stories s1 ON sd.story_id = s1.id
JOIN stories s2 ON sd.depends_on_story_id = s2.id
ORDER BY s1.story_number;
```

### Category summary with metrics
```sql
SELECT
  sc.name as category,
  COUNT(s.id) as story_count,
  ROUND(AVG(s.rice_score), 2) as avg_rice_score,
  SUM(s.effort_weeks) as total_effort_weeks,
  COUNT(CASE WHEN s.priority = 'P0' THEN 1 END) as p0_count,
  COUNT(CASE WHEN s.priority = 'P1' THEN 1 END) as p1_count
FROM story_categories sc
LEFT JOIN stories s ON s.category_id = sc.id
GROUP BY sc.id, sc.name, sc.sort_order
ORDER BY sc.sort_order;
```

### Stories tagged with specific tag (e.g., 'security')
```sql
SELECT
  s.story_number,
  s.title,
  s.priority,
  s.rice_score,
  array_agg(st.name) as tags
FROM stories s
JOIN story_tag_assignments sta ON s.id = sta.story_id
JOIN story_tags st ON sta.tag_id = st.id
WHERE st.name = 'security'
GROUP BY s.id, s.story_number, s.title, s.priority, s.rice_score
ORDER BY s.rice_score DESC;
```

## Connecting to the Database

```bash
# macOS with Postgres.app
/Applications/Postgres.app/Contents/Versions/18/bin/psql -d exprsn_product_backlog

# Standard PostgreSQL installation
psql -d exprsn_product_backlog

# From Node.js (using Sequelize)
const sequelize = new Sequelize('exprsn_product_backlog', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres'
});
```

## Migrations

The backlog schema was created using two migration files:

1. **create-product-backlog-schema.sql** - Creates all tables, indexes, views, and triggers
2. **insert-q1-2026-backlog-data.sql** - Inserts all 28 stories with complete data

Location: `/Users/rickholland/Downloads/Exprsn/database/migrations/`

## Category Breakdown

### 1. Stability & Technical Debt (8 stories, 25 weeks)
- Avg RICE Score: 6.58
- Focus: Test coverage, error tracking, health checks, monitoring, database optimization

### 2. Forge Business Platform (4 stories, 25 weeks)
- Avg RICE Score: 2.29
- Focus: Complete Groupware module, start ERP, add reporting, improve mobile UI

### 3. Creator Economy & Monetization (5 stories, 25 weeks)
- Avg RICE Score: 2.31
- Focus: Subscriptions, tipping, analytics, benefits, premium profiles

### 4. Platform Enhancements (6 stories, 22 weeks)
- Avg RICE Score: 6.08
- Focus: PWA, search, moderation, notifications, blocking, 2FA

### 5. Strategic Differentiation (5 stories, 61 weeks)
- Avg RICE Score: 0.87
- Focus: ActivityPub, mobile apps, E2EE groups, self-hosting, AI recommendations

## Next Steps

1. **Create Sprint Planning:**
   ```sql
   INSERT INTO sprints (name, goal, start_date, end_date, status, capacity_points)
   VALUES ('Sprint 1', 'Complete critical P0 stories', '2026-01-06', '2026-01-19', 'planned', 40);
   ```

2. **Assign Stories to Sprint:**
   ```sql
   UPDATE stories
   SET sprint_id = (SELECT id FROM sprints WHERE name = 'Sprint 1'),
       status = 'planned'
   WHERE story_number IN ('1.7', '1.3', '4.6');
   ```

3. **Track Progress:**
   ```sql
   SELECT * FROM v_sprint_summary WHERE name = 'Sprint 1';
   ```

## Source Document

Full product backlog details: `/Users/rickholland/Downloads/Exprsn/PRODUCT_BACKLOG_2026_Q1.md`

---

**Maintained by:** Product Manager Agent
**Last Updated:** 2025-12-22
