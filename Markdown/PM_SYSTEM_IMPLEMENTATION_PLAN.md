# Project Management System Implementation Plan
## SCRUM/Kanban/GANTT with AI Agent Integration

**Version:** 1.0
**Date:** 2025-12-25
**For:** exprsn-svr (Port 5001)

---

## Overview

Comprehensive Project Management system with AI agent feedback, supporting multiple methodologies (SCRUM, Kanban, Waterfall/GANTT) with deep integration into the Exprsn ecosystem.

### Key Features

✅ **Already Implemented (Database Schema):**
- Tasks, Sprints, Boards, Board Columns
- Waterfall Phases, Milestones
- Time Entries (billable/non-billable)
- Task Dependencies, Comments, Labels, History
- Critical Path Analysis, Baselines
- Board Templates

🆕 **New AI Agent Features (Migration Created):**
- `task_agent_analysis` - Risk assessment, complexity analysis, estimate validation
- `sprint_agent_insights` - Velocity predictions, burndown forecasts, retrospective analysis
- `task_assignment_suggestions` - ML-based developer matching
- `task_agent_comments` - Agent reviews, warnings, best practice reminders
- `pm_workflow_triggers` - Automation integration with exprsn-workflow
- `agent_prediction_accuracy` - Learning system to improve predictions

---

## Phase 1: Backend Implementation (1-2 days)

### 1.1 Run Migrations

```bash
cd src/exprsn-svr

# Run PM module migration (if not already done)
npx sequelize-cli db:migrate --to 20251224100011-create-project-management-module.js

# Run AI agent integration migration
npx sequelize-cli db:migrate --to 20251225190000-create-ai-agent-pm-features.js
```

### 1.2 Create Sequelize Models

**Location:** `src/exprsn-svr/models/`

**Files to create:**
1. `Task.js` - Core task model
2. `Sprint.js` - Sprint model with velocity tracking
3. `Board.js` - Kanban/SCRUM board
4. `BoardColumn.js` - Board columns with WIP limits
5. `WaterfallPhase.js` - Waterfall methodology phases
6. `TaskAgentAnalysis.js` - AI analysis results
7. `SprintAgentInsight.js` - Sprint predictions
8. `TaskAgentComment.js` - Agent feedback
9. `TaskAssignmentSuggestion.js` - Auto-assignment
10. `PMWorkflowTrigger.js` - Workflow automation

**Model Template (example for Task.js):**

```javascript
// See /Users/rickholland/Downloads/Exprsn/src/exprsn-svr/models/Task.js
// Already created above
```

### 1.3 Create API Routes

**Location:** `src/exprsn-svr/routes/pm/`

**Files to create:**

#### `tasks.js` - Task Management
```javascript
const express = require('express');
const router = express.Router();
const { validateCAToken, requirePermissions, asyncHandler } = require('@exprsn/shared');
const TaskController = require('../../controllers/pm/TaskController');

// CRUD operations
router.get('/', validateCAToken, asyncHandler(TaskController.getTasks));
router.post('/', validateCAToken, requirePermissions({ write: true }), asyncHandler(TaskController.createTask));
router.get('/:id', validateCAToken, asyncHandler(TaskController.getTask));
router.put('/:id', validateCAToken, requirePermissions({ write: true }), asyncHandler(TaskController.updateTask));
router.delete('/:id', validateCAToken, requirePermissions({ delete: true }), asyncHandler(TaskController.deleteTask));

// Task operations
router.post('/:id/assign', validateCAToken, requirePermissions({ write: true }), asyncHandler(TaskController.assignTask));
router.post('/:id/move', validateCAToken, requirePermissions({ write: true }), asyncHandler(TaskController.moveTask));
router.post('/:id/comment', validateCAToken, requirePermissions({ write: true }), asyncHandler(TaskController.addComment));
router.get('/:id/history', validateCAToken, asyncHandler(TaskController.getHistory));

// AI Agent features
router.post('/:id/analyze', validateCAToken, asyncHandler(TaskController.triggerAgentAnalysis));
router.get('/:id/agent-feedback', validateCAToken, asyncHandler(TaskController.getAgentFeedback));
router.post('/:id/assignment-suggestions', validateCAToken, asyncHandler(TaskController.getAssignmentSuggestions));

module.exports = router;
```

