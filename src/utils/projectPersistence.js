/**
 * projectPersistence.js
 *
 * Version-aware merge utilities for cloud ↔ local project data.
 *
 * Each project object may carry an `updatedAt` Unix-ms timestamp that is
 * written by App.jsx on every save.  These helpers use that field to decide
 * which copy of a project wins when both cloud and local copies exist.
 *
 * Recovery slot: when cloud is authoritative but local contains work that
 * is NOT reflected in the cloud version, we clone the local project under a
 * "Recovered: …" name so the user never silently loses data.
 */

/**
 * Compare two project versions by their `updatedAt` timestamps.
 *
 * @param {object|null} cloudProject
 * @param {object|null} localProject
 * @returns {'cloud_newer'|'local_newer'|'in_sync'}
 */
export function compareVersions(cloudProject, localProject) {
  const cloudAt = cloudProject?.updatedAt ?? 0;
  const localAt = localProject?.updatedAt ?? 0;
  if (cloudAt > localAt) return 'cloud_newer';
  if (localAt > cloudAt) return 'local_newer';
  return 'in_sync';
}

/**
 * Count the total number of objects across all scenes in a project.
 *
 * @param {object|null} project
 * @returns {number}
 */
export function countObjects(project) {
  if (!project?.scenes?.length) return 0;
  return project.scenes.reduce((sum, sc) => sum + (sc.objects?.length ?? 0), 0);
}

/**
 * Return true when the local project has substantially more 3-D content than
 * the cloud version — used to decide whether to emit a recovery copy before
 * the cloud version overwrites local state.
 *
 * "Substantially more" means at least 2 extra objects.  This threshold avoids
 * false positives caused by a single default primitive.
 *
 * @param {object|null} cloudProject
 * @param {object|null} localProject
 * @returns {boolean}
 */
export function hasLocalOnlyWork(cloudProject, localProject) {
  const localCount = countObjects(localProject);
  if (localCount === 0) return false;
  const cloudCount = countObjects(cloudProject);
  return localCount > cloudCount + 1;
}

/**
 * Create a recovery copy of a project prefixed with "Recovered:".
 * The copy gets a new unique ID so it cannot collide with the original.
 *
 * @param {object} project
 * @returns {object}
 */
export function createRecoveredProject(project) {
  return {
    ...project,
    id: `recovered-${project.id}-${Date.now()}`,
    name: `Recovered: ${project.name}`,
    updatedAt: Date.now(),
    isRecovered: true,
  };
}

/**
 * Merge cloud and local project arrays, choosing the newer version of each
 * project by ID.  Projects present in only one source are kept as-is.
 *
 * Side-effect: when cloud wins over a local project that contains work not
 * reflected in the cloud copy, a recovery clone is emitted in `recovered`.
 *
 * @param {object[]|null} cloudProjects
 * @param {object[]|null} localProjects
 * @returns {{ merged: object[], recovered: object[] }}
 */
export function mergeProjectLists(cloudProjects, localProjects) {
  const cloudList = Array.isArray(cloudProjects) ? cloudProjects : [];
  const localList = Array.isArray(localProjects) ? localProjects : [];

  if (!cloudList.length) return { merged: localList, recovered: [] };
  if (!localList.length) return { merged: cloudList, recovered: [] };

  const cloudById = Object.fromEntries(cloudList.map(p => [p.id, p]));
  const localById = Object.fromEntries(localList.map(p => [p.id, p]));
  const allIds = [...new Set([...cloudList.map(p => p.id), ...localList.map(p => p.id)])];

  const recovered = [];
  const merged = allIds.map(id => {
    const cloud = cloudById[id];
    const local = localById[id];

    if (!cloud) return local;  // local-only project
    if (!local) return cloud;  // cloud-only project

    const verdict = compareVersions(cloud, local);

    if (verdict === 'local_newer') {
      // Local is the authoritative version — no recovery needed.
      return local;
    }

    // cloud_newer or in_sync → cloud wins.
    // Before discarding local, check for unsynced work.
    if (hasLocalOnlyWork(cloud, local)) {
      recovered.push(createRecoveredProject(local));
    }
    return cloud;
  });

  return { merged, recovered };
}
