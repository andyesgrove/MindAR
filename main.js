import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Set this to your Cloudflare Worker URL
const WORKER_URL = 'https://liverpool-fixtures.YOUR-USERNAME.workers.dev';
const TEST_MODE = true; // Set to false for live data

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
    loader.load(
      './assets/models/musicband-raccoon/scene.gltf', 
      (gltf) => {
        const raccoon = gltf.scene;
        raccoon.scale.set(0.1, 0.1, 0.1);
        raccoon.position.set(0, -0.4, 0);
        anchor.group.add(raccoon);
      }
    );
    
    // Fetch Liverpool's next fixture
    const getNextFixture = async () => {
      try {
        const url = TEST_MODE ? `${WORKER_URL}?test=true` : WORKER_URL;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Fixture data:', data);
        
        if (data.success) {
          const { homeTeam, awayTeam, date } = data.fixture;
          const matchDate = new Date(date).toLocaleDateString();
          
          return `${homeTeam} vs ${awayTeam}\n${matchDate}`;
        }
        return 'No fixtures found';
      } catch (error) {
        console.error('Error fetching fixture:', error);
        return 'Liverpool FC';
      }
    };
    
    // Get fixture text and create 3D text
    const fixtureText = await getNextFixture();
    
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font) => {
        const textGeometry = new TextGeometry(fixtureText, {
          font: font,
          size: 0.08,
          height: 0.02,
        });
        textGeometry.center();
        
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xC8102E }); // Liverpool red
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 0.3, 0);
        
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