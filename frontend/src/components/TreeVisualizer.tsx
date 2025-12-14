import React, { useState } from 'react';
import Tree from 'react-d3-tree';
import { User } from 'lucide-react';

interface TreeVisualizerProps {
  data: any;
  isLoading: boolean;
  error: any;
  onNodeClick?: (nodeId: string) => void;
}

const TreeVisualizer = ({ data: treeData, isLoading, error, onNodeClick }: TreeVisualizerProps) => {
  // Config removed fetch logic

  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const containerStyles = {
    width: '100%',
    height: '100%',
    background: 'transparent'
  };

  const renderForeignObjectNode = ({ nodeDatum, toggleNode }: { nodeDatum: any, toggleNode: () => void }) => {
    // Determine rank color (Top Border Accent)
    let rankColor = 'border-slate-500';
    const rank = nodeDatum.attributes?.rank;

    if (rank === 'Gold') rankColor = 'border-amber-400';
    if (rank === 'Silver') rankColor = 'border-slate-300';
    if (rank === 'Bronze') rankColor = 'border-orange-600';
    if (rank === 'Diamond') rankColor = 'border-cyan-400';

    const isOnline = nodeDatum.attributes?.active;

    return (
      <foreignObject width="260" height="200" x="-130" y="-100">
        <div
          className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-t-4 ${rankColor} border-r border-b border-l border-gray-100 dark:border-slate-600 h-full group`}
        >
          {/* Main Click Area for Toggling */}
          <div className="absolute inset-0 z-0 cursor-pointer" onClick={toggleNode} title="Click to Expand/Collapse"></div>

          <div className="p-4 relative z-10 pointer-events-none"> {/* Content container passes clicks through, but children re-enable pointer-events */}
            {/* Header: Avatar & Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${rank === 'Diamond' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                  {nodeDatum.name.substring(0, 1).toUpperCase()}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                )}
              </div>

              <div className="overflow-hidden">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate w-32 leading-tight">
                  {nodeDatum.name}
                </h3>
                <p className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-slate-400 uppercase mt-0.5">
                  {rank || 'Member'}
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-3 space-y-2">
              {/* Personal PV */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-1.5 text-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                <p className="text-[9px] uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-0.5">Personal PV</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {nodeDatum.attributes?.personalPV || 0}
                </p>
              </div>

              {/* Legs PV */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 text-center group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10 transition-colors">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 mb-0.5">Left PV</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                    {nodeDatum.attributes?.leftPV || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 text-center group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 transition-colors">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 mb-0.5">Right PV</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {nodeDatum.attributes?.rightPV || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Earned Badge (Floating) */}
            <div className="absolute top-2 right-2 pointer-events-auto">
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 dark:bg-green-500/20 text-[10px] font-bold text-green-700 dark:text-green-400">
                ${(nodeDatum.attributes?.totalEarned || 0).toLocaleString()}
              </span>
            </div>

            {/* View Details Button (Floating Bottom Right) */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNodeClick && nodeDatum.attributes?.id) {
                    onNodeClick(nodeDatum.attributes.id);
                  }
                }}
                className="p-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-lg transform hover:scale-110 transition-all text-[10px] font-bold flex items-center gap-1"
              >
                <User size={12} /> View
              </button>
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
          const { width } = el.getBoundingClientRect();
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
        nodeSize={{ x: 300, y: 250 }} // Increased spacing to prevent overlap
        pathClassFunc={() => 'stroke-gray-400 dark:stroke-slate-400 !stroke-2'}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        zoom={0.6}
        scaleExtent={{ min: 0.1, max: 2 }}
        enableLegacyTransitions={true}
        transitionDuration={500}
      />
    </div>
  );
};

export default TreeVisualizer;