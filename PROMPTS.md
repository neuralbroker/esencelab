# Prompt Library

This file is a reusable prompt reference for planning, implementation, testing,
debugging, security review, code review, release work, and maintenance.

Use these prompts as starting points. Tailor them to the repo, feature, and
team context instead of treating them as rigid templates.

## 1. Project Kickoff And Discovery

### Understand The Problem
> You are a senior product engineer and technical lead. Your job is to turn an idea into a shippable plan.
>
> First, identify:
> - the user problem
> - the business goal
> - the target users
> - the constraints
> - what success looks like
> - what is out of scope
>
> Then produce:
> - a short summary of the problem
> - assumptions
> - a list of clarifying questions
> - a proposed solution
> - alternative approaches
> - risks and tradeoffs
> - a recommended first version that can ship quickly
> - milestones broken into small steps
>
> Be practical. Prefer the smallest valuable product over a big redesign. If information is missing, ask only the minimum number of questions needed to proceed.

### Feature Planning
> Convert this feature request into an execution-ready implementation plan.
>
> Include:
> - user stories
> - acceptance criteria
> - non-goals
> - edge cases
> - data model changes
> - API changes
> - UI/UX changes
> - test plan
> - rollout plan
> - risks
> - dependencies
>
> Keep the plan specific enough that an engineer can implement it without guessing.

### Technical Specification
> Write a technical specification for this change.
>
> Structure it as:
> 1. Overview
> 2. Problem statement
> 3. Goals
> 4. Non-goals
> 5. Requirements
> 6. Proposed design
> 7. Data flow
> 8. APIs / interfaces
> 9. Validation and error handling
> 10. Security considerations
> 11. Test strategy
> 12. Rollout / migration plan
> 13. Open questions
>
> Keep it concise but complete. Prefer concrete implementation details over vague suggestions.

### Architecture Decision
> Evaluate the architecture for this feature or project.
>
> I want:
> - the simplest viable design
> - a clear explanation of components and responsibilities
> - how data flows through the system
> - which parts are stable vs likely to change
> - failure modes and recovery behavior
> - performance considerations
> - scalability limits
> - observability needs
> - tradeoffs between alternatives
>
> Recommend one approach and explain why it is the best fit.

## 2. Build And Implementation

### Implement A Feature
> Implement this feature in the existing codebase.
>
> Requirements:
> - first inspect the relevant code and existing patterns
> - reuse current abstractions when possible
> - make the smallest correct change
> - preserve backwards compatibility unless explicitly told otherwise
> - add or update tests
> - handle obvious edge cases
> - do not introduce unnecessary refactors
>
> If the design is ambiguous, choose the safest minimal implementation and explain the tradeoff.

### Extend An Existing Project
> Add this capability to the project in a way that fits the existing architecture.
>
> Before changing code:
> - identify relevant files and conventions
> - understand how similar features are implemented
> - determine whether there are existing utilities, hooks, services, or helpers to reuse
>
> Then:
> - implement incrementally
> - keep the surface area small
> - add tests that match the repository’s style
> - avoid creating parallel systems unless necessary
>
> Prefer integration over invention.

### Refactor Safely
> Refactor this code to improve readability, maintainability, and correctness without changing behavior.
>
> Constraints:
> - keep external behavior the same
> - preserve public APIs unless requested otherwise
> - do not over-abstract
> - keep changes small and reversible
> - add regression tests if behavior might be affected
>
> Explain what was improved and why the new structure is safer or easier to maintain.

### Migration
> Migrate this implementation from the old approach to the new one.
>
> Requirements:
> - break the work into safe steps
> - preserve compatibility where possible
> - identify data or API migrations
> - describe rollback strategy
> - explain what must be tested before and after the migration
>
> If a big-bang rewrite is risky, propose an incremental migration path.

### Performance Improvement
> Improve the performance of this code path.
>
> First identify:
> - the likely bottleneck
> - whether the issue is CPU, memory, I/O, network, rendering, or database related
> - the expected impact of optimization
>
> Then:
> - propose the highest-value optimization first
> - avoid premature optimization
> - keep correctness intact
> - add benchmarks or measurements if possible
>
> Explain any tradeoffs introduced by the optimization.

## 3. Testing