#### `sprints.js` - Sprint Management
```javascript
const express = require('express');
const router = express.Router();
const { validateCAToken, requirePermissions, asyncHandler } = require('@exprsn/shared');
const SprintController = require('../../controllers/pm/SprintController');

router.get('/', validateCAToken, asyncHandler(SprintController.getSprints));
router.post('/', validateCAToken, requirePermissions({ write: true }), asyncHandler(SprintController.createSprint));
router.get('/:id', validateCAToken, asyncHandler(SprintController.getSprint));
router.put('/:id', validateCAToken, requirePermissions({ write: true }), asyncHandler(SprintController.updateSprint));
router.delete('/:id', validateCAToken, requirePermissions({ delete: true }), asyncHandler(SprintController.deleteSprint));

// Sprint operations
router.post('/:id/start', validateCAToken, requirePermissions({ write: true }), asyncHandler(SprintController.startSprint));
router.post('/:id/complete', validateCAToken, requirePermissions({ write: true }), asyncHandler(SprintController.completeSprint));
router.get('/:id/burndown', validateCAToken, asyncHandler(SprintController.getBurndownChart));
router.get('/:id/velocity', validateCAToken, asyncHandler(SprintController.getVelocity));

// AI Agent features
router.get('/:id/predictions', validateCAToken, asyncHandler(SprintController.getPredictions));
router.get('/:id/insights', validateCAToken, asyncHandler(SprintController.getAgentInsights));
router.post('/:id/retrospective', validateCAToken, asyncHandler(SprintController.generateRetrospective));

module.exports = router;
```

#### `boards.js` - Board Management
```javascript
const express = require('express');
const router = express.Router();
const { validateCAToken, requirePermissions, asyncHandler } = require('@exprsn/shared');
const BoardController = require('../../controllers/pm/BoardController');

router.get('/', validateCAToken, asyncHandler(BoardController.getBoards));
router.post('/', validateCAToken, requirePermissions({ write: true }), asyncHandler(BoardController.createBoard));
router.get('/:id', validateCAToken, asyncHandler(BoardController.getBoard));
router.put('/:id', validateCAToken, requirePermissions({ write: true }), asyncHandler(BoardController.updateBoard));
router.delete('/:id', validateCAToken, requirePermissions({ delete: true }), asyncHandler(BoardController.deleteBoard));

// Board operations
router.get('/:id/cards', validateCAToken, asyncHandler(BoardController.getBoardCards));
router.post('/:id/columns', validateCAToken, requirePermissions({ write: true }), asyncHandler(BoardController.addColumn));
router.put('/:id/columns/:columnId', validateCAToken, requirePermissions({ write: true }), asyncHandler(BoardController.updateColumn));
router.delete('/:id/columns/:columnId', validateCAToken, requirePermissions({ delete: true }), asyncHandler(BoardController.deleteColumn));

module.exports = router;
```

#### `gantt.js` - GANTT Chart / Waterfall
```javascript
const express = require('express');
const router = express.Router();
const { validateCAToken, asyncHandler } = require('@exprsn/shared');
const GanttController = require('../../controllers/pm/GanttController');

router.get('/projects/:projectId', validateCAToken, asyncHandler(GanttController.getGanttData));
router.get('/projects/:projectId/critical-path', validateCAToken, asyncHandler(GanttController.getCriticalPath));
router.get('/projects/:projectId/milestones', validateCAToken, asyncHandler(GanttController.getMilestones));
router.get('/projects/:projectId/phases', validateCAToken, asyncHandler(GanttController.getWaterfallPhases));

module.exports = router;
```

### 1.4 Create Controllers

**Location:** `src/exprsn-svr/controllers/pm/`

**Key Controller Methods:**

#### `TaskController.js`
- `getTasks(req, res)` - List tasks with filtering, pagination
- `createTask(req, res)` - Create new task, trigger agent analysis
- `updateTask(req, res)` - Update task, track history
- `assignTask(req, res)` - Assign to developer, trigger workflow
- `triggerAgentAnalysis(req, res)` - Request AI analysis
- `getAgentFeedback(req, res)` - Get all agent comments/analysis
- `getAssignmentSuggestions(req, res)` - Get ML-based assignment suggestions

