
import CommissionSimulation from '../components/CommissionSimulation';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SimulationPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-auto lg:h-[calc(100vh-6rem)] gap-2 lg:gap-4 animate-in fade-in duration-500">
            <div className="shrink-0 space-y-2 lg:space-y-4">
                <button
                    onClick={() => navigate('/dashboard/help')}
                    className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium text-xs lg:text-sm group"
                >
                    <div className="bg-white dark:bg-[#1a1b23] p-1 lg:p-1.5 rounded-lg border border-gray-200 dark:border-white/10 group-hover:border-teal-500/50 shadow-sm">
                        <ArrowLeft size={14} className="lg:w-4 lg:h-4" />
                    </div>
                    Back to Help Center
                </button>

                <div>
                    <h1 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">Compensation Simulator</h1>
                    <p className="hidden lg:block text-gray-500 dark:text-gray-400 mt-1">
                        Interactive demonstration of how commissions, PV flow, and rank advancements work.
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <CommissionSimulation />
            </div>
        </div>
    );
};

export default SimulationPage;
