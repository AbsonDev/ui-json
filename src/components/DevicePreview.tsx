'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Tablet, Monitor, RotateCw } from 'lucide-react'

export type DeviceType = 'iphone-se' | 'iphone-14' | 'iphone-14-pro-max' | 'ipad' | 'desktop'
export type Orientation = 'portrait' | 'landscape'

interface Device {
  id: DeviceType
  name: string
  width: number
  height: number
  icon: typeof Smartphone
}

const DEVICES: Device[] = [
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, icon: Smartphone },
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, icon: Smartphone },
  { id: 'iphone-14-pro-max', name: 'iPhone 14 Pro Max', width: 430, height: 932, icon: Smartphone },
  { id: 'ipad', name: 'iPad', width: 768, height: 1024, icon: Tablet },
  { id: 'desktop', name: 'Desktop', width: 1024, height: 768, icon: Monitor },
]

interface DevicePreviewProps {
  children: React.ReactNode
  backgroundColor?: string
}

export const DevicePreview: React.FC<DevicePreviewProps> = ({
  children,
  backgroundColor = '#FFFFFF',
}) => {
  const [device, setDevice] = useState<DeviceType>('iphone-14')
  const [orientation, setOrientation] = useState<Orientation>('portrait')

  const currentDevice = DEVICES.find(d => d.id === device) || DEVICES[1]
  const width = orientation === 'portrait' ? currentDevice.width : currentDevice.height
  const height = orientation === 'portrait' ? currentDevice.height : currentDevice.width

  const toggleOrientation = () => {
    setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Device Selector */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          {DEVICES.map((d) => {
            const Icon = d.icon
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  device === d.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title={d.name}
              >
                {device === d.id && (
                  <motion.div
                    layoutId="activeDevice"
                    className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-md"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative flex items-center gap-1.5">
                  <Icon size={16} />
                  <span className="hidden sm:inline">{d.name.split(' ')[0]}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Dimensions Display */}
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
            {width} × {height}
          </div>

          {/* Rotation Button */}
          {device !== 'desktop' && (
            <motion.button
              onClick={toggleOrientation}
              className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              whileTap={{ rotate: 90 }}
              title={`Rotate to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
            >
              <RotateCw size={16} className="text-gray-600 dark:text-gray-400" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden relative flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${device}-${orientation}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative"
            style={{
              width: device === 'desktop' ? '100%' : `${width}px`,
              height: device === 'desktop' ? '100%' : `${height}px`,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            {/* Device Frame */}
            {device !== 'desktop' && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  border: '12px solid #1a1a1a',
                  borderRadius: '40px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset',
                }}
              >
                {/* Notch (only for iPhone 14 and Pro Max in portrait) */}
                {(device === 'iphone-14' || device === 'iphone-14-pro-max') && orientation === 'portrait' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-20" />
                )}
              </div>
            )}

            {/* Content */}
            <div
              className={`h-full ${device !== 'desktop' ? 'overflow-y-auto overflow-x-hidden rounded-[28px]' : 'rounded-lg'}`}
              style={{ backgroundColor }}
            >
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
