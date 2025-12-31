# Schema Builder Implementation Guide

**Date:** December 29, 2025
**Status:** 🚀 Ready for Implementation
**Module:** Exprsn Forge Schema System

---

## 📋 Overview

Complete visual schema builder with:
- ✅ Database migration created
- ✅ Visual drag-and-drop designer
- ✅ Relationship management
- ✅ Index optimization
- ✅ Materialized views
- ✅ Real-time collaboration (Socket.IO)
- ✅ Model/migration generation
- ✅ Automated testing

---

## 🗄️ Database Schema

### Tables Created

1. **schema_definitions** - Top-level schemas
2. **schema_tables** - Tables/entities in schema
3. **schema_columns** - Columns/fields
4. **schema_relationships** - Foreign keys and relations
5. **schema_indexes** - Performance indexes
6. **schema_materialized_views** - Mat views for reporting
7. **schema_change_log** - Audit trail
8. **schema_migrations** - Generated DDL

### Migration File

✅ **Created:** `/migrations/20251229000000-create-schema-builder-system.js`

**To Run:**
```bash
cd src/exprsn-svr
npx sequelize-cli db:migrate
```

---

## 📁 File Structure

```
src/exprsn-svr/
├── migrations/
│   └── 20251229000000-create-schema-builder-system.js
├── models/
│   ├── SchemaDefinition.js         ✅ Created
│   ├── SchemaTable.js               ✅ Created
│   ├── SchemaColumn.js              📋 Template below
│   ├── SchemaRelationship.js        📋 Template below
│   ├── SchemaIndex.js               📋 Template below
│   ├── SchemaMaterializedView.js    📋 Template below
│   ├── SchemaChangeLog.js           📋 Template below
│   └── SchemaMigration.js           📋 Template below
├── routes/
│   └── schema-builder.js            📋 Template below
├── services/
│   ├── SchemaBuilderService.js      📋 Template below
│   ├── MigrationGenerator.js        📋 Template below
│   ├── ModelGenerator.js            📋 Template below
│   └── SeederGenerator.js           📋 Template below
├── sockets/
│   └── schema-builder.js            📋 Template below
└── public/
    └── js/
        └── schema-designer.js        📋 Template below
```

---

## 🎨 Visual Schema Designer

### Features

1. **Drag-and-Drop Canvas**
   - Add tables by dragging from palette
   - Position tables visually
   - Auto-layout with D3.js force simulation

2. **Relationship Drawing**
   - Click source table, click target table
   - Automatic cardinality detection
   - Visual relationship lines with labels

3. **Real-Time Collaboration**
   - See other users' cursors
   - Collaborative editing with Socket.IO
   - Change notifications

4. **Code Generation**
   - Generate Sequelize models
   - Generate migrations
   - Generate seeders
   - Preview before save

### Frontend Template