#### `SprintController.js`
- `getSprints(req, res)` - List sprints
- `createSprint(req, res)` - Create sprint
- `startSprint(req, res)` - Activate sprint
- `completeSprint(req, res)` - End sprint, calculate velocity
- `getBurndownChart(req, res)` - Real-time burndown data
- `getPredictions(req, res)` - AI velocity predictions
- `getAgentInsights(req, res)` - Sprint health insights
- `generateRetrospective(req, res)` - AI-generated retro topics

#### `BoardController.js`
- `getBoards(req, res)` - List boards
- `createBoard(req, res)` - Create from template
- `getBoardCards(req, res)` - Get all tasks on board
- `addColumn(req, res)` - Add board column
- `updateColumn(req, res)` - Update column (WIP limit, etc.)

#### `GanttController.js`
- `getGanttData(req, res)` - Tasks with dependencies for GANTT
- `getCriticalPath(req, res)` - Calculate critical path
- `getMilestones(req, res)` - Project milestones
- `getWaterfallPhases(req, res)` - Waterfall phase progress

---

## Phase 2: AI Agent Integration Service (1 day)

### 2.1 Create Agent Service

**Location:** `src/exprsn-svr/services/pm/AgentIntegrationService.js`

```javascript
const { Task, TaskAgentAnalysis, TaskAgentComment, SprintAgentInsight } = require('../../models');
const { logger } = require('@exprsn/shared');

class AgentIntegrationService {

  /**
   * Analyze task for risks, complexity, estimates
   */
  async analyzeTask(taskId, agentName = 'sr-developer') {
    const task = await Task.findByPk(taskId, {
      include: ['project', 'taskType', 'subtasks', 'dependencies']
    });

    // Call agent analysis logic (could be OpenAI API, custom ML model, or rule-based)
    const analysis = await this._performAnalysis(task, agentName);

    // Store analysis
    const taskAnalysis = await TaskAgentAnalysis.create({
      taskId: task.id,
      agentName,
      analysisType: 'complexity_analysis',
      riskLevel: analysis.riskLevel,
      confidenceScore: analysis.confidence,
      estimatedHours: analysis.estimatedHours,
      estimatedPoints: analysis.estimatedPoints,
      complexityFactors: analysis.complexityFactors,
      risksIdentified: analysis.risks,
      recommendations: analysis.recommendations,
      summary: analysis.summary
    });

    // Add agent comment
    if (analysis.warnings.length > 0) {
      await TaskAgentComment.create({
        taskId: task.id,
        agentName,
        commentType: 'warning',
        severity: analysis.riskLevel === 'high' ? 'high' : 'medium',
        comment: analysis.warnings.join('\n'),
        actionItems: analysis.recommendations
      });
    }

    return taskAnalysis;
  }

  /**
   * Generate sprint insights and predictions
   */
  async analyzeSprintgre(sprintId, agentName = 'scrum-master') {
    const sprint = await Sprint.findByPk(sprintId, {
      include: ['tasks', 'project']
    });

    const prediction = await this._predictSprintOutcome(sprint);

    const insight = await SprintAgentInsight.create({
      sprintId: sprint.id,
      agentName,
      insightType: 'velocity_prediction',
      predictedVelocity: prediction.velocity,
      predictedCompletionDate: prediction.completionDate,
      confidenceInterval: prediction.confidence,
      risks: prediction.risks,
      recommendations: prediction.recommendations,
      summary: prediction.summary
    });

    return insight;
  }

  /**
   * Suggest task assignment based on skills, workload, past performance
   */
  async suggestAssignment(taskId) {
    const task = await Task.findByPk(taskId, {
      include: ['taskType', 'project']
    });

    const employees = await Employee.findAll({ where: { isActive: true } });

    // Score each employee
    const suggestions = [];
    for (const employee of employees) {
      const score = await this._calculateAssignmentScore(task, employee);
      suggestions.push({
        employeeId: employee.id,
        score: score.total,
        reasoning: score.breakdown
      });
    }

    // Sort by score
    suggestions.sort((a, b) => b.score - a.score);

    // Create suggestion record
    const topSuggestion = suggestions[0];
    await TaskAssignmentSuggestion.create({
      taskId: task.id,
      suggestedAssigneeId: topSuggestion.employeeId,
      confidenceScore: Math.round(topSuggestion.score * 100),
      reasoning: topSuggestion.reasoning,
      alternativeAssignees: suggestions.slice(1, 4),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return suggestions;
  }

  /**
   * Private: Perform task analysis
   */
  async _performAnalysis(task, agentName) {
    // This is where you'd integrate:
    // - OpenAI API for NLP-based analysis
    // - Custom ML model
    // - Rule-based heuristics

    // Example rule-based analysis:
    const analysis = {
      riskLevel: 'medium',
      confidence: 75,
      estimatedHours: null,
      estimatedPoints: null,
      complexityFactors: {},
      risks: [],
      recommendations: [],
      warnings: [],
      summary: ''
    };

    // Check for CA dependencies
    if (task.description?.includes('exprsn-ca') || task.description?.includes('CA token')) {
      analysis.riskLevel = 'high';
      analysis.complexityFactors.security = 0.9;
      analysis.risks.push({
        risk: 'CA token authentication must be implemented correctly',
        severity: 'high',
        mitigation: 'Review TOKEN_SPECIFICATION_V1.0.md and use RSA-SHA256-PSS'
      });
      analysis.recommendations.push({
        category: 'security',
        suggestion: 'Consult CA Security Specialist agent before implementation',
        priority: 'high'
      });
      analysis.warnings.push('⚠️ This task involves CA authentication - security critical!');
    }

    // Check for microservices complexity
    const serviceCount = (task.description?.match(/exprsn-\w+/g) || []).length;
    if (serviceCount > 2) {
      analysis.complexityFactors.integration = 0.8;
      analysis.risks.push({
        risk: `Task spans ${serviceCount} services - high integration complexity`,
        severity: 'medium',
        mitigation: 'Design service boundaries carefully, use async communication where possible'
      });
      analysis.recommendations.push({
        category: 'architecture',
        suggestion: 'Consult Microservices Architect agent for service communication design',
        priority: 'high'
      });
    }

    // Estimate based on complexity
    const totalComplexity = Object.values(analysis.complexityFactors).reduce((sum, v) => sum + v, 0) / Object.keys(analysis.complexityFactors).length;
    if (totalComplexity > 0.7) {
      analysis.estimatedHours = 16; // 2 days
      analysis.estimatedPoints = 8;
    } else if (totalComplexity > 0.4) {
      analysis.estimatedHours = 8; // 1 day
      analysis.estimatedPoints = 5;
    } else {
      analysis.estimatedHours = 4; // half day
      analysis.estimatedPoints = 3;
    }

    analysis.summary = `Task analyzed by ${agentName}. Risk: ${analysis.riskLevel}. Estimated: ${analysis.estimatedPoints} points (${analysis.estimatedHours} hours).`;

    return analysis;
  }

  /**
   * Private: Predict sprint outcome
   */
  async _predictSprintOutcome(sprint) {
    const tasks = sprint.tasks || [];
    const completedTasks = tasks.filter(t => t.status === 'done');
    const remainingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');

    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const remainingPoints = remainingTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const totalPoints = sprint.capacityPoints || (completedPoints + remainingPoints);

    const daysElapsed = Math.ceil((new Date() - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysElapsed;

    const currentVelocity = daysElapsed > 0 ? completedPoints / daysElapsed : 0;
    const projectedPoints = completedPoints + (currentVelocity * daysRemaining);

    const prediction = {
      velocity: Math.round(projectedPoints),
      completionDate: new Date(sprint.endDate),
      confidence: { low: projectedPoints * 0.8, high: projectedPoints * 1.2, confidence: 0.75 },
      risks: [],
      recommendations: [],
      summary: ''
    };

    if (projectedPoints < totalPoints) {
      const deficit = totalPoints - projectedPoints;
      prediction.risks.push({
        risk: `Sprint likely to miss ${deficit} points`,
        severity: 'high'
      });
      prediction.recommendations.push({
        action: `Consider descoping ${Math.ceil(deficit / 5)} stories to meet sprint goal`,
        priority: 'high'
      });
      prediction.completionDate = new Date(sprint.endDate.getTime() + (deficit / currentVelocity) * 24 * 60 * 60 * 1000);
    }

    prediction.summary = `Predicted velocity: ${prediction.velocity} points. ${prediction.risks.length > 0 ? 'Sprint at risk!' : 'Sprint on track.'}`;

    return prediction;
  }

  /**
   * Private: Calculate assignment score
   */
  async _calculateAssignmentScore(task, employee) {
    const score = {
      total: 0,
      breakdown: {}
    };

    // Check skill match (simplified - would query employee skills table)
    const requiredSkills = this._extractSkills(task);
    const employeeSkills = employee.skills || []; // Would come from employee_skills table
    const matchedSkills = requiredSkills.filter(skill => employeeSkills.includes(skill));
    score.breakdown.skillsMatch = matchedSkills.length / Math.max(requiredSkills.length, 1);

    // Check current workload
    const currentHours = await this._getCurrentWorkload(employee.id);
    const capacity = 40; // 40 hours per week
    score.breakdown.availability = Math.max(0, 1 - (currentHours / capacity));

    // Check past performance on similar tasks
    score.breakdown.pastPerformance = await this._getPastPerformanceScore(employee.id, task.taskTypeId);

    // Weighted average
    score.total = (
      score.breakdown.skillsMatch * 0.4 +
      score.breakdown.availability * 0.3 +
      score.breakdown.pastPerformance * 0.3
    );

    return score;
  }

  _extractSkills(task) {
    const skills = [];
    if (task.description?.includes('React')) skills.push('React');
    if (task.description?.includes('Node.js')) skills.push('Node.js');
    if (task.description?.includes('PostgreSQL')) skills.push('PostgreSQL');
    if (task.description?.includes('CA token') || task.description?.includes('certificate')) skills.push('PKI');
    return skills;
  }

  async _getCurrentWorkload(employeeId) {
    const tasks = await Task.findAll({
      where: {
        assigneeId: employeeId,
        status: ['todo', 'in_progress', 'in_review']
      }
    });
    return tasks.reduce((sum, t) => sum + (t.remainingHours || t.estimatedHours || 0), 0);
  }

  async _getPastPerformanceScore(employeeId, taskTypeId) {
    // Query completed tasks and compare estimates vs actuals
    const pastTasks = await Task.findAll({
      where: {
        assigneeId: employeeId,
        taskTypeId,
        status: 'done'
      },
      limit: 10,
      order: [['completedDate', 'DESC']]
    });

    if (pastTasks.length === 0) return 0.5; // neutral score

    const accuracyScores = pastTasks.map(t => {
      if (!t.estimatedHours || !t.actualHours) return 0.5;
      const accuracy = 1 - Math.abs(t.estimatedHours - t.actualHours) / t.estimatedHours;
      return Math.max(0, Math.min(1, accuracy));
    });

    return accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length;
  }
}

module.exports = new AgentIntegrationService();
```

