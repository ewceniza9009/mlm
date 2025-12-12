import React, { useState } from 'react';
import TreeVisualizer from '../components/TreeVisualizer';
import HoldingTank from '../components/HoldingTank';
import NetworkNodeModal from '../components/NetworkNodeModal'; // Import
import { Search, Filter, ZoomIn, ZoomOut, Download, List, ArrowUp, ArrowDown } from 'lucide-react';
import { useLazySearchDownlineQuery, useGetTreeQuery, useGetUplineQuery } from '../store/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Network = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [showHoldingTank, setShowHoldingTank] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerSearch, { data: searchResults, isFetching }] = useLazySearchDownlineQuery();
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);

  // View Mode State
  const [viewMode, setViewMode] = useState<'downline' | 'upline'>('downline');
  const [uplineLevels, setUplineLevels] = useState<number>(5);

  // Fetch Tree Data logic
  const rootId = focusedNodeId || user?.id;

  const { data: downlineData, isLoading: isDownlineLoading, error: downlineError } = useGetTreeQuery(rootId, {
    skip: viewMode === 'upline'
  });

  const { data: uplineData, isLoading: isUplineLoading, error: uplineError } = useGetUplineQuery({
    userId: rootId,
    levels: uplineLevels
  }, {
    skip: viewMode === 'downline' || !rootId
  });

  const treeData = viewMode === 'downline' ? downlineData : uplineData;
  const isTreeLoading = viewMode === 'downline' ? isDownlineLoading : isUplineLoading;
  const treeError = viewMode === 'downline' ? downlineError : uplineError;

  const handleExport = () => {
    if (!treeData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(treeData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `network_tree_${rootId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        console.log('Triggering search for:', searchQuery);
        triggerSearch(searchQuery);
      }
    }, 500); // 500ms delay
    return () => clearTimeout(timer);
  }, [searchQuery, triggerSearch]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery) {
      triggerSearch(searchQuery);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      {/* ... keeping header ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
        {/* ... */}

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Holding Tank Toggle */}
          <button
            onClick={() => setShowHoldingTank(!showHoldingTank)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${showHoldingTank ? 'bg-teal-500 text-white border-teal-500' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <List size={18} />
            <span className="text-sm font-medium">Holding Tank</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-1">
            <button
              onClick={() => setViewMode('downline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'downline'
                  ? 'bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
            >
              <ArrowDown size={14} />
              Downline
            </button>
            <button
              onClick={() => setViewMode('upline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'upline'
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
            >
              <ArrowUp size={14} />
              Upline
            </button>
          </div>

          {/* Upline Level Selector */}
          {viewMode === 'upline' && (
            <select
              value={uplineLevels}
              onChange={(e) => setUplineLevels(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value={1}>1 Level Up</option>
              <option value={2}>2 Levels Up</option>
              <option value={3}>3 Levels Up</option>
              <option value={4}>4 Levels Up</option>
              <option value={5}>5 Levels Up</option>
            </select>
          )}

          {/* Search Input */}
          <div className="relative flex-grow md:flex-grow-0 group">
            <div className="relative">
              <input
                type="text"
                placeholder="Find user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white pl-9 pr-8 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 w-full md:w-64 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all shadow-sm dark:shadow-none"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-400 w-4 h-4" />

              {/* Reset Button */}
              {(searchQuery || focusedNodeId) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFocusedNodeId(null);
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  title="Clear Search"
                >
                  <span className="text-xs font-bold">✕</span>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && (isFetching || (searchResults && searchResults.length > 0)) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {isFetching && <div className="p-3 text-gray-500 dark:text-slate-400 text-sm text-center">Searching...</div>}

                {!isFetching && searchResults?.map((user: any) => (
                  <div
                    key={user._id}
                    onClick={() => {
                      setFocusedNodeId(user._id);
                      setSearchQuery(''); // Closes dropdown
                    }}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700/50 last:border-0"
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <button className="bg-white dark:bg-slate-800 p-2 rounded-lg text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:shadow-none" title="Filter">
            <Filter size={20} />
          </button>
          <button
            onClick={handleExport}
            className="bg-white dark:bg-slate-800 p-2 rounded-lg text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:shadow-none"
            title="Export Tree"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Holding Tank Modal Overlay */}
      {showHoldingTank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 p-1.5 rounded-lg">
                  <List size={18} />
                </span>
                Holding Tank
              </h3>
              <button
                onClick={() => setShowHoldingTank(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[80vh] overflow-y-auto">
              <HoldingTank />
            </div>
          </div>
        </div>
      )}

      {/* Node Details Modal */}
      {viewingMemberId && (
        <NetworkNodeModal
          memberId={viewingMemberId}
          onClose={() => setViewingMemberId(null)}
        />
      )}

      {/* Main Tree Container */}
      <div className="flex-1 bg-gray-50 dark:bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-slate-700 relative w-full h-full flex flex-col">
        {/* Floating Controls (Visual only for now) */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-2 rounded-lg border border-gray-200 dark:border-slate-700/50 shadow-sm">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-slate-300"><ZoomIn size={20} /></button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-slate-300"><ZoomOut size={20} /></button>
        </div>

        {/* The Tree Component */}
        <TreeVisualizer
          data={treeData}
          isLoading={isTreeLoading}
          error={treeError}
          onNodeClick={(id) => setViewingMemberId(id)}
        />
      </div>
    </div>
  );
};

export default Network;