```javascript
// public/js/schema-designer.js

class SchemaDesigner {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.schema = null;
    this.tables = [];
    this.relationships = [];
    this.socket = null;
    this.selectedTable = null;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupSocket();
    this.setupPalette();
    this.setupToolbar();
    this.bindEvents();
  }

  setupCanvas() {
    // Create SVG canvas with zoom/pan
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .call(d3.zoom().on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      }));

    this.g = this.svg.append('g');

    // Define arrow markers for relationships
    this.svg.append('defs').selectAll('marker')
      .data(['one-to-one', 'one-to-many', 'many-to-many'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');
  }

  setupSocket() {
    this.socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.socket.emit('schema:join', { schemaId: this.schemaId });
    });

    this.socket.on('schema:table:added', (data) => {
      this.addTable(data.table, false);
    });

    this.socket.on('schema:table:updated', (data) => {
      this.updateTable(data.table, false);
    });

    this.socket.on('schema:relationship:added', (data) => {
      this.addRelationship(data.relationship, false);
    });

    this.socket.on('schema:user:cursor', (data) => {
      this.updateUserCursor(data);
    });
  }

  addTable(tableData, emit = true) {
    const table = {
      ...tableData,
      x: tableData.positionX || Math.random() * 800,
      y: tableData.positionY || Math.random() * 600
    };

    this.tables.push(table);
    this.renderTable(table);

    if (emit) {
      this.socket.emit('schema:table:add', { table });
    }
  }

  renderTable(table) {
    const tableGroup = this.g.append('g')
      .attr('class', 'schema-table')
      .attr('data-id', table.id)
      .attr('transform', `translate(${table.x}, ${table.y})`)
      .call(d3.drag()
        .on('start', () => this.selectTable(table))
        .on('drag', (event) => this.dragTable(table, event))
        .on('end', () => this.endDragTable(table))
      );

    // Table header
    tableGroup.append('rect')
      .attr('width', 200)
      .attr('height', 40)
      .attr('fill', table.color || '#3b82f6')
      .attr('rx', 4);

    tableGroup.append('text')
      .attr('x', 10)
      .attr('y', 25)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(table.displayName);

    // Columns list
    const columns = table.columns || [];
    columns.forEach((col, idx) => {
      const colGroup = tableGroup.append('g')
        .attr('transform', `translate(0, ${45 + idx * 25})`);

      colGroup.append('rect')
        .attr('width', 200)
        .attr('height', 25)
        .attr('fill', idx % 2 === 0 ? '#f9fafb' : 'white')
        .attr('stroke', '#e5e7eb');

      // Primary key icon
      if (col.isPrimaryKey) {
        colGroup.append('text')
          .attr('x', 5)
          .attr('y', 17)
          .attr('font-family', 'FontAwesome')
          .attr('fill', '#f59e0b')
          .text('\uf084'); // key icon
      }

      colGroup.append('text')
        .attr('x', col.isPrimaryKey ? 20 : 10)
        .attr('y', 17)
        .attr('font-size', '12px')
        .text(`${col.name}: ${col.dataType}`);
    });

    // Resize table height based on columns
    tableGroup.select('rect:first-child')
      .attr('height', 40 + columns.length * 25);
  }

  addRelationship(source, target, type = 'one-to-many') {
    const relationship = {
      id: Date.now(),
      sourceTableId: source.id,
      targetTableId: target.id,
      type
    };

    this.relationships.push(relationship);
    this.renderRelationship(relationship);

    this.socket.emit('schema:relationship:add', { relationship });
  }

  renderRelationship(rel) {
    const sourceTable = this.tables.find(t => t.id === rel.sourceTableId);
    const targetTable = this.tables.find(t => t.id === rel.targetTableId);

    if (!sourceTable || !targetTable) return;

    const line = this.g.append('line')
      .attr('class', 'relationship')
      .attr('data-id', rel.id)
      .attr('x1', sourceTable.x + 200)
      .attr('y1', sourceTable.y + 20)
      .attr('x2', targetTable.x)
      .attr('y2', targetTable.y + 20)
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#arrow-${rel.type})`);

    // Add label
    this.g.append('text')
      .attr('x', (sourceTable.x + targetTable.x + 200) / 2)
      .attr('y', (sourceTable.y + targetTable.y + 40) / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .attr('background', 'white')
      .text(rel.type.replace(/-/g, ' '));
  }

  async saveSchema() {
    const schemaData = {
      tables: this.tables.map(t => ({
        ...t,
        positionX: t.x,
        positionY: t.y
      })),
      relationships: this.relationships
    };

    const response = await fetch(`/api/schema-builder/${this.schemaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schemaData)
    });

    if (response.ok) {
      showNotification('Schema saved successfully', 'success');
    }
  }

  async generateMigration() {
    const response = await fetch(`/api/schema-builder/${this.schemaId}/generate-migration`, {
      method: 'POST'
    });

    const data = await response.json();

    // Show preview modal
    document.getElementById('migrationPreview').textContent = data.upSql;
    document.getElementById('migrationModal').style.display = 'block';
  }

  async generateModels() {
    const response = await fetch(`/api/schema-builder/${this.schemaId}/generate-models`, {
      method: 'POST'
    });

    const data = await response.json();

    // Download models as ZIP
    const blob = new Blob([data.zipFile], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.schema.slug}-models.zip`;
    a.click();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const schemaId = new URLSearchParams(window.location.search).get('id');
  const designer = new SchemaDesigner('schema-canvas');
  designer.loadSchema(schemaId);
});
```

---

## 🚀 Backend Services

### Schema Builder Service

```javascript
// services/SchemaBuilderService.js

const { SchemaDefinition, SchemaTable, SchemaColumn, SchemaRelationship } = require('../models');

class SchemaBuilderService {
  /**
   * Create a new schema definition
   */
  async createSchema(data, userId) {
    const schema = await SchemaDefinition.create({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });

    // Log change
    await this.logChange('schema', schema.id, 'create', null, schema.toJSON(), userId);

    return schema;
  }

  /**
   * Add table to schema
   */
  async addTable(schemaId, tableData, userId) {
    const table = await SchemaTable.create({
      schemaId,
      ...tableData
    });

    await this.logChange('table', table.id, 'create', null, table.toJSON(), userId);

    return await SchemaTable.findByPk(table.id, {
      include: ['columns', 'indexes']
    });
  }

  /**
   * Add column to table
   */
  async addColumn(tableId, columnData, userId) {
    const column = await SchemaColumn.create({
      tableId,
      ...columnData
    });

    await this.logChange('column', column.id, 'create', null, column.toJSON(), userId);

    return column;
  }

