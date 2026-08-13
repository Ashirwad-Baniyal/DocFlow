// ============================================================
// src/hooks/useDocuments.ts — React Query document hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { documentsApi } from '../utils/api';
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  ShareDocumentRequest,
} from '../types';
import toast from 'react-hot-toast';

// ─── Query Keys ───────────────────────────────────────────────
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (page: number) => [...documentKeys.lists(), page] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  collaborators: (id: string) => [...documentKeys.detail(id), 'collaborators'] as const,
  search: (q: string, page: number) => [...documentKeys.all, 'search', q, page] as const,
};

// ─── Hooks ────────────────────────────────────────────────────

export function useDocumentList(page = 0) {
  return useQuery({
    queryKey: documentKeys.list(page),
    queryFn: () => documentsApi.getDocuments(page),
    staleTime: 30_000,
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(id!),
    queryFn: () => documentsApi.getDocument(id!),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useCollaborators(docId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.collaborators(docId!),
    queryFn: () => documentsApi.getCollaborators(docId!),
    enabled: !!docId,
  });
}

export function useSearchDocuments(q: string, page = 0) {
  return useQuery({
    queryKey: documentKeys.search(q, page),
    queryFn: () => documentsApi.searchDocuments(q, page),
    enabled: q.trim().length > 0,
    staleTime: 15_000,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (req: CreateDocumentRequest) => documentsApi.createDocument(req),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Document created!');
      navigate(`/editor/${doc.id}`);
    },
    onError: () => {
      toast.error('Failed to create document.');
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateDocumentRequest }) =>
      documentsApi.updateDocument(id, req),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(doc.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: () => {
      toast.error('Failed to save document.');
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      toast.success('Document deleted.');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Failed to delete document.');
    },
  });
}

export function useShareDocument(docId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: ShareDocumentRequest) =>
      documentsApi.shareDocument(docId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.collaborators(docId) });
      toast.success('Collaborator added!');
    },
    onError: () => {
      toast.error('Failed to share document.');
    },
  });
}

export function useSaveSnapshot(docId: string) {
  return useMutation({
    mutationFn: () => documentsApi.saveSnapshot(docId),
    onSuccess: () => {
      toast.success('Version saved!');
    },
    onError: () => {
      toast.error('Failed to save version.');
    },
  });
}
