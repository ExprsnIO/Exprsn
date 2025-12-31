# Migration Generator - Quick Testing Guide

## Prerequisites

1. Start exprsn-svr service:
```bash
cd /Users/rickholland/Downloads/Exprsn/src/exprsn-svr
NODE_ENV=development npm start
```

2. Access Entity Designer Pro:
```
http://localhost:5000/lowcode/designer?appId={your-app-id}
```

---

## Quick Test Scenarios

### Test 1: First-Time Entity Creation (2 minutes)

**Steps:**
1. Click "New Entity"
2. Name: `customers`
3. Add 3 fields:
   - `id` (UUID, Primary Key)
   - `email` (Email, Required, Unique)
   - `created_at` (Timestamp, Default: CURRENT_TIMESTAMP)
4. Save entity
5. Click "Migrations" tab
6. Click "Generate Migration"
7. **Expected:** Version 1.0.0, Type: CREATE TABLE
8. Enter description: "Initial customer table"
9. Click "Generate Migration"
10. **Expected:** Migration card appears in Pending section
11. Click "View SQL"
12. **Expected:** See CREATE TABLE statement
13. Click "Apply"
14. **Expected:** Migration moves to Applied, Version shows 1.0.0

**Success Criteria:**
- ✅ Migration generated with correct SQL
- ✅ Version tracking works
- ✅ Apply moves migration to Applied section
- ✅ No errors in browser console

---

### Test 2: Add Column (1 minute)

**Steps:**
1. With `customers` selected, click "Add Field"
2. Name: `phone`, Type: Phone
3. Save
4. Go to Migrations tab
5. Click "Generate Migration"
6. **Expected:** Version 1.0.1 (auto-incremented)
7. **Expected:** Detected change shows "ADD Column: phone (Phone)"
8. Description: "Add phone field"
9. Generate and Apply

**Success Criteria:**
- ✅ Auto-increment works (1.0.0 → 1.0.1)
- ✅ Change detection identifies new field
- ✅ ALTER TABLE ADD COLUMN in SQL
- ✅ Rollback SQL shows DROP COLUMN

---

### Test 3: Modify Column Type (1 minute)

**Steps:**
1. Edit `phone` field
2. Change type to String (VARCHAR)
3. Save
4. Generate migration (should be 1.0.2)
5. **Expected:** Detected change shows "MODIFY Column: phone (Phone → String)"
6. Apply

**Success Criteria:**
- ✅ Type change detected
- ✅ ALTER COLUMN TYPE in SQL
- ✅ USING clause for type casting present

---

### Test 4: Add Index (1 minute)

**Steps:**
1. Switch to "Indexes" tab
2. Click "Add Index"
3. Name: `idx_customers_email`
4. Type: btree
5. Fields: Select `email`
6. Unique: Checked
7. Save
8. Go to Migrations tab
9. Generate migration (1.1.0 - minor bump for new feature)
10. Apply

**Success Criteria:**
- ✅ Index change detected
- ✅ CREATE UNIQUE INDEX in SQL
- ✅ Correct index type and field

---

### Test 5: Rollback (30 seconds)

**Steps:**
1. Find most recent applied migration
2. Click "Rollback" button
3. Confirm warning dialog
4. **Expected:** Migration moves back to Pending
5. **Expected:** Rollback SQL was executed

**Success Criteria:**
- ✅ Rollback warning shown
- ✅ Migration returns to Pending
- ✅ No errors

---

### Test 6: Multiple Migrations + Apply All (1 minute)

**Steps:**
1. Add 3 fields without applying migrations:
   - `first_name` (String)
   - `last_name` (String)
   - `age` (Integer)
2. Generate migration for each (versions 1.1.1, 1.1.2, 1.1.3)
3. **Expected:** 3 migrations in Pending
4. Click "Apply Pending" button
5. Confirm
6. **Expected:** All 3 applied in order

**Success Criteria:**
- ✅ All migrations applied successfully
- ✅ Version updated to 1.1.3
- ✅ Success count shown in toast

---

### Test 7: Export SQL (30 seconds)

**Steps:**
1. Generate 2 migrations without applying
2. Click "Export SQL"
3. **Expected:** .sql file downloads
4. Open file
5. **Expected:** Contains both migrations with headers

**Success Criteria:**
- ✅ File downloads
- ✅ Contains all pending migrations
- ✅ Proper SQL formatting

---

### Test 8: Copy to Clipboard (30 seconds)

**Steps:**
1. View SQL of any migration
2. Click "Copy" button
3. Paste in text editor
4. **Expected:** SQL copied correctly
5. Switch to "Rollback SQL" tab
6. Click "Copy"
7. Paste
8. **Expected:** Rollback SQL copied

**Success Criteria:**
- ✅ Copy button works
- ✅ Both SQL types can be copied
- ✅ Success toast shown

---

### Test 9: Delete Migration (30 seconds)

**Steps:**
1. Generate migration without applying
2. Click "Delete" button
3. Confirm
4. **Expected:** Migration removed from list

