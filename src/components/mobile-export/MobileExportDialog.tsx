'use client';

/**
 * Dialog para exportar projeto como AAB (Android) ou IPA (iOS)
 */

import { useState } from 'react';
import type { Platform, BuildType, ProjectConfig } from '@/lib/mobile-builder/types';

interface MobileExportDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileExportDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
}: MobileExportDialogProps) {
  const [platform, setPlatform] = useState<Platform>('android');
  const [buildType, setBuildType] = useState<BuildType>('debug');
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [config, setConfig] = useState({
    bundleId: `com.myapp.${projectId}`,
    version: '1.0.0',
    versionCode: 1,
    description: '',
  });

  const handleExport = async () => {
    setIsBuilding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          buildType,
          config: {
            name: projectName,
            ...config,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Export failed');
      }

      if (result.status === 'success') {
        setSuccess(`Build concluído! Download iniciando...`);
        // Fazer download
        window.open(result.downloadUrl, '_blank');
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Build failed');
      } else {
        setSuccess('Build iniciado! Você será notificado quando estiver pronto.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsBuilding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Exportar para Mobile</h2>

        <div className="space-y-4">
          {/* Plataforma */}
          <div>
            <label className="block text-sm font-medium mb-2">Plataforma</label>
            <div className="flex gap-4">
              <button
                onClick={() => setPlatform('android')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  platform === 'android'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-lg font-semibold">Android</div>
                <div className="text-xs text-gray-600">App Bundle (AAB)</div>
              </button>
              <button
                onClick={() => setPlatform('ios')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  platform === 'ios'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-lg font-semibold">iOS</div>
                <div className="text-xs text-gray-600">IPA Package</div>
              </button>
            </div>
          </div>

          {/* Tipo de Build */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Build</label>
            <select
              value={buildType}
              onChange={(e) => setBuildType(e.target.value as BuildType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="debug">Debug (teste)</option>
              <option value="release">Release (publicação)</option>
            </select>
          </div>

          {/* Bundle ID */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Bundle ID / Package Name
            </label>
            <input
              type="text"
              value={config.bundleId}
              onChange={(e) => setConfig({ ...config, bundleId: e.target.value })}
              placeholder="com.myapp.myproject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Identificador único do app (ex: com.empresa.app)
            </p>
          </div>

          {/* Versão */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Versão</label>
              <input
                type="text"
                value={config.version}
                onChange={(e) => setConfig({ ...config, version: e.target.value })}
                placeholder="1.0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Version Code
              </label>
              <input
                type="number"
                value={config.versionCode}
                onChange={(e) =>
                  setConfig({ ...config, versionCode: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Descrição do aplicativo..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Avisos */}
          {buildType === 'release' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Build de release requer certificados e
                assinatura configurados.
              </p>
            </div>
          )}

          {platform === 'ios' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Build iOS requer macOS com Xcode instalado.
              </p>
            </div>
          )}

          {/* Mensagens */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isBuilding}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isBuilding}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBuilding ? 'Gerando...' : 'Exportar'}
          </button>
        </div>
      </div>
    </div>
  );
}
