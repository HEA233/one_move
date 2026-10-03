"use client";

import { useState } from "react";
import { MissionCard } from "../components/MissionCard";
import { SandboxScene } from "../components/SandboxScene";
import { StatusBadge } from "../components/StatusBadge";
import { missions } from "../fixtures";
import { interactionCopy } from "../copy";

export function MissionSandbox() {
  const [selectedMissionId, setSelectedMissionId] = useState(missions[0].id);
  const selectedMission = missions.find((mission) => mission.id === selectedMissionId) ?? missions[0];

  return (
    <SandboxScene title={interactionCopy.task.title} description={interactionCopy.task.description}>
      <section className="mission-scene" aria-labelledby="mission-card-title">
        <div className="mission-choice-area">
          <div className="mission-grid">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                id={mission.id}
                title={mission.title}
                description={mission.description}
                icon={mission.icon}
                selected={selectedMission.id === mission.id}
                onSelect={setSelectedMissionId}
              />
            ))}
          </div>
        </div>
        <div className="mission-ticket">
          <div className="mission-ticket-topline">
            <span>Current task</span>
            <span>Fictional brief</span>
          </div>
          <h2 id="mission-card-title">{selectedMission.title}</h2>
          <p className="mission-ticket-request">“{selectedMission.request}”</p>
          <div className="mission-constraints">
            <p className="scene-label">What this preview shows</p>
            <ul>
              {selectedMission.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
            </ul>
          </div>
          {selectedMission.ambiguity ? (
            <div className="mission-ambiguity">
              <StatusBadge tone="warning">Needs clarification</StatusBadge>
              <p>{selectedMission.ambiguity}</p>
            </div>
          ) : null}
        </div>

      </section>
    </SandboxScene>
  );
}