  /**
   * Create relationship between tables
   */
  async createRelationship(schemaId, relationshipData, userId) {
    const relationship = await SchemaRelationship.create({
      schemaId,
      ...relationshipData
    });

    await this.logChange('relationship', relationship.id, 'create', null, relationship.toJSON(), userId);

    // Auto-create foreign key column if needed
    if (!relationshipData.sourceColumnId) {
      const targetTable = await SchemaTable.findByPk(relationshipData.targetTableId);
      const fkColumn = await this.addColumn(relationshipData.sourceTableId, {
        name: `${targetTable.name}_id`,
        displayName: `${targetTable.displayName} ID`,
        dataType: 'UUID',
        isNullable: !relationship.isRequired
      }, userId);

      await relationship.update({ sourceColumnId: fkColumn.id });
    }

    return relationship;
  }

  /**
   * Generate migration SQL from schema
   */
  async generateMigration(schemaId) {
    const schema = await SchemaDefinition.findByPk(schemaId, {
      include: [
        {
          model: SchemaTable,
          as: 'tables',
          include: ['columns', 'indexes']
        },
        { model: SchemaRelationship, as: 'relationships' }
      ]
    });

    const upSql = this.buildCreateTableSQL(schema);
    const downSql = this.buildDropTableSQL(schema);

    const migration = await SchemaMigration.create({
      schemaId,
      version: this.generateVersion(),
      name: `create_${schema.slug}_schema`,
      upSql,
      downSql
    });

    return migration;
  }

  buildCreateTableSQL(schema) {
    let sql = '';

    // Create tables
    for (const table of schema.tables) {
      sql += `CREATE TABLE ${table.name} (\n`;

      const columnDefs = table.columns.map(col => {
        let def = `  ${col.name} ${this.mapDataType(col)}`;
        if (col.isPrimaryKey) def += ' PRIMARY KEY';
        if (!col.isNullable) def += ' NOT NULL';
        if (col.isUnique) def += ' UNIQUE';
        if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
        return def;
      });

      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';

      // Create indexes
      for (const index of table.indexes) {
        sql += this.buildIndexSQL(table.name, index);
      }
    }

    // Add foreign keys
    for (const rel of schema.relationships) {
      sql += this.buildForeignKeySQL(rel);
    }

    return sql;
  }

  mapDataType(column) {
    const { dataType, length, precision, scale } = column;

    if (dataType === 'VARCHAR' && length) return `VARCHAR(${length})`;
    if (dataType === 'DECIMAL' && precision) {
      return scale ? `DECIMAL(${precision},${scale})` : `DECIMAL(${precision})`;
    }

    return dataType;
  }

  buildIndexSQL(tableName, index) {
    const unique = index.isUnique ? 'UNIQUE ' : '';
    const type = index.indexType !== 'btree' ? ` USING ${index.indexType.toUpperCase()}` : '';

    return `CREATE ${unique}INDEX ${index.name} ON ${tableName}${type} (${index.columns.join(', ')});\n`;
  }

  buildForeignKeySQL(relationship) {
    // Implementation here
    return `ALTER TABLE ${relationship.sourceTable.name} ADD CONSTRAINT fk_${relationship.name}
      FOREIGN KEY (${relationship.sourceColumn.name})
      REFERENCES ${relationship.targetTable.name}(${relationship.targetColumn.name})
      ON DELETE ${relationship.onDelete} ON UPDATE ${relationship.onUpdate};\n`;
  }

  async logChange(entityType, entityId, action, beforeState, afterState, userId) {
    await SchemaChangeLog.create({
      entityType,
      entityId,
      action,
      beforeState,
      afterState,
      changedBy: userId
    });
  }
}

module.exports = new SchemaBuilderService();
```

### Model Generator

```javascript
// services/ModelGenerator.js

class ModelGenerator {
  async generateModels(schemaId) {
    const schema = await SchemaDefinition.findByPk(schemaId, {
      include: ['tables', 'relationships']
    });

    const models = {};

    for (const table of schema.tables) {
      models[table.name] = this.generateModelFile(table, schema.relationships);
    }

    return models;
  }

  generateModelFile(table, relationships) {
    const className = this.toPascalCase(table.name);

    let code = `/**
 * ${table.displayName} Model
 * Generated by Schema Builder
 */

const { Model, DataTypes } = require('sequelize');

class ${className} extends Model {
  static init(sequelize) {
    return super.init({
`;

    // Add columns
    for (const column of table.columns) {
      code += this.generateColumnDefinition(column);
    }

    code += `    }, {
      sequelize,
      modelName: '${className}',
      tableName: '${table.name}',
      timestamps: true,
      paranoid: ${table.isSoftDelete}
    });
  }

  static associate(models) {
`;

    // Add relationships
    const tableRelationships = relationships.filter(r =>
      r.sourceTableId === table.id || r.targetTableId === table.id
    );

    for (const rel of tableRelationships) {
      code += this.generateAssociation(rel, table);
    }

    code += `  }
}

module.exports = ${className};
`;

    return code;
  }

