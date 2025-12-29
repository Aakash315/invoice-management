import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  StarIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { templateService } from '../../services/templateService';

const TemplateGallery = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.deleteTemplate(templateId);
        toast.success('Template deleted successfully');
        setTemplates(templates.filter(t => t.id !== templateId));
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    try {
      await templateService.duplicateTemplate(templateId);
      toast.success('Template duplicated successfully');
      fetchTemplates(); // Refresh the list
    } catch (error) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await templateService.setDefaultTemplate(templateId);
      toast.success('Template set as default');
      fetchTemplates(); // Refresh the list
    } catch (error) {
      toast.error('Failed to set default template');
    }
  };

  const getTemplatePreview = (template) => {
    return {
      headerColor: template.color_primary || '#2563eb',
      backgroundColor: template.color_background || '#ffffff',
      textColor: template.color_text || '#111827',
      templateType: template.template_type || 'modern'
    };
  };

  const renderTemplateCard = (template) => {
    const preview = getTemplatePreview(template);
    const isDefault = template.is_default;

    return (
      <div
        key={template.id}
        className={`relative group cursor-pointer transition-all duration-200 ${
          selectedTemplate?.id === template.id
            ? 'ring-2 ring-blue-500 shadow-lg'
            : 'hover:shadow-md'
        }`}
        onClick={() => setSelectedTemplate(template)}
      >
        <Card className="p-0 overflow-hidden">
          {/* Template Preview */}
          <div 
            className="h-32 relative"
            style={{ backgroundColor: preview.backgroundColor }}
          >
            {/* Header */}
            <div 
              className="h-8 flex items-center justify-between px-4 text-white"
              style={{ backgroundColor: preview.headerColor }}
            >
              <div className="font-bold text-sm">
                {template.company_name || 'Company Name'}
              </div>
              {isDefault && (
                <StarIcon className="w-4 h-4 text-yellow-300 fill-current" />
              )}
            </div>
            
            {/* Content Preview */}
            <div className="p-4 space-y-2">
              <div className="text-xs text-gray-600">Invoice #INV-001</div>
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              <div className="flex justify-between">
                <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                <div className="h-2 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {template.name}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {template.template_type}
              </span>
            </div>
            
            {template.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {template.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(template.id);
                  }}
                  className={`p-1 rounded ${
                    isDefault
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-400 hover:text-yellow-500'
                  }`}
                  title={isDefault ? 'Default template' : 'Set as default'}
                >
                  <StarIcon className={`w-4 h-4 ${isDefault ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateTemplate(template.id);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500"
                  title="Duplicate template"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/templates/edit/${template.id}`);
                  }}
                  className="p-1 text-gray-400 hover:text-green-500"
                  title="Edit template"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Delete template"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoice Templates</h2>
            <p className="text-gray-600">
              Choose and customize professional invoice templates
            </p>
          </div>
          <Button onClick={() => navigate('/templates/new')}>
            Create Template
          </Button>
        </div>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Templates</h2>
          <p className="text-gray-600">
            Choose and customize professional invoice templates
          </p>
        </div>
        
        <Button onClick={() => navigate('/templates/new')}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(renderTemplateCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <PaintBrushIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No templates yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first invoice template to get started
            </p>
            <Button onClick={() => navigate('/templates/new')}>
              Create Your First Template
            </Button>
          </div>
        </div>
      )}

      {/* Selected Template Info */}
      {selectedTemplate && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <p className="font-medium text-blue-900">
                Selected: {selectedTemplate.name}
              </p>
              <p className="text-sm text-blue-700">
                {selectedTemplate.template_type} template
                {selectedTemplate.is_default && ' • Default'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TemplateGallery;