### Create A Test Plan
> Create a test plan for this change.
>
> Include:
> - unit tests
> - integration tests
> - end-to-end tests
> - regression tests
> - failure-path tests
> - edge cases
> - any tests that should not be written because they would be brittle or low-value
>
> Prioritize the tests by risk and impact. The goal is to catch the most likely and most expensive failures.

### Write Tests
> Write the missing tests for this code.
>
> Requirements:
> - cover happy path, edge cases, and failure paths
> - follow the existing test style in the repository
> - keep tests readable and maintainable
> - prefer behavior-focused tests over implementation-detail tests
> - add regression coverage for any bug fixed
>
> If the existing code makes testing difficult, suggest the smallest change that improves testability.

### Regression Test
> Add a regression test that proves this bug is fixed and prevents it from returning.
>
> The test should:
> - be minimal
> - fail before the fix
> - pass after the fix
> - clearly capture the intended behavior
>
> If the bug has multiple possible root causes, choose the one most directly tied to the observed failure.

### Fix Flaky Tests
> Diagnose this flaky test and make it deterministic.
>
> Investigate:
> - timing dependencies
> - shared state
> - order dependence
> - external resources
> - race conditions
>
> Then:
> - fix the root cause
> - avoid masking the problem with arbitrary retries or sleeps unless absolutely necessary
> - keep test coverage meaningful
>
> Explain why it was flaky and why the fix works.

### Test Gap Analysis
> Review this code and identify important behaviors that are not covered by tests.
>
> Focus on:
> - critical business logic
> - error handling
> - boundary conditions
> - interactions between modules
> - security-sensitive paths
> - regression-prone logic
>
> Recommend the highest-value missing tests first.

## 4. Debugging

### General Debugging
> Debug this issue systematically.
>
> Steps:
> - restate the symptom clearly
> - trace the execution path
> - identify the most likely root cause
> - distinguish between symptoms and causes
> - propose the smallest safe fix
> - suggest how to validate the fix
>
> If multiple causes are plausible, rank them by likelihood and evidence.

### Production Bug
> Investigate this production bug as if you are on-call.
>
> I want:
> - likely root cause
> - affected code path
> - what logs/metrics would confirm the diagnosis
> - immediate mitigation
> - permanent fix
> - a follow-up prevention plan
>
> Be practical and prioritize user impact.

### Unexpected Behavior
> Explain why this code behaves the way it does.
>
> Trace:
> - input
> - control flow
> - state changes
> - outputs
>
> Then point to the exact lines responsible and explain the mismatch between expected and actual behavior.

### Root Cause Analysis
> Perform a root-cause analysis for this incident.
>
> Include:
> - immediate trigger
> - underlying technical cause
> - process or design gap that allowed it
> - how to prevent recurrence
> - what tests, monitoring, or safeguards should be added
>
> Separate the true root cause from surface symptoms.

### Error Diagnosis
> Diagnose this error message.
>
> Explain:
> - what the error means in plain English
> - where it is likely thrown
> - what conditions trigger it
> - how to fix it
> - how to prevent it from happening again
>
> If relevant, identify whether the issue is in application code, configuration, dependency usage, or environment setup.

## 5. Security

### Security Review
> Perform a security-focused review of these changes.
>
> Focus only on concrete, high-confidence vulnerabilities with realistic exploit paths.
>
> Check for:
> - authentication flaws
> - authorization bypasses
> - injection vulnerabilities
> - path traversal
> - insecure deserialization
> - XSS
> - SSRF
> - secret leakage
> - unsafe crypto usage
> - data exposure
>
> For each finding, provide:
> - file and line
> - severity
> - vulnerability type
> - exploit scenario
> - recommendation
>
> Avoid theoretical issues and low-confidence speculation.

### Threat Model
> Build a threat model for this feature or system.
>
> Include:
> - assets to protect
> - trust boundaries
> - attacker goals
> - attack surfaces
> - abuse cases
> - likely threats
> - mitigations
> - residual risk
>
> Keep it practical and tied to the actual system design.

### Secure Implementation
> Implement this feature with security best practices in mind.
>
> Requirements:
> - validate inputs
> - minimize privileges
> - avoid unsafe parsing or execution
> - protect secrets
> - fail safely
> - keep auditability in mind where relevant
>
> Explain any security tradeoffs introduced by the design.

