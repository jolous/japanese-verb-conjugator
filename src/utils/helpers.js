import React, { useState } from 'react';

export function containsKanji(text) {
  return /[一-龯]/.test(text);
}

export function convertKatakanaToHiragana(text) {
  return text.replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}


export function BlurredText({ children }) {
  const [blurred, setBlurred] = useState(true);
  return (
    <span className={blurred ? 'blurred' : ''} onClick={() => setBlurred(false)}>
      {children}
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="loader"></div>
      <p>Loading...</p>
    </div>
  );
}