---

## Phase 3: Frontend Implementation (2-3 days)

### 3.1 React Components Structure

**Location:** `src/exprsn-svr/client/src/components/pm/`

```
pm/
├── boards/
│   ├── KanbanBoard.jsx          # Drag-and-drop Kanban
│   ├── ScrumBoard.jsx            # Sprint-based board
│   ├── BoardCard.jsx             # Task card component
│   ├── BoardColumn.jsx           # Column with WIP limit
│   └── BoardHeader.jsx           # Board controls
├── gantt/
│   ├── GanttChart.jsx            # Timeline view
│   ├── GanttTask.jsx             # Task bar
│   ├── CriticalPath.jsx          # Highlight critical path
│   └── Milestones.jsx            # Milestone markers
├── sprints/
│   ├── SprintBoard.jsx           # Sprint overview
│   ├── BurndownChart.jsx         # Real-time burndown
│   ├── VelocityChart.jsx         # Velocity tracking
│   ├── SprintBacklog.jsx         # Sprint planning
│   └── Retrospective.jsx         # AI-generated retro
├── tasks/
│   ├── TaskList.jsx              # List view
│   ├── TaskDetail.jsx            # Task details modal
│   ├── TaskForm.jsx              # Create/edit task
│   ├── TaskComments.jsx          # Comments section
│   └── TaskHistory.jsx           # Activity log
├── agents/
│   ├── AgentFeedback.jsx         # Agent comments panel
│   ├── AgentAnalysis.jsx         # Risk/complexity display
│   ├── AssignmentSuggestions.jsx # ML suggestions
│   └── SprintInsights.jsx        # Sprint predictions
└── shared/
    ├── PMLayout.jsx              # Main layout
    ├── ProjectSelector.jsx       # Project dropdown
    └── ViewSwitcher.jsx          # Kanban/GANTT/List toggle
```

