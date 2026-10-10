import type { NextConfig } from 'next'

// Extra hostnames the dev server lets load its dev resources (HMR), from DEV_ALLOWED_ORIGINS:
// comma-separated, no scheme or port. localhost is always allowed.
const allowedDevOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter((host) => host !== '')

const nextConfig: NextConfig = { allowedDevOrigins }

export default nextConfig
