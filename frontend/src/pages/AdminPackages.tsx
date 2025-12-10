import { useState } from 'react';
import { Package, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useGetPackagesQuery, useCreatePackageMutation, useUpdatePackageMutation, useDeletePackageMutation } from '../store/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPackages = () => {
    const { data: packages = [], isLoading } = useGetPackagesQuery(true);
    const [createPackage] = useCreatePackageMutation();
    const [updatePackage] = useUpdatePackageMutation();
    const [deletePackage] = useDeletePackageMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        pv: 0,
        description: '',
        badge: '',
        features: [''],
        isActive: true
    });

    const handleOpenCreate = () => {
        setEditingPackage(null);
        setFormData({
            name: '',
            price: 0,
            pv: 0,
            description: '',
            badge: '',
            features: [''],
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (pkg: any) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            price: pkg.price,
            pv: pkg.pv,
            description: pkg.description || '',
            badge: pkg.badge || '',
            features: pkg.features?.length ? pkg.features : [''],
            isActive: pkg.isActive
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this package?')) {
            await deletePackage(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanFeatures = formData.features.filter(f => f.trim() !== '');

        const payload = { ...formData, features: cleanFeatures };

        try {
            if (editingPackage) {
                await updatePackage({ id: editingPackage._id, ...payload }).unwrap();
            } else {
                await createPackage(payload).unwrap();
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error('Failed to save package', err);
            alert('Failed to save package');
        }
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const addFeatureField = () => {
        setFormData({ ...formData, features: [...formData.features, ''] });
    };

    const removeFeatureField = (index: number) => {
        const newFeatures = formData.features.filter((_, i) => i !== index);
        setFormData({ ...formData, features: newFeatures });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Package size={24} className="md:w-8 md:h-8 text-teal-600 dark:text-teal-400" /> Package Management
                </h1>
                <button
                    onClick={handleOpenCreate}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors"
                >
                    <Plus size={20} /> Create Package
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading packages...</div>
                ) : packages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No packages found. Create one to get started!</div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Desktop Table */}
                        <table className="w-full text-left hidden md:table">
                            <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">PV</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Badge</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {packages.map((pkg: any) => (
                                    <tr key={pkg._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{pkg.name}</td>
                                        <td className="px-6 py-4 text-teal-600 dark:text-teal-400 font-mono">${pkg.price}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-mono">{pkg.pv} PV</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${pkg.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                                {pkg.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {pkg.badge && (
                                                <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 px-2 py-1 rounded text-xs">
                                                    {pkg.badge}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleOpenEdit(pkg)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(pkg._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
                            {packages.map((pkg: any) => (
                                <div key={pkg._id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white text-lg">{pkg.name}</div>
                                            <div className="text-teal-600 dark:text-teal-400 font-mono font-bold">${pkg.price}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenEdit(pkg)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(pkg._id)} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-gray-600 dark:text-slate-300 font-mono text-sm bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                                            {pkg.pv} PV
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${pkg.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                            {pkg.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        {pkg.badge && (
                                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 px-2 py-1 rounded text-xs">
                                                {pkg.badge}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-11/12 md:w-full md:max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingPackage ? 'Edit Package' : 'Create New Package'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Package Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Price ($)</label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">PV Points</label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                                            value={formData.pv}
                                            onChange={e => setFormData({ ...formData, pv: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Badge (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Best Value"
                                            className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                                            value={formData.badge}
                                            onChange={e => setFormData({ ...formData, badge: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea
                                        className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white h-20"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Features</label>
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder={`Feature ${index + 1}`}
                                                className="flex-1 p-2 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                                                value={feature}
                                                onChange={e => handleFeatureChange(index, e.target.value)}
                                            />
                                            <button type="button" onClick={() => removeFeatureField(index)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addFeatureField} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                                        + Add Feature
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-slate-300 select-none">
                                        Active (Visible to users)
                                    </label>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-2"
                                    >
                                        <Save size={18} /> Save Package
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPackages;
