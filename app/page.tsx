'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Upload, Eraser, Pencil, FileJson, X, Minus, Plus, Info } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'

const KanjiTable = dynamic(() => import('@/components/KanjiTable'), { ssr: false })

/* ── Types ── */
interface KanjiEntry {
  no?: number
  kanji: string
  meaning?: string
  reading?: string
  [key: string]: unknown
}

/* ── Sample data ── */
const SAMPLE_DATA: KanjiEntry[] = [
  { no: 1,  kanji: '日', meaning: 'Sun / Day',    reading: 'にち・じつ' },
  { no: 2,  kanji: '月', meaning: 'Moon / Month', reading: 'げつ・がつ' },
  { no: 3,  kanji: '火', meaning: 'Fire',          reading: 'か' },
  { no: 4,  kanji: '水', meaning: 'Water',         reading: 'すい' },
  { no: 5,  kanji: '木', meaning: 'Tree / Wood',   reading: 'もく・ぼく' },
  { no: 6,  kanji: '金', meaning: 'Gold / Money',  reading: 'きん・こん' },
  { no: 7,  kanji: '土', meaning: 'Earth / Soil',  reading: 'ど・と' },
]

/* ── JSON Parser ── */
function parseKanjiJSON(raw: unknown): KanjiEntry[] {
  if (Array.isArray(raw)) {
    const result = raw
      .filter((item) => typeof item === 'object' && item !== null)
      .map((item: Record<string, unknown>, idx) => {
        const kanji =
          typeof item.kanji     === 'string' ? item.kanji :
          typeof item.character === 'string' ? item.character :
          typeof item.char      === 'string' ? item.char :
          typeof item.symbol    === 'string' ? item.symbol :
          String(Object.values(item)[0] ?? '?')
        return {
          ...item,
          no:      typeof item.no === 'number' ? item.no : idx + 1,
          kanji,
          meaning: typeof item.meaning === 'string' ? item.meaning : undefined,
          reading: typeof item.reading === 'string' ? item.reading :
                   typeof item.onyomi  === 'string' ? item.onyomi  : undefined,
        } as KanjiEntry
      })
    if (result.length === 0) throw new Error('No kanji entries found in file.')
    return result
  }
  if (typeof raw === 'object' && raw !== null) {
    for (const val of Object.values(raw as Record<string, unknown>)) {
      if (Array.isArray(val)) return parseKanjiJSON(val)
    }
  }
  throw new Error('JSON must be an array of kanji objects.')
}

