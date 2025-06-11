import React, { useState, useEffect } from 'react';
import kuromoji from 'kuromoji';
import RulesModal from './RulesModal';
import { containsKanji, convertKatakanaToHiragana, BlurredText, LoadingSpinner } from '../utils/helpers';

export default function VerbConjugator() {
  const [verb, setVerb] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [verbs, setVerbs] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [conjugationLibrary, setConjugationLibrary] = useState({});

  useEffect(() => {
    kuromoji
      .builder({ dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' })
      .build((err, tk) => {
        if (err) {
          console.error('Kuromoji build error:', err);
          return;
        }
        setTokenizer(tk);
      });
  }, []);

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
        console.error('Error fetching verbs:', error);
      });
  }, []);

  useEffect(() => {
    fetch('/verb_conjugations.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch conjugation data');
        }
        return response.json();
      })
      .then(data => {
        setConjugationLibrary(data);
      })
      .catch(error => {
        console.error('Error fetching conjugation data:', error);
      });
  }, []);

  const addFurigana = text => {
    if (!tokenizer || typeof text !== 'string') return text;
    const tokens = tokenizer.tokenize(text);
    return tokens.map((token, index) => {
      if (containsKanji(token.surface_form) && token.reading && token.reading !== '*') {
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

  const filteredVerbs =
    selectedCategory === 'all'
      ? verbs
      : verbs.filter(v => v.category === selectedCategory);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!verb.trim()) return;
    await conjugateVerb(verb.trim());
  };

  const [selectedVerbId, setSelectedVerbId] = useState(null);

  const handleVerbClick = async item => {
    const { id, verb, category } = item;
    setSelectedVerbId(id);
    setVerb(verb);
    await conjugateVerb(verb, category);
  };

  const conjugateVerb = async (inputVerb, inputCategory = '') => {
    setLoading(true);
    setError('');
    setResult(null);

    // Look up the verb in the loaded JSON data
    if (conjugationLibrary && conjugationLibrary[inputVerb]) {
      const data = conjugationLibrary[inputVerb];
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

    setError('No conjugation data found for the specified verb.');
    setLoading(false);
  };

  return (
    <div className="main-wrapper">
      <div className="sidebar">
        <h3>Verb List</h3>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
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
            onChange={e => setVerb(e.target.value)}
            required
          />
          <button type="submit">Conjugate</button>
        </form>
        <div className="rules-info" onClick={() => setShowRules(true)}>
          View conjugation rules
        </div>
        {loading && <LoadingSpinner />}
        {error && <div className="error">Error: {error}</div>}
        {!result && !loading && !error && (
          <div className="placeholder">
            <img src="/assets/main.webp" alt="Main Visual" />
          </div>
        )}
        {result && (
          <div>
            <h2>
              {addFurigana(result.title.replace(' Conjugation Table', ''))}
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
                    <td>
                      <BlurredText searchTerm={row.te}>
                        {row.te ? addFurigana(row.te) : ''}
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
                          <BlurredText>
                            {addFurigana(ex.japanese_polite)}
                          </BlurredText>
                        </td>
                        <td>
                          <BlurredText>
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
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
