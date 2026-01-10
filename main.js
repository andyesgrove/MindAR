// Move imports to the TOP of the file (outside any functions)

//import * as THREE from 'three';
const THREE = window.MINDAR.IMAGE.THREE;
import {loadGLTF} from "./libs/three.js-r132/examples/jsm/loadersloader.js";
//import {mockWithVideo} from '../../libs/camera-mock';
//import { MindARThree } from 'mindar-image-three';

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    // initialize MindAR 
    const mindarThree = new MindARThree({
      container: document.body,
      imageTargetSrc: './assets/targets/targets.mind', // Fixed path
    });
    const {renderer, scene, camera} = mindarThree;
    
    // create light
    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);

    // create AR object
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.5});
    const plane = new THREE.Mesh(geometry, material);
    
    // create anchor
    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(plane);

    const raccoon = await loadGLTF('./assets/models/musicband-raccoon/scene.gltf');
    raccoon.scene.scale.set(0.1, 0.1, 0.1);
    raccoon.scene.position.set(0, -0.4, 0);

    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(raccoon.scene);
    
    // start AR
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});