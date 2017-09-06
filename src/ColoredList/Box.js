// @flow

import React from 'react';
import range from '../util/range';

type Props = {
  height: string,
  index: number,
  complexity: number
};

const boxStyle = (height, borderColor) => ({
  display: 'flex',
  height,
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor
});

const tileComplex = {
  display: 'flex',
  flexWrap: 'wrap'
};

const tileStyle = backgroundColor => ({
  minWidth: '4vw',
  flexGrow: '1',
  backgroundColor
});

const textStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  verticalAlign: 'middle',
  minWidth: '15vw',
  fontSize: '2em',
  fontFamily: 'sans-serif'
};

export default ({ index, complexity, height }: Props) => (
  <div style={boxStyle(height, borderPalette(index))}>
    <div style={textStyle}>
      {index}
    </div>
    <div style={tileComplex}>
      {range(complexity, index => <div key={index} style={tileStyle(tilePalette(index))} />)}
    </div>
  </div>
);

const palette = colorList => index => colorList[index % colorList.length];

const tilePalette = palette([
  'rgba(121, 173, 220, 1)',
  'rgba(255, 192, 159, 1)',
  'rgba(255, 238, 147, 1)',
  'rgba(252, 245, 199, 1)',
  'rgba(173, 247, 182, 1)'
]);

const borderPalette = palette(['black', 'red']);
