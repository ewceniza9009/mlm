
import { useNavigate } from 'react-router-dom';
import { HelpCircle, MessageSquare, Book, TrendingUp, ArrowRight, LifeBuoy } from 'lucide-react';

const HelpPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500">
            {/* Header / Hero - Premium Gradient & Shapes */}
            <div className="shrink-0 relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden flex items-center border border-slate-700/50">
                {/* Premium Background Effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

                <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
                            <LifeBuoy size={14} /> Help Center
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                            How can we help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">succeed today?</span>
                        </h1>
                        <p className="text-slate-300 text-base max-w-2xl">
                            Explore our comprehensive guides, simulate your earnings, or get personalized support.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid - Full Coverage, Premium Cards */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Primary Tools (Simulator & Docs) */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full">

                    {/* Simulator - Premium Interactive Card */}
                    <div
                        onClick={() => navigate('/dashboard/simulation')}
                        className="group flex-1 relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                        {/* Ambient Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-500 group-hover:scale-110 transition-transform">
                                <TrendingUp size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-500 transition-colors">Compensation Simulator</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-lg">
                                Visualize your earning potential with our interactive detailed simulator. Experiment with network structures to clarify your targets.
                            </p>
                        </div>
                        <div className="relative z-10 mt-6">
                            <div className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-2 transition-transform">
                                Launch Simulator <ArrowRight size={18} className="ml-2" />
                            </div>
                        </div>
                    </div>

                    {/* Documentation - Premium Card */}
                    <div
                        onClick={() => navigate('/dashboard/documentation')}
                        className="group flex-1 relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                        {/* Ambient Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                                <Book size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-500 transition-colors">Documentation & Guides</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-lg">
                                Master the platform with detailed guides. Learn about rank requirements, commission rules, and system navigation.
                            </p>
                        </div>
                        <div className="relative z-10 mt-6">
                            <div className="inline-flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                                Browse Articles <ArrowRight size={18} className="ml-2" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Q&A and Support */}
                <div className="lg:col-span-1 flex flex-col gap-6 h-full">

                    {/* FAQ - Stylish Panel */}
                    <div
                        onClick={() => navigate('/dashboard/faq')}
                        className="group flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-center items-center text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 p-4 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                            <HelpCircle size={32} />
                        </div>
                        <h3 className="relative z-10 text-xl font-bold text-slate-900 dark:text-white">FAQ</h3>
                        <p className="relative z-10 text-slate-500 dark:text-slate-400 text-sm mt-2 mb-4 px-4">
                            Quick answers to common questions.
                        </p>
                        <span className="relative z-10 text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide group-hover:underline">View Questions</span>
                    </div>

                    {/* Support - Premium Gradient Card */}
                    <div className="flex-[1.2] relative overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-700 rounded-3xl p-8 text-white shadow-2xl shadow-teal-500/20 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
                                    <MessageSquare size={24} className="text-white" />
                                </div>
                                <span className="font-bold uppercase tracking-wider text-teal-100 text-sm">Support</span>
                            </div>
                            <h3 className="text-2xl font-bold leading-tight mb-2">Need specific help?</h3>
                            <p className="text-teal-50 text-base leading-relaxed opacity-90">
                                Our support team is ready to assist you with any specific account issues.
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 md:mt-0">
                            <button
                                onClick={() => navigate('/dashboard/support')}
                                className="w-full py-4 bg-white text-teal-700 font-bold rounded-xl text-base hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                Contact Support <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
