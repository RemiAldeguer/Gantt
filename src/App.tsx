import React, { useState } from 'react'
import { format, addDays, differenceInDays, startOfWeek, addWeeks, subDays } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

interface Task {
  id: string
  text: string
  startDate: Date
  duration: number
  progress: number
}

const CELL_WIDTH = 40
const ROW_HEIGHT = 40

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Task 1', startDate: new Date(2024, 0, 1), duration: 5, progress: 0.45 },
    { id: '2', text: 'Task 2', startDate: new Date(2024, 0, 3), duration: 5, progress: 0.3 },
  ])

  const [newTask, setNewTask] = useState<Partial<Task>>({
    text: '',
    startDate: new Date(),
    duration: 1,
    progress: 0,
  })

  const handleAddTask = () => {
    if (newTask.text && newTask.startDate) {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          text: newTask.text,
          startDate: newTask.startDate,
          duration: newTask.duration || 1,
          progress: newTask.progress || 0,
        },
      ])
      setNewTask({ text: '', startDate: new Date(), duration: 1, progress: 0 })
    }
  }

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const startDate = startOfWeek(tasks.reduce((min, task) => (task.startDate < min ? task.startDate : min), new Date()))
  const endDate = addWeeks(startDate, 4)
  const totalDays = differenceInDays(endDate, startDate)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    const dropX = e.clientX - e.currentTarget.getBoundingClientRect().left
    const newStartDay = Math.floor(dropX / CELL_WIDTH)

    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newStartDate = addDays(startDate, newStartDay)
        return { ...task, startDate: newStartDate }
      }
      return task
    }))
  }

  const renderGanttChart = () => {
    return (
      <div className="overflow-x-auto">
        <div 
          style={{ width: `${totalDays * CELL_WIDTH}px` }} 
          className="relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="flex border-b">
            {Array.from({ length: totalDays }).map((_, index) => (
              <div
                key={index}
                style={{ width: `${CELL_WIDTH}px` }}
                className="text-center text-xs py-1 border-r"
              >
                {format(addDays(startDate, index), 'MM/dd')}
              </div>
            ))}
          </div>

          {/* Tasks */}
          <ErrorBoundary>
            {tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="relative"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                <div
                  className="absolute h-6 rounded cursor-move"
                  style={{
                    left: `${differenceInDays(task.startDate, startDate) * CELL_WIDTH}px`,
                    width: `${task.duration * CELL_WIDTH}px`,
                    top: '8px',
                    backgroundColor: '#3b82f6',
                  }}
                >
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${task.progress * 100}%`,
                      backgroundColor: '#1d4ed8',
                    }}
                  />
                </div>
                <div
                  className="absolute text-xs font-semibold text-white truncate"
                  style={{
                    left: `${differenceInDays(task.startDate, startDate) * CELL_WIDTH + 4}px`,
                    top: '10px',
                    maxWidth: `${task.duration * CELL_WIDTH - 8}px`,
                  }}
                >
                  {task.text}
                </div>
              </div>
            ))}
          </ErrorBoundary>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Custom Gantt Chart App</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Task Name"
            className="border rounded px-3 py-2 w-full sm:w-64"
            value={newTask.text}
            onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
          />
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={format(newTask.startDate || new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setNewTask({ ...newTask, startDate: new Date(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Duration (days)"
            className="border rounded px-3 py-2 w-32"
            value={newTask.duration}
            onChange={(e) => setNewTask({ ...newTask, duration: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Progress (%)"
            className="border rounded px-3 py-2 w-32"
            value={newTask.progress ? newTask.progress * 100 : ''}
            onChange={(e) =>
              setNewTask({
                ...newTask,
                progress: Math.min(1, Math.max(0, Number(e.target.value) / 100)),
              })
            }
          />
          <button
            onClick={handleAddTask}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center"
          >
            <Plus size={18} className="mr-2" /> Add Task
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Task List</h2>
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className="flex justify-between items-center mb-2">
              <span>{task.text}</span>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Gantt Chart</h2>
        {renderGanttChart()}
      </div>
    </div>
  )
}

export default App