import React from 'react';
import { shallow } from 'enzyme';
import { App } from './App';

describe('<App />', () => {
  it('matches its snapshot', () => {
    const component = shallow(<App />);
    expect(component).toMatchSnapshot();
  });
});
