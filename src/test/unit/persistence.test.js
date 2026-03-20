import { describe, it, expect } from 'vitest';
import {
  compareVersions,
  countObjects,
  hasLocalOnlyWork,
  createRecoveredProject,
  mergeProjectLists,
} from '../../utils/projectPersistence';

// ─── helpers ────────────────────────────────────────────────────────────────

const makeProject = (id, updatedAt, objectsPerScene = 0) => ({
  id,
  name: `Project ${id}`,
  updatedAt,
  scenes: objectsPerScene > 0
    ? [{ id: 'scene-1', objects: Array.from({ length: objectsPerScene }, (_, i) => ({ id: `obj-${i}` })) }]
    : [],
});

// ─── compareVersions ────────────────────────────────────────────────────────

describe('compareVersions', () => {
  it('returns cloud_newer when cloud has higher updatedAt', () => {
    expect(compareVersions({ updatedAt: 2000 }, { updatedAt: 1000 })).toBe('cloud_newer');
  });

  it('returns local_newer when local has higher updatedAt', () => {
    expect(compareVersions({ updatedAt: 1000 }, { updatedAt: 2000 })).toBe('local_newer');
  });

  it('returns in_sync when timestamps are equal', () => {
    expect(compareVersions({ updatedAt: 1500 }, { updatedAt: 1500 })).toBe('in_sync');
  });

  it('treats missing updatedAt as 0 (oldest possible)', () => {
    expect(compareVersions({ updatedAt: 1 }, {})).toBe('cloud_newer');
    expect(compareVersions({}, { updatedAt: 1 })).toBe('local_newer');
    expect(compareVersions({}, {})).toBe('in_sync');
  });

  it('treats null project as timestamp 0', () => {
    expect(compareVersions(null, { updatedAt: 5 })).toBe('local_newer');
    expect(compareVersions({ updatedAt: 5 }, null)).toBe('cloud_newer');
    expect(compareVersions(null, null)).toBe('in_sync');
  });
});

// ─── countObjects ────────────────────────────────────────────────────────────

describe('countObjects', () => {
  it('returns 0 for null / empty project', () => {
    expect(countObjects(null)).toBe(0);
    expect(countObjects({})).toBe(0);
    expect(countObjects({ scenes: [] })).toBe(0);
  });

  it('sums objects across all scenes', () => {
    const project = {
      scenes: [
        { objects: [{ id: 'a' }, { id: 'b' }] },
        { objects: [{ id: 'c' }] },
      ],
    };
    expect(countObjects(project)).toBe(3);
  });

  it('handles scenes with no objects array', () => {
    const project = { scenes: [{ id: 'sc' }] };
    expect(countObjects(project)).toBe(0);
  });
});

// ─── hasLocalOnlyWork ────────────────────────────────────────────────────────

describe('hasLocalOnlyWork', () => {
  it('returns false when local project has no objects', () => {
    const cloud = makeProject('p1', 1000, 5);
    const local = makeProject('p1', 2000, 0);
    expect(hasLocalOnlyWork(cloud, local)).toBe(false);
  });

  it('returns false when difference is ≤ 1 object', () => {
    const cloud = makeProject('p1', 2000, 3);
    const local = makeProject('p1', 1000, 4); // only 1 more
    expect(hasLocalOnlyWork(cloud, local)).toBe(false);
  });

  it('returns true when local has substantially more objects than cloud', () => {
    const cloud = makeProject('p1', 2000, 0);
    const local = makeProject('p1', 1000, 5);
    expect(hasLocalOnlyWork(cloud, local)).toBe(true);
  });

  it('returns true when cloud has no scenes but local has several objects', () => {
    const cloud = makeProject('p1', 2000); // no scenes
    const local = makeProject('p1', 1000, 4);
    expect(hasLocalOnlyWork(cloud, local)).toBe(true);
  });

  it('returns false when both have similar counts', () => {
    const cloud = makeProject('p1', 2000, 5);
    const local = makeProject('p1', 1000, 5);
    expect(hasLocalOnlyWork(cloud, local)).toBe(false);
  });
});

// ─── createRecoveredProject ──────────────────────────────────────────────────

describe('createRecoveredProject', () => {
  it('prefixes name with "Recovered:"', () => {
    const p = makeProject('abc', 1000, 2);
    const r = createRecoveredProject(p);
    expect(r.name).toBe('Recovered: Project abc');
  });

  it('generates a new unique id', () => {
    const p = makeProject('abc', 1000);
    const r = createRecoveredProject(p);
    expect(r.id).not.toBe(p.id);
    expect(r.id).toContain('recovered-abc-');
  });

  it('sets isRecovered flag', () => {
    const r = createRecoveredProject(makeProject('x', 0));
    expect(r.isRecovered).toBe(true);
  });

  it('preserves scenes from original project', () => {
    const p = makeProject('abc', 1000, 3);
    const r = createRecoveredProject(p);
    expect(r.scenes).toEqual(p.scenes);
  });
});