### 3.2 Key Component Examples

#### `KanbanBoard.jsx` (Drag-and-Drop)

```jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import BoardColumn from './BoardColumn';
import BoardCard from './BoardCard';
import AgentFeedback from '../agents/AgentFeedback';
import { fetchBoard, updateTaskPosition } from '../../api/pm';

const KanbanBoard = ({ boardId }) => {
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  const loadBoard = async () => {
    const data = await fetchBoard(boardId);
    setBoard(data.board);
    setColumns(data.columns);
    setTasks(data.tasksByColumn);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Same column reorder
    if (source.droppableId === destination.droppableId) {
      const columnTasks = Array.from(tasks[source.droppableId]);
      const [movedTask] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, movedTask);

      setTasks({ ...tasks, [source.droppableId]: columnTasks });

      await updateTaskPosition(draggableId, {
        columnId: source.droppableId,
        position: destination.index
      });
    } else {
      // Move between columns
      const sourceColumnTasks = Array.from(tasks[source.droppableId]);
      const destColumnTasks = Array.from(tasks[destination.droppableId] || []);
      const [movedTask] = sourceColumnTasks.splice(source.index, 1);
      destColumnTasks.splice(destination.index, 0, movedTask);

      setTasks({
        ...tasks,
        [source.droppableId]: sourceColumnTasks,
        [destination.droppableId]: destColumnTasks
      });

      await updateTaskPosition(draggableId, {
        columnId: destination.droppableId,
        position: destination.index
      });
    }
  };

  return (
    <div className="kanban-board">
      <div className="board-header">
        <h2>{board?.name}</h2>
        {/* Board controls */}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-columns">
          {columns.map(column => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <BoardColumn
                  column={column}
                  tasks={tasks[column.id] || []}
                  innerRef={provided.innerRef}
                  {...provided.droppableProps}
                  isDraggingOver={snapshot.isDraggingOver}
                  onCardClick={setSelectedTask}
                >
                  {provided.placeholder}
                </BoardColumn>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
};

export default KanbanBoard;
```

