import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

// Load a 3D model to place within our group (using ThreeJS's GLTF loader)
// Pass our loading manager in to ensure the progress bar works correctly
class AsyncGLTFLoader {
  private static gltfLoaderSingleton: GLTFLoader;

  static load(path: string, manger: THREE.LoadingManager): Promise<THREE.Scene> {
    if (!AsyncGLTFLoader.gltfLoaderSingleton) {
      AsyncGLTFLoader.gltfLoaderSingleton = new GLTFLoader(manger);
      /*
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/assets/draco/');
        AsyncGLTFLoader.gltfLoaderSingleton.setDRACOLoader(dracoLoader);
        */
    }

    return new Promise((resolve, reject) => {
      AsyncGLTFLoader.gltfLoaderSingleton.load(
        path,
        (gltf) => {
          // make animation controller

          resolve(<any>gltf);
        },
        undefined,
        () => reject(new Error('Failed Loading model')),
      );
    });
  }

  static loadAll(
    models: string[], loadingManager: THREE.LoadingManager,
  ): Promise<any[]> {
    return Promise.all(models.map((model) => AsyncGLTFLoader.load(model, loadingManager)));
  }
}

export default AsyncGLTFLoader;
