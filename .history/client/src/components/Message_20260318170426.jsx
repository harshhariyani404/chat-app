import React from 'react';

const Message = ({ msg }) => {
  return (
    <div style={{marginBottom:"10px"}}>
      <strong>{msg.user}</strong>: {msg.message}
      <br />
      <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
    </div>
  );
}

export default Message;
