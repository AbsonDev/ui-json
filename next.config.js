/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para exportação estática (necessário para Capacitor)
  output: 'export',
  // Desabilitar otimização de imagens para exportação estática
  images: {
    unoptimized: true,
  },
  // Manter configurações experimentais (sem server actions em modo estático)
}

export default nextConfig
