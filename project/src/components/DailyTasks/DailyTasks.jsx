import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { usePoints } from '../../hooks/usePoints'
import { useAuthContext } from '../../context/AuthContext'

export const DailyTasks = () => {
  const { user } = useAuthContext()
  const { tasks, completeTask, isTaskCompleted, getTodayTotalReward, getTodayPotentialReward, loading } = useTasks(user?.id)
  const { points, refetch: refetchPoints } = usePoints(user?.id)
  const [completingTaskId, setCompletingTaskId] = useState(null)

  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId)
    const success = await completeTask(taskId)
    if (success) {
      await refetchPoints()
    }
    setCompletingTaskId(null)
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-32"></div>
            <div className="h-3 bg-slate-200 rounded w-28"></div>
          </div>
        </div>
      </div>
    )
  }

  const completedCount = tasks.filter(t => isTaskCompleted(t.id)).length
  const remainingReward = getTodayPotentialReward() - getTodayTotalReward()

  return (
    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">每日任务</h3>
            <p className="text-xs text-slate-600 mt-1">
              完成 {completedCount}/{tasks.length} 任务
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-amber-600">
              +{getTodayTotalReward()} / {getTodayPotentialReward()}
            </div>
            <div className="text-xs text-slate-500 mt-1">今日积分</div>
          </div>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => {
            const isCompleted = isTaskCompleted(task.id)
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCompleted
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-white border border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="text-2xl">{task.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-green-700' : 'text-slate-900'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{task.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className={`text-sm font-semibold ${isCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                    +{task.points_reward}
                  </span>
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={isCompleted || completingTaskId === task.id}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isCompleted
                        ? 'bg-green-200 text-green-700 cursor-default'
                        : completingTaskId === task.id
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700'
                    }`}
                  >
                    {isCompleted ? '已完成' : completingTaskId === task.id ? '处理中...' : '完成'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {remainingReward > 0 && (
          <div className="pt-2 border-t border-amber-200">
            <p className="text-xs text-slate-600 text-center">
              还可获得 <span className="font-semibold text-amber-600">{remainingReward}</span> 积分
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
