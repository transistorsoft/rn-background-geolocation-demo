'use strict';
 
var React = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');
//var BackgroundGeolocation = require('react-native-background-geolocation');

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
    width: 20,
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
    this.load(this.props.setting);
  },
  
  getInitialState() {
    var ds = new ListView.DataSource({
      rowHasChanged: function(r1, r2) {
        return true;
      }
    });
    return {
      dataSource: ds.cloneWithRows([]),
      setting: undefined
    };
  },
  // Very N.B. for changing nature of list with each different setting.
  componentWillReceiveProps: function( nextProps ) {
    if (nextProps.setting) {
      this.load(nextProps.setting);
    }
  },
  load: function(setting) {
    this.setState({
      setting: setting,
      value: this.settingsService.get(setting.name),
      dataSource: this.state.dataSource.cloneWithRows(setting.values),
      isLoading: false
    });
  },
  renderRow(setting) {
    return (
      <TouchableHighlight onPress={() => this.onSelectValue(setting)}  underlayColor='#dddddd'>
        <View>
          <View style={styles.row}>
            <View style={styles.leftContainer}>
              <Text style={styles.title}>{setting.toString()}</Text>
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
        ref="list"
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        style={styles.listView} />
    );
  },    
  onSelectValue(value) {
    var me      = this;
    var setting = this.props.setting;
    
    this.setState({
      value: value
    });
    this.settingsService.set(setting.name, value, function(config) {
      if (typeof(me.props.onSelectValue) === 'function') {  // <-- Android
        me.props.onSelectValue(value);
      } else {
        // iOS TODO do like Android here, provivding onSelectValue handler.
        /*
        bgGeo.setConfig(config);
        me.props.nav.replacePrevious({ // <-- iOS
          id: 'settings',
          component: Settings,
          title: 'Settings'
        });
        nav.pop();  
        */
      }
    });
   }
});
 
module.exports = SettingDetail;