# Run Agent-CI (MANDATORY)

You **must** run Agent-CI at two points during any task:

Assume CI is green when you start a task. Before telling the user the work is done, run Agent-CI to validate your changes:

```bash
pnpm agent-ci run --all --quiet
```

**If it fails, fix it.** Do not report success until CI passes. You own the full loop — writing the code and proving it works.

Use `--quiet` (or set `AI_AGENT=1`) to suppress animated rendering.
