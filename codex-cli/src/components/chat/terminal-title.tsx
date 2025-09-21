import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { useTerminalSize } from 'src/hooks/use-terminal-size';
import { longAsciiLogo, shortAsciiLogo } from './terminal-asciiart';
import { getAsciiArtWidth, stripUnsafeCharacters } from 'src/utils/text-utils';

const TerminalTitle = () => {
  const { columns: terminalWidth } = useTerminalSize();
  const widthOfLongLogo = getAsciiArtWidth(longAsciiLogo);

  const displayTitle =
    terminalWidth >= widthOfLongLogo ? longAsciiLogo : shortAsciiLogo;

  const colors = ['#FFD700', '#da7959'];

  return (
    <Box flexDirection="column" alignItems="center">
      <Gradient colors={colors}>
        <Text>{stripUnsafeCharacters(displayTitle)}</Text>
      </Gradient>
    </Box>
  );
};

export default TerminalTitle;
