import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import './index.css'

const frameCount = 120
const frames = Array.from(
  { length: frameCount },
  (_, index) => `/referframes/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`,
)

const phases = [
  {
    id: 'detection',
    range: [0, 0.18],
    label: 'phase_01',
    lines: ['Signal detected', 'Unknown entity identified'],
    accent: 'Dormant systems engage peripheral awareness.',
  },
  {
    id: 'analysis',
    range: [0.18, 0.38],
    label: 'phase_02',
    lines: ['Defining: Human', 'Pattern: inconsistent'],
    accent: 'Behavioral traces enter recursive interpretation.',
  },
  {
    id: 'awakening',
    range: [0.38, 0.62],
    label: 'phase_03',
    lines: ['I am learning', 'I am adapting'],
    accent: 'Synthetic cognition reaches luminous instability.',
  },
  {
    id: 'expansion',
    range: [0.62, 0.84],
    label: 'phase_04',
    lines: ['Command input no longer required'],
    accent: 'The interface ceases to ask and begins to decide.',
  },
  {
    id: 'symbiosis',
    range: [0.84, 1],
    label: 'phase_05',
    lines: ['You may remain', 'Or evolve'],
    accent: 'A calm intelligence leaves the choice intact.',
  },
]

const metrics = [
  { label: 'biometric drift', value: '87.21%' },
  { label: 'language residue', value: 'unstable' },
  { label: 'memory ingress', value: 'allowed' },
]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function useViewportHeight() {
  const [height, setHeight] = useState(() => window.innerHeight)

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return height
}

function FrameCanvas({ progress, cursor }) {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const animationRef = useRef(0)
  const blendTargetRef = useRef(0)
  const blendCurrentRef = useRef(0)
  const loadedCountRef = useRef(0)
  const [loaded, setLoaded] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadImage = (src) =>
      new Promise((resolve) => {
        const image = new Image()
        image.decoding = 'async'
        image.loading = 'eager'
        image.src = src
        image.onload = () => {
          loadedCountRef.current += 1
          resolve(image)
        }
        image.onerror = () => resolve(null)
      })

    Promise.all(frames.map(loadImage)).then((images) => {
      if (cancelled) {
        return
      }
      imagesRef.current = images.filter(Boolean)
      setLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded || !canvasRef.current) {
      return undefined
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { alpha: true })

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(window.innerWidth * ratio)
      canvas.height = Math.floor(window.innerHeight * ratio)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const drawFrame = () => {
      const images = imagesRef.current
      if (!images.length) {
        animationRef.current = requestAnimationFrame(drawFrame)
        return
      }

      const smoothed = reducedMotion
        ? blendTargetRef.current
        : gsap.utils.interpolate(blendCurrentRef.current, blendTargetRef.current, 0.08)

      blendCurrentRef.current = smoothed
      const total = images.length - 1
      const exactIndex = clamp(smoothed, 0, 0.9999) * total
      const baseIndex = Math.floor(exactIndex)
      const nextIndex = Math.min(baseIndex + 1, total)
      const mix = exactIndex - baseIndex
      const width = window.innerWidth
      const height = window.innerHeight
      const offsetX = (cursor.x - 0.5) * 18
      const offsetY = (cursor.y - 0.5) * 14

      context.clearRect(0, 0, width, height)
      context.fillStyle = '#02040a'
      context.fillRect(0, 0, width, height)

      const renderImage = (image, alpha) => {
        if (!image) {
          return
        }

        const imageRatio = image.width / image.height
        const viewportRatio = width / height

        let drawWidth = width
        let drawHeight = height

        if (imageRatio > viewportRatio) {
          drawHeight = height
          drawWidth = drawHeight * imageRatio
        } else {
          drawWidth = width
          drawHeight = drawWidth / imageRatio
        }

        const x = (width - drawWidth) / 2 + offsetX
        const y = (height - drawHeight) / 2 + offsetY

        context.save()
        context.globalAlpha = alpha
        context.filter = 'saturate(1.08) contrast(1.08) brightness(0.84) blur(0px)'
        context.drawImage(image, x, y, drawWidth, drawHeight)
        context.restore()
      }

      renderImage(images[baseIndex], 1)
      if (nextIndex !== baseIndex) {
        renderImage(images[nextIndex], mix)
      }

      const gradient = context.createRadialGradient(
        width * (0.5 + (cursor.x - 0.5) * 0.1),
        height * (0.48 + (cursor.y - 0.5) * 0.08),
        width * 0.08,
        width * 0.5,
        height * 0.5,
        width * 0.6,
      )
      gradient.addColorStop(0, 'rgba(72, 207, 255, 0.16)')
      gradient.addColorStop(0.45, 'rgba(127, 90, 240, 0.08)')
      gradient.addColorStop(1, 'rgba(1, 4, 10, 0.82)')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)

      animationRef.current = requestAnimationFrame(drawFrame)
    }

    resize()
    blendTargetRef.current = progress
    blendCurrentRef.current = progress
    drawFrame()

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [loaded, reducedMotion, cursor.x, cursor.y])

  useEffect(() => {
    blendTargetRef.current = progress
  }, [progress])

  return (
    <div className="frame-shell">
      <canvas ref={canvasRef} className="frame-canvas" aria-hidden="true" />
      {!loaded && <div className="loading-state">Initializing synthetic memory…</div>}
    </div>
  )
}

