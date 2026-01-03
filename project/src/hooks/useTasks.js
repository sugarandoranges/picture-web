import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useTasks = (userId) => {
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('is_active', true)

      if (fetchError) throw fetchError
      setTasks(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedTasks = async () => {
    if (!userId) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error: fetchError } = await supabase
        .from('user_task_completions')
        .select('task_id')
        .eq('user_id', userId)
        .eq('completed_at', today)

      if (fetchError) throw fetchError
      setCompletedTasks(data?.map(t => t.task_id) || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    fetchCompletedTasks()
  }, [userId])

  const completeTask = async (taskId) => {
    if (!userId || completedTasks.includes(taskId)) return false

    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return false

      const today = new Date().toISOString().split('T')[0]

      const { error: completionError } = await supabase
        .from('user_task_completions')
        .insert([{
          user_id: userId,
          task_id: taskId,
          completed_at: today,
        }])

      if (completionError) throw completionError

      const { error: pointsError } = await supabase
        .from('user_points')
        .update({
          points_balance: supabase.rpc('increment_points', {
            user_id_param: userId,
            amount: task.points_reward,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      await supabase
        .from('point_transactions')
        .insert([{
          user_id: userId,
          points_amount: task.points_reward,
          transaction_type: 'daily_reward',
          description: `Daily task: ${task.title}`,
        }])

      setCompletedTasks([...completedTasks, taskId])
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const isTaskCompleted = (taskId) => completedTasks.includes(taskId)

  const getTodayTotalReward = () => {
    return tasks
      .filter(task => isTaskCompleted(task.id))
      .reduce((sum, task) => sum + task.points_reward, 0)
  }

  const getTodayPotentialReward = () => {
    return tasks.reduce((sum, task) => sum + task.points_reward, 0)
  }

  return {
    tasks,
    completedTasks,
    loading,
    error,
    completeTask,
    isTaskCompleted,
    getTodayTotalReward,
    getTodayPotentialReward,
    refetch: fetchTasks,
  }
}
