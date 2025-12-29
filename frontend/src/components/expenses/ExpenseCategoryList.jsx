import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { expenseCategoryService } from '../../services/expenseCategoryService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    TagIcon,
    ChartBarIcon,
    ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';

const ExpenseCategoryList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeCategories, setActiveCategories] = useState([]);
    const [inactiveCategories, setInactiveCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [usageStats, setUsageStats] = useState({});

    // Fetch categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const allCategories = await expenseCategoryService.getExpenseCategories(true); // Fetch all
            let filteredCategories = allCategories || [];

            // Filter by search term
            if (searchTerm) {
                filteredCategories = filteredCategories.filter(category =>
                    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            // Sort categories
            filteredCategories.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];

                if (sortBy === 'created_at') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (sortOrder === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                } else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            });

            setActiveCategories(filteredCategories.filter(c => c.is_active));
            setInactiveCategories(filteredCategories.filter(c => !c.is_active));

            // Fetch usage stats for each category
            const statsPromises = filteredCategories.map(category =>
                expenseCategoryService.getCategoryUsageStats(category.id)
                    .then(stats => ({ [category.id]: stats }))
                    .catch(() => ({ [category.id]: null }))
            );

            const statsResults = await Promise.all(statsPromises);
            const statsMap = {};
            statsResults.forEach(stats => {
                Object.assign(statsMap, stats);
            });
            setUsageStats(statsMap);

        } catch (error) {
            toast.error('Failed to fetch categories');
            setActiveCategories([]);
            setInactiveCategories([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchCategories();
    }, [searchTerm, sortBy, sortOrder]);

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    // Handle sort
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Delete category
    const handleDelete = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            const result = await expenseCategoryService.deleteExpenseCategory(categoryId);
            if (result.message && result.message.includes('deactivated')) {
                toast.success('Category deactivated successfully (has associated expenses)');
                // Move from active to inactive
                const categoryToMove = activeCategories.find(c => c.id === categoryId);
                if (categoryToMove) {
                    setActiveCategories(prev => prev.filter(c => c.id !== categoryId));
                    setInactiveCategories(prev => [{ ...categoryToMove, is_active: false }, ...prev]);
                }
            } else {
                toast.success('Category deleted successfully');
                // Remove from whichever list it's in
                setActiveCategories(prev => prev.filter(c => c.id !== categoryId));
                setInactiveCategories(prev => prev.filter(c => c.id !== categoryId));
            }
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    // Toggle category active status
    const handleToggleActive = async (categoryId) => {
        try {
            await expenseCategoryService.toggleCategoryActive(categoryId);
            toast.success('Category status updated successfully');

            // Optimistically update UI
            let categoryToMove;
            let isActive;

            const activeMatch = activeCategories.find(c => c.id === categoryId);
            if (activeMatch) {
                categoryToMove = { ...activeMatch, is_active: false };
                isActive = false;
                setActiveCategories(prev => prev.filter(c => c.id !== categoryId));
                setInactiveCategories(prev => [categoryToMove, ...prev]);
            } else {
                const inactiveMatch = inactiveCategories.find(c => c.id === categoryId);
                if (inactiveMatch) {
                    categoryToMove = { ...inactiveMatch, is_active: true };
                    isActive = true;
                    setInactiveCategories(prev => prev.filter(c => c.id !== categoryId));
                    setActiveCategories(prev => [categoryToMove, ...prev]);
                }
            }
        } catch (error) {
            toast.error('Failed to update category status');
            // Optionally refetch to rollback optimistic update on error
            fetchCategories();
        }
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedCategories.length === 0) {
            toast.error('Please select categories to delete');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedCategories.length} categories?`)) {
            return;
        }

        try {
            await expenseCategoryService.bulkDeleteCategories(selectedCategories);
            toast.success(`${selectedCategories.length} categories deleted successfully`);

            // Optimistically update UI
            setActiveCategories(prev => prev.filter(c => !selectedCategories.includes(c.id)));
            setInactiveCategories(prev => prev.filter(c => !selectedCategories.includes(c.id)));
            setSelectedCategories([]);

        } catch (error) {
            toast.error('Failed to delete categories');
            // Optionally refetch to rollback optimistic update on error
            fetchCategories();
        }
    };

    // Toggle category selection
    const toggleCategorySelection = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    // Select all categories
    const toggleSelectAll = () => {
        const allCategories = [...activeCategories, ...inactiveCategories];
        if (selectedCategories.length === allCategories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(allCategories.map(category => category.id));
        }
    };

    // Get Sort Icon
    const getSortIcon = (field) => {
        if (sortBy !== field) {
            return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        }
        return sortOrder === 'asc'
            ? <ArrowsUpDownIcon className="h-4 w-4 text-primary-600 rotate-180" />
            : <ArrowsUpDownIcon className="h-4 w-4 text-primary-600" />;
    };

    // Refresh categories when returning from create/edit
    useEffect(() => {
        if (location.state?.refresh) {
            fetchCategories();
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    return (
        <div className="max-w-7xl mx-auto mt-20">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Expense Categories</h1>
                    <div className="flex items-center space-x-3">
                        <Link to="/expense-categories/new" className="btn-primary flex items-center">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Category
                        </Link>
                    </div>
                </div>
            </div>
            {/* Summary Stats */}
            {!loading && (activeCategories.length > 0 || inactiveCategories.length > 0) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card p-4">
                        <div className="flex items-center">
                            <TagIcon className="h-8 w-8 text-primary-600" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {activeCategories.length + inactiveCategories.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Total Categories
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center">
                            <ChartBarIcon className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {activeCategories.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Active Categories
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center">
                            <EyeIcon className="h-8 w-8 text-red-600" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {inactiveCategories.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Inactive Categories
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center">
                            <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {Object.values(usageStats).reduce((sum, stats) => sum + (stats?.expense_count || 0), 0)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Total Expenses
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="card p-6 mb-6">
                {/* Search Bar */}
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>

                </div>
            </div>

            {/* Bulk Actions */}
            {selectedCategories.length > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-primary-800">
                            {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
                        </span>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleBulkDelete}
                                className="btn-danger text-sm flex items-center"
                            >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedCategories([])}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Categories Table */}
            <div className="card overflow-hidden">
                <h2 className="text-lg font-bold text-gray-900 p-6">Active Categories</h2>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : activeCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No active categories found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm
                                ? 'Try adjusting your search'
                                : 'Get started by creating your first expense category'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.length === activeCategories.length && activeCategories.length > 0}
                                                onChange={() => {
                                                    if (selectedCategories.length === activeCategories.length) {
                                                        setSelectedCategories([]);
                                                    } else {
                                                        setSelectedCategories(activeCategories.map(c => c.id));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Name</span>
                                                {getSortIcon('name')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Color
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                            onClick={() => handleSort('created_at')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Created</span>
                                                {getSortIcon('created_at')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usage Stats
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activeCategories.map((category) => {
                                        const stats = usageStats[category.id];
                                        return (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(category.id)}
                                                        onChange={() => toggleCategorySelection(category.id)}
                                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                                            style={{ backgroundColor: category.color }}
                                                        ></div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {category.name}
                                                            </div>
                                                            {category.description && (
                                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                                    {category.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm mr-2"
                                                            style={{ backgroundColor: category.color }}
                                                        ></div>
                                                        <span className="text-sm text-gray-500 font-mono">
                                                            {category.color}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {category.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(category.created_at), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {stats ? (
                                                        <div className="text-sm">
                                                            <div className="font-medium text-gray-900">
                                                                {stats.expense_count} expense{stats.expense_count !== 1 ? 's' : ''}
                                                            </div>
                                                            <div className="text-gray-500">
                                                                ₹{stats.total_amount?.toFixed(2) || '0.00'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleToggleActive(category.id)}
                                                            className={`${category.is_active
                                                                    ? 'text-red-600 hover:text-red-900'
                                                                    : 'text-green-600 hover:text-green-900'
                                                                }`}
                                                            title={category.is_active ? 'Deactivate' : 'Activate'}
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </button>
                                                        <Link
                                                            to={`/expense-categories/${category.id}/edit`}
                                                            className="text-primary-600 hover:text-primary-900"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(category.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Inactive Categories Table */}
            <div className="card overflow-hidden mt-8">
                <h2 className="text-lg font-bold text-gray-900 p-6">Inactive Categories</h2>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : inactiveCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No inactive categories found</h3>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* Table Head */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.length === inactiveCategories.length && inactiveCategories.length > 0}
                                                onChange={() => {
                                                    if (selectedCategories.length === inactiveCategories.length) {
                                                        setSelectedCategories([]);
                                                    } else {
                                                        setSelectedCategories(inactiveCategories.map(c => c.id));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Name</span>
                                                {getSortIcon('name')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Color
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                            onClick={() => handleSort('created_at')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Created</span>
                                                {getSortIcon('created_at')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usage Stats
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {inactiveCategories.map((category) => {
                                        const stats = usageStats[category.id];
                                        return (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(category.id)}
                                                        onChange={() => toggleCategorySelection(category.id)}
                                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                                            style={{ backgroundColor: category.color }}
                                                        ></div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {category.name}
                                                            </div>
                                                            {category.description && (
                                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                                    {category.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm mr-2"
                                                            style={{ backgroundColor: category.color }}
                                                        ></div>
                                                        <span className="text-sm text-gray-500 font-mono">
                                                            {category.color}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {category.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(category.created_at), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {stats ? (
                                                        <div className="text-sm">
                                                            <div className="font-medium text-gray-900">
                                                                {stats.expense_count} expense{stats.expense_count !== 1 ? 's' : ''}
                                                            </div>
                                                            <div className="text-gray-500">
                                                                ₹{stats.total_amount?.toFixed(2) || '0.00'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleToggleActive(category.id)}
                                                            className={`${category.is_active
                                                                    ? 'text-red-600 hover:text-red-900'
                                                                    : 'text-green-600 hover:text-green-900'
                                                                }`}
                                                            title={category.is_active ? 'Deactivate' : 'Activate'}
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </button>
                                                        <Link
                                                            to={`/expense-categories/${category.id}/edit`}
                                                            className="text-primary-600 hover:text-primary-900"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(category.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
};

export default ExpenseCategoryList;
