import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/store'
import { fetchDocuments, createDocument, deleteDocument } from '../store/documentSlice'
import { logoutThunk } from '../store/authSlice'
import { format } from 'date-fns'
import {
  FiPlus, FiSearch, FiLogOut, FiTrash2, FiExternalLink,
  FiUsers, FiGlobe, FiLock, FiFileText, FiBell
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const { documents, loading, totalElements } = useAppSelector((state) => state.document)

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    dispatch(fetchDocuments(0))
  }, [dispatch])

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a document title')
      return
    }
    setCreating(true)
    try {
      const result = await dispatch(createDocument({ title: newTitle.trim(), isPublic: true }))
      if (createDocument.fulfilled.match(result)) {
        setShowNewModal(false)
        setNewTitle('')
        toast.success('Document created!')
        navigate(`/editor/${result.payload.id}`)
      } else {
        toast.error((result.payload as string) || 'Failed to create document')
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    const result = await dispatch(deleteDocument(id))
    if (deleteDocument.fulfilled.match(result)) {
      toast.success('Document deleted')
    }
  }

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="glass border-b border-surface-500/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">DocFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost relative" title="Notifications">
              <FiBell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-surface-500">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span className="text-sm text-slate-300 hidden sm:block">{user?.fullName}</span>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20">
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent"> {user?.fullName?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-lg">{totalElements} document{totalElements !== 1 ? 's' : ''} in your workspace</p>
        </div>

        {/* Actions row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              id="doc-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="input pl-10"
            />
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <FiPlus className="w-4 h-4" /> New Document
          </button>
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-surface-500 rounded mb-3 w-3/4" />
                <div className="h-3 bg-surface-600 rounded mb-2 w-1/2" />
                <div className="h-3 bg-surface-600 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-surface-700 flex items-center justify-center mx-auto mb-4">
              <FiFileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              {search ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {search ? `No results for "${search}"` : 'Create your first document to get started'}
            </p>
            {!search && (
              <button onClick={() => setShowNewModal(true)} className="btn-primary">
                <FiPlus className="w-4 h-4" /> Create Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/editor/${doc.id}`)}
                className="card hover:border-primary-500/50 hover:bg-surface-600 cursor-pointer transition-all duration-200 group animate-fade-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/20 to-purple-600/20 flex items-center justify-center border border-primary-500/20">
                    <FiFileText className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/editor/${doc.id}`)}
                      className="btn-ghost p-1.5"
                      title="Open document"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(doc.id, doc.title, e)}
                      className="btn-ghost p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      title="Delete document"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-100 mb-2 line-clamp-2 leading-snug">{doc.title}</h3>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {doc.isPublic ? (
                    <span className="flex items-center gap-1"><FiGlobe className="w-3 h-3 text-green-500" /> Public</span>
                  ) : (
                    <span className="flex items-center gap-1"><FiLock className="w-3 h-3" /> Private</span>
                  )}
                  <span>·</span>
                  <span>{format(new Date(doc.updatedAt), 'MMM d, yyyy')}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-surface-500/50 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                    {doc.owner.fullName.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-500 truncate">{doc.owner.fullName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Document Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md animate-fade-in">
            <h2 className="text-xl font-bold text-slate-100 mb-6">New Document</h2>
            <div>
              <label htmlFor="new-doc-title" className="block text-sm font-medium text-slate-300 mb-1.5">Document title</label>
              <input
                id="new-doc-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Untitled document"
                className="input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
                {creating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
