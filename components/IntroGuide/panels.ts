/* THE HOW TO PLAY PANELS, the first-time overlay on a chum's intro video (owner,
   J18-323, 1 October 2026). Signed off as the clickable mock-up of the same day:
   ten panels, each a small diagram drawn as an SVG string, a title and one line.
   The strings are our own fixed markup, never user text. Text in the diagrams
   takes the display font from the panel's CSS. */

export type Panel = { title: string; text: string; art: string; run?: (svg: SVGSVGElement) => () => void };

const NAVY="#0a3a57", YEL="#ffed00", GRN="#22c55e", RED="#ef4444", W="#ffffff";
const dog=(x: number, y: number, r: number, fill?: string) =>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(fill||W)+'" stroke="'+NAVY+'" stroke-width="3"/>';
const finger=(x: number, y: number, cls?: string) =>'<g class="'+(cls||"")+'"><circle cx="'+x+'" cy="'+y+'" r="13" fill="'+YEL+'" stroke="'+NAVY+'" stroke-width="3"/><circle cx="'+x+'" cy="'+y+'" r="4" fill="'+NAVY+'"/></g>';

const sq=(x: number, y: number, s: number, fill: string, label?: string) =>'<rect x="'+x+'" y="'+y+'" width="'+s+'" height="'+s+'" rx="'+(s*0.22)+'" fill="'+fill+'" stroke="'+NAVY+'" stroke-width="3"/>'+(label?'<text x="'+(x+s/2)+'" y="'+(y+s/2+7)+'" text-anchor="middle" font-size="'+(s*0.36)+'" fill="'+NAVY+'">'+label+'</text>':'');
const card=(x: number, y: number, fill?: string) =>'<rect x="'+x+'" y="'+y+'" width="40" height="52" rx="8" fill="'+(fill||W)+'" stroke="'+NAVY+'" stroke-width="3"/>';
const frame=(x: number, y: number, filled: boolean) =>'<rect x="'+x+'" y="'+y+'" width="44" height="44" rx="10" fill="'+(filled?YEL:"rgba(255,255,255,.35)")+'" stroke="'+NAVY+'" stroke-width="3" stroke-dasharray="'+(filled?"0":"6 5")+'"/>';


/* Panel 1 draws its pit filling one circle at a time, then counts 10, 9, 8, and
   repeats. Driven from script so the count starts when the last circle lands.
   Returns its own clean-up. */
const DROPS: [number, number, number, string][] = [[68,141,18,W],[104,142,17,YEL],[140,141,18,W],[176,142,17,W],[86,108,17,W],[122,107,18,YEL],[158,108,17,W],[104,74,17,W],[140,74,16,W]];
function runPitFill(svg: SVGSVGElement): () => void {
  const drops = Array.from(svg.querySelectorAll<SVGGElement>(".drop"));
  const cd = svg.querySelector<SVGTextElement>("#cd");
  const ts: number[] = [];
  const cycle = () => {
    drops.forEach((d) => { d.style.transition = "none"; d.style.transform = "translateY(-190px)"; d.style.opacity = "0"; });
    cd?.setAttribute("opacity", "0");
    drops.forEach((d, k) => {
      ts.push(window.setTimeout(() => {
        d.style.transition = "transform .45s cubic-bezier(.5,0,.8,1.2), opacity .1s";
        d.style.transform = "translateY(0)";
        d.style.opacity = "1";
      }, 300 + k * 320));
    });
    const t0 = 300 + drops.length * 320 + 300;
    [10, 9, 8].forEach((n, k) => {
      ts.push(window.setTimeout(() => { if (cd) { cd.textContent = String(n); cd.setAttribute("opacity", "1"); } }, t0 + k * 1000));
    });
    ts.push(window.setTimeout(cycle, t0 + 3400));
  };
  cycle();
  return () => ts.forEach((t) => window.clearTimeout(t));
}

