import React from 'react';
import { useGetMemberDetailsQuery } from '../store/api';
import { X, MapPin, Calendar, Users, Award, Briefcase, User as UserIcon, Activity, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface NetworkNodeModalProps {
    memberId: string;
    onClose: () => void;
}

const NetworkNodeModal: React.FC<NetworkNodeModalProps> = ({ memberId, onClose }) => {
    const { data: member, isLoading, error } = useGetMemberDetailsQuery(memberId);
    const [activeTab, setActiveTab] = React.useState<'overview' | 'personal'>('overview');

    if (!memberId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur rounded-full text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-teal-500 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
                        <span className="font-medium">Loading details...</span>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">
                        <p className="font-bold">Error loading member details.</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Header Profile Section */}
                        <div className="relative bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-800 p-8 text-white text-center shrink-0">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full border-4 border-white/30 shadow-xl bg-white/10 backdrop-blur flex items-center justify-center text-3xl font-bold mb-3">
                                    {member?.profile?.profileImage ? (
                                        <img src={member.profile.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        member?.profile?.firstName?.charAt(0) || member?.profile?.username?.charAt(0)
                                    )}
                                </div>
                                <h2 className="text-xl font-bold mb-1">
                                    {member?.profile?.firstName ? `${member.profile.firstName} ${member.profile.lastName}` : member?.profile?.username}
                                </h2>
                                <div className="flex items-center gap-2 text-teal-50 text-xs font-medium">
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur">{member?.profile?.rank || 'Member'}</span>
                                    <span>•</span>
                                    <span>{member?.profile?.username}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'personal' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                Personal
                            </button>
                        </div>

                        {/* Details Body (Scrollable) */}
                        <div className="p-6 overflow-y-auto">

                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Key Stats Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                                <Award size={14} /> Total Earned
                                            </div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-white">
                                                ${(member?.stats?.totalEarned || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                                <Users size={14} /> Team Size
                                            </div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-white">
                                                {(member?.stats?.teamSize || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* PV Stats */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Activity size={14} /> Performance Volume
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-center">
                                                <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase mb-1">Personal PV</div>
                                                <div className="text-xl font-bold text-slate-800 dark:text-white">{(member?.stats?.personalPV || 0).toLocaleString()}</div>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 text-center">
                                                <div className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-1">Left PV</div>
                                                <div className="text-xl font-bold text-slate-800 dark:text-white">{(member?.stats?.currentLeftPV || 0).toLocaleString()}</div>
                                            </div>
                                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30 text-center">
                                                <div className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase mb-1">Right PV</div>
                                                <div className="text-xl font-bold text-slate-800 dark:text-white">{(member?.stats?.currentRightPV || 0).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-start gap-3 border border-amber-100 dark:border-amber-800/30">
                                        <Users size={16} className="text-amber-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Direct Recruits</p>
                                            <p className="text-sm text-amber-900 dark:text-amber-200">
                                                Has personally sponsored <span className="font-bold">{(member?.stats?.directRecruits || 0).toLocaleString()}</span> members.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'personal' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                                        <UserIcon size={14} /> Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Full Name Explicit Row */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <UserIcon size={16} /> Full Name
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                                {member?.profile?.firstName ? `${member.profile.firstName} ${member.profile.lastName}` : 'Not provided'}
                                            </span>
                                        </div>

                                        {/* Occupation */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <Briefcase size={16} /> Occupation
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                                {member?.profile?.occupation || 'Not provided'}
                                            </span>
                                        </div>

                                        {/* Email */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <Mail size={16} /> Email
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px]">{member?.profile?.email}</span>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <Phone size={16} /> Phone
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{member?.profile?.phone || 'Not provided'}</span>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <MapPin size={16} /> Location
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm text-right max-w-[200px] truncate">
                                                {[
                                                    member?.profile?.address?.city,
                                                    member?.profile?.address?.state,
                                                    member?.profile?.address?.country
                                                ].filter(Boolean).join(', ') || member?.profile?.country || 'Unknown'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <Calendar size={16} /> Joined
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                                {member?.profile?.enrollmentDate ? format(new Date(member.profile.enrollmentDate), 'MMM d, yyyy') : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NetworkNodeModal;
