'use strict';
 
var React = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');
var SettingDetail = require('./SettingDetail');

var {
    StyleSheet,
    Text,
    View,
    Component,
    ListView,
    ScrollView,
    Navigator,
    TouchableHighlight,
    AsyncStorage,
    SettingsService
   } = React;

var styles = StyleSheet.create({
    container: {
        marginTop: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        flexDirection: 'column',
        padding: 0,
        paddingTop: 5
    },
    toolbar: {
      top: 0,
      height: 50,
      padding: 5,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#dddddd'
    },
    row: {
      alignItems: 'center',
      flex: 1,
      padding: 10,
      flexDirection: 'row'
    },
    cancelButton: {
      position: 'absolute',
      left: 5,
      top: 17
    },
    thumbnail: {
        width: 53,
        height: 81,
        marginRight: 10
    },
    rightContainer: {
        flex: 0.4,
        alignItems: 'flex-end',
    },
    leftContainer: {
      flex: 1,
      left: 0
    },
    name: {
      fontSize: 14
    },
    author: {
      color: '#656565'
    },
    separator: {
      height: 1,
      backgroundColor: '#dddddd'
    },
    scroller: {
      backgroundColor: '#efefef'
    },
    listView: {
      backgroundColor: '#fff'
    },
    geolocationSettings: {
      height: 250
    },
    applicationSettings: {
      height: 100
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    disclosure: {
      position: 'absolute',
      right: 0,
      top: 0
    },
    value: {
      marginRight: 15
    },
    groupTitle: {
      color: '#999',
      padding: 5,
      paddingTop: 20,
      paddingLeft: 10
    }
});
 
var Settings = React.createClass({
    
  onCancel() {
    this.props.navigator.pop();
  },
  componentDidMount() {
    var me = this;
    var SettingsService = require('./SettingsService');

    SettingsService.getSettings('iOS', function(values) {
      var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
      me.setState({
        dataSource: {
          http: ds.cloneWithRows(values.http),
          application: ds.cloneWithRows(values.application),
          geolocation: ds.cloneWithRows(values.geolocation)
        }
      });
    });
  },
  
  getInitialState() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      dataSource: {
        http: ds,
        application: ds,
        geolocation: ds
      }
    };
  },
  renderSetting(setting) {
    return (
      <TouchableHighlight onPress={() => this.onSelectSetting(setting)}  underlayColor='#dddddd'>
        <View>
          <View style={styles.row}>
            <View style={styles.leftContainer}>
              <Text style={styles.name}>{setting.name}</Text>
            </View>
            <View style={styles.rightContainer}>
              <Text style={styles.value}>{setting.value}</Text>
              <Icon name="chevron-right" size={15} color="#4f8ef7" style={styles.disclosure} />
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
            <ScrollView style={styles.scroller}>
              <Text style={styles.groupTitle}>Geolocation Settings</Text>
              <View style={styles.separator} />
              <ListView
                dataSource={this.state.dataSource.geolocation}
                renderRow={this.renderSetting}
                style={[styles.listView, styles.geolocationSettings]}
              />

              <Text style={styles.groupTitle}>Application Settings</Text>
              <View style={styles.separator} />
              <ListView
                dataSource={this.state.dataSource.application}
                renderRow={this.renderSetting}
                style={[styles.listView, styles.applicationSettings]}
              />
            </ScrollView>
          </View>
        );
    },    
    onSelectSetting(setting) {
      this.props.navigator.push({
        id: 'settingDetail',
        title: setting.name,
        sceneConfig: Navigator.SceneConfigs.FloatFromRight,
        component: SettingDetail,
        passProps: {setting}
      });
   }
});
 
module.exports = Settings;