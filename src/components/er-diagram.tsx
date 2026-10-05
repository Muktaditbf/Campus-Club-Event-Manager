// A hand-laid-out entity relationship diagram of campus_events_db.
// Arrows point from the foreign key to the table it references.

const W = 168;
const H = 46;
const COL = 200;
const ROW = 112;
const PAD = 16;

const NODES: Record<string, [col: number, row: number]> = {
  students: [0, 1],
  memberships: [1, 0],
  registrations: [1, 1],
  feedback: [1, 2],
  clubs: [2, 0],
  events: [2, 1],
  event_status_log: [2, 2],
  venues: [3, 0],
  event_sponsors: [3, 1],
  sponsors: [4, 1],
};

const EDGES: [from: string, to: string, dashed?: boolean][] = [
  ["memberships", "students"],
  ["memberships", "clubs"],
  ["registrations", "students"],
  ["registrations", "events"],
  ["feedback", "students"],
  ["feedback", "events"],
  ["events", "clubs"],
  ["events", "venues"],
  ["event_sponsors", "events"],
  ["event_sponsors", "sponsors"],
  ["event_status_log", "events", true],
];

const BRIDGES = new Set(["memberships", "registrations", "feedback", "event_sponsors"]);

function center(name: string) {
  const [c, r] = NODES[name]!;
  return { x: PAD + c * COL + W / 2, y: PAD + r * ROW + H / 2 };
}

/** Point where the line from a box centre towards (dx, dy) leaves the box. */
function edgePoint(x: number, y: number, dx: number, dy: number, gap = 0) {
  const t = Math.min((W / 2 + gap) / Math.abs(dx || 1e-9), (H / 2 + gap) / Math.abs(dy || 1e-9));
  return { x: x + dx * t, y: y + dy * t };
}

export function ErDiagram({ counts }: { counts: Record<string, number | null> }) {
  const width = PAD * 2 + 4 * COL + W;
  const height = PAD * 2 + 2 * ROW + H;

  return (
    <div className="scroll-thin overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block min-w-[680px] max-w-full" role="img" aria-label="Entity relationship diagram">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)" />
          </marker>
        </defs>

        {EDGES.map(([from, to, dashed]) => {
          const a = center(from);
          const b = center(to);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const start = edgePoint(a.x, a.y, dx, dy);
          const end = edgePoint(b.x, b.y, -dx, -dy, 3);
          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.55}
              strokeWidth={1.4}
              strokeDasharray={dashed ? "4 4" : undefined}
              markerEnd="url(#arrow)"
            />
          );
        })}

        {Object.entries(NODES).map(([name, [c, r]]) => {
          const x = PAD + c * COL;
          const y = PAD + r * ROW;
          const bridge = BRIDGES.has(name);
          return (
            <a key={name} href={`#table-${name}`}>
              <rect
                x={x}
                y={y}
                width={W}
                height={H}
                rx={10}
                fill={bridge ? "var(--subtle)" : "var(--card)"}
                stroke={bridge ? "var(--border)" : "var(--primary)"}
                strokeOpacity={bridge ? 1 : 0.45}
                strokeDasharray={bridge ? "3 3" : undefined}
              />
              <text x={x + 14} y={y + 20} fontSize={12.5} fontWeight={600} fill="var(--foreground)" fontFamily="var(--font-mono)">
                {name}
              </text>
              <text x={x + 14} y={y + 35} fontSize={10.5} fill="var(--muted-foreground)">
                {counts[name] ?? 0} rows{bridge ? " · bridge" : ""}
              </text>
            </a>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Solid boxes are entities, dashed boxes are bridge (M:N) tables. Arrows go from a foreign key to the table it references. The
        dashed arrow is filled by a trigger instead of a foreign key.
      </p>
    </div>
  );
}