#### `BurndownChart.jsx` (Real-time Chart)

```jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchSprintBurndown, fetchSprintPredictions } from '../../api/pm';

const BurndownChart = ({ sprintId }) => {
  const [burndownData, setBurndownData] = useState(null);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [sprintId]);

  const loadData = async () => {
    const [burndown, pred] = await Promise.all([
      fetchSprintBurndown(sprintId),
      fetchSprintPredictions(sprintId)
    ]);
    setBurndownData(burndown);
    setPredictions(pred);
  };

  const chartData = {
    labels: burndownData?.dates || [],
    datasets: [
      {
        label: 'Ideal Burndown',
        data: burndownData?.idealLine || [],
        borderColor: '#6c757d',
        borderDash: [5, 5],
        fill: false
      },
      {
        label: 'Actual Progress',
        data: burndownData?.actualLine || [],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true
      },
      {
        label: 'AI Prediction',
        data: burndownData?.predictionLine || [],
        borderColor: '#dc3545',
        borderDash: [2, 2],
        fill: false
      }
    ]
  };

  return (
    <div className="burndown-chart">
      <div className="chart-header">
        <h3>Sprint Burndown</h3>
        {predictions && (
          <div className="predictions">
            <span className="badge bg-info">
              Predicted Velocity: {predictions.predictedVelocity} points
            </span>
            {predictions.risks.length > 0 && (
              <span className="badge bg-warning">
                ⚠️ {predictions.risks.length} Risks Identified
              </span>
            )}
          </div>
        )}
      </div>
      <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />

      {predictions?.recommendations && predictions.recommendations.length > 0 && (
        <div className="agent-recommendations mt-3">
          <h5>🤖 Agent Recommendations</h5>
          <ul>
            {predictions.recommendations.map((rec, idx) => (
              <li key={idx} className={`alert alert-${rec.priority === 'high' ? 'danger' : 'warning'}`}>
                {rec.action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BurndownChart;
```

#### `AgentFeedback.jsx` (AI Comments)