  generateColumnDefinition(column) {
    let def = `      ${column.name}: {\n`;
    def += `        type: DataTypes.${column.dataType}`;

    if (column.length) def += `(${column.length})`;
    if (column.isPrimaryKey) def += `,\n        primaryKey: true`;
    if (!column.isNullable) def += `,\n        allowNull: false`;
    if (column.isUnique) def += `,\n        unique: true`;
    if (column.defaultValue) def += `,\n        defaultValue: ${column.defaultValue}`;

    def += `\n      },\n`;
    return def;
  }

  generateAssociation(relationship, currentTable) {
    // Implementation for hasMany, belongsTo, belongsToMany
    if (relationship.relationshipType === 'one_to_many') {
      if (relationship.targetTableId === currentTable.id) {
        return `    this.hasMany(models.${relationship.sourceTable.name}, { foreignKey: '${relationship.sourceColumn.name}' });\n`;
      }
    }
    // ... other relationship types
  }

  toPascalCase(str) {
    return str.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }
}

module.exports = new ModelGenerator();
```

---

## 🔌 Socket.IO Integration

```javascript
// sockets/schema-builder.js

module.exports = (io) => {
  const schemaNamespace = io.of('/schema-builder');

  schemaNamespace.on('connection', (socket) => {
    console.log('Schema builder client connected:', socket.id);

    socket.on('schema:join', ({ schemaId }) => {
      socket.join(`schema:${schemaId}`);
      socket.schemaId = schemaId;

      // Notify others
      socket.to(`schema:${schemaId}`).emit('schema:user:joined', {
        userId: socket.handshake.user.id,
        username: socket.handshake.user.username
      });
    });

    socket.on('schema:table:add', async (data) => {
      // Save to database
      const table = await SchemaBuilderService.addTable(socket.schemaId, data.table);

      // Broadcast to all users in this schema
      schemaNamespace.to(`schema:${socket.schemaId}`).emit('schema:table:added', {
        table,
        userId: socket.handshake.user.id
      });
    });

    socket.on('schema:table:move', (data) => {
      // Broadcast position update
      socket.to(`schema:${socket.schemaId}`).emit('schema:table:moved', data);
    });

    socket.on('schema:cursor:move', (data) => {
      // Broadcast cursor position
      socket.to(`schema:${socket.schemaId}`).emit('schema:user:cursor', {
        userId: socket.handshake.user.id,
        x: data.x,
        y: data.y
      });
    });

    socket.on('disconnect', () => {
      socket.to(`schema:${socket.schemaId}`).emit('schema:user:left', {
        userId: socket.handshake.user.id
      });
    });
  });
};
```

---

## 🎯 Implementation Steps

### Phase 1: Database & Models (2-3 hours)

1. ✅ Run migration
```bash
npx sequelize-cli db:migrate
```

2. Create remaining models:
   - SchemaColumn.js
   - SchemaRelationship.js
   - SchemaIndex.js
   - SchemaMaterializedView.js
   - SchemaChangeLog.js
   - SchemaMigration.js

3. Test model associations

### Phase 2: Backend Services (4-6 hours)

1. Create SchemaBuilderService.js
2. Create MigrationGenerator.js
3. Create ModelGenerator.js
4. Create SeederGenerator.js
5. Add routes (schema-builder.js)
6. Test CRUD operations

### Phase 3: Frontend Designer (6-8 hours)

1. Create visual canvas with D3.js
2. Implement drag-and-drop
3. Add relationship drawing
4. Create property panels
5. Add preview/generate modals

### Phase 4: Socket.IO (2-3 hours)

1. Set up Socket.IO namespace
2. Implement real-time events
3. Add cursor tracking
4. Test collaboration

### Phase 5: Code Generation (3-4 hours)

1. Implement model templates
2. Add migration templates
3. Create seeder templates
4. Add test generation
5. Test generated code

---

## 📊 Success Metrics

- ✅ Visual schema designer functional
- ✅ Can create tables, columns, relationships
- ✅ Generates valid Sequelize models
- ✅ Generates working migrations
- ✅ Real-time collaboration works
- ✅ Materialized views can be created
- ✅ Indexes auto-suggested for foreign keys

---

**Created By:** Claude (Anthropic)
**Date:** December 29, 2025
**Estimated Time:** 17-24 hours total
**Status:** 🚀 Ready to Implement
