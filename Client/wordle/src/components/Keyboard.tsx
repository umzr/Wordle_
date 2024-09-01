import React from 'react';
import { Button, Box } from '@mui/material';

interface KeyboardProps {
  onChar: (value: string) => void;
  onDelete: () => void;
  onEnter: () => void;
}

const Keyboard: React.FC<KeyboardProps> = ({ onChar, onDelete, onEnter }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'],
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {rows.map((row, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => {
                if (key === 'ENTER') {
                  onEnter();
                } else if (key === 'DELETE') {
                  onDelete();
                } else {
                  onChar(key);
                }
              }}
              sx={{
                minWidth: key.length > 1 ? 65 : 40,
                height: 58,
                padding: 0,
              }}
              variant="contained"
            >
              {key}
            </Button>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default Keyboard;