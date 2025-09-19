# /cook Command System

A sophisticated orchestration system for managing sub-agent teams in your AI Advisor App project.

## 🚀 Quick Start

```bash
# Basic usage
/cook architecture "Design Advisor Analytics Dashboard"

# With options
/cook implementation "Fix chat performance" --priority high --parallel

# Get help
/cook --help

# List templates
/cook --list
```

## 📋 Available Commands

### Project Types
- `architecture` - Architectural analysis and design
- `implementation` - Feature implementation and bug fixes
- `testing` - Test planning and quality assurance
- `documentation` - Documentation generation
- `optimization` - Performance and accessibility improvements
- `custom` - Custom workflow

### Options
- `--team [full|mini|custom]` - Team size configuration
- `--priority [high|medium|low]` - Task priority
- `--output [summary|detailed|executive]` - Output format
- `--parallel` - Enable parallel execution
- `--agents [list]` - Specify agents to use
- `--template [name]` - Use custom template
- `--quick` - Quick analysis mode
- `--deep` - Deep dive analysis

## 🏗️ Architecture

### Core Components

1. **Command Parser** (`command-parser.ts`)
   - Parses /cook commands
   - Validates options and syntax
   - Generates structured command objects

2. **Template Manager** (`templates.ts`)
   - Predefined workflow templates
   - Execution plan generation
   - Template validation and management

3. **Team Coordinator** (`team-coordinator.ts`)
   - Orchestrates sub-agent execution
   - Manages agent dependencies
   - Handles parallel execution

4. **Progress Tracker** (`progress-tracker.ts`)
   - Real-time progress monitoring
   - Performance metrics
   - Progress reporting

### Agent Team

- **Architect/Researcher** - High-level planning and architecture
- **Backend Master** - Convex and API route specialist
- **UI/UX Specialist** - React components and accessibility
- **Tester/Debugger** - Quality assurance and debugging
- **Docs Manager** - Documentation and knowledge synthesis

## 📊 Features

### Real-time Progress Tracking
- Live progress updates
- Performance metrics
- Estimated time remaining
- Success rate monitoring

### Workflow Templates
- Predefined execution patterns
- Customizable workflows
- Parallel execution support
- Dependency management

### Flexible Configuration
- Agent selection
- Priority levels
- Output formats
- Team size options

## 🎯 Usage Examples

### Architecture Analysis
```bash
/cook architecture "Design new feature architecture"
/cook architecture "Review existing system design" --team full
```

### Feature Implementation
```bash
/cook implementation "Implement real-time notifications"
/cook implementation "Fix authentication issues" --priority high
```

### Testing Strategy
```bash
/cook testing "Create comprehensive test suite"
/cook testing "Debug performance issues" --team mini
```

### Documentation
```bash
/cook documentation "Generate API documentation"
/cook documentation "Create user guide" --output executive
```

### Optimization
```bash
/cook optimization "Improve search performance"
/cook optimization "Enhance accessibility" --parallel
```

## 🔧 Configuration

### Agent Configuration
Each agent has a configuration file in `/sub-agents/`:
- `architect-researcher.json`
- `backend-master.json`
- `ui-ux-specialist.json`
- `tester-debugger.json`
- `docs-manager.json`

### Custom Templates
Create custom workflows in `.claude/templates/`:

```json
{
  "name": "custom-workflow",
  "description": "Custom workflow for specific needs",
  "agents": [
    {
      "agent": "architect",
      "task": "Custom architectural analysis"
    }
  ],
  "options": {
    "output": "detailed",
    "priority": "high"
  }
}
```

### System Configuration
Modify system behavior in the coordinator:

```typescript
const config = {
  maxConcurrentAgents: 3,
  agentTimeout: 300000,
  retryAttempts: 2,
  enableParallelExecution: true,
  progressReporting: true
};
```

## 📈 Monitoring

### Progress Updates
The system provides real-time progress updates:

```
🍳 Cooking: Advisor Analytics Dashboard
📋 Planning: Architect analyzing requirements...
🔍 Analyzing: Backend + UI working in parallel...
🧪 Testing: Tester validating approach...
📝 Documenting: Docs synthesizing results...
✅ Complete: Ready for implementation
```

### Performance Metrics
- Execution time per agent
- Success rate
- Throughput metrics
- Resource utilization

## 🚨 Troubleshooting

### Common Issues

1. **Command not recognized**
   - Check command syntax
   - Use `/cook --help` for examples

2. **Agent execution failed**
   - Review agent configuration
   - Check agent permissions

3. **Progress stuck**
   - Verify agent dependencies
   - Check for circular dependencies

4. **Template not found**
   - Verify template name
   - Use `/cook --list` to see available templates

### Debug Mode
Enable debug logging:

```bash
/cook --debug "your command"
```

## 🤝 Integration

### With Development Workflow
- Pre-commit analysis
- Code review enhancement
- Documentation automation
- Performance monitoring

### With CI/CD
- Automated testing
- Documentation generation
- Quality assurance
- Deployment validation

## 📝 API Reference

### CookCommandParser
```typescript
parse(input: string): ParsedCommand
getHelpText(): string
formatCommand(command: CookCommand): string
```

### TeamCoordinator
```typescript
executeCommand(command: CookCommand): Promise<ExecutionSession>
getSession(sessionId: string): ExecutionSession
cancelSession(sessionId: string): boolean
```

### ProgressTracker
```typescript
startTracking(session: ExecutionSession): void
updateProgress(session: ExecutionSession): void
getMetrics(sessionId: string): ProgressMetrics
```

### TemplateManager
```typescript
getTemplate(name: string): ProjectTemplate
getAllTemplates(): ProjectTemplate[]
applyTemplate(template: ProjectTemplate, task: string): CookCommand
```

## 🎯 Best Practices

1. **Start Simple**: Begin with basic commands and explore options
2. **Use Templates**: Leverage predefined workflows for common tasks
3. **Monitor Progress**: Keep an eye on execution progress and metrics
4. **Review Results**: Always review agent outputs and recommendations
5. **Iterate**: Use feedback to improve command effectiveness

## 🔮 Future Enhancements

- Agent performance optimization
- Advanced template system
- Integration with external tools
- Enhanced progress visualization
- Machine learning for agent selection
- Real-time collaboration features

---

Built for the AI Advisor App project with ❤️ using TypeScript and modern orchestration patterns.