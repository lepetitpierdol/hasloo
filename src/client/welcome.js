import React from 'react';
import {ipcRenderer as ipc} from 'electron';

class Welcome extends React.Component {
  finish() {
    ipc.send('finishOnboarding');
  }

  render() {
    return (
      <div className="welcome">
        <h1>Hello,</h1>
        <h2>Hasloo is not supposed to be a secure password keeper. There is no password protection. It's suppose to simply replace the notepad with passwords. For more security please use other tools.</h2>

        <button onClick={this.finish}>Get started</button>
      </div>
    );
  }
}

export default Welcome;