import React, { useState } from 'react';
import Tree from 'react-d3-tree';
import { User } from 'lucide-react';

interface TreeVisualizerProps {
  data: any;
  isLoading: boolean;
  error: any;
}

const TreeVisualizer = ({ data: treeData, isLoading, error }: TreeVisualizerProps) => {
  // Config removed fetch logic

  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const containerStyles = {
    width: '100%',
    height: '100%',
    background: '#0f172a' // slate-900
  };

  const renderForeignObjectNode = ({ nodeDatum, toggleNode }: { nodeDatum: any, toggleNode: () => void }) => {
    // Determine rank color
    let rankColor = 'border-slate-500';
    const rank = nodeDatum.attributes?.rank;

    if (rank === 'Gold') rankColor = 'border-yellow-500';
    if (rank === 'Silver') rankColor = 'border-gray-300';
    if (rank === 'Bronze') rankColor = 'border-orange-700';
    if (rank === 'Diamond') rankColor = 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]';

    return (
      <foreignObject width="240" height="140" x="-120" y="-70">
        <div
          className={`bg-slate-800 rounded-lg p-3 border-l-4 ${rankColor} shadow-xl cursor-pointer hover:bg-slate-750 transition-all hover:scale-105 flex flex-col justify-between h-full border-t border-r border-b border-slate-700`}
          onClick={toggleNode}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-2 border-b border-slate-700 mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-slate-700 p-1.5 rounded-full">
                <User size={16} className="text-teal-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm truncate w-28" title={nodeDatum.name}>
                  {nodeDatum.name}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{rank || 'Member'}</p>
              </div>
            </div>
            {nodeDatum.attributes?.active && (
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" title="Active"></div>
            )}
          </div>

          {/* Payout & PV Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded text-xs">
              <span className="text-slate-400">Total Earned:</span>
              <span className="text-green-400 font-mono font-bold">
                ${(nodeDatum.attributes?.totalEarned || 0).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-700/30 p-1 rounded text-center">
                <div className="text-slate-500">Left PV</div>
                <div className="text-white font-mono">{nodeDatum.attributes?.leftPV || 0}</div>
              </div>
              <div className="bg-slate-700/30 p-1 rounded text-center">
                <div className="text-slate-500">Right PV</div>
                <div className="text-white font-mono">{nodeDatum.attributes?.rightPV || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
    );
  };

  if (isLoading) return <div className="flex items-center justify-center h-full text-teal-400 animate-pulse">Loading Network Topology...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500">Error loading tree structure.</div>;
  if (!treeData) return <div className="flex items-center justify-center h-full text-slate-500">No tree data found.</div>;

  return (
    <div
      style={containerStyles}
      ref={el => {
        if (el && !translate.x) {
          const { width, height } = el.getBoundingClientRect();
          setTranslate({ x: width / 2, y: 100 }); // Center initial view
        }
      }}
      className="w-full h-full"
    >
      <Tree
        data={treeData}
        translate={translate}
        pathFunc="step"
        orientation="vertical"
        renderCustomNodeElement={renderForeignObjectNode}
        nodeSize={{ x: 280, y: 200 }} // Increased spacing for larger cards
        pathClassFunc={() => 'stroke-slate-600 !stroke-2'}
        separation={{ siblings: 1.2, nonSiblings: 1.5 }}
        enableLegacyTransitions={true}
        transitionDuration={500}
      />
    </div>
  );
};

export default TreeVisualizer;