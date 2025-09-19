/**
 * /cook Command Parser and Dispatcher
 * Handles parsing of /cook commands and dispatches to appropriate sub-agent workflows
 */

export interface CookCommand {
  projectType: ProjectType;
  taskDescription: string;
  options: CookOptions;
  timestamp: Date;
  id: string;
}

export interface CookOptions {
  team?: 'full' | 'mini' | 'custom';
  priority?: 'high' | 'medium' | 'low';
  output?: 'summary' | 'detailed' | 'executive';
  parallel?: boolean;
  agents?: string[];
  template?: string;
  quick?: boolean;
  deep?: boolean;
}

export type ProjectType =
  | 'architecture'
  | 'implementation'
  | 'testing'
  | 'documentation'
  | 'optimization'
  | 'custom';

export interface ParsedCommand {
  isValid: boolean;
  command?: CookCommand;
  error?: string;
  suggestions?: string[];
}

export class CookCommandParser {
  private static readonly PROJECT_TYPES = [
    'architecture', 'implementation', 'testing',
    'documentation', 'optimization', 'custom'
  ];

  private static readonly TEAM_OPTIONS = ['full', 'mini', 'custom'];
  private static readonly PRIORITY_OPTIONS = ['high', 'medium', 'low'];
  private static readonly OUTPUT_OPTIONS = ['summary', 'detailed', 'executive'];

  /**
   * Parse a /cook command string into structured command object
   */
  static parse(input: string): ParsedCommand {
    const trimmed = input.trim();

    if (!trimmed.startsWith('/cook')) {
      return {
        isValid: false,
        error: 'Command must start with /cook'
      };
    }

    // Remove /cook prefix
    const commandBody = trimmed.substring(5).trim();

    if (!commandBody) {
      return {
        isValid: false,
        error: 'No command provided',
        suggestions: [
          '/cook --help for usage information',
          '/cook --list for available project types',
          '/cook architecture "Analyze feature architecture"'
        ]
      };
    }

    // Check for help flags
    if (commandBody === '--help' || commandBody === '-h') {
      return {
        isValid: true,
        command: {
          projectType: 'custom',
          taskDescription: 'help',
          options: {},
          timestamp: new Date(),
          id: this.generateId()
        }
      };
    }

    // Check for list flag
    if (commandBody === '--list' || commandBody === '-l') {
      return {
        isValid: true,
        command: {
          projectType: 'custom',
          taskDescription: 'list',
          options: {},
          timestamp: new Date(),
          id: this.generateId()
        }
      };
    }

    // Parse project type and options
    const tokens = this.tokenize(commandBody);
    const parseResult = this.parseTokens(tokens);

    if (!parseResult.isValid) {
      return parseResult;
    }

    return {
      isValid: true,
      command: {
        ...parseResult.command!,
        timestamp: new Date(),
        id: this.generateId()
      }
    };
  }

