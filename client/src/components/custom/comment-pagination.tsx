import { Button } from '../ui/button'

interface CommentPaginationProps {
  readonly currentPage: number
  readonly totalPages: number
  readonly onPageChange: (page: number) => void
}

export function CommentPagination({ currentPage, totalPages, onPageChange }: CommentPaginationProps) {
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
      >
        Previous
      </Button>
      
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
      >
        Next
      </Button>
    </div>
  )
}
