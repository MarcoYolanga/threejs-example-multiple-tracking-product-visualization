/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import AsyncGLTFLoader from '../util/asyncGLTF';

// import headsetModel from '../../assets/headset.glb';
import headsetModel from '../../assets/Queen_Futur_Animation_Low.glb';

import lensModel from '../../assets/lensgltf.glb';
import controllerModel from '../../assets/controller.glb';
import anchorModel from '../../assets/anchor.glb';
import phoneModel from '../../assets/phone.glb';
import meshPlasticTransparentMaterial from '../materials/meshPlasticTransparent';
import meshPlasticTransparentMaterialFace from '../materials/meshPlasticTransparentFace';

class Models {
  public instantTrackingHeadset!: THREE.Object3D;

  public instantTrackingHeadsetMixer!: THREE.AnimationMixer;

  public instantTrackingHeadsetAnimations!: Array<any>;

  public adaptor!: THREE.Object3D;

  public controller!: THREE.Object3D;

  public anchor!: THREE.Object3D;

  public faceTrackingHeadset!: THREE.Object3D;

  public phone!: THREE.Object3D;

  public floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight),
    new THREE.ShadowMaterial({ opacity: 0.25 }),
  );

  public faceMask = new ZapparThree.HeadMaskMeshLoader(this.loadingManager).load();

  constructor(private loadingManager: THREE.LoadingManager) {
    this.floor.receiveShadow = true;
    this.floor.rotation.x = -Math.PI / 2;
  }

  public async load() {
    const [
      _instantTrackingModel, _adaptor, _controller, _anchor, _faceTrackingHeadset, _phone,
    ] = await AsyncGLTFLoader.loadAll(
      [headsetModel, lensModel, controllerModel, anchorModel, headsetModel, phoneModel],
      this.loadingManager,
    );
    console.log(`Animated model: ${_instantTrackingModel.animations.length} `, _instantTrackingModel);

    this.instantTrackingHeadset = _instantTrackingModel.scene;
    this.instantTrackingHeadsetMixer = new THREE.AnimationMixer(this.instantTrackingHeadset);
    this.instantTrackingHeadsetAnimations = _instantTrackingModel.animations;

    this.adaptor = _adaptor.scene;
    this.controller = _controller.scene;
    this.anchor = _anchor.scene;
    this.faceTrackingHeadset = _faceTrackingHeadset.scene;
    this.phone = _phone.scene;

    this.setupVisibility();
    this.setupTransforms();
    // this.setupMaterials();
    this.setupShadows();
  }

  private setupTransforms() {
    // Set up transforms for our models our instant tracking scene
    this.instantTrackingHeadset.position.set(0.3, 0.5, 0);
    this.instantTrackingHeadset.scale.set(5, 5, 5);
    this.instantTrackingHeadset.rotation.set(0.2, 4, 0);

    this.adaptor.position.set(10, 0.2, 0);
    this.adaptor.scale.set(20, 20, 20);
    this.adaptor.rotation.set(-62.5, 109.1, 0.56);

    this.controller.position.set(-0.25, 0.5, 0);
    this.controller.scale.set(3.5, 3.5, 3.5);
    this.controller.rotation.set(111.73, 214, 16.3);

    this.anchor.position.set(10, 0.35, 0);
    this.anchor.scale.set(5, 5, 5);
    this.anchor.rotation.set(63.9, -20, 101.07);

    // Set up transforms for our models our face tracking scene
    this.faceTrackingHeadset.position.set(0, 0.3, 1);
    this.faceTrackingHeadset.rotation.set(-0.04, 3.1, 0);
    this.faceTrackingHeadset.scale.set(8, 8, 6);

    this.phone.position.set(0, 0.25, 0.9);
    this.phone.scale.set(7.5, 7.5, 7.5);
    this.phone.rotation.set(3, 0.04, 3.14);
  }

  private setupVisibility() {
    // Set up visibility for our models our instant tracking scene
    this.instantTrackingHeadset.visible = true;
    this.adaptor.visible = false;
    this.controller.visible = false;
    this.anchor.visible = false;
    // Set up visibility for our models our face tracking scene
    this.faceTrackingHeadset.visible = false;
    this.phone.visible = false;
  }

  private setupMaterials() {
    // Add the plasticy material to the relevant meshes
    ((this.instantTrackingHeadset.getObjectByName('plastictransparent2') as THREE.Mesh).material) = meshPlasticTransparentMaterial;
    ((this.faceTrackingHeadset.getObjectByName('plastictransparent2') as THREE.Mesh).material) = meshPlasticTransparentMaterialFace;
    ((this.adaptor.getObjectByName('polySurface128') as THREE.Mesh).material) = meshPlasticTransparentMaterial;
  }

  private setupShadows() {
    this.instantTrackingHeadset.traverse((node: any) => {
      if (node.isMesh) node.castShadow = true;
    });

    this.adaptor.traverse((node: any) => {
      if (node.isMesh) node.castShadow = true;
    });

    this.controller.traverse((node: any) => {
      if (node.isMesh) node.castShadow = true;
    });

    this.anchor.traverse((node: any) => {
      if (node.isMesh) node.castShadow = true;
    });
  }
}

export default Models;
