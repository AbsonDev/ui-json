import React, { useContext } from 'react';
import {
  UIText, UIInput, UIButton, UIImage, UIList, UICard, UISelect, UICheckbox,
  UIContainer, UIDivider, UITheme, UIScreen, UIComponent, ButtonVariant, ButtonSize,
  Alignment, Layout, ImageResizeMode, UIDatePicker, UITimePicker
} from '../types';
import { useAction } from '../hooks/useAction';
import { useDatabase } from '../hooks/useDatabase';
import { useSession } from '../hooks/useSession';
import { Renderer } from './Renderer';
import { DesignTokensContext } from '../App';

// Import shared utilities
import { resolveToken } from '../lib/utils/design-tokens';
import { resolveTemplate } from '../lib/utils/template-engine';
import {
  getMarginStyles,
  getButtonClasses,
  getLayoutClasses,
  mapResizeModeToObjectFit,
} from '../lib/utils/style-helpers';

// --- Component Wrapper for Conditional Rendering ---
const ConditionalRenderer: React.FC<{ component: UIComponent, children: React.ReactNode }> = ({ component, children }) => {
    const { session } = useSession();
    if (component.showIf === 'session.isLoggedIn' && !session) return null;
    if (component.showIf === 'session.isLoggedOut' && session) return null;
    return <>{children}</>;
};


// --- Component Renderers ---

export const RenderText: React.FC<{ component: UIText, theme?: UITheme }> = ({ component, theme }) => {
  const { session } = useSession();
  const tokens = useContext(DesignTokensContext);
  const content = resolveTemplate(component.content, { session });
  
  return (
    <ConditionalRenderer component={component}>
      <p
        style={{
          ...getMarginStyles(component, tokens),
          fontSize: resolveToken(component.fontSize, tokens) || 16,
          fontWeight: component.fontWeight || 'normal',
          color: resolveToken(component.color, tokens) || resolveToken(theme?.textColor, tokens),
          textAlign: component.textAlign || 'left',
        }}
      >
        {content}
      </p>
    </ConditionalRenderer>
  );
};

export const RenderInput: React.FC<{ component: UIInput, theme?: UITheme }> = ({ component }) => {
  const { formState, setFormState } = useAction();
  const tokens = useContext(DesignTokensContext);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({...prev, [component.id]: e.target.value}));
  };
  return (
    <ConditionalRenderer component={component}>
      <div style={getMarginStyles(component, tokens)} className="w-full">
        {component.label && <label className="block text-sm font-medium text-gray-700 mb-1">{component.label}</label>}
        <input
          type={component.inputType || 'text'}
          placeholder={component.placeholder}
          required={component.required}
          maxLength={component.maxLength}
          disabled={component.disabled}
          value={formState[component.id] || component.defaultValue || ''}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
        />
      </div>
    </ConditionalRenderer>
  );
};

export const RenderButton: React.FC<{ component: UIButton, theme?: UITheme }> = ({ component, theme }) => {
  const { handleAction } = useAction();
  const tokens = useContext(DesignTokensContext);
  const themePrimaryColor = resolveToken(theme?.primaryColor, tokens);

  const style: React.CSSProperties = getMarginStyles(component, tokens);
  if (component.variant === 'primary' && themePrimaryColor) {
    style.backgroundColor = themePrimaryColor;
  }

  return (
    <ConditionalRenderer component={component}>
        <button
        style={style}
        onClick={() => handleAction(component.action)}
        disabled={component.disabled}
        className={getButtonClasses(component.variant, component.size, component.fullWidth)}
        >
        {component.text}
        </button>
    </ConditionalRenderer>
  );
};

export const RenderImage: React.FC<{ component: UIImage }> = ({ component }) => {
    const tokens = useContext(DesignTokensContext);
    return (
        <ConditionalRenderer component={component}>
            <img
                src={component.source}
                alt={component.id}
                style={{
                    ...getMarginStyles(component, tokens),
                    width: resolveToken(component.width, tokens) ? `${resolveToken(component.width, tokens)}px` : 'auto',
                    height: resolveToken(component.height, tokens) ? `${resolveToken(component.height, tokens)}px` : 'auto',
                    objectFit: mapResizeModeToObjectFit(component.resizeMode),
                    borderRadius: resolveToken(component.borderRadius, tokens),
                }}
                className="mx-auto" // Default to centering images
            />
        </ConditionalRenderer>
    );
}

