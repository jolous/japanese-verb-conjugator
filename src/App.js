import React, { useState, useEffect } from 'react';
import kuromoji from 'kuromoji';
import './App.css';
import AdjectiveConjugator from './AdjectiveConjugator';

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
    <span className={blurred ? "blurred" : ""} onClick={() => setBlurred(false)}>
      {children}
    </span>
  );
}

// Modal component for showing the rules table
function RulesModal({ onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3 className="highlight">
          How to conjugate Japanese verbs into ta-form and te-form.
        </h3>
        <table>
          <thead>
            <tr>
              <th>Ending</th>
              <th>Ta-form</th>
              <th>Te-form</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>う・つ・る</td>
              <td>った</td>
              <td>って</td>
            </tr>
            <tr>
              <td>む・ぬ・ぶ</td>
              <td>んだ</td>
              <td>んで</td>
            </tr>
            <tr>
              <td>く</td>
              <td>いた</td>
              <td>いて</td>
            </tr>
            <tr>
              <td>ぐ</td>
              <td>いだ</td>
              <td>いで</td>
            </tr>
            <tr>
              <td>す</td>
              <td>した</td>
              <td>して</td>
            </tr>
          </tbody>
        </table>
        <p className="exception">*Exception: いく → いった</p>
      </div>
    </div>
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

// Extracted Verb Conjugator component
function VerbConjugator() {
  const [verb, setVerb] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [verbs, setVerbs] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);
  const [showRules, setShowRules] = useState(false);

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

  // Fetch verbs data from the JSON file in the public folder
  useEffect(() => {
    fetch('/verbs.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch verbs data');
        }
        return response.json();
      })
      .then(data => {
        setVerbs(data.verbs);
      })
      .catch(error => {
        console.error("Error fetching verbs:", error);
      });
  }, []);

  // Helper that uses kuromoji to add furigana to any Japanese text
  const addFurigana = (text) => {
    if (!tokenizer || typeof text !== "string") return text;
    const tokens = tokenizer.tokenize(text);
    return tokens.map((token, index) => {
      if (containsKanji(token.surface_form) && token.reading && token.reading !== "*") {
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

  // Filter verbs based on selected category.
  const filteredVerbs =
    selectedCategory === "all"
      ? verbs
      : verbs.filter(v => v.category === selectedCategory);

  // When the form is submitted, call the API with the entered verb.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verb.trim()) return;
    await conjugateVerb(verb.trim());
  };

  const [selectedVerbId, setSelectedVerbId] = useState(null);

  // When a verb from the sidebar is clicked.
  const handleVerbClick = async (item) => {
    const { id, verb, category } = item;
    setSelectedVerbId(id);  // << add this line
    setVerb(verb);
    await conjugateVerb(verb, category);
  };
  

  // Replace with your actual OpenAI API key
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

  // Calls the ChatGPT API to fetch conjugation data for the given verb.
  const conjugateVerb = async (inputVerb, inputCategory = "") => {
    setLoading(true);
    setError("");
    setResult(null);

    const prompt = `
Please provide a Japanese verb conjugation table for the verb "${inputVerb}".
${inputCategory ? `It belongs to the category "${inputCategory}".` : ""}
Include the main meaning of the verb and specify which verb group it belongs to (e.g. Group 1: Godan Verbs, Group 2: Ichidan Verbs, or Group 3: Irregular Verbs) in the output.
Additionally, provide example sentences for each conjugation at a JLPT N5 level using exactly the same verb.
For each conjugation, output an example sentence or question in English and two Japanese translations—one in polite form and one in plain form—in hiragana only (no kanji), incorporating the user input verb.
Output a JSON object with the following structure (and no additional text):

{
  "title": "<Verb in kanji> Conjugation Table",
  "group": "Group information (e.g. Group 1)",
  "meaning": "Meaning of the verb",
  "conjugations": [
    { "conjugation": "Non-past Affirmative", "polite": "...", "plain": "..." },
    { "conjugation": "Non-past Negative", "polite": "...", "plain": "..." },
    { "conjugation": "Past Affirmative", "polite": "...", "plain": "...", "te": "..." },
    { "conjugation": "Past Negative", "polite": "...", "plain": "..." }
  ],
  "examples": [
    { "tense": "Non-past Affirmative", "english": "English example sentence", "japanese_polite": "japanese polite translation", "japanese_plain": "japanese plain translation" },
    { "tense": "Non-past Negative", "english": "English example sentence", "japanese_polite": "japanese polite translation", "japanese_plain": "japanese plain translation" },
    { "tense": "Past Affirmative", "english": "English example sentence", "japanese_polite": "japanese polite translation", "japanese_plain": "japanese plain translation" },
    { "tense": "Past Negative", "english": "English example sentence", "japanese_polite": "japanese polite translation", "japanese_plain": "japanese plain translation" },
    { "tense": "Te-form", "english": "English example sentence", "japanese_polite": "japanese polite translation", "japanese_plain": "japanese plain translation" }
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
        <h3>Verb List</h3>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="Godan">Godan</option>
          <option value="Ichidan">Ichidan</option>
          <option value="Irregular">Irregular</option>
        </select>
        <ul>
          {filteredVerbs.map(item => (
            <li 
              key={item.id} 
              className={`${item.category.toLowerCase()} ${selectedVerbId === item.id ? 'selected' : ''}`}
              onClick={() => handleVerbClick(item)}
            >
              {addFurigana(item.verb)}
            </li>
          ))}
        </ul>

      </div>
      <div className="content">
        <h1>Japanese Verb Conjugator</h1>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Enter a Japanese verb" 
            value={verb} 
            onChange={(e) => setVerb(e.target.value)}
            required 
          />
          <button type="submit">Conjugate</button>
        </form>
        <div className="rules-info" onClick={() => setShowRules(true)}>
          View conjugation rules
        </div>
        {loading && <LoadingSpinner />}
        {error && <div className="error">Error: {error}</div>}
        {/* If no result and not loading or error, show the main.webp image from public/assets */}
        {!result && !loading && !error && (
          <div className="placeholder">
            <img src="/assets/main.webp" alt="Main Visual" />
          </div>
        )}
        {result && (
          <div>
            <h2>
              {addFurigana(result.title.replace(" Conjugation Table", ""))}
              {result.group && <span className="group-badge">{result.group}</span>}
            </h2>
            {result.meaning && (
              <p>
                <strong>Meaning:</strong> <BlurredText>{addFurigana(result.meaning)}</BlurredText>
              </p>
            )}
            <h3>Conjugation Table</h3>
            <table>
              <thead>
                <tr>
                  <th>Conjugation</th>
                  <th>Polite Form</th>
                  <th>Plain Form</th>
                  <th>Te-form</th>
                </tr>
              </thead>
              <tbody>
                {result.conjugations.map((row, index) => (
                  <tr key={index}>
                    <td>{row.conjugation}</td>
                    <td><BlurredText>{addFurigana(row.polite)}</BlurredText></td>
                    <td><BlurredText>{addFurigana(row.plain)}</BlurredText></td>
                    <td><BlurredText>{row.te ? addFurigana(row.te) : ""}</BlurredText></td>
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
                        <td><BlurredText>{addFurigana(ex.japanese_polite)}</BlurredText></td>
                        <td><BlurredText>{addFurigana(ex.japanese_plain)}</BlurredText></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}

// Main App with modern navigation bar
function App() {
  const [currentPage, setCurrentPage] = useState("verb");

  return (
    <div>
      <header className="navbar">
        <div className="logo"> </div>
        <nav>
          <ul>
            <li
              className={currentPage === "verb" ? "active" : ""}
              onClick={() => setCurrentPage("verb")}
            >
              Verb Conjugator
            </li>
            <li
              className={currentPage === "adjective" ? "active" : ""}
              onClick={() => setCurrentPage("adjective")}
            >
              Adjective Conjugator
            </li>
          </ul>
        </nav>
      </header>
      {currentPage === "verb" ? <VerbConjugator /> : <AdjectiveConjugator />}
    </div>
  );
}

export default App;
