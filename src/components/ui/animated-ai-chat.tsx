"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, LoaderIcon, ImageIcon, BarChart3Icon, Code2Icon, FileTextIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"

const REDPILL_TERMS = ["game", "neg", "hold frame", "DHV", "kino", "escalate", "pull", "plate", "isolate", "run game", "daygame"];

const SAMPLE_PROMPTS: { icon: React.ReactNode; label: string; sample: string }[] = [
    { icon: <ImageIcon className="w-3.5 h-3.5 text-[#cf3ea6]" />, label: 'Create image', sample: 'Create an image of a futuristic city at night with neon lights reflecting off rain-soaked streets.' },
    { icon: <BarChart3Icon className="w-3.5 h-3.5 text-[#cf3ea6]" />, label: 'Analyze data', sample: 'Analyze this dataset for trends: month, revenue, users — Jan: $12k, 340 | Feb: $15k, 410 | Mar: $11k, 290.' },
    { icon: <Code2Icon className="w-3.5 h-3.5 text-[#cf3ea6]" />, label: 'Write code', sample: 'Write a Python function that takes a list of numbers and returns the top 3 largest values.' },
    { icon: <FileTextIcon className="w-3.5 h-3.5 text-[#cf3ea6]" />, label: 'Summarize PDF', sample: 'Summarize the key points of a research paper about the effects of sleep deprivation on cognitive performance.' },
];

/* ============================================================
   AUTO-RESIZE TEXTAREA HOOK
   Grows the textarea to fit content, up to maxHeight.
   ============================================================ */

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) textarea.style.height = `${minHeight}px`;
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

/* ============================================================
   ANIMATED AI CHAT
   The "home" screen shown when no chat is selected.
   Title centered, input pinned to bottom.
   ============================================================ */

export function AnimatedAIChat({
    onSendMessage,
    isExternalTyping,
    userName
}: {
    onSendMessage?: (msg: string) => void;
    isExternalTyping?: boolean;
    userName?: string;
}) {
    const [value, setValue] = useState("");
    const [termIndex, setTermIndex] = useState(0);
    const [isInternalTyping, setIsInternalTyping] = useState(false);
    const isTyping = isExternalTyping !== undefined ? isExternalTyping : isInternalTyping;
    const [, startTransition] = useTransition();
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 48,
        maxHeight: 200,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTermIndex((prev) => (prev + 1) % REDPILL_TERMS.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) handleSendMessage();
        }
    };

    const handleSendMessage = () => {
        if (!value.trim()) return;
        if (onSendMessage) {
            onSendMessage(value.trim());
            setValue("");
            adjustHeight(true);
        } else {
            startTransition(() => {
                setIsInternalTyping(true);
                setTimeout(() => {
                    setIsInternalTyping(false);
                    setValue("");
                    adjustHeight(true);
                }, 3000);
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col w-full bg-transparent text-white relative h-full">
            <div className="w-full max-w-3xl mx-auto h-full flex flex-col px-4 pt-10 pb-8 relative z-10">

                {/* Centered title */}
                <div className="flex-1 flex flex-col justify-center items-center -mt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 text-center font-space">
                            Where should we{' '}
                            <span className="text-[#cf3ea6] italic font-bold relative pr-[4px]">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={termIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="inline-block"
                                    >
                                        {REDPILL_TERMS[termIndex]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                            {userName ? (
                                <span className="text-[#cf3ea6] italic font-bold">, {userName}?</span>
                            ) : '?'}
                        </h1>
                    </motion.div>
                </div>

                {/* Action chips */}
                <motion.div
                    className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                >
                    {SAMPLE_PROMPTS.map(({ icon, label, sample }) => (
                        <motion.button
                            key={label}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setValue(sample);
                                setTimeout(() => {
                                    adjustHeight();
                                    textareaRef.current?.focus();
                                }, 0);
                            }}
                            className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-on-surface-muted hover:text-white"
                        >
                            {icon}
                            <span className="text-[11px] font-medium tracking-tight font-space">{label}</span>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Bottom-pinned input */}
                <motion.div
                    className="w-full relative mt-auto z-20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                >
                    <div className="relative bg-surface-card border border-border-subtle shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-2xl">
                        <div className="p-1 pl-2 flex items-end">
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Arcturus..."
                                className={cn(
                                    "flex-1 w-full px-3 py-3",
                                    "resize-none bg-transparent",
                                    "text-white/90 text-[15px]",
                                    "placeholder:text-on-surface-faint",
                                    "min-h-[48px] max-h-[200px]",
                                    "border-none focus:ring-0 focus:outline-none"
                                )}
                                style={{ overflowY: "auto" }}
                            />

                            <div className="flex items-center pb-2 pr-2 shrink-0">
                                <motion.button
                                    type="button"
                                    onClick={handleSendMessage}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={isTyping || !value.trim()}
                                    className={cn(
                                        "flex items-center justify-center shrink-0 w-[30px] h-[30px] rounded-[6px] border transition-all duration-200 ease-out outline-none",
                                        (isTyping || !value.trim())
                                            ? "bg-transparent border-transparent text-on-surface-ghost opacity-50 cursor-not-allowed"
                                            : "bg-primary border-primary-border text-[#fafafa] hover:bg-primary-hover hover:border-primary-border-hover cursor-pointer shadow-md"
                                    )}
                                >
                                    {isTyping ? (
                                        <LoaderIcon className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                        <ArrowUpIcon className="w-4 h-4 text-white" />
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-4 mb-2">
                        <p className="text-[10px] uppercase font-bold text-on-surface-ghost tracking-widest">
                            Arcturus AI can make mistakes. Verify important info.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
