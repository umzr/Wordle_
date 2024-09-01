'use client';

import React from 'react';
import './keyboard.css';
import BackspaceIcon from '@mui/icons-material/Backspace';
import EventBus from './eventbus';

const rows = [
  'qwertyuiop'.split(''),
  'asdfghjkl'.split(''),
  ['Enter', ...'zxcvbnm'.split(''), 'Backspace']
];

const KeyboardButton = ({ keyboard_key, keyref }) => {
  const clickBtn = (key) => {
    keyref({ key: key });
    // EventBus.dispatch("CustomKeyDown", { key: key });
  };

  let child;
  let keyboardClass = "keyboard-btn";

  if (keyboard_key === 'Backspace') {
    child = <BackspaceIcon />;
    keyboardClass += " big";
  } else if (keyboard_key === 'Enter') {
    child = <span>{keyboard_key}</span>;
    keyboardClass += " big";
  } else {
    child = <span>{keyboard_key}</span>;
  }

  return (
    <button 
      value={keyboard_key} 
      className={keyboardClass} 
      onClick={(e) => clickBtn(e.currentTarget.value)}
    >
      {child}
    </button>
  );
};

const Keyboard = ({ keyref }) => {
  const keyboard = rows.map((row, i) => {
    let keyboard_rows = row.map((key, j) => (
      <KeyboardButton keyref={keyref} key={`${i}-${j}`} keyboard_key={key} />
    ));

    if (i === 1) {
      keyboard_rows.push(
        <div className="spacer" key={'spacestart'}></div>
      );
      keyboard_rows.unshift(
        <div className="spacer" key={'spaceend'}></div>
      );
    }

    return (
      <div className="keyboard-row" key={`row-${i}`}>
        {keyboard_rows}
      </div>
    );
  });

  return (
    <div id="keyboard-container">
      <div id="keyboard">
        {keyboard}
      </div>
    </div>
  );
};

export default Keyboard;