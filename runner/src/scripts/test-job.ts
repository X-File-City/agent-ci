import { executeLocalJob } from '../localJob.js';
import { Job } from '../types.js';
import { parseWorkflowSteps } from '../workflowParser.js';
import path from 'path';

async function runTest() {
  const workflowPath = path.resolve(import.meta.dirname, '../../../.github/workflows/test.yml');
  const steps = await parseWorkflowSteps(workflowPath, 'test');

  const job: Job = {
    deliveryId: 'test-job-' + Date.now(),
    eventType: 'workflow_job',
    githubJobId: '123',
    githubRepo: 'redwoodjs/opposite-actions',
    githubToken: 'mock_token',
    headSha: 'd6a273329b89417a27ba85bfc5004b6aadff0c13',
    env: {
      TEST_VAR: 'Hello form test script',
    },
    repository: {
      name: 'opposite-actions',
      owner: { login: 'redwoodjs' }
    },
    steps
  };

  await executeLocalJob(job);
}

runTest().catch(console.error);
