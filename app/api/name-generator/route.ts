import { NextResponse } from "next/server";

const TITLE_RULES = `
Title assignment rules (follow strictly):
- Breed name contains "Terrier" OR breed is "Miniature Schnauzer": use Mr or Miss ONLY
- Spaniel breeds (Cocker, Springer, Clumber, Field, Sussex, Welsh Springer, Cavalier King Charles): Field Marshal, General, Admiral, Brigadier
- Retrievers, Labrador, Golden Retriever, Flat-Coated Retriever: Colonel, Major, Captain, Commander
- German Shepherd, Doberman Pinscher, Rottweiler, Weimaraner: Colonel, Major, Captain
- Border Collie, Rough Collie: Lieutenant, Second Lieutenant, or Professor
- Staffordshire Bull Terrier, Boxer, Bull Terrier, Bulldog: Sergeant, Corporal, Lance Corporal
- Basset Hound, Bloodhound, Beagle: Inspector, Chief Inspector, Superintendent, Commissioner, Judge
- Greyhound, Afghan Hound, Borzoi, Saluki, Irish Wolfhound, Lurcher, Whippet, Italian Greyhound: Duke, Duchess, Earl, Countess, Lord, Lady, Sir, Dame
- Great Dane, Mastiff, Saint Bernard, Newfoundland, Leonberger, Irish Wolfhound: The Great, The Magnificent, The Formidable, The Legendary, The Unstoppable
- Poodle: Professor or Doctor
- Cavalier King Charles Spaniel, Shih Tzu, Pomeranian, Papillon, Maltese, Bichon Frise: Reverend, Dean, Bishop, Archdeacon
- Dachshund, Pug, Siberian Husky, Chihuahua, Corgi: The Notorious, The Incomparable, The Inimitable, The Illustrious
- Dalmatian, Old English Sheepdog, Bernese Mountain Dog: Viscount, Viscountess, Baron, Baroness, The Right Honourable
- All crossbreeds and doodles: pick most fitting from above based on dominant breed character
- All other breeds: pick the most fitting title based on breed character`;

const DAILY_LIMIT = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + dayMs });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - entry.count };
}

function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "You have reached the daily limit of 10 name generations. Please try again tomorrow." },
        { status: 429 }
      );
    }

    const { breed, surname, gender } = await req.json();

    if (!breed || !surname || !gender) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `You are a brilliantly funny British dog name creator for Pedigree Chums, a British dog breed card game. Names must feel like a Victorian dog show catalogue crossed with a Blackadder episode.

Breed: ${breed}
Owner surname: ${surname}
Gender: ${gender}

${TITLE_RULES}

NAME STRUCTURE for each of the 3 names:
1. Title (per rules above)
2. First name: proper given name suited to breed heritage. German breeds get Germanic names, French breeds get French names, Italian breeds get Italian names. Slightly pompous, period-appropriate. Suit the gender.
3. Double-barrelled surname: one dog word hyphenated with the owner surname "${surname}". Dog words to choose from: Bark, Woof, Paw, Snout, Tail, Fetch, Growl, Ruff, Howl, Biscuit, Bone, Lead, Chase, Sniff, Puddle, Waggle, Scoff, Trot, Drool, Snuffle, Gnaw. Must sound like British landed gentry. Alliteration between first name and the dog word is strongly encouraged.
4. Nickname: blend the BREED NAME with the FIRST NAME into a portmanteau. Must pass the could-be-real test -- pronounceable on first reading, original name audible inside, breed name hidden not bolted on. Examples: Spaniel+Angelo=Spangelo, Basset+Basil=Bassel, Beagle+Nigel=Beagel, Whippet+Philip=Philippet. Use empty string if no convincing blend exists.
5. Reasoning: 1-2 funny sentences explaining why this name suits this breed. Reference real breed history, character or physical traits.

Generate exactly 3 names, each with a different title and different comic angle.
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{"names":[{"full":"","nickname":"","reasoning":""},{"full":"","nickname":"","reasoning":""},{"full":"","nickname":"","reasoning":""}]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await response.json();
    const text = (data.content || []).map((i: { text?: string }) => i.text || "").join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 });

    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ ...parsed, remaining });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
