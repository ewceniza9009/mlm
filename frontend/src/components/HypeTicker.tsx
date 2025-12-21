import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGetHypeTickerQuery } from '../store/api';

const HypeTicker: React.FC = () => {
    const { data: events } = useGetHypeTickerQuery(undefined, {
        pollingInterval: 30000,
    });

    const hasData = events && events.length > 0;

    // Duplicate items to ensure seamless connection during infinite scroll
    const displayEvents = useMemo(() => {
        if (!events || events.length === 0) return [];
        let items = [...events];
        while (items.length < 10) {
            items = [...items, ...events];
        }
        return [...items, ...items];
    }, [events]);

    if (!hasData) return null;

    return (
        <div className="w-full bg-gradient-to-r from-purple-900/95 to-blue-900/95 border-b border-white/10 overflow-hidden relative h-12 flex items-center shadow-lg backdrop-blur-md z-40">

            {/* Label Badge */}
            <div className="absolute left-0 top-0 bottom-0 bg-yellow-500 text-yellow-950 font-extrabold px-6 flex items-center z-20 skew-x-[-12deg] -ml-4 border-r-4 border-yellow-300 shadow-xl">
                <span className="skew-x-[12deg] flex items-center gap-2 text-xs md:text-sm uppercase tracking-widest">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    Live Action
                </span>
            </div>

            {/* Scrolling Container */}
            <div className="flex overflow-hidden w-full mask-linear-fade relative pl-32 md:pl-40">
                <motion.div
                    className="flex gap-8 md:gap-12 whitespace-nowrap pr-12"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: Math.max(20, displayEvents.length * 2),
                            ease: "linear",
                        },
                    }}
                >
                    {displayEvents.map((event: any, i: number) => (
                        <div
                            key={`${event.id}-${i}`}
                            className="flex items-center gap-2 text-sm text-white/90 group"
                        >
                            <span className="text-xl filter drop-shadow-md group-hover:scale-110 transition-transform">{event.icon}</span>
                            <span className="font-bold text-blue-200 group-hover:text-white transition-colors">{event.username}</span>
                            <span className="text-blue-100/80 font-medium">{event.message}</span>
                            <span className="text-xs text-white/40 ml-1 font-mono bg-black/20 px-1.5 py-0.5 rounded">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            <style>{`
        .mask-linear-fade {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
        </div>
    );
};

export default HypeTicker;
