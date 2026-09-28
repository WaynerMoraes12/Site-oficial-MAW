import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const yml = readFileSync('.github/workflows/deploy.yml', 'utf8').replace(/\r\n/g, '\n');
const [top, jobs] = yml.split('\njobs:\n');
const deployJob = jobs.slice(jobs.indexOf('\n  deploy:'));
const buildJob = jobs.slice(0, jobs.indexOf('\n  deploy:'));

describe('deploy workflow', () => {
  it('publishes by hand and on every push to main (the daily sync keeps the site current)', () => {
    expect(top).toMatch(/on:\n {2}push:\n {4}branches: \[main\]\n {2}workflow_dispatch:/);
    expect(top).not.toMatch(/\n {2}(pull_request|schedule):/);
  });
  it('ships "coming soon" instead of a broken download while the installer is not public', () => {
    const fallback = buildJob.search(/node tools\/check-release\.mjs \|\| .*rm -f src\/data\/release\.json/);
    expect(fallback).toBeGreaterThan(-1);
    expect(fallback).toBeLessThan(buildJob.indexOf('npm run build'));
  });
  it('gives the build job read-only access', () => {
    expect(top).toMatch(/permissions:\n {2}contents: read\n/);
    expect(top + buildJob).not.toMatch(/pages: write|id-token: write/);
  });
  it('lets only the deploy job publish to Pages', () => {
    expect(deployJob).toMatch(/permissions:\n {6}pages: write\n {6}id-token: write/);
  });
});
