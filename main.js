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
    
    // create AR plane (optional - remove if you only want the model)
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.5});
    const plane = new THREE.Mesh(geometry, material);
    anchor.group.add(plane);
    
    // load and add raccoon model
    const loader = new GLTFLoader();
    loader.load('./assets/models/musicband-raccoon/scene.gltf', (gltf) => {
      const raccoon = gltf.scene;
      raccoon.scale.set(0.1, 0.1, 0.1);
      raccoon.position.set(0, -0.4, 0);
      anchor.group.add(raccoon);
    });
    
    // start AR
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});