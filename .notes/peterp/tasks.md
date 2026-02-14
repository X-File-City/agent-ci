## Next Steps
- [ ] **Monitor Runner Churn in GitHub**
      Verify that ephemeral runners are being removed correctly from the GitHub Actions settings after use. If they linger, we may need to adjust the `--ephemeral` flag or cleanup logic.
      Importance: 5/5
      Reference: [walkthrough.md](file:///Users/peterp/.gemini/antigravity/brain/8a9e030f-84ec-48bf-938e-8bbc79250cc6/walkthrough.md)

- [ ] **Fix Bridge Admin Panel Type Errors**
      The Bridge admin pages (`src/app/pages/admin/jobs.tsx`) have stale type definitions for `env.JOBS` that prevent `pnpm build` from completing cleanly.
      Importance: 4/5
      Reference: [Bridge status checkpoint](file:///Users/peterp/gh/redwoodjs/oa-1/bridge/src/app/pages/admin/jobs.tsx)

- [ ] **Refactor Registration Logic in Runner**
      Move the combined `./config.sh && ./run.sh` logic from `warm-pool.ts` into a cleaner abstraction to handle more complex runner configurations in the future.
      Importance: 2/5
      Reference: [warm-pool.ts](file:///Users/peterp/gh/redwoodjs/oa-1/runner/src/warm-pool.ts)
