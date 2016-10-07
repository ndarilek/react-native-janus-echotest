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

  componentDidMount() {
    const pc = new RTCPeerConnection({"iceServers": [{"url": "stun:stun.l.google.com:19302"}]})
    this.setState({peerConnection: pc})
    const getUserMediaSuccess = (stream) => {
      console.log("Here")
      this.setState({localStream: stream, localStreamURL: stream.toURL()})
      this.setState({localStream: stream, localStreamURL: stream.toURL()})
      pc.addStream(stream)
    }
    MediaStreamTrack.getSources((sources) => {
      const source = sources.find((s) => s.kind == "video")
      const constraints = {audio: true, video: {mandatory: [{sourceId: source.id}], optional: [{sourceId: source.id}]}}
      getUserMedia(constraints, getUserMediaSuccess, console.error)
    })
  }

  render() {
    return  <View style={styles.container}>
      <RTCView style={styles.remoteVideo} streamURL={this.state.remoteStreamURL}/>
      <RTCView style={styles.localVideo} streamURL={this.state.localStreamURL}/>
    </View>
  }

}
