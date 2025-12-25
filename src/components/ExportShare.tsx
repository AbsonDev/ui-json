'use client'

import React, { useState } from 'react';
import { Download, Share2, QrCode, Code, Link2, X, Check, Copy } from 'lucide-react';

interface ExportShareProps {
  appName: string;
  appJson: string;
  appId: string;
}

export const ExportShareDialog: React.FC<ExportShareProps & { onClose: () => void }> = ({
  appName,
  appJson,
  appId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'qrcode' | 'link' | 'export'>('qrcode');
  const [copied, setCopied] = useState(false);

  // Generate QR Code (simplified - in production use a library like qrcode.react)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
    `${window.location.origin}/preview/${appId}`
  )}`;

  const shareUrl = `${window.location.origin}/preview/${appId}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([appJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportReactNative = () => {
    const reactNativeCode = generateReactNativeCode(appJson, appName);
    const blob = new Blob([reactNativeCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}.tsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    const htmlCode = generateHTMLCode(appJson, appName);
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Export & Share</h3>
              <p className="text-gray-600 mt-1">{appName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'qrcode'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <QrCode size={18} />
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'link'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Link2 size={18} />
              Share Link
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'export'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Download size={18} />
              Export Code
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'qrcode' && (
            <div className="text-center">
              <p className="text-gray-700 mb-6">
                Escaneie o QR Code para testar seu app no celular
              </p>
              <div className="inline-block p-4 bg-white border-4 border-gray-200 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Aponte a câmera do seu celular para o QR Code
              </p>
            </div>
          )}

          {activeTab === 'link' && (
            <div>
              <p className="text-gray-700 mb-4">
                Compartilhe o link público do seu app:
              </p>
              <div className="flex items-center gap-2 mb-6">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                />
                <button
                  onClick={() => handleCopy(shareUrl)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Dica:</h4>
                <p className="text-sm text-blue-800">
                  O link é público e qualquer pessoa pode acessar. Perfeito para mostrar seu app para
                  clientes, amigos ou equipe!
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Confira meu app: ${shareUrl}`)}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  📱 Compartilhar no WhatsApp
                </button>
                <button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Confira meu app criado com UI-JSON: ${shareUrl}`)}`)}
                  className="px-4 py-2 bg-blue-400 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                >
                  🐦 Compartilhar no Twitter
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div>
              <p className="text-gray-700 mb-6">
                Exporte seu app para diferentes formatos:
              </p>

              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">JSON File</h4>
                      <p className="text-sm text-gray-600">Arquivo JSON puro do seu app</p>
                    </div>
                    <button
                      onClick={handleExportJSON}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center gap-2"
                    >
                      <Download size={18} />
                      Export JSON
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">React Native</h4>
                      <p className="text-sm text-gray-600">Código TypeScript pronto para usar</p>
                    </div>
                    <button
                      onClick={handleExportReactNative}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Code size={18} />
                      Export React Native
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">HTML Standalone</h4>
                      <p className="text-sm text-gray-600">Arquivo HTML com tudo embutido</p>
                    </div>
                    <button
                      onClick={handleExportHTML}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={18} />
                      Export HTML
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Nota:</h4>
                <p className="text-sm text-yellow-800">
                  Os exports de código são gerados automaticamente e podem precisar de ajustes
                  dependendo do seu ambiente de desenvolvimento.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper: Generate React Native Code
function generateReactNativeCode(jsonString: string, appName: string): string {
  return `// Generated by UI-JSON Visualizer
// App: ${appName}
// Date: ${new Date().toISOString()}

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

const appData = ${jsonString};

export default function ${appName.replace(/\s+/g, '')}App() {
  const [currentScreen, setCurrentScreen] = useState(appData.initialScreen);

  const screen = appData.screens[currentScreen];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.screen}>
        <Text style={styles.title}>{screen.title}</Text>
        {/* TODO: Render components dynamically */}
        {/* This is a starter template - implement component rendering */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appData.app.theme?.backgroundColor || '#fff',
  },
  screen: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: appData.app.theme?.textColor || '#000',
  },
});
`;
}

// Helper: Generate HTML Code
function generateHTMLCode(jsonString: string, appName: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${appName}</h1>
    <p>Generated by UI-JSON Visualizer</p>
    <pre id="app-data" style="display:none;">${jsonString.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    <!-- TODO: Add renderer logic -->
  </div>

  <script>
    // App data
    const appData = ${jsonString};
    console.log('App loaded:', appData);

    // TODO: Implement rendering logic
  </script>
</body>
</html>
`;
}

// Export button component for dashboard
export const ExportShareButton: React.FC<ExportShareProps> = (props) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
        title="Export & Share"
      >
        <Share2 size={16} />
        Share
      </button>

      {showDialog && (
        <ExportShareDialog {...props} onClose={() => setShowDialog(false)} />
      )}
    </>
  );
};
