import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    const mindarThree = new MindARThree({
      container: document.body,
      imageTargetSrc: './assets/targets/targets.mind',
    });
    const {renderer, scene, camera} = mindarThree;
    
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    const anchor = mindarThree.addAnchor(0);
    
    // Load raccoon
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
    
    // Add 3D text above the model
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font) => {
        const textGeometry = new TextGeometry('Hello AR!', {
          font: font,
          size: 0.1,
          height: 0.02,
        });
        textGeometry.center(); // Center the text
        
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 0.3, 0); // Position above raccoon
        
        anchor.group.add(textMesh);
      }
    );
    
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});