/* eslint-disable import/no-cycle */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import * as ZapparVideoRecorder from '@zappar/video-recorder';
// import { saveAs } from 'file-saver';
import ZapparSharing from '@zappar/sharing';
import getLights from './lights';
import Models from './models';
import DocumentManager from '../dom/elements';

function getQueryVariable(variable: string): any {
  const query = window.location.search.substring(1);
  const vars = query.split('&');
  for (let i = 0; i < vars.length; i += 1) {
    const pair = vars[i].split('=');
    if (pair[0] === variable) { return pair[1]; }
  }
  return (false);
}

class World {
  public scene: THREE.Scene = new THREE.Scene();

  public camera: ZapparThree.Camera = new ZapparThree.Camera();

  private environmentMap = new ZapparThree.CameraEnvironmentMap();

  public models!: Models;

  public onLoaded = (callback: () => void) => callback();

  public mixers: Array<THREE.AnimationMixer> = [];

  public clock: THREE.Clock = new THREE.Clock(true);

  public animate(self: World) {
    requestAnimationFrame(() => {
      self.animate(self);
    });

    const delta = self.clock.getDelta();

    for (const mixer of self.mixers) {
      mixer.update(delta);
    }

    self.renderer.render(self.scene, self.camera);
  }

  // ZapparThree provides a LoadingManager that shows a progress bar while
  // the assets are downloaded. You can use this if it's helpful, or use
  // your own loading UI - it's up to you :-)
  private loadingManager = new ZapparThree.LoadingManager();

  public trackers = {
    instant: new ZapparThree.InstantWorldTracker(),
    face: new ZapparThree.FaceTrackerLoader(this.loadingManager).load(),
  }

  public trackerGroups = {
    // Create an InstantWorldTracker and wrap it in an InstantWorldAnchorGroup for us
    // to put our ThreeJS content into
    instant: new ZapparThree.InstantWorldAnchorGroup(this.camera, this.trackers.instant),
    face: new ZapparThree.FaceAnchorGroup(this.camera, this.trackers.face),
  }

  public renderer: THREE.WebGLRenderer;

  constructor(public _renderer: THREE.WebGLRenderer) {
    // Store a reference to the renderer.
    this.renderer = _renderer;

    const self = this;

    ZapparVideoRecorder.createCanvasVideoRecorder(this.renderer.domElement, {
      // Options
    }).then((recorder) => {
      // Use recorder to control recording

      // console.log(recorder);
      recorder.onComplete.bind((result) => {
        // Use result to access the final video file
        // saveAs(result.blob, 'ciao.mp4');
        result.asDataURL().then((dataUrl) => {
          self.customZapparSharing(dataUrl);
        });
      });
      self.recorder = recorder;
      /*
        setTimeout(() => {
          recorder.start();
          setTimeout(() => {
            recorder.stop();
          }, 5000);
        }, 5000);
        */
    });
  }

  public async load() {
    this.models = new Models(this.loadingManager);
    this.setupRenderer();
    this.setupCamera();
    this.enableEnvironmentMap();
    this.setupLights();
    this.setupFaceTracker();
    await this.setupModels();

    // Add our instant tracker group into the ThreeJS scene
    this.scene.add(this.trackerGroups.face, this.trackerGroups.instant);

    this.setupAnimationSelector();
  }

  private setupRenderer() {
    document.body.appendChild(this.renderer.domElement);

    // As with a normal ThreeJS scene, resize the canvas if the window resizes
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', () => this.onResize());
  }

  private async setupModels() {
    // Floor plane to receive shadows
    // Add it to the instrant_tracker_group.
    this.trackerGroups.instant.add(this.models.floor);
    // Load a 3D model to place within our group (using ThreeJS's GLTF loader)
    // Pass our loading manager in to ensure the progress bar works correctly
    await this.models.load();
    const {
      instantTrackingHeadset,
    } = this.models;
    this.trackerGroups.instant.add(instantTrackingHeadset);

    this.mixers.push(this.models.instantTrackingHeadsetMixer);

    let wantedAnim = parseInt(getQueryVariable('anim'), 10);
    if (Number.isNaN(wantedAnim)) {
      wantedAnim = 0;
    }
    if (!this.setAnimation(wantedAnim)) {
      if (wantedAnim !== 0) {
        console.log('Fallback to animation 0');
        this.setAnimation(0);
      }
    }
    this.animate(this);
  }

  public getAnimations() {
    return this.models.instantTrackingHeadsetAnimations;
  }

  public currentAnimation: number = 0

  public setAnimation(index: number) {
    const animations = this.getAnimations();
    if (typeof animations[index] !== 'undefined') {
      this.models.instantTrackingHeadsetMixer.stopAllAction();
      this.models.instantTrackingHeadsetMixer.clipAction(animations[index]).play();
      this.currentAnimation = index;
      return true;
    }

    console.error(`No animation ${index}`);
    return false;
  }

  public setupAnimationSelector() {
    const selected = this.currentAnimation;
    const animations = this.getAnimations();
    DocumentManager.changeAnimationUI.innerHTML = animations.map((animation, i) => {
      const sel: string = selected === i ? 'selected' : '';
      return `<option ${sel} value="${i}">${animation.name}</option>`;
    }).join('\n');
    const showSelector = animations.length > 0;
    DocumentManager.changeAnimationUI.classList.toggle('hidden', !showSelector);
    DocumentManager.changeAnimationUI.classList.toggle('visible', showSelector);
  }

