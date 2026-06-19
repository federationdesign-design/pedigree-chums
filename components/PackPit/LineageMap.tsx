"use client";

import { useMemo, useState } from "react";
import { getLineage, type LineageNode } from "../../data/lineage";
import styles from "./LineageMap.module.css";

type Node = LineageNode & {
  _id: string;
  _parent: Node | null;
  _leaves: number;
  _depth: number;
  _row: number;
  _x: number;
  _y: number;
};

const COLW = 220;
const ROWH = 92;
const PADX = 130;
const PADY = 80;
const ROOT = 66; // half-size of the dog card

function sumLeaves(n: LineageNode): number {
  const c = n.children || [];
  return c.length ? c.reduce((s, x) => s + sumLeaves(x), 0) : n.value ?? 0;
}
function radius(share: number) {
  return Math.max(26, 22 + Math.sqrt(share) * 4);
}

export default function LineageMap({
  breed,
  onClose,
}: {
  breed: { name: string; image: string };
  onClose: () => void;
}) {
  const root = useMemo(() => {
    const t = getLineage(breed.name);
    if (!t || !t.children || !t.children.length) return null;
    const r = JSON.parse(JSON.stringify(t)) as Node;
    const assign = (n: Node, id: string, parent: Node | null) => {
      n._id = id;
      n._parent = parent;
      n._leaves = sumLeaves(n);
      (n.children as Node[] | undefined)?.forEach((c, i) => assign(c, `${id}.${i}`, n));
    };
    assign(r, "0", null);
    return r;
  }, [breed.name]);

  // the open set holds the single line currently being followed (root..node)
  const [open, setOpen] = useState<Set<string>>(() => new Set(["0"]));

  const { shown, w, h } = useMemo(() => {
    if (!root) return { shown: [] as Node[], w: 600, h: 400 };
    let leaf = 0;
    const list: Node[] = [];
    const place = (n: Node, depth: number) => {
      n._depth = depth;
      list.push(n);
      const kids = open.has(n._id) && n.children && n.children.length ? (n.children as Node[]) : null;
      if (kids) {
        kids.forEach((k) => place(k, depth + 1));
        n._row = (kids[0]._row + kids[kids.length - 1]._row) / 2;
      } else {
        n._row = leaf++;
      }
    };
    place(root, 0);
    let maxD = 0;
    list.forEach((n) => (maxD = Math.max(maxD, n._depth)));
    list.forEach((n) => {
      n._x = PADX + n._depth * COLW;
      n._y = PADY + n._row * ROWH;
    });
    return {
      shown: list,
      w: PADX * 2 + maxD * COLW + 160,
      h: PADY * 2 + Math.max(1, leaf) * ROWH - ROWH + 40,
    };
  }, [root, open]);

  const follow = (n: Node) => {
    const s = new Set<string>();
    let c: Node | null = n;
    while (c) {
      s.add(c._id);
      c = c._parent;
    }
    setOpen(s);
  };

  const tagW = breed.name.length * 9.5 + 28;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        &times;
      </button>
      <div className={styles.scroll} onClick={(e) => e.stopPropagation()}>
        {root ? (
          <svg className={styles.svg} viewBox={`0 0 ${w} ${h}`} width={w} height={h} xmlns="http://www.w3.org/2000/svg">
            {shown
              .filter((n) => n._parent)
              .map((n) => {
                const p = n._parent as Node;
                const pr = !p._parent ? ROOT : radius(Math.round((p._leaves / (p._parent as Node)._leaves) * 100));
                const share = Math.round((n._leaves / p._leaves) * 100);
                const r = radius(share);
                const x1 = p._x + pr;
                const y1 = p._y;
                const x2 = n._x - r;
                const y2 = n._y;
                const mx = (x1 + x2) / 2;
                return (
                  <path
                    key={`e${n._id}`}
                    className={`${styles.edge} ${open.has(n._id) ? styles.lit : ""}`.trim()}
                    d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                  />
                );
              })}
            {shown.map((n) => {
              const isRoot = !n._parent;
              const hasKids = !!(n.children && n.children.length);
              const isOpen = open.has(n._id) && hasKids;
              if (isRoot) {
                const clip = `lm-clip-${n._id}`;
                return (
                  <g key={n._id} transform={`translate(${n._x},${n._y})`}>
                    <clipPath id={clip}>
                      <rect x={-ROOT} y={-ROOT} width={ROOT * 2} height={ROOT * 2} rx={22} />
                    </clipPath>
                    <rect x={-ROOT - 5} y={-ROOT - 5} width={ROOT * 2 + 10} height={ROOT * 2 + 10} rx={26} className={styles.rootCard} />
                    {breed.image ? (
                      <image
                        href={breed.image}
                        x={-ROOT}
                        y={-ROOT}
                        width={ROOT * 2}
                        height={ROOT * 2}
                        clipPath={`url(#${clip})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    ) : null}
                    <g transform={`translate(0,${ROOT + 30})`}>
                      <rect className={styles.tag} x={-tagW / 2} y={-16} width={tagW} height={32} rx={16} />
                      <text className={styles.tagText} textAnchor="middle" dominantBaseline="central">
                        {breed.name}
                      </text>
                    </g>
                  </g>
                );
              }
              const share = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
              const r = radius(share);
              return (
                <g
                  key={n._id}
                  className={styles.node}
                  transform={`translate(${n._x},${n._y})`}
                  onMouseEnter={() => follow(n)}
                  onClick={() => follow(n)}
                >
                  <circle className={`${styles.disc} ${hasKids && !isOpen ? styles.has : ""}`.trim()} r={r} />
                  <text className={styles.pct} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(13, r * 0.5)}>
                    {share}%
                  </text>
                  <text className={styles.nm} textAnchor="middle" y={-r - 9}>
                    {n.name}
                  </text>
                  {hasKids && !isOpen ? (
                    <text className={styles.plus} textAnchor="middle" y={r + 15}>
                      + {n.children!.length} inside
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className={styles.empty}>
            <strong>{breed.name}</strong>
            <span>We have not mapped this breed&apos;s ancestry yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
