'use client';

/**
 * Componente para exibir o histórico de builds mobile de um app
 */

import { useState, useEffect } from 'react';
import { Download, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

interface Build {
  id: string;
  platform: string;
  buildType: string;
  status: string;
  bundleId: string;
  appVersion: string;
  versionCode: number;
  appName: string;
  downloadUrl?: string;
  fileSize?: number;
  fileName?: string;
  error?: string;
  buildDuration?: number;
  completedAt?: string;
  createdAt: string;
}

interface BuildHistoryProps {
  appId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BuildHistory({ appId, isOpen, onClose }: BuildHistoryProps) {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBuilds();
    }
  }, [isOpen, appId]);

  const fetchBuilds = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${appId}/export`);
      if (!response.ok) {
        throw new Error('Failed to fetch builds');
      }

      const data = await response.json();
      setBuilds(data.builds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load builds');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'building':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      building: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const styles = {
      android: 'bg-green-50 text-green-700 border-green-200',
      ios: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
      <span className={`px-2 py-1 rounded border text-xs font-medium ${styles[platform as keyof typeof styles]}`}>
        {platform === 'android' ? 'Android' : 'iOS'}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Builds</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visualize todos os builds mobile gerados para este app
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600">Carregando builds...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchBuilds}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : builds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum build realizado ainda</p>
              <p className="text-sm text-gray-400 mt-1">
                Clique em "Exportar para Mobile" para criar seu primeiro build
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {builds.map((build) => (
                <div
                  key={build.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(build.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{build.appName}</h3>
                          {getPlatformBadge(build.platform)}
                          {getStatusBadge(build.status)}
                          <span className="text-xs text-gray-500">
                            {build.buildType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div>
                            <span className="text-gray-600">Bundle ID:</span>{' '}
                            <span className="font-mono text-xs">{build.bundleId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Versão:</span>{' '}
                            <span className="font-semibold">{build.appVersion}</span>
                            <span className="text-gray-500"> (code {build.versionCode})</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Criado:</span>{' '}
                            <span>{formatDate(build.createdAt)}</span>
                          </div>
                          {build.completedAt && (
                            <div>
                              <span className="text-gray-600">Concluído:</span>{' '}
                              <span>{formatDate(build.completedAt)}</span>
                            </div>
                          )}
                          {build.fileSize && (
                            <div>
                              <span className="text-gray-600">Tamanho:</span>{' '}
                              <span>{formatFileSize(build.fileSize)}</span>
                            </div>
                          )}
                          {build.buildDuration && (
                            <div>
                              <span className="text-gray-600">Duração:</span>{' '}
                              <span>{formatDuration(build.buildDuration)}</span>
                            </div>
                          )}
                        </div>

                        {build.error && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">
                              <strong>Erro:</strong> {build.error}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {build.status === 'success' && build.downloadUrl && (
                      <a
                        href={build.downloadUrl}
                        download
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {builds.length} build{builds.length !== 1 ? 's' : ''} encontrado{builds.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