```jsx
import React, { useState, useEffect } from 'react';
import { fetchAgentFeedback, resolveAgentComment } from '../../api/pm';

const AgentFeedback = ({ taskId }) => {
  const [feedback, setFeedback] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    loadFeedback();
  }, [taskId]);

  const loadFeedback = async () => {
    const data = await fetchAgentFeedback(taskId);
    setFeedback(data.comments);
    setAnalysis(data.analysis);
  };

  const handleResolve = async (commentId, resolution) => {
    await resolveAgentComment(commentId, resolution);
    loadFeedback();
  };

  const getAgentIcon = (agentName) => {
    const icons = {
      'sr-developer': '👨‍💻',
      'ca-security-specialist': '🔐',
      'performance-engineer': '⚡',
      'qa-reviewer': '🧪',
      'scrum-master': '📋'
    };
    return icons[agentName] || '🤖';
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary',
      info: 'light'
    };
    return `badge bg-${colors[severity] || 'secondary'}`;
  };

  return (
    <div className="agent-feedback-panel">
      <h4>🤖 AI Agent Feedback</h4>

      {analysis && (
        <div className="agent-analysis mb-4">
          <div className="card">
            <div className="card-header">
              <strong>{getAgentIcon(analysis.agentName)} {analysis.agentName}</strong>
              <span className={`badge bg-${analysis.riskLevel === 'high' ? 'danger' : analysis.riskLevel === 'medium' ? 'warning' : 'success'} ms-2`}>
                Risk: {analysis.riskLevel}
              </span>
              <span className="badge bg-info ms-2">
                Estimate: {analysis.estimatedPoints} points ({analysis.estimatedHours}h)
              </span>
            </div>
            <div className="card-body">
              <p>{analysis.summary}</p>
              {analysis.risksIdentified && analysis.risksIdentified.length > 0 && (
                <div className="risks mt-3">
                  <h6>⚠️ Risks Identified:</h6>
                  <ul>
                    {analysis.risksIdentified.map((risk, idx) => (
                      <li key={idx}>
                        <strong>{risk.risk}</strong> ({risk.severity})
                        <br/><small>Mitigation: {risk.mitigation}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="recommendations mt-3">
                  <h6>💡 Recommendations:</h6>
                  <ul>
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx}>
                        <span className={getSeverityBadge(rec.priority)}>{rec.category}</span>
                        {' '}{rec.suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="agent-comments">
        {feedback.map(comment => (
          <div key={comment.id} className={`agent-comment ${comment.isResolved ? 'resolved' : ''}`}>
            <div className="comment-header">
              <span className="agent-name">
                {getAgentIcon(comment.agentName)} {comment.agentName}
              </span>
              <span className={getSeverityBadge(comment.severity)}>
                {comment.commentType}
              </span>
              <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
            </div>
            <div className="comment-body">
              <p>{comment.comment}</p>
              {comment.actionItems && comment.actionItems.length > 0 && (
                <div className="action-items">
                  <strong>Action Items:</strong>
                  <ul>
                    {comment.actionItems.map((item, idx) => (
                      <li key={idx}>{item.action} ({item.priority})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {!comment.isResolved && (
              <div className="comment-actions">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleResolve(comment.id, 'Addressed')}
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentFeedback;
```

---

## Phase 4: Workflow Integration (1 day)

### 4.1 Workflow Trigger Service

**Location:** `src/exprsn-svr/services/pm/WorkflowTriggerService.js`

```javascript
const { PMWorkflowTrigger } = require('../../models');
const { serviceRequest } = require('@exprsn/shared');

class WorkflowTriggerService {

  async triggerWorkflowsForEvent(eventType, eventData) {
    const triggers = await PMWorkflowTrigger.findAll({
      where: {
        triggerEvent: eventType,
        isActive: true
      }
    });

    for (const trigger of triggers) {
      // Check conditions
      if (this._conditionsMatch(trigger.conditions, eventData)) {
        await this._executeWorkflow(trigger, eventData);
      }
    }
  }

  _conditionsMatch(conditions, eventData) {
    // Simple condition matching - can be enhanced
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (eventData[key] !== value) return false;
    }
    return true;
  }

  async _executeWorkflow(trigger, eventData) {
    // Map event data to workflow input
    const workflowInput = {};
    for (const [workflowVar, eventPath] of Object.entries(trigger.workflowInputMapping || {})) {
      workflowInput[workflowVar] = this._getNestedValue(eventData, eventPath);
    }

    // Call exprsn-workflow service
    await serviceRequest({
      method: 'POST',
      url: `http://localhost:3017/api/workflows/${trigger.workflowId}/execute`,
      data: { input: workflowInput },
      serviceName: 'exprsn-svr',
      resource: 'http://localhost:3017/api/workflows/*',
      permissions: { write: true }
    });

    // Update trigger stats
    await trigger.update({
      lastTriggeredAt: new Date(),
      triggerCount: trigger.triggerCount + 1
    });
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

