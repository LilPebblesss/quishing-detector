import Svg, { Defs, Filter, FeGaussianBlur, Path } from 'react-native-svg';
import { StyleSheet, View, useWindowDimensions, type DimensionValue, type ViewStyle } from 'react-native';
import { theme } from '../lib/styles';

const GRID_STEPS = [1, 2, 3, 4, 5];

const frame = {
  flex: 1,
  overflow: 'hidden' as const,
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: theme.accentLine,
};

const inert = { pointerEvents: 'none' } as const;

// Organic (non-circular) blobs, sized/designed so most of each shape sits
// off the visible canvas; the Gaussian blur makes their edges fade out.
const PATH_TOP_RIGHT =
  'M300,220 C350,200 470,290 440,360 C400,420 320,420 300,420 C240,410 200,360 220,310 C245,265 270,225 300,220 Z';
const PATH_BOTTOM_LEFT =
  'M120,300 C135,275 170,260 220,275 C260,288 275,330 245,350 C215,370 155,370 120,350 C90,325 100,300 120,300 Z';


const line = { backgroundColor: theme.line, width: 1 } as const;

function Grid() {
  return (
    <View style={[StyleSheet.absoluteFill, inert]}>
      {GRID_STEPS.map((step) => (
        <View
          key={`v${step}`}
          style={[
            line,
            {
              position: 'absolute',
              left: `${(step / 6) * 100}%` as DimensionValue,
              top: 0,
              bottom: 0,
            },
          ]}
        />
      ))}
      {GRID_STEPS.map((step) => (
        <View
          key={`h${step}`}
          style={[
            line,
            {
              position: 'absolute',
              top: `${(step / 6) * 100}%` as DimensionValue,
              left: 0,
              right: 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const bracketBase: ViewStyle = {
  position: 'absolute',
  width: '22%',
  height: '22%',
  borderColor: theme.accent,
};

function Brackets() {
  return (
    <>
      <View style={[bracketBase, { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[bracketBase, { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }]} />
      <View style={[bracketBase, { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[bracketBase, { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }]} />
    </>
  );
}

export function ScanFrame() {
  return (
    <View style={frame}>
      <Grid />
      <View style={[{ position: 'absolute', left: 0, right: 0, top: '34%', height: 1, backgroundColor: theme.accentLine }, inert]} />
      <Brackets />
    </View>
  );
}

export function QrLogo({
  size = 30,
  color = theme.text,
  accent = theme.accent,
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  const cell = size / 5;
  const finders = [
    [0, 0],
    [3, 0],
    [0, 3],
  ];

  return (
    <View style={{ width: size, height: size }}>
      {finders.map(([x, y]) => (
        <View
          key={`${x}-${y}`}
          style={{
            position: 'absolute',
            left: x * cell,
            top: y * cell,
            width: cell * 2 - 2,
            height: cell * 2 - 2,
            borderWidth: 1.5,
            borderColor: color,
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: cell * 0.42,
              top: cell * 0.42,
              width: cell * 0.9,
              height: cell * 0.9,
              backgroundColor: color,
            }}
          />
        </View>
      ))}
      <View
        style={{
          position: 'absolute',
          left: 2 * cell,
          top: 2 * cell,
          width: cell - 2,
          height: cell - 2,
          backgroundColor: accent,
        }}
      />
    </View>
  );
}

export function Arrow({ size = 16, color = theme.accent }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size - 2, height: 1.5, backgroundColor: color }} />
      <View
        style={{
          position: 'absolute',
          right: 0,
          width: size * 0.4,
          height: size * 0.4,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

export function BackgroundBlobs() {
  const { width, height } = useWindowDimensions();
  const topRightSize = width * 0.86;
  const bottomLeftSize = width * 0.52;

  return (
    <View style={[StyleSheet.absoluteFill, inert]} pointerEvents="none">
      <Svg
        width={topRightSize}
        height={topRightSize}
        viewBox="0 0 500 500"
        style={{
          position: 'absolute',
          top: height * 0.10,
          left: width - topRightSize * 0.6,
        }}
      >
        <Defs>
          <Filter id="blur-top" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="28" />
          </Filter>
        </Defs>
        <Path d={PATH_TOP_RIGHT} fill="#F5D5DE" fillOpacity={0.4} filter="url(#blur-top)" />
      </Svg>

      <Svg
        width={bottomLeftSize}
        height={bottomLeftSize}
        viewBox="0 0 500 500"
        style={{
          position: 'absolute',
          left: -bottomLeftSize * 0.5,
          top: height - bottomLeftSize * 0.5,
        }}
      >
        <Defs>
          <Filter id="blur-bottom" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="26" />
          </Filter>
        </Defs>
        <Path d={PATH_BOTTOM_LEFT} fill="#F8E0E7" fillOpacity={0.3} filter="url(#blur-bottom)" />
      </Svg>
    </View>
  );
}