# Research Agent PRD

## Product Name
Offline Deep-Research Bundle Builder

## Objective
Create a repeatable offline process that turns a visualization/topic into a trusted knowledge bundle consumable by the browser Q&A system.

## Users
- content authors building new educational pages
- maintainers expanding topic coverage
- reviewers validating sources and figures

## Core User Stories
1. As an author, I can describe a visualization and receive a structured knowledge bundle plan.
2. As a maintainer, I can ingest unsupported user questions and expand knowledge coverage.
3. As a reviewer, I can inspect sources, figures, and glossary entries before publication.
4. As the QA system owner, I can publish browser-ready bundles with consistent schema.

## Primary Outputs
- glossary entries
- concept documents
- page-specific narratives
- figure records with provenance
- source records with trust metadata
- coverage report and known gaps

## Functional Requirements
### Topic planning
- decompose visualization into core concepts, prerequisites, likely questions, and confusion points

### Source gathering
- prioritize primary papers and survey sources
- collect structured provenance metadata

### Figure curation
- identify relevant figures/images
- map each figure to concepts and likely queries

### Bundle drafting
- produce content conforming to the shared KB schema
- include citations and coverage notes

### Gap-driven refinement
- ingest escalation queue items from browser Q&A
- prioritize missing concepts/figures/sources

## Non-Functional Requirements
- auditable source trail
- schema-consistent outputs
- clear separation between machine draft and human review
- support iterative refinement

## Success Criteria
- bundles are useful for browser Q&A on first deployment
- unsupported-query rate falls over time
- every major concept has reputable source coverage
- visually important concepts have figures when available

## Out of Scope for V1
- fully autonomous publishing without human review
- legal/licensing automation beyond metadata capture
- live browser querying of external sources

## Risks
- source quality variance
- image licensing ambiguity
- overproduction of low-value content without question prioritization

## MVP Recommendation
Build the agent around topic decomposition, reputable-source curation, figure mapping, schema-compliant bundle output, and coverage auditing.