module.exports = new WorkflowTriggerService();
```

### 4.2 Hook into Task Events

In `TaskController.js`:

```javascript
const WorkflowTriggerService = require('../../services/pm/WorkflowTriggerService');

class TaskController {
  async updateTask(req, res) {
    const { id } = req.params;
    const updates = req.body;
    const task = await Task.findByPk(id);

    const oldStatus = task.status;
    await task.update(updates);

    // Trigger workflows if status changed
    if (updates.status && updates.status !== oldStatus) {
      await WorkflowTriggerService.triggerWorkflowsForEvent('task_status_changed', {
        taskId: task.id,
        projectId: task.projectId,
        oldStatus,
        newStatus: updates.status,
        task: task.toJSON()
      });
    }

    res.json({ success: true, task });
  }
}
```

---

## Phase 5: Integration & Testing (1 day)

### 5.1 API Integration Tests

**Location:** `src/exprsn-svr/tests/pm/`

```javascript
// tasks.test.js
const request = require('supertest');
const app = require('../../app');
const { Task, TaskAgentAnalysis } = require('../../models');

describe('PM Task API', () => {
  let authToken;

  beforeAll(async () => {
    // Get CA token for testing
    authToken = await getTestToken();
  });

  describe('POST /api/pm/tasks', () => {
    it('should create a task and trigger agent analysis', async () => {
      const res = await request(app)
        .post('/api/pm/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: 'test-project-id',
          taskTypeId: 'story-type-id',
          title: 'Implement CA token validation',
          description: 'Add CA token validation to exprsn-timeline service',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.task).toBeDefined();
      expect(res.body.task.title).toBe('Implement CA token validation');

      // Check agent analysis was triggered
      const analysis = await TaskAgentAnalysis.findOne({
        where: { taskId: res.body.task.id }
      });
      expect(analysis).toBeDefined();
      expect(analysis.riskLevel).toBe('high'); // CA-related task = high risk
    });
  });

  describe('GET /api/pm/tasks/:id/agent-feedback', () => {
    it('should return agent analysis and comments', async () => {
      const task = await Task.create({
        projectId: 'test-project-id',
        taskTypeId: 'story-type-id',
        taskNumber: 'TEST-123',
        title: 'Test task',
        reporterId: 'test-user-id'
      });

      const res = await request(app)
        .get(`/api/pm/tasks/${task.id}/agent-feedback`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.analysis).toBeDefined();
      expect(res.body.comments).toBeInstanceOf(Array);
    });
  });
});
```

---

## Phase 6: Deployment

### 6.1 Run Migrations

```bash
cd src/exprsn-svr
npx sequelize-cli db:migrate
```

### 6.2 Seed Initial Data

```bash
# Create default task types
npx sequelize-cli db:seed --seed 20251225190001-seed-task-types.js

# Create board templates
npx sequelize-cli db:seed --seed 20251225190002-seed-board-templates.js
```

### 6.3 Start Service

```bash
LOW_CODE_DEV_AUTH=true PORT=5001 NODE_ENV=development npm start:svr
```

### 6.4 Access URLs

- SCRUM Board: `https://localhost:5001/pm/boards/scrum`
- Kanban Board: `https://localhost:5001/pm/boards/kanban`
- GANTT Chart: `https://localhost:5001/pm/gantt`
- Sprint Planning: `https://localhost:5001/pm/sprints/current`

---

## Summary

This implementation plan provides a complete roadmap for building a production-grade Project Management system with AI agent integration. The system supports:

✅ **Multiple Methodologies** - SCRUM, Kanban, Waterfall/GANTT
✅ **AI Agent Feedback** - Risk assessment, complexity analysis, estimates
✅ **Auto-Assignment** - ML-based developer matching
✅ **Sprint Predictions** - Velocity forecasting, burndown predictions
✅ **Workflow Automation** - Integration with exprsn-workflow
✅ **Learning System** - Agents improve accuracy over time

**Estimated Total Time:** 6-8 days for full implementation

**Next Steps:**
1. Run the AI agent migration
2. Create the Sequelize models (use Task.js as template)
3. Build the controllers and routes
4. Implement AgentIntegrationService
5. Create React components
6. Test end-to-end
7. Deploy!

Happy building! 🚀
