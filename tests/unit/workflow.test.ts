import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const yml = readFileSync('.github/workflows/deploy.yml', 'utf8').replace(/\r\n/g, '\n');
const [top, jobs] = yml.split('\njobs:\n');
const deployJob = jobs.slice(jobs.indexOf('\n  deploy:'));
const buildJob = jobs.slice(0, jobs.indexOf('\n  deploy:'));

// build de macOS e Linux deste repositório (público: minutos de graça), a partir do código-fonte publicado no release
describe('macOS and Linux build workflow', () => {
  const path = '.github/workflows/build-mac-linux.yml';
  const wf = existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : '';
  const [head, body = ''] = wf.split('\njobs:\n');
  const publish = body.slice(body.indexOf('\n  publish:'));
  const build = body.slice(0, body.indexOf('\n  publish:'));
  it('only runs when someone with write access asks for it (never for a pull request)', () => {
    expect(head).toMatch(/on:\n {2}workflow_dispatch:/);
    expect(head).not.toMatch(/\n {2}(push|pull_request|pull_request_target|schedule):/);
  });
  it('builds from the published source zip, checked by its SHA-256 before compiling', () => {
    expect(build).toMatch(/MAW-\$V-source\.zip/);
    const check = build.search(/sha256/);
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(build.indexOf('cmake -S'));
  });
  it('stamps the release version before configuring, so the packages are not development builds', () => {
    const stamp = build.indexOf('MawVersion.h');
    expect(stamp).toBeGreaterThan(-1);
    expect(stamp).toBeLessThan(build.indexOf('cmake -S'));
  });
  it('makes one universal Mac app for macOS 11+, with the AI server inside the bundle and signed again', () => {
    expect(build).toContain('-DCMAKE_OSX_ARCHITECTURES=arm64;x86_64');
    expect(build).toContain('-DCMAKE_OSX_DEPLOYMENT_TARGET=11.0');
    expect(build).toMatch(/Contents\/Resources/);
    expect(build).toMatch(/codesign --force --deep --sign -/);
  });
  it('runs the MAW suite on both systems before packaging', () => {
    expect(build).toContain('--run-tests');
    expect(build.indexOf('--run-tests')).toBeLessThan(build.indexOf('tar czf'));
  });
  it('builds the Mac on a runner GitHub still offers (macos-14 was retired)', () => {
    expect(build).toMatch(/os: macos-1[5-9]|os: macos-latest/);
    expect(build).not.toMatch(/os: macos-14\b/);
  });
  it('never replaces a package that is already published: running it again only fills what is missing', () => {
    expect(publish).toMatch(/já publicado/);
  });
  it('gives write access only to the job that attaches the packages, which then republishes the site', () => {
    expect(head).toMatch(/permissions:\n {2}contents: read\n/);
    expect(build).not.toMatch(/contents: write/);
    expect(publish).toMatch(/contents: write/);
    expect(publish).toMatch(/gh workflow run deploy\.yml/);
  });
});

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
