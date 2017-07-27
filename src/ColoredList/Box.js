// @flow

import React from 'react';
import range from '../util/range';

type Props = {
  height: string,
  text: string,
  complexity: number
};

const boxStyle = height => ({
  display: 'flex',
  height,
  borderStyle: 'solid',
  borderWidth: '1px'
});

const tileComplex = {
  display: 'flex',
  flexWrap: 'wrap'
};

const tileStyle = backgroundColor => ({
  minWidth: '10vw',
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

export default ({ text, complexity, height }: Props) => (
  <div style={boxStyle(height)}>
    <div style={textStyle}>
      {text}
    </div>
    <div style={tileComplex}>
      {range(complexity, index => <div key={index} style={tileStyle(pickColor(index))} />)}
    </div>
  </div>
);

const colorList = [
  'rgba(121, 173, 220, 1)',
  'rgba(255, 192, 159, 1)',
  'rgba(255, 238, 147, 1)',
  'rgba(252, 245, 199, 1)',
  'rgba(173, 247, 182, 1)'
];

const pickColor = index => colorList[index % colorList.length];
