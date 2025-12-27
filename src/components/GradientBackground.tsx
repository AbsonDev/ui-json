'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface GradientBackgroundProps {
  variant?: 'primary' | 'success' | 'danger' | 'ocean' | 'sunset' | 'purple' | 'mesh'
  className?: string
  children?: React.ReactNode
  animate?: boolean
}

const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  danger: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  ocean: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
  sunset: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  mesh: `
    radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%),
    radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%),
    radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%),
    radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)
  `,
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'primary',
  className = '',
  children,
  animate = true,
}) => {
  const Component = animate ? motion.div : 'div'

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Component
        className="absolute inset-0"
        style={{ background: gradients[variant] }}
        {...(animate && {
          animate: {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          },
          transition: {
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          },
        })}
      />
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}

export const GradientText: React.FC<{
  children: React.ReactNode
  gradient?: string
  className?: string
}> = ({
  children,
  gradient = 'linear-gradient(to right, #667eea, #764ba2)',
  className = '',
}) => {
  return (
    <span
      className={`bg-clip-text text-transparent bg-gradient-to-r ${className}`}
      style={{ backgroundImage: gradient }}
    >
      {children}
    </span>
  )
}

export const GradientBorder: React.FC<{
  children: React.ReactNode
  gradient?: string
  className?: string
  borderWidth?: number
}> = ({
  children,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  className = '',
  borderWidth = 2,
}) => {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: gradient,
          padding: `${borderWidth}px`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {children}
    </div>
  )
}

export const AnimatedGradientBlob: React.FC<{
  className?: string
  color?: string
}> = ({ className = '', color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    green: '#10b981',
    orange: '#f59e0b',
  }

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      style={{ backgroundColor: colors[color] || colors.blue }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        x: [0, 30, 0],
        y: [0, -30, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

export const FloatingShapes: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatedGradientBlob
        className="w-72 h-72 -top-24 -left-24"
        color="blue"
      />
      <AnimatedGradientBlob
        className="w-96 h-96 top-1/3 -right-48"
        color="purple"
      />
      <AnimatedGradientBlob
        className="w-80 h-80 bottom-0 left-1/3"
        color="pink"
      />
    </div>
  )
}
