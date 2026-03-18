export type Template = {
  id: string
  name: string
  description: string
  tabName: string
  content: string
}

export const templates: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start with a clean slate',
    tabName: 'untitled.md',
    content: '',
  },
  {
    id: 'readme',
    name: 'README',
    description: 'Standard project README with common sections',
    tabName: 'Untitled README.md',
    content: `# Project Name

> A brief description of what this project does.

## Installation

\`\`\`bash
npm install your-package
\`\`\`

## Usage

\`\`\`js
import { example } from 'your-package'

example()
\`\`\`

## API

### \`functionName(param)\`

Description of the function.

| Parameter | Type     | Description          |
| --------- | -------- | -------------------- |
| \`param\`   | \`string\` | Description of param |

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing\`)
5. Open a Pull Request

## License

MIT
`,
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Article with frontmatter, intro, and sections',
    tabName: 'New Blog Post.md',
    content: `---
title: "Your Blog Post Title"
date: ${new Date().toISOString().slice(0, 10)}
tags: [topic, writing]
author: Your Name
---

# Your Blog Post Title

A compelling introduction that hooks the reader and outlines what they'll learn.

## Background

Provide context and set the stage for the main content.

## Main Point

Develop your argument or explain the core concept here.

### Supporting Detail

Add evidence, examples, or code snippets to support your point.

## Key Takeaways

- First takeaway
- Second takeaway
- Third takeaway

## Conclusion

Summarize the main points and leave the reader with a call to action or thought-provoking question.
`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured notes with attendees, agenda, and action items',
    tabName: 'Meeting Notes.md',
    content: `# Meeting Notes

**Date:** ${new Date().toISOString().slice(0, 10)}
**Time:** 10:00 AM
**Attendees:** Person A, Person B, Person C

---

## Agenda

1. Topic one
2. Topic two
3. Topic three

## Discussion

### Topic One

- Key point discussed
- Decision made

### Topic Two

- Key point discussed
- Open question raised

## Action Items

- [ ] **Person A** — Task description (due: date)
- [ ] **Person B** — Task description (due: date)
- [ ] **Person C** — Task description (due: date)

## Next Meeting

**Date:** TBD
**Topics to follow up:**
- Item from this meeting
`,
  },
  {
    id: 'changelog',
    name: 'Changelog',
    description: 'Keep a Changelog format with version sections',
    tabName: 'CHANGELOG.md',
    content: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- New feature description

### Changed

- Change description

### Fixed

- Bug fix description

## [1.0.0] - ${new Date().toISOString().slice(0, 10)}

### Added

- Initial release
- Feature one
- Feature two

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A
`,
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    description: 'Endpoint docs with request/response examples',
    tabName: 'API Documentation.md',
    content: `# API Documentation

Base URL: \`https://api.example.com/v1\`

## Authentication

All requests require a Bearer token in the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

---

## Endpoints

### GET /resource

Retrieve a list of resources.

**Query Parameters:**

| Parameter | Type     | Required | Description              |
| --------- | -------- | -------- | ------------------------ |
| \`page\`    | \`number\` | No       | Page number (default: 1) |
| \`limit\`   | \`number\` | No       | Items per page (max: 100)|

**Response:**

\`\`\`json
{
  "data": [
    { "id": 1, "name": "Example" }
  ],
  "meta": { "page": 1, "total": 42 }
}
\`\`\`

---

### POST /resource

Create a new resource.

**Request Body:**

\`\`\`json
{
  "name": "New Resource",
  "description": "A description"
}
\`\`\`

**Response:** \`201 Created\`

\`\`\`json
{
  "id": 2,
  "name": "New Resource",
  "description": "A description",
  "createdAt": "2025-01-01T00:00:00Z"
}
\`\`\`

---

## Error Codes

| Code | Description           |
| ---- | --------------------- |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 404  | Not Found             |
| 500  | Internal Server Error |
`,
  },
  {
    id: 'tech-spec',
    name: 'Technical Spec',
    description: 'Problem statement, proposed solution, and implementation plan',
    tabName: 'Technical Spec.md',
    content: `# Technical Specification: Feature Name

**Author:** Your Name
**Date:** ${new Date().toISOString().slice(0, 10)}
**Status:** Draft

## Problem Statement

Describe the problem or need this feature addresses. Include context about why this matters now.

## Goals

- Primary goal
- Secondary goal

## Non-Goals

- What this feature explicitly does not aim to solve

## Proposed Solution

### Overview

High-level description of the approach.

### Architecture

Describe the system design, components involved, and how they interact.

\`\`\`
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client   │────▶│  Server  │────▶│ Database │
└──────────┘     └──────────┘     └──────────┘
\`\`\`

### Data Model

Describe any new or modified data structures.

### API Changes

List any new or changed endpoints.

## Alternatives Considered

| Approach     | Pros            | Cons              |
| ------------ | --------------- | ----------------- |
| Option A     | Simple          | Limited scale     |
| Option B     | Scalable        | More complex      |

## Implementation Plan

1. **Phase 1** — Foundation (estimated: X days)
2. **Phase 2** — Core logic (estimated: X days)
3. **Phase 3** — Testing & polish (estimated: X days)

## Risks & Open Questions

- Risk: description and mitigation
- Open question: what needs to be decided?
`,
  },
]
