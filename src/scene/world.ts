/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import * as ZapparVideoRecorder from '@zappar/video-recorder';
import { saveAs } from 'file-saver';
import ZapparSharing from '@zappar/sharing';
import getLights from './lights';
import Models from './models';
import DocumentManager from '../dom/elements';

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
          ZapparSharing({
            data: dataUrl,
          });
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

    this.setAnimation(0);
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
    } else {
      console.error(`No animation ${index}`);
    }
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
    ZapparSharing({
      data: url,
    });
  }

  public recorder: ZapparVideoRecorder.VideoRecorder | null = null

  public isRecording: boolean = false

  public takeVideo():boolean {
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
}

export default World;
