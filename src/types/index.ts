export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  member_id?: number
  member_profile?: any
}

export interface Book {
  id: number
  title: string
  author: string
  isbn: string
  genre: string
  total_copies: number
  available_copies: number
  published_year?: number
  description?: string
  is_available: boolean
}

export interface BorrowRecord {
  id: number
  book: Book
  member: any
  borrow_date: string
  due_date: string
  return_date?: string
  status: 'pending' | 'borrowed' | 'returned' | 'overdue' | 'rejected'
  notes?: string
  admin_notes?: string
  overdue_days: number
  days_remaining?: number
}