export const RenderList: React.FC<{ component: UIList, theme?: UITheme }> = ({ component }) => {
    const { data } = useDatabase();
    const { session } = useSession();
    const { handleAction } = useAction();
    const tokens = useContext(DesignTokensContext);

    const records = component.dataSource ? data?.[component.dataSource.table] || [] : component.items;

    if (records.length === 0) {
        return component.emptyMessage ? <p className="text-gray-500 text-center p-4">{component.emptyMessage}</p> : null;
    }

    const itemTemplate = component.dataSource ? component.items[0] : undefined;

    return (
        <ConditionalRenderer component={component}>
            <ul className={`${component.separator ? 'divide-y divide-gray-200' : ''}`} style={getMarginStyles(component, tokens)}>
                {records.map((record, index) => {
                    const fullContext = { ...record, session };
                    const item = itemTemplate ? resolveTemplate(itemTemplate, fullContext) : record;
                    return (
                        <li key={item.id || index} className="p-4 hover:bg-gray-50" onClick={() => component.itemAction && handleAction(component.itemAction)}>
                            <div className="flex items-center space-x-4">
                                {item.image && <img className="w-12 h-12 rounded-full" src={item.image} alt={item.title} />}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                    {item.subtitle && <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>}
                                </div>
                                {item.badge && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{item.badge}</span>}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </ConditionalRenderer>
    );
};


export const RenderCard: React.FC<{ component: UICard, screen: UIScreen, theme?: UITheme }> = ({ component, screen, theme }) => {
    const tokens = useContext(DesignTokensContext);
    return (
        <ConditionalRenderer component={component}>
            <div
                className="shadow-md rounded-lg"
                style={{
                    ...getMarginStyles(component, tokens),
                    padding: resolveToken(component.padding, tokens) ?? 16,
                    backgroundColor: resolveToken(component.backgroundColor, tokens) || 'white',
                    borderRadius: resolveToken(component.borderRadius, tokens),
                }}
            >
                <Renderer components={component.components} screen={screen} theme={theme} />
            </div>
        </ConditionalRenderer>
    );
}

export const RenderSelect: React.FC<{ component: UISelect, theme?: UITheme }> = ({ component }) => {
  const tokens = useContext(DesignTokensContext);
  return (
  <ConditionalRenderer component={component}>
    <div style={getMarginStyles(component, tokens)} className="w-full">
        {component.label && <label className="block text-sm font-medium text-gray-700 mb-1">{component.label}</label>}
        <select className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900">
        {component.placeholder && <option value="">{component.placeholder}</option>}
        {component.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
  </ConditionalRenderer>
    );
};

export const RenderCheckbox: React.FC<{ component: UICheckbox, theme?: UITheme }> = ({ component }) => {
    const tokens = useContext(DesignTokensContext);
    return (
    <ConditionalRenderer component={component}>
        <div className="flex items-center" style={getMarginStyles(component, tokens)}>
            <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked={component.defaultValue} />
            <label className="ml-2 block text-sm text-gray-900">{component.label}</label>
        </div>
    </ConditionalRenderer>
    );
};

export const RenderContainer: React.FC<{ component: UIContainer, screen: UIScreen, theme?: UITheme }> = ({ component, screen, theme }) => {
    const tokens = useContext(DesignTokensContext);
    return (
    <ConditionalRenderer component={component}>
        <div
            className={getLayoutClasses(component.layout, component.alignment)}
            style={{
                ...getMarginStyles(component, tokens),
                padding: resolveToken(component.padding, tokens),
                backgroundColor: resolveToken(component.backgroundColor, tokens),
            }}
        >
            <Renderer components={component.components} screen={screen} theme={theme} />
        </div>
    </ConditionalRenderer>
    );
};

export const RenderDivider: React.FC<{ component: UIDivider }> = ({ component }) => {
    const tokens = useContext(DesignTokensContext);
    return (
    <ConditionalRenderer component={component}>
        <hr
            style={{
                ...getMarginStyles(component, tokens),
                borderColor: resolveToken(component.color, tokens) || '#E5E7EB',
                borderTopWidth: resolveToken(component.thickness, tokens) || 1,
            }}
        />
    </ConditionalRenderer>
    );
};

export const RenderDatePicker: React.FC<{ component: UIDatePicker, theme?: UITheme }> = ({ component }) => {
  const { formState, setFormState } = useAction();
  const tokens = useContext(DesignTokensContext);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({...prev, [component.id]: e.target.value}));
  };
  return (
    <ConditionalRenderer component={component}>
      <div style={getMarginStyles(component, tokens)} className="w-full">
        {component.label && <label className="block text-sm font-medium text-gray-700 mb-1">{component.label}</label>}
        <input
          type="date"
          required={component.required}
          disabled={component.disabled}
          value={formState[component.id] || component.defaultValue || ''}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
        />
      </div>
    </ConditionalRenderer>
  );
};

export const RenderTimePicker: React.FC<{ component: UITimePicker, theme?: UITheme }> = ({ component }) => {
  const { formState, setFormState } = useAction();
  const tokens = useContext(DesignTokensContext);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({...prev, [component.id]: e.target.value}));
  };
  return (
    <ConditionalRenderer component={component}>
      <div style={getMarginStyles(component, tokens)} className="w-full">
        {component.label && <label className="block text-sm font-medium text-gray-700 mb-1">{component.label}</label>}
        <input
          type="time"
          required={component.required}
          disabled={component.disabled}
          value={formState[component.id] || component.defaultValue || ''}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
        />
      </div>
    </ConditionalRenderer>
  );
};