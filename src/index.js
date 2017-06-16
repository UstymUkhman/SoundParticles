import Detector from 'three/examples/js/Detector';
import Stats from 'three/examples/js/libs/stats.min';
// import { TweenLite } from 'gsap';

const analyser = require('web-audio-analyser');
const MAX_DECIBELS = 255;

//                             i   Hz        i      Hz          i       Hz
// Theorical Frequency Range: (0 ~ 20) --> (800 ~ 20.000) --> (1024 ~ 25.600)

export default class AudioReactive {

  constructor() {
    this._startTime = null;
    this._pauseTime = null;

    this._isPlaying = false;
    this._destroyed = false;

    this._soundSource = null;

    this._name = 'AudioReactive';
    this._audio = 'John Newman - Love Me Again';
  }

  init(element) {
    if (!Detector.webgl) {
      return false;
    }

    this._element = element;
    this._context = this._element.getContext('2d');

    return true;
  }

  startExperience(study = false) {
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContext = new AudioContext();
    let audioContextAnalyser = audioContext.createAnalyser();

    this._frequencyRange = audioContextAnalyser.frequencyBinCount;

    this._getMaxAudioPower();
    this._experienceStarted = true;

    if (study) {
      this._getAudioValues();
    } else {
      this._loadAudioTrack();
    }
  }

  _getAudioValues() {
    this._maxFrequency = 0;
    this._minFrequency = Infinity;

    this._studingAudio = true;
    this._loadAudioTrack(true);
  }

  _loadAudioTrack(study = false) {
    let onAudioEnded = study ? this._setAudioValues.bind(this) : this._onAudioTrackEnded.bind(this);

    if (this._soundSource === null) {
      this._soundSource = document.createElement('audio');
    }

    this._soundSource.autoplay = false;
    this._soundSource.src = 'assets/' + this._audio + '.mp3';
    this._soundSource.addEventListener('ended', onAudioEnded);

    this._soundSource.addEventListener('canplay', () => {
      this._soundSource.loaded = true;
      this._soundSource.volume = 1.0;

      if (!study) {
        this.MAX_POWER = 7.655;
        this.SONG_MIN_POWER = 510.5 / this.MAX_POWER;
        this.SONG_MAX_POWER = 621.5 / this.MAX_POWER;
        this.SONG_RANGE = this.SONG_MAX_POWER - this.SONG_MIN_POWER;

        this._playAudioTrack();
      } else {
        this._soundSource.analyser = analyser(this._soundSource);
        this._soundSource.play();

        requestAnimationFrame(this._studyAudio.bind(this));
      }
    });
  }

  _studyAudio() {
    if (!this._studingAudio) {
      return;
    }

    let frequency = this._getAnalyserFrequencies();

    if (this._maxFrequency < frequency) {
      this._maxFrequency = frequency;
    }

    if (this._minFrequency > frequency) {
      this._minFrequency = frequency;
    }

    requestAnimationFrame(this._studyAudio.bind(this));
  }

  _playAudioTrack() {
    this._startTime = Date.now();
    this._soundSource.analyser = analyser(this._soundSource);

    this._soundSource.play();
    this._isPlaying = true;

    requestAnimationFrame(this._render.bind(this));
  }

  _onAudioTrackEnded() {

  }

  _getAnalysedValue() {
    return this._getAnalyserFrequencies() / this.MAX_POWER;
  }

  _getAnalyserFrequencies() {
    let freq = this._soundSource.analyser.frequencies();
    let sum = 0;

    for (let i = 0; i < freq.length; i++) {
      sum += freq[i] + i;
    }

    sum = sum / freq.length - 1;
    return sum;
  }

  _drawAudioAnalysis(value) {
    value -= this.SONG_MIN_POWER;
    value = value * 100 / this.SONG_RANGE;
    this._context.clearRect(0, 0, this._width, this._height);

    let h = this._height / 100 * value;
    let x = this._width / 2 - 50;
    let y = this._height - h;

    this._context.fillStyle = '#FFFFFF';
    this._context.fillRect(x, y, 100, h);
  }

  _render() {
    if (this._destroyed) {
      return;
    }

    this._drawAudioAnalysis(this._getAnalysedValue());
    requestAnimationFrame(this._render.bind(this));

    // let frequency = 0;
    // let bassFreq = 0;
    // let vocalsFreq = 0;

    // if (this._isPlaying) {
      // frequency = this._getAnalysedValue();
      // bassFreq = this._getAverageValue(this._soundSources.bass);
      // vocalsFreq = this._getAverageValue(this._soundSources.vocals);
    // }
  }

  _getMaxAudioPower() {
    let max = 0;

    for (let i = 0; i < this._frequencyRange; i++) {
      max += MAX_DECIBELS + i;
    }

    this.MAX_POWER = (max / this._frequencyRange - 1) / 100;
    console.log(`Max audio power = ${this.MAX_POWER}`);
  }

  _setAudioValues() {
    this.SONG_MIN_POWER = this._minFrequency / this.MAX_POWER;
    this.SONG_MAX_POWER = this._maxFrequency / this.MAX_POWER;
    this.SONG_RANGE = this.SONG_MAX_POWER - this.SONG_MIN_POWER;

    console.log(`Song min frequency = ${this._minFrequency}`);
    console.log(`Song max frequency = ${this._maxFrequency}`);
    console.log(`Song frequency range = ${this.SONG_RANGE}`);

    this._studingAudio = false;
    this._loadAudioTrack();
  }

  showStats() {
    if (!this.stats) {
      this.stats = new Stats();
    }

    document.body.appendChild(this.stats.dom);
  }

  hideStats() {
    this.stats.dom.parentNode.removeChild(this.stats.dom);
  }

  resize(width, height) {
    this._width = width;
    this._height = height;

    this._element.width = this._width;
    this._element.height = this._height;
  }

  destroy() {
    this._destroyed = true;
  }
}
