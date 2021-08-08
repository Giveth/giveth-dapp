import React from 'react';

const SentryTest = () => {
  const UnhandledClick = () => {
    throw new Error(
      Math.floor(Math.random() * 10000),
      'UnhandledClick in Giveth',
      process.env.REACT_APP_SENTRY_RELEASE,
    );
  };

  return (
    <div>
      <button type="button" onClick={UnhandledClick}>
        Click Me :D
      </button>
    </div>
  );
};

export default SentryTest;
