import React from 'react';
import {ipcRenderer as ipc, clipboard} from 'electron';
import * as moment from 'moment';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      apps: undefined,
      form: {
        name: '',
        password: ''
      }
    };

    ipc.send('init');

    ipc.on('passwords', (event, apps) => {
      this.setState({apps});
    });

    ipc.on('appModifySuccess', function(event) {
      // TODO
      console.log('Imitate notification');
    });

    this.onAddModalOpen = this.onAddModalOpen.bind(this);
    this.onAppSave = this.onAppSave.bind(this);
    this.onCloseAddModal = this.onCloseAddModal.bind(this);
    this.onFormInputChange = this.onFormInputChange.bind(this);
    this.editApp = this.editApp.bind(this);
    this.onAppRemove = this.onAppRemove.bind(this);
  }

  onCloseAddModal() {
    this.setState({modal: false});
  }

  onItemClick(event, app) {
    if (event.target.nodeName.toLowerCase() === 'i') {
      return event.preventDefault();
    }

    ipc.send('copyAppPassword', app);
  }

  onAddModalOpen() {
    this.setState({
      modal: true,
      form: {
        name: '',
        password: ''
      }
    });
  }

  onAppSave() {
    this.setState({modal: false});
    ipc.send('saveNewApp', this.state.form);
  }

  onFormInputChange(event) {
    let newValue = this.state.form;
    newValue[event.target.name] = event.target.value;

    this.setState({form: newValue});
  }

  editApp(app) {
    let form = {
      _id: app._id,
      name: app.name,
      password: app.password
    };

    this.setState({modal: true, form: form});
  }

  onAppRemove(_id) {
    ipc.send('removeApp', _id);
    this.setState({modal: false});
  }

  render() {
    return (
      <div className="app">
        {this.state.modal && (
          <div className="add-modal-bg"></div>
        )}
        {this.state.modal && (
          <div className="add-modal">
            <div className="content">
              <i className="ion-android-close" onClick={this.onCloseAddModal}></i>
              <input type="text" placeholder="Name of application" value={this.state.form.name} name="name" onChange={this.onFormInputChange} />
              <input type="text" placeholder="Password" value={this.state.form.password} name="password" onChange={this.onFormInputChange} />
              <button className="save" onClick={this.onAppSave}>Save</button>
              {this.state.form._id &&
                <button className="remove" onClick={() => {this.onAppRemove(this.state.form._id)}}>Remove</button>
              }
            </div>
          </div>
        )}

        <div className="bar">
          <p>Press {this.props.hotkey.replace('CommandOr', '')} to open Hasloo</p>
          <button onClick={this.onAddModalOpen}>+</button>
        </div>

        {this.state.apps &&
          <div className="list">
            {this.state.apps.map((item, i) =>
              <div className="item" key={i} onClick={(event) => {this.onItemClick(event, item)}}>
                <h1>{item.name}</h1>
                <h2>Added {moment.unix(item.createdAt).fromNow()}</h2>

                <i className="ion-ios-color-wand-outline" onClick={() => {this.editApp(item)}}></i>
              </div>
            )}

            {this.state.apps.length === 0 ? (
              <div className="empty">No apps found</div>
            ) : (
              <div className="info">Click on an app to copy password</div>
            )}
          </div>
        }
      </div>
    )
  }
}

export default App;