**Success Criteria:**
- ✅ Confirmation dialog shown
- ✅ Migration deleted
- ✅ Pending count decreases

---

### Test 10: Auto-Increment Version (15 seconds)

**Steps:**
1. Open Generate Migration modal
2. Note current version in field
3. Click "Auto-increment" button
4. **Expected:** Version increments by patch level
5. Click multiple times
6. **Expected:** Each click increments

**Success Criteria:**
- ✅ Auto-increment works
- ✅ Follows semantic versioning (x.x.PATCH)

---

## Visual Verification Checklist

### Migrations Tab
- [ ] Badge shows pending count
- [ ] Header stats show Current Version / Pending / Applied
- [ ] Three sections visible: Pending, Applied, Failed
- [ ] Empty states show when no migrations

### Migration Card
- [ ] Title shows version + description
- [ ] Type badge color-coded (green=create, blue=alter, red=drop)
- [ ] Migration ID and timestamp visible
- [ ] Action buttons appropriate for status
- [ ] SQL preview toggles on/off
- [ ] SQL/Rollback tabs switch correctly

### Generate Migration Modal
- [ ] Version field shows auto-incremented value
- [ ] Description field present
- [ ] Migration type dropdown populated
- [ ] Detected changes section shows changes
- [ ] Advanced options checkboxes work
- [ ] SQL preview updates
- [ ] Generate button creates migration

### SQL Display
- [ ] Dark theme code background
- [ ] Syntax readable (white/light text)
- [ ] Copy button works
- [ ] Download button triggers file save
- [ ] Proper indentation and formatting

---

## Common Issues & Solutions

### Issue 1: "No changes detected"
**Cause:** Entity not modified since last migration
**Solution:** Make a schema change first, then generate

### Issue 2: Version not auto-incrementing
**Cause:** No current version on entity
**Solution:** Apply first migration to establish version

### Issue 3: SQL preview shows "-- SQL will be generated..."
**Cause:** Migration not generated yet
**Solution:** Click "Generate Migration" button

### Issue 4: Apply button disabled
**Cause:** No pending migrations
**Solution:** Generate a migration first

### Issue 5: Failed migration doesn't show
**Cause:** API endpoint not implemented
**Solution:** Implement server-side migration API routes

---

## Performance Benchmarks

Expected performance on typical hardware:

| Operation | Time | Notes |
|-----------|------|-------|
| Generate migration (5 fields) | < 100ms | Client-side only |
| Detect changes (20 fields) | < 50ms | Schema comparison |
| Render migration card | < 10ms | DOM manipulation |
| Apply migration (simple) | < 500ms | Depends on database |
| Apply migration (complex) | < 2s | Multiple indexes |
| Rollback | < 500ms | Usually faster than apply |
| Export SQL (10 migrations) | < 50ms | File generation |

---

## Browser Compatibility

Tested and working on:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

**Required features:**
- ES6+ (async/await, arrow functions, Map/Set)
- Clipboard API (for copy functionality)
- Fetch API (for API calls)
- localStorage (for caching)

---

## Console Debug Commands

Open browser console and try these:

```javascript
// View current migration state
console.log(window.migrationState);

// View entity migrations
console.log(state.currentEntity?.migrations);

// Force refresh migrations
window.initializeMigrationsTab();

// Generate test migration manually
await window.generateMigration();

// Apply first pending migration
const firstPending = migrationState.pendingMigrations[0];
await applyMigration(firstPending.id);
```

---

## Recommended Test Order

1. ✅ Test 1 (Create entity) - Establishes baseline
2. ✅ Test 2 (Add column) - Tests ALTER TABLE
3. ✅ Test 4 (Add index) - Tests index creation
4. ✅ Test 10 (Auto-increment) - Tests versioning
5. ✅ Test 6 (Apply all) - Tests bulk operations
6. ✅ Test 5 (Rollback) - Tests rollback safety
7. ✅ Test 3 (Modify column) - Tests type changes
8. ✅ Test 7 (Export) - Tests export functionality
9. ✅ Test 8 (Copy) - Tests clipboard
10. ✅ Test 9 (Delete) - Tests cleanup

**Total Test Time:** ~10 minutes for full suite

---

## Success Criteria Summary

After running all tests, you should have:

- ✅ 1 entity with multiple migrations
- ✅ Migrations in all 3 states (pending, applied, rolled_back)
- ✅ Version progression visible (1.0.0 → 1.1.x)
- ✅ Downloaded .sql file
- ✅ No JavaScript errors in console
- ✅ All UI components rendered correctly
- ✅ Smooth transitions between states
- ✅ Confirmation dialogs appear appropriately
- ✅ Toast notifications show success/errors

---

## Next Steps

After testing:

1. **Review generated SQL** - Ensure it matches expectations
2. **Test on real database** - Actually execute the SQL
3. **Check rollback functionality** - Verify data restoration
4. **Performance test** - Try with entity having 50+ fields
5. **Edge cases** - Test with special characters, long names
6. **Multi-user** - Test concurrent migration generation

**Recommended:** Keep browser DevTools open during testing to catch any warnings or errors.
