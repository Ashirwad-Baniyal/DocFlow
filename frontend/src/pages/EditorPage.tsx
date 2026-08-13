import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/store'
import { fetchDocument, updateDocument } from '../store/documentSlice'
import { useCollaboration } from '../hooks/useCollaboration'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import {
  FiArrowLeft, FiSave, FiWifi, FiWifiOff,
  FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiList, FiCode,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const AUTO_SAVE_DELAY = 3000

const EditorPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentDocument, loading } = useAppSelector((state) => state.document)
  const { activeUsers, isConnected } = useAppSelector((state) => state.collaboration)
  const { user } = useAppSelector((state) => state.auth)
  
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const isSaving = useRef(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const isRemoteUpdate = useRef(false)

  // Initialize collaboration hook
  const { sendOperation, sendCursor } = useCollaboration(docId!)

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your document here…' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // If programmatically updated via remote WebSocket message, do NOT broadcast back
      if (isRemoteUpdate.current) return

      setSaveStatus('unsaved')
      const html = editor.getHTML()
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => autoSave(html), AUTO_SAVE_DELAY)

      // Broadcast changes to other users
      sendOperation({ type: 'REPLACE', position: 0, content: html })
    },
    onSelectionUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return
      const { from } = editor.state.selection
      sendCursor(from)
    }
  })

  const autoSave = useCallback(
    async (content: string) => {
      if (!docId || isSaving.current) return
      isSaving.current = true
      setSaveStatus('saving')
      try {
        await dispatch(updateDocument({ id: docId, req: { content } })).unwrap()
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      } finally {
        isSaving.current = false
      }
    },
    [docId, dispatch]
  )

  // Load document on mount
  useEffect(() => {
    if (docId) dispatch(fetchDocument(docId))
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [docId, dispatch])

  // Sync document content into editor when loaded from server or modified via websocket
  useEffect(() => {
    if (editor && !editor.isDestroyed && currentDocument != null) {
      const content = currentDocument.content ?? ''
      if (editor.getHTML() !== content) {
        isRemoteUpdate.current = true
        editor.commands.setContent(content, false)
        isRemoteUpdate.current = false
      }
    }
  }, [currentDocument?.content, editor])

  const handleManualSave = async () => {
    if (!docId || !editor) return
    const content = editor.getHTML()
    setSaveStatus('saving')
    try {
      await dispatch(updateDocument({ id: docId, req: { content, title: currentDocument?.title } })).unwrap()
      setSaveStatus('saved')
      toast.success('Document saved!')
    } catch {
      setSaveStatus('unsaved')
      toast.error('Save failed')
    }
  }

  // Loading spinner
  if (loading && !currentDocument) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading document…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56 }}>
          {/* Left: back + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
              title="Back to dashboard"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentDocument?.title ?? 'Untitled Document'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: saveStatus === 'saved' ? '#22c55e' : saveStatus === 'saving' ? '#f59e0b' : '#94a3b8' }}>●</span>
                {saveStatus === 'saved' ? 'All changes saved' : saveStatus === 'saving' ? 'Saving…' : 'Unsaved changes'}
              </div>
            </div>
          </div>

          {/* Right: connection status, collaborators & save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Live Connection indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
              color: isConnected ? '#16a34a' : '#dc2626',
              backgroundColor: isConnected ? '#f0fdf4' : '#fef2f2',
              padding: '4px 10px', borderRadius: 20, fontWeight: 500,
            }}>
              {isConnected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
              {isConnected ? 'Connected' : 'Offline'}
            </div>

            {/* Collaborators online list */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '0 8px' }}>
              {activeUsers.filter(u => u.userId !== user?.id).map((u) => (
                <div
                  key={u.userId}
                  title={u.userFullName}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: u.userColor || '#6366f1',
                    color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 600,
                    border: '2px solid #fff', marginLeft: -6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {(u.userFullName || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            <button
              onClick={handleManualSave}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: '#6366f1', color: '#fff', fontWeight: 600,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              <FiSave size={15} /> Save
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        {editor && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            padding: '0 12px', height: 40,
            borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa',
            flexWrap: 'wrap',
          }}>
            <TB active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
              <FiBold size={14} />
            </TB>
            <TB active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
              <FiItalic size={14} />
            </TB>
            <TB active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
              <FiUnderline size={14} />
            </TB>

            <Divider />

            {([1, 2, 3] as const).map((lvl) => (
              <TB key={lvl} active={editor.isActive('heading', { level: lvl })}
                onClick={() => editor.chain().focus().toggleHeading({ level: lvl }).run()}
                title={`Heading ${lvl}`}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>H{lvl}</span>
              </TB>
            ))}

            <Divider />

            <TB active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left">
              <FiAlignLeft size={14} />
            </TB>
            <TB active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center">
              <FiAlignCenter size={14} />
            </TB>
            <TB active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right">
              <FiAlignRight size={14} />
            </TB>

            <Divider />

            <TB active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
              <FiList size={14} />
            </TB>
            <TB active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
              <span style={{ fontSize: 11, fontWeight: 700 }}>1.</span>
            </TB>
            <TB active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
              <span style={{ fontSize: 11, fontWeight: 700, background: '#fef08a', padding: '1px 4px', borderRadius: 3 }}>H</span>
            </TB>
            <TB active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
              <span style={{ fontSize: 16, fontWeight: 700, color: '#6366f1', lineHeight: 1 }}>"</span>
            </TB>
            <TB active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
              <FiCode size={14} />
            </TB>
          </div>
        )}
      </header>

      {/* ── Editor Canvas (Google Docs style) ── */}
      <div style={{ flex: 1, backgroundColor: '#f1f5f9', overflowY: 'auto', padding: '32px 0' }}>
        <div style={{
          maxWidth: 850,
          margin: '0 auto',
          backgroundColor: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          borderRadius: 4,
          minHeight: 'calc(100vh - 130px)',
          padding: 40,
        }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

// ── Toolbar button ──────────────────────────────────────────────────────────
const TB: React.FC<{ onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }> =
  ({ onClick, active, title, children }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '4px 8px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        background: active ? '#e0e7ff' : 'transparent',
        color: active ? '#4338ca' : '#475569',
        fontWeight: active ? 700 : 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 28,
      }}
    >
      {children}
    </button>
  )

const Divider = () => (
  <div style={{ width: 1, height: 20, backgroundColor: '#e2e8f0', margin: '0 4px' }} />
)

export default EditorPage
