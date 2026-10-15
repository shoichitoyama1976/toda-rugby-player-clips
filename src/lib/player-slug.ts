const DIGRAPH: Record<string, string> = {
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
};

const KANA: Record<string, string> = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "o",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ぁ: "a",
  ぃ: "i",
  ぅ: "u",
  ぇ: "e",
  ぉ: "o",
};

function hiragana(value: string): string {
  return [...value].map((char) => {
    const code = char.charCodeAt(0);
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char;
  }).join("");
}

function geminate(next: string): string {
  if (next.startsWith("ch")) return "t";
  if (next.startsWith("sh")) return "s";
  if (next.startsWith("ts")) return "t";
  return next[0] ?? "";
}

export function kanaToRomaji(kana: string): string {
  const source = hiragana(kana);
  let index = 0;
  let out = "";
  while (index < source.length) {
    const pair = source.slice(index, index + 2);
    if (DIGRAPH[pair]) {
      out += DIGRAPH[pair];
      index += 2;
      continue;
    }
    const char = source[index];
    if (char === "っ") {
      const rest = kanaToRomaji(source.slice(index + 1));
      out += geminate(rest);
      index += 1;
      continue;
    }
    if (char === "ー" || char === " " || char === "・") {
      index += 1;
      continue;
    }
    out += KANA[char] ?? "";
    index += 1;
  }
  return out.replaceAll("ou", "o").replaceAll("uu", "u").replaceAll("oo", "o");
}

function compact(value: string): string {
  return value.replace(/[\s・]+/g, "");
}

function reading(name: string, kana: string): string {
  if (compact(name) === "堀川太一") return "ほりかわ たいち";
  if (compact(name) === "沢村舜" && compact(kana) === "うえかたふうま") return "さわむら しゅん";
  return kana;
}

function latinParts(name: string): { family: string; given: string } | null {
  const words = name
    .replace(/[・.]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2) return null;
  if (!words.every((word) => /^[A-Za-z][A-Za-z'-]*$/.test(word))) return null;
  const family = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
  const given = words
    .slice(0, -1)
    .map((word) => word.toLowerCase().replace(/[^a-z]/g, ""))
    .filter(Boolean)
    .join("-");
  if (!family || !given) return null;
  return { family, given };
}

function latinSlug(name: string): string | null {
  const parts = latinParts(name);
  if (!parts) return null;
  return `${parts.given}-${parts.family}`;
}

export function legacyLatinSlug(name: string): string | null {
  const parts = latinParts(name);
  if (!parts) return null;
  return `${parts.family}-${parts.given}`;
}

export function personSlug(name: string, kana: string): string | null {
  const fromLatin = latinSlug(name);
  if (fromLatin) return fromLatin;
  const parts = reading(name, kana)
    .replace(/・/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 2) return null;
  const family = kanaToRomaji(parts[0]);
  const given = parts.slice(1).map((part) => kanaToRomaji(part)).filter(Boolean).join("-");
  if (!family || !given) return null;
  return `${family}-${given}`;
}