  /**
   * Tokenize command string into parts
   */
  private static tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        if (inQuotes) {
          tokens.push(current);
          current = '';
          inQuotes = false;
        } else {
          inQuotes = true;
        }
        continue;
      }

      if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Parse tokens into command structure
   */
  private static parseTokens(tokens: string[]): ParsedCommand {
    if (tokens.length === 0) {
      return {
        isValid: false,
        error: 'No command provided'
      };
    }

    const options: CookOptions = {};
    let projectType: ProjectType | undefined;
    let taskDescription = '';

    // Parse tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Handle options
      if (token.startsWith('--')) {
        const optionName = token.substring(2);
        const optionValue = tokens[i + 1];

        switch (optionName) {
          case 'team':
            if (optionValue && this.TEAM_OPTIONS.includes(optionValue)) {
              options.team = optionValue as CookOptions['team'];
              i++; // Skip next token
            } else {
              return {
                isValid: false,
                error: `Invalid team option: ${optionValue}. Valid options: ${this.TEAM_OPTIONS.join(', ')}`
              };
            }
            break;

          case 'priority':
            if (optionValue && this.PRIORITY_OPTIONS.includes(optionValue)) {
              options.priority = optionValue as CookOptions['priority'];
              i++; // Skip next token
            } else {
              return {
                isValid: false,
                error: `Invalid priority option: ${optionValue}. Valid options: ${this.PRIORITY_OPTIONS.join(', ')}`
              };
            }
            break;

          case 'output':
            if (optionValue && this.OUTPUT_OPTIONS.includes(optionValue)) {
              options.output = optionValue as CookOptions['output'];
              i++; // Skip next token
            } else {
              return {
                isValid: false,
                error: `Invalid output option: ${optionValue}. Valid options: ${this.OUTPUT_OPTIONS.join(', ')}`
              };
            }
            break;

          case 'parallel':
            options.parallel = true;
            break;

          case 'agents':
            if (optionValue) {
              options.agents = optionValue.split(',');
              i++; // Skip next token
            }
            break;

          case 'template':
            if (optionValue) {
              options.template = optionValue;
              i++; // Skip next token
            }
            break;

          case 'quick':
            options.quick = true;
            break;

          case 'deep':
            options.deep = true;
            break;

          default:
            return {
              isValid: false,
              error: `Unknown option: --${optionName}`
            };
        }
      } else if (token.startsWith('-')) {
        // Handle short options
        const optionName = token.substring(1);
        switch (optionName) {
          case 't':
            options.team = 'full';
            break;
          case 'p':
            options.priority = 'medium';
            break;
          case 'o':
            options.output = 'summary';
            break;
          default:
            return {
              isValid: false,
              error: `Unknown short option: -${optionName}`
            };
        }
      } else {
        // Handle project type and task description
        if (!projectType && this.PROJECT_TYPES.includes(token)) {
          projectType = token as ProjectType;
        } else {
          // Collect remaining tokens as task description
          const remainingTokens = tokens.slice(i);
          taskDescription = remainingTokens.join(' ');
          break;
        }
      }
    }

    // Validate required fields
    if (!projectType) {
      return {
        isValid: false,
        error: 'Project type required',
        suggestions: [
          'Available project types: ' + this.PROJECT_TYPES.join(', '),
          'Example: /cook architecture "Design new feature"'
        ]
      };
    }

    if (!taskDescription) {
      return {
        isValid: false,
        error: 'Task description required',
        suggestions: [
          'Example: /cook architecture "Design Advisor Analytics Dashboard"'
        ]
      };
    }

    return {
      isValid: true,
      command: {
        projectType,
        taskDescription,
        options,
        timestamp: new Date(),
        id: this.generateId()
      }
    };
  }

  /**
   * Generate unique command ID
   */
  private static generateId(): string {
    return `cook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate command against project capabilities
   */
  static validateCommand(command: CookCommand): { isValid: boolean; warnings?: string[] } {
    const warnings: string[] = [];

    // Check if project type is supported
    if (!this.PROJECT_TYPES.includes(command.projectType)) {
      return {
        isValid: false,
        warnings: [`Unsupported project type: ${command.projectType}`]
      };
    }

    // Validate agent combinations
    if (command.options.agents) {
      const validAgents = ['architect', 'backend', 'ui', 'tester', 'docs'];
      const invalidAgents = command.options.agents.filter(agent => !validAgents.includes(agent));

      if (invalidAgents.length > 0) {
        warnings.push(`Invalid agents: ${invalidAgents.join(', ')}`);
      }
    }

    // Validate template existence
    if (command.options.template) {
      // Template validation would go here
      // For now, just warn
      warnings.push(`Template validation not implemented: ${command.options.template}`);
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Format command for display
   */
  static formatCommand(command: CookCommand): string {
    const parts = [`/cook ${command.projectType}`];

    if (command.options.team) {
      parts.push(`--team ${command.options.team}`);
    }

    if (command.options.priority) {
      parts.push(`--priority ${command.options.priority}`);
    }

    if (command.options.output) {
      parts.push(`--output ${command.options.output}`);
    }

    if (command.options.parallel) {
      parts.push('--parallel');
    }

    parts.push(`"${command.taskDescription}"`);

    return parts.join(' ');
  }

  /**
   * Get help text
   */
  static getHelpText(): string {
    return `
🍳 /cook Command System

USAGE:
  /cook [project-type] "[task-description]" [options]

PROJECT TYPES:
  architecture    - Architectural analysis and design
  implementation  - Feature implementation and bug fixes
  testing         - Test planning and quality assurance
  documentation   - Documentation generation
  optimization    - Performance and accessibility improvements
  custom          - Custom workflow

OPTIONS:
  --team [type]       - Team size: full, mini, custom
  --priority [level]  - Priority: high, medium, low
  --output [format]   - Output format: summary, detailed, executive
  --parallel          - Enable parallel execution
  --agents [list]     - Specific agents to use
  --template [name]   - Custom template to use
  --quick             - Quick analysis mode
  --deep              - Deep dive analysis

EXAMPLES:
  /cook architecture "Design Advisor Analytics Dashboard"
  /cook implementation "Fix chat performance issues" --priority high
  /cook testing "Create marketplace test suite" --team mini
  /cook optimization "Improve search performance" --parallel

HELP:
  /cook --help     - Show this help
  /cook --list     - List available project types
    `.trim();
  }
}