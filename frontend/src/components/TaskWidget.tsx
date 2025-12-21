import React from 'react';
import { useGetTasksQuery, useUpdateTaskStatusMutation } from '../store/api';
import { CheckCircle, XCircle, Clock, AlertCircle, ShoppingBag, UserPlus, Zap } from 'lucide-react';
import { useUI } from './UIContext';

const TaskWidget = () => {
    const { data: tasks, isLoading, refetch } = useGetTasksQuery(undefined, {
        pollingInterval: 60000 // Refresh every minute
    });
    const [updateStatus] = useUpdateTaskStatusMutation();
    const { showAlert } = useUI();

    const handleComplete = async (taskId: string) => {
        try {
            await updateStatus({ taskId, status: 'COMPLETED' }).unwrap();
            showAlert('Task completed!', 'success');
            refetch();
        } catch (error) {
            showAlert('Error updating task', 'error');
        }
    };

    const handleDismiss = async (taskId: string) => {
        try {
            await updateStatus({ taskId, status: 'DISMISSED' }).unwrap();
            refetch();
        } catch (error) {
            showAlert('Error dismissing task', 'error');
        }
    };

    if (isLoading) return <div className="h-40 bg-white dark:bg-slate-800 rounded-xl animate-pulse"></div>;

    if (!tasks || tasks.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div className="bg-green-100 dark:bg-green-500/10 p-4 rounded-full mb-3">
                    <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">All Caught Up!</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">No pending tasks. Great job keeping your network active!</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" fill="currentColor" />
                    Smart Tasks
                    <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full">
                        {tasks.length} Pending
                    </span>
                </h3>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                {tasks.map((task: any) => (
                    <div
                        key={task._id}
                        className="group p-3 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700 transition-all flex flex-col gap-2 shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                {/* Icon based on Type */}
                                <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${task.type === 'REORDER_REMINDER' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' :
                                        task.type === 'ACTIVATION_REMINDER' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                            'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                    }`}>
                                    {task.type === 'REORDER_REMINDER' && <ShoppingBag size={16} />}
                                    {task.type === 'ACTIVATION_REMINDER' && <UserPlus size={16} />}
                                    {task.type === 'INACTIVITY_ALERT' && <Clock size={16} />}
                                </div>

                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{task.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>

                                    {/* Priority Badge */}
                                    {task.priority === 'HIGH' && (
                                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-500/20">
                                            <AlertCircle size={10} /> High Priority
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleDismiss(task._id)}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 px-2 py-1"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => handleComplete(task._id)}
                                className="flex items-center gap-1 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                                <CheckCircle size={12} /> Mark Done
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskWidget;
