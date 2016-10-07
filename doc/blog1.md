I recently attempted to fund an on-demand marketplace that connects blind clients with sighted assistants by video for help with tasks. While I didn't succeed at raising the funds I needed, I did open source [Node-Janus](https://github.com/ndarilek/node-janus), a simplified and modernized JavaScript API for the [Janus Web RTC Gateway](https://janus.conf.meetecho.com/).

Unfortunately, I haven't had time to formally document how this API works. It does, however, work on [React Native](https://facebook.github.io/react-native/). In lieu of actual documentation, here is a tutorial on how to build an Android React Native app that hooks into the Janus API directly.

Note that as of now this app is Android-only because I don't have an iOS build environment. I have no reason to doubt this *wouldn't* work under iOS, but I myself can't make it do so. I'll try building it in a way that simplifies an iOS port, and will accept pull requests/update the tutorial if anyone tells me how.

## Getting Started

This tutorial assumes you already have [React Native installed](https://facebook.github.io/react-native/docs/getting-started.html). Come back once you've done that, or keep reading if you're already done.

I also assume you have Janus installed, with its HTTP interface listening on http://localhost:8088. The [installation process](https://github.com/meetecho/janus-gateway) is unfortunately fairly involved, and packages aren't kept up-to-date. However, if you're a [Docker](https://docker.com) user, here is a `docker-compose.yml` file to get you up and running. Note that I make no guarantees about the quality of this image. It should be good enough to complete this tutorial, though.

```

```## Basic Setup

Let's get started. Begin by creating the React Native app.

```
react-native init echotest
cd echotest
```

Let's pull in a couple dependencies. First we'll install a nice React Native Web RTC library that works on Android and iOS. Next we'll pull in my own Janus API.

`npm install --save react-native-webrtc @ndarilek/janus`

Because we've installed the `react-native-webrtc` native module, we need to link it into our project. Linking integrates native dependencies into the build systems for each platform, adds code to load native modules, and probably performs other tasks of which I'm not aware.

`react-native link`

You'll also need to follow a few additional installation instructions for [Android](https://github.com/oney/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md) or [iOS](https://github.com/oney/react-native-webrtc/blob/master/Documentation/iOSInstallation.md). Some of these steps were already performed via `react-native link`, but others (modifying the Android manifest, for instance) were not.

## Simplify Initial Code

Since none of this code is platform-specific, let's modify the current code such that `index.android.js` and `index.ios.js` load the default component from `ui.js`. Place the following in `ui.js`:

```
import React, { Component } from "react"
import {
  StyleSheet,
  Text,
  View
} from "react-native"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default class extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.android.js
        </Text>
        <Text style={styles.instructions}>
          Double tap R on your keyboard to reload,{'\n'}
          Shake or press menu button for dev menu
        </Text>
      </View>
    );
  }
}
```

And the following in both `index.android.js` and `index.ios.js`:

```
import {AppRegistry} from "react-native"

import UI from "./ui"

AppRegistry.registerComponent('echotest', () => UI)
```

Start the React Native server in a console with:

`react-native start`

And run the app on Android with:

`react-native run-android`

Note that, for simplicity's sake, I'm not doing a number of things you'd likely want in production code. Notably:

 * I'm using component state rather than props.
 * I'm not using Redux, or any fancy state manager/mutator.
 * Components aren't split into containers or UI components.

My intent is to teach building an echo test component, not how to use Redux. The goal is for you to take this knowledge and integrate it into your own set of preferred libraries. As such, all future modifications will be made in `ui.js` as we transition from React Native's initial code to a working audio and video echo test.

## Build the UI

Let's replace the UI with your standard video chat layout. We'll have one display for local video, and another for remote participants. Replace the contents of `ui.js` with the following:

```
import React, { Component } from "react"
import {
  StyleSheet,
  View
} from "react-native"
import {
  MediaStreamTrack,
  RTCIceCandidate,
  RTCMediaStream,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
  getUserMedia
} from "react-native-webrtc"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  localVideo: {
    flex: 0.5
  },
  remoteVideo: {
    flex: 0.5
  }
});

export default class extends Component {

  constructor(props) {
    super(props)
    this.state = {
      localStream: null,
      remoteStream: null
    }
  }

  render() {
    return  <View style={styles.container}>
      <RTCView style={styles.remoteVideo} streamURL={this.state.remoteStreamURL}/>
      <RTCView style={styles.localVideo} streamURL={this.state.localStreamURL}/>
    </View>
  }

}
```

Reload the app. Note that you may wish to enable live reloading so changes appear as you make them.

We now have two video displays. Let's begin integrating Web RTC. As with most React components, we'll add this logic in `componentDidMount()` to ensure that it runs after all UI elements are rendered. Add this code to the `UI` class:

```

```

Much of that code is standard Web RTC, and won't be rehashed here. However, I'll focus on this bit:

```
```

This code iterates through available cameras and selects one based on specific criteria. Here I'm selecting the first video source I find, but you can tweak this code to choose a front/back-facing camera based on the UI state. I may demonstrate that in future tutorials.

## A Brief Janus Detour

This is not meant to be a Janus tutorial, though its [API documentation](https://janus.conf.meetecho.com/docs/rest.html) is helpful in that regard. I'll include a brief Janus primer before diving into building out the echo test.

All Janus actions happen in the context of a session. Sessions are associated with all the resources connected to a Janus audio, video, or data connection. If a session is explicitly destroyed via the API, or implicitly destroyed by connection loss/not polling often enough, all call resources are garbage-collected and the connection terminates.

Sessions are attached to plugins, Janus components that manage connections with logic specific to a given task. You first attach to a given plugin within the context of a session. Attaching to a plugin obtains a handle, with which you exchange messages to invoke actions on the plugin. Some of these plugins are documented, but often you must traul through Janus' code to determine what messages a given plugin sends or accepts.

In this example, we'll be creating a Janus session. When the session is connected, we'll then attach to the echotest plugin. The app will then transmit audio and video to the Janus server until one or the other is killed. Since this tutorial has gone long already, I'll add additional polish in future installments.

## Creating the Session

We'll begin our Janus integration by creating the session once we've initialized Web RTC. Because session creation is asynchronous, we'll add an event handler on the `connected` event, which is fired when the session begins polling and Janus is ready to attach plugins. Add the following code in `componentDidMount()` at the end of the `getUserMediaSuccess` function:

```
```

Note that here we assume Janus is listening on http://localhost:8088. While this is fine for code running on your local system, you're likely running the app in an emulator or on a device. As such, we'll need to redirect port 8088 on the device to port 8088 on your local system. For Android, accomplish this with the following command:

`adb reverse tcp:8088 tcp:8088`

Obviously, production code should point at a remote server. A handy trick is to check whether the `__DEV__` variable is set. If it is, your app is running in developer mode and should initially attempt a connection to localhost. You might also attempt a connection to localhost and, if that fails, connect to a remote Janus instance. This lets you run the same code against both local and remote instances without the need for separate builds.

If you reload this code and watch your Janus logs, you should see that a session is created. If you don't, ensure that Janus is reachable on port 8088 of your device.

## Attaching to the Plugin


