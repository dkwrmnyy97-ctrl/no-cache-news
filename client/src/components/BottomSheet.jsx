import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const DISMISS_DISTANCE = 120   // px dragged down to close
const DISMISS_VELOCITY = 0.6   // px/ms flick to close
const ANIM_MS = 260

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Mobile reading panel. Slides up over a dimmed backdrop and fills most of the
 * viewport.
 *
 * - Close: button, backdrop tap, Escape, browser Back, or dragging the
 *   handle/header down. Dragging is only wired to the header, so scrolling the
 *   story list never dismisses the panel.
 * - Locks page scroll while open and restores the exact page position after.
 * - role="dialog" + aria-modal; the app root is made inert, focus moves into
 *   the panel, Tab is trapped, and focus returns to the opener on close.
 * - initialScrollTop / onScrollPositionChange let the caller remember the
 *   reading position per category + selection.
 */
export default function BottomSheet({ title, subtitle, onClose, children, initialScrollTop = 0, onScrollPositionChange }) {
  const titleId = useId()
  const sheetRef = useRef(null)
  const bodyRef = useRef(null)
  const openerRef = useRef(typeof document !== 'undefined' ? document.activeElement : null)
  const [entered, setEntered] = useState(prefersReducedMotion())
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const closingRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // ── finish closing (after exit animation) ────────────────────────────────
  const finishClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (prefersReducedMotion()) { onCloseRef.current(); return }
    setEntered(false)
    setDragY(0)
    setTimeout(() => onCloseRef.current(), ANIM_MS)
  }, [])

  // ── browser Back closes the panel first ──────────────────────────────────
  // Opening pushes a history entry; Back pops it and we close. Closing any
  // other way pops our entry so the history stack stays clean.
  useEffect(() => {
    const prevRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    // Guard keeps StrictMode's double-run from pushing two entries.
    if (!history.state?.ncnSheet) history.pushState({ ...(history.state || {}), ncnSheet: true }, '')
    const onPop = () => finishClose()
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      history.scrollRestoration = prevRestoration
    }
  }, [finishClose])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    if (history.state?.ncnSheet) {
      history.back() // → popstate → finishClose
      // Some embedded webviews don't deliver popstate reliably; don't get stuck.
      setTimeout(finishClose, 350)
    } else {
      finishClose()
    }
  }, [finishClose])

  // ── scroll lock + restore, inert background, focus ───────────────────────
  useLayoutEffect(() => {
    const scrollY = window.scrollY
    const body = document.body
    const prev = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, overflow: body.style.overflow }
    // position:fixed is the only lock iOS Safari honours.
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, left: '0', right: '0', overflow: 'hidden' })

    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    root?.setAttribute('aria-hidden', 'true')

    if (bodyRef.current) bodyRef.current.scrollTop = initialScrollTop
    sheetRef.current?.focus({ preventScroll: true })
    const raf = requestAnimationFrame(() => setEntered(true))

    return () => {
      cancelAnimationFrame(raf)
      Object.assign(body.style, prev)
      window.scrollTo(0, scrollY)
      root?.removeAttribute('inert')
      root?.removeAttribute('aria-hidden')
      const opener = openerRef.current
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── keyboard: Escape + focus trap ────────────────────────────────────────
  function onKeyDown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); requestClose(); return }
    if (e.key !== 'Tab') return
    const nodes = [...sheetRef.current.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null)
    if (!nodes.length) { e.preventDefault(); return }
    const first = nodes[0], last = nodes[nodes.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === sheetRef.current)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  // ── drag-to-dismiss (header/handle only) ─────────────────────────────────
  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    if (e.target.closest('button')) return // let the close button be a plain tap
    dragRef.current = { startY: e.clientY, lastY: e.clientY, lastT: performance.now(), v: 0 }
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e) {
    const d = dragRef.current
    if (!d) return
    const now = performance.now()
    d.v = (e.clientY - d.lastY) / Math.max(1, now - d.lastT)
    d.lastY = e.clientY; d.lastT = now
    setDragY(Math.max(0, e.clientY - d.startY))
  }
  function onPointerUp() {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    setDragging(false)
    const dist = d.lastY - d.startY
    if (dist > DISMISS_DISTANCE || (dist > 30 && d.v > DISMISS_VELOCITY)) requestClose()
    else setDragY(0)
  }

  const reduced = prefersReducedMotion()
  const translate = entered ? `translateY(${dragY}px)` : 'translateY(100%)'

  return createPortal(
    <div className="fixed inset-0 z-[100]" onKeyDown={onKeyDown}>
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="absolute inset-0 bg-black/70"
        style={{ opacity: entered ? 1 : 0, transition: reduced ? 'none' : `opacity ${ANIM_MS}ms ease` }}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="sheet absolute inset-x-0 bottom-0 flex flex-col bg-navy-900 border-t border-blue-900/40 rounded-t-2xl shadow-2xl outline-none"
        style={{
          transform: translate,
          transition: dragging || reduced ? 'none' : `transform ${ANIM_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      >
        {/* Header stays visible; it is also the drag handle. */}
        <div
          className="shrink-0 px-4 pt-2 pb-3 border-b border-navy-700 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-600" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 id={titleId} className="text-base font-bold text-white leading-tight">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="shrink-0 flex items-center gap-1 min-h-[44px] px-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-navy-700/70 hover:bg-navy-600 border border-navy-600"
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>

        <div
          ref={bodyRef}
          onScroll={e => onScrollPositionChange?.(e.currentTarget.scrollTop)}
          className="sheet-body flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-3"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
