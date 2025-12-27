'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { AnimatedButton } from './AnimatedComponents'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  children?: React.ReactNode
  gradient?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]"
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6 relative"
        >
          <div
            className="absolute inset-0 blur-2xl opacity-30 rounded-full"
            style={{ background: gradient }}
          />
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Icon size={48} className="text-gray-400 dark:text-gray-500" />
          </div>
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400 mb-6 max-w-md"
        >
          {description}
        </motion.p>
      )}

      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          {children}
        </motion.div>
      )}

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3"
        >
          {action && (
            <AnimatedButton
              onClick={action.onClick}
              variant="primary"
              size="lg"
            >
              {action.label}
            </AnimatedButton>
          )}

          {secondaryAction && (
            <AnimatedButton
              onClick={secondaryAction.onClick}
              variant="outline"
              size="lg"
            >
              {secondaryAction.label}
            </AnimatedButton>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

// Preset empty states
export const NoAppsEmptyState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => {
  return (
    <EmptyState
      title="No apps yet"
      description="Create your first app to get started with UI-JSON"
      action={{
        label: "Create First App",
        onClick: onCreate,
      }}
    />
  )
}

export const NoResultsEmptyState: React.FC<{ onClear?: () => void }> = ({ onClear }) => {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search or filters"
      action={onClear ? {
        label: "Clear Filters",
        onClick: onClear,
      } : undefined}
    />
  )
}

export const ErrorEmptyState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <EmptyState
      title="Something went wrong"
      description="We couldn't load this content. Please try again."
      action={{
        label: "Try Again",
        onClick: onRetry,
      }}
      gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    />
  )
}
