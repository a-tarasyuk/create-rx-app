import React, { ReactElement } from 'react';
import RX from 'reactxp';

const _styles = {
  main: RX.Styles.createViewStyle({
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  }),

  title: RX.Styles.createTextStyle({
    fontWeight: 'bold',
    fontSize: 36,
    textAlign: 'center',
  }),

  label: RX.Styles.createTextStyle({
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
  }),

  name: RX.Styles.createTextStyle({
    fontWeight: 'bold',
    fontSize: 36,
    color: '#42B74F',
  }),

  links: RX.Styles.createViewStyle({
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  }),

  link: RX.Styles.createLinkStyle({
    marginRight: 5,
    marginLeft: 5,
    color: '#0070E0',
  }),
};

export class App extends RX.Component {
  public render(): ReactElement<RX.View> {
    return (
      <RX.View style={ _styles.main }>
        <RX.View>
          <RX.Text style={ _styles.title }>Welcome to <RX.Text style={ _styles.name }>ReactXP</RX.Text></RX.Text>
          <RX.Text style={ _styles.label }>To get started, edit /src/App.tsx</RX.Text>
        </RX.View>

        <RX.View style={ _styles.links }>
          <RX.Link url={ 'https://github.com/Microsoft/reactxp' } style={ _styles.link }>GitHub</RX.Link>
          <RX.Link url={ 'https://microsoft.github.io/reactxp' } style={ _styles.link }>Docs</RX.Link>
          <RX.Link url={ 'https://github.com/Microsoft/reactxp/tree/master/samples' } style={ _styles.link }>Samples</RX.Link>
          <RX.Link url={ 'https://github.com/Microsoft/reactxp/tree/master/extensions' } style={ _styles.link }>Extensions</RX.Link>
        </RX.View>
      </RX.View>
    );
  }
}
