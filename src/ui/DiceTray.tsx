import type { DiceFace, DiceRollEvent } from "../engine/types";

type DiceTrayProps = {
  event: DiceRollEvent | null;
};

function facesWithSlots(faces: DiceFace[], slots = 8): Array<DiceFace | null> {
  const out: Array<DiceFace | null> = [...faces];
  while (out.length < slots) out.push(null);
  return out;
}

function faceLabel(face: DiceFace): string {
  switch (face.face) {
    case "crit-attack":
      return "CRIT";
    case "crit-save":
      return "CRIT";
    case "hammer":
      return "HAM";
    case "sword":
      return "SWD";
    case "shield":
      return "SHD";
    case "dodge":
      return "DOD";
    case "support":
      return "SUP";
    case "double-support":
      return "2SUP";
    case "blank":
      return "-";
    default:
      return "?";
  }
}

export function DiceTray({ event }: DiceTrayProps) {
  const attack = facesWithSlots(event?.attackFaces ?? []);
  const defense = facesWithSlots(event?.defenseFaces ?? []);

  return (
    <div className="panel dice-tray">
      <h3>Dice Tray</h3>
      {!event && <p className="muted">No rolls yet. Attack to populate the tray.</p>}

      {event && (
        <>
          <p className="dice-caption">
            Turn {event.turn}: {event.attackerName} vs {event.defenderName}
          </p>

          <div className="dice-row">
            <h4>Attack</h4>
            <div className="dice-grid">
              {attack.map((face, idx) => (
                <div key={`atk-${idx}`} className={`die ${face ? face.result : "empty"}`}>
                  {face ? faceLabel(face) : ""}
                </div>
              ))}
            </div>
          </div>

          <div className="dice-row">
            <h4>Defense</h4>
            <div className="dice-grid">
              {defense.map((face, idx) => (
                <div key={`def-${idx}`} className={`die ${face ? face.result : "empty"}`}>
                  {face ? faceLabel(face) : ""}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
