import * as React from "react"

// Definição centralizada de breakpoints Tailwind (de acordo com padrão)
const BREAKPOINTS = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 } as const
type BreakpointKey = keyof typeof BREAKPOINTS

interface BreakpointInfo {
  width: number
  height: number
  isMobile: boolean
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  up: Record<BreakpointKey, boolean>
  down: Record<BreakpointKey, boolean>
}

// Hook substitui retorno simples boolean por objeto rico.
// Mantemos compatibilidade parcial: quem espera boolean precisará ajustar (único uso estava em sidebar).
export function useIsMobile(): BreakpointInfo {
  const [dims, setDims] = React.useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0
  }))

  React.useEffect(() => {
    let frame: number | null = null
    const onResize = () => {
      if(frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setDims({ w: window.innerWidth, h: window.innerHeight })
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      if(frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const width = dims.w
  const height = dims.h
  const isMobile = width < BREAKPOINTS.md
  const isXs = width < BREAKPOINTS.sm
  const isSm = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md
  const isMd = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg
  const isLg = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl
  const isXl = width >= BREAKPOINTS.xl

  const up = {
    xs: width >= BREAKPOINTS.xs,
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
    xxl: width >= BREAKPOINTS.xxl
  }
  const down = {
    xs: width < BREAKPOINTS.sm,
    sm: width < BREAKPOINTS.md,
    md: width < BREAKPOINTS.lg,
    lg: width < BREAKPOINTS.xl,
    xl: width < BREAKPOINTS.xxl,
    xxl: true
  }

  return { width, height, isMobile, isXs, isSm, isMd, isLg, isXl, up, down }
}
