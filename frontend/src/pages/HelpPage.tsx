
import { useNavigate } from 'react-router-dom';
import { HelpCircle, FileText, MessageSquare, Book, ExternalLink } from 'lucide-react';

const HelpPage = () => {
    const navigate = useNavigate();

    const helpOptions = [
        {
            title: 'Documentation',
            description: 'Comprehensive guides and technical documentation for the platform.',
            icon: Book,
            path: '/dashboard/documentation',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-500/10'
        },
        {
            title: 'Frequently Asked Questions',
            description: 'Quick answers to common questions about your account and earnings.',
            icon: HelpCircle,
            path: '/dashboard/faq',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-500/10'
        },
        {
            title: 'Contact Support',
            description: 'Need personalized help? Reach out to our support team directly.',
            icon: MessageSquare,
            path: '/dashboard/support',
            color: 'text-teal-500',
            bgColor: 'bg-teal-50 dark:bg-teal-500/10'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Find the answers you need to succeed with GenMatrix.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {helpOptions.map((option) => (
                    <div
                        key={option.title}
                        onClick={() => navigate(option.path)}
                        className="bg-white dark:bg-[#1a1b23] p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    >
                        <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <option.icon className={`w-6 h-6 ${option.color}`} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-500 transition-colors">
                            {option.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {option.description}
                        </p>
                        <div className="mt-4 flex items-center text-sm font-medium text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>View Now</span>
                            <ExternalLink size={14} className="ml-1" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-24 -mb-24"></div>

                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-bold mb-4">Still need assistance?</h2>
                    <p className="text-teal-50 mb-6 leading-relaxed">
                        Our dedicated support team is available 24/7 to assist you with any issues or questions you may have.
                        We're here to help you grow your network and maximize your earnings.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/support')}
                        className="bg-white text-teal-600 px-6 py-2.5 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-lg shadow-black/10"
                    >
                        Open Support Ticket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
