import React from 'react';
// FIX: Add UIScreen to imports to allow for proper typing.
import { UIApp, UIComponent, UIScreen } from '../types';

interface FlowBuilderProps {
  uiApp: UIApp | null;
  setCurrentScreenId: (id: string) => void;
}

interface Node {
    id: string;
    title: string;
    type: 'initial' | 'auth' | 'regular';
    x: number;
    y: number;
}
interface Edge {
    source: string;
    target: string;
    label: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ uiApp, setCurrentScreenId }) => {

  const { nodes, edges, size } = React.useMemo(() => {
    if (!uiApp) return { nodes: [], edges: [], size: { width: 0, height: 0 } };

    const screens = uiApp.screens;
    const initialScreen = uiApp.initialScreen;
    const tempNodes = new Map();
    const tempEdges: {source: string, target: string, label: string}[] = [];

    // 1. Gather all nodes (screens)
    // FIX: Add type annotation to `screen` to resolve 'property does not exist on type unknown' errors.
    Object.values(screens).forEach((screen: UIScreen) => {
      tempNodes.set(screen.id, {
        id: screen.id,
        title: screen.title || screen.id,
        type: screen.id === initialScreen ? 'initial' : 'regular',
      });
    });

    // 2. Gather all edges (navigate actions) from all components recursively
    const findActions = (screenId: string, components: UIComponent[]) => {
      if (!components) return;
      components.forEach(comp => {
        // FIX: Use 'in' operator as a type guard to safely access the 'action' property, which doesn't exist on all UIComponent types.
        if ('action' in comp && comp.action && comp.action.type === 'navigate') {
          tempEdges.push({
            source: screenId,
            target: comp.action.target,
            label: comp.id
          });
          // Add target screen if it's a special one (e.g., auth) and not in the list
          if (!tempNodes.has(comp.action.target)) {
            tempNodes.set(comp.action.target, {
              id: comp.action.target,
              title: comp.action.target,
              type: 'auth',
            });
          }
        }
        // Recursively check inside containers
        if ('components' in comp && comp.components) {
          findActions(screenId, comp.components);
        }
      });
    };
    
    // FIX: Add type annotation to `screen` to resolve 'property does not exist on type unknown' errors.
    Object.values(screens).forEach((screen: UIScreen) => {
      findActions(screen.id, screen.components);
    });

    const finalNodes = Array.from(tempNodes.values());

    // 3. Simple layout logic
    const nodeWidth = 180;
    const nodeHeight = 80;
    const hGap = 100;
    const vGap = 40;

    const levels = new Map<string, number>();
    const queue: string[] = [uiApp.initialScreen];
    const visited = new Set<string>([uiApp.initialScreen]);
    levels.set(uiApp.initialScreen, 0);
    let maxLevel = 0;

    // BFS to determine levels
    let head = 0;
    while(head < queue.length) {
        const u = queue[head++];
        const uLevel = levels.get(u)!;

        tempEdges.filter(e => e.source === u).forEach(edge => {
            if (!visited.has(edge.target)) {
                visited.add(edge.target);
                levels.set(edge.target, uLevel + 1);
                maxLevel = Math.max(maxLevel, uLevel + 1);
                queue.push(edge.target);
            }
        });
    }
    
    // Place unvisited/orphan nodes
    let orphanCount = 0;
    finalNodes.forEach(n => {
        if (!levels.has(n.id)) {
            levels.set(n.id, maxLevel + 1 + Math.floor(orphanCount / 5)); // Put orphans in new columns
            orphanCount++;
        }
    });

    const nodesByLevel: Node[][] = Array.from({ length: maxLevel + 2 + Math.ceil(orphanCount/5) }, () => []);
    finalNodes.forEach(n => {
        const level = levels.get(n.id) || 0;
        if (nodesByLevel[level]) {
           nodesByLevel[level].push(n as Node);
        }
    });
    
    let maxWidth = 0;
    let maxHeight = 0;

    nodesByLevel.forEach((levelNodes, level) => {
        levelNodes.forEach((node, index) => {
            node.x = level * (nodeWidth + hGap);
            node.y = index * (nodeHeight + vGap);
            maxWidth = Math.max(maxWidth, node.x + nodeWidth);
            maxHeight = Math.max(maxHeight, node.y + nodeHeight);
        });
    });
    
    const nodeMap = new Map(finalNodes.map(n => [n.id, n]));
    const finalEdges: Edge[] = tempEdges.map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) return null;

        return {
            ...edge,
            x1: sourceNode.x + nodeWidth,
            y1: sourceNode.y + nodeHeight / 2,
            x2: targetNode.x,
            y2: targetNode.y + nodeHeight / 2
        };
    }).filter((e): e is Edge => e !== null);

    return { nodes: finalNodes as Node[], edges: finalEdges, size: { width: maxWidth + 50, height: maxHeight + 50 } };
  }, [uiApp]);

  if (!uiApp) {
    return <div className="p-4 text-center text-gray-500">Nenhum aplicativo carregado para visualizar o fluxo.</div>;
  }

  // FIX: hGap is calculated inside useMemo but used here, causing a scope error.
  // We can recalculate it or, more simply, use a hardcoded value that matches the one in useMemo.
  const hGap = 100;

  return (
    <div className="relative w-full h-full bg-gray-50 p-4 overflow-auto rounded-b-lg">
      <div style={{ width: size.width, height: size.height, position: 'relative' }}>
        <svg width={size.width} height={size.height} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
            </marker>
          </defs>
          {edges.map((edge, i) => (
            <path
              key={`${edge.source}-${edge.target}-${i}`}
              d={`M ${edge.x1} ${edge.y1} C ${edge.x1 + hGap / 2} ${edge.y1}, ${edge.x2 - hGap / 2} ${edge.y2}, ${edge.x2} ${edge.y2}`}
              stroke="#9ca3af"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          ))}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => {
                if (node.type !== 'auth' && uiApp.screens[node.id]) {
                    setCurrentScreenId(node.id)
                } else if (node.type === 'auth') {
                    setCurrentScreenId(node.id)
                }
            }}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: 180,
              height: 80,
            }}
            className={`
              flex flex-col justify-center items-center p-2 text-center bg-white rounded-lg shadow-md border-2
              hover:shadow-xl hover:border-blue-500 transition-all
              ${node.type !== 'auth' ? 'cursor-pointer' : 'cursor-default'}
              ${node.type === 'initial' ? 'border-green-500 bg-green-50' : ''}
              ${node.type === 'auth' ? 'border-yellow-500 bg-yellow-50' : ''}
              ${node.type === 'regular' ? 'border-gray-300' : ''}
            `}
          >
            <div className="font-bold text-sm text-gray-800 truncate w-full">{node.title}</div>
            <div className="text-xs text-gray-500 truncate w-full">({node.id})</div>
          </div>
        ))}
      </div>
    </div>
  );
};
