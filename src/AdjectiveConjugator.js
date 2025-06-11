import React, { useState, useEffect } from 'react';
import kuromoji from 'kuromoji';
import './App.css';
import { containsKanji, convertKatakanaToHiragana, BlurredText, LoadingSpinner } from './utils/helpers';

function AdjectiveConjugator() {
  const [adjective, setAdjective] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [adjectives, setAdjectives] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);
  const [conjugationLibrary, setConjugationLibrary] = useState({});

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

  useEffect(() => {
    fetch('/adjective_conjugations.json')
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to fetch conjugation data");
        }
        return response.json();
      })
      .then(data => {
        setConjugationLibrary(data);
      })
      .catch(error => {
        console.error("Error fetching conjugation data:", error);
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


  const conjugateAdjective = async (inputAdjective) => {
    setLoading(true);
    setError("");
    setResult(null);

    if (conjugationLibrary && conjugationLibrary[inputAdjective]) {
      const data = conjugationLibrary[inputAdjective];
      let processed = data;
      if (data.examples && !Array.isArray(data.examples)) {
        const randomExamples = Object.entries(data.examples).map(([tense, arr]) => {
          const ex = arr[Math.floor(Math.random() * arr.length)];
          return { tense, ...ex };
        });
        processed = { ...data, examples: randomExamples };
      }
      setResult(processed);
      setLoading(false);
      return;
    }

    setError("No conjugation data found for the specified adjective.");
    setLoading(false);
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
                      <BlurredText searchTerm={row.polite}>
                        {addFurigana(row.polite)}
                      </BlurredText>
                    </td>
                    <td>
                      <BlurredText searchTerm={row.plain}>
                        {addFurigana(row.plain)}
                      </BlurredText>
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
                          <BlurredText searchTerm={ex.japanese_polite}>
                            {addFurigana(ex.japanese_polite)}
                          </BlurredText>
                        </td>
                        <td>
                          <BlurredText searchTerm={ex.japanese_plain}>
                            {addFurigana(ex.japanese_plain)}
                          </BlurredText>
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
