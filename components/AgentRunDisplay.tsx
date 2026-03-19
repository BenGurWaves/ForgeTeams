"use client";

import { useRef, useEffect } from "react";

interface AgentMessage {
  agent: string;
  content: string;
  timestamp: string;
  node?: string;
}

interface AgentRunDisplayProps {
  messages: AgentMessage[];
  isRunning: boolean;
}

const agentColors: Record<string, string> = {
  supervisor: "text-forge-accent",
  planner: "text-blue-400",
  researcher: "text-emerald-400",
  executor: "text-orange-400",
  reviewer: "text-purple-400",
  system: "text-red-400",
};

export default function AgentRunDisplay({ messages, isRunning }: AgentRunDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-forge-border px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-forge-muted font-medium uppercase tracking-widest">
          Team Activity
        </span>
        {isRunning && (
          <span className="text-xs text-forge-accent animate-pulse">
            Live
          </span>
        )}
      </div>

      {/* Message area */}
      <div className="max-h-[500px] overflow-y-auto p-5 font-mono text-sm space-y-1">
        {messages.length === 0 && isRunning && (
          <span className="text-forge-muted">Initializing team...</span>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3">
            <span
              className={`shrink-0 w-28 text-right ${agentColors[msg.agent] || "text-forge-muted"}`}
            >
              {msg.agent}
            </span>
            <span className="text-forge-muted">|</span>
            <span className="text-forge-text">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer — run complete */}
      {!isRunning && messages.length > 0 && (
        <div className="border-t border-forge-border px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-forge-muted font-medium">
            Run complete
          </span>
          <span className="text-xs text-forge-muted">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
