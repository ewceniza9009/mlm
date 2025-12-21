import { useState, useEffect } from 'react';
import { useGetSettingsQuery, useUpdateSettingMutation } from '../store/api';
import { Settings, Shield, CheckCircle2, AlertTriangle, ShoppingBag, TrendingUp } from 'lucide-react';

const AdminSettingsPage = () => {
    const { data: settings, isLoading } = useGetSettingsQuery();
    const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation();

    // Local state for immediate UI feedback
    const [requireKYC, setRequireKYC] = useState(false);
    const [enableShop, setEnableShop] = useState(false);
    const [enablePublicShop, setEnablePublicShop] = useState(false);
    const [shopFirstEnrollment, setShopFirstEnrollment] = useState(false);
    const [shopFirstHoldingTank, setShopFirstHoldingTank] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Rank Requirements State
    const [rankReqs, setRankReqs] = useState<any>({
        "Silver": { "earnings": 1000, "recruits": 2 },
        "Gold": { "earnings": 5000, "recruits": 5 },
        "Diamond": { "earnings": 20000, "recruits": 10 }
    });

    useEffect(() => {
        if (settings) {
            setRequireKYC(settings.withdrawals_require_kyc === true);
            setEnableShop(settings.enableShop === true);
            setEnablePublicShop(settings.enablePublicShop === true);
            setShopFirstEnrollment(settings.shopFirstEnrollment === true);
            setShopFirstHoldingTank(settings.shopFirstHoldingTank === true);

            if (settings.rankRequirements) {
                setRankReqs(settings.rankRequirements);
            }
        }
    }, [settings]);

    // Handler for updating nested rank objects locally
    const handleRankReqChange = (rank: string, field: string, value: number) => {
        setRankReqs((prev: any) => ({
            ...prev,
            [rank]: {
                ...prev[rank],
                [field]: isNaN(value) ? 0 : Math.max(0, value)
            }
        }));
    };

    // Handler to save the entire rankRequirements object to backend
    const handleSaveRankReqs = async () => {
        try {
            await updateSetting({ key: 'rankRequirements', value: rankReqs }).unwrap();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update rank requirements', error);
        }
    };



    const handleToggleKYC = async () => {
        const newValue = !requireKYC;
        setRequireKYC(newValue); // Optimistic update

        try {
            await updateSetting({ key: 'withdrawals_require_kyc', value: newValue }).unwrap();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update setting', error);
            setRequireKYC(!newValue); // Revert on error
        }
    };

    const handleToggleShop = async () => {
        const newValue = !enableShop;
        setEnableShop(newValue); // Optimistic update

        // Sync local state with backend safeguard: If Shop is disabled, Shop First features must be disabled.
        if (newValue === false) {
            setShopFirstEnrollment(false);
            setShopFirstHoldingTank(false);
        }

        try {
            await updateSetting({ key: 'enableShop', value: newValue }).unwrap();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update setting', error);
            setEnableShop(!newValue); // Revert on error
            // Theoretically revert the others too if it failed, but likely acceptable to drift on error.
        }
    };


    const handleTogglePublicShop = async () => {
        const newValue = !enablePublicShop;
        setEnablePublicShop(newValue); // Optimistic update

        try {
            await updateSetting({ key: 'enablePublicShop', value: newValue }).unwrap();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update setting', error);
            setEnablePublicShop(!newValue); // Revert on error
        }
    };

    const handleToggleShopFirst = async () => {
        const newValue = !shopFirstEnrollment;
        setShopFirstEnrollment(newValue); // Optimistic update

        // If disabling Shop First Enrollment, also disable Shop First Holding Tank
        if (newValue === false) {
            setShopFirstHoldingTank(false);
            await updateSetting({ key: 'shopFirstHoldingTank', value: false }).unwrap();
        }

        try {
            await updateSetting({ key: 'shopFirstEnrollment', value: newValue }).unwrap();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update setting', error);
            setShopFirstEnrollment(!newValue); // Revert on error
            // If we forced holding tank off, should we revert it? 
            // Probably fine to leave it off or revert it if we want strict consistency, but complex.
        }
    };

    // New handler for Shop First Holding Tank
    const handleToggleShopFirstHoldingTank = async () => {
        const newValue = !shopFirstHoldingTank;
        setShopFirstHoldingTank(newValue); // Optimistic update

        try {
            await updateSetting({ key: 'shopFirstHoldingTank', value: newValue }).unwrap();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update setting', error);
            setShopFirstHoldingTank(!newValue); // Revert on error
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animation-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings className="text-teal-500" /> System Settings
                </h1>
                <p className="text-gray-500 dark:text-slate-400">Configure global application behaviors.</p>
            </div>

            {/* Settings Sections */}
            <div className="grid gap-6">

                {/* Commerce Features Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <ShoppingBag className="text-teal-500" size={24} />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Commerce Features</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Setting Item: Enable Shop */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Enable Product Shop (Members)</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Show the Shop link in the sidebar for logged-in members.
                                </p>
                            </div>

                            <button
                                onClick={handleToggleShop}
                                disabled={isUpdating}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${enableShop ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enableShop ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>



                        {/* Setting Item: Shop First Enrollment */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Shop First Enrollment</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Require new members to purchase a product before being placed in the network tree.
                                </p>
                            </div>

                            <button
                                onClick={handleToggleShopFirst}
                                disabled={isUpdating || !enableShop}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${!enableShop
                                    ? 'bg-gray-100 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                                    : shopFirstEnrollment ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${shopFirstEnrollment ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Setting Item: Shop First Holding Tank */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Shop First Holding Tank</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Send Shop First recruits to Holding Tank instead of auto-placement.
                                </p>
                            </div>

                            <button
                                onClick={handleToggleShopFirstHoldingTank}
                                disabled={isUpdating || !shopFirstEnrollment}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${!shopFirstEnrollment
                                    ? 'bg-gray-100 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                                    : shopFirstHoldingTank ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${shopFirstHoldingTank ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Setting Item: Enable Public Retail Shop */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Enable Public Retail Shop</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Allow guests to purchase via referral links (e.g., /store?ref=user).
                                </p>
                            </div>

                            <button
                                onClick={handleTogglePublicShop}
                                disabled={isUpdating}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${enablePublicShop ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enablePublicShop ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security Settings Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <Shield className="text-indigo-500" size={24} />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security & Compliance</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Setting Item: KYC for Withdrawals */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Require KYC for Withdrawals</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    If enabled, users must have "Approved" KYC status to request a payout.
                                </p>
                            </div>

                            <button
                                onClick={handleToggleKYC}
                                disabled={isUpdating}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${requireKYC ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${requireKYC ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {requireKYC && (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    Users without approved documents will see a denial message when attempting to withdraw.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rank Requirements Configuration */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-amber-500" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rank Requirements</h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Set targets for automation.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveRankReqs}
                            disabled={isUpdating}
                            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            Save Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Silver', 'Gold', 'Diamond'].map((rank) => (
                            <div key={rank} className="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={`p-1.5 rounded-lg ${rank === 'Diamond' ? 'bg-cyan-100 text-cyan-600' : rank === 'Gold' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-200 text-slate-600'}`}>
                                        <Shield size={16} className="fill-current" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{rank}</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Earnings Target ($)</label>
                                        <input
                                            type="number"
                                            value={rankReqs[rank]?.earnings || 0}
                                            onChange={(e) => handleRankReqChange(rank, 'earnings', parseInt(e.target.value) || 0)}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Direct Recruits</label>
                                        <input
                                            type="number"
                                            value={rankReqs[rank]?.recruits || 0}
                                            onChange={(e) => handleRankReqChange(rank, 'recruits', parseInt(e.target.value) || 0)}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Success Message toast */}
                {showSuccess && (
                    <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce-in z-50">
                        <CheckCircle2 size={18} /> Settings Saved
                    </div>
                )}

                {/* More settings sections can go here (e.g., General, Fees, etc.) */}

            </div>
        </div>
    );
};

export default AdminSettingsPage;
