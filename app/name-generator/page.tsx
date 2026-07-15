"use client";
import { useState } from "react";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";

const PACK_BREEDS = [
  "Afghan Hound","Basset Hound","Beagle","Bichon Frise","Bloodhound",
  "Border Collie","Border Terrier","Boston Terrier","Boxer","Bull Terrier",
  "Bulldog","Cavalier King Charles Spaniel","Cavachon","Cavapoo","Chihuahua",
  "Cocker Spaniel","Cockapoo","Corgi","Dachshund","Dalmatian",
  "Doberman Pinscher","French Bulldog","German Shepherd","Golden Retriever",
  "Goldendoodle","Great Dane","Greyhound","Irish Setter","Irish Wolfhound",
  "Italian Greyhound","Jack Russell Terrier","Jackapoo","Labrador","Labradoodle",
  "Lurcher","Maltese","Maltipoo","Mastiff","Miniature Schnauzer",
  "Old English Sheepdog","Papillon","Pomeranian","Poodle","Pug","Rottweiler",
  "Rough Collie","Saint Bernard","Shih Tzu","Siberian Husky","Springer Spaniel",
  "Staffordshire Bull Terrier","Weimaraner","West Highland Terrier","Whippet",
  "Yorkshire Terrier",
];

const OTHER_BREEDS = [
  "Airedale Terrier","Akita","Alaskan Malamute","Bedlington Terrier",
  "Bernese Mountain Dog","Borzoi","Cairn Terrier","Chesapeake Bay Retriever",
  "Chow Chow","Clumber Spaniel","Deerhound","English Setter","Field Spaniel",
  "Flat-Coated Retriever","Fox Terrier","Gordon Setter","Havanese",
  "Hungarian Vizsla","Leonberger","Lhasa Apso","Newfoundland","Norfolk Terrier",
  "Pointer","Rhodesian Ridgeback","Saluki","Samoyed","Scottish Terrier",
  "Shar Pei","Shiba Inu","Soft Coated Wheaten Terrier","Sussex Spaniel",
  "Tibetan Mastiff","Welsh Springer Spaniel","Welsh Terrier",
];

type NameResult = { full: string; nickname: string; reasoning: string };

export default function NameGeneratorPage() {
  const [breed, setBreed] = useState("");
  const [surname, setSurname] = useState("");
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NameResult[] | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!breed) { alert("Please select a breed"); return; }
    if (!surname.trim()) { alert("Please enter your surname"); return; }
    setLoading(true);
    setResults(null);
    setError("");
    try {
      const res = await fetch("/api/name-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breed, surname: surname.trim(), gender }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.names);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "clamp(60px,10vw,120px) clamp(16px,5vw,48px) 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          <h1 className="display" style={{ textAlign: "center", marginBottom: 8 }}>
            Chum <span className="display-yellow">Name</span> Generator
          </h1>
          <p style={{ textAlign: "center", color: "var(--navy)", fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 600, marginBottom: 40 }}>
            Give your dog the title they truly deserve
          </p>

          <div style={{ background: "var(--navy)", borderRadius: 20, padding: "clamp(20px,4vw,36px)", marginBottom: 24 }}>

            <label style={{ display: "block", color: "var(--yellow)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-body)" }}>
              Your dog&apos;s breed
            </label>
            <select
              value={breed}
              onChange={e => setBreed(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "0.95rem", marginBottom: 20, outline: "none", boxSizing: "border-box" }}
            >
              <option value="">-- Select a breed --</option>
              <optgroup label="Pedigree Chums Pack Breeds">
                {PACK_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </optgroup>
              <optgroup label="Other Breeds">
                {OTHER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </optgroup>
            </select>

            <label style={{ display: "block", color: "var(--yellow)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-body)" }}>
              Your surname
            </label>
            <input
              type="text"
              value={surname}
              onChange={e => setSurname(e.target.value)}
              placeholder="e.g. Jones, Clarke, Thompson-Alexander..."
              maxLength={60}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "0.95rem", marginBottom: 20, outline: "none", boxSizing: "border-box" }}
            />

            <label style={{ display: "block", color: "var(--yellow)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "var(--font-body)" }}>
              Boy or girl?
            </label>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {(["boy", "girl"] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${gender === g ? "var(--yellow)" : "rgba(255,255,255,0.15)"}`, background: gender === g ? "var(--yellow)" : "rgba(255,255,255,0.08)", color: gender === g ? "var(--navy)" : "#fff", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}
                >
                  {g === "boy" ? "Boy" : "Girl"}
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="display"
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "var(--yellow)", color: "var(--navy)", fontSize: "1.3rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 0 rgba(10,58,87,0.4)", letterSpacing: "0.04em" }}
            >
              {loading ? "Consulting the peerage..." : "Find my chum's name"}
            </button>
          </div>

          {error && (
            <div style={{ background: "#fee", border: "2px solid #c44", borderRadius: 14, padding: 16, color: "#900", fontFamily: "var(--font-body)", fontSize: "0.9rem", marginBottom: 16 }}>
              {error}
            </div>
          )}

          {results && results.map((n, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "clamp(16px,3vw,28px)", marginBottom: 16, borderTop: "5px solid var(--yellow)", boxShadow: "0 2px 16px rgba(10,58,87,0.08)" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--blue-sky)", marginBottom: 8, fontFamily: "var(--font-body)" }}>
                Option {i + 1}
              </div>
              <div className="display" style={{ fontSize: "clamp(1.2rem,3vw,1.7rem)", color: "var(--navy)", marginBottom: 4, lineHeight: 1.2 }}>
                {n.full}
              </div>
              {n.nickname && (
                <div style={{ fontSize: "0.85rem", color: "var(--blue-deep)", fontStyle: "italic", marginBottom: 14, fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  Known to friends as: {n.nickname}
                </div>
              )}
              <div style={{ fontSize: "0.85rem", color: "#444", lineHeight: 1.65, borderTop: "1px solid #eee", paddingTop: 14, fontFamily: "var(--font-body)" }}>
                {n.reasoning}
              </div>
            </div>
          ))}

          {results && (
            <button
              onClick={generate}
              disabled={loading}
              className="display"
              style={{ width: "100%", padding: "15px", borderRadius: 14, border: "3px solid var(--navy)", background: "transparent", color: "var(--navy)", fontSize: "1.2rem", cursor: "pointer", letterSpacing: "0.04em", marginTop: 8 }}
            >
              Try again
            </button>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
