import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  WebView
} from 'react-native';

import { 
  Container,
  Button, Icon,
  Text,
  Header, Title,
  Left, Body, Right
} from 'native-base';

export default class AboutView extends Component<{}> {

  render() {
    return (
      <Container style={styles.container}>
        <Header style={styles.header}>
          <Left>
            <Button small dark transparent onPress={this.onClickClose.bind(this)}>
              <Icon color="#000" active name="ios-arrow-dropdown-circle" />
            </Button>
          </Left>
          <Body>
            <Title style={styles.title}>About</Title>
          </Body>
          <Right>
            
          </Right>
        </Header>
        
        <Container>
          <WebView
            source={{uri: 'http://www.transistorsoft.com/shop/products/react-native-background-geolocation'}}
          />
        </Container>
      </Container>
    );
  }

  /**
  * Navigate back to home-screen app-switcher
  */
  onClickClose() {
    this.props.navigation.goBack();
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#272727'
  },
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  }
});
