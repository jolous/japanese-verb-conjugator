import React, { useState, useEffect } from 'react';

export function containsKanji(text) {
  return /[一-龯]/.test(text);
}

export function convertKatakanaToHiragana(text) {
  return text.replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}


export function BlurredText({ children, searchTerm }) {
  const [blurred, setBlurred] = useState(true);

  useEffect(() => {
    setBlurred(true);
  }, [children]);

  const handleClick = () => {
    if (blurred) {
      setBlurred(false);
    } else if (searchTerm) {
      const encoded = encodeURIComponent(searchTerm);
      window.open(`https://forvo.com/search/${encoded}/`, '_blank');
    }
  };

  return (
    <span className={blurred ? 'blurred' : ''} onClick={handleClick}>
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
