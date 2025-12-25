import React from 'react';
import { UIComponent, UIScreen, UITheme } from '../types';
import { 
    RenderText, RenderInput, RenderButton, RenderImage, 
    RenderList, RenderCard, RenderSelect, RenderCheckbox, 
    RenderContainer, RenderDivider, RenderDatePicker, RenderTimePicker
} from './VisualComponents';

interface RendererProps {
  components: UIComponent[];
  screen: UIScreen;
  theme?: UITheme;
}

export const Renderer: React.FC<RendererProps> = ({ components, screen, theme }) => {
  const renderComponent = (component: UIComponent) => {
    const key = `${screen.id}-${component.id}`;
    
    switch (component.type) {
      case 'text':
        return <RenderText key={key} component={component} theme={theme} />;
      case 'input':
        return <RenderInput key={key} component={component} theme={theme} />;
      case 'button':
        return <RenderButton key={key} component={component} theme={theme} />;
      case 'image':
        return <RenderImage key={key} component={component} />;
      case 'list':
        return <RenderList key={key} component={component} theme={theme} />;
      case 'card':
        return <RenderCard key={key} component={component} screen={screen} theme={theme} />;
      case 'select':
        return <RenderSelect key={key} component={component} theme={theme} />;
      case 'checkbox':
        return <RenderCheckbox key={key} component={component} theme={theme} />;
      case 'container':
        return <RenderContainer key={key} component={component} screen={screen} theme={theme} />;
      case 'divider':
        return <RenderDivider key={key} component={component} />;
      case 'datepicker':
        return <RenderDatePicker key={key} component={component} theme={theme} />;
      case 'timepicker':
        return <RenderTimePicker key={key} component={component} theme={theme} />;
      default:
        return <div key={key} className="p-2 bg-red-100 text-red-600">Unknown component type</div>;
    }
  };

  const layoutClass = screen.layout === 'horizontal' ? 'flex space-x-4' : 'flex flex-col';
  
  return (
    <div className={`w-full h-full ${layoutClass}`} style={{ padding: screen.padding }}>
      {components.map(renderComponent)}
    </div>
  );
};