export const PANELS: Panel[] = [
 { title:"Clear the pit before time runs out", text:"When the pit is full, the countdown starts. Clear the pit before the time runs out to win the level. Explode extinction bombs to add more time.",
  art:'<svg viewBox="0 0 300 180"><path d="M40 30 V160 H200 V30" fill="none" stroke="'+NAVY+'" stroke-width="5" stroke-linecap="round"/>'+
      DROPS.map((c) => '<g class="drop">'+dog(c[0],c[1],c[2],c[3])+'</g>').join("")+
      '<text id="cd" x="250" y="76" text-anchor="middle" font-size="40" fill="'+W+'" stroke="'+NAVY+'" stroke-width="2" opacity="0">10</text>'+
      '<image href="/bomb.svg" x="230" y="96" width="38" height="40"/><text x="249" y="158" text-anchor="middle" font-size="16" fill="'+NAVY+'">+10s</text></svg>',
  run: runPitFill },
 { title:"How to clear the pit", text:"Tap a dog circle to discover the ancestor and collect it. Each collected ancestor is removed from the pit.",
  art:'<svg viewBox="0 0 300 180"><rect class="a-dim" x="0" y="0" width="300" height="180" fill="'+NAVY+'"/><path d="M40 50 V160 H260 V50" fill="none" stroke="'+NAVY+'" stroke-width="5" stroke-linecap="round"/>'+
      dog(100,140,20)+dog(200,140,20)+
      '<g class="a-lift"><g class="a-flip"><g class="face-a">'+dog(150,140,20)+'</g>'+
      '<g class="face-b">'+dog(150,140,20,YEL)+'<text x="150" y="148" text-anchor="middle" font-size="20" fill="'+NAVY+'">?</text></g></g></g>'+
      '<g class="a-tapfade">'+finger(162,152,"")+'</g></svg>'},
 { title:"Chain the ancestor dogs", text:"Draw a line through dog circles from the same family to chain them and lift them together. This is the key to quickly clearing several of the same ancestor.",
  art:'<svg viewBox="0 0 300 180">'+dog(60,120,22)+dog(130,80,22)+dog(200,118,22)+dog(258,70,20)+
      '<path class="a-draw" d="M60 120 L130 80 L200 118 L258 70" fill="none" stroke="'+RED+'" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/></svg>'},
 { title:"Explore the ancestor dog", text:"Explore the selected ancestor dog's family tree to learn and earn points.",
  art:'<svg viewBox="0 0 300 180"><path d="M64 90 C110 90 110 46 150 46 M64 90 C110 90 110 134 150 134 M150 46 C190 46 196 26 232 26 M150 46 C190 46 196 66 232 66 M150 134 C190 134 196 114 232 114 M150 134 C190 134 196 154 232 154" fill="none" stroke="'+NAVY+'" stroke-width="4"/>'+
      dog(64,90,28,YEL)+dog(150,46,20)+dog(150,134,20)+dog(232,26,13)+dog(232,66,13)+dog(232,114,13)+dog(232,154,13)+'</svg>'},
 { title:"Complete the dog by framing its ancestors", text:"Drag each ancestor picture into its matching frame, or use the auto button.",
  art:'<svg viewBox="0 0 300 180">'+frame(60,40,false)+frame(128,40,false)+frame(196,40,false)+
      '<g class="a-place">'+sq(128,118,44,YEL)+finger(158,150,"")+'</g></svg>'},
 { title:"Running short of time? Press auto", text:"Press the auto button in the bottom right to finish the tree and place the dog ancestors for you.",
  art:'<svg viewBox="0 0 300 180">'+frame(40,36,false)+frame(104,36,false)+frame(168,36,false)+
      '<rect class="a-fill1" x="40" y="36" width="44" height="44" rx="10" fill="'+YEL+'" stroke="'+NAVY+'" stroke-width="3"/>'+
      '<rect class="a-fill2" x="104" y="36" width="44" height="44" rx="10" fill="'+YEL+'" stroke="'+NAVY+'" stroke-width="3"/>'+
      '<rect class="a-fill3" x="168" y="36" width="44" height="44" rx="10" fill="'+YEL+'" stroke="'+NAVY+'" stroke-width="3"/>'+
      sq(210,108,58,YEL,"Auto")+'<g class="a-press">'+finger(256,150,"")+'</g></svg>'},
 { title:"Collect chums", text:"Collect cards by double tapping a card, or by looping more than two cards together by drawing a line through them.",
  art:'<svg viewBox="0 0 300 180">'+card(62,96)+card(130,56,YEL)+card(198,96)+
      '<path class="a-draw" d="M82 122 L150 82 L218 122 Z" fill="none" stroke="'+RED+'" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>'+
      '<g class="a-pop"><rect x="214" y="22" width="72" height="38" rx="19" fill="'+GRN+'" stroke="'+NAVY+'" stroke-width="3"/><text x="250" y="49" text-anchor="middle" font-size="20" fill="'+W+'">x1.3</text></g></svg>'},
 { title:"There is a learn area", text:"Tap the brain to open the learn area and discover every ancestor dog and the chums each one is related to.",
  art:'<svg viewBox="0 0 300 180"><rect x="118" y="46" width="64" height="64" rx="14" fill="'+YEL+'" stroke="'+NAVY+'" stroke-width="4"/><image href="/temperament-icon.svg" x="128" y="56" width="44" height="44"/>'+finger(176,104,"a-tap")+'</svg>'},
 { title:"Collections in the learn area affect the level", text:"Any chums collected in the learn area will not fall into the pit, saving you precious space.",
  art:'<svg viewBox="0 0 300 180"><rect x="14" y="128" width="40" height="40" rx="10" fill="rgba(255,255,255,.35)" stroke="'+NAVY+'" stroke-width="3" stroke-dasharray="6 5"/>'+
      '<g class="a-fly"><rect x="122" y="40" width="56" height="76" rx="10" fill="'+YEL+'" stroke="'+NAVY+'" stroke-width="3"/></g>'+
      '<g class="a-tapfade">'+finger(166,96,"")+'</g></svg>'},
 { title:"Trivia bonus", text:"Answer the dog trivia questions for bonus points.",
  art:'<svg viewBox="0 0 300 180"><rect x="40" y="28" width="220" height="56" rx="16" fill="'+W+'" stroke="'+NAVY+'" stroke-width="3"/><text x="150" y="65" text-anchor="middle" font-size="22" fill="'+NAVY+'">Which dog...?</text>'+
      '<rect x="40" y="100" width="100" height="44" rx="14" fill="'+GRN+'" stroke="'+NAVY+'" stroke-width="3"/><rect x="160" y="100" width="100" height="44" rx="14" fill="'+W+'" stroke="'+NAVY+'" stroke-width="3"/>'+
      '<g class="a-pop"><rect x="202" y="8" width="84" height="34" rx="17" fill="'+YEL+'" stroke="'+NAVY+'" stroke-width="3"/><text x="244" y="32" text-anchor="middle" font-size="18" fill="'+NAVY+'">+bonus</text></g></svg>'}
];
