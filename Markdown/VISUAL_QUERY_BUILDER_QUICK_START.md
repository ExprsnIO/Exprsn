# Visual Query Builder - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 🚀 Installation (5 steps)

### 1. Add Scripts to Form Designer

In `/lowcode/views/form-designer-pro.ejs`, add before `</body>`:

```html
<!-- Query Builder -->
<link rel="stylesheet" href="/lowcode/css/query-builder.css">
<script src="/lowcode/js/form-query-builder.js"></script>
<script src="/lowcode/js/form-query-builder-ui.js"></script>
<script src="/lowcode/js/form-query-builder-ui-tabs.js"></script>
<script src="/lowcode/js/form-query-builder-ui-advanced.js"></script>
```

### 2. Add Backend Route

In `/lowcode/index.js`:

```javascript
const queryExecutor = require('./routes/queryExecutor');
app.use('/lowcode', queryExecutor);
```

### 3. Install Dependencies

```bash
cd src/exprsn-svr
npm install xml2js vm2 --save
```

### 4. Test Installation

```bash
# Start server
npm run dev:svr

# Open browser
http://localhost:5001/lowcode/forms
```

### 5. Create Your First Query

1. Click "New Query"
2. Select "Entity (Database Table)"
3. Choose entity: "contacts"
4. Click "Fields" tab → Select fields
5. Click "Preview" tab → Click "Test Query"

✅ Done! You should see results.

---

## 📋 Common Use Cases

### Use Case 1: Simple Entity Query

**Goal:** Get all active contacts

```javascript
// Datasource Tab
Type: Entity
Entity: contacts

// Fields Tab
Select: firstName, lastName, email

// Filters Tab
status equals 'active'

// Order & Limit Tab
Order By: lastName ASC
Limit: 100
```

**Result:**
```json
[
  { "firstName": "John", "lastName": "Doe", "email": "john@example.com" },
  { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com" }
]
```

---

### Use Case 2: REST API Query

**Goal:** Fetch users from external API

```javascript
// Datasource Tab
Type: REST API
URL: https://jsonplaceholder.typicode.com/users
Method: GET
Headers: {}
Data Path: (leave empty - array at root)

// Fields Tab
Select: name, email, company.name

// Filters Tab
email endsWith '.com'

// Order & Limit Tab
Limit: 10
```

---

### Use Case 3: Aggregated Report

**Goal:** Count contacts by status

```javascript
// Datasource Tab
Type: Entity
Entity: contacts

// Aggregation Tab
Group By: [status]
Aggregations:
- Function: count, Field: id, Alias: total

// Order & Limit Tab
Order By: total DESC
```

**Result:**
```json
[
  { "status": "active", "total": 150 },
  { "status": "inactive", "total": 45 }
]
```

---

### Use Case 4: Filtered Sales Report

**Goal:** Total sales by region for this year

```javascript
// Datasource Tab
Type: Forge
Module: opportunities

// Fields Tab
(leave empty - using aggregations)

// Filters Tab
stage equals 'Closed Won'
closeDate greaterThan '2025-01-01'

// Aggregation Tab
Group By: [region]
Aggregations:
- Function: sum, Field: amount, Alias: total_revenue
- Function: avg, Field: amount, Alias: avg_deal_size

// Order & Limit Tab
Order By: total_revenue DESC
```

---

### Use Case 5: Variable-Based Filter

**Goal:** Show contacts owned by current user

**Prerequisites:**
- Create variable in Variables tab: `currentUserId = 'user-123'`

```javascript
// Datasource Tab
Type: Entity
Entity: contacts

// Fields Tab
Select: firstName, lastName, email

// Filters Tab
ownerId equals (Variable) currentUserId

// Order & Limit Tab
Order By: lastName ASC
Limit: 50
```

---

## 🎯 Filter Examples

### Simple Filters

```javascript
// Text field equals value
status equals 'active'

// Number comparison
age greaterThan 18

// Date comparison
createdAt greaterThan '2025-01-01'

// Null check
deletedAt isNull
```

### Advanced Filters (Nested Groups)

```javascript
// (status = 'active' OR role = 'admin') AND score > 50

Filter Group (AND)
├─ Filter Group (OR)
│  ├─ status equals 'active'
│  └─ role equals 'admin'
└─ score greaterThan 50
```

### Variable Filters

```javascript
// Use form variable
department equals (Variable) userDepartment

// Use parameter
status equals (Parameter) $statusFilter

// Compare two fields
startDate lessThan (Field) endDate
```

---

## 🔧 Datasource Quick Reference

| Type | Use For | Config Required |
|------|---------|----------------|
| Entity | Database tables | Entity ID |
| Forge | CRM modules | Module name |
| Database | Custom tables | Table name |
| REST | External APIs | URL, method |
| JSON | JSON files | URL or data |
| XML | XML files | URL or data, XPath |
| JSONLex | Transformations | Expression, input |
| Redis | Cache data | Key pattern, type |
| Variable | Form data | Variable name |
| Custom | Complex logic | JavaScript code |