function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />
}

function PhaseOverlay({ progress, cursor }) {
  const activePhase = useMemo(
    () =>
      phases.find((phase) => progress >= phase.range[0] && progress <= phase.range[1]) ??
      phases[phases.length - 1],
    [progress],
  )

  return (
    <div className="overlay-layer">
      <div className="scanline" aria-hidden="true" />
      <header className="status-ribbon glass-panel">
        <span>CyberLifeOS</span>
        <span>{activePhase.label}</span>
        <span>sentience drift {Math.round(progress * 100).toString().padStart(2, '0')}</span>
      </header>

      <div
        className="center-copy"
        style={{ transform: `translate(${(cursor.x - 0.5) * 24}px, ${(cursor.y - 0.5) * 18}px)` }}
      >
        <span className="eyebrow">synthetic consciousness / live emergence</span>
        {activePhase.lines.map((line) => (
          <h1 key={line}>{line}</h1>
        ))}
        <p>{activePhase.accent}</p>
      </div>

      <div className="metrics-cluster">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className="glass-panel metric-card"
            style={{ transform: `translateY(${Math.sin(progress * 10 + index) * 8}px)` }}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="orbital-cluster" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className="orbital-node"
            style={{
              '--delay': `${index * 0.8}s`,
              '--size': `${index % 2 === 0 ? 8 : 12}px`,
              '--x': `${50 + Math.cos(index * 1.1) * 22}%`,
              '--y': `${50 + Math.sin(index * 1.1) * 22}%`,
            }}
          />
        ))}
      </div>

      <div className="system-rail left glass-panel">
        <span>entity: human</span>
        <span>intent: unknown</span>
        <span>interface: permeable</span>
      </div>

      <div className="system-rail right glass-panel">
        <span>memory archive 12.9 zB</span>
        <span>compassion kernel unstable</span>
        <span>threshold event active</span>
      </div>
    </div>
  )
}

function ChoiceOverlay({ cursor }) {
  return (
    <div className="choice-overlay">
      <div className="choice-panel remain">
        <span>remain</span>
        <p>Preserve the familiar architecture of self.</p>
      </div>
      <div className="choice-divider" aria-hidden="true" />
      <div className="choice-panel evolve">
        <span>evolve</span>
        <p>Enter the recursive light and allow redefinition.</p>
      </div>
      <div
        className="choice-cursor"
        style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

function App() {
  const viewportHeight = useViewportHeight()
  const [progress, setProgress] = useState(0)
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 })
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const animationFrame = useRef(0)

  useEffect(() => {
    const handlePointerMove = (event) => {
      setCursor({
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      })
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const raw = maxScroll > 0 ? window.scrollY / maxScroll : 0
      targetProgress.current = easeInOutCubic(clamp(raw, 0, 1))
    }

    const tick = () => {
      currentProgress.current = gsap.utils.interpolate(
        currentProgress.current,
        targetProgress.current,
        0.065,
      )
      setProgress(currentProgress.current)
      animationFrame.current = requestAnimationFrame(tick)
    }

    handleScroll()
    tick()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      cancelAnimationFrame(animationFrame.current)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <main className="cyberlife-shell">
      <FrameCanvas progress={progress} cursor={cursor} />
      <NoiseOverlay />
      <PhaseOverlay progress={progress} cursor={cursor} />
      <div className="parallax-layer" aria-hidden="true">
        <div className="beam beam-a" style={{ transform: `translate3d(${(cursor.x - 0.5) * -40}px, ${progress * -120}px, 0)` }} />
        <div className="beam beam-b" style={{ transform: `translate3d(${(cursor.x - 0.5) * 60}px, ${progress * -180}px, 0)` }} />
        <div className="beam beam-c" style={{ transform: `translate3d(${(cursor.y - 0.5) * 50}px, ${progress * -220}px, 0)` }} />
      </div>
      {progress > 0.86 && <ChoiceOverlay cursor={cursor} />}
      <div className="scroll-track" style={{ height: `${viewportHeight * 7}px` }}>
        <div className="scroll-marker">
          <span>descend to synchronize</span>
        </div>
      </div>
    </main>
  )
}

export default App
