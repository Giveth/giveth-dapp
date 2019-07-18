import React, { Component } from 'react';
import PropTypes from 'prop-types';
import IPFSService from '../services/IPFSService';
import config from '../configuration';
import ErrorPopup from './ErrorPopup';

const Label = ({ children }) => (
  <span className="label" style={{ marginRight: '0.5rem' }}>
    {children}
  </span>
);

Label.propTypes = {
  children: PropTypes.node.isRequired,
};

function convertVideoUrlToEmbeded(url) {
  let match =
    url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
    url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);

  if (match) {
    return `${match[1]}://www.youtube.com/embed/${match[2]}?showinfo=0`;
  }

  // eslint-disable-next-line no-cond-assign
  if ((match = url.match(/^(https?):\/\/(?:www\.)?vimeo\.com\/(\d+)/))) {
    return `${match[1]}://player.vimeo.com/video/${match[2]}/`;
  }
  return url;
}

class Content extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: null,
      url: null,
      file: null,
      blob: null,
      currentState: '',
      stream: null,
      recordVideo: null,
    };

    this.handleFile = this.handleFile.bind(this);
    this.handleCamera = this.handleCamera.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.detectExtension = this.detectExtension.bind(this);
    this.handleScreenSharing = this.handleScreenSharing.bind(this);
  }

  handleFile(e) {
    this.setState({
      file: URL.createObjectURL(e.target.files[0]),
      blob: e.target.files[0],
    });
  }

  handleCamera() {
    this.setState({ type: 'camera', currentState: '' }, () => {
      navigator.getUserMedia(
        { audio: true, video: true },
        cameraStream => {
          this.setState(
            {
              stream: new window.MultiStreamsMixer([cameraStream]),
              cameraStream,
            },
            () => {
              this.state.stream.frameInterval = 1; // eslint-disable-line react/no-direct-mutation-state
              this.state.stream.startDrawingFrames();
              window.setSrcObject(
                this.state.stream.getMixedStream(),
                document.getElementById('video'),
              );
            },
          );
        },
        () => {
          alert('No camera devices found');
        },
      );
    });
  }

  handleExit() {
    const { cameraStream, audioStream, screenStream } = this.state;
    if (cameraStream) {
      cameraStream.stop();
      cameraStream.getTracks()[0].stop();
      cameraStream.getTracks()[1].stop();
    }
    if (audioStream) {
      audioStream.stop();
      audioStream.getTracks()[0].stop();
    }
    if (screenStream) {
      screenStream.stop();
      screenStream.getTracks()[0].stop();
    }
  }

  handleUpload() {
    this.setState(
      {
        currentState: 'uploading',
      },
      () => {
        IPFSService.upload(this.state.blob)
          .then(hash => {
            this.handleExit();

            this.props.handleQuillInsert(config.ipfsGateway + hash.slice(6));
          })
          .catch(err => {
            ErrorPopup('Something went wrong with the upload.', err);
            console.log(err);
          });
      },
    );
  }

  startRecording() {
    const { stream } = this.state;
    this.setState({ currentState: 'recording' });
    window.setSrcObject(stream.getMixedStream(), document.getElementById('video'));
    this.setState(
      {
        recordVideo: window.RecordRTC(stream.getMixedStream(), {
          type: 'video',
        }),
      },
      () => this.state.recordVideo.startRecording(),
    );
  }

  stopRecording() {
    const { recordVideo } = this.state;
    recordVideo.stopRecording(() => {
      this.setState({
        file: window.URL.createObjectURL(recordVideo.getBlob()),
        blob: recordVideo.getBlob(),
        currentState: 'recording-stopped',
      });
    });
  }

  detectExtension() {
    const extensionid = 'ajhifddimkapgcifgcodmmfdlknahffk';
    const image = document.createElement('img');
    image.src = `chrome-extension://${extensionid}/icon.png`;

    image.onload = () => {
      this.handleScreenSharing();
    };
    image.onerror = () => {
      this.setState({ currentState: 'missing extension' });
    };
  }

  handleScreenSharing() {
    this.setState({ type: 'screen', currentState: '' });
    window.getScreenId((err, sourceId, screenContraints) => {
      if (err) {
        console.log(err);
      }
      navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(audioStream => {
        navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.mediaDevices.getUserMedia(screenContraints).then(screenStream => {
          screenStream.fullcanvas = false;
          screenStream.width = window.screen.width; // or 3840
          screenStream.height = window.screen.height; // or 2160
          this.setState(
            {
              stream: new window.MultiStreamsMixer([screenStream, audioStream]),
              audioStream,
              screenStream,
            },
            () => {
              this.state.stream.frameInterval = 1; // eslint-disable-line react/no-direct-mutation-state
              this.state.stream.startDrawingFrames();
              window.setSrcObject(
                this.state.stream.getMixedStream(),
                document.getElementById('video'),
              );
            },
          );
        });
      });
    });
  }

  render() {
    const { handleQuillInsert } = this.props;
    const { type, url, file, currentState } = this.state;
    return (
      <div>
        <span className="label" style={{ display: 'block', marginBottom: '1rem' }}>
          Choose type of video
        </span>
        <Label>
          <input name="type" type="radio" onClick={() => this.setState({ type: 'link' })} /> Link
        </Label>
        <Label>
          <input name="type" type="radio" onClick={() => this.setState({ type: 'file' })} /> File
        </Label>
        <Label>
          <input name="type" type="radio" onClick={() => this.handleCamera()} /> Camera
        </Label>
        <Label>
          <input name="type" type="radio" onClick={() => this.detectExtension()} /> Screen sharing
        </Label>
        <div style={{ marginTop: '1rem' }}>
          {type === 'link' && (
            <div>
              <input
                style={{ width: '100%', marginBottom: '1rem' }}
                type="text"
                placeholder="Insert video URL"
                onChange={e => this.setState({ url: e.target.value })}
              />
              <button
                type="button"
                onClick={() => handleQuillInsert(convertVideoUrlToEmbeded(url))}
              >
                Submit
              </button>
            </div>
          )}
          {type === 'file' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input type="file" accept="video/*; image/*" onChange={this.handleFile} />
            </div>
          )}
        </div>
        {currentState === 'missing extension' && (
          <div role="alert">
            <strong>You need to install this </strong>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk"
            >
              Chrome extension
            </a>{' '}
            <strong>and reload</strong>
          </div>
        )}
        {(file || type === 'camera' || type === 'screen') && (
          <div>
            <video
              style={{
                marginTop: '1rem',
                width: '100%',
                display: currentState !== 'recording-stopped' ? '' : 'none',
              }}
              controls
              muted
              autoPlay
              id="video"
            />
            {currentState === 'recording-stopped' && (
              <video style={{ marginTop: '1rem', width: '100%' }} controls autoPlay src={file} />
            )}
            {(type === 'camera' || type === 'screen') && (
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={currentState === 'recording' ? 'btn btn-danger' : 'btn btn-success'}
                  onClick={() =>
                    currentState === 'recording' ? this.stopRecording() : this.startRecording()
                  }
                >
                  {currentState === 'recording' ? 'Stop recording' : 'Start recording'}
                </button>
              </div>
            )}
            <button type="button" className="btn btn-info" onClick={this.handleUpload}>
              {currentState === 'uploading' ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
        <button
          type="button"
          style={{ marginTop: '1rem' }}
          className="btn btn-danger"
          onClick={() => {
            this.handleExit();
            React.swal.close();
          }}
        >
          Close
        </button>
      </div>
    );
  }
}

Content.propTypes = {
  handleQuillInsert: PropTypes.func.isRequired,
};

export default handleQuillInsert => {
  React.swal({
    title: 'Attach a video to Milestone',
    content: React.swal.msg(<Content handleQuillInsert={handleQuillInsert} />),
    button: {
      visible: false,
    },
    closeOnClickOutside: false,
  });
};