---

## 💡 Pro Tips

### 1. Performance Optimization

```javascript
// ✅ Good - Filter first, then limit
Filters: status equals 'active'
Limit: 100

// ❌ Bad - No filter, large limit
Filters: (none)
Limit: 10000
```

### 2. Use Aliases for Readability

```javascript
// ✅ Good - Clear aliases
firstName → first_name
lastName → last_name
accountId → account

// ❌ Bad - No aliases
firstName (unchanged)
lastName (unchanged)
accountId (unchanged)
```

### 3. Enable Caching for Slow Queries

```javascript
// Order & Limit Tab
☑ Enable Result Caching
Cache Duration: 300 seconds (5 minutes)
```

### 4. Test Before Full Execution

```javascript
// Preview Tab
1. Click "Test Query" (LIMIT 10)
2. Verify results
3. Click "Run Full Query"
```

### 5. Use Field Transformations

```javascript
// Fields Tab
email → Alias: user_email → Transform: lowercase
firstName → Transform: uppercase
```

---

## 🐛 Troubleshooting

### Issue: "Table not found"

**Solution:**
```bash
# Run migrations
cd src/exprsn-svr/lowcode
npx sequelize-cli db:migrate
```

### Issue: "No fields available"

**Solution:**
- Ensure entity is selected in Datasource tab
- Click away and back to trigger field loading
- Check browser console for errors

### Issue: "Query timeout"

**Solution:**
```javascript
// Order & Limit Tab
Timeout: 60 seconds (increase from 30)

// Or add indexes to filtered fields
CREATE INDEX idx_status ON contacts(status);
```

### Issue: "Redis is not enabled"

**Solution:**
```bash
# .env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Start Redis
redis-server
```

---

## 📊 Sample Queries Library

### 1. Active Users Report

```sql
SELECT firstName, lastName, email, lastLogin
FROM users
WHERE status = 'active'
  AND deletedAt IS NULL
ORDER BY lastLogin DESC
LIMIT 100
```

### 2. Monthly Revenue by Region

```sql
SELECT region,
       DATE_TRUNC('month', orderDate) as month,
       SUM(amount) as revenue
FROM orders
WHERE status = 'completed'
GROUP BY region, month
ORDER BY month DESC, revenue DESC
```

### 3. Top 10 Customers by Purchases

```sql
SELECT customerId,
       COUNT(id) as order_count,
       SUM(total) as total_spent
FROM orders
GROUP BY customerId
HAVING COUNT(id) > 5
ORDER BY total_spent DESC
LIMIT 10
```

---

## 🔗 Integration Examples

### Use Query in Dropdown

```javascript
// Component config
{
  type: 'dropdown',
  props: {
    label: 'Select Category',
    dataSource: {
      type: 'query',
      queryId: 'categories-active',
      valueField: 'id',
      labelField: 'name'
    }
  }
}
```

### Execute Query from Event Handler

```javascript
// Event: onClick
{
  trigger: 'onClick',
  action: 'executeQuery',
  queryId: 'contacts-by-status',
  parameters: {
    statusFilter: '{{statusDropdown.value}}'
  },
  onSuccess: {
    action: 'updateVariable',
    variable: 'contacts',
    value: '{{queryResults}}'
  }
}
```

### Use Query in Workflow

```javascript
// Workflow step
{
  stepType: 'query',
  queryId: 'new-leads-today',
  outputVariable: 'leads',
  nextStep: {
    stepType: 'notification',
    template: 'You have {{leads.length}} new leads!'
  }
}
```

---

## 📚 Next Steps

1. **Read Full Documentation**
   - `/lowcode/VISUAL_QUERY_BUILDER_DOCUMENTATION.md`

2. **Explore Examples**
   - Section 10 of documentation has 5 detailed examples

3. **Try Advanced Features**
   - JSONLex expressions
   - Custom code datasources
   - Nested filter groups

4. **Integrate with Forms**
   - Bind queries to components
   - Use in event handlers
   - Create dynamic forms

5. **Performance Testing**
   - Test with large datasets
   - Add database indexes
   - Enable caching

---

## 🆘 Support

**Documentation:**
- Quick Start: This file
- Full Guide: `VISUAL_QUERY_BUILDER_DOCUMENTATION.md`
- Implementation: `VISUAL_QUERY_BUILDER_IMPLEMENTATION_SUMMARY.md`

**Code:**
- Frontend: `/lowcode/public/js/form-query-builder*.js`
- Backend: `/lowcode/routes/queryExecutor.js`

**Contact:**
- Email: engineering@exprsn.com
- GitHub: Issues tab

---

**Version:** 1.0.0
**Last Updated:** December 26, 2025
**Status:** ✅ Production Ready

---

Happy querying! 🚀
