---
name: superpowers
version: "1.0.0"
description: An agentic skills framework for software development. Includes TDD, systematic debugging, brainstorming, planning, subagent-driven development, and more. Auto-triggers based on development context.
user-invocable: true
---

# Superpowers

An agentic skills framework & software development methodology that works.

## Overview

Superpowers is a comprehensive skill system that enhances AI coding agents with structured methodologies for:
- Test-Driven Development
- Systematic Debugging
- Collaborative Development
- Planning & Execution
- Code Review
- Git Workflows

## How It Works

When you start building something, the agent:
1. **Understands Requirements** - Asks what you're really trying to do
2. **Creates Specifications** - Shows you digestible spec chunks for approval
3. **Plans Implementation** - Creates clear plans following TDD, YAGNI, and DRY principles
4. **Executes with Subagents** - Launches subagent-driven development process
5. **Reviews & Continues** - Inspects work and continues autonomously

## Available Skills

### Testing

#### test-driven-development
**RED-GREEN-REFACTOR cycle with anti-patterns reference**

Follow the TDD discipline:
1. **RED** - Write a failing test first
2. **GREEN** - Write minimal code to pass
3. **REFACTOR** - Improve code while keeping tests green

Anti-patterns to avoid:
- Writing implementation before tests
- Testing implementation details instead of behavior
- Skipping the refactor step
- Writing tests after the code

### Debugging

#### systematic-debugging
**4-phase root cause process**

1. **Reproduce** - Consistently reproduce the issue
2. **Isolate** - Narrow down to specific component/line
3. **Diagnose** - Identify root cause (not symptoms)
4. **Fix** - Apply targeted fix with verification

Techniques:
- Root-cause tracing (follow the error backwards)
- Defense-in-depth (multiple validation layers)
- Condition-based waiting (avoid race conditions)

#### verification-before-completion
**Ensure it's actually fixed**

Before marking complete:
1. Run all relevant tests
2. Verify the specific bug is fixed
3. Check for regression
4. Test edge cases
5. Document the fix

### Collaboration

#### brainstorming
**Socratic design refinement**

Use Socratic questioning to:
- Clarify requirements
- Explore alternatives
- Challenge assumptions
- Refine design decisions

Ask "why" and "what if" questions to deepen understanding.

#### writing-plans
**Detailed implementation plans**

Create plans that include:
- Clear phases/milestones
- Task breakdown
- Dependencies
- Success criteria
- Risk assessment

Plans should be clear enough for a junior engineer to follow.

#### executing-plans
**Batch execution with checkpoints**

Execute plans systematically:
1. Review current phase
2. Execute tasks in order
3. Mark completion
4. Checkpoint progress
5. Move to next phase

Update plan as you learn.

#### dispatching-parallel-agents
**Concurrent subagent workflows**

For independent tasks:
1. Identify parallelizable work
2. Create clear task specifications
3. Dispatch to subagents
4. Monitor progress
5. Integrate results

#### requesting-code-review
**Pre-review checklist**

Before requesting review:
- [ ] All tests pass
- [ ] Code follows style guide
- [ ] No debug code left
- [ ] Documentation updated
- [ ] Self-review completed

#### receiving-code-review
**Responding to feedback**

When receiving feedback:
1. Read all comments first
2. Ask clarifying questions
3. Address each point
4. Update code
5. Respond to reviewer

#### using-git-worktrees
**Parallel development branches**

Use git worktrees for:
- Working on multiple features simultaneously
- Testing different approaches
- Maintaining separate contexts

```bash
git worktree add ../feature-branch feature-branch
```

#### finishing-a-development-branch
**Merge/PR decision workflow**

Before merging:
1. All tests pass
2. Code reviewed
3. Documentation updated
4. Conflicts resolved
5. CI/CD green

#### subagent-driven-development
**Fast iteration with two-stage review**

Process:
1. **Spec Compliance Review** - Does it meet requirements?
2. **Code Quality Review** - Is it well-written?

Enables autonomous work for hours at a time.

### Meta

#### writing-skills
**Create new skills following best practices**

When creating skills:
1. Clear name and description
2. Specific use cases
3. Step-by-step instructions
4. Examples
5. Anti-patterns to avoid

Include testing methodology.

#### using-superpowers
**Introduction to the skills system**

This skill! Explains:
- How superpowers works
- When to use each skill
- How skills auto-trigger
- Best practices

## When Skills Auto-Trigger

Skills automatically activate based on context:

| Context | Triggered Skill |
|---------|----------------|
| Starting new feature | brainstorming, writing-plans |
| Writing code | test-driven-development |
| Bug encountered | systematic-debugging |
| Multiple tasks | dispatching-parallel-agents |
| Code complete | verification-before-completion |
| Ready for review | requesting-code-review |
| Received feedback | receiving-code-review |

## Core Principles

1. **TDD First** - Always write tests before implementation
2. **YAGNI** - You Aren't Gonna Need It (don't over-engineer)
3. **DRY** - Don't Repeat Yourself
4. **Systematic** - Follow structured processes
5. **Autonomous** - Enable long autonomous work sessions

## Usage

You don't need to explicitly invoke skills - they trigger automatically based on context. However, you can explicitly request:

```
Use test-driven-development to implement this feature
Use systematic-debugging to fix this bug
Use subagent-driven-development for this complex task
```

## Philosophy

- **Spec before code** - Understand requirements first
- **Plan before execute** - Clear plans enable autonomy
- **Test before implement** - TDD catches issues early
- **Review before complete** - Verification prevents regressions
- **Iterate with feedback** - Continuous improvement

## Benefits

- **Faster Development** - Structured approach reduces waste
- **Higher Quality** - TDD and reviews catch issues early
- **More Autonomy** - Clear plans enable long work sessions
- **Better Collaboration** - Structured processes improve teamwork
- **Continuous Learning** - Systematic approach builds knowledge

---

**Note**: This is a comprehensive skill system. Individual sub-skills can be found in the original repository at https://github.com/obra/superpowers

For detailed implementation of each skill, refer to the original repository or create specific skill files for the ones you use most frequently.
