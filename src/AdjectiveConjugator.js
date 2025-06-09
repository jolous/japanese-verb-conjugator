import React, { useState, useEffect } from 'react';
import kuromoji from 'kuromoji';
import './App.css';

// Utility functions
function containsKanji(text) {
  return /[一-龯]/.test(text);
}

function convertKatakanaToHiragana(text) {
  return text.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// Component to display blurred text that reveals on click
function BlurredText({ children }) {
  const [blurred, setBlurred] = useState(true);
  return (
    <span
      className={blurred ? "blurred" : ""}
      onClick={() => setBlurred(false)}
    >
      {children}
    </span>
  );
}

// LoadingSpinner Component
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="loader"></div>
      <p>Loading...</p>
    </div>
  );
}

function AdjectiveConjugator() {
  const [adjective, setAdjective] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [adjectives, setAdjectives] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);

  // Load kuromoji tokenizer once on mount
  useEffect(() => {
    kuromoji
      .builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" })
      .build((err, tk) => {
        if (err) {
          console.error("Kuromoji build error:", err);
          return;
        }
        setTokenizer(tk);
      });
  }, []);

  // Fetch adjectives data from the JSON file in the public folder
  useEffect(() => {
    fetch('/adjectives.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch adjectives data');
        }
        return response.json();
      })
      .then(data => {
        setAdjectives(data.adjectives);
      })
      .catch(error => {
        console.error("Error fetching adjectives:", error);
      });
  }, []);

  // Helper to add furigana
  const addFurigana = (text) => {
    if (!tokenizer || typeof text !== "string") return text;
    const tokens = tokenizer.tokenize(text);
    return tokens.map((token, index) => {
      if (
        containsKanji(token.surface_form) &&
        token.reading &&
        token.reading !== "*"
      ) {
        const hiragana = convertKatakanaToHiragana(token.reading);
        return (
          <ruby key={index}>
            {token.surface_form}
            <rt>{hiragana}</rt>
          </ruby>
        );
      }
      return token.surface_form;
    });
  };

  // Filter adjectives based on selected category
  const filteredAdjectives =
    selectedCategory === "all"
      ? adjectives
      : adjectives.filter(item => item.category === selectedCategory);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adjective.trim()) return;
    await conjugateAdjective(adjective.trim());
  };

  const handleAdjectiveClick = async (item) => {
    const { adjective, category } = item;
    setAdjective(adjective);
    await conjugateAdjective(adjective, category);
  };

  // Replace with your actual OpenAI API key
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

  // Calls the ChatGPT API to fetch adjective conjugation data
  const conjugateAdjective = async (inputAdjective, inputCategory = "") => {
    setLoading(true);
    setError("");
    setResult(null);

    const prompt = `
Please provide a Japanese adjective conjugation table for the adjective "${inputAdjective}".
${inputCategory ? `It belongs to the "${inputCategory}" category.` : ""}
Include the main meaning of the adjective.
Include the following conjugation forms:
- Base Form
- Negative Form
- Past Form
- Past Negative Form
- Adverbial Form
Additionally, provide example sentences for each form at a JLPT N5 level.
For each conjugation, output an example sentence in English and two Japanese translations—one in polite form and one in plain form—in hiragana only (no kanji).
Output a JSON object with the following structure (and no additional text):

{
  "title": "<Adjective> Conjugation Table",
  "type": "i-adjective or na-adjective",
  "meaning": "Meaning of the adjective",
  "conjugations": [
    { "conjugation": "Base Form", "polite": "...", "plain": "..." },
    { "conjugation": "Negative", "polite": "...", "plain": "..." },
    { "conjugation": "Past", "polite": "...", "plain": "..." },
    { "conjugation": "Past Negative", "polite": "...", "plain": "..." },
    { "conjugation": "Adverbial", "polite": "...", "plain": "..." }
  ],
  "examples": [
    {
      "tense": "Positive",
      "english": "English example sentence",
      "japanese_polite": "japanese polite translation",
      "japanese_plain": "japanese plain translation"
    },
    {
      "tense": "Negative",
      "english": "English example sentence",
      "japanese_polite": "japanese polite translation",
      "japanese_plain": "japanese plain translation"
    },
    {
      "tense": "Past",
      "english": "English example sentence",
      "japanese_polite": "japanese polite translation",
      "japanese_plain": "japanese plain translation"
    },
    {
      "tense": "Past Negative",
      "english": "English example sentence",
      "japanese_polite": "japanese polite translation",
      "japanese_plain": "japanese plain translation"
    },
    {
      "tense": "Adverbial",
      "english": "English example sentence using adverbial form",
      "japanese_polite": "japanese polite translation using adverbial form",
      "japanese_plain": "japanese plain translation using adverbial form"
    }
  ]
}
    `.trim();

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + OPENAI_API_KEY,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: prompt,
          }],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error("OpenAI API error: " + response.statusText);
      }

      const resultData = await response.json();
      const messageContent = resultData.choices[0].message.content;
      let conjugationData;
      try {
        conjugationData = JSON.parse(messageContent);
      } catch (err) {
        console.error("Failed to parse API response:", messageContent);
        throw new Error("Failed to parse API response as JSON.");
      }
      setResult(conjugationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="sidebar">
        <h3>Adjective List</h3>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="i-adjective">i-adjective</option>
          <option value="na-adjective">na-adjective</option>
        </select>
        <ul>
          {filteredAdjectives.map(item => (
            <li 
              key={item.id} 
              className={item.category.replace(" ", "").toLowerCase()}
              onClick={() => handleAdjectiveClick(item)}
            >
              {addFurigana(item.adjective)}
            </li>
          ))}
        </ul>
      </div>
      <div className="content">
        <h1>Japanese Adjective Conjugator</h1>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Enter a Japanese adjective" 
            value={adjective} 
            onChange={(e) => setAdjective(e.target.value)}
            required 
          />
          <button type="submit">Conjugate</button>
        </form>
        {loading && <LoadingSpinner />}
        {error && <div className="error">Error: {error}</div>}
        {/* Display the image placeholder if there's no result, error, or loading */}
        {!result && !loading && !error && (
          <div className="placeholder">
            <img src="/assets/main.webp" alt="Main Visual" />
          </div>
        )}
        {result && (
          <div>
            <h2>
              {addFurigana(result.title.replace(" Conjugation Table", ""))}
              {result.type && <span className="group-badge">{result.type}</span>}
            </h2>
            {result.meaning && (
              <p>
                <strong>Meaning:</strong>{" "}
                <BlurredText>{addFurigana(result.meaning)}</BlurredText>
              </p>
            )}
            <h3>Conjugation Table</h3>
            <table>
              <thead>
                <tr>
                  <th>Conjugation</th>
                  <th>Polite Form</th>
                  <th>Plain Form</th>
                </tr>
              </thead>
              <tbody>
                {result.conjugations.map((row, index) => (
                  <tr key={index}>
                    <td>{row.conjugation}</td>
                    <td>
                      <BlurredText>{addFurigana(row.polite)}</BlurredText>
                    </td>
                    <td>
                      <BlurredText>{addFurigana(row.plain)}</BlurredText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.examples && Array.isArray(result.examples) && (
              <>
                <h3>Example Sentences</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Tense</th>
                      <th>English</th>
                      <th>Japanese (Polite)</th>
                      <th>Japanese (Plain)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.examples.map((ex, idx) => (
                      <tr key={idx}>
                        <td>{ex.tense}</td>
                        <td>{ex.english}</td>
                        <td>
                          <BlurredText>{addFurigana(ex.japanese_polite)}</BlurredText>
                        </td>
                        <td>
                          <BlurredText>{addFurigana(ex.japanese_plain)}</BlurredText>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdjectiveConjugator;