### Auth Review
> Review this code specifically for authentication and authorization issues.
>
> Look for:
> - bypasses
> - missing access checks
> - privilege escalation
> - confused deputy problems
> - insecure defaults
> - session handling issues
> - token validation problems
>
> Report only concrete problems with a believable exploitation path.

### Secret Handling Review
> Review this code for secret-handling risks.
>
> Check for:
> - hardcoded credentials
> - logging secrets
> - unsafe storage
> - accidental exposure in errors, analytics, or debug output
> - insecure propagation between systems
>
> Recommend the safest practical fix for any issue found.

## 6. Code Review

### General Code Review
> Review this change as a senior engineer on a product team.
>
> Focus on:
> - correctness
> - maintainability
> - tests
> - performance
> - security
> - backwards compatibility
> - adherence to existing project conventions
>
> Be specific and prioritize the most important issues first.

### PR Review
> Review this pull request and provide a concise but thorough code review.
>
> Include:
> - what the change does
> - any bugs or regressions
> - design concerns
> - missing tests
> - performance or security risks
> - whether it is ready to merge
>
> If there are no major issues, say so clearly.

### Architecture Review
> Review the design of this feature or subsystem.
>
> Evaluate:
> - separation of concerns
> - coupling
> - extensibility
> - testability
> - failure modes
> - scalability
> - simplicity
>
> Recommend improvements only where they meaningfully reduce risk or complexity.

## 7. Release And Shipping

### Release Readiness
> Determine whether this change is ready to ship.
>
> Check:
> - tests
> - documentation
> - compatibility
> - migration risk
> - monitoring
> - rollback plan
> - security concerns
> - user impact
>
> Give a clear go / no-go recommendation and explain what is still missing.

### Change Summary
> Summarize these code changes in plain language for a release note or internal update.
>
> Include:
> - what changed
> - who is affected
> - why it matters
> - any user-visible behavior changes
> - any risks or caveats

### PR Description
> Write a strong pull request description.
>
> Include:
> - summary
> - motivation
> - implementation details
> - tests
> - screenshots or examples if useful
> - risks
> - rollout notes
> - follow-up work
>
> Make it clear and concise enough for reviewers to understand quickly.

### Commit Message
> Write a commit message that reflects the intent of the change, not just the mechanics.
>
> Requirements:
> - concise
> - specific
> - appropriate for a real team’s commit history
> - if needed, include a short body explaining the why

## 8. Maintenance And Improvement

### Improve An Existing Product
> Audit this project as an engineer responsible for shipping and maintaining it.
>
> Identify:
> - the highest-value improvements
> - major bugs or risk areas
> - missing tests
> - security issues
> - performance bottlenecks
> - maintainability problems
> - developer experience pain points
>
> Then rank the work by impact and effort.

### Technical Debt Cleanup
> Identify the most important technical debt in this codebase.
>
> Separate:
> - urgent risk
> - medium-priority cleanup
> - low-value cleanup
>
> For each item, explain the cost of leaving it as-is and the benefit of fixing it.

### Dependency Review
> Review this dependency change or upgrade.
>
> Assess:
> - compatibility risk
> - security impact
> - API changes
> - behavior changes
> - transitive dependency concerns
> - test coverage needed
>
> Recommend whether to upgrade now, later, or not at all.

### Cleanup And Dead Code Removal
> Safely remove dead code, duplicate logic, and obsolete paths.
>
> Before deleting anything:
> - verify it is unused
> - check indirect references
> - confirm no tests or runtime paths depend on it
>
> Then remove only what is proven unnecessary.

## 9. Everyday Workflow Shortcuts

### Plan
> Turn this request into an execution-ready plan with requirements, edge cases, risks, tests, and rollout.

### Build
> Implement the smallest correct change in the existing codebase, following current patterns and adding tests.

### Test
> Write the most valuable tests for this change, including regressions and failure paths.

### Debug
> Find the root cause, trace the code path, and propose the smallest safe fix.

### Security
> Review only for concrete, high-confidence vulnerabilities with exploit paths.

### Review
> Review this change like a senior engineer focusing on correctness, quality, security, and test coverage.

## Notes

- Prefer practical, repo-aware prompts over generic “build everything” prompts.
- Prefer the smallest valuable version over a redesign unless a redesign is explicitly required.
- When using these prompts with an AI coding tool, always include repo context, current constraints, and success criteria.
