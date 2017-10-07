import React from 'react';
import {ipcRenderer as ipc} from 'electron';
import Welcome from './welcome';
import App from './app';

class Root extends React.Component {
  constructor() {
    super();
    this.state = {onboardingComplete: null};

    ipc.on('appSettings', (event, reply) => {
      this.setState({settings: reply});
    });
    
    ipc.send('getAppSettings');
  }

  closeWindow() {
    ipc.send('closeWindow');
  }

  render() {
    return (
      <div>
        <header>
          <h1>hasloo</h1>

          <div className="buttons">
            <i className="ion-android-close" onClick={this.closeWindow}></i>
          </div>
        </header>
        <div className="container">
          {
            (this.state.settings && this.state.settings.onboarding) ? (
              <App hotkey={this.state.settings.hotkey} />
            ) : (
              <Welcome />
            )
          }
        </div>
      </div>
    );
  }
}

export default Root;