import fs from 'fs';
import crypto from 'crypto';
import { parseWorkflow, NoOperationTraceWriter, convertWorkflowTemplate } from '@actions/workflow-parser';

export async function parseWorkflowSteps(filePath: string, jobName: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = parseWorkflow({ name: filePath, content }, new NoOperationTraceWriter());
  
  if (result.value === undefined) {
    throw new Error(`Failed to parse workflow: ${result.context.errors.getErrors().map(e => e.message).join(', ')}`);
  }

  const template = await convertWorkflowTemplate(result.context, result.value);
  
  // Find the job by ID or Name
  const job = template.jobs.find(j => {
    if (j.type !== 'job') return false;
    return j.id.toString() === jobName || (j.name && j.name.toString() === jobName);
  });

  if (!job || job.type !== 'job') {
    throw new Error(`Job "${jobName}" not found in workflow "${filePath}"`);
  }

  return job.steps.map((step, index) => {
    const stepId = step.id || `step-${index + 1}`;
    const stepName = step.name ? step.name.toString() : stepId;

    if ('run' in step) {
      return {
        Type: 'Action',
        Name: stepName,
        DisplayName: stepName,
        Id: crypto.randomUUID(),
        Reference: {
          Type: 'Script'
        },
        Inputs: {
          script: step.run.toString()
        }
      };
    } else if ('uses' in step) {
      // Basic support for 'uses' steps
      return {
        Type: 'Action',
        Name: stepName,
        DisplayName: stepName,
        Id: crypto.randomUUID(),
        Reference: {
          Type: 'Repository',
          Name: step.uses.toString()
        },
        Inputs: {
          ...(step as any).with // If we want to support 'with' inputs
        }
      };
    }
    return null;
  }).filter(Boolean);
}