  private onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public takeSnapshot() {
    // Play the camera sound, if it's already playing,
    // reset so that it will play whenever we click on it

    // Get canvas from dom
    const canvas = document.querySelector('canvas');

    // Convert canvas data to url
    const url = canvas!.toDataURL('image/jpeg', 0.8);

    // Take snapshot
    this.customZapparSharing(url);
  }

  public recorder: ZapparVideoRecorder.VideoRecorder | null = null

  public isRecording: boolean = false

  public takeVideo(): boolean {
    if (this.isRecording) {
      this.recorder?.stop();
      console.log('Finished recording');
    } else {
      this.recorder?.start();
      console.log('Started recording');
    }
    this.isRecording = !this.isRecording;
    return this.isRecording;
  }

  public enableEnvironmentMap(enable: boolean = true) {
    // Set up the real time environment map
    if (enable) {
      this.scene.environment = this.environmentMap.environmentMap;
    } else {
      this.scene.environment = null;
    }
  }

  private setupFaceTracker() {
    // We want the user's face to appear in the center of the helmet
    // so use ZapparThree.HeadMaskMesh to mask out the back of the helmet.
    // In addition to constructing here we'll call mask.updateFromFaceAnchorGroup(...)
    // in the frame loop later.
    this.trackerGroups.face.add(this.models.faceMask);

    // Disable on load
    this.trackers.face.enabled = false;

    this.trackers.face.onVisible.bind(() => {
      this.trackerGroups.face.visible = true;
    });

    this.trackers.face.onNotVisible.bind(() => { this.trackerGroups.face.visible = false; });
  }

  private setupCamera() {
    // Set the background of our scene to be the camera background texture
    // that's provided by the Zappar camera
    this.scene.background = this.camera.backgroundTexture;
    this.camera.backgroundTexture.encoding = THREE.sRGBEncoding;
    this.camera.poseMode = ZapparThree.CameraPoseMode.AnchorOrigin;
  }

  private setupLights() {
    // Get Lights and add to scene
    const lights = getLights();
    this.scene.add(lights);
  }

  update() {
    this.camera.updateFrame(this.renderer);

    // Update the head mask so it fits the user's head in this frame
    this.models.faceMask.updateFromFaceAnchorGroup(this.trackerGroups.face);
    // Update Zappar environment map
    this.environmentMap.update(this.renderer, this.camera);
  }

  public customZapparSharing(dataUrl: string) {
    // https://docs.zap.works/universal-ar/useful-packages/webgl-sharing/
    ZapparSharing({
      data: dataUrl,
      fileNamePrepend: 'Zappar', // The name of  the file.
      shareTitle: document.title, // The title for the social share.
      shareText: document.title, // The body text for the social share.
      shareUrl: 'https://kappafuturfestival.it/augmented_reality/', // The url for the social share.
      hideShareButton: false, // Hide the share button.
    });
    console.log('ZapparSharing opened, waiting');
    // posso iniziare a personalizzare solo quando zapworks ha finito di creare l'elemento
    const customize = () => {
      // personalizzo l'ui del zappar-sharing

      const container = document.getElementById('ZapparSnapshotContainer')!;
      try {
        // pulsanti
        const saveButton: HTMLElement = document.getElementById('zapparSaveButton')!;
        saveButton.getElementsByTagName('svg')[0].outerHTML = '<img src="./assets/UI/button-save.png">';
        let label = document.createElement('DIV');
        saveButton.appendChild(label);
        label.outerHTML = '<label class="share-button-label" for="zapparSaveButton">Download</label>';
        const shareButton: HTMLElement = document.getElementById('zapparShareButton')!;
        shareButton.getElementsByTagName('svg')[0].outerHTML = '<img src="./assets/UI/button-share.png">';

        label = document.createElement('DIV');
        shareButton.appendChild(label);
        label.outerHTML = '<label class="share-button-label" for="zapparShareButton">Share</label>';
        const closeButton: HTMLElement = document.getElementById('zapparCloseAref')!;
        closeButton.getElementsByTagName('svg')[0].outerHTML = '<img src="./assets/UI/x-black.png">';

        // cornice
        const subject: any = container.querySelector('#ZapparPreviewImg, #ZapparPreviewVideo')!;
        const tripleBorder = document.createElement('DIV');
        subject.parentElement!.insertBefore(tripleBorder, subject);
        // eslint-disable-next-line max-len
        tripleBorder.outerHTML = '<div class="inner-border sharing-frame"><div class="inner-border"><div class="inner-border"></div></div></div>';
        const innerBorder = subject.parentElement!.querySelector('.inner-border>.inner-border>.inner-border')!;
        innerBorder.appendChild(subject);
        subject.style.margin = '0';
        subject.style.width = '100%';
      } catch (error) {
        console.error('Impossibile personalizzare correttamente ZapparSharing', error);
      }

      // mostro gli elementi solo ora
      container.classList.add('ready');
    };

    let tryAnyway:any = setTimeout(() => {
      tryAnyway = null;
      customize();
      console.log('ZapparSharing customized by fallback tryAnyway');
    }, 3000); // se non riesco a vedere tutti gli elementi entro 3 sec avvia comunque la personalizzazione
    const checkIfExists = [
      '#ZapparSnapshotContainer',
      '#zapparSaveButton',
      '#zapparShareButton',
      '#zapparCloseAref',
      '#ZapparPreviewImg, #ZapparPreviewVideo',
    ];
    const observer = setInterval(() => {
      for (const selector of checkIfExists) {
        if (document.querySelector(selector) === null) {
          return;
        }
      }
      if (tryAnyway !== null) { // non ancora passati 3 sec
        clearTimeout(tryAnyway);
        customize();
        console.log('ZapparSharing customized');
      }
      clearInterval(observer);
    }, 100);
  }
}

export default World;