// ─── mergeProjectLists ───────────────────────────────────────────────────────

describe('mergeProjectLists', () => {
  it('returns local list when cloud is empty/null', () => {
    const local = [makeProject('p1', 1000, 2)];
    expect(mergeProjectLists(null, local)).toEqual({ merged: local, recovered: [] });
    expect(mergeProjectLists([], local)).toEqual({ merged: local, recovered: [] });
  });

  it('returns cloud list when local is empty/null', () => {
    const cloud = [makeProject('p1', 2000, 2)];
    expect(mergeProjectLists(cloud, null)).toEqual({ merged: cloud, recovered: [] });
    expect(mergeProjectLists(cloud, [])).toEqual({ merged: cloud, recovered: [] });
  });

  it('picks local project when local is newer', () => {
    const cloud = [makeProject('p1', 1000, 2)];
    const local = [makeProject('p1', 2000, 4)];
    const { merged, recovered } = mergeProjectLists(cloud, local);
    expect(merged[0].updatedAt).toBe(2000);
    expect(recovered).toHaveLength(0);
  });

  it('picks cloud project when cloud is newer', () => {
    const cloud = [makeProject('p1', 2000, 2)];
    const local = [makeProject('p1', 1000, 2)];
    const { merged, recovered } = mergeProjectLists(cloud, local);
    expect(merged[0].updatedAt).toBe(2000);
    expect(recovered).toHaveLength(0);
  });

  it('picks cloud when in_sync (same timestamp)', () => {
    const cloud = [makeProject('p1', 1500, 3)];
    const local = [makeProject('p1', 1500, 3)];
    const { merged } = mergeProjectLists(cloud, local);
    expect(merged[0].updatedAt).toBe(1500);
  });

  it('emits recovery copy when cloud is newer but local has unsynced work', () => {
    const cloud = [makeProject('p1', 2000, 0)];  // cloud has no objects
    const local = [makeProject('p1', 1000, 5)];  // local has 5 objects
    const { merged, recovered } = mergeProjectLists(cloud, local);
    // Cloud version is used (newer timestamp)
    expect(merged[0].updatedAt).toBe(2000);
    // But a recovery copy was created for the local work
    expect(recovered).toHaveLength(1);
    expect(recovered[0].name).toBe('Recovered: Project p1');
    expect(recovered[0].isRecovered).toBe(true);
  });

  it('does NOT emit recovery copy when local wins (local is newer)', () => {
    const cloud = [makeProject('p1', 1000, 0)];
    const local = [makeProject('p1', 2000, 5)];  // local wins anyway
    const { recovered } = mergeProjectLists(cloud, local);
    expect(recovered).toHaveLength(0);
  });

  it('keeps local-only projects (not in cloud)', () => {
    const cloud = [makeProject('cloud-only', 2000, 1)];
    const local = [makeProject('local-only', 1000, 1)];
    const { merged } = mergeProjectLists(cloud, local);
    const ids = merged.map(p => p.id);
    expect(ids).toContain('cloud-only');
    expect(ids).toContain('local-only');
  });

  it('keeps cloud-only projects (not in local)', () => {
    const cloud = [makeProject('p1', 2000, 1), makeProject('p2', 1000, 1)];
    const local = [makeProject('p1', 1500, 1)];
    const { merged } = mergeProjectLists(cloud, local);
    expect(merged.some(p => p.id === 'p2')).toBe(true);
  });

  it('handles multiple projects with mixed scenarios', () => {
    const cloud = [
      makeProject('a', 3000, 2), // cloud newer
      makeProject('b', 1000, 0), // cloud newer but local has work → recovery
      makeProject('c', 1000, 1), // cloud only
    ];
    const local = [
      makeProject('a', 2000, 2), // local older → cloud wins, no recovery (same obj count)
      makeProject('b', 500,  4), // local older but has work → recovery emitted
      makeProject('d', 9000, 3), // local only → kept
    ];
    const { merged, recovered } = mergeProjectLists(cloud, local);

    // 'a' → cloud wins (newer, same object count → no recovery)
    expect(merged.find(p => p.id === 'a').updatedAt).toBe(3000);
    // 'b' → cloud wins (newer), local had 4 objects vs cloud 0 → recovery
    expect(merged.find(p => p.id === 'b').updatedAt).toBe(1000);
    // 'c' → cloud-only
    expect(merged.find(p => p.id === 'c')).toBeTruthy();
    // 'd' → local-only
    expect(merged.find(p => p.id === 'd')).toBeTruthy();
    // One recovery copy for 'b'
    expect(recovered).toHaveLength(1);
    expect(recovered[0].name).toContain('Recovered: Project b');
  });
});
