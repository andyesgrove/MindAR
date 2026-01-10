// Move imports to the TOP of the file (outside any functions)
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    // initialize MindAR 
    const mindarThree = new MindARThree({
      container: document.body,
      imageTargetSrc: './assets/targets/targets.mind',
    });
    const {renderer, scene, camera} = mindarThree;
    
    // create light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    // create anchor
    const anchor = mindarThree.addAnchor(0);
    
    // load and add raccoon model - WITH DEBUG LOGS
    const loader = new GLTFLoader();
    console.log('Loading raccoon model...');
    loader.load(
      './assets/models/musicband-raccoon/scene.gltf', 
      (gltf) => {
        console.log('Raccoon loaded successfully!', gltf);
        const raccoon = gltf.scene;
        raccoon.scale.set(0.1, 0.1, 0.1);
        raccoon.position.set(0, -0.4, 0);
        anchor.group.add(raccoon);
      },
      (progress) => {
        console.log('Loading progress:', progress);
      },
      (error) => {
        console.error('Error loading raccoon:', error);
      }
    );
    
    // start AR
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});