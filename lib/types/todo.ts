export type TodoStatus = "todo" | "in-progress" | "done"

export interface Todo {
  id: string
  title: string
  description: string
  date: string
  allDay: boolean
  startTime: string
  endTime: string
  repeat: string
  completed: boolean
  status: TodoStatus
  company_id: string
  user_id: string
  created_at: Date
  updated_at: Date
  attachments?: string[] // URLs to uploaded files
  isDeleted: boolean
}