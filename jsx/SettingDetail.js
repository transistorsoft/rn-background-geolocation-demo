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
    padding: 10,
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
    this.bgGeo = BackgroundGeolocation;
    this.fetchData();
    this.settingsService = require('./SettingsService');
  },
  
  getInitialState() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      dataSource: ds.cloneWithRows([]),
    };
  },
  fetchData() {
    var setting = this.props.setting;
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(setting.values),
      isLoading: false,
      value: setting.value
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
          <View style={styles.container}>
            <View style={styles.toolbar}>
              <TouchableHighlight style={styles.cancelButton} onPress={this.onCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableHighlight>
              <Text>{this.props.title}</Text>
            </View>
            
            <ListView
              dataSource={this.state.dataSource}
              renderRow={this.renderRow}
              style={styles.listView} />
          </View>
        );
    },    
    onSelectValue(value) {
      var bgGeo = this.bgGeo;
      var setting = this.props.setting;
      var nav = this.props.navigator;

      this.setState({
        value: value
      });
      this.settingsService.set(setting.name, value, function(config) {
        bgGeo.setConfig(config);

        nav.replacePrevious({
          id: 'settings'
        });
        nav.pop();  
      });
   }
});
 
module.exports = SettingDetail;