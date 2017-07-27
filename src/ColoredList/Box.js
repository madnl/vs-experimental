// @flow

import React from 'react';

type Props = {
  index: number,
  complexity: number
};

const style = {
  display: 'flex'
};

export default ({ index, complexity }: Props) => <div style={style}>{index}</div>;
