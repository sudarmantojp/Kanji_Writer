'use client'

import { useRef, useState, useCallback } from 'react'
import KanjiCanvas, { KanjiCanvasHandle } from './KanjiCanvas'
import { Eraser, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface KanjiEntry {
  no?: number
  kanji: string
  meaning?: string
  reading?: string
  [key: string]: unknown
}

interface KanjiTableProps {
  data: KanjiEntry[]
  isEraseMode: boolean
  activeRow: number | null
  onActivateRow: (index: number) => void
  brushSize: number
}

const PAGE_SIZE = 10

export default function KanjiTable({
  data,
  isEraseMode,
  activeRow,
  onActivateRow,
  brushSize,
}: KanjiTableProps) {
  const canvasRefs = useRef<Map<number, KanjiCanvasHandle>>(new Map())
  const [clearedRows, setClearedRows] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const pageStart  = page * PAGE_SIZE
  const pageData   = data.slice(pageStart, pageStart + PAGE_SIZE)
  const hasMeaning = data.some((d) => d.meaning)

  const setCanvasRef = useCallback(
    (globalIndex: number) => (handle: KanjiCanvasHandle | null) => {
      if (handle) canvasRefs.current.set(globalIndex, handle)
      else canvasRefs.current.delete(globalIndex)
    },
    []
  )

  const clearRow = (globalIndex: number) => {
    canvasRefs.current.get(globalIndex)?.clear()
    setClearedRows((prev) => new Set([...prev, globalIndex]))
    setTimeout(() => {
      setClearedRows((prev) => {
        const next = new Set(prev)
        next.delete(globalIndex)
        return next
      })
    }, 700)
  }

  const goToPage = (p: number) => {
    setPage(p)
    onActivateRow(-1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Page number pills helper ── */
  const pagePills = () => {
    const pills: (number | 'ellipsis-start' | 'ellipsis-end')[] = []
    for (let i = 0; i < totalPages; i++) {
      if (
        i === 0 ||
        i === totalPages - 1 ||
        Math.abs(i - page) <= 1
      ) {
        pills.push(i)
      } else if (i === 1 && page > 2) {
        pills.push('ellipsis-start')
      } else if (i === totalPages - 2 && page < totalPages - 3) {
        pills.push('ellipsis-end')
      }
    }
    return pills
  }

  return (
    <div className="flex flex-col">

      {/* ── Scrollable table wrapper ── */}
      <div
        className="w-full overflow-x-auto rounded-t-xl border"
        style={{ borderColor: '#d5cec4', borderBottom: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <table
          className="border-collapse"
          style={{
            width: '100%',
            minWidth: 520,
            tableLayout: 'auto',
          }}
        >
          <thead>
            <tr style={{ background: 'oklch(0.93 0.014 50)' }}>
              {/* NO */}
              <th
                className="text-center font-semibold text-xs py-3 px-3 whitespace-nowrap"
                style={{ color: '#5a4a3a', width: '1%', borderBottom: '2px solid #d5cec4', letterSpacing: '0.05em' }}
              >
                NO
              </th>
              {/* KANJI */}
              <th
                className="text-center font-semibold text-xs py-3 px-3 whitespace-nowrap"
                style={{ color: '#5a4a3a', width: '1%', borderBottom: '2px solid #d5cec4', letterSpacing: '0.05em' }}
              >
                KANJI
              </th>
              {/* MEANING */}
              {hasMeaning && (
                <th
                  className="text-left font-semibold text-xs py-3 px-3 whitespace-nowrap"
                  style={{ color: '#5a4a3a', width: 130, borderBottom: '2px solid #d5cec4', letterSpacing: '0.05em' }}
                >
                  MEANING
                </th>
              )}
              {/* WRITE PRACTICE */}
              <th
                className="text-left font-semibold text-xs py-3 px-3 whitespace-nowrap"
                style={{ color: '#5a4a3a', borderBottom: '2px solid #d5cec4', letterSpacing: '0.05em' }}
              >
                WRITE PRACTICE
              </th>
              {/* ERASE */}
              <th
                className="text-center font-semibold text-xs py-3 px-3 whitespace-nowrap"
                style={{ color: '#5a4a3a', width: '1%', borderBottom: '2px solid #d5cec4', letterSpacing: '0.05em' }}
              >
                ERASE
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((entry, localIndex) => {
              const globalIndex = pageStart + localIndex
              const rowNo       = entry.no ?? globalIndex + 1
              const isActive    = activeRow === globalIndex
              const isCleared   = clearedRows.has(globalIndex)

              return (
                <tr
                  key={globalIndex}
                  style={{
                    background: isActive
                      ? 'oklch(0.97 0.018 35)'
                      : localIndex % 2 === 0 ? '#ffffff' : '#faf8f5',
                    borderBottom: '1px solid #ede8e0',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onClick={() => onActivateRow(globalIndex)}
                >
                  {/* No */}
                  <td
                    className="text-center py-2 px-3"
                    style={{
                      color: '#9a8a7a',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      verticalAlign: 'middle',
                      whiteSpace: 'nowrap',
                      width: '1%',
                    }}
                  >
                    {rowNo}
                  </td>

                  {/* Kanji + reading tooltip */}
                  <td
                    className="text-center py-2 px-3"
                    style={{ verticalAlign: 'middle', width: '1%', whiteSpace: 'nowrap' }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          style={{
                            fontSize: 28,
                            lineHeight: 1.1,
                            display: 'inline-block',
                            fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                            color: '#1a1008',
                            whiteSpace: 'nowrap',
                            cursor: entry.reading ? 'help' : 'default',
                          }}
                        >
                          {entry.kanji}
                        </span>
                      </TooltipTrigger>
                      {entry.reading && (
                        <TooltipContent
                          side="top"
                          sideOffset={6}
                          style={{
                            fontFamily: '"Noto Serif JP", serif',
                            fontSize: 13,
                            background: '#2a1e10',
                            color: '#f5ede0',
                            borderRadius: 8,
                            padding: '5px 12px',
                            border: 'none',
                          }}
                        >
                          {entry.reading}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>

                  {/* Meaning */}
                  {hasMeaning && (
                    <td
                      className="py-2 px-3"
                      style={{
                        color: '#4a3a2a',
                        fontSize: 13,
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                        maxWidth: 130,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {entry.meaning ?? '—'}
                    </td>
                  )}

                  {/* Canvas */}
                  <td
                    className="py-3 px-2"
                    style={{ verticalAlign: 'middle', minWidth: 200 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <KanjiCanvas
                      ref={setCanvasRef(globalIndex)}
                      kanji={entry.kanji}
                      isEraseMode={isEraseMode}
                      isActive={isActive}
                      onActivate={() => onActivateRow(globalIndex)}
                      brushSize={brushSize}
                    />
                  </td>

                  {/* Clear button */}
                  <td className="text-center py-2 px-3" style={{ verticalAlign: 'middle', width: '1%' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); clearRow(globalIndex) }}
                      title="Erase this canvas"
                      className="inline-flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90"
                      style={{
                        width: 32,
                        height: 32,
                        background: isCleared ? '#e8f8ee' : '#fff5f0',
                        border: `1px solid ${isCleared ? '#9dd4b0' : '#e8c4b0'}`,
                        color: isCleared ? '#2d7a4a' : '#c05a30',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label={`Erase canvas for kanji ${entry.kanji}`}
                    >
                      {isCleared ? <Pencil size={13} /> : <Eraser size={13} />}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-b-xl flex-wrap"
          style={{ background: 'oklch(0.93 0.014 50)', border: '1px solid #d5cec4', borderTop: '2px solid #d5cec4' }}
        >
          {/* Info */}
          <span className="text-xs" style={{ color: '#7a6a5a' }}>
            <span className="font-semibold" style={{ color: '#3a2a1a' }}>
              {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, data.length)}
            </span>
            {' / '}
            <span className="font-semibold" style={{ color: '#3a2a1a' }}>{data.length}</span>
            {' kanji'}
          </span>

          {/* Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="flex items-center justify-center rounded-lg transition-all active:scale-95"
              style={{
                width: 30, height: 30,
                background: '#fff',
                border: '1px solid #d5cec4',
                color: page === 0 ? '#c4a882' : '#5a4a3a',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {pagePills().map((item, idx) => {
              if (typeof item === 'string') {
                return (
                  <span key={item + idx} className="text-xs px-1" style={{ color: '#9a8a7a' }}>
                    …
                  </span>
                )
              }
              const isCurrent = item === page
              return (
                <button
                  key={item}
                  onClick={() => goToPage(item)}
                  className="flex items-center justify-center rounded-lg text-xs font-medium transition-all active:scale-95"
                  style={{
                    width: 30, height: 30,
                    background: isCurrent ? 'oklch(0.55 0.18 30)' : '#fff',
                    border: `1px solid ${isCurrent ? 'oklch(0.55 0.18 30)' : '#d5cec4'}`,
                    color: isCurrent ? '#fff' : '#5a4a3a',
                    cursor: 'pointer',
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                  aria-label={`Page ${item + 1}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item + 1}
                </button>
              )
            })}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages - 1}
              className="flex items-center justify-center rounded-lg transition-all active:scale-95"
              style={{
                width: 30, height: 30,
                background: '#fff',
                border: '1px solid #d5cec4',
                color: page === totalPages - 1 ? '#c4a882' : '#5a4a3a',
                cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page === totalPages - 1 ? 0.4 : 1,
              }}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
