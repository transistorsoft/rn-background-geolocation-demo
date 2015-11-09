'use strict';
 
var React = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');
var BackgroundGeolocation = require('react-native-background-geolocation');

var {
  StyleSheet,
  Text,
  View,
  Component,
  ListView,
  Navigator,
  TouchableHighlight
} = React;

var Settings = require('./Settings');

var styles = StyleSheet.create({
  container: {
    marginTop: 10,
    position: 'absolute',
    top: 5,
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'column',
    padding: 0,
    backgroundColor: '#efefef'
  },
  toolbar: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    backgroundColor: 'white'
  },
  cancelButton: {
    position: 'absolute',
    left: 5,
    top: 15
  },
  row: {
    alignItems: 'center',
    padding: 15,
    flexDirection: 'row'
  },
  leftContainer: {
    flex: 1,
    left: 0
  },
  rightContainer: {
    width: 24,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16
  },
  listView: {
    backgroundColor: '#fff'
  },
  separator: {
    height: 1,
    backgroundColor: '#dddddd'
  }
});
 
var SettingDetail = React.createClass({
  onCancel() {
    this.props.navigator.pop();
  },
  componentDidMount() {
    this.settingsService = require('./SettingsService');
    this.bgGeo = BackgroundGeolocation;
    this.fetchData();
  },
  
  getInitialState() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      dataSource: ds.cloneWithRows([]),
    };
  },
  fetchData() {
    this.setting = this.props.setting;
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(this.setting.values),
      isLoading: false,
      value: this.settingsService.get(this.setting.name)
    });
  },
  renderRow(setting) {
    return (
      <TouchableHighlight onPress={() => this.onSelectValue(setting)}  underlayColor='#dddddd'>
        <View>
          <View style={styles.row}>
            <View style={styles.leftContainer}>
              <Text style={styles.title}>{setting}</Text>
            </View>
            <View style={styles.rightContainer}>
              {this.state.value == setting ? <Icon name="checkmark" size={15} color="#4f8ef7" style={styles.checkbox} /> : null}
            </View>
          </View>
          <View style={styles.separator} />
        </View>
      </TouchableHighlight>
    );
  },
  render() {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        style={styles.listView} />
    );
  },    
  onSelectValue(value) {
    var bgGeo = this.bgGeo;
    var setting = this.props.setting;
    var nav = this.props.navigator;

    var Settings = require('./Settings');

    this.setState({
      value: value
    });
    this.settingsService.set(setting.name, value, function(config) {
      bgGeo.setConfig(config);

      nav.replacePrevious({
        id: 'settings',
        component: Settings,
        title: 'Settings'
      });
      nav.pop();  
    });
   }
});
 
module.exports = SettingDetail;