// component/onboarding/Ellipse.tsx
import * as React from 'react';
import Svg, { Ellipse, Defs, Filter, FeDropShadow } from 'react-native-svg';

const FIGMA_WIDTH = 551;
const FIGMA_HEIGHT = 190;
const ASPECT_RATIO = FIGMA_HEIGHT / FIGMA_WIDTH;

interface EllipseProps {
  width: number;
}

const EllipseShape: React.FC<EllipseProps> = ({ width }) => {
  const height = width * ASPECT_RATIO;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${FIGMA_WIDTH} ${FIGMA_HEIGHT}`} // ViewBox ko aache se fit kar rahe hain
    >
      <Defs>
        <Filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <FeDropShadow
            dx="0"
            dy="4"
            stdDeviation="10" 
            floodColor="rgba(0, 0, 0, 0.63)"
          />
        </Filter>
      </Defs>
      <Ellipse
        cx={FIGMA_WIDTH / 2}
        cy={FIGMA_HEIGHT / 2}
        rx={FIGMA_WIDTH / 2}
        ry={FIGMA_HEIGHT / 2}
        fill="rgba(215, 215, 215, 0.45)" 
        stroke="rgba(167, 167, 167, 0.7)"
        strokeWidth="1.5"
        filter="url(#shadow)"
      />
    </Svg>
  );
};

export default EllipseShape;