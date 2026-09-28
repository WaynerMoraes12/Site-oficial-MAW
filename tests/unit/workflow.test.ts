import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const yml = readFileSync('.github/workflows/deploy.yml', 'utf8').replace(/\r\n/g, '\n');
const [top, jobs] = yml.split('\njobs:\n');
const deployJob = jobs.slice(jobs.indexOf('\n  deploy:'));
const buildJob = jobs.slice(0, jobs.indexOf('\n  deploy:'));

describe('deploy workflow', () => {
  it('only runs when someone starts it by hand', () => {
    expect(top).toMatch(/on:\n {2}workflow_dispatch:/);
    expect(top).not.toMatch(/\n {2}(push|pull_request|schedule):/);
  });
  it('gives the build job read-only access', () => {
    expect(top).toMatch(/permissions:\n {2}contents: read\n/);
    expect(top + buildJob).not.toMatch(/pages: write|id-token: write/);
  });
  it('lets only the deploy job publish to Pages', () => {
    expect(deployJob).toMatch(/permissions:\n {6}pages: write\n {6}id-token: write/);
  });
});
