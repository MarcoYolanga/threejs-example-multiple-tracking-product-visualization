/* eslint-disable import/newline-after-import */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import AsyncGLTFLoader from '../util/asyncGLTF';

/*
import lensModel from '../../assets/lensgltf.glb';
import controllerModel from '../../assets/controller.glb';
import anchorModel from '../../assets/anchor.glb';
import phoneModel from '../../assets/phone.glb';
*/
import meshPlasticTransparentMaterial from '../materials/meshPlasticTransparent';
import meshPlasticTransparentMaterialFace from '../materials/meshPlasticTransparentFace';

// import headsetModel from '../../assets/Queen_Futur_Animation_Low.glb';
const headsetModel = 'https://morettialberto.it/test-viewer-widget/viewer/product-model/Queen_Futur_Animation_Low.glb';
const modelScale = 0.6;
const modelY = -0.5;

/*
import headsetModel from '../../assets/SM_Kappa_Futur_Animation.glb';
const modelScale = 0.6;
const modelY = -0.6;
*/
/*
 import headsetModel from '../../assets/Flamingo.glb';
const modelScale = 0.01;
const modelY = 0;
*/

class Models {
  public instantTrackingHeadset!: THREE.Object3D;

  public instantTrackingHeadsetMixer!: THREE.AnimationMixer;

  public instantTrackingHeadsetAnimations!: Array<any>;

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
      _instantTrackingModel,
    ] = await AsyncGLTFLoader.loadAll(
      [headsetModel],
      this.loadingManager,
    );
    console.log(`Animated model: ${_instantTrackingModel.animations.length} `, _instantTrackingModel);

    this.instantTrackingHeadset = _instantTrackingModel.scene;
    this.instantTrackingHeadsetMixer = new THREE.AnimationMixer(this.instantTrackingHeadset);
    this.instantTrackingHeadsetAnimations = _instantTrackingModel.animations;

    this.setupVisibility();
    this.setupTransforms();
    // this.setupMaterials();
    // this.setupShadows();
  }

  public setupTransforms() {
    // Set up transforms for our models our instant tracking scene

    this.instantTrackingHeadset.position.set(0, modelY, 0);
    this.instantTrackingHeadset.scale.set(modelScale, modelScale, modelScale);
    this.instantTrackingHeadset.rotation.set(0, 0, 0);
    /*
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
        */
  }

  private setupVisibility() {
    // Set up visibility for our models our instant tracking scene
    this.instantTrackingHeadset.visible = true;
  }

  private setupMaterials() {
    // Add the plasticy material to the relevant meshes
    ((this.instantTrackingHeadset.getObjectByName('plastictransparent2') as THREE.Mesh).material) = meshPlasticTransparentMaterial;
  }

  private setupShadows() {
    this.instantTrackingHeadset.traverse((node: any) => {
      if (node.isMesh) node.castShadow = true;
    });
  }
}

export default Models;