export default function Page() {
  const [kanjiData, setKanjiData]   = useState<KanjiEntry[]>(SAMPLE_DATA)
  const [fileName,  setFileName]    = useState<string | null>(null)
  const [isEraseMode, setEraseMode] = useState(false)
  const [activeRow, setActiveRow]   = useState<number | null>(null)
  const [brushSize, setBrushSize]   = useState(3)
  const [error, setError]           = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleActivateRow = useCallback(
    (index: number) => setActiveRow(index < 0 ? null : index),
    []
  )

  const processFile = useCallback((file: File) => {
    setError(null)
    if (!file.name.endsWith('.json')) {
      setError('Please upload a valid .json file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw    = JSON.parse(e.target?.result as string)
        const parsed = parseKanjiJSON(raw)
        setKanjiData(parsed)
        setFileName(file.name)
        setActiveRow(null)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ''
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const resetToSample = useCallback(() => {
    setKanjiData(SAMPLE_DATA)
    setFileName(null)
    setActiveRow(null)
    setError(null)
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex flex-col" style={{ background: '#f5f0ea', color: '#3a2a1a' }}>

        {/* ══ HEADER ══ */}
        <header
          className="sticky top-0 z-30 w-full"
          style={{ background: '#3a2810', borderBottom: '1px solid #4d3518', boxShadow: '0 2px 8px rgba(0,0,0,0.30)' }}
        >
          {/* Row 1 — Logo + Upload (always visible) */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 34, height: 34, background: '#c05a30', fontFamily: '"Noto Serif JP", serif', fontSize: 18, color: '#fff' }}
              >
                書
              </div>
              <span
                className="font-bold hidden sm:inline whitespace-nowrap"
                style={{ fontFamily: '"Noto Serif JP", serif', fontSize: 16, color: '#f5ede0', letterSpacing: '0.05em' }}
              >
                Kanji Writer
              </span>
            </div>

            <div className="flex-1" />

            {/* Brush size — compact on mobile */}
            <div
              className="flex items-center gap-0.5 rounded-lg px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span className="text-xs mr-1 hidden sm:inline" style={{ color: '#c4a882' }}>Brush</span>
              <button
                onClick={() => setBrushSize((s) => Math.max(1, s - 1))}
                className="flex items-center justify-center rounded"
                style={{ width: 24, height: 24, background: 'none', border: 'none', color: '#c4a882', cursor: 'pointer' }}
                aria-label="Decrease brush size"
              >
                <Minus size={12} />
              </button>
              <span className="text-center font-mono text-sm" style={{ minWidth: 20, color: '#f5ede0' }}>
                {brushSize}
              </span>
              <button
                onClick={() => setBrushSize((s) => Math.min(10, s + 1))}
                className="flex items-center justify-center rounded"
                style={{ width: 24, height: 24, background: 'none', border: 'none', color: '#c4a882', cursor: 'pointer' }}
                aria-label="Increase brush size"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Draw / Erase toggle */}
            <div
              className="flex overflow-hidden rounded-lg"
              style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              role="group"
              aria-label="Drawing mode"
            >
              <button
                onClick={() => setEraseMode(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm"
                style={{
                  background: !isEraseMode ? '#c05a30' : 'transparent',
                  color: !isEraseMode ? '#fff' : '#c4a882',
                  border: 'none', cursor: 'pointer',
                }}
                aria-pressed={!isEraseMode}
              >
                <Pencil size={13} />
                <span className="hidden sm:inline">Draw</span>
              </button>
              <button
                onClick={() => setEraseMode(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm"
                style={{
                  background: isEraseMode ? '#9b3a18' : 'transparent',
                  color: isEraseMode ? '#fff' : '#c4a882',
                  border: 'none', cursor: 'pointer',
                }}
                aria-pressed={isEraseMode}
              >
                <Eraser size={13} />
                <span className="hidden sm:inline">Erase</span>
              </button>
            </div>

            {/* Upload button */}
            <label
              className="flex items-center gap-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap px-2.5 py-1.5 sm:px-3 sm:text-sm"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#c4a882',
              }}
              title="Upload kanji JSON file"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Upload JSON</span>
              <input type="file" accept=".json" className="hidden" onChange={handleInputChange} aria-label="Upload kanji JSON file" />
            </label>
          </div>

          {/* Erase mode banner — compact, under header on mobile */}
          {isEraseMode && (
            <div
              className="flex items-center justify-center gap-2 px-4 py-1 text-xs font-medium"
              style={{ background: 'rgba(192,90,48,0.18)', color: '#ffc4a0' }}
              role="status"
            >
              <Eraser size={12} />
              Erase mode — hover active canvas to auto-clear
            </div>
          )}
        </header>

        {/* ══ MAIN ══ */}
        <main className="flex-1 flex flex-col gap-3 p-3 sm:p-4 md:p-5 max-w-screen-2xl mx-auto w-full">

          {/* Drop zone */}
          <div
            className="rounded-xl border-2 border-dashed flex flex-col sm:flex-row items-center justify-center gap-3 py-4 px-4 cursor-pointer transition-all"
            style={{
              borderColor: isDragging ? '#c05a30' : '#d5cec4',
              background: isDragging ? 'rgba(192,90,48,0.05)' : '#faf9f6',
              minHeight: 72,
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('drop-file-input')?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('drop-file-input')?.click() }}
            aria-label="Upload kanji JSON file drop zone"
          >
            <input id="drop-file-input" type="file" accept=".json" className="hidden" onChange={handleInputChange} />

            {fileName ? (
              <div className="flex items-center gap-3">
                <FileJson size={22} style={{ color: '#c05a30', flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#3a2a1a' }}>{fileName}</p>
                  <p className="text-xs" style={{ color: '#9a8a7a' }}>{kanjiData.length} kanji loaded</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); resetToSample() }}
                  className="flex items-center justify-center rounded-full transition-opacity hover:opacity-65"
                  style={{ width: 26, height: 26, background: '#eae4dc', border: 'none', color: '#9a8a7a', cursor: 'pointer' }}
                  title="Remove file"
                  aria-label="Remove uploaded file"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
                <Upload size={22} style={{ color: '#c4a882', flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#5a4a3a' }}>
                    Drop kanji JSON here, or click to browse
                  </p>
                  <p className="text-xs" style={{ color: '#9a8a7a' }}>
                    Sample: {SAMPLE_DATA.length} kanji loaded
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error bar */}
          {error && (
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-2.5 text-sm"
              style={{ background: '#fff0ec', border: '1px solid #f0c0a8', color: '#c05a30' }}
              role="alert"
            >
              <Info size={15} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                style={{ background: 'none', border: 'none', color: '#c05a30', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Instructions — hidden on very small screens */}
          <div className="hidden sm:flex flex-wrap gap-4 text-xs" style={{ color: '#9a8a7a' }}>
            <span className="flex items-center gap-1.5">
              <Pencil size={11} /> Click a row to select, then draw on canvas
            </span>
            <span className="flex items-center gap-1.5">
              <Eraser size={11} /> Erase mode: hover active canvas to auto-clear
            </span>
          </div>

          {/* Table */}
          {kanjiData.length > 0 ? (
            <KanjiTable
              data={kanjiData}
              isEraseMode={isEraseMode}
              activeRow={activeRow}
              onActivateRow={handleActivateRow}
              brushSize={brushSize}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16" style={{ color: '#9a8a7a' }}>
              <FileJson size={40} style={{ opacity: 0.3 }} />
              <p className="text-sm">No kanji data. Upload a JSON file to get started.</p>
            </div>
          )}
        </main>

        <footer
          className="text-center text-xs py-3"
          style={{ color: '#b0a090', borderTop: '1px solid #ede8e0' }}
        >
          Kanji Writer &mdash; free-hand practice tool
        </footer>
      </div>
    </TooltipProvider>
  )
}
