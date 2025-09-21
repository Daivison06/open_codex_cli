import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
// import { useTerminalSize } from 'src/hooks/use-terminal-size';
// import { getAsciiArtWidth } from 'src/utils/text-utils';
import { longAsciiLogo } from './terminal-asciiart';

const TerminalTitle = () => {
    let displayTitle;
    displayTitle = longAsciiLogo;
    // const { columns: terminalWidth } = useTerminalSize();
    // const widthOfLongLogo = getAsciiArtWidth(shortAsciiLogo);

    const colors = ['#FFD700', '#da7959'];
    return (
    <Box flexDirection="column" alignItems="center">
        <Gradient colors={colors}>
            <Text>{displayTitle}</Text>
        </Gradient>
    </Box>
    );

}

export default TerminalTitle