import React, { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import useStore from '../useStore';
import { fetchProjects } from '../apiClient';

export default function SyncButton({ user }) {
  const loadProject = useStore(s => s.loadProject);

  const performSync = useCallback(async () => {
    if (!user?.credential) return;
    try {
      const data = await fetchProjects(user.credential);
      if (data?.projects) {
        // Favor DB source of truth: compare and sync.
        // For now, reload the active project structure from synced data.
        const projects = data.projects;
        const activeProjectId = JSON.parse(localStorage.getItem('sculpt3d_active_project') || '"proj-default"');
        const active = projects.find(p => p.id === activeProjectId) || projects[0];

        if (active?.scenes) {
          loadProject(active.scenes, active.activeSceneId || active.scenes[0]?.id);
          localStorage.setItem('sculpt3d_projects', JSON.stringify(projects));
        }
        alert('Sync successful!');
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
      alert('Sync failed: ' + err.message);
    }
  }, [user?.credential, loadProject]);

  return (
    <button
      onClick={performSync}
      className="flex items-center gap-2 p-2 hover:bg-[#333] rounded-lg text-sm text-gray-400 hover:text-white transition-all"
    >
      <RefreshCw size={16} /> Sync Cloud
    </button>
  );
}
