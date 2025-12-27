import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApi } from '../../../hooks/useApi';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ReminderSettings = () => {
    const { user } = useAuth();
    const api = useApi();
    const navigate = useNavigate();

    const [settings, setSettings] = useState({
        remind_before_due: [7, 3, 1],
        remind_on_due: true,
        remind_after_due: [1, 7, 15, 30],
        template_friendly: '',
        template_due: '',
        template_first_overdue: '',
        template_second_overdue: '',
        template_final_notice: '',
        enabled: false,
    });
    const [loading, setLoading] = useState(true);
    const [isNew, setIsNew] = useState(true); // To check if settings exist for the user

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/reminders/settings');
                setSettings(response.data);
                setIsNew(false);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    // Settings not found, user can create new ones
                    setIsNew(true);
                } else {
                    toast.error('Error fetching reminder settings.');
                    console.error('Error fetching reminder settings:', error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [api]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setSettings(prev => ({ ...prev, [name]: checked }));
        } else if (name.startsWith('remind_')) {
            // For array inputs like remind_before_due
            setSettings(prev => ({ ...prev, [name]: value.split(',').map(Number).filter(n => !isNaN(n)) }));
        } else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isNew) {
                await api.post('/api/reminders/settings', settings);
                toast.success('Reminder settings created successfully!');
                setIsNew(false);
            } else {
                await api.put('/api/reminders/settings', settings);
                toast.success('Reminder settings updated successfully!');
            }
        } catch (error) {
            toast.error('Error saving reminder settings.');
            console.error('Error saving reminder settings:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-4">Loading reminder settings...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reminder Settings</h1>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Enable Reminders:
                        </label>
                        <Input
                            type="checkbox"
                            name="enabled"
                            checked={settings.enabled}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Remind Before Due (days, comma-separated):
                            </label>
                            <Input
                                type="text"
                                name="remind_before_due"
                                value={settings.remind_before_due.join(',')}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Remind On Due Date:
                            </label>
                            <Input
                                type="checkbox"
                                name="remind_on_due"
                                checked={settings.remind_on_due}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Remind After Due (days, comma-separated):
                            </label>
                            <Input
                                type="text"
                                name="remind_after_due"
                                value={settings.remind_after_due.join(',')}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold mt-6 mb-2">Email Templates</h2>
                    <p className="text-sm text-gray-600">
                        Use variables like `{{invoice_number}}`, `{{due_date}}`, `{{client_name}}`, `{{total_amount}}`, `{{currency}}`, `{{overdue_days}}`.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Friendly Reminder Template:
                        </label>
                        <textarea
                            name="template_friendly"
                            value={settings.template_friendly || ''}
                            onChange={handleChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Due Date Reminder Template:
                        </label>
                        <textarea
                            name="template_due"
                            value={settings.template_due || ''}
                            onChange={handleChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            First Overdue Reminder Template (e.g., 1-7 days overdue):
                        </label>
                        <textarea
                            name="template_first_overdue"
                            value={settings.template_first_overdue || ''}
                            onChange={handleChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Second Overdue Reminder Template (e.g., 7-15 days overdue):
                        </label>
                        <textarea
                            name="template_second_overdue"
                            value={settings.template_second_overdue || ''}
                            onChange={handleChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Final Notice Template (e.g., 15+ days overdue):
                        </label>
                        <textarea
                            name="template_final_notice"
                            value={settings.template_final_notice || ''}
                            onChange={handleChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>

                    <Button type="submit" primary loading={loading}>
                        {isNew ? 'Create Settings' : 'Update Settings'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ReminderSettings;