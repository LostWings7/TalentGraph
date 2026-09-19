/**
 * formatters.test.js
 *
 * Tests for safe polymorphic extractors in formatters.js.
 *
 * WHY THESE TESTS EXIST:
 * The Django backend can return skill/department fields as either plain strings
 * OR {id, name} / {skill_name, ...} objects depending on the endpoint and
 * serializer. When these objects reach React as `key=` props or JSX children
 * they stringify to "[object Object]", causing:
 *   - duplicate key warnings (key={[object Object]})
 *   - "Objects are not valid as a React child" crashes
 *
 * These tests pin the expected normalisation behaviour so future API changes
 * or new rendering sites are caught immediately.
 */

import { describe, it, expect } from 'vitest';
import { getSkillLabel, getSkillId, getProficiencyLabel, getDeptLabel } from './formatters';

// ---------------------------------------------------------------------------
// getSkillLabel
// ---------------------------------------------------------------------------
describe('getSkillLabel', () => {
  it('returns empty string for null/undefined', () => {
    expect(getSkillLabel(null)).toBe('');
    expect(getSkillLabel(undefined)).toBe('');
  });

  it('returns a plain string as-is', () => {
    expect(getSkillLabel('Python')).toBe('Python');
  });

  it('extracts .skill_name from an object', () => {
    expect(getSkillLabel({ skill_name: 'React', id: 1 })).toBe('React');
  });

  it('extracts .name from a {id, name} object (backend departments/skills shape)', () => {
    expect(getSkillLabel({ id: 7, name: 'Data Engineering' })).toBe('Data Engineering');
  });

  it('extracts .title from an object', () => {
    expect(getSkillLabel({ title: 'Leadership' })).toBe('Leadership');
  });

  it('extracts nested skill.name', () => {
    expect(getSkillLabel({ skill: { name: 'TypeScript' } })).toBe('TypeScript');
  });

  it('extracts nested skill string', () => {
    expect(getSkillLabel({ skill: 'Kubernetes' })).toBe('Kubernetes');
  });

  it('falls back to "Capability" for an unrecognised object shape', () => {
    expect(getSkillLabel({ foo: 'bar' })).toBe('Capability');
  });
});

// ---------------------------------------------------------------------------
// getSkillId
// ---------------------------------------------------------------------------
describe('getSkillId', () => {
  it('returns a prefixed fallback for null/undefined', () => {
    expect(getSkillId(null, 3)).toBe('skill-3');
    expect(getSkillId(undefined, 0)).toBe('skill-0');
  });

  it('builds a stable key from a plain string', () => {
    expect(getSkillId('Python', 2)).toBe('skill-Python-2');
  });

  it('uses .skill_id when present', () => {
    expect(getSkillId({ skill_id: 42, name: 'Go' }, 0)).toBe('skill-42');
  });

  it('uses .id when skill_id is absent', () => {
    expect(getSkillId({ id: 9, name: 'Rust' }, 0)).toBe('skill-9');
  });

  it('uses nested skill.id', () => {
    expect(getSkillId({ skill: { id: 5, name: 'Scala' } }, 1)).toBe('skill-5');
  });

  it('falls back to label+index for unresolvable objects', () => {
    const result = getSkillId({ title: 'Agility' }, 4);
    expect(result).toBe('skill-Agility-4');
  });

  // Critical regression: object key must never be "[object Object]"
  it('never produces "[object Object]" as a key segment', () => {
    const id = getSkillId({ id: 7, name: 'MLOps' }, 0);
    expect(id).not.toContain('[object Object]');
  });
});

// ---------------------------------------------------------------------------
// getProficiencyLabel
// ---------------------------------------------------------------------------
describe('getProficiencyLabel', () => {
  it('returns default for null/undefined', () => {
    expect(getProficiencyLabel(null)).toBe('Intermediate');
    expect(getProficiencyLabel(undefined)).toBe('Intermediate');
  });

  it('returns default for a plain string item (item is not an object)', () => {
    expect(getProficiencyLabel('Advanced', 'Beginner')).toBe('Beginner');
  });

  it('extracts .proficiency', () => {
    expect(getProficiencyLabel({ proficiency: 'Advanced' })).toBe('Advanced');
  });

  it('prefers .required_proficiency over .proficiency', () => {
    expect(getProficiencyLabel({ required_proficiency: 'Expert', proficiency: 'Beginner' })).toBe('Expert');
  });

  it('falls through chain: minimum → candidate → proficiency', () => {
    expect(getProficiencyLabel({ minimum_proficiency: 'Intermediate' })).toBe('Intermediate');
    expect(getProficiencyLabel({ candidate_proficiency: 'Advanced' })).toBe('Advanced');
  });

  it('uses custom defaultLevel', () => {
    expect(getProficiencyLabel({ foo: 'bar' }, 'Beginner')).toBe('Beginner');
  });
});

// ---------------------------------------------------------------------------
// getDeptLabel  (new helper — guards department {id, name} objects)
// ---------------------------------------------------------------------------
describe('getDeptLabel', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(getDeptLabel(null)).toBe('');
    expect(getDeptLabel(undefined)).toBe('');
    expect(getDeptLabel('')).toBe('');
  });

  it('returns plain string as-is', () => {
    expect(getDeptLabel('Engineering')).toBe('Engineering');
  });

  // Regression: exact shape returned by /roles/departments/ endpoint
  it('extracts .name from {id, name} object', () => {
    expect(getDeptLabel({ id: 1, name: 'Engineering' })).toBe('Engineering');
    expect(getDeptLabel({ id: 2, name: 'Product' })).toBe('Product');
  });

  it('falls back to .id when .name is absent', () => {
    expect(getDeptLabel({ id: 'hr' })).toBe('hr');
  });

  it('returns empty string for object with neither id nor name', () => {
    expect(getDeptLabel({ foo: 'bar' })).toBe('');
  });

  // Critical: must NEVER produce "[object Object]"
  it('never produces "[object Object]"', () => {
    const label = getDeptLabel({ id: 3, name: 'Finance' });
    expect(label).not.toBe('[object Object]');
    expect(label).toBe('Finance');
  });
});
