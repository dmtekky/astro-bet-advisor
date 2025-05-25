import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div style={{ color: 'red', padding: '10px', border: '1px solid red', margin: '10px 0' }}>
      <strong>Error:</strong> {message}
    </div>
  );
};

export default ErrorMessage;
