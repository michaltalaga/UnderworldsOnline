import type { EventLogEntry } from "../engine/types";

type EventLogProps = {
  entries: EventLogEntry[];
};

export function EventLog({ entries }: EventLogProps) {
  const visible = entries.slice(-12);
  return (
    <div className="panel log-panel">
      <h3>Event Log</h3>
      <ul>
        {visible.map((e, idx) => (
          <li key={`${e.turn}-${idx}`} className="log-line">
            <span className="turn">T{e.turn}</span>
            <span>{e.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
