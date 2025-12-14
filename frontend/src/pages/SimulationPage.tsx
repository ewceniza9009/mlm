
import CommissionSimulation from '../components/CommissionSimulation';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SimulationPage = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate('/dashboard/help')}
                className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium text-sm group"
            >
                <div className="bg-white dark:bg-[#1a1b23] p-1.5 rounded-lg border border-gray-200 dark:border-white/10 group-hover:border-teal-500/50 shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                Back to Help Center
            </button>

            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compensation Simulator</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Interactive demonstration of how commissions, PV flow, and rank advancements work.
                </p>
            </div>

            <CommissionSimulation />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Referral Bonus</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Earn a direct percentage bonus every time you personally enroll a new member with a product package.
                    </p>
                </div>
                <div className="p-6 bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Binary Commissions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        As your team grows on both left and right legs, you earn cycle bonuses when volumes match between the legs.
                    </p>
                </div>
                <div className="p-6 bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Rank Advancement</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Unlock higher earning potential and special rewards as you accumulate Group Volume (GV) and rise through the ranks.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SimulationPage;
