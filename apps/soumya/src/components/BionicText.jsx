import React, { useMemo } from 'react';

const bionicWord = (word) => {
  // Ignore purely non-alphanumeric words (like punctuation on its own)
  if (!/\w/.test(word)) return <span key={Math.random()}>{word} </span>;

  // Find the split point: usually we bold the first 40%-50% of the word
  const length = word.length;
  let splitIndex = 1;

  if (length === 1) {
    splitIndex = 1;
  } else if (length <= 3) {
    splitIndex = 1;
  } else if (length === 4) {
    splitIndex = 2;
  } else {
    splitIndex = Math.ceil(length * 0.4);
  }

  const boldPart = word.slice(0, splitIndex);
  const regularPart = word.slice(splitIndex);

  return (
    <span key={Math.random()} style={{ marginRight: '0.25rem' }}>
      <b className="bionic">{boldPart}</b>
      <span>{regularPart}</span>
    </span>
  );
};

const BionicText = ({ text, isActive }) => {
  const content = useMemo(() => {
    if (!isActive) return <>{text}</>;

    // Split text into lines, then into words
    const paragraphs = text.split('\n').filter(Boolean);

    return paragraphs.map((para, idx) => {
      // Split by spaces but preserve punctuation
      const words = para.split(/\s+/);
      return (
        <p key={idx}>
          {words.map((word) => bionicWord(word))}
        </p>
      );
    });
  }, [text, isActive]);

  return <div className="prose">{content}</div>;
};

export default BionicText;
