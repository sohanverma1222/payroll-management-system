import React, { useState, useEffect } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime-local';
  placeholder?: string;
  value?: any;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  validation?: ValidationRule;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  rows?: number; // for textarea
  min?: number; // for number inputs
  max?: number; // for number inputs
  step?: number; // for number inputs
}

interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onFieldChange?: (name: string, value: any) => void;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  disabled?: boolean;
  className?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  layout?: 'vertical' | 'horizontal' | 'inline';
  columns?: number;
}

const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  onFieldChange,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = true,
  disabled = false,
  className = '',
  validateOnChange = true,
  validateOnBlur = true,
  layout = 'vertical',
  columns = 1
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      initialData[field.name] = field.defaultValue || field.value || '';
    });
    setFormData(initialData);
  }, [fields]);

  const validateField = (field: FormField, value: any): string | null => {
    const { validation, required } = field;
    
    // Required validation
    if (required && (!value || value === '')) {
      return `${field.label} is required`;
    }

    if (!validation) return null;

    // Min length validation
    if (validation.minLength && value.length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }

    // Max length validation
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${field.label} must be no more than ${validation.maxLength} characters`;
    }

    // Pattern validation
    if (validation.pattern && !validation.pattern.test(value)) {
      return `${field.label} format is invalid`;
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(value);
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (name: string, value: any) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    if (onFieldChange) {
      onFieldChange(name, value);
    }

    // Validate on change if enabled
    if (validateOnChange) {
      const field = fields.find(f => f.name === name);
      if (field) {
        const error = validateField(field, value);
        setErrors(prev => ({
          ...prev,
          [name]: error || ''
        }));
      }
    }
  };

  const handleFieldBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const field = fields.find(f => f.name === name);
      if (field) {
        const error = validateField(field, formData[name]);
        setErrors(prev => ({
          ...prev,
          [name]: error || ''
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleReset = () => {
    const resetData: Record<string, any> = {};
    fields.forEach(field => {
      resetData[field.name] = field.defaultValue || '';
    });
    setFormData(resetData);
    setErrors({});
    setTouched({});
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const showError = error && touched[field.name];

    const fieldProps = {
      id: field.name,
      name: field.name,
      value,
      placeholder: field.placeholder,
      disabled: disabled || field.disabled,
      required: field.required,
      className: `form-input ${field.className || ''} ${showError ? 'form-input-error' : ''}`,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = field.type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : e.target.value;
        handleFieldChange(field.name, newValue);
      },
      onBlur: () => handleFieldBlur(field.name)
    };

    const renderInput = () => {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              {...fieldProps}
              rows={field.rows || 3}
            />
          );

        case 'select':
          return (
            <select {...fieldProps}>
              <option value="">{field.placeholder || 'Select...'}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'checkbox':
          return (
            <input
              {...fieldProps}
              type="checkbox"
              checked={!!value}
              className={`form-checkbox ${field.className || ''}`}
            />
          );

        case 'radio':
          return (
            <div className="form-radio-group">
              {field.options?.map(option => (
                <label key={option.value} className="form-radio-label">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    disabled={disabled || field.disabled}
                    className="form-radio"
                  />
                  <span className="form-radio-text">{option.label}</span>
                </label>
              ))}
            </div>
          );

        case 'number':
          return (
            <input
              {...fieldProps}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
            />
          );

        default:
          return <input {...fieldProps} type={field.type} />;
      }
    };

    return (
      <div key={field.name} className={`form-field ${field.type === 'checkbox' ? 'form-field-checkbox' : ''}`}>
        <label htmlFor={field.name} className="form-label">
          {field.label}
          {field.required && <span className="form-required">*</span>}
        </label>
        {renderInput()}
        {showError && <div className="form-error">{error}</div>}
      </div>
    );
  };

  const getLayoutClass = () => {
    switch (layout) {
      case 'horizontal': return 'form-horizontal';
      case 'inline': return 'form-inline';
      default: return 'form-vertical';
    }
  };

  const getColumnsClass = () => {
    return columns > 1 ? `form-columns-${columns}` : '';
  };

  return (
    <form 
      className={`form ${getLayoutClass()} ${getColumnsClass()} ${className}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="form-fields">
        {fields.map(renderField)}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={disabled}
          className="form-submit"
        >
          {submitLabel}
        </button>

        {showReset && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="form-reset"
          >
            {resetLabel}
          </button>
        )}
      </div>
    </form>
  );
};

export default Form;