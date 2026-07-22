// panels/TemplateGallery.jsx — Template picker modal
import { useEffect, useCallback } from 'react';
import { PIPELINE_TEMPLATES, TAG_COLORS } from '../pipelineTemplates';
import { useStore } from '../store';

function TagPill({ tag }) {
  const colors = TAG_COLORS[tag] || { bg: 'rgba(255,255,255,0.1)', text: '#888' };
  return (
    <span
      className="template-tag"
      style={{ background: colors.bg, color: colors.text }}
    >
      {tag}
    </span>
  );
}

function PipelineDiagram({ steps }) {
  return (
    <div className="pipeline-diagram">
      {steps.map((step, i) => (
        <span key={i} className="pipeline-diagram-inner">
          <span className="pipeline-node-pill">{step}</span>
          {i < steps.length - 1 && (
            <span className="pipeline-arrow">→</span>
          )}
        </span>
      ))}
    </div>
  );
}

function TemplateCard({ template, onUse }) {
  return (
    <div className="template-card">
      {/* Card header */}
      <div className="template-card-header">
        <span className="template-icon">{template.icon}</span>
        <div className="template-title-group">
          <h3 className="template-title">{template.title}</h3>
          <div className="template-tags">
            {template.tags.map(tag => <TagPill key={tag} tag={tag} />)}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="template-desc">{template.description}</p>

      {/* Pipeline diagram */}
      <PipelineDiagram steps={template.pipeline} />

      {/* Use button */}
      <button
        className="template-use-btn"
        onClick={() => onUse(template)}
      >
        <span>Use Template</span>
        <span className="template-use-arrow">→</span>
      </button>
    </div>
  );
}

export function TemplateGallery({ onClose }) {
  const loadTemplate = useStore(s => s.loadTemplate);

  // Close on Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleUse = useCallback((template) => {
    loadTemplate(template);
    onClose();
  }, [loadTemplate, onClose]);

  return (
    <div className="template-overlay" onClick={onClose}>
      <div
        className="template-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Pipeline Templates"
      >
        {/* Modal header */}
        <div className="template-modal-header">
          <div>
            <h2 className="template-modal-title">
              <span className="template-modal-title-icon">📋</span>
              Pipeline Templates
            </h2>
            <p className="template-modal-subtitle">
              Choose a pre-built pipeline to get started instantly
            </p>
          </div>
          <button
            className="template-close-btn"
            onClick={onClose}
            aria-label="Close templates"
          >
            ✕
          </button>
        </div>

        {/* Warning */}
        <div className="template-warning">
          <span className="template-warning-icon">⚠️</span>
          <span>Loading a template will replace your current canvas.</span>
        </div>

        {/* Grid */}
        <div className="template-grid">
          {PIPELINE_TEMPLATES.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUse}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
