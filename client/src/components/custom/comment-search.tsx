import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'

interface CommentSearchProps {
  readonly onSearch: (query: string) => void
  readonly placeholder?: string
}

export function CommentSearch({ onSearch, placeholder = 'Search by username or content...' }: CommentSearchProps) {
  const [searchInput, setSearchInput] = useState('')

  const handleSearch = useDebouncedCallback((term: string) => {
    onSearch(term)
  }, 300)

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={searchInput}
      onChange={(e) => {
        setSearchInput(e.target.value)
        handleSearch(e.target.value)
      }}
    />
  )
}
