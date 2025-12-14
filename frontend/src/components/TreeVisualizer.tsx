import React, { useState } from 'react';
import Tree from 'react-d3-tree';
import { User, Crown, Star, Shield, Sparkles, Award } from 'lucide-react';

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
    background: 'transparent',
    touchAction: 'none' // Enable custom touch handling (D3 zoom/pan)
  };

  const renderForeignObjectNode = ({ nodeDatum, toggleNode }: { nodeDatum: any, toggleNode: () => void }) => {
    const rank = nodeDatum.attributes?.rank || 'Member';
    const isOnline = nodeDatum.attributes?.active;
    const isRoot = treeData && nodeDatum.attributes?.id === treeData.attributes?.id;

    // Rank Styles Configuration
    const getRankStyles = (r: string) => {
      switch (r) {
        case 'Diamond': return {
          bg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
          shadow: 'shadow-cyan-500/50',
          border: 'border-cyan-400',
          icon: <Sparkles size={16} className="text-white animate-pulse" />
        };
        case 'Gold': return {
          bg: 'bg-gradient-to-br from-amber-300 to-yellow-500',
          shadow: 'shadow-amber-500/50',
          border: 'border-yellow-400',
          icon: <Star size={16} className="text-white" fill="currentColor" />
        };
        case 'Silver': return {
          bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
          shadow: 'shadow-slate-500/50',
          border: 'border-slate-400',
          icon: <Shield size={16} className="text-white" />
        };
        case 'Bronze': return {
          bg: 'bg-gradient-to-br from-orange-300 to-orange-600',
          shadow: 'shadow-orange-500/50',
          border: 'border-orange-500',
          icon: <Award size={16} className="text-white" />
        };
        default: return {
          bg: 'bg-gradient-to-br from-indigo-400 to-violet-600',
          shadow: 'shadow-indigo-500/30',
          border: 'border-indigo-300',
          icon: <User size={16} className="text-white" />
        };
      }
    };

    const style = getRankStyles(rank);

    return (
      <foreignObject width="260" height="200" x="-130" y="-100">
        <div
          className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-t-4 ${style.border} border-r border-b border-l border-gray-100 dark:border-slate-600 h-full group`}
        >
          {/* Main Click Area for Toggling */}
          <div className="absolute inset-0 z-0 cursor-pointer" onClick={toggleNode} title="Click to Expand/Collapse"></div>

          <div className="p-4 relative z-10 pointer-events-none"> {/* Content container passes clicks through, but children re-enable pointer-events */}
            {/* Header: Avatar & Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Root Crown (Avatar Topper) */}
                {isRoot && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-30">
                    <Crown size={20} className="text-yellow-400 drop-shadow-md" fill="currentColor" />
                  </div>
                )}

                {/* Avatar Circle */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${style.shadow} ${style.bg} ring-2 ring-white dark:ring-slate-700 relative overflow-hidden`}>
                  {/* Gloss Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                  {/* Initials */}
                  <span className="relative z-10 drop-shadow-md">
                    {nodeDatum.name.substring(0, 1).toUpperCase()}
                  </span>
                </div>

                {/* Online Status Indicator */}
                {isOnline && (
                  <div className="absolute 0 bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm z-20"></div>
                )}

                {/* Rank Icon Badge */}
                <div className="absolute -top-1 -right-1 z-20 bg-slate-800 rounded-full p-0.5 border border-white dark:border-slate-600 shadow-sm">
                  {style.icon}
                </div>
              </div>

              <div className="overflow-hidden">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate w-32 leading-tight">
                  {nodeDatum.name}
                  {isRoot && <span className="ml-1 text-[10px] text-yellow-500 dark:text-yellow-400 font-extrabold">(YOU)</span>}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${style.bg} shadow-sm bg-opacity-90`}>
                    {rank.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-3 space-y-2">
              {/* Personal PV */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-1.5 text-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors border border-blue-100 dark:border-blue-500/20">
                <p className="text-[9px] uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-0.5 font-bold">Personal PV</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {nodeDatum.attributes?.personalPV || 0}
                </p>
              </div>

              {/* Legs PV */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 text-center group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10 transition-colors border border-gray-100 dark:border-slate-600">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 mb-0.5 font-bold">Left PV</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                    {nodeDatum.attributes?.leftPV || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 text-center group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 transition-colors border border-gray-100 dark:border-slate-600">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 mb-0.5 font-bold">Right PV</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {nodeDatum.attributes?.rightPV || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Earned Badge (Floating) */}
            <div className="absolute top-2 right-2 pointer-events-auto">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-500/20 text-[10px] font-bold text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/30">
                ${(nodeDatum.attributes?.totalEarned || 0).toLocaleString()}
              </span>
            </div>

            {/* View Details Button (Floating Bottom Right) */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNodeClick && nodeDatum.attributes?.id) {
                    onNodeClick(nodeDatum.attributes.id);
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-200 text-white dark:text-slate-900 rounded-lg shadow-xl text-[10px] font-bold flex items-center gap-1.5"
              >
                <User size={12} /> View Profile
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