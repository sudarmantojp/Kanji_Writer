'use client'

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'

interface KanjiCanvasProps {
  kanji: string
  isEraseMode: boolean
  isActive: boolean
  onActivate: () => void
  brushSize?: number
  canvasHeight?: number
}

export interface KanjiCanvasHandle {
  clear: () => void
  getDataURL: () => string
}

const CANVAS_H = 100
const CANVAS_W_INTERNAL = 600 // internal resolution width

const KanjiCanvas = forwardRef<KanjiCanvasHandle, KanjiCanvasProps>(
  ({ kanji, isEraseMode, isActive, onActivate, brushSize = 3 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDrawing = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)
    const [isCursorOver, setIsCursorOver] = useState(false)

    const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if ('touches' in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        }
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }

    const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
      const w = ctx.canvas.width
      const h = ctx.canvas.height
      ctx.save()
      ctx.strokeStyle = 'rgba(180,160,140,0.30)'
      ctx.lineWidth = 0.8
      ctx.setLineDash([4, 4])

      // Vertical center line
      ctx.beginPath()
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w / 2, h)
      ctx.stroke()

      // Horizontal center line
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      // Diagonal lines (only in each square cell if multiple — draw crossing diagonals)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(w, h)
      ctx.moveTo(w, 0)
      ctx.lineTo(0, h)
      ctx.stroke()

      ctx.setLineDash([])
      ctx.restore()
    }, [])

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawGrid(ctx)
    }, [drawGrid])

    useImperativeHandle(ref, () => ({
      clear: clearCanvas,
      getDataURL: () => canvasRef.current?.toDataURL() ?? '',
    }))

    useEffect(() => {
      clearCanvas()
    }, [clearCanvas])

    // Auto-erase on hover when erase mode is active and this row is active
    useEffect(() => {
      if (isEraseMode && isActive && isCursorOver) {
        clearCanvas()
      }
    }, [isEraseMode, isActive, isCursorOver, clearCanvas])

    const startDraw = useCallback(
      (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        onActivate()
        isDrawing.current = true
        lastPos.current = getPos(e, canvas)
      },
      [onActivate]
    )

    const draw = useCallback(
      (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        if (!isDrawing.current) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const pos = getPos(e, canvas)

        if (isEraseMode) {
          ctx.save()
          ctx.globalCompositeOperation = 'source-over'
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = brushSize * 8
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          if (lastPos.current) {
            ctx.moveTo(lastPos.current.x, lastPos.current.y)
            ctx.lineTo(pos.x, pos.y)
          } else {
            ctx.arc(pos.x, pos.y, brushSize * 4, 0, Math.PI * 2)
          }
          ctx.stroke()
          ctx.restore()
        } else {
          ctx.globalCompositeOperation = 'source-over'
          ctx.lineWidth = brushSize * 1.5
          ctx.strokeStyle = '#1a1008'
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          if (lastPos.current) {
            ctx.moveTo(lastPos.current.x, lastPos.current.y)
            ctx.lineTo(pos.x, pos.y)
          } else {
            ctx.moveTo(pos.x, pos.y)
            ctx.lineTo(pos.x + 0.1, pos.y + 0.1)
          }
          ctx.stroke()
        }

        lastPos.current = pos
      },
      [isEraseMode, brushSize]
    )

    const stopDraw = useCallback(() => {
      isDrawing.current = false
      lastPos.current = null
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.addEventListener('mousedown', startDraw)
      canvas.addEventListener('mousemove', draw)
      canvas.addEventListener('mouseup', stopDraw)
      canvas.addEventListener('mouseleave', stopDraw)
      canvas.addEventListener('touchstart', startDraw, { passive: false })
      canvas.addEventListener('touchmove', draw, { passive: false })
      canvas.addEventListener('touchend', stopDraw)

      return () => {
        canvas.removeEventListener('mousedown', startDraw)
        canvas.removeEventListener('mousemove', draw)
        canvas.removeEventListener('mouseup', stopDraw)
        canvas.removeEventListener('mouseleave', stopDraw)
        canvas.removeEventListener('touchstart', startDraw)
        canvas.removeEventListener('touchmove', draw)
        canvas.removeEventListener('touchend', stopDraw)
      }
    }, [startDraw, draw, stopDraw])

    return (
      <div ref={containerRef} className="w-full" style={{ height: CANVAS_H }}>
        {/* Drawing canvas — full width */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W_INTERNAL}
          height={CANVAS_H}
          onMouseEnter={() => setIsCursorOver(true)}
          onMouseLeave={() => {
            setIsCursorOver(false)
            stopDraw()
          }}
          style={{
            width: '100%',
            height: CANVAS_H,
            borderRadius: 6,
            border: isActive
              ? '2px solid oklch(0.55 0.18 30)'
              : '1px solid #d5cec4',
            cursor:
              isEraseMode && isActive
                ? 'cell'
                : isEraseMode
                ? 'default'
                : 'crosshair',
            display: 'block',
            touchAction: 'none',
            background: '#fff',
            boxShadow: isActive
              ? '0 0 0 3px oklch(0.55 0.18 30 / 0.12)'
              : '0 1px 3px rgba(0,0,0,0.06)',
          }}
          aria-label={`Drawing canvas for kanji ${kanji}`}
        />
      </div>
    )
  }
)

KanjiCanvas.displayName = 'KanjiCanvas'
export default KanjiCanvas
