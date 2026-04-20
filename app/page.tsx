'use client'

import { useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Upload,
  Eraser,
  Pencil,
  FileJson,
  X,
  ChevronDown,
  Minus,
  Plus,
} from 'lucide-react'

const KanjiTable = dynamic(() => import('@/components/KanjiTable'), { ssr: false })

interface KanjiEntry {
  no?: number
  kanji: string
  meaning?: string
  reading?: string
  [key: string]: unknown
}

const SAMPLE_DATA: KanjiEntry[] = [
  { no: 1, kanji: '日', meaning: 'Sun / Day', reading: 'にち・じつ' },
  { no: 2, kanji: '月', meaning: 'Moon / Month', reading: 'げつ・がつ' },
  { no: 3, kanji: '火', meaning: 'Fire', reading: 'か' },
  { no: 4, kanji: '水', meaning: 'Water', reading: 'すい' },
  { no: 5, kanji: '木', meaning: 'Tree / Wood', reading: 'もく・ぼく' },
  { no: 6, kanji: '金', meaning: 'Gold / Money', reading: 'きん・こん' },
  { no: 7, kanji: '土', meaning: 'Earth / Soil', reading: 'ど・と' },
]

export default function KanjiWriterPage() {
  const [kanjiData, setKanjiData] = useState<KanjiEntry[]>(SAMPLE_DATA)
  const [isEraseMode, setIsEraseMode] = useState(false)
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const handleActivateRow = (index: number) => setActiveRow(index < 0 ? null : index)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(3)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseKanjiJSON = useCallback((raw: unknown): KanjiEntry[] => {
    if (Array.isArray(raw)) {
      return raw
        .filter((item) => typeof item === 'object' && item !== null)
        .map((item, idx) => {
          const obj = item as Record<string, unknown>
          // Try to find the kanji field
          const kanji =
            typeof obj.kanji === 'string'
              ? obj.kanji
              : typeof obj.character === 'string'
              ? obj.character
              : typeof obj.char === 'string'
              ? obj.char
              : typeof obj.symbol === 'string'
              ? obj.symbol
              : String(Object.values(obj)[0] ?? '?')

          return {
            ...obj,
            no: typeof obj.no === 'number' ? obj.no : idx + 1,
            kanji,
            meaning: typeof obj.meaning === 'string' ? obj.meaning : undefined,
            reading:
              typeof obj.reading === 'string'
                ? obj.reading
                : typeof obj.onyomi === 'string'
                ? obj.onyomi
                : undefined,
          } as KanjiEntry
        })
    }
    // if it's an object with an array property
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>
      for (const val of Object.values(obj)) {
        if (Array.isArray(val)) return parseKanjiJSON(val)
      }
    }
    throw new Error('JSON must be an array of kanji objects')
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.name.endsWith('.json')) {
        setError('Please upload a valid .json file.')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string)
          const parsed = parseKanjiJSON(raw)
          if (parsed.length === 0) throw new Error('No kanji entries found in file.')
          setKanjiData(parsed)
          setFileName(file.name)
          setActiveRow(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse JSON file.')
        }
      }
      reader.readAsText(file)
    },
    [parseKanjiJSON]
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const resetToSample = () => {
    setKanjiData(SAMPLE_DATA)
    setFileName(null)
    setError(null)
    setActiveRow(null)
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 py-3"
        style={{
          background: 'oklch(0.22 0.03 40)',
          borderBottom: '1px solid oklch(0.30 0.03 40)',
          boxShadow: '0 2px 8px oklch(0.1 0.02 40 / 0.35)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              background: 'oklch(0.55 0.18 30)',
              fontSize: 18,
              fontFamily: '"Noto Serif JP", serif',
              color: '#fff',
            }}
            aria-hidden="true"
          >
            書
          </div>
          <span
            className="font-bold text-lg tracking-wide hidden sm:block"
            style={{ color: '#f5ede0', fontFamily: '"Noto Serif JP", serif', letterSpacing: '0.05em' }}
          >
            Kanji Writer
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Brush size */}
        <div className="hidden md:flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: 'oklch(0.30 0.03 40)' }}>
          <span className="text-xs mr-1" style={{ color: '#c4a882' }}>Brush</span>
          <button
            onClick={() => setBrushSize((s) => Math.max(1, s - 1))}
            className="rounded p-0.5 transition hover:opacity-80 active:scale-95"
            style={{ color: '#c4a882' }}
            aria-label="Decrease brush size"
          >
            <Minus size={13} />
          </button>
          <span className="w-5 text-center text-sm font-mono" style={{ color: '#f5ede0' }}>{brushSize}</span>
          <button
            onClick={() => setBrushSize((s) => Math.min(10, s + 1))}
            className="rounded p-0.5 transition hover:opacity-80 active:scale-95"
            style={{ color: '#c4a882' }}
            aria-label="Increase brush size"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Draw / Erase toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid oklch(0.38 0.04 40)' }}>
          <button
            onClick={() => setIsEraseMode(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all"
            style={{
              background: !isEraseMode ? 'oklch(0.55 0.18 30)' : 'transparent',
              color: !isEraseMode ? '#fff' : '#c4a882',
              cursor: 'pointer',
            }}
            aria-pressed={!isEraseMode}
            title="Draw mode"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Draw</span>
          </button>
          <button
            onClick={() => setIsEraseMode(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all"
            style={{
              background: isEraseMode ? '#c05a30' : 'transparent',
              color: isEraseMode ? '#fff' : '#c4a882',
              cursor: 'pointer',
            }}
            aria-pressed={isEraseMode}
            title="Erase mode — hover over selected canvas to erase"
          >
            <Eraser size={14} />
            <span className="hidden sm:inline">Erase</span>
          </button>
        </div>

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-95"
          style={{
            background: 'oklch(0.30 0.03 40)',
            border: '1px solid oklch(0.40 0.04 40)',
            color: '#c4a882',
            cursor: 'pointer',
          }}
          title="Upload kanji JSON file"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Upload JSON</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onFileChange}
          className="hidden"
          aria-label="Upload kanji JSON file"
        />
      </header>

      {/* ── Erase mode banner ── */}
      {isEraseMode && (
        <div
          className="flex items-center justify-center gap-2 py-2 text-sm font-medium"
          style={{
            background: 'oklch(0.65 0.18 30 / 0.12)',
            borderBottom: '1px solid oklch(0.65 0.18 30 / 0.25)',
            color: '#c05a30',
          }}
        >
          <Eraser size={14} />
          Erase mode active — hover over an active canvas to auto-erase, or use your mouse to erase manually
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 px-4 md:px-6 py-6 flex flex-col gap-5">

        {/* File status / upload zone */}
        <div
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-6 px-4 cursor-pointer transition-all"
          style={{
            borderColor: isDragging ? 'oklch(0.55 0.18 30)' : '#d5cec4',
            background: isDragging ? 'oklch(0.55 0.18 30 / 0.06)' : 'oklch(0.99 0.003 70)',
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload kanji JSON file drop zone"
        >
          {fileName ? (
            <div className="flex items-center gap-3">
              <FileJson size={24} style={{ color: 'oklch(0.55 0.18 30)' }} />
              <div className="text-center">
                <p className="font-semibold text-sm" style={{ color: '#3a2a1a' }}>{fileName}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9a8a7a' }}>
                  {kanjiData.length} kanji loaded
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); resetToSample() }}
                className="ml-2 rounded-full p-1 transition hover:opacity-70"
                style={{ color: '#9a8a7a', background: '#eae4dc' }}
                title="Remove file and use sample data"
                aria-label="Remove uploaded file"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={28} style={{ color: '#c4a882' }} />
              <div className="text-center">
                <p className="font-semibold text-sm" style={{ color: '#5a4a3a' }}>
                  Drop your kanji JSON file here, or click to browse
                </p>
                <p className="text-xs mt-1" style={{ color: '#9a8a7a' }}>
                  Supports: <code className="rounded px-1" style={{ background: '#ede8e0' }}>{`[{"kanji":"日","meaning":"Sun","reading":"にち"}]`}</code>
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#c4a882' }}>
                <ChevronDown size={12} />
                <span>Using sample data (7 kanji)</span>
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
            style={{ background: '#fff0ec', border: '1px solid #f0c0a8', color: '#c05a30' }}
            role="alert"
          >
            <X size={15} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100" aria-label="Dismiss error">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: '#9a8a7a' }}>
          <span className="flex items-center gap-1">
            <Pencil size={12} />
            Click a row to select it, then draw on the right canvas
          </span>
          <span className="flex items-center gap-1">
            <Eraser size={12} />
            In Erase mode, hover the selected canvas to auto-clear
          </span>
        </div>

        {/* Table */}
        {kanjiData.length > 0 && (
          <KanjiTable
            data={kanjiData}
            isEraseMode={isEraseMode}
            activeRow={activeRow}
            onActivateRow={handleActivateRow}
            brushSize={brushSize}
          />
        )}

        {/* Empty */}
        {kanjiData.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16" style={{ color: '#9a8a7a' }}>
            <FileJson size={40} style={{ opacity: 0.35 }} />
            <p className="text-sm">No kanji data. Upload a JSON file to get started.</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="py-3 text-center text-xs" style={{ color: '#b0a090', borderTop: '1px solid #ede8e0' }}>
        Kanji Writer — free-hand practice tool
      </footer>
    </main>
  )
}
