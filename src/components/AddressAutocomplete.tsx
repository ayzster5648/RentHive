"use client";

import { useState, useEffect, useRef } from "react";
import { Icons } from "@/components/icons";

type Suggestion = {
  display_name: string;
  address: Record<string, string>;
};

/**
 * Street address field with real address suggestions (OpenStreetMap / Nominatim,
 * no API key). Selecting a suggestion fills the city / state / zip / country
 * inputs it also renders.
 */
export function AddressAutocomplete({
  defaults = {},
}: {
  defaults?: { address?: string; city?: string; state?: string; zip?: string; country?: string };
}) {
  const [query, setQuery] = useState(defaults.address ?? "");
  const [city, setCity] = useState(defaults.city ?? "");
  const [state, setState] = useState(defaults.state ?? "");
  const [zip, setZip] = useState(defaults.zip ?? "");
  const [country, setCountry] = useState(defaults.country ?? "United States");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (picked || query.trim().length < 4) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`, { headers: { "Accept-Language": "en" } });
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, picked]);

  function choose(s: Suggestion) {
    const a = s.address;
    const houseNo = a.house_number ?? "";
    const road = a.road ?? a.pedestrian ?? a.neighbourhood ?? "";
    setQuery([houseNo, road].filter(Boolean).join(" ") || s.display_name.split(",")[0]);
    setCity(a.city ?? a.town ?? a.village ?? a.hamlet ?? a.county ?? "");
    setState(a.state ?? a.region ?? "");
    setZip(a.postcode ?? "");
    setCountry(a.country ?? "United States");
    setPicked(true);
    setOpen(false);
  }

  return (
    <>
      <div className="relative sm:col-span-2" ref={boxRef}>
        <label className="label">Street address <span className="text-red-500">*</span></label>
        <input
          name="address"
          className="input"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPicked(false); }}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder="Start typing an address…"
          autoComplete="off"
          required
        />
        {open && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <button key={i} type="button" onClick={() => choose(s)} className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50">
                {Icons.home({ className: "mt-0.5 h-4 w-4 shrink-0 text-brand-500" })}
                <span className="text-gray-700">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">City <span className="text-red-500">*</span></label>
        <input name="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
      </div>
      <div>
        <label className="label">State/Region <span className="text-red-500">*</span></label>
        <input name="state" className="input" value={state} onChange={(e) => setState(e.target.value)} required />
      </div>
      <div>
        <label className="label">Zip <span className="text-red-500">*</span></label>
        <input name="zip" className="input" value={zip} onChange={(e) => setZip(e.target.value)} required />
      </div>
      <div>
        <label className="label">Country <span className="text-red-500">*</span></label>
        <input name="country" className="input" value={country} onChange={(e) => setCountry(e.target.value)} required />
      </div>
    </>
  );
}
