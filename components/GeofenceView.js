'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
  Switch
} from 'react-native';

import Modal from 'react-native-modalbox';
import Icon from 'react-native-vector-icons/Ionicons';
import commonStyles from './styles';

var dismissKeyboard = require('dismissKeyboard');

class GeofenceView extends React.Component {
  propTypes: {
    onSubmit: React.PropTypes.func
  }
  constructor(props) {    
    super(props);
    this.state = {
      identifier: '',
      latitude: 0,
      longitude: 0,
      radius: '100',
      notifyOnEntry: true,
      notifyOnExit: false,
      notifyOnDwell: false,
      loiteringDelay: '0'
    };    
  }
  load(annotation) {
    this.setState({
      identifier: annotation.id 
    });
  }
  open(params) {
    this.setState({
      latitude: params.latitude,
      longitude: params.longitude,
      identifier: '',
      radius: '100',
      notifyOnEntry: true,
      notifyOnExit: false,
      notifyOnDwell: false,
      loiteringDelay: '0'
    });
    this.refs.modal.open();
  }
  close() {
    dismissKeyboard();
    this.refs.modal.close();    
  }
  onDone() {
    dismissKeyboard();
    this.refs.modal.close();
    this.props.onSubmit(this.state);
  }
  onCancel() {
    dismissKeyboard();
    this.refs.modal.close();   
  }
  render() {
    return (
      <Modal ref="modal" style={styles.modal} animationDuration={300} swipeToClose={false} position={"top"}>
        <View style={styles.modalContainer}>
          <View style={styles.toolbar}>
            <TouchableHighlight underlayColor="transparent" onPress={() => this.onCancel()}><Text style={styles.button}>Cancel</Text></TouchableHighlight>
            <Text style={styles.title}>Add Geofence</Text>
            <TouchableHighlight underlayColor="transparent" onPress={() => this.onDone()}><Text style={styles.button}>Done</Text></TouchableHighlight>
          </View>
          <View style={styles.form}>
            <View style={styles.formItem}>
              <Text style={styles.label}>Identifier</Text>
              <TextInput
                style={styles.textField}
                value={this.state.identifier}
                onChangeText={(text) => this.setState({identifier: text})}
                editable={true}
                autoCorrect={false}
                blurOnSubmit={true} />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.label}>Radius (meters)</Text>
              <TextInput
                style={styles.textField}
                value={this.state.radius}                
                onChangeText={(text) => this.setState({radius: text})}
                editable={true}
                keyboardType="numeric"
                autoCorrect={false}
                blurOnSubmit={true} />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.label}>Notify on Entry</Text>
              <View style={styles.switchContainer}>
                <Switch
                  ref="notifyOnEntry"
                  style={styles.switch}
                  value={this.state.notifyOnEntry}
                  onValueChange={(value) => this.setState({notifyOnEntry: value})} />
              </View>
            </View>

            <View style={styles.formItem}>
              <Text style={styles.label}>Notify on Exit</Text>
              <View style={styles.switchContainer}>
                <Switch
                  ref="notifyOnExit"
                  style={styles.switch}
                  value={this.state.notifyOnExit}
                  onValueChange={(value) => this.setState({notifyOnExit: value})} />
              </View>
            </View>

            <View style={styles.formItem}>
              <Text style={styles.label}>Notify on Dwell</Text>
              <View style={styles.switchContainer}>
                <Switch
                  ref="notifyOnDwell"
                  style={styles.switch}
                  value={this.state.notifyOnDwell}
                  onValueChange={(value) => this.setState({notifyOnDwell: value})} />
              </View>
            </View>

            <View style={styles.formItem}>
              <Text style={styles.label}>Loitering delay (ms)</Text>
              <TextInput
                style={styles.textField}
                value={this.state.loiteringDelay}
                onChangeText={(text) => this.setState({loiteringDelay: text})}
                editable={true}
                keyboardType="numeric"
                autoCorrect={false}
                blurOnSubmit={true} />
            </View>

          </View>
        </View>
      </Modal>
    );
  }
}

var styles = StyleSheet.create({
  modal: {
    position: "absolute",
    top: 0,    
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f00'
  },
  modalContainer: {
    backgroundColor: "#fff",
    flex: 1, 
    alignSelf: "stretch"
  },
  button: {
    color: '#387ef5',
    fontSize: 17
  },
  toolbar: {
    paddingLeft: 5,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: '#fff',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46
  },
  form: {
    
  },
  formItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 50
  },
  label: {
    flex: 0.5,
    color: '#000',
    paddingLeft: 5,
    fontSize: 15
  },
  textField: {
    flex: 0.5,
    fontSize: 15
  },
  switchContainer: {
    flex: 0.5,
    padding: 10
  },
  switch: {
    width: 50
  },
  title: {
    fontWeight: 'bold', 
    fontSize: 18, 
    flex: 1, 
    textAlign: 'center'
  }
});

module.exports = GeofenceView;