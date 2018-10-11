import * as RX from 'reactxp';
import React from 'react';
import { App } from './App';
import { DEBUG, DEV } from './config';

RX.App.initialize(DEBUG, DEV);
RX.UserInterface.setMainView(<App />);
