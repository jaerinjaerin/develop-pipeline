import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { PipelineState, ServerMessage, ClientMessage } from "@/types/pipeline";
import { PipelineWatcher } from "./watcher";
import { readPipelineState, writeCheckpointResponse, getPipelineDir } from "./pipelines";
import { detectCheckpoint } from "./checkpoint";
import fs from "fs";

interface ClientState {
  ws: WebSocket;
  mode: "none" | "all" | "single";
  pipelineId?: string;
}

export function createWSServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Map<WebSocket, ClientState>();
  const prevActivitiesCount = new Map<string, number>();

  const watcher = new PipelineWatcher((id, state) => {
    if (state === null) {
      broadcast({ type: "pipeline:removed", id }, (c) => c.mode !== "none");
      prevActivitiesCount.delete(id);
      return;
    }

    broadcastToAll({ type: "pipeline:updated", id, state });

    const prevCount = prevActivitiesCount.get(id) || 0;
    const newActivities = state.activities.slice(prevCount);
    prevActivitiesCount.set(id, state.activities.length);

    for (const activity of newActivities) {
      broadcastToSingle(id, { type: "pipeline:activity", id, activity });
    }

    const checkpoint = detectCheckpoint(state.activities);
    if (checkpoint) {
      broadcastToSingle(id, { type: "pipeline:checkpoint", id, checkpoint });
    }

    broadcastToSingle(id, { type: "pipeline:updated", id, state });
  });

  watcher.start();

  function broadcast(msg: ServerMessage, filter: (c: ClientState) => boolean) {
    const data = JSON.stringify(msg);
    for (const [, client] of clients) {
      if (client.ws.readyState === WebSocket.OPEN && filter(client)) {
        client.ws.send(data);
      }
    }
  }

  function broadcastToAll(msg: ServerMessage) {
    broadcast(msg, (c) => c.mode === "all");
  }

  function broadcastToSingle(pipelineId: string, msg: ServerMessage) {
    broadcast(msg, (c) => c.mode === "single" && c.pipelineId === pipelineId);
  }

  wss.on("connection", (ws) => {
    const clientState: ClientState = { ws, mode: "none" };
    clients.set(ws, clientState);

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as ClientMessage;
        handleMessage(clientState, msg);
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  function handleMessage(client: ClientState, msg: ClientMessage) {
    switch (msg.type) {
      case "subscribe:all":
        client.mode = "all";
        client.pipelineId = undefined;
        break;

      case "subscribe": {
        const dir = getPipelineDir(msg.pipelineId);
        if (!fs.existsSync(dir)) {
          client.ws.send(JSON.stringify({ type: "error", message: "Pipeline not found" }));
          return;
        }
        client.mode = "single";
        client.pipelineId = msg.pipelineId;

        const state = readPipelineState(msg.pipelineId);
        if (state) {
          prevActivitiesCount.set(msg.pipelineId, state.activities.length);
          client.ws.send(JSON.stringify({ type: "pipeline:updated", id: msg.pipelineId, state }));
          const checkpoint = detectCheckpoint(state.activities);
          if (checkpoint) {
            client.ws.send(JSON.stringify({ type: "pipeline:checkpoint", id: msg.pipelineId, checkpoint }));
          }
        }
        break;
      }

      case "unsubscribe":
        client.mode = "none";
        client.pipelineId = undefined;
        break;

      case "checkpoint:respond": {
        writeCheckpointResponse(msg.pipelineId, msg.action, msg.message);
        break;
      }
    }
  }

  return { wss, watcher };
}
