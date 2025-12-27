'use client'

import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, X, GitBranch, Calendar, Check } from 'lucide-react';

interface AppVersion {
  id: string;
  version: number;
  json: string;
  timestamp: Date;
  message?: string;
}

interface VersionHistoryProps {
  appId: string;
  currentJson: string;
  onRestore: (json: string) => void;
}

export const VersionHistoryDialog: React.FC<VersionHistoryProps & { onClose: () => void }> = ({
  appId,
  currentJson,
  onRestore,
  onClose,
}) => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<AppVersion | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [appId]);

  const loadVersions = () => {
    // Load from localStorage (in production, this would be from database)
    const storedVersions = localStorage.getItem(`app_versions_${appId}`);
    if (storedVersions) {
      const parsed = JSON.parse(storedVersions);
      setVersions(parsed.map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) })));
    }
  };

  const handleRestore = (version: AppVersion) => {
    if (confirm(`Restaurar para a versão ${version.version}? As alterações não salvas serão perdidas.`)) {
      onRestore(version.json);
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getJsonDiff = (oldJson: string, newJson: string) => {
    try {
      const oldObj = JSON.parse(oldJson);
      const newObj = JSON.parse(newJson);

      // Simple diff - count differences
      const oldStr = JSON.stringify(oldObj, null, 2);
      const newStr = JSON.stringify(newObj, null, 2);

      const oldLines = oldStr.split('\n');
      const newLines = newStr.split('\n');

      let additions = 0;
      let deletions = 0;

      if (newLines.length > oldLines.length) {
        additions = newLines.length - oldLines.length;
      } else {
        deletions = oldLines.length - newLines.length;
      }

      return { additions, deletions };
    } catch {
      return { additions: 0, deletions: 0 };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" size={28} />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Version History</h3>
                <p className="text-gray-600">Restore previous versions of your app</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Versions List */}
          <div className="w-1/2 border-r overflow-y-auto">
            {versions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <GitBranch className="mx-auto mb-4 text-gray-400" size={48} />
                <p>No version history yet</p>
                <p className="text-sm mt-2">Versions are saved automatically as you edit</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {versions.map((version, idx) => {
                  const isSelected = selectedVersion?.id === version.id;
                  const isCurrent = idx === 0;
                  const diff = idx < versions.length - 1
                    ? getJsonDiff(versions[idx + 1].json, version.json)
                    : { additions: 0, deletions: 0 };

                  return (
                    <div
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">v{version.version}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                              Current
                            </span>
                          )}
                        </div>
                        {!isCurrent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(version);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar size={14} />
                        <span>{formatDate(version.timestamp)}</span>
                      </div>

                      {version.message && (
                        <p className="text-sm text-gray-700 mb-2">{version.message}</p>
                      )}

                      {(diff.additions > 0 || diff.deletions > 0) && (
                        <div className="flex items-center gap-3 text-xs">
                          {diff.additions > 0 && (
                            <span className="text-green-600">+{diff.additions} lines</span>
                          )}
                          {diff.deletions > 0 && (
                            <span className="text-red-600">-{diff.deletions} lines</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="w-1/2 overflow-y-auto">
            {selectedVersion ? (
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Version {selectedVersion.version}</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedVersion.timestamp)}</p>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(JSON.parse(selectedVersion.json), null, 2)}
                  </pre>
                </div>

                {selectedVersion.id !== versions[0]?.id && (
                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    Restore This Version
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <GitBranch size={48} className="mx-auto mb-4" />
                  <p>Select a version to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 Tip: Versions are automatically saved when you make changes
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage version history
export const useVersionHistory = (appId: string, currentJson: string) => {
  const saveVersion = (message?: string) => {
    const versionsKey = `app_versions_${appId}`;
    const storedVersions = localStorage.getItem(versionsKey);
    const versions: AppVersion[] = storedVersions ? JSON.parse(storedVersions) : [];

    const newVersion: AppVersion = {
      id: `v_${Date.now()}`,
      version: versions.length + 1,
      json: currentJson,
      timestamp: new Date(),
      message,
    };

    // Keep only last 10 versions
    const updatedVersions = [newVersion, ...versions].slice(0, 10);
    localStorage.setItem(versionsKey, JSON.stringify(updatedVersions));
  };

  useEffect(() => {
    // Auto-save version every 5 minutes if there are changes
    const interval = setInterval(() => {
      if (currentJson) {
        saveVersion('Auto-saved version');
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentJson, appId]);

  return { saveVersion };
};

// Button component
export const VersionHistoryButton: React.FC<VersionHistoryProps> = (props) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        title="Version History"
      >
        <Clock size={20} />
      </button>

      {showDialog && (
        <VersionHistoryDialog {...props} onClose={() => setShowDialog(false)} />
      )}
    </>
  );
};
