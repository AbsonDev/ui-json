import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  animate?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', animate = true }) => {
  const Component = animate ? motion.div : 'div'

  return (
    <Component
      className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...(animate && {
        animate: {
          opacity: [0.5, 1, 0.5],
        },
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }
      })}
    />
  )
}

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <Skeleton className={`h-10 w-24 rounded-lg ${className}`} />
}

export const SkeletonInput: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <Skeleton className={`h-10 w-full rounded-md ${className}`} />
}

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
