
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Play, RotateCcw, DollarSign, TrendingUp, ArrowRight, PlusCircle, ShoppingCart, RefreshCw, Zap } from 'lucide-react';

// --- TYPES ---
interface SimulationNode {
    id: string;
    parent?: string;
    sponsorId?: string;
    name: string;
    position: 'left' | 'right' | 'root';
    level: number;
    personalPV: number;
    totalLeftVol: number;  // Current holding volume for binary calculation
    totalRightVol: number; // Current holding volume for binary calculation
    rank: string;
    active: boolean; // Active = Bought > 0
    earnings: number;
    children?: SimulationNode[];
    isSpillover?: boolean;
    // D3 Props
    x?: number;
    y?: number;
}

interface SimulationStep {
    id: string;
    title: string;
    description: string;
    breakdown: { label: string; value: string; color?: string }[];
    actionType: 'enroll' | 'purchase' | 'cycle' | 'rank' | 'info';
}



const CommissionSimulation = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mode: 'story' (The guided detailed tour) | 'sandbox' (Free play)
    const [mode, setMode] = useState<'story' | 'sandbox'>('story');

    // --- STORY STATE ---
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // --- SANDBOX STATE ---
    const [sandboxNodes, setSandboxNodes] = useState<SimulationNode[]>([
        { id: 'root', name: 'YOU', position: 'root', level: 0, personalPV: 0, totalLeftVol: 0, totalRightVol: 0, rank: 'Member', active: false, earnings: 0, children: [] }
    ]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>('root');
    const [sandboxLog, setSandboxLog] = useState<string[]>([]);

    // Derived Stats for Sandbox
    const rootNode = sandboxNodes.find(n => n.id === 'root');

    // --- STORY STEPS CONSTANTS ---
    const storySteps: SimulationStep[] = [
        {
            id: 'init',
            title: '0. Initial State',
            description: 'You are a new Distributor. Your status is currently INACTIVE. You have 0 Personal Volume (PV).',
            breakdown: [{ label: 'Status', value: 'Inactive', color: 'text-red-500' }, { label: 'Personal PV', value: '0 PV' }],
            actionType: 'info'
        },
        {
            id: 'you_activate',
            title: '1. Personal Activation',
            description: 'You purchase a "Pro Pack" ($200). You earn 100 Personal PV. You are now ACTIVE.',
            breakdown: [{ label: 'PV Generated', value: '+100 PV', color: 'text-blue-500' }, { label: 'Status', value: 'ACTIVE', color: 'text-green-500' }],
            actionType: 'purchase'
        },
        {
            id: 'enroll_alice',
            title: '2. Sponsor Left (Direct)',
            description: 'You enroll "Alice" on your LEFT. She buys a Starter Pack ($100 / 50 PV). You earn $10 Fast Start.',
            breakdown: [{ label: 'Referral Bonus', value: '$10', color: 'text-green-600' }, { label: 'Left Vol', value: '+50 PV', color: 'text-indigo-500' }],
            actionType: 'enroll'
        },
        {
            id: 'enroll_bob',
            title: '3. Sponsor Right (Direct)',
            description: 'You enroll "Bob" on your RIGHT. He buys a Pro Pack ($200 / 100 PV). You earn $20 Fast Start.',
            breakdown: [{ label: 'Referral Bonus', value: '$20', color: 'text-green-600' }, { label: 'Right Vol', value: '+100 PV', color: 'text-indigo-500' }],
            actionType: 'enroll'
        },
        {
            id: 'cycle_1',
            title: '4. Binary Cycle Calculation',
            description: 'Left: 50 | Right: 100. Match = 50. Pay 10% of 50 = $5.',
            breakdown: [{ label: 'Weak Leg', value: '50 PV' }, { label: 'Commission', value: '$5', color: 'text-green-600 font-bold' }],
            actionType: 'cycle'
        },
        {
            id: 'flush_carry',
            title: '5. Flush & Carryover',
            description: 'Paid volume (50) is flushed. Remaining 50 on Right is carried over.',
            breakdown: [{ label: 'Left New', value: '0 PV' }, { label: 'Right Carryover', value: '50 PV', color: 'text-orange-500' }],
            actionType: 'info'
        },
        {
            id: 'spillover',
            title: '6. Spillover Mechanics',
            description: 'You enroll "Charlie". Since Level 1 is full, he spills under Alice. BOTH You and Alice get his volume.',
            breakdown: [{ label: 'Placement', value: 'Under Alice' }, { label: 'Flow', value: '+100 PV to Alice, +100 PV to You' }],
            actionType: 'enroll'
        },
        {
            id: 'matching',
            title: '7. Matching Bonus',
            description: 'When Bob cycles and earns $20, you earn a 10% Matching Bonus ($2) because you sponsored him.',
            breakdown: [{ label: 'Bob Earned', value: '$20' }, { label: 'Your Match', value: '$2', color: 'text-green-600' }],
            actionType: 'info'
        }
    ];

    // --- STORY LOGIC (Simplified from previous) ---
    const getStoryState = (stepIndex: number) => {
        // Reconstruct basic state for story mode
        let s = { nodes: [{ id: 'root', name: 'YOU', active: false, level: 0, personalPV: 0, totalLeftVol: 0, totalRightVol: 0, rank: 'Member', earnings: 0, children: [] }] as any[], left: 0, right: 0, earn: 0, q: false };
        if (stepIndex >= 1) { s.nodes[0].active = true; s.nodes[0].personalPV = 100; }
        if (stepIndex >= 2) { s.nodes[0].children.push({ id: 'alice', name: 'Alice', level: 1, position: 'left', active: true, personalPV: 50, totalLeftVol: 0, totalRightVol: 0, rank: 'Member', earnings: 0 }); s.left += 50; s.earn += 10; s.nodes[0].totalLeftVol += 50; }
        if (stepIndex >= 3) { s.nodes[0].children.push({ id: 'bob', name: 'Bob', level: 1, position: 'right', active: true, personalPV: 100, totalLeftVol: 0, totalRightVol: 0, rank: 'Member', earnings: 0 }); s.right += 100; s.earn += 20; s.q = true; s.nodes[0].totalRightVol += 100; }
        if (stepIndex >= 4) { s.earn += 5; s.nodes[0].totalLeftVol -= 50; s.nodes[0].totalRightVol -= 50; } // Cycle 1
        if (stepIndex >= 5) { s.left = 0; s.right = 50; } // Flush & Carryover
        if (stepIndex >= 6) {
            const alice = s.nodes[0].children.find((c: any) => c.id === 'alice');
            if (alice) { if (!alice.children) alice.children = []; alice.children.push({ id: 'charlie', name: 'Charlie', level: 2, position: 'left', active: true, isSpillover: true, personalPV: 100, totalLeftVol: 0, totalRightVol: 0, rank: 'Member', earnings: 0 }); }
            s.left += 100; s.earn += 20; s.nodes[0].totalLeftVol += 100; // Charlie's volume rolls up
        }
        if (stepIndex >= 7) { s.earn += 2; }
        return s;
    };


    // --- SANDBOX LOGIC ---

    // Helper to find a node by ID recursively
    const findNode = (root: SimulationNode, id: string): SimulationNode | null => {
        if (root.id === id) return root;
        if (root.children) {
            for (const child of root.children) {
                const found = findNode(child, id);
                if (found) return found;
            }
        }
        return null;
    };

    // Helper to find the path from root to a target node
    const findPathToNode = (root: SimulationNode, targetId: string, path: SimulationNode[] = []): SimulationNode[] | null => {
        path.push(root);
        if (root.id === targetId) {
            return path;
        }
        if (root.children) {
            for (const child of root.children) {
                const foundPath = findPathToNode(child, targetId, path);
                if (foundPath) return foundPath;
            }
        }
        path.pop(); // Backtrack
        return null;
    };

    const addSandboxMember = (position: 'left' | 'right') => {
        if (!selectedNodeId) {
            alert("Please select a parent node first.");
            return;
        }
        const newNodes = JSON.parse(JSON.stringify(sandboxNodes)); // Deep clone
        const parent = findNode(newNodes[0], selectedNodeId);

        if (parent) {
            if (!parent.children) parent.children = [];
            // Check if position is taken
            const taken = parent.children.find((c: any) => c.position === position);
            if (taken) {
                alert(`Position ${position} is already taken under ${parent.name} !Select a node deeper in the tree or the other position.`);
                return;
            }

            const newNode: SimulationNode = {
                id: `user - ${Math.random().toString(36).substr(2, 5)} `,
                name: `User ${Math.floor(Math.random() * 1000)} `,
                position: position,
                level: parent.level + 1,
                personalPV: 0,
                totalLeftVol: 0,
                totalRightVol: 0,
                rank: 'Member',
                active: false,
                earnings: 0,
                children: [],
                sponsorId: parent.id
            };
            parent.children.push(newNode);
            setSandboxNodes(newNodes);
            setSandboxLog(prev => [`Added ${newNode.name} under ${parent.name} (${position})`, ...prev]);
            setSelectedNodeId(newNode.id); // Select the newly added node
        }
    };

    const purchaseProduct = (amount: number) => {
        if (!selectedNodeId) {
            alert("Please select a node to make a purchase.");
            return;
        }
        const newNodes = JSON.parse(JSON.stringify(sandboxNodes));
        const target = findNode(newNodes[0], selectedNodeId);

        if (target) {
            target.personalPV += amount;
            target.active = true;

            // Flow volume UP
            const path = findPathToNode(newNodes[0], target.id);
            if (path) {
                // Path includes the target node itself, we want to iterate up from its direct parent
                for (let i = path.length - 2; i >= 0; i--) { // Start from direct parent of target
                    const currentParent = path[i];
                    const childInPath = path[i + 1]; // The child that is on the path to target

                    if (childInPath.position === 'left') {
                        currentParent.totalLeftVol += amount;
                    } else if (childInPath.position === 'right') {
                        currentParent.totalRightVol += amount;
                    }
                }

                // Pay Fast Start to direct sponsor (which is the direct parent in this simplified model)
                if (path.length > 1) { // If there's a parent
                    const sponsor = path[path.length - 2]; // Direct parent
                    const bonus = amount * 0.10; // Assuming 10% Fast Start
                    sponsor.earnings += bonus;
                    setSandboxLog(prev => [`${sponsor.name} earned $${bonus.toFixed(2)} Fast Start from ${target.name} 's purchase`, ...prev]);
                }
            }

            setSandboxNodes(newNodes);
            setSandboxLog(prev => [`${target.name} purchased ${amount} PV.`, ...prev]);
        }
    };

    const runSandboxCycle = () => {
        const newNodes = JSON.parse(JSON.stringify(sandboxNodes));

        // Recursive function to process cycles from bottom-up or top-down
        // For simplicity, let's process all nodes.
        // A more robust system would process based on events or a timer.
        const processNode = (n: SimulationNode) => {
            // Process children first to ensure their volumes are updated before parent's cycle
            if (n.children) {
                n.children.forEach(processNode);
            }

            // Only active nodes can cycle
            if (!n.active) return;

            const weak = Math.min(n.totalLeftVol, n.totalRightVol);
            if (weak > 0) {
                const bonus = weak * 0.10; // Assuming 10% binary commission
                if (bonus > 0) {
                    n.earnings += bonus;
                    n.totalLeftVol -= weak;
                    n.totalRightVol -= weak;
                    setSandboxLog(prev => [`${n.name} cycled! Earned $${bonus.toFixed(2)}. Left: ${n.totalLeftVol} PV, Right: ${n.totalRightVol} PV`, ...prev]);
                }
            }
        };

        // Start processing from the root
        processNode(newNodes[0]);
        setSandboxNodes(newNodes);
        setSandboxLog(prev => [`--- Binary Cycle Run ---`, ...prev]);
    };

    // --- D3 EFFECT ---
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = 500;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Data source depends on mode
        let dataToRender: SimulationNode;
        if (mode === 'story') {
            const storyState = getStoryState(currentStep);
            dataToRender = storyState.nodes[0];
        } else { // sandbox mode
            dataToRender = sandboxNodes[0];
        }

        const rootNode = d3.hierarchy(dataToRender);
        const treeLayout = d3.tree().size([width - 100, height - 150]);
        const treeData = treeLayout(rootNode as any);

        const g = svg.append('g').attr('transform', 'translate(50, 80)');

        // Links
        g.selectAll('.link')
            .data(treeData.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x((d: any) => d.x)
                .y((d: any) => d.y) as any
            )
            .attr('fill', 'none')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', (d: any) => d.target.data.isSpillover ? '5,5' : '0'); // Dashed for spillover placement

        // Nodes
        const nodeGroup = g.selectAll('.node')
            .data(treeData.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
            .on('click', (_event, d: any) => {
                if (mode === 'sandbox') {
                    setSelectedNodeId(d.data.id);
                }
            });

        // Circle
        nodeGroup.append('circle')
            .attr('r', 25)
            .attr('fill', (d: any) => {
                const isSelected = mode === 'sandbox' && d.data.id === selectedNodeId;
                if (isSelected) return '#db2777'; // Pink selection
                if (!d.data.active) return '#94a3b8'; // Inactive gray
                if (d.data.id === 'root') return '#0f766e'; // You
                if (d.data.isSpillover) return '#f59e0b'; // Spillover orange
                return '#3b82f6'; // Standard blue
            })
            .attr('stroke', (d: any) => mode === 'sandbox' && d.data.id === selectedNodeId ? '#fff' : '#fff')
            .attr('stroke-width', (d: any) => mode === 'sandbox' && d.data.id === selectedNodeId ? 4 : 2)
            .style('cursor', mode === 'sandbox' ? 'pointer' : 'default');

        // Label
        nodeGroup.append('text')
            .attr('dy', 5)
            .attr('text-anchor', 'middle')
            .text((d: any) => d.data.name)
            .attr('fill', 'white')
            .style('font-size', '10px')
            .style('font-weight', 'bold');

        // Stats (Sandbox only?)
        if (mode === 'sandbox') {
            nodeGroup.append('text')
                .attr('dy', 40)
                .attr('text-anchor', 'middle')
                .text((d: any) => `${d.data.totalLeftVol || 0} | ${d.data.totalRightVol || 0}`)
                .attr('fill', '#64748b')
                .style('font-size', '9px')
                .style('font-weight', 'bold');
        } else { // Story mode specific indicators
            nodeGroup.append('text')
                .attr('dy', 40)
                .attr('text-anchor', 'middle')
                .text((d: any) => d.data.active ? `${d.data.personalPV} PV` : 'Inactive')
                .attr('fill', (d: any) => d.data.active ? '#0f766e' : '#ef4444')
                .style('font-size', '10px')
                .style('font-weight', 'bold');

            // Spillover Badge
            nodeGroup.filter((d: any) => d.data.isSpillover)
                .append('text')
                .attr('dy', -35)
                .attr('text-anchor', 'middle')
                .text('SPILLOVER')
                .attr('fill', '#f59e0b')
                .style('font-size', '9px')
                .style('font-weight', '800');
        }

    }, [sandboxNodes, mode, currentStep, selectedNodeId]); // Re-render on these changes

    // Timer Logic for Story Mode
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && mode === 'story') {
            timer = setTimeout(() => {
                if (currentStep < storySteps.length - 1) {
                    setCurrentStep(c => c + 1);
                } else {
                    setIsPlaying(false);
                }
            }, 4000); // Slower pacing for granular detail
        }
        return () => clearTimeout(timer);
    }, [isPlaying, currentStep, mode]);

    return (
        <div className="space-y-6">
            {/* Mode Switcher */}
            <div className="flex justify-center p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit mx-auto">
                <button
                    onClick={() => setMode('story')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'story' ? 'bg-white dark:bg-[#2d2e36] shadow text-teal-600' : 'text-gray-500'}`}
                >
                    Story Guide (Learn)
                </button>
                <button
                    onClick={() => setMode('sandbox')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'sandbox' ? 'bg-white dark:bg-[#2d2e36] shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    Sandbox Mode (Experiment)
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
                {/* Visualizer Area */}
                <div className="flex-1 bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-200 dark:border-white/5 relative flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {mode === 'story' ? <TrendingUp size={20} className="text-teal-500" /> : <Zap size={20} className="text-indigo-500" />}
                            {mode === 'story' ? 'Step-by-Step Scenario' : 'Interactive Sandbox'}
                        </h2>
                        {mode === 'sandbox' && (
                            <button onClick={() => { setSandboxNodes([{ id: 'root', name: 'YOU', position: 'root', level: 0, personalPV: 0, totalLeftVol: 0, totalRightVol: 0, rank: 'Member', active: false, earnings: 0, children: [] }]); setSandboxLog([]); setSelectedNodeId('root'); }} className="text-xs text-red-500 hover:text-red-600 font-medium">
                                Reset Tree
                            </button>
                        )}
                        {mode === 'story' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <RotateCcw size={18} className="text-gray-500" />
                                </button>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isPlaying ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-teal-500 text-white hover:bg-teal-600'} `}
                                >
                                    <Play size={16} fill={isPlaying ? "currentColor" : "none"} />
                                    {isPlaying ? 'Pause' : 'Play Demo'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative bg-slate-50 dark:bg-[#0f1014]" ref={containerRef}>
                        <svg ref={svgRef} className="w-full h-full"></svg>
                    </div>

                    {/* Sandbox Controls Overlay */}
                    {mode === 'sandbox' && (
                        <div className="border-t border-gray-200 dark:border-white/5 p-4 bg-white dark:bg-[#1a1b23]">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-xs font-bold text-gray-500 uppercase">Selected: <span className="text-indigo-600">{sandboxNodes.find(n => n.id === selectedNodeId)?.name || 'None'}</span></span>
                                <div className="h-6 w-px bg-gray-200 dark:bg-white/10"></div>
                                <button onClick={() => addSandboxMember('left')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100">
                                    <PlusCircle size={14} /> Add Left
                                </button>
                                <button onClick={() => addSandboxMember('right')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100">
                                    <PlusCircle size={14} /> Add Right
                                </button>
                                <button onClick={() => purchaseProduct(100)} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100">
                                    <ShoppingCart size={14} /> Buy 100 PV
                                </button>
                                <div className="flex-1"></div>
                                <button onClick={runSandboxCycle} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                                    <RefreshCw size={14} /> Run Commissions
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Panel */}
                <div className="lg:w-96 flex flex-col gap-4">
                    {mode === 'story' ? (
                        // STORY SIDEBAR
                        <div className="flex-1 bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-200 dark:border-white/5 p-6 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Step {currentStep} / {storySteps.length - 1}
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{storySteps[currentStep].title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-1">{storySteps[currentStep].description}</p>

                            <div className="space-y-3 mb-8">
                                {storySteps[currentStep].breakdown.map((b, i) => (
                                    <div key={i} className="flex justify-between text-sm p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">{b.label}</span>
                                        <span className={`font-bold ${b.color}`}>{b.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b23] text-gray-600 dark:text-gray-300 font-bold text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/5">Previous</button>
                                <button onClick={() => setCurrentStep(Math.min(storySteps.length - 1, currentStep + 1))} disabled={currentStep === storySteps.length - 1} className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">Next Step <ArrowRight size={16} /></button>
                            </div>
                        </div>
                    ) : (
                        // SANDBOX SIDEBAR
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                                <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">My Total Earnings</div>
                                <div className="text-4xl font-black flex items-center gap-1">
                                    <DollarSign size={28} /> {(rootNode?.earnings || 0).toFixed(2)}
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-white/10 rounded-lg p-2">
                                        <div className="text-xs text-indigo-200 mb-1">Left Vol</div>
                                        <div className="font-bold text-lg">{rootNode?.totalLeftVol || 0}</div>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-2">
                                        <div className="text-xs text-indigo-200 mb-1">Right Vol</div>
                                        <div className="font-bold text-lg">{rootNode?.totalRightVol || 0}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-200 dark:border-white/5 p-4 flex flex-col overflow-hidden">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Event Log</h4>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {sandboxLog.map((log, i) => (
                                        <div key={i} className="text-xs p-2 bg-gray-50 dark:bg-white/5 rounded border-l-2 border-indigo-500 text-gray-700 dark:text-gray-300">
                                            {log}
                                        </div>
                                    ))}
                                    {sandboxLog.length === 0 && <span className="text-xs text-gray-400 italic">No events yet. Start by adding members!</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommissionSimulation;
