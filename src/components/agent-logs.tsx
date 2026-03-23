"use client";

import { useState, useEffect, useRef } from "react";
import { AGENTS, AGENT_MAP, ACTIVITY_TAG } from "@/lib/agents";
import type { Activity } from "@/types/pipeline";

interface AgentLogsProps {
  activities: Activity[];
}

export function AgentLogs({ activities }: AgentLogsProps) {
  const activeAgentIds = [...new Set(activities.map((a) => a.agentId))];
  const tabOrder = AGENTS.filter((a) => activeAgentIds.includes(a.id));
  // Always show system as first tab option if it has activities
  const allTabs = activeAgentIds.includes("system")
    ? [{ id: "system", emoji: "⚙️", name: "System" }, ...tabOrder]
    : tabOrder;

  const [selectedTab, setSelectedTab] = useState(allTabs[0]?.id || "");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = activities.filter((a) => a.agentId === selectedTab);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredLogs.length]);

  return (
    <>
      <div className="flex gap-0 border-b border-border px-3 bg-[#111827] overflow-x-auto">
        {allTabs.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedTab(agent.id)}
            className={`text-[11px] px-3 py-2 whitespace-nowrap ${
              selectedTab === agent.id
                ? "text-accent-purple-light font-semibold border-b-2 border-accent-purple-light"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {agent.emoji} {agent.name}
          </button>
        ))}
      </div>
      <div className="flex-1 bg-[#0d1117] p-3 overflow-y-auto font-[family-name:var(--font-geist-mono)] text-[11px]">
        {filteredLogs.length === 0 ? (
          <div className="text-text-muted text-center py-10">아직 활동 로그가 없습니다.</div>
        ) : (
          filteredLogs.map((log) => {
            const tag = ACTIVITY_TAG[log.type] || ACTIVITY_TAG.info;
            const time = new Date(log.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={log.id} className="mb-[5px]">
                <span className="text-text-muted">{time}</span>{" "}
                <span style={{ color: tag.color }}>[{tag.label}]</span>{" "}
                <span className="text-text-primary">{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </>
  );
}
