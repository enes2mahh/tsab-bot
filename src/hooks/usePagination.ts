'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PaginationOptions {
  pageSize?: number
  initialPage?: number
}

export interface PaginationResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
  nextPage: () => void
  prevPage: () => void
  goToPage: (p: number) => void
  refresh: () => void
}

type Fetcher<T> = (from: number, to: number) => Promise<{ data: T[]; count: number }>

export function usePagination<T>(
  fetcher: Fetcher<T>,
  deps: unknown[] = [],
  options: PaginationOptions = {},
): PaginationResult<T> {
  const { pageSize = 20, initialPage = 0 } = options
  const [page, setPage] = useState(initialPage)
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const from = p * pageSize
      const to = from + pageSize - 1
      const result = await fetcherRef.current(from, to)
      setData(result.data)
      setTotalCount(result.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // Reset to page 0 when deps change
  useEffect(() => {
    setPage(0)
    load(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, pageSize])

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    hasNext: page < totalPages - 1,
    hasPrev: page > 0,
    nextPage: () => setPage(p => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage(p => Math.max(p - 1, 0)),
    goToPage: (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1))),
    refresh: () => load(page),
  }
}
