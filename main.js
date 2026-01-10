import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const WORKER_URL = 'https://liverpool-fixtures.andyesgrove.workers.dev';
const UPDATE_INTERVAL = 60000; // Check for updates every 60 seconds (1 minute)

let currentTextMesh = null;
let anchor = null;

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    const mindarThree = new MindARThree({
      container: document.body,
      imageTargetSrc: './assets/targets/targets.mind',
    });
    const {renderer, scene, camera} = mindarThree;
    
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    anchor = mindarThree.addAnchor(0);
    
    // Load raccoon
    const loader = new GLTFLoader();
    loader.load(
      './assets/models/musicband-raccoon/scene.gltf', 
      (gltf) => {
        const raccoon = gltf.scene;
        raccoon.scale.set(0.05, 0.05, 0.05);
        raccoon.position.set(0, -0.4, 0);
        anchor.group.add(raccoon);
      }
    );
    
    // Fetch and update fixture text
    const updateFixtureText = async () => {
      try {
        const response = await fetch(WORKER_URL);
        const data = await response.json();
        
        console.log('Fixture data updated:', data);
        
        if (data.success) {
          const { homeTeam, awayTeam, date } = data.fixture;
          const matchDate = new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
          });
          
          const fixtureText = `${homeTeam} vs\n${awayTeam}\n${matchDate}`;
          
          // Remove old text if it exists
          if (currentTextMesh) {
            anchor.group.remove(currentTextMesh);
            currentTextMesh.geometry.dispose();
            currentTextMesh.material.dispose();
          }
          
          // Create new text
          const fontLoader = new FontLoader();
          fontLoader.load(
            'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
              const textGeometry = new TextGeometry(fixtureText, {
                font: font,
                size: 0.06,
                height: 0.02,
              });
              textGeometry.center();
              
              const textMaterial = new THREE.MeshBasicMaterial({ color: 0x0066cc });
              currentTextMesh = new THREE.Mesh(textGeometry, textMaterial);
              currentTextMesh.position.set(0, 0.3, 0);
              
              anchor.group.add(currentTextMesh);
            }
          );
        }
      } catch (error) {
        console.error('Error updating fixture:', error);
      }
    };
    
    // Initial load
    await updateFixtureText();
    
    // Auto-update every minute
    setInterval(updateFixtureText, UPDATE_INTERVAL);
    
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});