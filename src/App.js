import React, { useState } from 'react';
import './App.css';
import VerbConjugator from './components/VerbConjugator';
import AdjectiveConjugator from './AdjectiveConjugator';

function App() {
  const [currentPage, setCurrentPage] = useState('verb');

  return (
    <div>
      <header className="navbar">
        <div className="logo"> </div>
        <nav>
          <ul>
            <li
              className={currentPage === 'verb' ? 'active' : ''}
              onClick={() => setCurrentPage('verb')}
            >
              Verb Conjugator
            </li>
            <li
              className={currentPage === 'adjective' ? 'active' : ''}
              onClick={() => setCurrentPage('adjective')}
            >
              Adjective Conjugator
            </li>
          </ul>
        </nav>
      </header>
      {currentPage === 'verb' ? <VerbConjugator /> : <AdjectiveConjugator />}
    </div>
  );
}

export default App;
