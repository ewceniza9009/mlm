
import { useNavigate } from 'react-router-dom';
import { HelpCircle, MessageSquare, Book, TrendingUp, ArrowRight, LifeBuoy } from 'lucide-react';

const HelpPage = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl text-center md:text-left">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

                <div className="relative z-10 max-w-4xl mx-auto md:mx-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-teal-300 text-xs font-bold uppercase tracking-wider mb-6">
                        <LifeBuoy size={14} /> Help Center
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        How can we help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">succeed today?</span>
                    </h1>
                    <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto md:mx-0">
                        Find answers, explore guides, or get in touch with our expert support team. We're here to support your journey.
                    </p>


                </div>
            </div>

            {/* Featured Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Compensation Simulator - Hero Card */}
                <div
                    onClick={() => navigate('/dashboard/simulation')}
                    className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/10 transition-colors"></div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-500 group-hover:scale-110 transition-transform">
                            <TrendingUp size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-500 transition-colors">Compensation Simulator</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Visualize your earning potential with our interactive detailed simulator. Experiment with network structures and see real-time commission calculations.
                        </p>
                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-2 transition-transform">
                            Start Simulation <ArrowRight size={18} className="ml-2" />
                        </div>
                    </div>
                </div>

                {/* Documentation - Hero Card */}
                <div
                    onClick={() => navigate('/dashboard/documentation')}
                    className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/10 transition-colors"></div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                            <Book size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-500 transition-colors">Documentation & Guides</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Master the platform with our comprehensive guides. From getting started to advanced network management strategies.
                        </p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                            Browse Articles <ArrowRight size={18} className="ml-2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Support & FAQ Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FAQ Card */}
                <div
                    onClick={() => navigate('/dashboard/faq')}
                    className="md:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-lg"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase">
                            Q&A
                        </div>
                        <HelpCircle className="text-slate-300 group-hover:text-purple-500 transition-colors" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Frequently Asked Questions</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Quick answers to common questions about payouts, ranks, and account settings.
                    </p>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">View FAQs</span>
                </div>

                {/* Support Card */}
                <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                                <MessageSquare size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Need personalized help?</h3>
                        </div>
                        <p className="text-teal-50 leading-relaxed">
                            Our support team is standing by to help you resolve any issues or answer specific questions about your business.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/dashboard/support')}
                            className="whitespace-nowrap bg-white text-teal-600 px-6 py-3 rounded-xl font-bold hover:bg-teal-50 hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                        >
                            Contact Support <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
